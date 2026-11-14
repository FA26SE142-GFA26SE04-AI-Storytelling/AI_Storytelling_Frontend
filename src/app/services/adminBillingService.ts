import type * as B from '@/app/types/backendContracts';
import { apiQuery, apiRequest } from './apiClient';

/** Kỳ thống kê, ngày dạng yyyy-MM-dd lấy từ ô chọn ngày. */
export type Period = { periodStart: string; periodEnd: string };

/** API của Administrator: giao dịch, gói, cấu hình, đối soát, điều chỉnh lượt, thống kê và báo cáo. */
export const adminBillingService = {
  transactions: (q: { pageIndex?: number; pageSize?: number; status?: string; search?: string }, signal?: AbortSignal) =>
    apiRequest<B.PagedResult<B.AdminPaymentTransactionDto>>(`/Payment/admin/transactions${apiQuery({ status: q.status, search: q.search, pageIndex: q.pageIndex ?? 1, pageSize: q.pageSize ?? 20 })}`, 'Không tải được danh sách giao dịch.', { signal }),
  plans: (signal?: AbortSignal) => apiRequest<B.AdminPlanDto[]>('/Payment/admin/plans', 'Không tải được danh sách gói.', { signal }),
  createPlan: (body: B.CreatePlanRequest) => apiRequest<B.AdminPlanDto>('/Payment/admin/plans', 'Không tạo được gói.', { method: 'POST', body }),
  updatePlan: (id: number, body: B.SavePlanRequest) => apiRequest<B.AdminPlanDto>(`/Payment/admin/plans/${id}`, 'Không lưu được gói.', { method: 'PUT', body }),
  settings: (signal?: AbortSignal) => apiRequest<B.PlanSettingsDto>('/Payment/admin/settings', 'Không tải được cấu hình gói.', { signal }),
  saveSettings: (body: B.UpdatePlanSettingsRequest) => apiRequest<B.PlanSettingsDto>('/Payment/admin/settings', 'Không lưu được cấu hình gói.', { method: 'PUT', body }),
  reconciliation: (q: { status?: 'Open' | 'Resolved'; pageIndex?: number; pageSize?: number }, signal?: AbortSignal) =>
    apiRequest<B.PagedResult<B.ReconciliationExceptionDto>>(`/Payment/admin/reconciliation${apiQuery({ status: q.status, pageIndex: q.pageIndex ?? 1, pageSize: q.pageSize ?? 20 })}`, 'Không tải được danh sách đối soát.', { signal }),
  resolveException: (id: number) => apiRequest<B.ReconciliationExceptionDto>(`/Payment/admin/reconciliation/${id}/resolve`, 'Không xử lý được mục đối soát.', { method: 'POST' }),
  adjustCredits: (body: { userId: number; amount: number; reason: string }) =>
    apiRequest<B.CreditAdjustmentDto>('/TokenQuota/admin/adjustments', 'Không điều chỉnh được lượt.', { method: 'POST', body }),
  adjustments: (q: { userId?: number; pageIndex?: number; pageSize?: number }, signal?: AbortSignal) =>
    apiRequest<B.PagedResult<B.CreditAdjustmentDto>>(`/TokenQuota/admin/adjustments${apiQuery({ userId: q.userId, pageIndex: q.pageIndex ?? 1, pageSize: q.pageSize ?? 20 })}`, 'Không tải được lịch sử điều chỉnh lượt.', { signal }),
  userQuota: (userId: number, signal?: AbortSignal) => apiRequest<B.MyQuotaDto>(`/TokenQuota/admin/users/${userId}`, 'Không tải được lượt của tài khoản.', { signal }),
  revenue: (p: Period, signal?: AbortSignal) => apiRequest<B.RevenueStatisticsDto>(`/BusinessReport/admin/revenue${apiQuery(p)}`, 'Không tải được thống kê doanh thu.', { signal }),
  accounts: (p: Period, signal?: AbortSignal) => apiRequest<B.AccountStatisticsDto>(`/BusinessReport/admin/accounts${apiQuery(p)}`, 'Không tải được thống kê tài khoản.', { signal }),
  reports: (pageIndex = 1, pageSize = 20, signal?: AbortSignal) =>
    apiRequest<B.PagedResult<B.AdminBusinessReportDto>>(`/BusinessReport/admin${apiQuery({ pageIndex, pageSize })}`, 'Không tải được danh sách báo cáo.', { signal }),
  report: (id: number, signal?: AbortSignal) => apiRequest<B.AdminBusinessReportDto>(`/BusinessReport/admin/${id}`, 'Không tải được báo cáo.', { signal }),
};
