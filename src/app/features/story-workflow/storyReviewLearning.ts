import type { StoryReviewBundle } from './useStoryReview';
import type { GenerateArtifactsRequestDto } from '@/app/types/aiStory';

export function missingLearning(bundle: StoryReviewBundle): GenerateArtifactsRequestDto {
  return {
    storyVersionId: bundle.summary.storyVersionId,
    includeVocabulary: bundle.vocabulary.items.length === 0,
    includeQuiz: bundle.quiz.items.length === 0,
    includeDiscussion: bundle.discussion.items.length === 0,
  };
}
export function hasMissingLearning(bundle: StoryReviewBundle): boolean {
  const missing = missingLearning(bundle);
  return !!(missing.includeVocabulary || missing.includeQuiz || missing.includeDiscussion);
}
