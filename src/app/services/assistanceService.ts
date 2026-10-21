import type { PagedResult } from '@/app/types/story';
import type { CreatorResult } from '@/app/types/creator';
import type {
  AssistanceCommandResult, AssistanceConstraints, AssistanceStep, AssistanceTask, AuthoringGuide, CreateAssistanceInput,
} from '@/app/types/assistance';
import { newOperationId, send } from './creatorService';

/**
 * AI hỗ trợ khi soạn: `/creator/stories/{id}/assistance-tasks` hoặc `/parent/stories/{id}/assistance-tasks`.
 * Mỗi lệnh có operationId mới và `expectedTaskRevision` lấy từ task mới nhất (không tự cộng 1).
 * Kết quả không ghi vào truyện; chỉ khi lưu phiên bản (kèm assistanceReferences) mới tạo phiên bản mới.
 */
export function assistanceApi(root: '/creator/stories' | '/parent/stories') {
  const base = (storyId: number) => `${root}/${storyId}/assistance-tasks`;
  const cmd = (kind: string, expectedTaskRevision: number) => ({ operationId: newOperationId(kind), expectedTaskRevision });
  return {
    create: (storyId: number, revisionToken: string, baseVersionId: number | null, input: CreateAssistanceInput): Promise<CreatorResult<AssistanceTask>> =>
      send(base(storyId), 'Chưa mở được phiên hỏi AI.', { method: 'POST', body: { operationId: newOperationId('task'), revisionToken, baseVersionId, ...input } }),

    get: (storyId: number, taskId: number): Promise<CreatorResult<AssistanceTask>> => send(`${base(storyId)}/${taskId}`, 'Không tải được phiên hỏi AI.'),

    steps: (storyId: number, taskId: number): Promise<CreatorResult<PagedResult<AssistanceStep>>> =>
      send(`${base(storyId)}/${taskId}/steps?pageSize=50`, 'Không tải được lịch sử.'),

    /** Lấy gợi ý (2–3 hướng), câu hỏi làm rõ, hoặc góp ý cả bản (ReviewDraft). */
    suggestions: (storyId: number, taskId: number, revision: number, answerStepId?: number): Promise<CreatorResult<AssistanceCommandResult>> =>
      send(`${base(storyId)}/${taskId}/suggestions`, 'AI chưa đưa ra gợi ý.', { method: 'POST', body: { ...cmd('suggest', revision), answerStepId: answerStepId ?? null } }),

    /** Trả lời câu hỏi làm rõ: đúng một trong choiceId / customAnswer / letAiPropose. Chỉ lưu, chưa gọi AI. */
    answer: (storyId: number, taskId: number, revision: number, clarificationStepId: number, questionId: string,
      a: { choiceId?: string; customAnswer?: string; letAiPropose?: boolean }): Promise<CreatorResult<AssistanceCommandResult>> =>
      send(`${base(storyId)}/${taskId}/clarification-answer`, 'Chưa lưu được câu trả lời.', {
        method: 'POST', body: { ...cmd('answer', revision), clarificationStepId, questionId, choiceId: a.choiceId ?? null, customAnswer: a.customAnswer ?? null, letAiPropose: !!a.letAiPropose },
      }),

    /** Chốt hướng (không gọi AI). Bỏ optionId khi tự nhập hướng; bỏ directionText khi giữ nguyên phương án. */
    direction: (storyId: number, taskId: number, revision: number, optionsStepId: number, optionId: string | null, directionText: string | null,
      confirmedConstraints: AssistanceConstraints = { keep: [], avoid: [] }): Promise<CreatorResult<AssistanceCommandResult>> =>
      send(`${base(storyId)}/${taskId}/direction`, 'Chưa chốt được hướng.', { method: 'POST', body: { ...cmd('direction', revision), optionsStepId, optionId, directionText, confirmedConstraints } }),

    /** AI viết thử một đoạn theo hướng đã chốt; trả patch để áp vào bản nháp. */
    trial: (storyId: number, taskId: number, revision: number, directionStepId: number): Promise<CreatorResult<AssistanceCommandResult>> =>
      send(`${base(storyId)}/${taskId}/trials`, 'AI chưa viết thử được.', { method: 'POST', body: { ...cmd('trial', revision), directionStepId } }),

    cancel: (storyId: number, taskId: number, revision: number, targetOperationId: string): Promise<CreatorResult<AssistanceCommandResult>> =>
      send(`${base(storyId)}/${taskId}/cancel`, 'Chưa dừng được.', { method: 'POST', body: { ...cmd('cancel', revision), targetOperationId } }),

    close: (storyId: number, taskId: number, revision: number): Promise<CreatorResult<AssistanceCommandResult>> =>
      send(`${base(storyId)}/${taskId}/close`, 'Chưa đóng được.', { method: 'POST', body: cmd('close', revision) }),
  };
}

export type AssistanceApi = ReturnType<typeof assistanceApi>;
export const creatorAssistance = assistanceApi('/creator/stories');
export const parentAssistance = assistanceApi('/parent/stories');

/** Mã lỗi AI hỗ trợ → câu dễ hiểu. */
export function describeAssistanceCode(code: string | undefined, fallback: string): string {
  const text: Record<string, string> = {
    TASK_REVISION_CONFLICT: 'Phiên hỏi AI vừa thay đổi. Đã tải lại, bạn thử lại nhé.',
    EDITOR_CONTEXT_STALE: 'Bản nháp đã đổi so với lúc hỏi AI. Hãy mở phiên hỏi mới.',
    AUDIENCE_CONTEXT_STALE: 'Cài đặt của bé đã đổi. Hãy mở phiên hỏi mới.',
    OPERATION_NOT_RUNNING: 'Lượt này đã xong hoặc đã dừng.',
    ASSISTANCE_RATE_LIMIT: 'Bạn hỏi AI hơi nhiều. Chờ khoảng một phút rồi thử lại.',
    AI_TIMEOUT: 'AI trả lời quá lâu. Bản nháp vẫn còn, bạn thử lại nhé.',
    AI_OUTPUT_INVALID: 'AI trả kết quả không dùng được. Thử lại nhé.',
    AI_OUTPUT_REJECTED: 'Kết quả của AI không qua kiểm tra an toàn nên đã bị loại. Thử diễn đạt mục tiêu khác.',
    AI_SERVICE_UNAVAILABLE: 'Dịch vụ AI đang gián đoạn. Bản nháp vẫn còn, thử lại sau nhé.',
    AI_OPERATION_CANCELLED: 'Đã dừng.',
    CONSENT_REQUIRED: 'Chủ tài khoản chưa đồng ý dùng AI cho bé, nên chưa hỏi AI được. Bạn vẫn tự viết bình thường.',
    CONSENT_OUTDATED: 'Đồng ý dùng AI của bé đã cũ, cần chủ tài khoản xác nhận lại.',
    PARENT_STORY_FINALIZED: 'Truyện đã giao cho con nên không hỏi AI được.',
  };
  return (code && text[code]) || fallback;
}

/** Kho hướng dẫn soạn của phụ huynh (`/authoring-guides`): câu gợi nghĩ và mẫu câu có chỗ điền. Không gọi AI. */
export const authoringGuideService = {
  list: (purpose?: string, group?: string): Promise<CreatorResult<{ items: AuthoringGuide[]; totalCount: number }>> => {
    const q = new URLSearchParams({ locale: 'vi', pageSize: '50', ...(purpose ? { purpose } : {}), ...(group ? { group } : {}) });
    return send(`/authoring-guides?${q}`, 'Không tải được gợi ý cách viết.');
  },
  /** Điền mẫu câu; trả văn bản thuần (không phải HTML). */
  render: (guideId: string, values: Record<string, string>): Promise<CreatorResult<{ text: string }>> =>
    send(`/authoring-guides/${encodeURIComponent(guideId)}/render`, 'Chưa điền được mẫu câu.', { method: 'POST', body: { values } }),
};
