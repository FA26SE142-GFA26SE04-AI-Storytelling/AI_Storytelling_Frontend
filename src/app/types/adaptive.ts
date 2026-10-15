/** Luồng 6 — học tập thích ứng: đề xuất điều chỉnh hồ sơ học tập, người giám sát quyết định. */

/** Core: Nhánh A (reading_difficulty) và Nhánh B (content_personalization). learning_focus, learning_intervention là Optional. */
export type RecommendationCategory = 'reading_difficulty' | 'content_personalization';

/** Mục 7 — 12 trạng thái của Recommendation. */
export type RecommendationStatus =
  | 'detected' | 'recommendation_created' | 'awaiting_review' | 'stale' | 'observe_more' | 'rejected'
  | 'approved' | 'modified' | 'applied' | 'monitoring' | 'validated' | 'reassessment_required';

export type ReviewDecision = 'accept' | 'modify' | 'reject' | 'observe_more';

export interface Evidence {
  label: string;
  value: string;
}

export interface RecommendationChange {
  readingLevel?: number;
  topic?: string;
}

/** Bước 6.6 — mỗi người review là một dòng; had_final_authority chụp lại quyền lúc bấm. */
export interface RecommendationReview {
  id: number;
  reviewerUserId: number;
  reviewerName: string;
  decision: ReviewDecision;
  modifiedValue: number | null;
  reason: string | null;
  isFinal: boolean;
  hadFinalAuthority: boolean;
  createdAt: string;
}

export interface Recommendation {
  id: number;
  childProfileId: number;
  category: RecommendationCategory;
  status: RecommendationStatus;
  currentState: RecommendationChange;
  proposedChange: RecommendationChange;
  observation: string;
  evidence: Evidence[];
  createdAt: string;
  /** Awaiting Review + 14 ngày; quá hạn chưa có quyết định cuối → stale. */
  expiresAt: string;
  remindedAt: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  appliedChange: RecommendationChange | null;
  reviews: RecommendationReview[];
  /** Bước 6.8 — so sánh điểm câu đố trung bình trước / sau khi áp dụng. */
  monitoring: { beforePercent: number | null; afterPercent: number | null; note: string } | null;
}

/** Bước 6.7 — lịch sử phiên bản hồ sơ học tập; không ghi đè, bản mới active, bản trước superseded. */
export interface ProfileVersion {
  id: number;
  childProfileId: number;
  previousConfig: { readingLevel: number };
  newConfig: { readingLevel: number };
  source: 'recommendation' | 'manual';
  recommendationId: number | null;
  appliedByName: string;
  versionStatus: 'active_version' | 'superseded';
  createdAt: string;
}

export interface ReviewInput {
  decision: ReviewDecision;
  modifiedValue?: number | null;
  reason?: string | null;
}

export interface ReviewResult {
  /** comment: lưu như góp ý (không có quyền quyết định cuối, hoặc đã có người quyết định trước). */
  outcome: 'applied' | 'rejected' | 'observe_more' | 'comment';
  message: string;
  recommendation: Recommendation;
}
