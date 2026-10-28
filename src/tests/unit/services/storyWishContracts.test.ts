import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {childWishService as child,parentWishService as parent} from '@/app/services/storyWishService';
import {authService} from '@/app/services/authService';
import type {SubmitAIStoryInputRequestDto} from '@/app/types/aiStory';
let fetcher:ReturnType<typeof vi.fn>;
beforeEach(()=>{fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,message:'OK',data:null})));vi.stubGlobal('fetch',fetcher);});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

it.each([
 ['GET','/child/wish-cards?group=Place',()=>child.cards('child','Place'),undefined],
 ['POST','/child/wishes/draft',()=>child.startDraft('child'),undefined],
 ['PUT','/child/wishes/draft/cards',()=>child.selectCard('child',{group:'Lesson',cardId:null,leaveToParent:true}),{group:'Lesson',cardId:null,leaveToParent:true}],
 ['POST','/child/wishes/draft/submit',()=>child.submit('child'),undefined],
 ['GET','/child/wishes',()=>child.mine('child'),undefined],
] as const)('%s %s uses the child session',async(method,path,call,body)=>{
 const adult=vi.spyOn(authService,'refreshToken');await call();
 const [url,options]=fetcher.mock.calls[0];expect(url.endsWith(path)).toBe(true);expect(options.method).toBe(method);
 expect(new Headers(options.headers).get('Authorization')).toBe('Bearer child');
 expect(options.body?JSON.parse(options.body):undefined).toEqual(body);expect(adult).not.toHaveBeenCalled();
});

const request={topic:'Thỏ con',characterMode:'custom',characters:['Thỏ con'],settingMode:'custom',setting:'Khu rừng',lesson:'Dũng cảm',vocabularyLevel:'default',targetLength:600,outputMode:'learning',childProfileId:3,idempotencyKey:'k1'} as unknown as SubmitAIStoryInputRequestDto;
it.each([
 ['GET','/parent/wishes?childProfileId=3',()=>parent.list(3),undefined],
 ['GET','/parent/wishes/7',()=>parent.get(7),undefined],
 ['GET','/parent/wishes/7/suggestions',()=>parent.suggestions(7),undefined],
 ['GET','/parent/wishes/7/generation-form',()=>parent.generationForm(7),undefined],
 ['POST','/parent/wishes/7/create-story',()=>parent.createStory(7,request),request],
 ['POST','/parent/wishes/7/use-existing',()=>parent.useExisting(7,2),{suggestionRank:2}],
 ['POST','/parent/wishes/7/decline',()=>parent.decline(7,'  '),{reason:null}],
 ['POST','/parent/wishes/7/decline',()=>parent.decline(7,' Để tuần sau '),{reason:'Để tuần sau'}],
] as const)('%s %s calls the parent wish API',async(method,path,call,body)=>{
 vi.spyOn(authService,'getStoredAccessToken').mockReturnValue('adult');await call();
 const [url,options]=fetcher.mock.calls[0];expect(url.endsWith(path)).toBe(true);expect(options.method).toBe(method);
 expect(options.body?JSON.parse(options.body):undefined).toEqual(body);
});
