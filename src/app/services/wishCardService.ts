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
  addToStory: (storyId: number, wishCardId: number) =>
    apiRequest<W.WishCardMatchDto>(`/moderation/stories/${storyId}/wish-cards`, 'Không gắn được thẻ cho truyện.', { method: 'POST', body: { wishCardId } }),
  removeFromStory: (storyId: number, wishCardId: number) =>
    apiRequest<null>(`/moderation/stories/${storyId}/wish-cards/${wishCardId}`, 'Không gỡ được thẻ khỏi truyện.', { method: 'DELETE' }),
};
