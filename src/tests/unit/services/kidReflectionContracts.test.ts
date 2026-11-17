import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {childReadingService as reading,childReflectionService as reflection} from '@/app/services/childReadingService';
import {authService} from '@/app/services/authService';
let fetcher:ReturnType<typeof vi.fn>;
beforeEach(()=>{fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,message:'OK',data:null})));vi.stubGlobal('fetch',fetcher);});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
const call=(i=0)=>{const [url,options]=fetcher.mock.calls[i];return {url:url as string,options};};
it.each([
 ['GET','/child/reading/sessions/4/reflection',()=>reflection.get('child',4),undefined],
 ['PUT','/child/reading/sessions/4/reflection/emotions',()=>reflection.emotions('child',4,['Happy','Touched']),{emotions:['Happy','Touched']}],
 ['PUT','/child/reading/sessions/4/reflection/favorite-scene',()=>reflection.favoriteScene('child',4,12),{sceneId:12}],
] as const)('%s %s uses the child session',async(method,path,run,body)=>{
 const adult=vi.spyOn(authService,'refreshToken');await run();
 const {url,options}=call();expect(url.endsWith(path)).toBe(true);expect(options.method??'GET').toBe(method);
 expect(new Headers(options.headers).get('Authorization')).toBe('Bearer child');
 expect(options.body?JSON.parse(options.body):undefined).toEqual(body);expect(adult).not.toHaveBeenCalled();
});
it('sends the reflection note as multipart with trimmed Text and Audio; omits empty fields',async()=>{
 await reflection.note('child',4,{text:'  Con thích mèo ',audio:new Blob(['x'],{type:'audio/wav'})});
 await reflection.note('child',4,{text:'   ',audio:null});
 const {url,options}=call();const f=options.body as FormData;
 expect(url.endsWith('/child/reading/sessions/4/reflection/note')).toBe(true);expect(options.method).toBe('POST');
 expect(f.get('Text')).toBe('Con thích mèo');expect(f.get('Audio')).toBeInstanceOf(Blob);
 expect(new Headers(options.headers).get('Authorization')).toBe('Bearer child');
 const g=call(1).options.body as FormData;expect(g.has('Text')).toBe(false);expect(g.has('Audio')).toBe(false);
});
it('sends the read-aloud practice recording as multipart field Audio to the practice route',async()=>{
 await reading.readAloudPractice('child',4,31,new Blob(['x'],{type:'audio/wav'}));
 const {url,options}=call();
 expect(url.endsWith('/child/reading/sessions/4/read-aloud-practice/31')).toBe(true);expect(options.method).toBe('POST');
 expect(options.body).toBeInstanceOf(FormData);expect((options.body as FormData).get('Audio')).toBeInstanceOf(Blob);
 expect(new Headers(options.headers).get('Authorization')).toBe('Bearer child');
});
