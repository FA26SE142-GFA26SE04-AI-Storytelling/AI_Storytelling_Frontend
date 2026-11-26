import type { PagedResult } from '@/app/types/backendContracts';
import type {
  AdminAuditLog, AdminAuditLogQuery, AdminCreatorStatistics, AuditLogFilters, CreatorEarningPeriodClosed, CreatorPayout,
  CreatorPayoutAccount, CreatorPayoutDue, CreatorPayoutOverview, CreatorTierOverview, MarkPaidInput, PayoutAccountInput,
} from '@/app/types/creatorAdmin';
import { apiQuery, apiRequest } from './apiClient';

/**
 * Luồng 5 phía Administrator: cấp đối tác (5g), chi trả (5h), thống kê Creator (5e) và audit log toàn hệ thống.
 * Đơn đăng ký và tài khoản Creator: `adminCreatorService`. Phía Creator nhận tiền: `creatorSelfService`.
 */
export const creatorAdminService = {
  // ---------- Cấp đối tác ----------
  partnerTier: (id: number) =>
    apiRequest<CreatorTierOverview>(`/admin/creators/${id}/partner-tier`, 'Không tải được cấp Creator đối tác.'),
  revokePartner: (id: number, reason: string) =>
    apiRequest<CreatorTierOverview>(`/admin/creators/${id}/partner-tier/revoke`, 'Không thu hồi được cấp đối tác.', { method: 'POST', body: { reason } }),

  // ---------- Chi trả ----------
  payoutsDue: () => apiRequest<CreatorPayoutDue[]>('/admin/creator-payouts/due', 'Không tải được danh sách chi.'),
  payoutOverview: (creatorUserId: number) =>
    apiRequest<CreatorPayoutOverview>(`/admin/creator-payouts/creators/${creatorUserId}`, 'Không tải được số dư của Creator.'),
  markPaid: (creatorUserId: number, input: MarkPaidInput) =>
    apiRequest<CreatorPayout>(`/admin/creator-payouts/creators/${creatorUserId}/mark-paid`, 'Không ghi nhận được lần chi.', { method: 'POST', body: input }),
  cancelPayout: (payoutId: number, reason: string) =>
    apiRequest<CreatorPayout>(`/admin/creator-payouts/${payoutId}/cancel`, 'Không huỷ được lần chi.', { method: 'POST', body: { reason } }),
  /** Chốt thu nhập đến hết hôm nay và cộng vào số dư ngay, không chờ ngày chốt hằng tháng (dùng khi demo). */
  closePeriodNow: () =>
    apiRequest<CreatorEarningPeriodClosed>('/admin/creator-payouts/periods/close-now', 'Không chốt được kỳ thu nhập.', { method: 'POST' }),

  // ---------- Thống kê Creator ----------
  creatorStats: (periodStart: string, periodEnd: string, signal?: AbortSignal) =>
    apiRequest<AdminCreatorStatistics>(`/BusinessReport/admin/creators${apiQuery({ periodStart, periodEnd })}`,
      'Không tải được thống kê Creator.', { signal }),

  // ---------- Audit log ----------
  auditLogs: (query: AdminAuditLogQuery) =>
    apiRequest<PagedResult<AdminAuditLog>>(`/admin/audit-logs${apiQuery(query)}`, 'Không tải được audit log.'),
  auditLog: (id: number) => apiRequest<AdminAuditLog>(`/admin/audit-logs/${id}`, 'Không tải được audit log.'),
  auditFilters: () => apiRequest<AuditLogFilters>('/admin/audit-logs/filters', 'Không tải được bộ lọc audit log.'),
};

/** Phía Creator: nhận tiền (5h). Đơn đăng ký của mình: màn CreatorApplicantScreen. */
export const creatorSelfService = {
  payouts: () => apiRequest<CreatorPayoutOverview>('/creator-payouts/me', 'Không tải được số dư và lịch sử nhận tiền.'),
  updatePayoutAccount: (input: PayoutAccountInput) =>
    apiRequest<CreatorPayoutAccount>('/creator-payouts/me/account', 'Không lưu được thông tin nhận tiền.', { method: 'PUT', body: input }),
};

export const formatVnd = (value: number) => `${value.toLocaleString('vi-VN')} đ`;
