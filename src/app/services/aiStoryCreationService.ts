import { ApiResponse } from '../types/auth';
import {
  AIStoryInputContextDto,
  SubmitAIStoryInputRequest,
  AIStoryInputProgressDto,
  RetryAIStoryInputRequestDto,
  OutlineProgressDto,
  OutlineVersionDto,
  EditOutlineRequestDto,
  RegenerateOutlineRequestDto,
  RetryOutlineRequestDto,
  ApproveOutlineRequestDto,
  RejectOutlineRequestDto,
  ContentGenerationProgressDto,
  ReviewPackageDto,
  StoryReviewDto,
  VocabularyReviewDto,
  QuizReviewDto,
  DiscussionReviewDto,
  ValidationResultDto,
  AIProposalDto,
  PartialEditRequestDto,
  UpdateStoryReviewRequestDto,
  UpdateVocabularyRequestDto,
  UpdateQuizRequestDto,
  UpdateDiscussionRequestDto,
  GenerateArtifactsRequestDto,
  ArtifactGenerationResultDto,
  ApproveResponseDto,
  ArchiveRequestDto,
  ArchiveResponseDto,
} from '../types/aiStory';
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

export const aiStoryCreationService = {
  // ==========================================
  // PHASE 1: AI STORY INPUT & SAFETY CHECK
  // ==========================================

  /**
   * Lấy ngữ cảnh cá nhân hóa của trẻ để chuẩn bị tạo truyện (GET /api/v1/ai-story-input/children/{childProfileId}/context)
   */
  async getCreationContext(childProfileId: number): Promise<ApiResponse<AIStoryInputContextDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/ai-story-input/children/${childProfileId}/context`,
        { method: 'GET' }
      );
      const data = await parseJsonResponse<ApiResponse<AIStoryInputContextDto>>(response);
      return data ?? { success: false, message: 'Lỗi nạp thông tin sáng tạo.', data: null };
    } catch (error) {
      console.error('Get creation context error:', error);
      return {
        success: false,
        message: 'Không thể tải ngữ cảnh sáng tạo truyện của bé.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Gửi ý tưởng tạo truyện AI để kiểm duyệt an toàn (POST /api/v1/ai-story-input/requests)
   */
  async submitInput(request: SubmitAIStoryInputRequest): Promise<ApiResponse<AIStoryInputProgressDto | null>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/ai-story-input/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const data = await parseJsonResponse<ApiResponse<AIStoryInputProgressDto>>(response);
      return (
        data ?? {
          success: response.ok,
          message: response.ok ? 'Đã gửi yêu cầu sáng tạo.' : 'Không thể gửi yêu cầu tạo truyện.',
          data: null,
        }
      );
    } catch (error) {
      console.error('Submit AI story input error:', error);
      return {
        success: false,
        message: 'Lỗi gửi ý tưởng truyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy tiến độ kiểm duyệt an toàn (GET /api/v1/ai-story-input/stories/{storyId}/requests/{requestId})
   */
  async getInputProgress(
    storyId: number,
    requestId: number
  ): Promise<ApiResponse<AIStoryInputProgressDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/ai-story-input/stories/${storyId}/requests/${requestId}`,
        { method: 'GET' }
      );
      const data = await parseJsonResponse<ApiResponse<AIStoryInputProgressDto>>(response);
      return data ?? { success: false, message: 'Lỗi nạp trạng thái kiểm duyệt.', data: null };
    } catch (error) {
      console.error('Get input progress error:', error);
      return {
        success: false,
        message: 'Lỗi kiểm tra tiến độ ý tưởng.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Thử lại sau khi điều chỉnh ý tưởng an toàn (POST /api/v1/ai-story-input/stories/{storyId}/requests/{requestId}/retry)
   */
  async retryInput(
    storyId: number,
    requestId: number,
    request: RetryAIStoryInputRequestDto
  ): Promise<ApiResponse<AIStoryInputProgressDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/ai-story-input/stories/${storyId}/requests/${requestId}/retry`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
      const data = await parseJsonResponse<ApiResponse<AIStoryInputProgressDto>>(response);
      return data ?? { success: response.ok, message: 'Đã gửi lại yêu cầu.', data: null };
    } catch (error) {
      console.error('Retry AI story input error:', error);
      return {
        success: false,
        message: 'Lỗi khi gửi lại ý tưởng truyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  // ==========================================
  // PHASE 2: OUTLINE GENERATION & REFINEMENT
  // ==========================================

  /**
   * Lấy dàn ý hiện tại của câu chuyện (GET /api/v1/stories/{storyId}/outline)
   */
  async getOutline(storyId: number): Promise<ApiResponse<OutlineProgressDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/outline`,
        { method: 'GET' }
      );
      const data = await parseJsonResponse<ApiResponse<OutlineProgressDto>>(response);
      return data ?? { success: false, message: 'Lỗi nạp dàn ý.', data: null };
    } catch (error) {
      console.error('Get outline error:', error);
      return {
        success: false,
        message: 'Không thể tải dàn ý câu chuyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy danh sách các phiên bản dàn ý (GET /api/v1/stories/{storyId}/outline/versions)
   */
  async getOutlineVersions(storyId: number): Promise<ApiResponse<OutlineVersionDto[]>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/outline/versions`,
        { method: 'GET' }
      );
      const data = await parseJsonResponse<ApiResponse<OutlineVersionDto[]>>(response);
      return data ?? { success: true, message: '', data: [] };
    } catch (error) {
      console.error('Get outline versions error:', error);
      return { success: false, message: 'Lỗi lấy phiên bản dàn ý.', data: [] };
    }
  },

  /**
   * Chỉnh sửa dàn ý (PUT /api/v1/stories/{storyId}/outline/versions/{versionNo})
   */
  async editOutline(
    storyId: number,
    versionNo: number,
    input: EditOutlineRequestDto
  ): Promise<ApiResponse<OutlineVersionDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/outline/versions/${versionNo}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const data = await parseJsonResponse<ApiResponse<OutlineVersionDto>>(response);
      return data ?? { success: response.ok, message: 'Cập nhật dàn ý thành công.', data: null };
    } catch (error) {
      console.error('Edit outline error:', error);
      return {
        success: false,
        message: 'Lỗi cập nhật dàn ý.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Yêu cầu AI tạo lại dàn ý (POST /api/v1/stories/{storyId}/outline/versions/{versionNo}/regenerate)
   */
  async regenerateOutline(
    storyId: number,
    versionNo: number,
    input: RegenerateOutlineRequestDto
  ): Promise<ApiResponse<OutlineProgressDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/outline/versions/${versionNo}/regenerate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const data = await parseJsonResponse<ApiResponse<OutlineProgressDto>>(response);
      return data ?? { success: response.ok, message: 'Đã gửi yêu cầu tạo lại dàn ý.', data: null };
    } catch (error) {
      console.error('Regenerate outline error:', error);
      return {
        success: false,
        message: 'Lỗi tạo lại dàn ý.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Phê duyệt dàn ý để bắt đầu tạo nội dung chi tiết (POST /api/v1/stories/{storyId}/outline/versions/{versionNo}/approve)
   */
  async approveOutline(
    storyId: number,
    versionNo: number,
    input?: ApproveOutlineRequestDto
  ): Promise<ApiResponse<OutlineProgressDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/outline/versions/${versionNo}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input || {}),
        }
      );
      const data = await parseJsonResponse<ApiResponse<OutlineProgressDto>>(response);
      return data ?? { success: response.ok, message: 'Duyệt dàn ý thành công.', data: null };
    } catch (error) {
      console.error('Approve outline error:', error);
      return {
        success: false,
        message: 'Lỗi duyệt dàn ý.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Từ chối dàn ý (POST /api/v1/stories/{storyId}/outline/versions/{versionNo}/reject)
   */
  async rejectOutline(
    storyId: number,
    versionNo: number,
    input: RejectOutlineRequestDto
  ): Promise<ApiResponse<OutlineProgressDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/outline/versions/${versionNo}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const data = await parseJsonResponse<ApiResponse<OutlineProgressDto>>(response);
      return data ?? { success: response.ok, message: 'Đã từ chối dàn ý.', data: null };
    } catch (error) {
      console.error('Reject outline error:', error);
      return {
        success: false,
        message: 'Lỗi từ chối dàn ý.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  // ==========================================
  // PHASE 3: CONTENT GENERATION MONITORING
  // ==========================================

  /**
   * Theo dõi tiến độ AI viết truyện (GET /api/v1/stories/{storyId}/generation/progress)
   */
  async getGenerationProgress(storyId: number): Promise<ApiResponse<ContentGenerationProgressDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/generation/progress`,
        { method: 'GET' }
      );
      const data = await parseJsonResponse<ApiResponse<ContentGenerationProgressDto>>(response);
      return data ?? { success: false, message: 'Lỗi theo dõi tiến độ.', data: null };
    } catch (error) {
      console.error('Get generation progress error:', error);
      return {
        success: false,
        message: 'Không thể theo dõi tiến độ tạo truyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  // ==========================================
  // PHASE 4: REVIEW & APPROVAL PACKAGE
  // ==========================================

  /**
   * Lấy gói đánh giá hoàn chỉnh (GET /api/v1/stories/{storyId}/review)
   */
  async getReviewPackage(storyId: number): Promise<ApiResponse<ReviewPackageDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review`,
        { method: 'GET' }
      );
      const data = await parseJsonResponse<ApiResponse<ReviewPackageDto>>(response);
      return data ?? { success: false, message: 'Lỗi nạp gói đánh giá.', data: null };
    } catch (error) {
      console.error('Get review package error:', error);
      return {
        success: false,
        message: 'Lỗi khi tải gói kiểm duyệt truyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Tạo các tài liệu học tập (Từ vựng, Câu đố, Chủ đề trò chuyện) (POST /api/v1/stories/{storyId}/review/artifacts/generate)
   */
  async generateArtifacts(
    storyId: number,
    input?: GenerateArtifactsRequestDto
  ): Promise<ApiResponse<ArtifactGenerationResultDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/artifacts/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input || {}),
        }
      );
      const data = await parseJsonResponse<ApiResponse<ArtifactGenerationResultDto>>(response);
      return data ?? { success: response.ok, message: 'Tạo tài liệu học tập thành công.', data: null };
    } catch (error) {
      console.error('Generate artifacts error:', error);
      return {
        success: false,
        message: 'Lỗi tạo tài liệu học tập.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy nội dung truyện để review (GET /api/v1/stories/{storyId}/review/story)
   */
  async getStoryReview(storyId: number): Promise<ApiResponse<StoryReviewDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/story`,
        { method: 'GET' }
      );
      const data = await parseJsonResponse<ApiResponse<StoryReviewDto>>(response);
      return data ?? { success: false, message: 'Lỗi nạp truyện review.', data: null };
    } catch (error) {
      console.error('Get story review error:', error);
      return {
        success: false,
        message: 'Lỗi tải nội dung truyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Cập nhật nội dung truyện thủ công (PUT /api/v1/stories/{storyId}/review/story)
   */
  async updateStoryReview(
    storyId: number,
    input: UpdateStoryReviewRequestDto
  ): Promise<ApiResponse<StoryReviewDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/story`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const data = await parseJsonResponse<ApiResponse<StoryReviewDto>>(response);
      return data ?? { success: response.ok, message: 'Cập nhật truyện thành công.', data: null };
    } catch (error) {
      console.error('Update story review error:', error);
      return {
        success: false,
        message: 'Lỗi cập nhật nội dung truyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Yêu cầu AI chỉnh sửa một đoạn câu chuyện (POST /api/v1/stories/{storyId}/review/story/ai/partial-edit)
   */
  async partialEditStory(
    storyId: number,
    input: PartialEditRequestDto
  ): Promise<ApiResponse<{ proposalId: string } | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/story/ai/partial-edit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const data = await parseJsonResponse<ApiResponse<{ proposalId: string }>>(response);
      return data ?? { success: response.ok, message: 'Đã tạo đề xuất chỉnh sửa.', data: null };
    } catch (error) {
      console.error('Partial edit story error:', error);
      return {
        success: false,
        message: 'Lỗi yêu cầu chỉnh sửa AI.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Hoàn tất review nội dung truyện (POST /api/v1/stories/{storyId}/review/story/complete)
   */
  async completeStoryReview(storyId: number): Promise<ApiResponse<boolean>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/story/complete`,
        { method: 'POST' }
      );
      const data = await parseJsonResponse<ApiResponse<boolean>>(response);
      return data ?? { success: response.ok, message: 'Đã hoàn tất duyệt truyện.', data: response.ok };
    } catch (error) {
      console.error('Complete story review error:', error);
      return { success: false, message: 'Lỗi hoàn tất duyệt truyện.', data: false };
    }
  },

  /**
   * Lấy danh sách từ vựng review (GET /api/v1/stories/{storyId}/review/vocabulary)
   */
  async getVocabularyReview(storyId: number): Promise<ApiResponse<VocabularyReviewDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/vocabulary`,
        { method: 'GET' }
      );
      const data = await parseJsonResponse<ApiResponse<VocabularyReviewDto>>(response);
      return data ?? { success: false, message: 'Lỗi nạp từ vựng.', data: null };
    } catch (error) {
      console.error('Get vocabulary review error:', error);
      return {
        success: false,
        message: 'Lỗi tải danh sách từ vựng.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Cập nhật danh sách từ vựng (PUT /api/v1/stories/{storyId}/review/vocabulary)
   */
  async updateVocabularyReview(
    storyId: number,
    input: UpdateVocabularyRequestDto
  ): Promise<ApiResponse<VocabularyReviewDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/vocabulary`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const data = await parseJsonResponse<ApiResponse<VocabularyReviewDto>>(response);
      return data ?? { success: response.ok, message: 'Đã cập nhật từ vựng.', data: null };
    } catch (error) {
      console.error('Update vocabulary review error:', error);
      return {
        success: false,
        message: 'Lỗi cập nhật từ vựng.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy danh sách câu đố quiz review (GET /api/v1/stories/{storyId}/review/quiz)
   */
  async getQuizReview(storyId: number): Promise<ApiResponse<QuizReviewDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/quiz`,
        { method: 'GET' }
      );
      const data = await parseJsonResponse<ApiResponse<QuizReviewDto>>(response);
      return data ?? { success: false, message: 'Lỗi nạp câu đố.', data: null };
    } catch (error) {
      console.error('Get quiz review error:', error);
      return {
        success: false,
        message: 'Lỗi tải câu đố kiểm tra.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy danh sách gợi ý trò chuyện (GET /api/v1/stories/{storyId}/review/discussion)
   */
  async getDiscussionReview(storyId: number): Promise<ApiResponse<DiscussionReviewDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/discussion`,
        { method: 'GET' }
      );
      const data = await parseJsonResponse<ApiResponse<DiscussionReviewDto>>(response);
      return data ?? { success: false, message: 'Lỗi nạp chủ đề thảo luận.', data: null };
    } catch (error) {
      console.error('Get discussion review error:', error);
      return {
        success: false,
        message: 'Lỗi tải chủ đề trò chuyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Kiểm tra điều kiện phê duyệt (GET /api/v1/stories/{storyId}/review/validation)
   */
  async validateReview(storyId: number): Promise<ApiResponse<ValidationResultDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/validation`,
        { method: 'GET' }
      );
      const data = await parseJsonResponse<ApiResponse<ValidationResultDto>>(response);
      return data ?? { success: false, message: 'Lỗi xác thực.', data: null };
    } catch (error) {
      console.error('Validate review error:', error);
      return {
        success: false,
        message: 'Lỗi kiểm tra điều kiện phê duyệt.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Phê duyệt câu chuyện chính thức (POST /api/v1/stories/{storyId}/review/approve)
   */
  async approveStory(storyId: number): Promise<ApiResponse<ApproveResponseDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/approve`,
        { method: 'POST' }
      );
      const data = await parseJsonResponse<ApiResponse<ApproveResponseDto>>(response);
      return data ?? { success: response.ok, message: 'Phê duyệt truyện thành công.', data: null };
    } catch (error) {
      console.error('Approve story error:', error);
      return {
        success: false,
        message: 'Lỗi khi phê duyệt câu chuyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lưu trữ câu chuyện (POST /api/v1/stories/{storyId}/review/archive)
   */
  async archiveStory(
    storyId: number,
    input: ArchiveRequestDto
  ): Promise<ApiResponse<ArchiveResponseDto | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/archive`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const data = await parseJsonResponse<ApiResponse<ArchiveResponseDto>>(response);
      return data ?? { success: response.ok, message: 'Lưu trữ truyện thành công.', data: null };
    } catch (error) {
      console.error('Archive review story error:', error);
      return {
        success: false,
        message: 'Lỗi lưu trữ câu chuyện.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Áp dụng đề xuất AI Proposal (POST /api/v1/stories/{storyId}/review/proposals/{proposalId}/apply)
   */
  async applyProposal(storyId: number, proposalId: string): Promise<ApiResponse<object | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/proposals/${proposalId}/apply`,
        { method: 'POST' }
      );
      const data = await parseJsonResponse<ApiResponse<object | null>>(response);
      return data ?? { success: response.ok, message: 'Đã áp dụng đề xuất.', data: null };
    } catch (error) {
      console.error('Apply proposal error:', error);
      return { success: false, message: 'Lỗi áp dụng đề xuất.', data: null };
    }
  },

  /**
   * Bỏ qua đề xuất AI Proposal (POST /api/v1/stories/{storyId}/review/proposals/{proposalId}/discard)
   */
  async discardProposal(storyId: number, proposalId: string): Promise<ApiResponse<object | null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/stories/${storyId}/review/proposals/${proposalId}/discard`,
        { method: 'POST' }
      );
      const data = await parseJsonResponse<ApiResponse<object | null>>(response);
      return data ?? { success: response.ok, message: 'Đã hủy đề xuất.', data: null };
    } catch (error) {
      console.error('Discard proposal error:', error);
      return { success: false, message: 'Lỗi hủy đề xuất.', data: null };
    }
  },
};
