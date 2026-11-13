import { apiQuery, apiRequest } from './apiClient';
import type { PagedResult } from '@/app/types/backendContracts';
import type * as W from '@/app/types/storyWish';

/** Moderator/Administrator quản lý bộ thẻ ước. Thẻ chỉ ẩn, không xóa. */
export const wishCardService = {
  list: (query: W.WishCardQueryDto, signal?: AbortSignal) =>
    apiRequest<PagedResult<W.WishCardDto>>(`/moderation/wish-cards${apiQuery(query)}`, 'Không tải được thẻ ước.', { signal }),
  get: (id: number, signal?: AbortSignal) =>
    apiRequest<W.WishCardDto>(`/moderation/wish-cards/${id}`, 'Không mở được thẻ ước.', { signal }),
  create: (body: W.CreateWishCardRequestDto) =>
    apiRequest<W.WishCardDto>('/moderation/wish-cards', 'Không tạo được thẻ ước.', { method: 'POST', body }),
  /** Không đổi được nhóm và trạng thái ẩn/hiện qua lệnh này. */
  update: (id: number, body: W.UpdateWishCardRequestDto) =>
    apiRequest<W.WishCardDto>(`/moderation/wish-cards/${id}`, 'Không lưu được thẻ ước.', { method: 'PUT', body }),
  setActive: (id: number, isActive: boolean) =>
    apiRequest<W.WishCardDto>(`/moderation/wish-cards/${id}/active`, 'Không đổi được trạng thái thẻ.', { method: 'PUT', body: { isActive } }),

  /** Thẻ gắn cho truyện, dùng để gợi ý truyện có sẵn khi bé ước. */
  storyCards: (storyId: number, signal?: AbortSignal) =>
    apiRequest<W.WishCardMatchDto[]>(`/moderation/stories/${storyId}/wish-cards`, 'Không tải được thẻ của truyện.', { signal }),
  /** Độ phủ thẻ của truyện: có đủ thẻ Nhân vật hoặc Nơi chốn để được gợi ý cho bé không; warning là cảnh báo từ máy chủ (hoặc null). */
  storyCoverage: (storyId: number, signal?: AbortSignal) =>
    apiRequest<W.StoryWishCardCoverageDto>(`/moderation/stories/${storyId}/wish-cards/coverage`, 'Không kiểm tra được độ phủ thẻ của truyện.', { signal }),
  addToStory: (storyId: number, wishCardId: number) =>
    apiRequest<W.WishCardMatchDto>(`/moderation/stories/${storyId}/wish-cards`, 'Không gắn được thẻ cho truyện.', { method: 'POST', body: { wishCardId } }),
  removeFromStory: (storyId: number, wishCardId: number) =>
    apiRequest<null>(`/moderation/stories/${storyId}/wish-cards/${wishCardId}`, 'Không gỡ được thẻ khỏi truyện.', { method: 'DELETE' }),
  /** AI đọc bản truyện rồi tự gắn các thẻ ước phù hợp (nguồn "Ai"); trả số thẻ đã thêm và đoạn trích làm bằng chứng. */
  aiMatch: (storyId: number, storyVersionId: number) =>
    apiRequest<W.StoryWishCardAiMatchResult>(`/moderation/stories/${storyId}/wish-cards/ai-match`, 'AI chưa gợi ý được thẻ cho truyện này.', { method: 'POST', body: { storyVersionId } }),
};
