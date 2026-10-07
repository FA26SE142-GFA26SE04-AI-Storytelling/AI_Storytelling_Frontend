import { describe, expect, it } from 'vitest';
import { ContentGenerationProgressDto, OutlineProgressDto } from '@/app/types/aiStory';
import { contentDestination, generationDisplayPhase, normalizeStoryStatus, outlineReady } from '@/app/features/story-workflow/storyGenerationFlow';

const content: ContentGenerationProgressDto = {
  storyId: 7, storyStatus: 'outline_review', currentStep: 'generating_vocabulary', content: 'stable',
  vocabulary: 'processing', quiz: 'not_started', discussion: 'not_started', isComplete: false,
  stableStoryVersionId: 2, lastErrorCode: null, qualityFailure: null,
};
const outline: OutlineProgressDto = {
  storyId: 7, storyStatus: 'outline_review', activeOperation: null, activeJobStatus: null, lastErrorCode: null,
  currentVersion: { id: 2, versionNo: 2, editType: 'ai', title: 'Bạn bè', opening: 'Mở đầu', development: 'Diễn biến', ending: 'Kết thúc',
    isCurrent: true, editorUserId: null, outlineApprovedAt: null, outlineApprovedByUserId: null, createdAt: '' },
};
describe('backend-driven story transitions', () => {
  it('normalizes PascalCase without changing already normalized values', () => {
    expect(normalizeStoryStatus('MediaProcessing')).toBe('media_processing');
    expect(normalizeStoryStatus('content_review')).toBe('content_review');
  });
  it('does not treat stable content as a complete learning package', () => expect(contentDestination(content)).toBe('waiting'));
  it('shows content first until the backend promotes a stable version', () => {
    expect(generationDisplayPhase(null)).toBe('content');
    expect(generationDisplayPhase({ ...content, content: 'processing', stableStoryVersionId: null, currentStep: 'generating_content' })).toBe('content');
    expect(generationDisplayPhase({ ...content, content: 'failed', stableStoryVersionId: null, currentStep: 'failed_content' })).toBe('content');
    expect(generationDisplayPhase({ ...content, stableStoryVersionId: null })).toBe('content');
    expect(generationDisplayPhase(content)).toBe('learning');
  });
  it('requires both content_review and isComplete for manual review', () => {
    expect(contentDestination({ ...content, isComplete: true })).toBe('waiting');
    expect(contentDestination({ ...content, storyStatus: 'content_review', isComplete: true })).toBe('review');
  });
  it.each(['Approved', 'MediaProcessing', 'Ready', 'approved', 'media_processing'])('handles auto-publish %s even when isComplete is false', storyStatus => {
    expect(contentDestination({ ...content, storyStatus })).toBe('media');
  });
  it.each(['Rejected', 'archived'])('stops on %s', storyStatus => expect(contentDestination({ ...content, storyStatus })).toBe('stopped'));
  it('does not accept an old version while regenerate is running', () => {
    expect(outlineReady({ ...outline, activeOperation: 'regenerate_outline', activeJobStatus: 'processing' })).toBe(false);
    expect(outlineReady(outline, 2)).toBe(false);
    expect(outlineReady(outline, 1)).toBe(true);
  });
  it('cannot re-approve an already approved outline', () => {
    expect(outlineReady({ ...outline, currentVersion: { ...outline.currentVersion!, outlineApprovedAt: '2026-10-01' } })).toBe(false);
  });
});
