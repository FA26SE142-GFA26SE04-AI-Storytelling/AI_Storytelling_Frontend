import type * as B from '@/app/types/backendContracts';
import { apiRequest } from './apiClient';
export const paymentService = {
  plans: (signal?: AbortSignal) => apiRequest<B.SubscriptionPlanDto[]>('/Payment/plans','Không tải được gói thanh toán.',{signal}),
  create: (planId: number) => apiRequest<B.PaymentTransactionDto>('/Payment/transactions','Không tạo được giao dịch.',{method:'POST',body:{planId}}),
};
