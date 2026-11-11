import type * as B from '@/app/types/backendContracts';
import { apiRequest, apiQuery } from './apiClient';

/** Luồng 2: gói, giao dịch SePay và lượt tạo truyện AI của người đang đăng nhập. */
export const paymentService = {
  plans: (signal?: AbortSignal) => apiRequest<B.SubscriptionPlanDto[]>('/Payment/plans', 'Không tải được danh sách gói.', { signal }),
  create: (planId: number) => apiRequest<B.PaymentTransactionDto>('/Payment/transactions', 'Không tạo được giao dịch.', { method: 'POST', body: { planId } }),
  /** Giao dịch của chính mình, mới nhất trước (tối đa 50 mỗi trang). Màn QR gọi lại để biết đã Paid chưa. */
  myTransactions: (pageIndex = 1, pageSize = 10, signal?: AbortSignal) =>
    apiRequest<B.PagedResult<B.PaymentTransactionDto>>(`/Payment/transactions/me${apiQuery({ pageIndex, pageSize })}`, 'Không tải được lịch sử giao dịch.', { signal }),
  /** Gói hiện tại và lượt AI còn lại (chỉ tài khoản phụ huynh). */
  myQuota: (signal?: AbortSignal) => apiRequest<B.MyQuotaDto>('/TokenQuota/me', 'Không tải được gói và lượt của bạn.', { signal }),
  /** Lượt của Content Creator (Gói Creator): lượt tạo truyện AI và lượt gửi duyệt. Chỉ role ContentCreator; không gọi /TokenQuota/me. */
  creatorQuota: (signal?: AbortSignal) => apiRequest<B.CreatorQuotaDto>('/TokenQuota/creator/me', 'Không tải được lượt tạo truyện và gửi duyệt.', { signal }),
};

/** Luồng 2, mục 5 của hướng dẫn API: công cụ Admin cho giao dịch, lượt và gói. Chỉ role Administrator. */
export const adminPaymentService = {
  transactions: (q: { pageIndex: number; pageSize?: number; status?: B.PaymentStatus | ''; search?: string }) =>
    apiRequest<B.PagedResult<B.AdminPaymentTransactionDto>>(`/Payment/admin/transactions${apiQuery({ pageIndex: q.pageIndex, pageSize: q.pageSize ?? 20, status: q.status || undefined, search: q.search?.trim() || undefined })}`, 'Không tải được danh sách giao dịch.'),
  /** Nhận mọi giao dịch chưa Paid; gói được áp y như khi SePay xác nhận. */
  markPaid: (id: number) => apiRequest<B.PaymentTransactionDto>(`/Payment/transactions/${id}/mark-paid`, 'Không xác nhận được giao dịch.', { method: 'POST' }),
  reconciliation: (status: 'Open' | 'Resolved', pageIndex: number) =>
    apiRequest<B.PagedResult<B.ReconciliationExceptionDto>>(`/Payment/admin/reconciliation${apiQuery({ status, pageIndex, pageSize: 20 })}`, 'Không tải được giao dịch chờ áp gói.'),
  resolve: (id: number) => apiRequest<B.ReconciliationExceptionDto>(`/Payment/admin/reconciliation/${id}/resolve`, 'Chưa áp lại được gói.', { method: 'POST' }),
  plans: () => apiRequest<B.AdminSubscriptionPlanDto[]>('/Payment/admin/plans', 'Không tải được danh sách gói.'),
  updatePlan: (id: number, body: B.UpdateSubscriptionPlanRequestDto) => apiRequest<B.AdminSubscriptionPlanDto>(`/Payment/admin/plans/${id}`, 'Không lưu được gói.', { method: 'PUT', body }),
  userQuota: (userId: number) => apiRequest<B.MyQuotaDto>(`/TokenQuota/admin/users/${userId}`, 'Không tải được lượt của tài khoản.'),
  adjust: (body: B.AdjustCreditsRequestDto) => apiRequest<B.CreditAdjustmentDto>('/TokenQuota/admin/adjustments', 'Không điều chỉnh được lượt.', { method: 'POST', body }),
  adjustments: (userId: number | null, pageIndex: number) =>
    apiRequest<B.PagedResult<B.CreditAdjustmentDto>>(`/TokenQuota/admin/adjustments${apiQuery({ userId: userId ?? undefined, pageIndex, pageSize: 20 })}`, 'Không tải được lịch sử điều chỉnh lượt.'),
};

/** Sự kiện trình duyệt báo lượt Creator vừa đổi (sau khi tạo truyện AI hoặc gửi duyệt) để chip lượt tải lại số. */
export const CREATOR_QUOTA_CHANGED = 'creator-quota-changed';
export const notifyCreatorQuotaChanged = () => window.dispatchEvent(new Event(CREATOR_QUOTA_CHANGED));
