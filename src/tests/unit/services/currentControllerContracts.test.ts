import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authoringGuideManagementService as guides } from '@/app/services/authoringGuideManagementService';
import { aiStoryCreationService as media } from '@/app/services/aiStoryCreationService';
import { parentAuthoringService as parent } from '@/app/services/parentAuthoringService';
import { authService } from '@/app/services/authService';
import { mediaMutationSnapshot, mediaNeedsPolling } from '@/app/features/story-workflow/mediaPackage';
import { snapshotStage } from '@/app/features/story-workflow/generationSnapshot';
import { isMediaStage, contentDestination } from '@/app/features/story-workflow/storyGenerationFlow';
import type { ContentGenerationProgressDto, MediaProgressDto, StoryMediaPackage } from '@/app/types/aiStory';
const snapshot = { storyVersionId:12, packageRevision:3, expectedConfirmed:false };
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({success:true,message:'OK',data:null}))));
  vi.stubGlobal('fetch', fetcher);
  vi.spyOn(authService,'getStoredAccessToken').mockReturnValue('adult');
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('Current controller contracts', () => {
  it.each([
    ['GET','/moderation/authoring-guides',() => guides.overview()],
    ['GET','/moderation/authoring-guides/versions?pageIndex=2&pageSize=20',() => guides.versions(2)],
    ['GET','/moderation/authoring-guides/versions/9',() => guides.version(9)],
    ['POST','/moderation/authoring-guides/draft',() => guides.createDraft(9)],
    ['DELETE','/moderation/authoring-guides/draft/items/a%2Fb?revisionToken=r%2B1',() => guides.remove('a/b','r+1')],
    ['DELETE','/moderation/authoring-guides/draft?revisionToken=r%2B1',() => guides.discard('r+1')],
    ['POST','/moderation/authoring-guides/draft/preview',() => guides.preview({revisionToken:'r1',guideId:'ending',values:{name:'Sen'}})],
    ['POST','/moderation/authoring-guides/draft/publish',() => guides.publish('r1')],
  ] as const)('%s %s keeps the adult token and exact route',async(method,path,call) => {
    await call(); const [url,options] = fetcher.mock.calls[0];
    expect(url.endsWith(path)).toBe(true); expect(options.method).toBe(method);
    expect(new Headers(options.headers).get('Authorization')).toBe('Bearer adult');
  });
  it('saves the guide draft with its revision and preserves a 409 without retrying',async() => {
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({success:false,message:'GUIDE_CATALOG_CHANGED',data:null}),{status:409}));
    const body = {revisionToken:'r1',purposes:['free'],supportGroup:'ending',itemType:'template',title:'Kết',instruction:'Điền',example:null,templateText:'{{name}}',placeholderDefinitions:['name'],order:1};
    const result = await guides.upsert('ending',body);
    expect(fetcher.mock.calls[0][0]).toMatch(/\/draft\/items\/ending$/);
    expect(fetcher.mock.calls[0][1].method).toBe('PUT');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(body);
    expect(result.status).toBe(409); expect(result.success).toBe(false); expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([
    ['/stories/7/media/illustration-beats/5/regenerate',() => media.regenerateIllustration(7,5,snapshot)],
    ['/stories/7/media/segments/8/regenerate',() => media.regenerateAudio(7,8,snapshot)],
  ] as const)('queues %s with a version, revision and expected confirmation state',async(path,call) => {
    fetcher.mockResolvedValueOnce(new Response(null,{status:202}));
    const r = await call(); expect(r.success).toBe(true); expect(r.status).toBe(202);
    expect(fetcher.mock.calls[0][0].endsWith(path)).toBe(true);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(snapshot);
  });
  it('pins media confirmation without sending regeneration-only fields',async() => {
    await media.confirmMedia(7,{storyVersionId:12,packageRevision:3});
    expect(fetcher.mock.calls[0][0]).toMatch(/\/stories\/7\/media\/confirm$/);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({storyVersionId:12,packageRevision:3});
  });
  it('queues family media using the saved content confirmation and same authoring operation',async() => {
    const body = {operationId:'same-operation',revisionToken:'r1',baseVersionId:12,contentConfirmationId:44};
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({success:true,message:'Queued',data:{storyId:7,storyVersionId:12,jobId:8,packageRevision:1,progressUrl:'/api/v1/stories/7/media/progress',packageUrl:'/api/v1/stories/7/media/package'}}),{status:202}));
    const r = await parent.generateMedia(7,body);
    expect(r.status).toBe(202); expect(r.data?.storyVersionId).toBe(12);
    expect(fetcher.mock.calls[0][0]).toMatch(/\/parent\/stories\/7\/manual\/media\/generate$/);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(body);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('keeps MediaReview in the media workflow and stops automatic polling for adult confirmation',() => {
    const generation = {storyStatus:'MediaReview',isComplete:true} as ContentGenerationProgressDto;
    expect(snapshotStage({outline:null,generation},false)).toBe('media');
    expect(contentDestination(generation)).toBe('media'); expect(isMediaStage('MediaReview')).toBe(true);
    expect(mediaNeedsPolling({isReady:false,isAwaitingConfirmation:true,jobStatus:'Completed'} as MediaProgressDto)).toBe(false);
    expect(mediaNeedsPolling({isReady:false,isAwaitingConfirmation:false,jobStatus:'Running'} as MediaProgressDto)).toBe(true);
  });
  it('rejects stale or incomplete package metadata instead of guessing mutation preconditions',() => {
    const pack = {storyVersionId:12,packageRevision:3,isConfirmed:false} as StoryMediaPackage;
    expect(mediaMutationSnapshot(pack,12)).toEqual(snapshot);
    expect(mediaMutationSnapshot(pack,13)).toBeNull();
    expect(mediaMutationSnapshot({...pack,packageRevision:undefined} as unknown as StoryMediaPackage)).toBeNull();
    expect(mediaMutationSnapshot({...pack,isConfirmed:undefined} as unknown as StoryMediaPackage)).toBeNull();
    expect(mediaMutationSnapshot({...pack,isConfirmed:true},12)?.expectedConfirmed).toBe(true);
  });
});
