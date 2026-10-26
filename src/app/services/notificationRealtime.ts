import { HubConnectionBuilder,LogLevel } from '@microsoft/signalr';
import { CORE_ORIGIN } from './healthService';
import { authService } from './authService';
/** Adult-only subscription. REST remains authoritative after every event/reconnect. */
export function subscribeNotifications(onUpdate:()=>void):()=>void {
 if(!authService.getStoredAccessToken())return ()=>{};
 let disposed=false;let retry:ReturnType<typeof setTimeout>|undefined;
 const connection=new HubConnectionBuilder()
  .withUrl(`${CORE_ORIGIN}/hubs/notifications`,{accessTokenFactory:()=>authService.getStoredAccessToken()??'',withCredentials:false})
  .withAutomaticReconnect([0,2000,10000,30000])
  .configureLogging(LogLevel.None).build();
 const update=()=>{if(!disposed)onUpdate();};
 const schedule=()=>{if(!disposed&&!retry)retry=setTimeout(()=>{retry=undefined;void start();},30000);};
 const start=async()=>{if(disposed)return;try{await connection.start();update();}catch{schedule();}};
 connection.on('ReceiveNotification',update);
 connection.onreconnected(update);
 connection.onclose(schedule);
 void start();
 return ()=>{disposed=true;clearTimeout(retry);connection.off('ReceiveNotification',update);void connection.stop().catch(()=>{});};
}
