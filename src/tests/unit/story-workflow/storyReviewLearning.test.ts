import { describe, expect, it } from 'vitest';
import { hasMissingLearning, missingLearning } from '@/app/features/story-workflow/storyReviewLearning';
import type { StoryReviewBundle } from '@/app/features/story-workflow/useStoryReview';

function bundle(vocabulary: unknown[], quiz: unknown[], count = 0, required = true, stale = false) {
  return { summary: { storyVersionId: 42, outputMode: 'learning' }, vocabulary: { items: vocabulary }, quiz: { items: quiz },
    listening: { required, plan: [{ type: 'Checkpoint', count: 1 }], items: Array.from({ length: count }, () => ({ isStale: stale })), issues: [] },
  } as unknown as StoryReviewBundle;
}
describe('learning after story version changes', () => {
  it('requires new learning for an empty new story version', () => {
    const data = bundle([], []);
    expect(hasMissingLearning(data)).toBe(true);
    expect(missingLearning(data)).toEqual({ storyVersionId: 42, includeVocabulary: true, includeQuiz: true, includeListening: true });
  });
  it('regenerates only missing artifacts, preserving completed learning on retry', () => {
    expect(missingLearning(bundle([{}], [], 1))).toEqual({ storyVersionId: 42, includeVocabulary: false, includeQuiz: true, includeListening: false });
  });
  it('requires planned interactions, including regeneration after content changes', () => {
    expect(hasMissingLearning(bundle([{}], [{}]))).toBe(true);
    expect(hasMissingLearning(bundle([{}], [{}], 1))).toBe(false);
    expect(hasMissingLearning(bundle([{}], [{}], 1, true, true))).toBe(true);
  });
  it('allows stories whose backend plan does not require interactions', () => {
    expect(hasMissingLearning(bundle([{}], [{}], 0, false))).toBe(false);
  });
});
