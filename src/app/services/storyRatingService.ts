import { apiRequest, apiQuery } from './apiClient';
import type {
  MyStoryRatingDto,
  ReportStoryRatingRequest,
  StoryRatingDecisionResultDto,
  StoryRatingListDto,
  StoryRatingModerationDetailDto,
  StoryRatingQuery,
  StoryRatingReportResultDto,
  UpsertStoryRatingRequest,
} from '@/app/types/storyRating';

/** Đánh giá truyện Creator: phụ huynh (User), Creator xem truyện của mình, Moderator xử lý. */
export const storyRatingService = {
  list: (storyId: number, query: StoryRatingQuery = {}, signal?: AbortSignal) =>
    apiRequest<StoryRatingListDto>(`/StoryRating/story/${storyId}${apiQuery(query)}`, 'Không tải được đánh giá của truyện.', { signal }),
  upsertMine: (storyId: number, body: UpsertStoryRatingRequest) =>
    apiRequest<MyStoryRatingDto>(`/StoryRating/story/${storyId}/me`, 'Không gửi được đánh giá.', { method: 'PUT', body }),
  deleteMine: (storyId: number) =>
    apiRequest<boolean>(`/StoryRating/story/${storyId}/me`, 'Không xoá được đánh giá.', { method: 'DELETE' }),
  report: (ratingId: number, body: ReportStoryRatingRequest) =>
    apiRequest<StoryRatingReportResultDto>(`/StoryRating/${ratingId}/reports`, 'Không gửi được báo cáo đánh giá.', { method: 'POST', body }),

  listForCreator: (storyId: number, query: StoryRatingQuery = {}, signal?: AbortSignal) =>
    apiRequest<StoryRatingListDto>(`/creator/stories/${storyId}/ratings${apiQuery(query)}`, 'Không tải được đánh giá của truyện.', { signal }),

  moderationDetail: (itemId: number, signal?: AbortSignal) =>
    apiRequest<StoryRatingModerationDetailDto>(`/StoryRatingModeration/${itemId}`, 'Không tải được đánh giá cần kiểm duyệt.', { signal }),
  approve: (itemId: number) =>
    apiRequest<StoryRatingDecisionResultDto>(`/StoryRatingModeration/${itemId}/approve`, 'Không giữ được đánh giá.', { method: 'POST' }),
  hide: (itemId: number, reason: string) =>
    apiRequest<StoryRatingDecisionResultDto>(`/StoryRatingModeration/${itemId}/hide`, 'Không ẩn được đánh giá.', { method: 'POST', body: { reason } }),
};
