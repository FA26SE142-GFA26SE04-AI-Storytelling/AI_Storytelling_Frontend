import type * as B from '@/app/types/backendContracts';
import { apiQuery, apiRequest } from './apiClient';
export const paymentService = {
  plans: (signal?: AbortSignal) => apiRequest<B.SubscriptionPlanDto[]>('/Payment/plans','Không tải được gói thanh toán.',{signal}),
  create: (planId: number) => apiRequest<B.PaymentTransactionDto>('/Payment/transactions','Không tạo được giao dịch.',{method:'POST',body:{planId}}),
  /** Giao dịch của chính người dùng, mới nhất trước; giao dịch chờ thanh toán còn hạn có kèm mã QR. */
  myTransactions: (pageIndex = 1, pageSize = 20, signal?: AbortSignal) => apiRequest<B.PagedResult<B.PaymentTransactionDto>>(`/Payment/transactions/me${apiQuery({pageIndex,pageSize})}`,'Không tải được lịch sử giao dịch.',{signal}),
  /** Gói đang hiệu lực và số lượt tạo truyện AI còn lại của tài khoản. */
  myQuota: (signal?: AbortSignal) => apiRequest<B.MyQuotaDto>('/TokenQuota/me','Không tải được thông tin gói của bạn.',{signal}),
  /** Lượt AI và lượt gửi duyệt còn lại của Content Creator. */
  creatorQuota: (signal?: AbortSignal) => apiRequest<B.CreatorQuotaDto>('/TokenQuota/creator/me','Không tải được lượt của Creator.',{signal}),
};
