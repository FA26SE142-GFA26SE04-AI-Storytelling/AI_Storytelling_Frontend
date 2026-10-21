import type { ApiResponse } from '@/app/types/auth';
import type { AIStoryCreativeInputDto, AIStoryInputProgressDto } from '@/app/types/aiStory';
import type { StoryOutputMode } from '@/app/types/story';
import { apiRequest } from './apiClient';

/**
 * Content Creator tạo truyện bằng AI (`/creator/ai-story-input`, docs CREATOR_AI_GENERATION_API_GUIDE.md).
 * Chỉ khác phụ huynh ở bước đầu vào: chọn nhóm tuổi + mức đọc thay cho hồ sơ bé. Các bước sau (dàn ý, nội dung,
 * duyệt, media) dùng chung `/stories/{id}/...`; bước cuối là xác nhận nội dung thay cho duyệt.
 */
export interface CreatorAiContext {
  ageBand: string;
  readingLevel: number;
  defaultLanguage: string;
  availableLanguages: string[];
  availableVocabularyLevels: string[];
  maximumLength: number;
  requiredApprovalMode: string;
  safetyScoreThreshold: number;
  blockedCategoryCodes: string[];
  availableOutputModes: string[];
}

export interface CreatorAiInput extends AIStoryCreativeInputDto {
  ageBand: '6-8' | '9-10';
  readingLevel: number;
  outputMode: StoryOutputMode;
}

const root = '/creator/ai-story-input';

export const creatorAiService = {
  context: (ageBand: string, readingLevel: number, language = 'vi'): Promise<ApiResponse<CreatorAiContext>> =>
    apiRequest(`${root}/context?ageBand=${encodeURIComponent(ageBand)}&readingLevel=${readingLevel}&language=${language}`, 'Không tải được cấu hình tạo truyện.'),

  /** 202 = đã nhận; 422 = bị chặn (data vẫn có trạng thái và lý do). Gửi lại đúng key + payload thì không tạo trùng. */
  submit: (input: CreatorAiInput, idempotencyKey: string): Promise<ApiResponse<AIStoryInputProgressDto>> =>
    apiRequest(`${root}/requests`, 'Chưa gửi được yêu cầu.', { method: 'POST', body: { ...input, idempotencyKey } }),

  progress: (storyId: number, requestId: number): Promise<ApiResponse<AIStoryInputProgressDto>> =>
    apiRequest(`${root}/stories/${storyId}/requests/${requestId}`, 'Không tải được trạng thái.'),

  retry: (storyId: number, requestId: number, input: AIStoryCreativeInputDto): Promise<ApiResponse<AIStoryInputProgressDto>> =>
    apiRequest(`${root}/stories/${storyId}/requests/${requestId}/retry`, 'Chưa thử lại được.', { method: 'POST', body: { ...input, retryKey: `retry-${crypto.randomUUID()}` } }),
};
