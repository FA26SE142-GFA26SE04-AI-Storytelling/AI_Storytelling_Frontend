import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {wishCardService as cards} from '@/app/services/wishCardService';
import {authService} from '@/app/services/authService';
let fetcher:ReturnType<typeof vi.fn>;
beforeEach(()=>{fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,message:'OK',data:null})));vi.stubGlobal('fetch',fetcher);vi.spyOn(authService,'getStoredAccessToken').mockReturnValue('adult');});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

const fields={label:'Thỏ con',imageUrl:'https://cdn.example/tho.png',audioUrl:null,ageBand:'6-8',contentCategoryId:null,sortOrder:1};
it.each([
 ['GET','/moderation/wish-cards?group=Place&isActive=false&pageIndex=2&pageSize=20',()=>cards.list({group:'Place',isActive:false,pageIndex:2,pageSize:20}),undefined],
 ['GET','/moderation/wish-cards?pageIndex=1&pageSize=100',()=>cards.list({pageIndex:1,pageSize:100}),undefined],
 ['GET','/moderation/wish-cards/5',()=>cards.get(5),undefined],
 ['POST','/moderation/wish-cards',()=>cards.create({...fields,group:'Character'}),{...fields,group:'Character'}],
 ['PUT','/moderation/wish-cards/5',()=>cards.update(5,fields),fields],
 ['PUT','/moderation/wish-cards/5/active',()=>cards.setActive(5,false),{isActive:false}],
 ['GET','/moderation/stories/9/wish-cards',()=>cards.storyCards(9),undefined],
 ['POST','/moderation/stories/9/wish-cards',()=>cards.addToStory(9,5),{wishCardId:5}],
 ['DELETE','/moderation/stories/9/wish-cards/5',()=>cards.removeFromStory(9,5),undefined],
] as const)('%s %s calls the wish card management API',async(method,path,call,body)=>{
 await call();
 const [url,options]=fetcher.mock.calls[0];expect(url.endsWith(path)).toBe(true);expect(options.method).toBe(method);
 expect(options.body?JSON.parse(options.body):undefined).toEqual(body);
});
