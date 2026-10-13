"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/app/lib/motion";
import { displayedProgress, nextShownStep, type StudioProgress } from "./studioProgress";

/** Thời gian đi qua một bước; bằng thời gian đường nối chạy màu trong CSS (.ss + .ss::before) để thanh fill liền mạch. */
export const STEP_MS = 420;

/**
 * Thanh tiến trình đuổi theo bước thật từng bước một, để thấy rõ đã đi qua những bước nào.
 * Đặt ở cấp Studio (không đặt trong thanh) vì thanh được dựng lại mỗi khi Studio đổi bố cục.
 * Bắt đầu từ bước đầu: mở lại một truyện đang ở giữa chừng thì thanh fill dần tới bước hiện tại.
 */
export function useSteppedProgress(progress: StudioProgress): StudioProgress {
  const [shown, setShown] = useState(0);
  const target = progress.current;

  useEffect(() => {
    if (shown === target) return;
    // Lùi (làm lại, đã dừng) thì đổi ngay; tiến thì mỗi nhịp một bước.
    const wait = target < shown || prefersReducedMotion() ? 0 : STEP_MS;
    const timer = setTimeout(() => setShown((s) => nextShownStep(s, target)), wait);
    return () => clearTimeout(timer);
  }, [shown, target]);

  return displayedProgress(progress, shown);
}
