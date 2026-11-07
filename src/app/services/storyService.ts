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

  /** `GET /Story/community`: truyện của Creator đã được duyệt và công khai, cho mọi vai trò đăng nhập (User, Creator, Moderator, Admin). */
  getCommunityStories(filter: StoryFilterRequest = {}): Promise<ApiResponse<PagedResult<StoryDto>>> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
    }
    const query = params.toString();
    return apiRequest(`/Story/community${query ? `?${query}` : ''}`, 'Không tải được thư viện cộng đồng.');
  },

  getStoryById(id: number, signal?: AbortSignal): Promise<ApiResponse<StoryDto>> {
    return apiRequest(`/Story/${id}`, 'Không tìm thấy truyện.', {signal});
  },

  /**
   * `PUT /Story/{id}`: sửa thông tin chung của truyện AI do chính phụ huynh tạo. Gửi tên, mô tả, thể loại, ảnh bìa, độ tuổi, ngôn ngữ;
   * ảnh bìa chỉ gửi khi đổi (chuỗi rỗng = gỡ ảnh, backend coi null là giữ nguyên); nội dung và bài học để null nên backend giữ nguyên (nội dung phải sửa qua màn duyệt để tạo phiên bản mới).
   */
  updateStoryInfo(story: Pick<StoryDto, 'id' | 'ageBand' | 'language' | 'coverImageUrl'>, info: { title: string; description: string; genre: string; cover: string }): Promise<ApiResponse<StoryDto>> {
    return apiRequest(`/Story/${story.id}`, 'Không lưu được thông tin truyện.', {
      method: 'PUT',
      body: { title: info.title, description: info.description || null, genre: info.genre || null, content: null, coverImageUrl: info.cover === (story.coverImageUrl ?? '') ? null : info.cover, moralLesson: null, ageBand: story.ageBand, language: story.language || 'vi' },
    });
  },

  deleteStory(id: number): Promise<ApiResponse<boolean>> {
    return apiRequest(`/Story/${id}`, 'Không xóa được truyện.', { method: 'DELETE' });
  },
};
