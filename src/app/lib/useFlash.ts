import { useCallback, useEffect, useRef, useState } from "react";

/** Cờ bật trong một thời gian ngắn (ví dụ hiện dấu tích “Đã lưu” trên nút). Trả về [đang bật, kích hoạt]. */
export function useFlash(ms = 1400) {
  const [on, setOn] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const flash = useCallback(() => {
    setOn(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOn(false), ms);
  }, [ms]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [on, flash] as const;
}
