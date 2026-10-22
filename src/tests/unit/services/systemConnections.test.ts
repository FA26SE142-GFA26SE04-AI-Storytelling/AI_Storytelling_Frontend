import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {authService} from '@/app/services/authService';
import {healthService} from '@/app/services/healthService';
import {subscribeNotifications} from '@/app/services/notificationRealtime';
const mock=vi.hoisted(()=>({start:vi.fn(),stop:vi.fn(),on:vi.fn(),off:vi.fn(),onclose:vi.fn(),onreconnected:vi.fn(),withUrl:vi.fn()}));
vi.mock('@microsoft/signalr',()=>({LogLevel:{None:6},HubConnectionBuilder:class {
 withUrl(...args:unknown[]){mock.withUrl(...args);return this;}
 withAutomaticReconnect(){return this;}
 configureLogging(){return this;}
 build(){return mock;}
}}));
beforeEach(()=>{vi.resetAllMocks();vi.useFakeTimers();mock.start.mockResolvedValue(undefined);mock.stop.mockResolvedValue(undefined);vi.spyOn(authService,'getStoredAccessToken').mockReturnValue('adult');});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('System endpoints outside the API prefix',()=>{
 it('reads plain-text liveness and readiness without adult credentials',async()=>{
  const fetcher=vi.fn().mockResolvedValueOnce(new Response('Healthy')).mockResolvedValueOnce(new Response('Unhealthy',{status:503}));vi.stubGlobal('fetch',fetcher);
  expect(await healthService.liveness()).toEqual({ok:true,status:200,detail:'Healthy'});
  expect(await healthService.readiness()).toEqual({ok:false,status:503,detail:'Unhealthy'});
  expect(new URL(fetcher.mock.calls[0][0]).pathname).toBe('/health');expect(new URL(fetcher.mock.calls[1][0]).pathname).toBe('/healthz');
  expect(fetcher.mock.calls[0][1].credentials).toBe('omit');expect(fetcher.mock.calls[0][1].headers).toBeUndefined();
 });
 it('retains unknown network status and the caller cancellation signal',async()=>{
  const fetcher=vi.fn().mockRejectedValue(new Error('offline'));vi.stubGlobal('fetch',fetcher);const signal=new AbortController().signal;
  expect((await healthService.readiness(signal)).status).toBe(0);expect(fetcher.mock.calls[0][1].signal).toBe(signal);
 });
});
describe('Adult notification subscription lifecycle',()=>{
 it('does not connect without an adult token',()=>{vi.mocked(authService.getStoredAccessToken).mockReturnValue(null);const stop=subscribeNotifications(vi.fn());stop();expect(mock.withUrl).not.toHaveBeenCalled();});
 it('resynchronizes REST after connect, event and reconnect and reads the latest token',async()=>{
  const update=vi.fn();const stop=subscribeNotifications(update);await Promise.resolve();expect(update).toHaveBeenCalledTimes(1);
  expect(new URL(mock.withUrl.mock.calls[0][0]).pathname).toBe('/hubs/notifications');
  vi.mocked(authService.getStoredAccessToken).mockReturnValue('rotated-adult');expect(mock.withUrl.mock.calls[0][1].accessTokenFactory()).toBe('rotated-adult');
  expect(mock.on.mock.calls[0][0]).toBe('ReceiveNotification');mock.on.mock.calls[0][1]();mock.onreconnected.mock.calls[0][0]();expect(update).toHaveBeenCalledTimes(3);
  stop();expect(mock.off).toHaveBeenCalledWith('ReceiveNotification',expect.any(Function));expect(mock.stop).toHaveBeenCalledTimes(1);
 });
 it('retries a failed initial start and cancels pending retries on logout',async()=>{
  mock.start.mockRejectedValue(new Error('offline'));const update=vi.fn();const stop=subscribeNotifications(update);await Promise.resolve();expect(vi.getTimerCount()).toBe(1);
  await vi.advanceTimersByTimeAsync(30000);expect(mock.start).toHaveBeenCalledTimes(2);expect(update).not.toHaveBeenCalled();stop();expect(vi.getTimerCount()).toBe(0);
  mock.onclose.mock.calls[0][0]();expect(vi.getTimerCount()).toBe(0);
 });
 it('ignores a late start completion after its owner unmounts',async()=>{
  let resolve!:()=>void;mock.start.mockImplementation(()=>new Promise<void>(r=>{resolve=r;}));const update=vi.fn();const stop=subscribeNotifications(update);stop();resolve();await Promise.resolve();expect(update).not.toHaveBeenCalled();
 });
});
