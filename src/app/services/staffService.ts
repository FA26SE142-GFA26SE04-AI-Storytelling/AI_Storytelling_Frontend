import type { ApiResponse } from '@/app/types/auth';
import type { ContentCategory } from '@/app/types/childProfile';
import type { PagedResult } from '@/app/types/story';
import type { BusinessReport, InviteStaffInput, QueueItem, QueueItemDetail, QueueQuery, StaffAccount, StaffAccountDto, StaffAccountRole } from '@/app/types/staff';
import type * as B from '@/app/types/backendContracts';
import { apiRequest, apiQuery } from './apiClient';

/**
 * Luồng 5 — Admin Portal và Moderation.
 *
 * API backend đã có → luôn gọi thật: ContentCategory, BusinessReport, StaffAccount (thanh toán và lượt: paymentService)
 * (Moderator và Administrator), ModerationQueue (danh sách, nhận xử lý, mở mục). Truyện của Content Creator: xem `creatorService.ts`.
 *
 */

const toStaff = (m: StaffAccountDto): StaffAccount => ({
  userId: m.userId, email: m.email, fullName: m.fullName, role: m.role === 'Administrator' ? 'Administrator' : 'Moderator', expertise: m.expertise,
  // Chưa kích hoạt = vẫn là lời mời; Suspended = đã vô hiệu hoá.
  status: !m.isActivated ? 'invited' : m.status === 'Suspended' ? 'deactivated' : 'active',
  createdAt: m.activatedAt ?? m.inviteExpiresAt ?? '',
});


export const staffService = {
  // ---------- Danh mục nội dung ----------
  categories: (): Promise<ApiResponse<ContentCategory[]>> => apiRequest('/ContentCategory', 'Không tải được danh mục.'),
  createCategory: (code: string, displayName: string, isActive: boolean, defaultBlockedAgeBands: string[] = []): Promise<ApiResponse<ContentCategory>> =>
    apiRequest('/ContentCategory', 'Không thêm được danh mục.', { method: 'POST', body: { code, displayName, isActive, defaultBlockedAgeBands } }),
  /** `defaultBlockedAgeBands` bỏ trống thì backend giữ nguyên danh sách cũ. */
  updateCategory: (id: number, displayName: string, isActive: boolean, defaultBlockedAgeBands?: string[]): Promise<ApiResponse<ContentCategory>> =>
    apiRequest(`/ContentCategory/${id}`, 'Không lưu được danh mục.', { method: 'PUT', body: { displayName, isActive, defaultBlockedAgeBands } }),


  // ---------- Báo cáo nghiệp vụ ----------
  revenueStats: (periodStart: string, periodEnd: string, signal?: AbortSignal) => apiRequest<B.RevenueStatisticsDto>(`/BusinessReport/admin/revenue${apiQuery({ periodStart, periodEnd })}`, 'Không tải được số liệu doanh thu.', { signal }),
  accountStats: (periodStart: string, periodEnd: string, signal?: AbortSignal) => apiRequest<B.UserAccountStatisticsDto>(`/BusinessReport/admin/accounts${apiQuery({ periodStart, periodEnd })}`, 'Không tải được số liệu tài khoản.', { signal }),
  listReports: (pageIndex: number, pageSize = 10) => apiRequest<B.PagedResult<B.AdminBusinessReportDto>>(`/BusinessReport/admin${apiQuery({ pageIndex, pageSize })}`, 'Không tải được danh sách báo cáo.'),
  getReport: (id: number) => apiRequest<B.AdminBusinessReportDto>(`/BusinessReport/admin/${id}`, 'Không tải được báo cáo.'),
  latestReport: (): Promise<ApiResponse<BusinessReport>> => apiRequest('/BusinessReport/latest-published', 'Chưa có báo cáo.'),
  generateReport: (periodStart: string, periodEnd: string): Promise<ApiResponse<BusinessReport>> =>
    apiRequest('/BusinessReport/generate', 'Không tổng hợp được báo cáo.', { method: 'POST', body: { periodStart, periodEnd } }),
  publishReport: (report: BusinessReport): Promise<ApiResponse<BusinessReport>> =>
    apiRequest(`/BusinessReport/${report.id}/publish`, 'Không công bố được.', { method: 'POST' }),

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
  queue(query: QueueQuery = {}, signal?: AbortSignal): Promise<ApiResponse<PagedResult<QueueItem>>> {
    const params = new URLSearchParams(Object.entries({ pageSize: 100, ...query }).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));
    return apiRequest(`/ModerationQueue?${params}`, 'Không tải được hàng đợi kiểm duyệt.', { signal });
  },
  /** Nhận xử lý (khoá 2 giờ). Không được nhận mục do chính mình tạo hoặc nộp. */
  claim: (itemId: number): Promise<ApiResponse<QueueItemDetail>> => apiRequest(`/ModerationQueue/${itemId}/claim`, 'Chưa nhận được mục này.', { method: 'POST' }),

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
