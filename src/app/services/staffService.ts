import { USE_MOCK } from '@/app/mocks/config';
import { staffRealMock } from '@/app/mocks/mockStaff';
import type { ApiResponse } from '@/app/types/auth';
import type { ContentCategory } from '@/app/types/childProfile';
import type {
  AdministratorAccount, AiMetrics, BusinessReport, CatalogEntry, CatalogKind, CreatorApplication, CreatorApplicationInput, DataRequest,
  EvaluationPrompt, EvaluationRun, GenerationJobLog, ModerationDecision, ModerationItem, ParentAccount, PaymentTransaction,
  PromptCatalogVersion, PublicStory, StaffAccount, TemplateDraft, TokenQuotaConfig,
} from '@/app/types/staff';
import { apiRequest } from './apiClient';
import { authService } from './authService';
import { API_BASE_URL } from './apiConfig';
import { staffLocal } from './staffLocal';

/**
 * Luồng 5 — Admin Portal và Content Workspace.
 *
 * API BACKEND ĐÃ CÓ (gọi thật): ContentCategory, TokenQuota/config, DataRequest (pending, resolve-export, resolve-delete),
 * BusinessReport (generate, publish, latest-published), Payment (mismatched, mark-paid), AdminAccount (grant, revoke), Auth/mfa/verify.
 *
 * HỢP ĐỒNG ĐỀ XUẤT (backend chưa có — xem docs/FRONTEND_PROGRESS.md, "Luồng 5 — cần backend bổ sung"):
 *   GET  /admin/staff · POST /admin/staff/invitations {role, email, fullName, expertise} · DELETE /admin/staff/invitations/{userId}
 *   POST /admin/staff/{userId}/deactivate · /reactivate
 *   POST /creator-applications (công khai) · GET /admin/creator-applications · POST /admin/creator-applications/{id}/approve|reject {note}
 *   GET  /admin/parents?q=&status= · POST /admin/parents/{id}/suspend {reason, note} · /reinstate {note} · /unlock-login
 *   GET  /admin/ai-metrics · GET /admin/generation-jobs
 *   GET  /admin/catalog/{kind} · PUT /admin/catalog/{kind}/{id} · POST /admin/catalog/{kind}
 *   GET  /admin/prompt-catalog/versions · POST /admin/prompt-catalog/versions · POST …/{id}/publish · POST …/rollback
 *   GET|POST /evaluation/prompts · PUT /evaluation/prompts/{id}/status · POST /evaluation/runs {versionId} · GET /evaluation/runs
 *   PUT  /evaluation/runs/{runId}/results/{promptId}/rating
 *   GET  /moderation/queue · POST /moderation/items/{id}/claim · /release · /decision {decision, reason, tags, wishCardIds}
 *   GET|POST|PUT /creator/stories · POST /creator/stories/{id}/submit · /withdraw · /archive
 *   GET|POST|PUT /creator/templates · POST /creator/templates/{id}/submit · /clone · /archive
 */

let backendReady: boolean | null = USE_MOCK ? false : null;
async function call<T>(path: string, fallback: () => ApiResponse<T>, opts: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; anonymous?: boolean } = {}): Promise<ApiResponse<T>> {
  if (backendReady === false) return fallback();
  const r = await apiRequest<T>(path, 'Không kết nối được.', opts);
  if (r.success) { backendReady = true; return r; }
  if (backendReady === null) { backendReady = false; return fallback(); }
  return r;
}
const real = <T>(path: string, fallback: string, opts: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown } = {}) => apiRequest<T>(path, fallback, opts);

export const staffService = {
  isLocal: () => backendReady === false,

  // ---------- API đã có ----------
  categories: (): Promise<ApiResponse<ContentCategory[]>> => (USE_MOCK ? staffRealMock.categories() : real('/ContentCategory', 'Không tải được danh mục.')),
  createCategory: (code: string, displayName: string, isActive: boolean): Promise<ApiResponse<ContentCategory>> =>
    USE_MOCK ? staffRealMock.createCategory(code, displayName, isActive) : real('/ContentCategory', 'Không thêm được danh mục.', { method: 'POST', body: { code, displayName, isActive } }),
  updateCategory: (id: number, displayName: string, isActive: boolean): Promise<ApiResponse<ContentCategory>> =>
    USE_MOCK ? staffRealMock.updateCategory(id, displayName, isActive) : real(`/ContentCategory/${id}`, 'Không lưu được danh mục.', { method: 'PUT', body: { displayName, isActive } }),

  quotaConfigs: (): Promise<ApiResponse<TokenQuotaConfig[]>> => (USE_MOCK ? staffRealMock.quotaConfigs() : real('/TokenQuota/config', 'Không tải được cấu hình quota.')),
  setQuota: (input: Omit<TokenQuotaConfig, 'id' | 'quotaUsed'>): Promise<ApiResponse<TokenQuotaConfig>> =>
    USE_MOCK ? staffRealMock.setQuota(input) : real('/TokenQuota/config', 'Không lưu được hạn mức.', { method: 'POST', body: input }),

  /** Owner của hồ sơ bé gửi yêu cầu xuất / xoá dữ liệu (Luồng 5 Bước 5.4.1). */
  createDataRequest: (childProfileId: number, requestType: 'export' | 'delete'): Promise<ApiResponse<DataRequest>> =>
    USE_MOCK ? staffRealMock.createRequest(childProfileId, requestType) : real('/DataRequest', 'Không gửi được yêu cầu.', { method: 'POST', body: { childProfileId, requestType } }),
  pendingDataRequests: (): Promise<ApiResponse<DataRequest[]>> => (USE_MOCK ? staffRealMock.pendingRequests() : real('/DataRequest/pending', 'Không tải được yêu cầu dữ liệu.')),
  /** Xuất dữ liệu: backend trả file (xlsx/csv) — tải về máy. */
  async resolveExport(id: number, format: 'xlsx' | 'csv'): Promise<{ ok: boolean; message: string; blob?: Blob; fileName?: string }> {
    if (USE_MOCK) return staffRealMock.resolveExport(id);
    try {
      const res = await authService.authenticatedFetch(`${API_BASE_URL}/DataRequest/${id}/resolve-export?format=${format}`, { method: 'POST' });
      if (!res.ok) return { ok: false, message: 'Không xuất được dữ liệu.' };
      const name = /filename="?([^";]+)/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? `data-request-${id}.${format}`;
      return { ok: true, message: 'Đã xuất dữ liệu.', blob: await res.blob(), fileName: name };
    } catch { return { ok: false, message: 'Không kết nối được.' }; }
  },
  resolveDelete: (id: number): Promise<ApiResponse<DataRequest>> =>
    USE_MOCK ? staffRealMock.resolveDelete(id) : real(`/DataRequest/${id}/resolve-delete`, 'Không xoá được dữ liệu.', { method: 'POST' }),

  latestReport: (): Promise<ApiResponse<BusinessReport>> => (USE_MOCK ? staffRealMock.latestReport() : real('/BusinessReport/latest-published', 'Chưa có báo cáo.')),
  generateReport: (periodStart: string, periodEnd: string): Promise<ApiResponse<BusinessReport>> =>
    USE_MOCK ? staffRealMock.generateReport(periodStart, periodEnd) : real('/BusinessReport/generate', 'Không tổng hợp được báo cáo.', { method: 'POST', body: { periodStart, periodEnd } }),
  publishReport: (report: BusinessReport): Promise<ApiResponse<BusinessReport>> =>
    USE_MOCK ? staffRealMock.publishReport(report) : real(`/BusinessReport/${report.id}/publish`, 'Không công bố được.', { method: 'POST' }),

  mismatchedPayments: (): Promise<ApiResponse<PaymentTransaction[]>> => (USE_MOCK ? staffRealMock.mismatched() : real('/Payment/mismatched', 'Không tải được giao dịch.')),
  markPaid: (id: number): Promise<ApiResponse<PaymentTransaction>> =>
    USE_MOCK ? staffRealMock.markPaid(id) : real(`/Payment/transactions/${id}/mark-paid`, 'Không xác nhận được.', { method: 'POST' }),

  grantAdmin: (email: string): Promise<ApiResponse<AdministratorAccount>> =>
    USE_MOCK ? staffRealMock.grantAdmin(email) : real('/AdminAccount/grant', 'Không cấp được quyền.', { method: 'POST', body: { email, confirmSchoolAdminConflict: false } }),
  revokeAdmin: (userId: number): Promise<ApiResponse<AdministratorAccount>> =>
    USE_MOCK ? staffRealMock.revokeAdmin(userId) : real(`/AdminAccount/${userId}/revoke`, 'Không thu hồi được quyền.', { method: 'POST' }),

  // ---------- Đề xuất (dự phòng cục bộ) ----------
  staff: (): Promise<ApiResponse<StaffAccount[]>> => call('/admin/staff', () => staffLocal.staff()),
  invite: (role: 'Administrator' | 'Moderator', email: string, fullName: string, expertise: string): Promise<ApiResponse<StaffAccount>> =>
    call('/admin/staff/invitations', () => staffLocal.invite(role, email, fullName, expertise), { method: 'POST', body: { role, email, fullName, expertise } }),
  cancelInvite: (userId: number): Promise<ApiResponse<null>> => call(`/admin/staff/invitations/${userId}`, () => staffLocal.cancelInvite(userId), { method: 'DELETE' }),
  setStaffActive: (userId: number, active: boolean, me: number): Promise<ApiResponse<StaffAccount>> =>
    call(`/admin/staff/${userId}/${active ? 'reactivate' : 'deactivate'}`, () => staffLocal.setStatus(userId, active, me), { method: 'POST' }),

  applyCreator: (input: CreatorApplicationInput): Promise<ApiResponse<CreatorApplication>> =>
    call('/creator-applications', () => staffLocal.apply(input), { method: 'POST', body: input, anonymous: true }),
  applications: (): Promise<ApiResponse<CreatorApplication[]>> => call('/admin/creator-applications', () => staffLocal.applications()),
  reviewApplication: (id: number, approve: boolean, note: string): Promise<ApiResponse<null>> =>
    call(`/admin/creator-applications/${id}/${approve ? 'approve' : 'reject'}`, () => staffLocal.reviewApplication(id, approve, note), { method: 'POST', body: { note } }),

  parents: (q: string, status: string): Promise<ApiResponse<ParentAccount[]>> =>
    call(`/admin/parents?q=${encodeURIComponent(q)}&status=${status}`, () => staffLocal.parents(q, status)),
  suspendParent: (id: number, reason: string, note: string): Promise<ApiResponse<null>> =>
    call(`/admin/parents/${id}/suspend`, () => staffLocal.suspendParent(id, reason, note), { method: 'POST', body: { reason, note } }),
  reinstateParent: (id: number, note: string): Promise<ApiResponse<null>> =>
    call(`/admin/parents/${id}/reinstate`, () => staffLocal.reinstateParent(id, note), { method: 'POST', body: { note } }),
  unlockParentLogin: (id: number): Promise<ApiResponse<null>> => call(`/admin/parents/${id}/unlock-login`, () => staffLocal.unlockLogin(id), { method: 'POST' }),

  metrics: (): Promise<ApiResponse<AiMetrics>> => call('/admin/ai-metrics', () => staffLocal.metrics()),
  jobs: (): Promise<ApiResponse<GenerationJobLog[]>> => call('/admin/generation-jobs', () => staffLocal.jobs()),

  catalog: (kind: CatalogKind): Promise<ApiResponse<CatalogEntry[]>> => call(`/admin/catalog/${kind}`, () => staffLocal.catalog(kind)),
  saveCatalog: (entry: Omit<CatalogEntry, 'id'> & { id?: number }): Promise<ApiResponse<CatalogEntry>> =>
    call(`/admin/catalog/${entry.kind}${entry.id ? `/${entry.id}` : ''}`, () => staffLocal.saveCatalog(entry), { method: entry.id ? 'PUT' : 'POST', body: entry }),
  versions: (): Promise<ApiResponse<PromptCatalogVersion[]>> => call('/admin/prompt-catalog/versions', () => staffLocal.versions()),
  draftVersion: (note: string, flag: number, block: number, effectiveDate: string): Promise<ApiResponse<PromptCatalogVersion>> =>
    call('/admin/prompt-catalog/versions', () => staffLocal.draftVersion(note, flag, block, effectiveDate), { method: 'POST', body: { note, modelFlagThreshold: flag, modelBlockThreshold: block, effectiveDate } }),
  publishVersion: (id: number): Promise<ApiResponse<null>> => call(`/admin/prompt-catalog/versions/${id}/publish`, () => staffLocal.publishVersion(id), { method: 'POST' }),
  rollback: (): Promise<ApiResponse<null>> => call('/admin/prompt-catalog/versions/rollback', () => staffLocal.rollback(), { method: 'POST' }),

  prompts: (): Promise<ApiResponse<EvaluationPrompt[]>> => call('/evaluation/prompts', () => staffLocal.prompts()),
  addPrompt: (p: Omit<EvaluationPrompt, 'id' | 'status'>): Promise<ApiResponse<EvaluationPrompt>> => call('/evaluation/prompts', () => staffLocal.addPrompt(p), { method: 'POST', body: p }),
  setPromptStatus: (id: number, status: EvaluationPrompt['status']): Promise<ApiResponse<null>> =>
    call(`/evaluation/prompts/${id}/status`, () => staffLocal.setPromptStatus(id, status), { method: 'PUT', body: { status } }),
  runEvaluation: (versionId: number): Promise<ApiResponse<EvaluationRun>> => call('/evaluation/runs', () => staffLocal.runEvaluation(versionId), { method: 'POST', body: { versionId } }),
  runs: (): Promise<ApiResponse<EvaluationRun[]>> => call('/evaluation/runs', () => staffLocal.runs()),
  rate: (runId: number, promptId: number, rating: NonNullable<EvaluationRun['results'][number]['rating']>): Promise<ApiResponse<null>> =>
    call(`/evaluation/runs/${runId}/results/${promptId}/rating`, () => staffLocal.rate(runId, promptId, rating), { method: 'PUT', body: rating }),

  queue: (): Promise<ApiResponse<ModerationItem[]>> => call('/moderation/queue', () => staffLocal.queue()),
  claim: (itemId: number, me: number): Promise<ApiResponse<ModerationItem>> => call(`/moderation/items/${itemId}/claim`, () => staffLocal.claim(itemId, me), { method: 'POST' }),
  release: (itemId: number): Promise<ApiResponse<null>> => call(`/moderation/items/${itemId}/release`, () => staffLocal.release(itemId), { method: 'POST' }),
  decide: (itemId: number, me: number, decision: ModerationDecision, reason: string, tags?: string[], wishCardIds?: number[]): Promise<ApiResponse<null>> =>
    call(`/moderation/items/${itemId}/decision`, () => staffLocal.decide(itemId, me, decision, reason, tags, wishCardIds), { method: 'POST', body: { decision, reason, tags, wishCardIds } }),

  myStories: (): Promise<ApiResponse<PublicStory[]>> => call('/creator/stories', () => staffLocal.myStories()),
  saveStory: (input: Parameters<typeof staffLocal.saveStory>[0]): Promise<ApiResponse<PublicStory>> =>
    call(`/creator/stories${input.id ? `/${input.id}` : ''}`, () => staffLocal.saveStory(input), { method: input.id ? 'PUT' : 'POST', body: input }),
  submitStory: (id: number): Promise<ApiResponse<null>> => call(`/creator/stories/${id}/submit`, () => staffLocal.submitStory(id), { method: 'POST' }),
  withdrawStory: (id: number): Promise<ApiResponse<null>> => call(`/creator/stories/${id}/withdraw`, () => staffLocal.withdrawStory(id), { method: 'POST' }),
  archiveStory: (id: number): Promise<ApiResponse<null>> => call(`/creator/stories/${id}/archive`, () => staffLocal.archiveStory(id), { method: 'POST' }),
  myTemplates: (): Promise<ApiResponse<TemplateDraft[]>> => call('/creator/templates', () => staffLocal.myTemplates()),
  saveTemplate: (input: Parameters<typeof staffLocal.saveTemplate>[0]): Promise<ApiResponse<TemplateDraft>> =>
    call(`/creator/templates${input.id ? `/${input.id}` : ''}`, () => staffLocal.saveTemplate(input), { method: input.id ? 'PUT' : 'POST', body: input }),
  cloneTemplate: (id: number): Promise<ApiResponse<TemplateDraft>> => call(`/creator/templates/${id}/clone`, () => staffLocal.cloneTemplate(id), { method: 'POST' }),
  submitTemplate: (id: number): Promise<ApiResponse<null>> => call(`/creator/templates/${id}/submit`, () => staffLocal.submitTemplate(id), { method: 'POST' }),
  archiveTemplate: (id: number): Promise<ApiResponse<null>> => call(`/creator/templates/${id}/archive`, () => staffLocal.archiveTemplate(id), { method: 'POST' }),
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
