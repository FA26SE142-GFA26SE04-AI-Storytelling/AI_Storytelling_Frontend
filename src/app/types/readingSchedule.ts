/** Cấu hình "Thời gian & thói quen" của một bé (backend: ReadingScheduleController). */

export type ScheduleDayType = 'Weekday' | 'Weekend';

export interface ReadingScheduleWindow {
  dayType: ScheduleDayType;
  slot: number;
  /** Giờ Việt Nam dạng HH:mm. */
  startTime: string;
  endTime: string;
}

/** Tiến độ thói quen hiển thị cho phụ huynh; null khi bé chưa có cấu hình đã lưu. */
export interface ReadingHabitProgress {
  streakDays: number;
  daysReadThisWeek: number;
  goalMetThisWeek: boolean;
}

export interface ReadingSchedule {
  childProfileId: number;
  enabled: boolean;
  /** HH:mm từ 18:00 đến 23:30; null = không đặt. */
  bedtimeWeekday: string | null;
  bedtimeWeekend: string | null;
  breakEnabled: boolean;
  breakAfterMinutes: number;
  breakDurationMinutes: number;
  breakRemindEyes: boolean;
  breakRemindWater: boolean;
  breakRemindMove: boolean;
  screenLimitEnabled: boolean;
  screenLimitWeekdayMinutes: number;
  screenLimitWeekendMinutes: number;
  habitEnabled: boolean;
  /** HH:mm từ 06:00; null = không nhắc loại ngày đó. */
  readingReminderWeekday: string | null;
  readingReminderWeekend: string | null;
  /** 1–7; null = không đặt mục tiêu. */
  weeklyGoalDays: number | null;
  habit: ReadingHabitProgress | null;
  windows: ReadingScheduleWindow[];
  /** true khi chưa lưu lần nào: đây là gợi ý theo độ tuổi để điền sẵn form. */
  isSuggested: boolean;
}

export interface SetReadingScheduleRequest {
  enabled: boolean;
  bedtimeWeekday: string | null;
  bedtimeWeekend: string | null;
  breakEnabled: boolean;
  breakAfterMinutes: number;
  breakDurationMinutes: number;
  breakRemindEyes: boolean;
  breakRemindWater: boolean;
  breakRemindMove: boolean;
  screenLimitEnabled: boolean;
  screenLimitWeekdayMinutes: number;
  screenLimitWeekendMinutes: number;
  habitEnabled: boolean;
  readingReminderWeekday: string | null;
  readingReminderWeekend: string | null;
  weeklyGoalDays: number | null;
  windows: { dayType: ScheduleDayType; startTime: string; endTime: string }[];
}

