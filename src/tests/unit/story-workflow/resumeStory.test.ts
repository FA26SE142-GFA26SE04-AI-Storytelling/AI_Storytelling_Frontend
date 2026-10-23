import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadResumeSnapshot } from '@/app/features/story-workflow/resumeStory';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import { storyService } from '@/app/services/storyService';
import { snapshotStage } from '@/app/features/story-workflow/generationSnapshot';
import { positiveStoryId, readWorkspaceLocation, workspaceLocation } from '@/app/lib/workspaceLocation';
import type { ApiResponse } from '@/app/types/auth';
const ok = (data:unknown):ApiResponse<never> => ({success:true,message:'',data:data as never});
const failed = {success:false,status:403,message:'Không có quyền mở truyện này.',data:null};
afterEach(() => vi.restoreAllMocks());
function setup(status:string) {
  vi.spyOn(storyService,'getStoryById').mockResolvedValue(ok({id:88,source:'Ai',status,title:'Truyện đang tạo',ageBand:'9-10'}));
  vi.spyOn(api,'getOutline').mockResolvedValue(ok({storyId:88,storyStatus:status,currentVersion:null}));
  vi.spyOn(api,'getGenerationProgress').mockResolvedValue(ok({storyId:88,storyStatus:status,currentStep:'completed',isComplete:true}));
}
describe('Resume a persisted story',() => {
  it.each([['MediaProcessing','media'],['MediaReview','media'],['ContentReview','review'],['ModerationReview','moderation'],['Archived','stopped']])('restores %s from server without creating another input',async(status,stage) => {
    setup(status); const submit=vi.spyOn(api,'submitInput');const context=vi.spyOn(api,'getCreationContext');
    const r=await loadResumeSnapshot(88,null,new AbortController().signal);
    expect(r.success).toBe(true); expect(snapshotStage(r.data,false)).toBe(stage);
    expect(r.data?.story?.ageBand).toBe('9-10');expect(submit).not.toHaveBeenCalled();expect(context).not.toHaveBeenCalled();
  });
  it('uses media progress when legacy outline/generation progress is absent',async() => {
    setup('MediaReview');vi.mocked(api.getOutline).mockResolvedValue(failed);vi.mocked(api.getGenerationProgress).mockResolvedValue(failed);
    vi.spyOn(api,'getMediaProgress').mockResolvedValue(ok({storyId:88,storyStatus:'MediaReview',isAwaitingConfirmation:true}));
    const r=await loadResumeSnapshot(88,null,new AbortController().signal);
    expect(r.success).toBe(true);expect(snapshotStage(r.data,false)).toBe('media');
  });
  it('fails closed when the story cannot be opened',async() => {
    setup('MediaProcessing');vi.mocked(storyService.getStoryById).mockResolvedValue(failed);
    const r=await loadResumeSnapshot(88,null,new AbortController().signal);expect(r).toEqual(failed);
  });
  it('rejects another story returned by a malformed progress response',async() => {
    setup('ContentReview');vi.mocked(api.getOutline).mockResolvedValue(ok({storyId:7,storyStatus:'ContentReview'}));vi.mocked(api.getGenerationProgress).mockResolvedValue(ok({storyId:7,storyStatus:'ContentReview'}));
    const r=await loadResumeSnapshot(88,null,new AbortController().signal);expect(r.success).toBe(false);expect(r.data).toBeNull();
  });
  it('resumes a known pending input request without inventing an accepted state',async() => {
    setup('Draft');vi.spyOn(api,'getInputProgress').mockResolvedValue(ok({storyId:88,requestId:3,inputStatus:'checking_input'}));
    const r=await loadResumeSnapshot(88,3,new AbortController().signal);expect(snapshotStage(r.data,false)).toBe('checking');
  });
});
describe('Studio navigation location',() => {
  it.each(['-1','0','1.5','1abc','9007199254740992',''])('rejects invalid storyId %s',value => expect(positiveStoryId(value)).toBeNull());
  it('persists the selected story on a reloadable URL and clears it on other workspaces',() => {
    const href='https://frontend.example/?keep=value#library';
    expect(workspaceLocation(href,'studio',88)).toBe('/?keep=value&storyId=88#studio');
    expect(readWorkspaceLocation('https://frontend.example/?storyId=88#studio')).toEqual({workspace:'studio',storyId:88});
    expect(workspaceLocation('https://frontend.example/?storyId=88#studio','library')).toBe('/#library');
    expect(readWorkspaceLocation('https://frontend.example/?storyId=88#library').storyId).toBeNull();
  });
});
