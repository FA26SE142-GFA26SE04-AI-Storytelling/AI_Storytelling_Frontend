import type * as B from '@/app/types/backendContracts';
import { apiRequest, apiQuery } from './apiClient';
const root = (id: number) => `/creator/stories/${id}`;
export const creatorPublicationService = {
  confirmManual: (id: number, body: B.ConfirmManualContentRequest) => apiRequest<B.ConfirmManualContentResult>(`${root(id)}/manual/confirm-content`, 'Không chốt được nội dung thủ công.', { method: 'POST', body }),
  status: (id: number, signal?: AbortSignal) => apiRequest<B.CreatorPublicationStatus>(`${root(id)}/publication`, 'Không tải được trạng thái phát hành.', { signal }),
  check: (id: number, versionId: number) => apiRequest<B.GrayZoneContentCheckDto>(`${root(id)}/content/check`, 'Không kiểm tra được nội dung.', { method: 'POST', body: { versionId } }),
  /** `contentCategoryIds`: nhãn nội dung Creator đề xuất; backend bắt buộc có ít nhất một nhãn. */
  submit: (storyId: number, storyVersionId: number, contentCategoryIds: number[]) => {
    if (!Array.isArray(contentCategoryIds) || !contentCategoryIds.length || contentCategoryIds.some(id => !Number.isSafeInteger(id) || id < 1))
      return Promise.resolve({ success: false, status: 400, message: 'Hãy chọn ít nhất một nhãn nội dung hợp lệ.', data: null });
    const body: B.SubmitPublicStoryRequestDto = { storyId, storyVersionId, contentCategoryIds: [...new Set(contentCategoryIds)] };
    return apiRequest<B.PublicStorySubmissionResultDto>('/PublicStorySubmission/submit', 'Không gửi được truyện đi duyệt.', { method: 'POST', body });
  },
  /** Creator 'choose': tải file của mình cho một tranh (beat) hoặc một đoạn giọng đọc (segment). */
  uploadMedia: (id: number, kind: 'image' | 'audio', targetId: number, file: File, command: B.CreatorMediaCommand, decl: { sourceDeclaration: string; rightsDeclaration: string }) => {
    const form = new FormData();
    form.append('file', file);
    // Gửi đủ mọi trường, kể cả expectedConfirmed = false.
    Object.entries({ ...command, ...decl }).forEach(([k, v]) => form.append(k, String(v)));
    return apiRequest<B.CreatorSelectedMedia>(`${root(id)}/media/${kind === 'image' ? 'illustration-beats' : 'segments'}/${targetId}/upload`, 'Chưa tải được tệp lên.', { method: 'POST', form });
  },
  /** Creator 'choose': nhờ AI tạo một tranh / một đoạn chưa chọn. */
  generateMedia: (id: number, kind: 'image' | 'audio', targetId: number, command: B.CreatorMediaCommand) =>
    apiRequest<B.CreatorSelectedMedia>(`${root(id)}/media/${kind === 'image' ? 'illustration-beats' : 'segments'}/${targetId}/generate`, 'Chưa nhờ AI tạo được.', { method: 'POST', body: command }),
  withdraw: (itemId: number) => apiRequest<B.PublicStorySubmissionResultDto>(`/PublicStorySubmission/${itemId}/withdraw`, 'Không rút được yêu cầu.', { method: 'POST' }),
  remove: (id: number, reason: string) => apiRequest<B.CreatorPublicationResult>(`${root(id)}/removal-requests`, 'Không yêu cầu gỡ được truyện.', { method: 'POST', body: { reason } }),
  revision: (id: number, sourceVersionId: number) => apiRequest<B.CreatorPublicationResult>(`${root(id)}/revisions`, 'Không tạo được phiên bản chỉnh sửa.', { method: 'POST', body: { sourceVersionId } }),
};
export const creatorInputService = {
  context: (ageBand: string, readingLevel: number, language: string, signal?: AbortSignal) => apiRequest<B.CreatorAIStoryInputContextDto>(`/creator/ai-story-input/context${apiQuery({ ageBand, readingLevel, language })}`, 'Không tải được bối cảnh sáng tác.', { signal }),
  submit: (body: B.SubmitCreatorAIStoryInputRequestDto, signal?: AbortSignal) => apiRequest<B.AIStoryInputProgressDto>('/creator/ai-story-input/requests', 'Không gửi được ý tưởng.', { method: 'POST', body, signal }),
  progress: (id: number, requestId: number, signal?: AbortSignal) => apiRequest<B.AIStoryInputProgressDto>(`/creator/ai-story-input/stories/${id}/requests/${requestId}`, 'Không kiểm tra được ý tưởng.', { signal }),
  retry: (id: number, requestId: number, body: B.RetryAIStoryInputRequestDto, signal?: AbortSignal) => apiRequest<B.AIStoryInputProgressDto>(`/creator/ai-story-input/stories/${id}/requests/${requestId}/retry`, 'Không thử lại được ý tưởng.', { method: 'POST', body, signal }),
};
