import type * as B from '@/app/types/backendContracts';
import { apiRequest, apiQuery } from './apiClient';

/** Luồng F-19: thống kê hàng đợi kiểm duyệt và quyết định của Moderator (chỉ role Moderator). Ngày gửi dạng yyyy-MM-dd. */
export const moderationStatisticsService = {
  get: (periodStart: string, periodEnd: string, signal?: AbortSignal) =>
    apiRequest<B.ModerationStatisticsDto>(
      `/ModerationQueue/statistics${apiQuery({ periodStart, periodEnd })}`,
      'Không tải được thống kê kiểm duyệt.',
      { signal },
    ),
};
