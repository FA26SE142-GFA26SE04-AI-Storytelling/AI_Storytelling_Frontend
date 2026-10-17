import type { StoryReviewBundle } from './useStoryReview';
import type { GenerateArtifactsRequestDto } from '@/app/types/aiStory';
import { isReadingOnly } from '@/app/lib/storyRules';

export function missingLearning(bundle: StoryReviewBundle): GenerateArtifactsRequestDto {
  return {
    storyVersionId: bundle.summary.storyVersionId,
    includeVocabulary: bundle.vocabulary.items.length === 0,
    includeQuiz: bundle.quiz.items.length === 0,
    includeDiscussion: bundle.discussion.items.length === 0,
  };
}

/** Truyện "Chỉ để đọc" không có học liệu nên không bao giờ thiếu. */
export function hasMissingLearning(bundle: StoryReviewBundle): boolean {
  if (isReadingOnly(bundle.summary.outputMode)) return false;
  const missing = missingLearning(bundle);
  return !!(missing.includeVocabulary || missing.includeQuiz || missing.includeDiscussion);
}
