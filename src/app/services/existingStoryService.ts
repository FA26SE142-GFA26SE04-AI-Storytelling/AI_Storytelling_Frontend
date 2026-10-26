import type { ApiResponse } from '@/app/types/auth';
import type { ExistingStoryEvaluation, ImportStoryRequest, ImportStoryResponse, VersionMutationResponse } from '@/app/types/existingStory';
import type { StoryOutputMode } from '@/app/types/story';
import { apiRequest } from './apiClient';
import { API_BASE_URL } from './apiConfig';
import { authService } from './authService';

/** Luồng 2 nhánh Existing Story: nhập → đánh giá → AI Adapt / sửa tay / giữ bản gốc / lưu trữ. */
export const existingStoryService = {
  evaluation: (storyId: number, storyVersionId: number) => apiRequest<ExistingStoryEvaluation>(`/stories/${storyId}/existing/evaluation?storyVersionId=${storyVersionId}`, 'Không tải được đánh giá đã lưu.'),
  importStory(input: ImportStoryRequest): Promise<ApiResponse<ImportStoryResponse>> {
    return apiRequest('/stories/import', 'Không nhập được truyện.', { method: 'POST', body: { outputMode: 'learning', ...input, language: 'vi' } });
  },

  /** Nhập từ tệp .txt / .docx (tối đa 5 MB), gửi multipart/form-data. */
  async importFile(input: { file: File; title?: string; childProfileId: number; outputMode: StoryOutputMode; idempotencyKey: string }): Promise<ApiResponse<ImportStoryResponse>> {
    const form = new FormData();
    form.append('file', input.file);
    if (input.title) form.append('title', input.title);
    form.append('childProfileId', String(input.childProfileId));
    form.append('language', 'vi');
    form.append('outputMode', input.outputMode);
    form.append('idempotencyKey', input.idempotencyKey);
    const fallback = 'Không nhập được tệp truyện.';
    try {
      const res = await authService.authenticatedFetch(`${API_BASE_URL}/stories/import-file`, { method: 'POST', body: form });
      const text = await res.text();
      const parsed = text.trim() ? (JSON.parse(text) as Partial<ApiResponse<ImportStoryResponse>>) : null;
      if (parsed && typeof parsed.success === 'boolean') return { success: parsed.success && res.ok, message: parsed.message || (res.ok ? '' : fallback), data: parsed.data ?? null };
      return { success: false, message: fallback, data: null };
    } catch {
      return { success: false, message: fallback, data: null };
    }
  },

  evaluate(storyId: number, storyVersionId: number): Promise<ApiResponse<ExistingStoryEvaluation>> {
    return apiRequest(`/stories/${storyId}/existing/evaluate`, 'Chưa đánh giá được truyện.', { method: 'POST', body: { storyVersionId } });
  },

  /** AI chỉnh độ dài, từ vựng, độ khó; giữ nhân vật, cốt truyện, bài học. Tối đa 2 lần mỗi truyện. */
  adapt(storyId: number, baseStoryVersionId: number, guideline?: string): Promise<ApiResponse<VersionMutationResponse>> {
    return apiRequest(`/stories/${storyId}/existing/adapt`, 'AI chưa chỉnh được truyện.', { method: 'POST', body: { storyId, baseStoryVersionId, guideline } });
  },

  manualEdit(storyId: number, baseStoryVersionId: number, title: string, content: string, lesson: string): Promise<ApiResponse<VersionMutationResponse>> {
    return apiRequest(`/stories/${storyId}/existing/content`, 'Không lưu được bản sửa.', { method: 'PUT', body: { storyId, baseStoryVersionId, title, content, lesson } });
  },

  /** Giữ bản gốc (ghi lý do để audit) rồi chuyển sang tạo học liệu. */
  keepOriginal(storyId: number, storyVersionId: number, overrideReason: string): Promise<ApiResponse<VersionMutationResponse>> {
    return apiRequest(`/stories/${storyId}/existing/keep-original`, 'Không giữ được bản gốc.', { method: 'POST', body: { storyId, storyVersionId, overrideReason } });
  },

  archive(storyId: number, reason: string): Promise<ApiResponse<boolean>> {
    return apiRequest(`/stories/${storyId}/existing/archive`, 'Không lưu trữ được truyện.', { method: 'POST', body: { storyId, reason } });
  },
};

