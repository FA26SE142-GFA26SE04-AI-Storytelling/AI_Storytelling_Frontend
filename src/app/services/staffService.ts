import type { ApiResponse } from '@/app/types/auth';
import type { ContentCategory } from '@/app/types/childProfile';
import type { PagedResult } from '@/app/types/story';
import type { BusinessReport, DataRequest, InviteStaffInput, PaymentTransaction, QueueItem, QueueItemDetail, QueueQuery, StaffAccount, StaffAccountDto, StaffAccountRole, TokenQuotaConfig } from '@/app/types/staff';
import { apiRequest } from './apiClient';
import { authService } from './authService';
import { API_BASE_URL } from './apiConfig';

/**
 * Luồng 5 — Admin Portal và Moderation.
 *
 * API backend đã có → luôn gọi thật: ContentCategory, TokenQuota/config, DataRequest, BusinessReport, Payment, StaffAccount
 * (Moderator và Administrator), ModerationQueue (danh sách, nhận xử lý, mở mục). Truyện của Content Creator: xem `creatorService.ts`.
 *
 */

const toStaff = (m: StaffAccountDto): StaffAccount => ({
  userId: m.userId, email: m.email, fullName: m.fullName, role: m.role === 'Administrator' ? 'Administrator' : 'Moderator', expertise: m.expertise,
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
  /** Moderator và Administrator; `role` lọc theo một vai trò, bỏ trống để lấy cả hai. Chỉ Administrator gọi được. */
  async staff(role?: StaffAccountRole): Promise<ApiResponse<StaffAccount[]>> {
    const query = role ? `?${new URLSearchParams({ role })}` : '';
    const r = await apiRequest<StaffAccountDto[]>(`/StaffAccount${query}`, 'Không tải được tài khoản vận hành.');
    return { ...r, data: r.data ? r.data.map(toStaff) : null };
  },
  /** Mời Moderator hoặc Administrator qua email: mã mời 72 giờ, người được mời kích hoạt ở trang đăng nhập. Chuyên môn bắt buộc với Moderator. */
  invite: ({ role, email, fullName, expertise, note }: InviteStaffInput): Promise<ApiResponse<StaffAccountDto>> =>
    apiRequest('/StaffAccount/invite', 'Không gửi được lời mời.', {
      method: 'POST',
      body: { role, email, fullName, expertise: role === 'Moderator' ? expertise || null : null, note: note || null },
    }),
  resendInvite: (userId: number): Promise<ApiResponse<StaffAccountDto>> =>
    apiRequest(`/StaffAccount/${userId}/resend-invite`, 'Không gửi lại được lời mời.', { method: 'POST' }),
  /** Huỷ lời mời chưa dùng: backend xoá tài khoản chưa kích hoạt để mời lại được cùng email. */
  cancelInvite: (userId: number): Promise<ApiResponse<StaffAccountDto>> =>
    apiRequest(`/StaffAccount/${userId}/cancel-invite`, 'Không huỷ được lời mời.', { method: 'POST' }),
  /** Vô hiệu hoá bắt buộc lý do (3–500 ký tự); tài khoản bị đăng xuất mọi phiên. */
  deactivate: (userId: number, reason: string): Promise<ApiResponse<StaffAccountDto>> =>
    apiRequest(`/StaffAccount/${userId}/deactivate`, 'Không vô hiệu hoá được.', { method: 'POST', body: { reason } }),
  reactivate: (userId: number): Promise<ApiResponse<StaffAccountDto>> =>
    apiRequest(`/StaffAccount/${userId}/reactivate`, 'Không kích hoạt lại được.', { method: 'POST' }),

  // ---------- Hàng đợi kiểm duyệt (backend chưa có API ra quyết định / trả lại) ----------
  queue(query: QueueQuery = {}): Promise<ApiResponse<PagedResult<QueueItem>>> {
    const params = new URLSearchParams(Object.entries({ pageSize: 100, ...query }).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));
    return apiRequest(`/ModerationQueue?${params}`, 'Không tải được hàng đợi kiểm duyệt.');
  },
  /** Nhận xử lý (khoá 2 giờ). Không được nhận mục do chính mình tạo hoặc nộp. */
  claim: (itemId: number): Promise<ApiResponse<QueueItemDetail>> => apiRequest(`/ModerationQueue/${itemId}/claim`, 'Chưa nhận được mục này.', { method: 'POST' }),
  /** Mở mục mình đang nhận. */
  openItem: (itemId: number): Promise<ApiResponse<QueueItemDetail>> => apiRequest(`/ModerationQueue/${itemId}`, 'Chưa mở được mục này.'),


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
