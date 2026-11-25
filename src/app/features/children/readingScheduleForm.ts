import type { ReadingSchedule, ScheduleDayType, SetReadingScheduleRequest } from "@/app/types/readingSchedule";

export type TimeRange = { start: string; end: string };

/** Giá trị form: giờ là chuỗi HH:mm ("" = chưa đặt), khung giờ tách theo ngày thường / cuối tuần. */
export type ScheduleValue = {
  enabled: boolean;
  weekday: TimeRange[];
  weekend: TimeRange[];
  bedtimeWeekday: string;
  bedtimeWeekend: string;
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
  readingReminderWeekday: string;
  readingReminderWeekend: string;
  weeklyGoalDays: number | null;
};

/** Mỗi loại ngày tối đa 2 khung giờ (backend: "Mỗi loại ngày tối đa 2 khung giờ."). */
export const MAX_WINDOWS = 2;
export const BREAK_AFTER_RANGE = { min: 15, max: 60, step: 5 } as const;
export const BREAK_DURATION_RANGE = { min: 1, max: 15, step: 1 } as const;
export const SCREEN_LIMIT_RANGE = { min: 10, max: 240, step: 5 } as const;
export const BEDTIME_RANGE = { min: "18:00", max: "23:30" } as const;
export const REMINDER_MIN = "06:00";
export const WEEKLY_GOALS = [1, 2, 3, 4, 5, 6, 7] as const;

export type ScheduleSection = "windows" | "bedtime" | "break" | "screen" | "habit" | "general";

const rangesOf = (dto: ReadingSchedule, dayType: ScheduleDayType): TimeRange[] =>
  dto.windows
    .filter((w) => w.dayType === dayType)
    .sort((a, b) => a.slot - b.slot)
    .map((w) => ({ start: w.startTime, end: w.endTime }));

/** Cấu hình backend trả về (đã lưu hoặc gợi ý theo tuổi) thành giá trị form. */
export const scheduleFrom = (dto: ReadingSchedule): ScheduleValue => ({
  enabled: dto.enabled,
  weekday: rangesOf(dto, "Weekday"),
  weekend: rangesOf(dto, "Weekend"),
  bedtimeWeekday: dto.bedtimeWeekday ?? "",
  bedtimeWeekend: dto.bedtimeWeekend ?? "",
  breakEnabled: dto.breakEnabled,
  breakAfterMinutes: dto.breakAfterMinutes,
  breakDurationMinutes: dto.breakDurationMinutes,
  breakRemindEyes: dto.breakRemindEyes,
  breakRemindWater: dto.breakRemindWater,
  breakRemindMove: dto.breakRemindMove,
  screenLimitEnabled: dto.screenLimitEnabled,
  screenLimitWeekdayMinutes: dto.screenLimitWeekdayMinutes,
  screenLimitWeekendMinutes: dto.screenLimitWeekendMinutes,
  habitEnabled: dto.habitEnabled,
  readingReminderWeekday: dto.readingReminderWeekday ?? "",
  readingReminderWeekend: dto.readingReminderWeekend ?? "",
  weeklyGoalDays: dto.weeklyGoalDays,
});

/** Hai nhóm trên form: giới hạn thời gian (khung giờ, giờ ngủ, màn hình, nghỉ) và thói quen đọc (nhắc, mục tiêu). */
export type ScheduleGroup = "limits" | "habit";
export const ALL_GROUPS: readonly ScheduleGroup[] = ["limits", "habit"];

const HABIT_FIELDS: readonly string[] = ["habitEnabled", "readingReminderWeekday", "readingReminderWeekend", "weeklyGoalDays"];

/** Nhóm nào đã khác giá trị đã lưu (thứ tự: giới hạn trước, thói quen sau). Rỗng khi chưa sửa gì. */
export function changedGroups(current: ScheduleValue, saved: ScheduleValue): ScheduleGroup[] {
  const groups = new Set<ScheduleGroup>();
  for (const key of Object.keys(current) as (keyof ScheduleValue)[]) {
    if (JSON.stringify(current[key]) !== JSON.stringify(saved[key])) {
      groups.add(HABIT_FIELDS.includes(key) ? "habit" : "limits");
    }
  }
  return ALL_GROUPS.filter((group) => groups.has(group));
}

const GROUP_NAME: Record<ScheduleGroup, string> = { limits: "giới hạn thời gian", habit: "thói quen đọc" };

/** Tên các nhóm dùng trong câu: "giới hạn thời gian", "thói quen đọc" hoặc cả hai nối bằng "và". */
export const groupsText = (groups: readonly ScheduleGroup[]): string => groups.map((group) => GROUP_NAME[group]).join(" và ");

/** Nhãn nút lưu: gọi đúng nhóm đang lưu; đủ cả hai thì dùng tên tab. */
export const saveLabel = (groups: readonly ScheduleGroup[]): string =>
  groups.length >= ALL_GROUPS.length ? "Lưu thời gian & thói quen" : `Lưu ${groupsText(groups)}`;

const orNull = (time: string): string | null => (time.trim() === "" ? null : time.trim());

const windowsOf = (ranges: TimeRange[], dayType: ScheduleDayType) =>
  // Dòng bỏ trống cả hai giờ coi như chưa thêm; dòng điền dở vẫn gửi để backend báo "Giờ không hợp lệ".
  ranges.filter((r) => r.start !== "" || r.end !== "").map((r) => ({ dayType, startTime: r.start, endTime: r.end }));

/** Backend thay toàn bộ cấu hình mỗi lần PUT, nên luôn gửi đủ mọi trường (kể cả nhóm thói quen). */
export const scheduleRequest = (v: ScheduleValue): SetReadingScheduleRequest => ({
  enabled: v.enabled,
  bedtimeWeekday: orNull(v.bedtimeWeekday),
  bedtimeWeekend: orNull(v.bedtimeWeekend),
  breakEnabled: v.breakEnabled,
  breakAfterMinutes: v.breakAfterMinutes,
  breakDurationMinutes: v.breakDurationMinutes,
  breakRemindEyes: v.breakRemindEyes,
  breakRemindWater: v.breakRemindWater,
  breakRemindMove: v.breakRemindMove,
  screenLimitEnabled: v.screenLimitEnabled,
  screenLimitWeekdayMinutes: v.screenLimitWeekdayMinutes,
  screenLimitWeekendMinutes: v.screenLimitWeekendMinutes,
  habitEnabled: v.habitEnabled,
  readingReminderWeekday: orNull(v.readingReminderWeekday),
  readingReminderWeekend: orNull(v.readingReminderWeekend),
  weeklyGoalDays: v.weeklyGoalDays,
  windows: [...windowsOf(v.weekday, "Weekday"), ...windowsOf(v.weekend, "Weekend")],
});

/**
 * Phần của form mà một lời báo lỗi 400 của backend nói tới, để hiện lỗi đúng chỗ.
 * Giờ nhắc / mục tiêu phải xét trước vì câu lỗi của chúng cũng nhắc tới "khung giờ" và "giờ đi ngủ".
 */
export function sectionOfError(message: string): ScheduleSection {
  const m = message.toLowerCase();
  if (m.includes("nhắc đọc") || m.includes("mục tiêu")) return "habit";
  if (m.includes("đi ngủ")) return "bedtime";
  if (m.includes("khung") || m.includes("giờ bắt đầu")) return "windows";
  if (m.includes("màn hình")) return "screen";
  if (m.includes("nghỉ")) return "break";
  return "general";
}
