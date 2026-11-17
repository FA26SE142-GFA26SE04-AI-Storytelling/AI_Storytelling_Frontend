import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {authService} from '@/app/services/authService';
import {creatorApplicationService} from '@/app/services/creatorApplicationService';
let fetcher:ReturnType<typeof vi.fn>;
beforeEach(()=>{fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,message:'OK',data:null})));vi.stubGlobal('fetch',fetcher);vi.spyOn(authService,'getStoredAccessToken').mockReturnValue('applicant');});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
it('registers a creator anonymously with introduction and portfolio',async()=>{
 const body={username:'mai',email:'mai@x.vn',fullName:'Mai',password:'abc12345',confirmPassword:'abc12345',introduction:'Giáo viên tiểu học mười năm',portfolioUrl:'https://mai.vn'};
 await authService.registerCreator(body);
 const [url,options]=fetcher.mock.calls[0];
 expect(url).toMatch(/\/Auth\/register-creator$/);expect(options.method).toBe('POST');
 expect(new Headers(options.headers).get('Authorization')).toBeNull();expect(JSON.parse(options.body)).toEqual(body);
});
it.each([
 ['GET','/creator-applications/me',()=>creatorApplicationService.mine(),undefined],
 ['POST','/creator-applications/me/resubmit',()=>creatorApplicationService.resubmit({introduction:'Đã bổ sung kinh nghiệm biên tập',portfolioUrl:null}),{introduction:'Đã bổ sung kinh nghiệm biên tập',portfolioUrl:null}],
] as const)('%s %s uses the applicant session',async(method,path,call,body)=>{
 await call();
 const [url,options]=fetcher.mock.calls[0];expect(url.endsWith(path)).toBe(true);expect(options.method).toBe(method);
 expect(new Headers(options.headers).get('Authorization')).toBe('Bearer applicant');
 expect(options.body?JSON.parse(options.body):undefined).toEqual(body);
});
it('keeps the backend reason when resubmitting is refused',async()=>{
 fetcher.mockResolvedValueOnce(new Response(JSON.stringify({success:false,message:'Chỉ nộp lại được khi đơn bị từ chối.',data:null}),{status:400}));
 const r=await creatorApplicationService.resubmit({introduction:'Đã bổ sung kinh nghiệm biên tập'});
 expect(r.success).toBe(false);expect(r.status).toBe(400);expect(r.message).toBe('Chỉ nộp lại được khi đơn bị từ chối.');
});
