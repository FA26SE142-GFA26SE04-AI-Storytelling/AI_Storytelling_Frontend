import { describe, it, expect } from 'vitest';
import { applyAssistancePatch } from '@/app/features/story-workflow/assistancePatch';
import { snapshotStage } from '@/app/features/story-workflow/generationSnapshot';
import type { ContentGenerationProgressDto } from '@/app/types/aiStory';
describe('Applying a pinned assistance result', () => {
  const snapshot = { title:'Truyện',content:'Bạn ếch xanh' };
  it('only replaces the exact quoted span of the unchanged editor snapshot', () => {
    expect(applyAssistancePatch(snapshot,snapshot,{kind:'replace',start:4,length:3,quote:'ếch',text:'cá'})).toEqual({title:'Truyện',content:'Bạn cá xanh'});
    expect(applyAssistancePatch(snapshot,{...snapshot,content:'Đã sửa'}, {kind:'replace',start:4,length:3,quote:'ếch',text:'cá'})).toBeNull();
    expect(applyAssistancePatch(snapshot,snapshot,{kind:'replace',start:4,length:3,quote:'cá',text:'ếch'})).toBeNull();
  });
  it('rejects invalid UTF-16 boundaries, positions and non-insert patches at a cursor', () => {
    const emoji = {title:'',content:'A😀B'};
    expect(applyAssistancePatch(emoji,emoji,{kind:'replace',start:2,length:1,quote:'\uDE00',text:'x'})).toBeNull();
    expect(applyAssistancePatch(snapshot,snapshot,{kind:'insert',start:0,length:1,quote:'B',text:'x'})).toBeNull();
    expect(applyAssistancePatch(snapshot,snapshot,{kind:'replace',start:-1,length:2,quote:'',text:'x'})).toBeNull();
  });
  it('inserts at a valid UTF-16 cursor without replacing surrounding content', () => {
    expect(applyAssistancePatch(snapshot,snapshot,{kind:'insert',start:4,length:0,quote:'',text:'chú '})).toEqual({title:'Truyện',content:'Bạn chú ếch xanh'});
  });
});
describe('Paused generation is not a retryable completed job', () => {
  it('handles waitingForModeration before outline state and stops blocked safety review', () => {
    expect(snapshotStage({outline:null,generation:{storyStatus:'OutlineReview',waitingForModeration:true} as ContentGenerationProgressDto},false)).toBe('moderation');
    expect(snapshotStage({outline:null,generation:{storyStatus:'SafetyReviewBlocked',waitingForModeration:false} as ContentGenerationProgressDto},false)).toBe('stopped');
  });
});
