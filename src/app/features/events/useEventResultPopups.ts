"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { eventService } from "@/app/services/eventService";
import { guardianService } from "@/app/services/guardianService";
import type { AppNotification } from "@/app/types/progress";
import {
  pickEventPopups,
  readDismissedNotificationIds,
  readShownAwardIds,
  rememberDismissedNotification,
  rememberShownAward,
  type EventPopup,
} from "./eventPopups";

export function useEventResultPopups() {
  const { user, accessToken } = useAuth();
  const eligible = Boolean(user && accessToken && (user.role === "User" || user.role === "ContentCreator"));
  const [queue, setQueue] = useState<EventPopup[]>([]);
  const current = eligible ? queue[0] ?? null : null;

  useEffect(() => {
    if (!eligible) {
      setQueue([]);
      return;
    }
    const abort = new AbortController();
    let active = true;
    void Promise.all([eventService.myResults(abort.signal), guardianService.notifications()]).then(
      ([resResults, resNotifs]) => {
        if (!active || abort.signal.aborted) return;
        const results = resResults.success && resResults.data ? resResults.data : [];
        const notifs = resNotifs.success && resNotifs.data ? resNotifs.data : [];
        setQueue(pickEventPopups(results, notifs, readShownAwardIds(), readDismissedNotificationIds()));
      },
    );
    return () => {
      active = false;
      abort.abort();
    };
  }, [eligible, user?.id]);

  // Chỉ ghi nhận khi người dùng tự đóng / bấm nút trên pop-up: pop-up giải lộ ra
  // trong lúc đang chuyển trang (ParentShell dựng lại) phải được hiện lại ở trang mới.
  const dismissCurrent = useCallback(() => {
    if (!current) return;
    if (current.notificationId) {
      rememberDismissedNotification(current.notificationId);
      void guardianService.markNotificationRead({ id: current.notificationId } as AppNotification);
    }
    if (current.kind === "award" && current.award) rememberShownAward(current.award.awardId);
    setQueue((prev) => prev[0] === current ? prev.slice(1) : prev);
  }, [current]);

  return {
    current,
    remainingCount: Math.max(0, queue.length - 1),
    dismissCurrent,
  };
}
