import type { PagedResult } from '@/app/types/story';

/** Theo `StoryRatingDtos.cs` / `StoryRatingModerationDtos.cs` của backend. */
export type StoryRatingOrder = 'newest' | 'highest' | 'lowest';
export type MyStoryRatingStatus = 'Published' | 'PendingModeration' | 'Hidden';
export type StoryRatingReportReason = 'Offensive' | 'Spam' | 'PersonalInfo' | 'Irrelevant' | 'Other';

export const RATING_COMMENT_MAX = 1000;
export const RATING_REPORT_NOTE_MAX = 500;
export const RATING_HIDE_REASON_MAX = 1000;

export interface StoryRatingQuery { pageIndex?: number; pageSize?: number; orderBy?: StoryRatingOrder }

export interface StoryRatingDto {
  ratingId: number;
  /** Dạng "Phụ huynh H***". */
  reviewerName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface MyStoryRatingDto extends StoryRatingDto {
  status: MyStoryRatingStatus | string;
  /** Chỉ có khi status = Hidden. */
  hiddenReason?: string | null;
}

export interface StoryRatingSummaryDto {
  /** Làm tròn 1 chữ số; null khi chưa có đánh giá. */
  averageRating: number | null;
  ratingCount: number;
  /** Khóa "1".."5". */
  distribution: Record<string, number>;
}

export interface StoryRatingListDto {
  storyId: number;
  summary: StoryRatingSummaryDto;
  /** Chỉ có ở API phụ huynh; null khi chưa đánh giá. */
  myRating?: MyStoryRatingDto | null;
  /** True khi phụ huynh có bé đã mở đọc truyện. */
  canRate: boolean;
  ratings: PagedResult<StoryRatingDto>;
}

export interface UpsertStoryRatingRequest { rating: number; comment?: string | null }
export interface ReportStoryRatingRequest { reason: StoryRatingReportReason; note?: string | null }
export interface StoryRatingReportResultDto { ratingId: number; status: string }

export interface StoryRatingReportItemDto { reason: StoryRatingReportReason | string; note?: string | null; createdAt: string }

export interface StoryRatingModerationDetailDto {
  itemId: number;
  ratingId: number;
  storyId: number;
  storyTitle?: string | null;
  reviewerName: string;
  rating: number;
  comment?: string | null;
  /** Published (đang hiện, bị báo cáo) hoặc PendingModeration. */
  ratingStatus: string;
  /** "Screening" (lọc tự động) hoặc "Report" (bị báo cáo). */
  holdSource: 'Screening' | 'Report' | string;
  /** LINK, BLOCKED_TERM hoặc LOW_RATING_WITH_TEXT khi holdSource = Screening. */
  screeningReasonCode?: string | null;
  reports: StoryRatingReportItemDto[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface StoryRatingDecisionResultDto {
  itemId: number;
  ratingId: number;
  decision: 'Approved' | 'Hidden' | string;
  ratingStatus: string;
  decidedAt: string;
}
