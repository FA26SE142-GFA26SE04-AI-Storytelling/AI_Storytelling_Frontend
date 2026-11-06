import type { ApiResponse } from '@/app/types/auth';
import type { PagedResult, StoryDto, StoryFilterRequest } from '@/app/types/story';
import { apiRequest } from './apiClient';

/**
 * Luồng 2 — danh sách và chi tiết truyện (`/Story`).
 * Tạo / sửa / duyệt truyện đi qua `ai-story-input`, `stories/import` và `stories/{id}/review`;
 * các API cũ `POST/PUT /Story`, `PATCH /Story/{id}/publish` không còn dùng.
 * `DELETE /Story/{id}` vẫn còn: xóa mềm truyện AI của phụ huynh (chỉ tác giả; truyện thủ công không xóa được qua API này).
 */
export const storyService = {
  /**
   * Backend chưa có bộ lọc theo hồ sơ bé (`StoryDto` không có `childProfileId`), nên gọi theo người tạo truyện.
     */
  getStories(filter: StoryFilterRequest = {}): Promise<ApiResponse<PagedResult<StoryDto>>> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
    }
    const query = params.toString();
    return apiRequest(`/Story${query ? `?${query}` : ''}`, 'Không tải được danh sách truyện.');
  },

  getStoryById(id: number, signal?: AbortSignal): Promise<ApiResponse<StoryDto>> {
    return apiRequest(`/Story/${id}`, 'Không tìm thấy truyện.', {signal});
  },

  deleteStory(id: number): Promise<ApiResponse<boolean>> {
    return apiRequest(`/Story/${id}`, 'Không xóa được truyện.', { method: 'DELETE' });
  },
};
