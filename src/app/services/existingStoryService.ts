import { ApiResponse } from '../types/auth';
import {
  ImportStoryRequestDto,
  ImportStoryResponseDto,
  ExistingStoryEvaluationDto,
  AdaptExistingStoryRequestDto,
  ManualEditRequestDto,
  KeepOriginalRequestDto,
  ArchiveExistingStoryRequestDto,
  VersionMutationResponseDto,
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

export const existingStoryService = {
  /**
   * Import truyện dạng văn bản thô (POST /api/v1/stories/import)
   */
  async importStory(request: ImportStoryRequestDto): Promise<ApiResponse<ImportStoryResponseDto | null>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/stories/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await parseJsonResponse<ApiResponse<ImportStoryResponseDto>>(response);
      return (
        data ?? {
          success: response.ok,
          message: response.ok ? 'Import truyện thành công.' : 'Không thể import truyện.',
          data: null,
        }
      );
    } catch (error) {
      console.error('Import story error:', error);
      return {
        success: false,
        message: 'Lỗi khi import câu chuyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Import truyện qua tập tin văn bản (POST /api/v1/stories/import-file)
   */
  async importStoryFile(formData: FormData): Promise<ApiResponse<ImportStoryResponseDto | null>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/stories/import-file`, {
        method: 'POST',
        body: formData,
      });

      const data = await parseJsonResponse<ApiResponse<ImportStoryResponseDto>>(response);
      return (
        data ?? {
          success: response.ok,
          message: response.ok ? 'Import file thành công.' : 'Không thể import file truyện.',
          data: null,
        }
      );
    } catch (error) {
      console.error('Import story file error:', error);
      return {
        success: false,
        message: 'Lỗi tải lên tập tin truyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Đánh giá nội dung truyện (POST /api/v1/stories/{storyId}/existing/evaluate)
   */
  async evaluateStory(
    storyId: number,
    storyVersionId: number
  ): Promise<ApiResponse<ExistingStoryEvaluationDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/existing/evaluate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storyVersionId }),
        }
      );

      const data = await parseJsonResponse<ApiResponse<ExistingStoryEvaluationDto>>(response);
      return (
        data ?? {
          success: response.ok,
          message: response.ok ? 'Đánh giá hoàn tất.' : 'Không thể đánh giá truyện.',
          data: null,
        }
      );
    } catch (error) {
      console.error('Evaluate story error:', error);
      return {
        success: false,
        message: 'Lỗi đánh giá truyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy kết quả đánh giá mới nhất (GET /api/v1/stories/{storyId}/existing/evaluation)
   */
  async getLatestEvaluation(
    storyId: number,
    storyVersionId: number
  ): Promise<ApiResponse<ExistingStoryEvaluationDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/existing/evaluation?storyVersionId=${storyVersionId}`,
        {
          method: 'GET',
        }
      );

      const data = await parseJsonResponse<ApiResponse<ExistingStoryEvaluationDto>>(response);
      return data ?? { success: false, message: 'Lỗi nạp đánh giá.', data: null };
    } catch (error) {
      console.error('Get latest evaluation error:', error);
      return {
        success: false,
        message: 'Lỗi lấy kết quả đánh giá.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * AI Điều chỉnh nội dung phù hợp lứa tuổi (POST /api/v1/stories/{storyId}/existing/adapt)
   */
  async adaptStory(
    storyId: number,
    request: AdaptExistingStoryRequestDto
  ): Promise<ApiResponse<VersionMutationResponseDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/existing/adapt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      const data = await parseJsonResponse<ApiResponse<VersionMutationResponseDto>>(response);
      return (
        data ?? {
          success: response.ok,
          message: response.ok ? 'AI điều chỉnh thành công.' : 'Không thể điều chỉnh truyện.',
          data: null,
        }
      );
    } catch (error) {
      console.error('Adapt story error:', error);
      return {
        success: false,
        message: 'Lỗi AI điều chỉnh truyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Chỉnh sửa thủ công nội dung (PUT /api/v1/stories/{storyId}/existing/content)
   */
  async updateContent(
    storyId: number,
    request: ManualEditRequestDto
  ): Promise<ApiResponse<VersionMutationResponseDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/existing/content`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      const data = await parseJsonResponse<ApiResponse<VersionMutationResponseDto>>(response);
      return (
        data ?? {
          success: response.ok,
          message: response.ok ? 'Cập nhật nội dung thành công.' : 'Không thể cập nhật nội dung.',
          data: null,
        }
      );
    } catch (error) {
      console.error('Update content error:', error);
      return {
        success: false,
        message: 'Lỗi cập nhật nội dung.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Giữ nguyên bản gốc (POST /api/v1/stories/{storyId}/existing/keep-original)
   */
  async keepOriginal(
    storyId: number,
    request: KeepOriginalRequestDto
  ): Promise<ApiResponse<VersionMutationResponseDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/existing/keep-original`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      const data = await parseJsonResponse<ApiResponse<VersionMutationResponseDto>>(response);
      return (
        data ?? {
          success: response.ok,
          message: response.ok ? 'Giữ nguyên bản gốc thành công.' : 'Không thể lưu bản gốc.',
          data: null,
        }
      );
    } catch (error) {
      console.error('Keep original error:', error);
      return {
        success: false,
        message: 'Lỗi khi giữ bản gốc.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lưu trữ truyện (POST /api/v1/stories/{storyId}/existing/archive)
   */
  async archiveStory(
    storyId: number,
    request: ArchiveExistingStoryRequestDto
  ): Promise<ApiResponse<boolean>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/existing/archive`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      const data = await parseJsonResponse<ApiResponse<boolean>>(response);
      return data ?? { success: response.ok, message: 'Lưu trữ truyện.', data: response.ok };
    } catch (error) {
      console.error('Archive story error:', error);
      return {
        success: false,
        message: 'Lỗi khi lưu trữ truyện.',
        data: false,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },
};
