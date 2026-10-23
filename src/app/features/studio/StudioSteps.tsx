"use client";

import type { ReactNode } from "react";
import { Check, CircleAlert, Hand, LoaderCircle } from "lucide-react";
import { useRiseIn } from "@/app/lib/motion";
import { STUDIO_STEPS, stepMode, type StudioProgress } from "./studioProgress";

const CAPTION_ICON = { run: LoaderCircle, you: Hand, error: CircleAlert, done: Check, todo: Check } as const;

/** Thanh tiến trình luôn hiện ở đầu Studio: bé lá nào đang sáng là bước đang làm. */
export default function StudioSteps({ progress, children, context }: { progress: StudioProgress; children?: ReactNode; context?: ReactNode }) {
  // Khung mô tả đứng yên (chỉ đổi màu mượt); chỉ chữ hiện dần khi nội dung mô tả thật sự đổi.
  // Khoá theo nội dung chữ chứ không theo từng lá đang chạy qua, nên thanh fill dần không làm chữ chớp lại.
  const capRef = useRiseIn<HTMLDivElement>(":scope > span", [progress.caption], { distance: 6 });
  const Icon = CAPTION_ICON[progress.mode];
  const current = progress.current;
  const shown = Math.max(current, 0) + 1;

  return (
    <nav className={`studio-steps${context ? ' has-story' : ''}`} aria-label="Tiến trình tạo truyện">
      <ol>
        {STUDIO_STEPS.map((label, i) => {
          const mode = stepMode(i, progress);
          return (
            <li key={label} className={`ss ${mode}`} aria-current={i === progress.current ? "step" : undefined}>
              <span className="ss-pad">{mode === "done" ? <Check /> : mode === "error" ? <CircleAlert /> : i + 1}</span>
              <span className="ss-label">{label}</span>
            </li>
          );
        })}
      </ol>
      <div ref={capRef} className={`ss-caption ${progress.mode}`} role="status">
        <Icon className={`ic${progress.mode === "run" ? " spin" : ""}`} />
        <span><small>{progress.current >= 0 ? `Bước ${shown}/${STUDIO_STEPS.length}` : "Đã dừng"}</small>{progress.caption}</span>
      </div>
      {children}
      {context && <div className="studio-story-resume">{context}</div>}
    </nav>
  );
}
