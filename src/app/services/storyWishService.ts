import { apiQuery, apiRequest } from './apiClient';
import type { SubmitAIStoryInputRequestDto } from '@/app/types/aiStory';
import type * as W from '@/app/types/storyWish';

/** Bé ước một câu chuyện — phía bé, dùng phiên của bé (`/child/wish-cards`, `/child/wishes`). */
export const childWishService = {
  cards: (token: string, group: W.WishCardGroup, signal?: AbortSignal) =>
    apiRequest<W.ChildWishCardDto[]>(`/child/wish-cards${apiQuery({ group })}`, 'Không tải được thẻ ước.', { token, session: 'child', signal }),
  /** Mở lại bản nháp còn hạn hoặc bắt đầu điều ước mới. */
  startDraft: (token: string) =>
    apiRequest<W.WishDraftDto>('/child/wishes/draft', 'Chưa bắt đầu ước được.', { method: 'POST', token, session: 'child' }),
  selectCard: (token: string, body: W.SelectWishCardRequestDto) =>
    apiRequest<W.WishDraftDto>('/child/wishes/draft/cards', 'Chưa chọn được thẻ.', { method: 'PUT', body, token, session: 'child' }),
  submit: (token: string) =>
    apiRequest<W.ChildWishDto>('/child/wishes/draft/submit', 'Chưa gửi được điều ước.', { method: 'POST', token, session: 'child' }),
  /** Tối đa 10 điều ước gần nhất, không gồm bản nháp. */
  mine: (token: string, signal?: AbortSignal) =>
    apiRequest<W.ChildWishDto[]>('/child/wishes', 'Không tải được điều ước của em.', { token, session: 'child', signal }),
};

/** Phụ huynh xử lý điều ước của con (`/parent/wishes`). Backend kiểm quyền ApproveStory. */
export const parentWishService = {
  list: (childProfileId: number, signal?: AbortSignal) =>
    apiRequest<W.ParentWishDto[]>(`/parent/wishes${apiQuery({ childProfileId })}`, 'Không tải được điều ước của bé.', { signal }),
  get: (wishId: number, signal?: AbortSignal) =>
    apiRequest<W.ParentWishDetailDto>(`/parent/wishes/${wishId}`, 'Không mở được điều ước.', { signal }),
  suggestions: (wishId: number, signal?: AbortSignal) =>
    apiRequest<W.ParentWishSuggestionsDto>(`/parent/wishes/${wishId}/suggestions`, 'Không tải được truyện gợi ý.', { signal }),
  generationForm: (wishId: number, signal?: AbortSignal) =>
    apiRequest<W.ParentWishGenerationFormDto>(`/parent/wishes/${wishId}/generation-form`, 'Không tải được form tạo truyện từ điều ước.', { signal }),
  /** Gửi form (đã chỉnh) vào luồng sinh truyện; trừ 1 lượt. Chỉ dùng khi điều ước còn Pending. */
  createStory: (wishId: number, body: SubmitAIStoryInputRequestDto, signal?: AbortSignal) =>
    apiRequest<W.ParentWishCreateStoryResultDto>(`/parent/wishes/${wishId}/create-story`, 'Không gửi được yêu cầu tạo truyện.', { method: 'POST', body, signal }),
  /** Dùng truyện gợi ý theo thứ hạng 1–3; không trừ lượt. Không áp dụng cho truyện cộng đồng. */
  useExisting: (wishId: number, suggestionRank: number) =>
    apiRequest<W.ParentWishDto>(`/parent/wishes/${wishId}/use-existing`, 'Không dùng được truyện này.', { method: 'POST', body: { suggestionRank } }),
  decline: (wishId: number, reason: string) =>
    apiRequest<W.ParentWishDto>(`/parent/wishes/${wishId}/decline`, 'Không từ chối được điều ước.', { method: 'POST', body: { reason: reason.trim() || null } }),
};
