import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {childReadingService as reading,childQuizService as quiz,childRewardsService as rewards,parentReadingFeedbackService as feedback} from '@/app/services/childReadingService';
import {authService} from '@/app/services/authService';
let fetcher:ReturnType<typeof vi.fn>;
beforeEach(()=>{fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,message:'OK',data:null})));vi.stubGlobal('fetch',fetcher);});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

it.each([
 ['PUT','/child/reading/sessions/4/feeling',()=>reading.feeling('child',4,'VeryLike'),{feeling:'VeryLike'}],
 ['GET','/child/quiz/sessions/4',()=>quiz.get('child',4),undefined],
 ['POST','/child/quiz/sessions/4/answers',()=>quiz.answer('child',4,11,'Đúng'),{quizItemId:11,answer:'Đúng'}],
 ['GET','/child/quiz/sessions/4/result',()=>quiz.result('child',4),undefined],
 ['GET','/child/rewards',()=>rewards.get('child'),undefined],
] as const)('%s %s uses the child session',async(method,path,call,body)=>{
 const adult=vi.spyOn(authService,'refreshToken');await call();
 const [url,options]=fetcher.mock.calls[0];expect(url.endsWith(path)).toBe(true);expect(options.method).toBe(method);
 expect(new Headers(options.headers).get('Authorization')).toBe('Bearer child');
 expect(options.body?JSON.parse(options.body):undefined).toEqual(body);expect(adult).not.toHaveBeenCalled();
});

it('lists a child reading feedback page with the adult session',async()=>{
 vi.spyOn(authService,'getStoredAccessToken').mockReturnValue('adult');
 await feedback.list(3,2,10);
 const [url,options]=fetcher.mock.calls[0];
 expect(url.endsWith('/ParentReadingFeedback/3?pageIndex=2&pageSize=10')).toBe(true);expect(options.method).toBe('GET');
});
