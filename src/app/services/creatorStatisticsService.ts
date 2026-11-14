import type * as B from '@/app/types/backendContracts';
import { apiQuery, apiRequest } from './apiClient';
import type { Period } from './adminBillingService';

/** Thống kê của chính Content Creator trong một kỳ. */
export const creatorStatisticsService = {
  reading: (p: Period, storyId?: number, signal?: AbortSignal) =>
    apiRequest<B.CreatorReadingStatisticsDto>(`/CreatorStatistics/reading${apiQuery({ ...p, storyId })}`, 'Không tải được thống kê lượt đọc.', { signal }),
  revenue: (p: Period, storyId?: number, signal?: AbortSignal) =>
    apiRequest<B.CreatorRevenueStatisticsDto>(`/CreatorStatistics/revenue${apiQuery({ ...p, storyId })}`, 'Không tải được thu nhập dự kiến.', { signal }),
  content: (p: Period, signal?: AbortSignal) =>
    apiRequest<B.CreatorContentStatisticsDto>(`/CreatorStatistics/content${apiQuery(p)}`, 'Không tải được thống kê nội dung.', { signal }),
};
