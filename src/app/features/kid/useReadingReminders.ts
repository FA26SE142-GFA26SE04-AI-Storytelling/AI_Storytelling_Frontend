"use client";

import { useCallback, useEffect, useState } from "react";
import { isQuiet, nextReminder } from "@/app/lib/readingHabit";
import type { ChildHabit } from "@/app/types/readingSchedule";

/** setTimeout lưu số mili giây kiểu 32 bit có dấu; lần nhắc xa hơn thì hẹn lại sau khi đạt mốc này. */
const MAX_TIMEOUT_MS = 2_147_000_000;

/**
 * Nhắc bé đọc truyện theo lịch `habit.reminders` mà backend tính sẵn. Backend không gửi gì: app tự hẹn giờ khi đang mở.
 * Không nhắc trong giờ ngủ (`quietPeriods`). Trả về câu nhắc đang chờ bé xem (hoặc null) và hàm đóng lời nhắc.
 * Thông báo của trình duyệt chỉ hiện khi người lớn đã cấp quyền từ trước; app không tự xin quyền.
 */
export function useReadingReminders(habit: ChildHabit | null): { message: string | null; dismiss: () => void } {
  const [message, setMessage] = useState<string | null>(null);
  const dismiss = useCallback(() => setMessage(null), []);

  useEffect(() => {
    let timer: number | undefined;
    const arm = (afterMs: number) => {
      const next = nextReminder(habit, afterMs);
      if (!next) return;
      timer = window.setTimeout(() => {
        if (next.atMs - Date.now() > 1000) { arm(afterMs); return; }
        if (!isQuiet(habit?.quietPeriods, Date.now())) {
          setMessage(next.message);
          if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState !== "visible") {
            try { new Notification("Taletale", { body: next.message }); } catch { /* trình duyệt không cho tạo thông báo */ }
          }
        }
        arm(next.atMs);
      }, Math.min(Math.max(0, next.atMs - Date.now()), MAX_TIMEOUT_MS));
    };
    arm(Date.now());
    return () => window.clearTimeout(timer);
  }, [habit]);

  return { message, dismiss };
}
