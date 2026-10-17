"use client";

import { useEffect, useRef, useState } from "react";
import { childAccessService } from "@/app/services/childAccessService";
import { isNarrating, KID_ACTIVITY_PING_MS, KID_IDLE_TIMEOUT_MS, onKidActivity } from "@/app/lib/kidActivity";

export type KidSessionEnd = "idle" | "revoked" | "expired";

const CHECK_MS = 15_000;
const INPUT_EVENTS = ["pointerdown", "keydown", "touchstart", "wheel"] as const;

/**
 * Giữ Child Session còn sống trên backend khi bé đang dùng, và kết thúc phiên khi:
 * - 20 phút không hoạt động (không thao tác, không telemetry, không đang nghe đọc) — `idle`;
 * - backend từ chối token phiên (bố mẹ thu hồi mã QR, tạm dừng hồ sơ, backend đã tự hết hạn) — `revoked`;
 * - token phiên hết thời hạn — `expired`.
 * Mất mạng thì giữ nguyên phiên, lần kiểm tra sau thử lại.
 */
export function useKidSession(): KidSessionEnd | null {
  const [ended, setEnded] = useState<KidSessionEnd | null>(null);
  const lastActivity = useRef(0);
  const lastPing = useRef(0);

  useEffect(() => {
    lastActivity.current = Date.now();
    lastPing.current = Date.now();
    let stopped = false;
    const end = (reason: KidSessionEnd) => {
      if (stopped) return;
      stopped = true;
      childAccessService.clearSession();
      setEnded(reason);
    };
    const touch = () => { lastActivity.current = Date.now(); };

    const tick = async () => {
      if (stopped) return;
      const now = Date.now();
      if (isNarrating()) lastActivity.current = now;
      const session = childAccessService.readSession();
      if (!session) { end("expired"); return; }
      if (now - lastActivity.current >= KID_IDLE_TIMEOUT_MS) { end("idle"); return; }
      // Chỉ báo backend khi bé thực sự vừa hoạt động, để backend cũng tự hết hạn đúng 20 phút khi bé bỏ dở.
      if (lastActivity.current > lastPing.current && now - lastPing.current >= KID_ACTIVITY_PING_MS) {
        lastPing.current = now;
        if ((await childAccessService.checkSession(session.accessToken)) === "expired") end("revoked");
      }
    };

    INPUT_EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const offActivity = onKidActivity(touch);
    const timer = setInterval(() => void tick(), CHECK_MS);
    return () => {
      stopped = true;
      INPUT_EVENTS.forEach((e) => window.removeEventListener(e, touch));
      offActivity();
      clearInterval(timer);
    };
  }, []);

  return ended;
}
