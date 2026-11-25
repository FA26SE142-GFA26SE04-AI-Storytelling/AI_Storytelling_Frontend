import type { ChildHabit } from '@/app/types/readingSchedule';

/** Đang trong giờ yên lặng (giờ ngủ): app không được nhắc hay báo gì. */
export function isQuiet(periods: ChildHabit['quietPeriods'] | undefined, nowMs: number): boolean {
  return (periods ?? []).some((p) => Date.parse(p.from) <= nowMs && nowMs < Date.parse(p.to));
}

/** Lần nhắc đọc kế tiếp sau `afterMs` mà không rơi vào giờ yên lặng; thói quen tắt hoặc hết lần nhắc thì null. */
export function nextReminder(habit: ChildHabit | null | undefined, afterMs: number): { at: string; message: string; atMs: number } | null {
  if (!habit?.enabled) return null;
  let best: { at: string; message: string; atMs: number } | null = null;
  for (const r of habit.reminders) {
    const atMs = Date.parse(r.at);
    if (Number.isNaN(atMs) || atMs <= afterMs || isQuiet(habit.quietPeriods, atMs)) continue;
    if (!best || atMs < best.atMs) best = { at: r.at, message: r.message, atMs };
  }
  return best;
}

/** Câu tiến độ tuần cho thẻ thói quen: "2 / 3 ngày" khi có mục tiêu, "2 ngày" khi không. */
export function weekProgressText(habit: ChildHabit): string {
  return habit.weeklyGoalDays !== null ? `${habit.daysReadThisWeek} / ${habit.weeklyGoalDays} ngày` : `${habit.daysReadThisWeek} ngày`;
}
