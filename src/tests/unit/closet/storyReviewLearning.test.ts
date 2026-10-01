import { describe, expect, it } from 'vitest';
import { hasMissingLearning, missingLearning } from '../../../app/components/closet/hooks/storyReviewLearning';
import type { StoryReviewBundle } from '../../../app/components/closet/hooks/useStoryReview';

function bundle(vocabulary: unknown[], quiz: unknown[], discussion: unknown[]) {
  return { summary: { storyVersionId: 42 }, vocabulary: { items: vocabulary }, quiz: { items: quiz }, discussion: { items: discussion } } as StoryReviewBundle;
}
describe('learning after story version changes', () => {
  it('requires new learning for an empty new story version', () => {
    const data = bundle([], [], []);
    expect(hasMissingLearning(data)).toBe(true);
    expect(missingLearning(data)).toEqual({ storyVersionId: 42, includeVocabulary: true, includeQuiz: true, includeDiscussion: true });
  });
  it('regenerates only missing artifacts, preserving completed learning on retry', () => {
    expect(missingLearning(bundle([{}], [], []))).toEqual({ storyVersionId: 42, includeVocabulary: false, includeQuiz: true, includeDiscussion: true });
  });
  it('unblocks approval only when all three artifacts are populated', () => {
    expect(hasMissingLearning(bundle([{}], [{}], []))).toBe(true);
    expect(hasMissingLearning(bundle([{}], [{}], [{}]))).toBe(false);
  });
});
