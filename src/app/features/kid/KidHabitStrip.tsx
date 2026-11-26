"use client";

import "@/app/styles/features/kid/kid-time.css";
import { BellRing, Flame, Monitor, Trophy, X } from "lucide-react";
import { weekProgressText } from "@/app/lib/readingHabit";
import type { ChildHabit, ReadingTimeStatus } from "@/app/types/readingSchedule";

/**
 * Thẻ thói quen đọc của bé: chuỗi ngày đọc, tiến độ tuần so với mục tiêu, số phút màn hình còn lại hôm nay
 * và lời nhắc đến giờ đọc (nếu đang có). Hiện khi bố mẹ bật thói quen đọc hoặc giới hạn màn hình.
 */
export default function KidHabitStrip({ habit, readingTime, reminder, onDismissReminder }: {
  habit: ChildHabit | null; readingTime?: ReadingTimeStatus | null; reminder: string | null; onDismissReminder: () => void;
}) {
  const limit = readingTime?.screenMinutesLimit ?? null;
  const screenLeft = limit !== null ? Math.max(0, limit - (readingTime?.screenMinutesUsed ?? 0)) : null;
  const showHabit = !!habit?.enabled;
  if (!showHabit && screenLeft === null) return null;
  const goal = habit?.weeklyGoalDays ?? null;
  return (
    <>
      {reminder && showHabit && (
        <p className="kid-reminder" role="status">
          <BellRing className="ic" aria-hidden /><span>{reminder}</span>
          <button type="button" className="kid-reminder-x" aria-label="Đóng lời nhắc" onClick={onDismissReminder}><X size={16} aria-hidden /></button>
        </p>
      )}
      <section className="kid-habit" aria-label="Thói quen đọc của em">
        {showHabit && habit && (
          <>
            <span className="kid-habit-item"><Flame className="ic" aria-hidden />Chuỗi ngày đọc <b>{habit.streakDays} ngày</b></span>
            <span className="kid-habit-item">
              {habit.goalMetThisWeek ? <Trophy className="ic" aria-hidden /> : null}
              Tuần này em đọc <b>{weekProgressText(habit)}</b>
            </span>
            {goal !== null && (
              <span className="kid-habit-dots" role="img" aria-label={`${Math.min(habit.daysReadThisWeek, goal)} trên ${goal} ngày`}>
                {Array.from({ length: goal }, (_, i) => <i key={i} className={i < habit.daysReadThisWeek ? "on" : ""} />)}
              </span>
            )}
          </>
        )}
        {screenLeft !== null && <span className="kid-habit-item"><Monitor className="ic" aria-hidden />Hôm nay còn <b>{screenLeft} phút</b></span>}
        {showHabit && habit?.goalMetThisWeek && <span className="kid-habit-done">Em đạt mục tiêu tuần này rồi!</span>}
      </section>
    </>
  );
}
