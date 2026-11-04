import { apiRequest, apiQuery } from './apiClient';

/**
 * Thống kê theo tháng của Content Creator.
 * CHƯA có API này ở backend (hiện chỉ Admin có báo cáo kinh doanh). Hợp đồng dưới đây là đề xuất gửi backend;
 * khi máy chủ chưa có thì trang hiện "Chưa có dữ liệu", không dùng số liệu mẫu.
 */
export interface CreatorMonthStat {
  /** Tháng dạng "YYYY-MM". */
  month: string;
  /** Doanh thu của Creator trong tháng (đơn vị theo `currency`). */
  revenue: number;
  /** Lượt xem truyện của Creator trong tháng. */
  views: number;
  /** Lượt đọc xong truyện trong tháng. */
  completedReads: number;
}
export interface CreatorStoryStat { storyId: number; title: string; views: number; completedReads: number; revenue: number }
export interface CreatorStats {
  currency: string;
  months: CreatorMonthStat[];
  topStories: CreatorStoryStat[];
}

export const creatorStatsService = {
  /** GET /creator/stats/monthly?months=6 */
  monthly: (months = 6, signal?: AbortSignal) =>
    apiRequest<CreatorStats>(`/creator/stats/monthly${apiQuery({ months })}`, 'Không tải được thống kê.', { signal }),
};
