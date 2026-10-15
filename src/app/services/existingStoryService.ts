import { USE_MOCK } from '@/app/mocks/config';
import { existingStoryMockOverrides } from '@/app/mocks/mockExistingStory';
import type { ApiResponse } from '@/app/types/auth';
import type { ExistingStoryEvaluation, ImportStoryRequest, ImportStoryResponse, VersionMutationResponse } from '@/app/types/existingStory';
import { apiRequest } from './apiClient';

/** Luồng 2 nhánh Existing Story: nhập → đánh giá → AI Adapt / sửa tay / giữ bản gốc / lưu trữ. */
export const existingStoryService = {
  importStory(input: ImportStoryRequest): Promise<ApiResponse<ImportStoryResponse>> {
    return apiRequest('/stories/import', 'Không nhập được truyện.', { method: 'POST', body: { ...input, language: 'vi' } });
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

if (USE_MOCK) Object.assign(existingStoryService, existingStoryMockOverrides);
