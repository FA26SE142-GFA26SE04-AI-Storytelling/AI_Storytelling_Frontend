import { ApiResponse } from '../types/auth';
import {
  StoryDto,
  StoryFilterRequest,
  PagedResult,
  CreateStoryRequest,
  UpdateStoryRequest,
} from '../types/story';
import { authService } from './authService';
import { API_BASE_URL } from './apiConfig';

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export const storyService = {
  /**
   * Lấy danh sách câu chuyện đã xuất bản có phân trang và bộ lọc (GET /api/v1/Story)
   */
  async getStories(filter?: StoryFilterRequest): Promise<ApiResponse<PagedResult<StoryDto>>> {
    try {
      const params = new URLSearchParams();
      if (filter?.search) params.append('search', filter.search);
      if (filter?.ageBand) params.append('ageBand', filter.ageBand);
      if (filter?.categoryId) params.append('categoryId', filter.categoryId.toString());
      if (filter?.status) params.append('status', filter.status);
      if (filter?.childProfileId) params.append('childProfileId', filter.childProfileId.toString());
      if (filter?.sortBy) params.append('sortBy', filter.sortBy);
      if (filter?.sortDescending !== undefined) params.append('sortDescending', String(filter.sortDescending));
      if (filter?.pageNumber) params.append('pageNumber', filter.pageNumber.toString());
      if (filter?.pageSize) params.append('pageSize', filter.pageSize.toString());

      const url = `${API_BASE_URL}/Story${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Không thể tải danh sách câu chuyện.',
          data: {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 10,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        };
      }

      const data = await parseJsonResponse<ApiResponse<PagedResult<StoryDto>>>(response);
      return (
        data ?? {
          success: true,
          message: '',
          data: {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 10,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        }
      );
    } catch (error) {
      console.error('Get stories error:', error);
      return {
        success: false,
        message: 'Lỗi tải danh sách truyện từ Backend.',
        data: {
          items: [],
          totalCount: 0,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy chi tiết câu chuyện theo ID (GET /api/v1/Story/{id})
   */
  async getStoryById(id: number): Promise<ApiResponse<StoryDto | null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Story/${id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Không tìm thấy câu chuyện.',
          data: null,
        };
      }

      const data = await parseJsonResponse<ApiResponse<StoryDto>>(response);
      return data ?? { success: false, message: 'Lỗi nạp truyện', data: null };
    } catch (error) {
      console.error('Get story by id error:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi lấy chi tiết truyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Tạo câu chuyện mới (POST /api/v1/Story) — Yêu cầu quyền Parent/Teacher
   */
  async createStory(request: CreateStoryRequest): Promise<ApiResponse<StoryDto | null>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/Story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await parseJsonResponse<ApiResponse<StoryDto>>(response);
      return data ?? {
        success: response.ok,
        message: response.ok ? 'Tạo câu chuyện thành công.' : 'Không thể tạo câu chuyện.',
        data: null,
      };
    } catch (error) {
      console.error('Create story error:', error);
      return {
        success: false,
        message: 'Không thể tạo câu chuyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Cập nhật câu chuyện (PUT /api/v1/Story/{id})
   */
  async updateStory(id: number, request: UpdateStoryRequest): Promise<ApiResponse<StoryDto | null>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/Story/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await parseJsonResponse<ApiResponse<StoryDto>>(response);
      return data ?? {
        success: response.ok,
        message: response.ok ? 'Cập nhật truyện thành công.' : 'Không thể cập nhật truyện.',
        data: null,
      };
    } catch (error) {
      console.error('Update story error:', error);
      return {
        success: false,
        message: 'Không thể cập nhật truyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Xóa câu chuyện (DELETE /api/v1/Story/{id})
   */
  async deleteStory(id: number): Promise<ApiResponse<boolean>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/Story/${id}`, {
        method: 'DELETE',
      });

      const data = await parseJsonResponse<ApiResponse<boolean>>(response);
      return data ?? {
        success: response.ok,
        message: response.ok ? 'Xóa truyện thành công.' : 'Không thể xóa truyện.',
        data: response.ok,
      };
    } catch (error) {
      console.error('Delete story error:', error);
      return {
        success: false,
        message: 'Không thể xóa truyện.',
        data: false,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Phát hành câu chuyện công khai (PATCH /api/v1/Story/{id}/publish)
   */
  async publishStory(id: number): Promise<ApiResponse<boolean>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/Story/${id}/publish`, {
        method: 'PATCH',
      });

      const data = await parseJsonResponse<ApiResponse<boolean>>(response);
      return data ?? {
        success: response.ok,
        message: response.ok ? 'Phát hành truyện thành công.' : 'Không thể phát hành truyện.',
        data: response.ok,
      };
    } catch (error) {
      console.error('Publish story error:', error);
      return {
        success: false,
        message: 'Không thể phát hành truyện.',
        data: false,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },
};
