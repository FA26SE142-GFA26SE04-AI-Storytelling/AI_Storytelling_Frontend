import type * as B from '@/app/types/backendContracts';
import { apiRequest, apiQuery } from './apiClient';

/** Luồng F-20, F-21, F-22: thống kê của Content Creator (chỉ role ContentCreator). Ngày gửi dạng yyyy-MM-dd. */
export const creatorStatisticsService = {
  reading: (periodStart: string, periodEnd: string, signal?: AbortSignal) =>
    apiRequest<B.CreatorReadingStatisticsDto>(
      `/CreatorStatistics/reading${apiQuery({ periodStart, periodEnd })}`,
      'Không tải được thống kê lượt đọc.',
      { signal },
    ),
  revenue: (periodStart: string, periodEnd: string, signal?: AbortSignal) =>
    apiRequest<B.CreatorRevenueStatisticsDto>(
      `/CreatorStatistics/revenue${apiQuery({ periodStart, periodEnd })}`,
      'Không tải được thống kê thu nhập.',
      { signal },
    ),
  content: (periodStart: string, periodEnd: string, signal?: AbortSignal) =>
    apiRequest<B.CreatorContentStatisticsDto>(
      `/CreatorStatistics/content${apiQuery({ periodStart, periodEnd })}`,
      'Không tải được thống kê nội dung.',
      { signal },
    ),
};
