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
