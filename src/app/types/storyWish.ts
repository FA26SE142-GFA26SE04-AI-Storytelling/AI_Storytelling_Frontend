import type { AIStoryInputProgressDto, SubmitAIStoryInputRequestDto } from './aiStory';

/** Nhóm thẻ bé dùng khi ước, theo thứ tự backend hiển thị. */
export type WishCardGroup = 'Character' | 'Place' | 'Challenge' | 'Lesson';
export type StoryWishStatus = 'Draft' | 'Pending' | 'Accepted' | 'Fulfilled' | 'Declined' | 'Expired' | 'Cancelled';
export type StoryWishKind = 'Wish' | 'Creation';

export interface ChildWishCardDto { id: number; group: WishCardGroup | string; label: string; imageUrl: string; audioUrl: string | null }

export interface WishDraftDto {
  wishId: number;
  resumed: boolean;
  expiresAt: string;
  cards: ChildWishCardDto[];
  lessonLeftToParent: boolean;
  canSubmit: boolean;
}

export interface SelectWishCardRequestDto { group: WishCardGroup; cardId: number | null; leaveToParent: boolean }

/** Truyện gợi ý: mở bằng storyId, hoặc communitySubmissionId nếu là truyện cộng đồng. */
export interface WishSuggestionDto {
  rank: number;
  storyId: number | null;
  communitySubmissionId: number | null;
  title: string;
  coverImageUrl: string | null;
  matchedCards: ChildWishCardDto[];
}

export interface ChildWishDto {
  wishId: number;
  kind: StoryWishKind | string;
  status: StoryWishStatus | string;
  /** Câu trạng thái viết sẵn cho bé ("Bố mẹ đang xem", …). */
  message: string;
  cards: ChildWishCardDto[];
  lessonLeftToParent: boolean;
  fulfilledStoryId: number | null;
  submittedAt: string | null;
  suggestions: WishSuggestionDto[];
}

export interface ParentWishDto {
  wishId: number;
  childProfileId: number;
  kind: StoryWishKind | string;
  status: StoryWishStatus | string;
  cards: ChildWishCardDto[];
  lessonLeftToParent: boolean;
  submittedAt: string | null;
  /** Hạn xử lý, chỉ có khi đang Pending. */
  expiresAt: string | null;
  declineReason: string | null;
  resolutionNote: string | null;
  generatedStoryId: number | null;
  fulfilledStoryId: number | null;
  fulfilledWithExistingStory: boolean;
  resolvedAt: string | null;
}

export interface ParentWishSuggestionDto extends WishSuggestionDto {
  opened: boolean;
  completed: boolean;
  feeling: string | null;
  feelingLabel: string | null;
  hint: string | null;
}

export interface ParentWishSuggestionsDto { wishId: number; items: ParentWishSuggestionDto[]; emptyMessage: string | null }
export interface ParentWishDetailDto { wish: ParentWishDto; suggestions: ParentWishSuggestionsDto }

export interface ParentWishGenerationFormDto {
  wishId: number;
  /** Bé chọn "Để bố mẹ chọn" bài học: phụ huynh phải điền bài học trước khi gửi. */
  lessonLeftToParent: boolean;
  request: SubmitAIStoryInputRequestDto;
}

export interface ParentWishCreateStoryResultDto { wish: ParentWishDto; generation: AIStoryInputProgressDto }

// ---------- Moderator quản lý thẻ ước (/moderation/wish-cards) ----------
/** Bé ước dùng 4 nhóm đầu; Desire/Event/Ending dành cho Bé sáng tác. */
export type ManagedWishCardGroup = WishCardGroup | 'Desire' | 'Event' | 'Ending';

export interface WishCardDto {
  id: number;
  group: ManagedWishCardGroup | string;
  label: string;
  imageUrl: string;
  audioUrl: string | null;
  /** "6-8", "9-10" hoặc null = mọi nhóm tuổi. */
  ageBand: string | null;
  contentCategoryId: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface WishCardQueryDto { group?: ManagedWishCardGroup; isActive?: boolean; pageIndex: number; pageSize: number }

export interface UpdateWishCardRequestDto {
  label: string;
  imageUrl: string;
  audioUrl: string | null;
  ageBand: string | null;
  contentCategoryId: number | null;
  sortOrder: number;
}
export interface CreateWishCardRequestDto extends UpdateWishCardRequestDto { group: ManagedWishCardGroup }

/** Thẻ đã gắn cho một truyện; source là "Moderator" hoặc "Ai". */
export interface WishCardMatchDto { storyId: number; wishCardId: number; group: string; label: string; source: string }
