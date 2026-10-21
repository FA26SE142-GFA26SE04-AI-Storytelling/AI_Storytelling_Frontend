import type { ApiResponse } from '@/app/types/auth';
import type { ContentCategory } from '@/app/types/childProfile';
import type { PagedResult } from '@/app/types/story';
import type {
  AdministratorAccount, AiMetrics, BusinessReport, CatalogEntry, CatalogKind, CreatorApplication, CreatorApplicationInput, DataRequest,
  EvaluationPrompt, EvaluationRun, GenerationJobLog, ModeratorAccountDto, ParentAccount, PaymentTransaction, PromptCatalogVersion,
  ChangePart, ChecklistEntry, CommunityReviewPackage, PublicReviewChecklist, PublicReviewPackage, ReportArchiveReason, ReportReviewPackage, RoadmapReviewPackage,
  PublicStory, QueueItem, QueueItemDetail, QueueQuery, StaffAccount, TemplateDraft, TokenQuotaConfig,
} from '@/app/types/staff';
import { apiRequest } from './apiClient';
import { authService } from './authService';
import { API_BASE_URL } from './apiConfig';
import { staffLocal } from './staffLocal';

/**
 * Luồng 5 — Admin Portal và Moderation.
 *
 * API backend đã có → luôn gọi thật: ContentCategory, TokenQuota/config, DataRequest, BusinessReport, Payment, AdminAccount,
 * ModeratorAccount, ModerationQueue (danh sách, nhận xử lý, mở mục). Truyện của Content Creator: xem `creatorService.ts`.
 *
 * Backend CHƯA CÓ → chỉ dùng dữ liệu cục bộ (`staffLocal`), không gọi mạng (xem docs/FRONTEND_PROGRESS.md, "Luồng 5 — cần backend bổ sung"):
 * đơn Content Creator, quản lý tài khoản Parent, chỉ số AI và nhật ký sinh truyện, thẻ ước / bài học / nhân vật mẫu,
 * Prompt Catalog có phiên bản, bộ đánh giá AI, quyết định kiểm duyệt, bộ truyện mẫu.
 */

const toStaff = (m: ModeratorAccountDto): StaffAccount => ({
  userId: m.userId, email: m.email, fullName: m.fullName, role: 'Moderator', expertise: m.expertise,
  // Chưa kích hoạt = vẫn là lời mời; Suspended = đã vô hiệu hoá.
  status: !m.isActivated ? 'invited' : m.status === 'Suspended' ? 'deactivated' : 'active',
  createdAt: m.activatedAt ?? m.inviteExpiresAt ?? '',
});

export type QuotaInput = { scope: 'System' | 'Child' | 'Personal'; childProfileId: number | null; userId: number | null; quotaLimit: number; periodStart: string; periodEnd: string };

export const staffService = {
  // ---------- Danh mục nội dung ----------
  categories: (): Promise<ApiResponse<ContentCategory[]>> => apiRequest('/ContentCategory', 'Không tải được danh mục.'),
  createCategory: (code: string, displayName: string, isActive: boolean, defaultBlockedAgeBands: string[] = []): Promise<ApiResponse<ContentCategory>> =>
    apiRequest('/ContentCategory', 'Không thêm được danh mục.', { method: 'POST', body: { code, displayName, isActive, defaultBlockedAgeBands } }),
  /** `defaultBlockedAgeBands` bỏ trống thì backend giữ nguyên danh sách cũ. */
  updateCategory: (id: number, displayName: string, isActive: boolean, defaultBlockedAgeBands?: string[]): Promise<ApiResponse<ContentCategory>> =>
    apiRequest(`/ContentCategory/${id}`, 'Không lưu được danh mục.', { method: 'PUT', body: { displayName, isActive, defaultBlockedAgeBands } }),

  // ---------- Token Quota ----------
  quotaConfigs: (): Promise<ApiResponse<TokenQuotaConfig[]>> => apiRequest('/TokenQuota/config', 'Không tải được cấu hình quota.'),
  setQuota: (input: QuotaInput): Promise<ApiResponse<TokenQuotaConfig>> =>
    apiRequest('/TokenQuota/config', 'Không lưu được hạn mức.', { method: 'POST', body: input }),

  // ---------- Data Request ----------
  /** Owner gửi yêu cầu xuất / xoá dữ liệu. Yêu cầu xoá bắt buộc nhập lại mật khẩu và gõ đúng biệt danh của bé. */
  createDataRequest: (childProfileId: number, requestType: 'export' | 'delete', confirm?: { currentPassword: string; confirmNickname: string }): Promise<ApiResponse<DataRequest>> =>
    apiRequest('/DataRequest', 'Không gửi được yêu cầu.', { method: 'POST', body: { childProfileId, requestType, ...confirm } }),
  myDataRequests: (): Promise<ApiResponse<DataRequest[]>> => apiRequest('/DataRequest/mine', 'Không tải được yêu cầu dữ liệu.'),
  cancelDataRequest: (id: number): Promise<ApiResponse<DataRequest>> => apiRequest(`/DataRequest/${id}/cancel`, 'Không huỷ được yêu cầu.', { method: 'POST' }),
  pendingDataRequests: (): Promise<ApiResponse<DataRequest[]>> => apiRequest('/DataRequest/pending', 'Không tải được yêu cầu dữ liệu.'),
  /** Xuất dữ liệu: backend trả file (xlsx/csv) — tải về máy. */
  async resolveExport(id: number, format: 'xlsx' | 'csv'): Promise<{ ok: boolean; message: string; blob?: Blob; fileName?: string }> {
    try {
      const res = await authService.authenticatedFetch(`${API_BASE_URL}/DataRequest/${id}/resolve-export?format=${format}`, { method: 'POST' });
      if (!res.ok) return { ok: false, message: 'Không xuất được dữ liệu.' };
      const name = /filename="?([^";]+)/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? `data-request-${id}.${format}`;
      return { ok: true, message: 'Đã xuất dữ liệu.', blob: await res.blob(), fileName: name };
    } catch { return { ok: false, message: 'Không kết nối được.' }; }
  },
  resolveDelete: (id: number): Promise<ApiResponse<DataRequest>> => apiRequest(`/DataRequest/${id}/resolve-delete`, 'Không xoá được dữ liệu.', { method: 'POST' }),
  rejectDataRequest: (id: number, reason: string): Promise<ApiResponse<DataRequest>> =>
    apiRequest(`/DataRequest/${id}/reject`, 'Không từ chối được yêu cầu.', { method: 'POST', body: { reason } }),

  // ---------- Báo cáo nghiệp vụ, thanh toán ----------
  latestReport: (): Promise<ApiResponse<BusinessReport>> => apiRequest('/BusinessReport/latest-published', 'Chưa có báo cáo.'),
  generateReport: (periodStart: string, periodEnd: string): Promise<ApiResponse<BusinessReport>> =>
    apiRequest('/BusinessReport/generate', 'Không tổng hợp được báo cáo.', { method: 'POST', body: { periodStart, periodEnd } }),
  publishReport: (report: BusinessReport): Promise<ApiResponse<BusinessReport>> =>
    apiRequest(`/BusinessReport/${report.id}/publish`, 'Không công bố được.', { method: 'POST' }),
  mismatchedPayments: (): Promise<ApiResponse<PaymentTransaction[]>> => apiRequest('/Payment/mismatched', 'Không tải được giao dịch.'),
  markPaid: (id: number): Promise<ApiResponse<PaymentTransaction>> => apiRequest(`/Payment/transactions/${id}/mark-paid`, 'Không xác nhận được.', { method: 'POST' }),

  // ---------- Tài khoản vận hành ----------
  grantAdmin: (email: string): Promise<ApiResponse<AdministratorAccount>> => apiRequest('/AdminAccount/grant', 'Không cấp được quyền.', { method: 'POST', body: { email } }),
  revokeAdmin: (userId: number): Promise<ApiResponse<AdministratorAccount>> => apiRequest(`/AdminAccount/${userId}/revoke`, 'Không thu hồi được quyền.', { method: 'POST' }),
  /** Danh sách Moderator (backend chưa có API liệt kê Administrator). */
  async staff(): Promise<ApiResponse<StaffAccount[]>> {
    const r = await apiRequest<ModeratorAccountDto[]>('/ModeratorAccount', 'Không tải được tài khoản vận hành.');
    return { ...r, data: r.data ? r.data.map(toStaff) : null };
  },
  /** Mời Moderator qua email: email chứa mã mời 72 giờ, người được mời kích hoạt ở trang đăng nhập. */
  inviteModerator: (email: string, fullName: string, expertise: string, note?: string): Promise<ApiResponse<ModeratorAccountDto>> =>
    apiRequest('/ModeratorAccount/invite', 'Không gửi được lời mời.', { method: 'POST', body: { email, fullName, expertise, note: note || null } }),
  resendInvite: (userId: number): Promise<ApiResponse<ModeratorAccountDto>> =>
    apiRequest(`/ModeratorAccount/${userId}/resend-invite`, 'Không gửi lại được lời mời.', { method: 'POST' }),
  /** Vô hiệu hoá bắt buộc lý do (≥ 3 ký tự). */
  deactivateModerator: (userId: number, reason: string): Promise<ApiResponse<ModeratorAccountDto>> =>
    apiRequest(`/ModeratorAccount/${userId}/deactivate`, 'Không vô hiệu hoá được.', { method: 'POST', body: { reason } }),
  reactivateModerator: (userId: number): Promise<ApiResponse<ModeratorAccountDto>> =>
    apiRequest(`/ModeratorAccount/${userId}/reactivate`, 'Không kích hoạt lại được.', { method: 'POST' }),

  // ---------- Hàng đợi kiểm duyệt (backend chưa có API trả mục về hàng đợi; mục tự trả sau 2 giờ) ----------
  queue(query: QueueQuery = {}): Promise<ApiResponse<PagedResult<QueueItem>>> {
    const params = new URLSearchParams(Object.entries({ pageSize: 100, ...query }).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));
    return apiRequest(`/ModerationQueue?${params}`, 'Không tải được hàng đợi kiểm duyệt.');
  },
  /** Nhận xử lý (khoá 2 giờ). Không được nhận mục do chính mình tạo hoặc nộp. */
  claim: (itemId: number): Promise<ApiResponse<QueueItemDetail>> => apiRequest(`/ModerationQueue/${itemId}/claim`, 'Chưa nhận được mục này.', { method: 'POST' }),
  /** Mở mục mình đang nhận. */
  openItem: (itemId: number): Promise<ApiResponse<QueueItemDetail>> => apiRequest(`/ModerationQueue/${itemId}`, 'Chưa mở được mục này.'),

  // ---------- Ra quyết định theo loại mục (phải đang nhận xử lý mục) ----------
  /** Duyệt truyện Public Library: xem đủ cảnh, nghe audio, gỡ cờ, đủ 8 tiêu chí và có nhãn thì mới duyệt được. */
  publicReview: {
    get: (itemId: number): Promise<ApiResponse<PublicReviewPackage>> => apiRequest(`/PublicStoryReview/${itemId}`, 'Chưa mở được gói duyệt.'),
    markViewed: (itemId: number, partType: 'scene' | 'audio', partId: number): Promise<ApiResponse<unknown>> =>
      apiRequest(`/PublicStoryReview/${itemId}/views`, 'Chưa ghi nhận được.', { method: 'POST', body: { partType, partId } }),
    resolveFlag: (itemId: number, flagId: string, reason: string): Promise<ApiResponse<unknown>> =>
      apiRequest(`/PublicStoryReview/${itemId}/flags/resolve`, 'Chưa gỡ được cờ.', { method: 'POST', body: { flagId, reason } }),
    checklist: (itemId: number, checklist: PublicReviewChecklist): Promise<ApiResponse<unknown>> =>
      apiRequest(`/PublicStoryReview/${itemId}/checklist`, 'Chưa lưu được checklist.', { method: 'PUT', body: checklist }),
    labels: (itemId: number, contentCategoryIds: number[]): Promise<ApiResponse<unknown>> =>
      apiRequest(`/PublicStoryReview/${itemId}/labels`, 'Chưa lưu được nhãn.', { method: 'PUT', body: { contentCategoryIds } }),
    approve: (itemId: number): Promise<ApiResponse<unknown>> => apiRequest(`/PublicStoryReview/${itemId}/approve`, 'Chưa duyệt được.', { method: 'POST' }),
    requestChanges: (itemId: number, generalNote: string, parts: ChangePart[]): Promise<ApiResponse<unknown>> =>
      apiRequest(`/PublicStoryReview/${itemId}/request-changes`, 'Chưa gửi được yêu cầu sửa.', { method: 'POST', body: { generalNote, parts } }),
    reject: (itemId: number, reason: string): Promise<ApiResponse<unknown>> =>
      apiRequest(`/PublicStoryReview/${itemId}/reject`, 'Chưa từ chối được.', { method: 'POST', body: { reason } }),
  },
  /** Duyệt truyện nộp lên thư viện cộng đồng (bản đã ghim lúc nộp). */
  communityReview: {
    get: (itemId: number): Promise<ApiResponse<CommunityReviewPackage>> => apiRequest(`/CommunityReview/${itemId}`, 'Chưa mở được gói duyệt.'),
    checklist: (itemId: number, entries: Pick<ChecklistEntry, 'code' | 'passed' | 'note'>[]): Promise<ApiResponse<unknown>> =>
      apiRequest(`/CommunityReview/${itemId}/checklist`, 'Chưa lưu được checklist.', { method: 'PUT', body: { entries } }),
    labels: (itemId: number, contentCategoryIds: number[]): Promise<ApiResponse<unknown>> =>
      apiRequest(`/CommunityReview/${itemId}/labels`, 'Chưa lưu được nhãn.', { method: 'PUT', body: { contentCategoryIds } }),
    approve: (itemId: number): Promise<ApiResponse<unknown>> => apiRequest(`/CommunityReview/${itemId}/approve`, 'Chưa duyệt được.', { method: 'POST' }),
    reject: (itemId: number, reason: string): Promise<ApiResponse<unknown>> =>
      apiRequest(`/CommunityReview/${itemId}/reject`, 'Chưa từ chối được.', { method: 'POST', body: { reason } }),
  },
  /** Duyệt bộ truyện mẫu. */
  roadmapReview: {
    get: (itemId: number): Promise<ApiResponse<RoadmapReviewPackage>> => apiRequest(`/RoadmapReview/${itemId}`, 'Chưa mở được gói duyệt.'),
    checklist: (itemId: number, entries: Pick<ChecklistEntry, 'code' | 'passed' | 'note'>[]): Promise<ApiResponse<unknown>> =>
      apiRequest(`/RoadmapReview/${itemId}/checklist`, 'Chưa lưu được checklist.', { method: 'PUT', body: { entries } }),
    approve: (itemId: number): Promise<ApiResponse<unknown>> => apiRequest(`/RoadmapReview/${itemId}/approve`, 'Chưa duyệt được.', { method: 'POST' }),
    requestChanges: (itemId: number, generalNote: string, parts: ChangePart[]): Promise<ApiResponse<unknown>> =>
      apiRequest(`/RoadmapReview/${itemId}/request-changes`, 'Chưa gửi được yêu cầu sửa.', { method: 'POST', body: { generalNote, parts } }),
    reject: (itemId: number, reason: string): Promise<ApiResponse<unknown>> =>
      apiRequest(`/RoadmapReview/${itemId}/reject`, 'Chưa từ chối được.', { method: 'POST', body: { reason } }),
  },
  /** Xử lý báo cáo nội dung của phụ huynh. */
  reportReview: {
    get: (itemId: number): Promise<ApiResponse<ReportReviewPackage>> => apiRequest(`/ContentReportReview/${itemId}`, 'Chưa mở được báo cáo.'),
    dismiss: (itemId: number, reason: string): Promise<ApiResponse<unknown>> =>
      apiRequest(`/ContentReportReview/${itemId}/dismiss`, 'Chưa bỏ qua được báo cáo.', { method: 'POST', body: { reason } }),
    archive: (itemId: number, archiveReason: ReportArchiveReason, reason: string): Promise<ApiResponse<unknown>> =>
      apiRequest(`/ContentReportReview/${itemId}/archive`, 'Chưa gỡ được truyện.', { method: 'POST', body: { archiveReason, reason } }),
    escalate: (itemId: number, reason: string): Promise<ApiResponse<unknown>> =>
      apiRequest(`/ContentReportReview/${itemId}/escalate`, 'Chưa chuyển lên được.', { method: 'POST', body: { reason } }),
  },
  /** Yêu cầu gỡ truyện đã xuất bản của Content Creator. `rowVersion` lấy từ chi tiết mục trong hàng đợi. */
  decideRemoval: (itemId: number, approve: boolean, reason: string, rowVersion: number): Promise<ApiResponse<unknown>> =>
    apiRequest(`/moderation/public-story-removals/${itemId}/decision`, 'Chưa ghi được quyết định.', { method: 'POST', body: { approve, reason, rowVersion } }),

  // ---------- Chưa có API: dữ liệu cục bộ ----------
  applyCreator: async (input: CreatorApplicationInput): Promise<ApiResponse<CreatorApplication>> => staffLocal.apply(input),
  applications: async (): Promise<ApiResponse<CreatorApplication[]>> => staffLocal.applications(),
  reviewApplication: async (id: number, approve: boolean, note: string): Promise<ApiResponse<null>> => staffLocal.reviewApplication(id, approve, note),

  parents: async (q: string, status: string): Promise<ApiResponse<ParentAccount[]>> => staffLocal.parents(q, status),
  suspendParent: async (id: number, reason: string, note: string): Promise<ApiResponse<null>> => staffLocal.suspendParent(id, reason, note),
  reinstateParent: async (id: number, note: string): Promise<ApiResponse<null>> => staffLocal.reinstateParent(id, note),
  unlockParentLogin: async (id: number): Promise<ApiResponse<null>> => staffLocal.unlockLogin(id),

  metrics: async (): Promise<ApiResponse<AiMetrics>> => staffLocal.metrics(),
  jobs: async (): Promise<ApiResponse<GenerationJobLog[]>> => staffLocal.jobs(),

  catalog: async (kind: CatalogKind): Promise<ApiResponse<CatalogEntry[]>> => staffLocal.catalog(kind),
  saveCatalog: async (entry: Omit<CatalogEntry, 'id'> & { id?: number }): Promise<ApiResponse<CatalogEntry>> => staffLocal.saveCatalog(entry),
  versions: async (): Promise<ApiResponse<PromptCatalogVersion[]>> => staffLocal.versions(),
  draftVersion: async (note: string, flag: number, block: number, effectiveDate: string): Promise<ApiResponse<PromptCatalogVersion>> => staffLocal.draftVersion(note, flag, block, effectiveDate),
  publishVersion: async (id: number): Promise<ApiResponse<null>> => staffLocal.publishVersion(id),
  rollback: async (): Promise<ApiResponse<null>> => staffLocal.rollback(),

  prompts: async (): Promise<ApiResponse<EvaluationPrompt[]>> => staffLocal.prompts(),
  addPrompt: async (p: Omit<EvaluationPrompt, 'id' | 'status'>): Promise<ApiResponse<EvaluationPrompt>> => staffLocal.addPrompt(p),
  setPromptStatus: async (id: number, status: EvaluationPrompt['status']): Promise<ApiResponse<null>> => staffLocal.setPromptStatus(id, status),
  runEvaluation: async (versionId: number): Promise<ApiResponse<EvaluationRun>> => staffLocal.runEvaluation(versionId),
  runs: async (): Promise<ApiResponse<EvaluationRun[]>> => staffLocal.runs(),
  rate: async (runId: number, promptId: number, rating: NonNullable<EvaluationRun['results'][number]['rating']>): Promise<ApiResponse<null>> => staffLocal.rate(runId, promptId, rating),

  /** Truyện Thư viện chung mẫu (cục bộ) để ghép bộ truyện mẫu — truyện Creator thật chưa có trạng thái công khai. */
  libraryStories: async (): Promise<ApiResponse<PublicStory[]>> => staffLocal.myStories(),
  myTemplates: async (): Promise<ApiResponse<TemplateDraft[]>> => staffLocal.myTemplates(),
  saveTemplate: async (input: Parameters<typeof staffLocal.saveTemplate>[0]): Promise<ApiResponse<TemplateDraft>> => staffLocal.saveTemplate(input),
  cloneTemplate: async (id: number): Promise<ApiResponse<TemplateDraft>> => staffLocal.cloneTemplate(id),
  submitTemplate: async (id: number): Promise<ApiResponse<null>> => staffLocal.submitTemplate(id),
  archiveTemplate: async (id: number): Promise<ApiResponse<null>> => staffLocal.archiveTemplate(id),
};

/** Tải một Blob về máy. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
