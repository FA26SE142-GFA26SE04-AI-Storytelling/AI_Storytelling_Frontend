import { ApiResponse } from '../types/auth';
import * as D from '../types/aiStory';
import { authService } from './authService';
import { API_BASE_URL } from './apiConfig';
import { validStoryPayload } from './aiStoryContractValidation';

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  try { const text = await response.text(); return text.trim() ? JSON.parse(text) as T : null; }
  catch { return null; }
}

interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]> | string[];
}

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Dữ liệu tạo truyện chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Tài khoản không có quyền tạo truyện cho hồ sơ bé này.',
  404: 'Không tìm thấy hồ sơ bé hoặc yêu cầu tạo truyện.',
  409: 'Đang có một yêu cầu tạo truyện khác hoạt động. Vui lòng kiểm tra lại trạng thái.',
};

function problemErrors(problem: ProblemDetails): string[] | null {
  if (Array.isArray(problem.errors)) return problem.errors;
  if (!problem.errors) return null;
  const errors = Object.values(problem.errors).flat().filter(Boolean);
  return errors.length > 0 ? errors : null;
}

async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<ApiResponse<T>> {
  const body = await parseJsonResponse<unknown>(response);
  if (!body || typeof body !== 'object') {
    return {
      success: false,
      message: HTTP_ERROR_MESSAGES[response.status] ?? fallbackMessage,
      data: null,
      errors: [`HTTP ${response.status}: Phản hồi từ máy chủ không có dữ liệu hợp lệ.`],
    };
  }

  const candidate = body as Partial<ApiResponse<T>>;
  if (typeof candidate.success === 'boolean' && typeof candidate.message === 'string') {
    const hasData = candidate.data !== null && candidate.data !== undefined;
    return {
      success: response.ok && candidate.success && hasData,
      message: candidate.message || HTTP_ERROR_MESSAGES[response.status] || fallbackMessage,
      data: hasData ? (candidate.data as T) : null,
      errors: candidate.errors ?? null,
    };
  }

  const problem = body as ProblemDetails;
  const errors = problemErrors(problem);
  return {
    success: false,
    message:
      problem.detail ||
      (errors && errors.length > 0 ? errors[0] : undefined) ||
      HTTP_ERROR_MESSAGES[response.status] ||
      problem.title ||
      fallbackMessage,
    data: null,
    errors,
  };
}


async function request<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal, emptyAccepted = false): Promise<ApiResponse<T>> {
  try {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}${path}`, {
      method, signal, cache: 'no-store',
      ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
    // Only this endpoint's controller deliberately returns a bodyless Accepted.
    if (emptyAccepted && response.status === 202) return { success: true, message: 'Đã nhận yêu cầu.', data: null };
    const result = await parseApiResponse<T>(response, 'Không thể hoàn tất thao tác. Vui lòng kiểm tra lại.');
    if (result.data !== null && !validStoryPayload(path, result.data)) {
      return { success: false, data: null, message: 'Phản hồi từ máy chủ chưa đầy đủ. Vui lòng kiểm tra lại trạng thái.' };
    }
    return result;
  } catch (error) {
    return { success: false, message: signal?.aborted ? 'Đã dừng theo dõi.' : 'Không thể kết nối máy chủ. Vui lòng kiểm tra lại trạng thái trước khi gửi lại.',
      data: null, errors: [(error as Error).message || 'Network error'] };
  }
}
const story = (id: number) => `/stories/${id}`;
const review = (id: number) => `${story(id)}/review`;
const outline = (id: number) => `${story(id)}/outline`;

export const aiStoryCreationService = {
  getCreationContext: (id: number, signal?: AbortSignal) => request<D.AIStoryInputContextDto>(`/ai-story-input/children/${id}/context`, 'GET', undefined, signal),
  submitInput: (input: D.SubmitAIStoryInputRequestDto, signal?: AbortSignal) => request<D.AIStoryInputProgressDto>('/ai-story-input/requests', 'POST', input, signal),
  getInputProgress: (id: number, requestId: number, signal?: AbortSignal) => request<D.AIStoryInputProgressDto>(`/ai-story-input/stories/${id}/requests/${requestId}`, 'GET', undefined, signal),
  retryInput: (id: number, requestId: number, input: D.RetryAIStoryInputRequestDto, signal?: AbortSignal) => request<D.AIStoryInputProgressDto>(`/ai-story-input/stories/${id}/requests/${requestId}/retry`, 'POST', input, signal),
  getOutline: (id: number, signal?: AbortSignal) => request<D.OutlineProgressDto>(outline(id), 'GET', undefined, signal),
  getOutlineVersions: (id: number, signal?: AbortSignal) => request<D.OutlineVersionDto[]>(`${outline(id)}/versions`, 'GET', undefined, signal),
  getOutlineVersion: (id: number, version: number, signal?: AbortSignal) => request<D.OutlineVersionDto>(`${outline(id)}/versions/${version}`, 'GET', undefined, signal),
  editOutline: (id: number, version: number, input: D.EditOutlineRequestDto, signal?: AbortSignal) => request<D.OutlineVersionDto>(`${outline(id)}/versions/${version}`, 'PUT', input, signal),
  regenerateOutline: (id: number, version: number, input: D.RegenerateOutlineRequestDto, signal?: AbortSignal) => request<D.OutlineProgressDto>(`${outline(id)}/versions/${version}/regenerate`, 'POST', input, signal),
  retryOutline: (id: number, input: D.RetryOutlineRequestDto, signal?: AbortSignal) => request<D.OutlineProgressDto>(`${outline(id)}/retry`, 'POST', input, signal),
  approveOutline: (id: number, version: number, input: D.ApproveOutlineRequestDto, signal?: AbortSignal) => request<D.OutlineProgressDto>(`${outline(id)}/versions/${version}/approve`, 'POST', input, signal),
  rejectOutline: (id: number, version: number, input: D.RejectOutlineRequestDto, signal?: AbortSignal) => request<D.OutlineProgressDto>(`${outline(id)}/versions/${version}/reject`, 'POST', input, signal),
  getGenerationProgress: (id: number, signal?: AbortSignal) => request<D.ContentGenerationProgressDto>(`${story(id)}/generation/progress`, 'GET', undefined, signal),
  retryGeneration: (id: number, input: { retryKey: string }, signal?: AbortSignal) => request<D.ContentGenerationProgressDto>(`${story(id)}/generation/retry`, 'POST', input, signal),
  getReviewPackage: (id: number, signal?: AbortSignal) => request<D.ReviewPackageDto>(review(id), 'GET', undefined, signal),
  generateArtifacts: (id: number, input?: D.GenerateArtifactsRequestDto, signal?: AbortSignal) => request<D.ArtifactGenerationResultDto>(`${review(id)}/artifacts/generate`, 'POST', input ?? {}, signal),
  getStoryReview: (id: number, signal?: AbortSignal) => request<D.StoryReviewDto>(`${review(id)}/story`, 'GET', undefined, signal),
  updateStoryReview: (id: number, input: D.UpdateStoryReviewRequestDto, signal?: AbortSignal) => request<D.StoryReviewDto>(`${review(id)}/story`, 'PUT', input, signal),
  getVocabularyReview: (id: number, signal?: AbortSignal) => request<D.VocabularyReviewDto>(`${review(id)}/vocabulary`, 'GET', undefined, signal),
  updateVocabularyReview: (id: number, input: D.UpdateVocabularyRequestDto, signal?: AbortSignal) => request<D.VocabularyReviewDto>(`${review(id)}/vocabulary`, 'PUT', input, signal),
  getQuizReview: (id: number, signal?: AbortSignal) => request<D.QuizReviewDto>(`${review(id)}/quiz`, 'GET', undefined, signal),
  updateQuizReview: (id: number, input: D.UpdateQuizRequestDto, signal?: AbortSignal) => request<D.QuizReviewDto>(`${review(id)}/quiz`, 'PUT', input, signal),
  getDiscussionReview: (id: number, signal?: AbortSignal) => request<D.DiscussionReviewDto>(`${review(id)}/discussion`, 'GET', undefined, signal),
  updateDiscussionReview: (id: number, input: D.UpdateDiscussionRequestDto, signal?: AbortSignal) => request<D.DiscussionReviewDto>(`${review(id)}/discussion`, 'PUT', input, signal),
  completeStoryReview: (id: number, signal?: AbortSignal) => request<boolean>(`${review(id)}/story/complete`, 'POST', undefined, signal),
  completeReview: (id: number, artifact: D.ReviewArtifact, signal?: AbortSignal) => request<boolean>(`${review(id)}/${artifact}/complete`, 'POST', undefined, signal),
  validateReview: (id: number, signal?: AbortSignal) => request<D.ValidationResultDto>(`${review(id)}/validation`, 'GET', undefined, signal),
  approveStory: (id: number, signal?: AbortSignal) => request<D.ApproveResponseDto>(`${review(id)}/approve`, 'POST', undefined, signal),
  archiveStory: (id: number, input: D.ArchiveRequestDto, signal?: AbortSignal) => request<D.ArchiveResponseDto>(`${review(id)}/archive`, 'POST', input, signal),
  partialEditStory: (id: number, input: D.PartialEditRequestDto, signal?: AbortSignal) => request<D.CreateProposalResponseDto>(`${review(id)}/story/ai/partial-edit`, 'POST', input, signal),
  regenerateReviewArtifact: (id: number, artifact: Exclude<D.ReviewArtifact, 'story'>, signal?: AbortSignal) => request<D.CreateProposalResponseDto>(`${review(id)}/${artifact}/ai/regenerate`, 'POST', undefined, signal),
  getProposal: (id: number, proposalId: string, signal?: AbortSignal) => request<D.AIProposalDto>(`${review(id)}/proposals/${encodeURIComponent(proposalId)}`, 'GET', undefined, signal),
  applyProposal: (id: number, proposalId: string, signal?: AbortSignal) => request<D.ApplyDiscardResponseDto>(`${review(id)}/proposals/${encodeURIComponent(proposalId)}/apply`, 'POST', undefined, signal),
  discardProposal: (id: number, proposalId: string, signal?: AbortSignal) => request<D.ApplyDiscardResponseDto>(`${review(id)}/proposals/${encodeURIComponent(proposalId)}/discard`, 'POST', undefined, signal),
  getMediaProgress: (id: number, signal?: AbortSignal) => request<D.MediaProgressDto>(`${story(id)}/media/progress`, 'GET', undefined, signal),
  getMediaPackage: (id: number, signal?: AbortSignal) => request<D.StoryMediaPackage>(`${story(id)}/media/package`, 'GET', undefined, signal),
  retryMedia: (id: number, signal?: AbortSignal) => request<D.MediaProgressDto>(`${story(id)}/media/retry`, 'POST', undefined, signal),
  regenerateIllustration: (id: number, beatId: number, signal?: AbortSignal) => request<null>(`${story(id)}/media/illustration-beats/${beatId}/regenerate`, 'POST', undefined, signal, true),
};
