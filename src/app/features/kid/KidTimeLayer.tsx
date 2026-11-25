"use client";

import "@/app/styles/features/kid/kid-time.css";
import { useEffect, useRef } from "react";
import { Clock, Home } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import { formatCountdown, restCopy, secondsUntil, warnLine } from "@/app/lib/readingTime";
import type { ReadingTimeStatus } from "@/app/types/readingSchedule";
import { useDialog } from "./useDialog";
import { useNow } from "./useChildStatus";

/**
 * Màn nghỉ / màn chặn phủ lên trang của bé khi không được đọc: nghỉ mắt, giờ ngủ, hết phút màn hình, ngoài khung giờ.
 * Có mốc kết thúc thì đếm ngược; về 0 thì gọi `onDone` để hỏi lại backend. Có `onExit` thì hiện nút về với bố mẹ.
 */
export function KidRestOverlay({ status, onDone, onExit }: { status: ReadingTimeStatus; onDone: () => void; onExit?: () => void }) {
  const copy = restCopy(status);
  const now = useNow(copy.until !== null);
  const left = secondsUntil(copy.until, now);
  const ref = useDialog<HTMLDivElement>(() => {});
  const finished = left === 0;
  // onDone đổi mỗi lần render ở nơi gọi; giữ trong ref để chỉ hỏi lại một lần khi đếm về 0.
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; });
  useEffect(() => { if (finished) doneRef.current(); }, [finished]);

  return (
    <div className="kid-quiz-backdrop">
      <section ref={ref} tabIndex={-1} className="ksection kid-ended kid-rest" role="alertdialog" aria-modal="true" aria-label={copy.title} data-state={status.state}>
        <Frog mood={copy.mood} size={130} />
        <h2 className="display">{copy.title}</h2>
        <p>{copy.hint}</p>
        {left !== null && (
          <p className="kid-rest-count" role="timer">
            <Clock className="ic" aria-hidden />{copy.label} <b>{formatCountdown(left)}</b>
          </p>
        )}
        {onExit && <button type="button" className="btn btn-p" onClick={onExit}><Home className="ic" aria-hidden />Về với bố mẹ</button>}
      </section>
    </div>
  );
}

/** Dải cảnh báo mỏng khi sắp hết giờ (EndingSoon) hoặc đang cho đọc nốt (Grace). Trạng thái khác thì không hiện gì. */
export function KidTimeBanner({ status }: { status: ReadingTimeStatus | null }) {
  const warn = status?.state === "EndingSoon" || status?.state === "Grace";
  const now = useNow(warn);
  const line = warn ? warnLine(status, now) : null;
  if (!line) return null;
  return <p className="kid-time-banner" role="status" data-state={status?.state}><Clock className="ic" aria-hidden />{line}</p>;
}
