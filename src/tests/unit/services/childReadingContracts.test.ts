import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {childReadingService as reading,childNotebookService as notebook} from '@/app/services/childReadingService';
import {aiStoryCreationService as media} from '@/app/services/aiStoryCreationService';
import {authService} from '@/app/services/authService';
let fetcher:ReturnType<typeof vi.fn>;
beforeEach(()=>{fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,message:'OK',data:null})));vi.stubGlobal('fetch',fetcher);});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
it.each([
 ['GET','/child/reading/stories?search=a%26b&source=mine&pageIndex=2&pageSize=20',()=>reading.stories('child',{search:'a&b',source:'mine',pageIndex:2}),undefined],
 ['POST','/child/reading/sessions',()=>reading.start('child',{communitySubmissionId:9}),{communitySubmissionId:9}],
 ['GET','/child/reading/sessions/4/content',()=>reading.content('child',4),undefined],
 ['PUT','/child/reading/sessions/4/progress',()=>reading.progress('child',4,{page:2,readingMode:'ListenFirst',addedSeconds:15}),{page:2,readingMode:'ListenFirst',addedSeconds:15}],
 ['POST','/child/reading/sessions/4/complete',()=>reading.complete('child',4),undefined],
 ['PUT','/child/reading/sessions/4/bookmark',()=>reading.bookmark('child',4,true),{value:true}],
 ['PUT','/child/reading/sessions/4/favorite',()=>reading.favorite('child',4,false),{value:false}],
 ['GET','/child/reading/sessions/4/signal',()=>reading.signal('child',4),undefined],
 ['POST','/child/reading/sessions/4/events',()=>reading.event('child',4,'TtsStarted','{}'),{eventType:'TtsStarted',payload:'{}'}],
 ['GET','/child/reading/sessions/4/vocabulary/8',()=>reading.definition('child',4,8),undefined],
 ['POST','/child/notebook/sessions/4/words',()=>notebook.collect('child',4,8),{vocabularyId:8}],
 ['GET','/child/notebook',()=>notebook.list('child'),undefined],
 ['DELETE','/child/notebook/3',()=>notebook.remove('child',3),undefined],
] as const)('%s %s uses the child session exclusively',async(method,path,call,body)=>{
 const adult=vi.spyOn(authService,'refreshToken');await call();
 const [url,options]=fetcher.mock.calls[0];expect(url.endsWith(path)).toBe(true);expect(options.method).toBe(method);
 expect(new Headers(options.headers).get('Authorization')).toBe('Bearer child');
 expect(options.body?JSON.parse(options.body):undefined).toEqual(body);expect(adult).not.toHaveBeenCalled();
});
it('fails closed without child token and does not refresh an adult session on 401',async()=>{
 expect((await reading.content('',4)).status).toBe(401);expect(fetcher).not.toHaveBeenCalled();
 const adult=vi.spyOn(authService,'refreshToken');fetcher.mockResolvedValueOnce(new Response(JSON.stringify({success:false,message:'Revoked',data:null}),{status:401}));
 expect((await reading.content('child',4)).status).toBe(401);expect(adult).not.toHaveBeenCalled();expect(fetcher).toHaveBeenCalledTimes(1);
});
it('keeps current media with the exact candidate, snapshot and operation ID, preserving conflicts',async()=>{
 vi.spyOn(authService,'getStoredAccessToken').mockReturnValue('adult');
 fetcher.mockResolvedValueOnce(new Response(JSON.stringify({success:false,message:'STALE_MEDIA_PACKAGE',data:null}),{status:409}));
 const body={storyVersionId:12,packageRevision:3,operationId:'keep-1'};
 const r=await media.keepCurrentMedia(7,88,body);
 expect(fetcher.mock.calls[0][0]).toMatch(/\/stories\/7\/media\/replacements\/88\/keep-current$/);
 expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(body);expect(r.status).toBe(409);expect(fetcher).toHaveBeenCalledTimes(1);
});
