import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import type { ApiResponse } from '@/app/types/auth';
import type { ListeningReviewDto, QuizReviewDto, ReviewPackageDto, StoryReviewDto, VocabularyReviewDto } from '@/app/types/aiStory';
import { isReadingOnly } from '@/app/lib/storyRules';

export interface StoryReviewBundle {
  summary: ReviewPackageDto;
  story: StoryReviewDto;
  vocabulary: VocabularyReviewDto;
  quiz: QuizReviewDto;
  listening: ListeningReviewDto | null;
}

export function requireReviewData<T>(result: ApiResponse<T>, context?: string): T {
  if (!result.success || result.data === null || result.data === undefined)
    throw new Error(result.status === 404 && context ? `Không tìm thấy ${context}. Hãy tải lại trạng thái truyện.` : result.message || 'Phản hồi chưa hợp lệ.');
  return result.data;
}

export async function loadStoryReviewBundle(storyId: number, signal: AbortSignal): Promise<StoryReviewBundle> {
  const [packageResult, storyResult] = await Promise.all([api.getReviewPackage(storyId, signal), api.getStoryReview(storyId, signal)]);
  signal.throwIfAborted();
  const summary = requireReviewData(packageResult, 'gói duyệt của truyện');
  const story = requireReviewData(storyResult, 'bản thảo của truyện');
  const empty = { storyId, versionId: summary.storyVersionId, items: [] };
  let vocabulary: VocabularyReviewDto = empty, quiz: QuizReviewDto = empty, listening: ListeningReviewDto | null = null;
  if (!isReadingOnly(summary.outputMode)) {
    const [v, q, l] = await Promise.all([api.getVocabularyReview(storyId, signal), api.getQuizReview(storyId, signal), api.getListeningReview(storyId, signal)]);
    signal.throwIfAborted();
    vocabulary = requireReviewData(v, 'từ vựng của truyện');
    quiz = requireReviewData(q, 'các câu hỏi của truyện');
    listening = requireReviewData(l, 'gói tương tác của truyện');
  }
  if (summary.storyId !== storyId || [story, vocabulary, quiz, ...(listening ? [listening] : [])]
    .some(item => item.storyId !== storyId || item.versionId !== summary.storyVersionId))
    throw new Error('Bản thảo đã thay đổi trong lúc tải. Vui lòng kiểm tra lại.');
  return { summary, story, vocabulary, quiz, listening };
}
