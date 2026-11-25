"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { childAccessService } from "@/app/services/childAccessService";
import type { ChildHabit, ReadingTimeStatus } from "@/app/types/readingSchedule";

/** Backend cộng thời gian màn hình khi hai lần gọi cách nhau tối đa 2 phút, nên app hỏi lại `/me` mỗi phút khi bé đang ở ngoài truyện. */
export const KID_STATUS_POLL_MS = 60_000;

export type ChildStatus = {
  readingTime: ReadingTimeStatus | null;
  habit: ChildHabit | null;
  /** Hỏi lại ngay (ví dụ khi hết giờ nghỉ, sau khi bé đọc xong một truyện). */
  refresh: () => void;
};

/**
 * Trạng thái giờ đọc và thói quen của bé, lấy từ `/ChildAccessCredential/me` rồi hỏi lại mỗi phút khi trang đang hiện.
 * Lỗi mạng hay phiên hết hạn thì giữ giá trị cũ; việc kết thúc phiên do `useKidSession` lo.
 */
export function useChildStatus(childId: number): ChildStatus {
  const [state, setState] = useState<{ readingTime: ReadingTimeStatus | null; habit: ChildHabit | null }>({ readingTime: null, habit: null });
  const alive = useRef(true);
  const inflight = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    const session = childAccessService.readSession();
    if (!session || session.childProfileId !== childId) return;
    inflight.current?.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;
    void childAccessService.getSessionProfile(session.accessToken).then((r) => {
      if (ctrl.signal.aborted || !alive.current || !r.success || !r.data) return;
      setState({ readingTime: r.data.readingTime ?? null, habit: r.data.habit ?? null });
    });
  }, [childId]);

  useEffect(() => {
    alive.current = true;
    refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") refresh(); }, KID_STATUS_POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive.current = false;
      inflight.current?.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { ...state, refresh };
}

/** Đồng hồ chạy mỗi giây khi `active`; dùng cho các dòng đếm ngược. */
export function useNow(active: boolean, ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(timer);
  }, [active, ms]);
  return now;
}
