import type { PagedResult } from '@/app/types/story';
import type { CreatorDraft, CreatorResult } from '@/app/types/creator';
import type {
  CreateParentDraftInput, ParentCheck, ParentChecklist, ParentContentConfirmation, ParentDraft, ParentFamilyConfirmation,
  ParentOperation, ParentPreparation, WritingPurpose,
} from '@/app/types/parentAuthoring';
import { apiRequest } from './apiClient';
import { childAccessService } from './childAccessService';
import { authoringApi, newOperationId, send, type AuthoringApi } from './creatorService';

/**
 * Phụ huynh tự viết truyện cho con (`/parent/stories`). Dùng chung engine soạn với Content Creator.
 * Mọi lệnh ghi cần `operationId` mới, `revisionToken` và `baseVersionId` hiện tại của truyện.
 * Giao cho con xong thì truyện bị khoá (PARENT_STORY_FINALIZED); thu hồi lần giao cuối mới mở lại.
 */
const root = '/parent/stories';
const base = (id: number) => `${root}/${id}`;

/** Lệnh gắn với phiên bản: lấy revisionToken / bản hiện tại từ bản nháp mới nhất. */
const versionCmd = (draft: CreatorDraft, kind: string) => ({
  operationId: newOperationId(kind), revisionToken: draft.revisionToken, baseVersionId: draft.selectedVersionId,
});

export const parentAuthoringService = {
  ...authoringApi(root),

  list: (pageIndex = 1, pageSize = 50): Promise<CreatorResult<PagedResult<CreatorDraft>>> =>
    send(`${root}?pageIndex=${pageIndex}&pageSize=${pageSize}`, 'Không tải được danh sách truyện.'),

  detail: (storyId: number): Promise<CreatorResult<ParentDraft>> => send(base(storyId), 'Không mở được truyện.'),

  /** Cho trình soạn dùng chung: chỉ cần phần bản nháp. */
  get: async (storyId: number): Promise<CreatorResult<CreatorDraft>> => {
    const r = await send<ParentDraft>(base(storyId), 'Không mở được truyện.');
    return { ...r, data: r.data?.story ?? null };
  },

  create: (operationId: string, input: CreateParentDraftInput): Promise<CreatorResult<ParentDraft>> =>
    send(`${root}/manual`, 'Không tạo được truyện.', { method: 'POST', body: { operationId, ...input } }),

  workflow: (storyId: number): Promise<CreatorResult<ParentOperation[]>> => send(`${base(storyId)}/workflow`, 'Không tải được tiến trình.'),

  /** Đổi mục đích / ngôn ngữ / cách trải nghiệm. Đổi ngôn ngữ hoặc cách trải nghiệm phải kiểm tra lại. */
  setup: (storyId: number, draft: CreatorDraft, input: { purpose?: WritingPurpose; language?: string; experienceMode?: string }): Promise<CreatorResult<ParentDraft>> =>
    send(`${base(storyId)}/setup`, 'Chưa lưu được thiết lập.', { method: 'PATCH', body: { ...versionCmd(draft, 'setup'), ...input } }),

  /** Bước 1 — kiểm tra phiên bản đã lưu theo chính sách an toàn của bé. */
  check: (storyId: number, draft: CreatorDraft): Promise<CreatorResult<ParentCheck>> =>
    send(`${base(storyId)}/content/checks`, 'Chưa kiểm tra được.', { method: 'POST', body: versionCmd(draft, 'check') }),

  /** Bước 2 — phụ huynh tự xác nhận 4 mục. Không vượt được lỗi chính sách. */
  confirmContent: (storyId: number, draft: CreatorDraft, checkId: number, checklist: ParentChecklist): Promise<CreatorResult<ParentContentConfirmation>> =>
    send(`${base(storyId)}/content/confirm`, 'Chưa xác nhận được nội dung.', { method: 'POST', body: { ...versionCmd(draft, 'confirm'), checkId, checklist } }),

  /** Bước 3 — chia trang (mặc định theo đoạn văn). */
  prepare: (storyId: number, draft: CreatorDraft, contentConfirmationId: number): Promise<CreatorResult<ParentPreparation>> =>
    send(`${base(storyId)}/preparations`, 'Chưa chuẩn bị được bản đọc.', { method: 'POST', body: { ...versionCmd(draft, 'prepare'), contentConfirmationId } }),

  preparation: (storyId: number, preparationId: number): Promise<CreatorResult<ParentPreparation>> =>
    send(`${base(storyId)}/preparations/${preparationId}`, 'Không tải được bản xem trước.'),

  /** Bước 4 — giao cho con. Cần thêm quyền duyệt truyện và quản lý lộ trình của bé. */
  confirmFamily: (storyId: number, draft: CreatorDraft, preparationId: number): Promise<CreatorResult<ParentFamilyConfirmation>> =>
    send(`${base(storyId)}/family-confirmations`, 'Chưa giao được truyện cho con.', { method: 'POST', body: { ...versionCmd(draft, 'family'), preparationId } }),

  revoke: (storyId: number, draft: CreatorDraft, confirmationId: number): Promise<CreatorResult<boolean>> =>
    send(`${base(storyId)}/family-confirmations/revoke`, 'Chưa thu hồi được.', { method: 'POST', body: { ...versionCmd(draft, 'revoke'), confirmationId } }),
} satisfies AuthoringApi & Record<string, unknown>;

/** Bé đọc truyện bố mẹ tự viết. Chỉ nhận token phiên của bé. */
export const childManualStoryService = {
  /** null khi không có phiên bé (ví dụ phụ huynh mở Chế độ của bé từ tài khoản mình). */
  available: () => !!childAccessService.readSession()?.accessToken,

  list: () => apiRequest<ParentFamilyConfirmation[]>('/child/manual-stories', 'Không tải được truyện bố mẹ viết.', { token: childAccessService.readSession()?.accessToken }),

  package: (confirmationId: number) =>
    apiRequest<ParentPreparation>(`/child/manual-stories/${confirmationId}/package`, 'Không mở được truyện.', { token: childAccessService.readSession()?.accessToken }),
};

/** Mã lỗi / thiếu sót của backend → câu cho phụ huynh. */
export function describeParentCode(code: string): string {
  const [key, extra] = code.split(':');
  const text: Record<string, string> = {
    CHILD_CONTEXT_SETUP_REQUIRED: 'Cần thiết lập lại ngữ cảnh của bé (ngôn ngữ, cách đọc).',
    TITLE_REQUIRED: 'Truyện chưa có tên.',
    CONTENT_REQUIRED: 'Truyện chưa có nội dung.',
    SAFETY_POLICY_REQUIRED: 'Bé chưa có cài đặt an toàn. Hãy thiết lập trong mục Cài đặt an toàn.',
    STORY_LENGTH_POLICY_INVALID: 'Cài đặt độ dài tối đa của bé không hợp lệ.',
    STORY_TOO_LONG: 'Truyện dài hơn độ dài tối đa trong cài đặt an toàn của bé.',
    SEMANTIC_SAFETY_REVIEW_REQUIRED: 'Cài đặt an toàn của bé có ngưỡng điểm an toàn, mà hệ thống chưa chấm được điểm cho truyện tự viết. Hiện chưa giao được truyện này.',
    READABILITY_POLICY_INVALID: 'Cài đặt độ dễ đọc của bé không hợp lệ.',
    READABILITY_POLICY_NOT_MET: 'Truyện khó đọc hơn mức cài đặt cho bé. Thử câu ngắn và từ đơn giản hơn.',
    BLOCKED_CATEGORY: `Truyện có nội dung thuộc chủ đề bị chặn${extra ? ` (${extra})` : ''}.`,
    POLICY_REVIEW_REQUIRED: `Truyện có nội dung thuộc chủ đề hạn chế${extra ? ` (${extra})` : ''}, cần xem lại.`,
    UNFILLED_PLACEHOLDER: 'Còn chỗ trống chưa điền (___ hoặc {{…}}).',
    MANUAL_AUDIO_PREPARATION_NOT_AVAILABLE: 'Chưa hỗ trợ giọng đọc cho truyện tự viết. Hãy chọn cách trải nghiệm "Đọc".',
    PREPARATION_NOT_READY: 'Bản đọc chưa sẵn sàng.',
    PARENT_STORY_FINALIZED: 'Truyện đã giao cho con nên không sửa được. Thu hồi lần giao để sửa tiếp.',
    PARENT_SELF_CHECK_REQUIRED: 'Hãy đánh dấu đủ 4 mục tự kiểm tra.',
    CONTENT_CHECK_NOT_PASSED: 'Truyện chưa qua kiểm tra.',
    SAVED_VERSION_REQUIRED: 'Hãy lưu truyện trước khi kiểm tra.',
    AUDIENCE_CONTEXT_STALE: 'Cài đặt của bé vừa thay đổi. Hãy kiểm tra lại.',
    CHILD_CONTEXT_CHANGED: 'Cài đặt của bé vừa thay đổi. Hãy kiểm tra lại.',
    STORY_REVISION_CONFLICT: 'Truyện vừa thay đổi ở nơi khác. Tải lại rồi thử lại.',
    AUTHORING_SOURCE_CHANGED: 'Nội dung đã đổi sau lần kiểm tra. Hãy kiểm tra lại.',
    CHILD_NOT_ACTIVE: 'Hồ sơ bé đang không hoạt động.',
    CONSENT_REQUIRED: 'Chủ tài khoản chưa đồng ý dùng AI cho bé.',
    CONSENT_OUTDATED: 'Đồng ý dùng AI của bé đã cũ, cần xác nhận lại.',
  };
  return text[key] ?? code;
}
