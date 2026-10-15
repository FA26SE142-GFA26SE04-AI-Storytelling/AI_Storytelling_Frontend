import type { ApiResponse } from '@/app/types/auth';
import type { ContentCategory } from '@/app/types/childProfile';
import type { AdministratorAccount, BusinessReport, DataRequest, PaymentTransaction, TokenQuotaConfig } from '@/app/types/staff';
import { delay, fail, ok } from './config';
import { MOCK_CATEGORIES } from './mockDb';

/** Dữ liệu mẫu cho các API quản trị mà backend ĐÃ có (để thử ở chế độ dữ liệu mẫu). */

const day = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();
let categories: ContentCategory[] = MOCK_CATEGORIES.map((c) => ({ ...c }));
let quotas: TokenQuotaConfig[] = [
  { id: 1, scope: 'System', organizationId: null, childProfileId: null, userId: null, quotaLimit: 30, quotaUsed: 0, periodStart: new Date().toISOString().slice(0, 8) + '01', periodEnd: new Date().toISOString().slice(0, 8) + '28' },
  { id: 2, scope: 'User', organizationId: null, childProfileId: null, userId: 13, quotaLimit: 10, quotaUsed: 20, periodStart: new Date().toISOString().slice(0, 8) + '01', periodEnd: new Date().toISOString().slice(0, 8) + '28' },
];
const requests: DataRequest[] = [
  { id: 1, childProfileId: 1, requestType: 'Export', status: 'Pending', createdAt: iso(Date.now() - 20 * 3_600_000), resolvedAt: null, resolvedByUserId: null },
  { id: 2, childProfileId: 4, requestType: 'Delete', status: 'Pending', createdAt: iso(Date.now() - 52 * 3_600_000), resolvedAt: null, resolvedByUserId: null },
];
let latest: BusinessReport | null = null;
let payments: PaymentTransaction[] = [
  { id: 7, planId: 1, planName: 'Gói 50 lượt', amount: 40000, transactionCode: 'TTL7Q2K9', qrCodeUrl: null, status: 'MismatchAmount', expiresAt: iso(Date.now() - day), paidAt: null, sepayTransactionId: 'SP-88231' },
];
let admins: AdministratorAccount[] = [{ userId: 900, email: 'admin@taletale.site', fullName: 'Quản trị viên Taletale', role: 'Administrator', roleBeforeAdmin: null }];

export const staffRealMock = {
  async categories(): Promise<ApiResponse<ContentCategory[]>> { await delay(); return ok(categories); },
  async createCategory(code: string, displayName: string, isActive: boolean): Promise<ApiResponse<ContentCategory>> {
    await delay();
    if (categories.some((c) => c.code.toLowerCase() === code.toLowerCase())) return fail('Mã danh mục đã tồn tại.');
    const c = { id: Math.max(0, ...categories.map((x) => x.id)) + 1, code, displayName, isActive };
    categories = [...categories, c];
    return ok(c, 'Đã thêm danh mục.');
  },
  async updateCategory(id: number, displayName: string, isActive: boolean): Promise<ApiResponse<ContentCategory>> {
    await delay();
    const c = categories.find((x) => x.id === id);
    if (!c) return fail('Không tìm thấy danh mục.');
    Object.assign(c, { displayName, isActive });
    return ok(c, 'Đã lưu.');
  },
  async quotaConfigs(): Promise<ApiResponse<TokenQuotaConfig[]>> { await delay(); return ok(quotas); },
  async setQuota(input: Omit<TokenQuotaConfig, 'id' | 'quotaUsed'>): Promise<ApiResponse<TokenQuotaConfig>> {
    await delay();
    const existing = quotas.find((q) => q.scope === input.scope && q.userId === input.userId && q.childProfileId === input.childProfileId);
    if (existing) { Object.assign(existing, input); return ok(existing, 'Đã cập nhật hạn mức.'); }
    const q = { ...input, id: Math.max(0, ...quotas.map((x) => x.id)) + 1, quotaUsed: 0 };
    quotas = [...quotas, q];
    return ok(q, 'Đã thêm hạn mức.');
  },
  async createRequest(childProfileId: number, requestType: 'export' | 'delete'): Promise<ApiResponse<DataRequest>> {
    await delay();
    const type = requestType === 'export' ? 'Export' : 'Delete';
    if (requests.some((r) => r.childProfileId === childProfileId && r.requestType === type && r.status === 'Pending')) return fail('Đã có yêu cầu cùng loại đang chờ xử lý.');
    const r: DataRequest = { id: Math.max(0, ...requests.map((x) => x.id)) + 1, childProfileId, requestType: type, status: 'Pending', createdAt: new Date().toISOString(), resolvedAt: null, resolvedByUserId: null };
    requests.push(r);
    return ok(r, 'Đã gửi yêu cầu. Quản trị viên xử lý trong tối đa 72 giờ.');
  },
  async pendingRequests(): Promise<ApiResponse<DataRequest[]>> { await delay(); return ok(requests.filter((r) => r.status === 'Pending')); },
  async resolveExport(id: number): Promise<{ ok: boolean; message: string; blob?: Blob; fileName?: string }> {
    await delay();
    const r = requests.find((x) => x.id === id);
    if (!r) return { ok: false, message: 'Không tìm thấy yêu cầu.' };
    r.status = 'Resolved';
    r.resolvedAt = new Date().toISOString();
    const csv = 'bang,so_dong\nchild_profiles,1\nreading_sessions,12\nquiz_attempts,30\nvocabulary_notebook_entries,8\n';
    return { ok: true, message: 'Đã xuất dữ liệu.', blob: new Blob([csv], { type: 'text/csv' }), fileName: `data-request-${id}.csv` };
  },
  async resolveDelete(id: number): Promise<ApiResponse<DataRequest>> {
    await delay();
    const r = requests.find((x) => x.id === id);
    if (!r) return fail('Không tìm thấy yêu cầu.');
    r.status = 'Resolved';
    r.resolvedAt = new Date().toISOString();
    return ok(r, 'Đã xoá dữ liệu của hồ sơ (ẩn danh hoá hồ sơ, giữ nhật ký kiểm toán).');
  },
  async latestReport(): Promise<ApiResponse<BusinessReport>> { await delay(); return latest ? ok(latest) : fail('Chưa có báo cáo nào được công bố.'); },
  async generateReport(periodStart: string, periodEnd: string): Promise<ApiResponse<BusinessReport>> {
    await delay();
    return ok({ id: Date.now() % 10000, periodStart, periodEnd, storiesGenerated: 128, storiesApproved: 104, storiesRejected: 9, readingSessionsCompleted: 642, status: 'Compiling', publishedAt: null }, 'Đã tổng hợp báo cáo.');
  },
  async publishReport(report: BusinessReport): Promise<ApiResponse<BusinessReport>> {
    await delay();
    latest = { ...report, status: 'Published', publishedAt: new Date().toISOString() };
    return ok(latest, 'Đã công bố báo cáo.');
  },
  async mismatched(): Promise<ApiResponse<PaymentTransaction[]>> { await delay(); return ok(payments.filter((p) => p.status === 'MismatchAmount')); },
  async markPaid(id: number): Promise<ApiResponse<PaymentTransaction>> {
    await delay();
    const p = payments.find((x) => x.id === id);
    if (!p) return fail('Không tìm thấy giao dịch.');
    p.status = 'Paid';
    p.paidAt = new Date().toISOString();
    payments = [...payments];
    return ok(p, 'Đã xác nhận thanh toán và cộng lượt.');
  },
  async grantAdmin(email: string): Promise<ApiResponse<AdministratorAccount>> {
    await delay();
    if (admins.some((a) => a.email === email)) return fail('Tài khoản đã là Administrator.');
    const a = { userId: 950 + admins.length, email, fullName: email.split('@')[0], role: 'Administrator', roleBeforeAdmin: null };
    admins = [...admins, a];
    return ok(a, 'Đã cấp quyền Administrator.');
  },
  async revokeAdmin(userId: number): Promise<ApiResponse<AdministratorAccount>> {
    await delay();
    if (admins.length <= 1) return fail('Phải còn ít nhất một Administrator.');
    const a = admins.find((x) => x.userId === userId);
    admins = admins.filter((x) => x.userId !== userId);
    return a ? ok(a, 'Đã thu hồi quyền Administrator.') : fail('Không tìm thấy.');
  },
};
