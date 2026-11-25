import type { ApiResponse } from '@/app/types/auth';
import type { ReadingSchedule, SetReadingScheduleRequest } from '@/app/types/readingSchedule';
import { apiRequest } from './apiClient';

/** Thời gian & thói quen của bé (khung giờ đọc, giờ ngủ, nghỉ mắt, giới hạn màn hình, nhắc đọc, mục tiêu tuần). Chỉ chủ hồ sơ. */
export const readingScheduleService = {
  /** Cấu hình hiện tại; chưa lưu lần nào thì backend trả gợi ý theo tuổi (isSuggested = true, không ghi DB). */
  get(childProfileId: number, signal?: AbortSignal): Promise<ApiResponse<ReadingSchedule>> {
    return apiRequest(`/ReadingSchedule/${childProfileId}`, 'Không tải được cấu hình thời gian & thói quen.', { signal });
  },

  /** Gợi ý theo nhóm tuổi khi bé chưa có hồ sơ (form "Thêm bé"); không ghi DB. */
  suggest(ageBand: string, signal?: AbortSignal): Promise<ApiResponse<ReadingSchedule>> {
    return apiRequest(`/ReadingSchedule/suggestion?ageBand=${encodeURIComponent(ageBand)}`, 'Không tải được gợi ý thời gian & thói quen.', { signal });
  },

  /** Lưu toàn bộ cấu hình (thay hết khung giờ); có hiệu lực ngay. Luôn gửi đủ mọi trường, vì trường thiếu bị đặt về mặc định. */
  set(childProfileId: number, body: SetReadingScheduleRequest): Promise<ApiResponse<ReadingSchedule>> {
    return apiRequest(`/ReadingSchedule/${childProfileId}`, 'Không lưu được cấu hình thời gian & thói quen.', { method: 'PUT', body });
  },
};
