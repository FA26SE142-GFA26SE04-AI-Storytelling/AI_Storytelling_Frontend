import type { PagedResult } from '@/app/types/backendContracts';
import type {
  AdminAuditLog, AdminAuditLogQuery, AdminCreatorStatistics, AuditLogFilters, CreatorAccount, CreatorApplication,
  CreatorApplicationStatus, CreatorPayout, CreatorPayoutAccount, CreatorPayoutDue, CreatorPayoutOverview, CreatorTierOverview,
  DeactivateCreatorResult, MarkPaidInput, PayoutAccountInput,
} from '@/app/types/creatorAdmin';
import { apiQuery, apiRequest } from './apiClient';

/**
 * Luồng 5 — Content Creator phía Administrator: duyệt đơn đăng ký (M5), quản lý tài khoản, cấp đối tác (5g),
 * chi trả (5h), thống kê Creator (5e) và audit log toàn hệ thống. Phía Creator (đơn của mình, nhận tiền): `creatorPayoutService`.
 */
export const creatorAdminService = {
  // ---------- Đơn đăng ký ----------
  applications: (status: CreatorApplicationStatus | undefined, pageIndex: number, pageSize = 20) =>
    apiRequest<PagedResult<CreatorApplication>>(`/admin/creator-applications${apiQuery({ status, pageIndex, pageSize })}`,
      'Không tải được đơn đăng ký Creator.'),
  approve: (id: number) =>
    apiRequest<CreatorApplication>(`/admin/creator-applications/${id}/approve`, 'Không duyệt được đơn.', { method: 'POST', body: {} }),
  reject: (id: number, reason: string) =>
    apiRequest<CreatorApplication>(`/admin/creator-applications/${id}/reject`, 'Không từ chối được đơn.', { method: 'POST', body: { reason } }),

  // ---------- Tài khoản Creator ----------
  creators: (status: string | undefined, search: string | undefined, pageIndex: number, pageSize = 20) =>
    apiRequest<PagedResult<CreatorAccount>>(`/admin/creators${apiQuery({ status, search, pageIndex, pageSize })}`,
      'Không tải được danh sách Creator.'),
  deactivate: (id: number, reason: string) =>
    apiRequest<DeactivateCreatorResult>(`/admin/creators/${id}/deactivate`, 'Không vô hiệu hoá được Creator.', { method: 'POST', body: { reason } }),
  reactivate: (id: number) =>
    apiRequest<CreatorAccount>(`/admin/creators/${id}/reactivate`, 'Không kích hoạt lại được Creator.', { method: 'POST', body: {} }),

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

/** Phía Creator: đơn đăng ký của mình (khi chờ duyệt / bị từ chối) và nhận tiền (5h). */
export const creatorSelfService = {
  myApplication: () => apiRequest<CreatorApplication>('/creator-applications/me', 'Không tải được đơn đăng ký.'),
  resubmit: (introduction: string, portfolioUrl: string | null) =>
    apiRequest<CreatorApplication>('/creator-applications/me/resubmit', 'Không nộp lại được đơn.', {
      method: 'POST', body: { introduction, portfolioUrl },
    }),
  payouts: () => apiRequest<CreatorPayoutOverview>('/creator-payouts/me', 'Không tải được số dư và lịch sử nhận tiền.'),
  updatePayoutAccount: (input: PayoutAccountInput) =>
    apiRequest<CreatorPayoutAccount>('/creator-payouts/me/account', 'Không lưu được thông tin nhận tiền.', { method: 'PUT', body: input }),
};

export const formatVnd = (value: number) => `${value.toLocaleString('vi-VN')} đ`;
