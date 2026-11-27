import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {adminCreatorService as svc,creatorAccountDisplayStatus} from '@/app/services/adminCreatorService';
import {authService} from '@/app/services/authService';
let fetcher:ReturnType<typeof vi.fn>;
beforeEach(()=>{fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,message:'OK',data:null})));vi.stubGlobal('fetch',fetcher);vi.spyOn(authService,'getStoredAccessToken').mockReturnValue('adult');});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

it.each([
 ['GET','/admin/creator-applications?status=Pending&pageIndex=2&pageSize=20',()=>svc.applications({status:'Pending',pageIndex:2,pageSize:20}),undefined],
 ['GET','/admin/creator-applications',()=>svc.applications(),undefined],
 ['GET','/admin/creator-applications/7',()=>svc.application(7),undefined],
 ['POST','/admin/creator-applications/7/approve',()=>svc.approve(7),undefined],
 ['POST','/admin/creator-applications/7/reject',()=>svc.reject(7,'Thiếu portfolio'),{reason:'Thiếu portfolio'}],
 ['GET','/admin/creators?status=Suspended&search=lan&pageIndex=1&pageSize=20',()=>svc.creators({status:'Suspended',search:'lan',pageIndex:1,pageSize:20}),undefined],
 ['GET','/admin/creators?pageIndex=1',()=>svc.creators({search:'',pageIndex:1}),undefined],
 ['GET','/admin/creators/9',()=>svc.creator(9),undefined],
 ['POST','/admin/creators/9/deactivate',()=>svc.deactivate(9,'Vi phạm'),{reason:'Vi phạm'}],
 ['POST','/admin/creators/9/reactivate',()=>svc.reactivate(9),undefined],
] as const)('%s %s calls the admin creator API',async(method,path,call,body)=>{
 await call();
 const [url,options]=fetcher.mock.calls[0];expect(url.endsWith(path)).toBe(true);expect(options.method).toBe(method);
 expect(options.body?JSON.parse(options.body):undefined).toEqual(body);
});

it.each([
 ['AwaitingApproval','Rejected','AwaitingResubmit'],
 ['AwaitingApproval','Pending','AwaitingApproval'],
 ['Active','Approved','Active'],
 ['Active',null,'Active'],
 ['Registered','Pending','Registered'],
] as const)('tài khoản %s với đơn %s hiển thị %s',(status,latestApplicationStatus,expected)=>{
 expect(creatorAccountDisplayStatus({status,latestApplicationStatus})).toBe(expected);
});
