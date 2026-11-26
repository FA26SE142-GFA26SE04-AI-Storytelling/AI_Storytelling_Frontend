"use client";

import "@/app/styles/features/kid/kid-time.css";
import { BellRing, Flame, Trophy, X } from "lucide-react";
import { weekProgressText } from "@/app/lib/readingHabit";
import type { ChildHabit } from "@/app/types/readingSchedule";

/**
 * Thẻ thói quen đọc của bé: chuỗi ngày đọc, tiến độ tuần so với mục tiêu, và lời nhắc đến giờ đọc (nếu đang có).
 * Chỉ hiện khi bố mẹ bật thói quen đọc. Thời gian còn lại nằm ở chip đồng hồ trên thanh trên (KidHud).
 */
export default function KidHabitStrip({ habit, reminder, onDismissReminder }: { habit: ChildHabit | null; reminder: string | null; onDismissReminder: () => void }) {
  if (!habit?.enabled) return null;
  const goal = habit.weeklyGoalDays;
  return (
    <>
      {reminder && (
        <p className="kid-reminder" role="status">
          <BellRing className="ic" aria-hidden /><span>{reminder}</span>
          <button type="button" className="kid-reminder-x" aria-label="Đóng lời nhắc" onClick={onDismissReminder}><X size={16} aria-hidden /></button>
        </p>
      )}
      <section className="kid-habit" aria-label="Thói quen đọc của em">
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
        {habit.goalMetThisWeek && <span className="kid-habit-done">Em đạt mục tiêu tuần này rồi!</span>}
      </section>
    </>
  );
}
