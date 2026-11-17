import type { CreatorApplication, CreatorApplicationInput } from '@/app/types/creatorApplication';
import { apiRequest } from './apiClient';

/** Creator chờ duyệt (role tạm CreatorApplicant) chỉ gọi được hai API này; mọi API Creator khác trả 403. */
export const creatorApplicationService = {
  mine: (signal?: AbortSignal) => apiRequest<CreatorApplication>('/creator-applications/me', 'Chưa tải được đơn đăng ký của bạn.', { signal }),
  /** Chỉ khi đơn mới nhất bị từ chối; tạo đơn chờ duyệt mới. */
  resubmit: (body: CreatorApplicationInput) => apiRequest<CreatorApplication>('/creator-applications/me/resubmit', 'Chưa nộp lại được đơn. Bạn thử lại nhé.', { method: 'POST', body }),
};
