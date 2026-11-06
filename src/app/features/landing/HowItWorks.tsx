"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useSwap } from "@/app/lib/motion";
import { STEPS } from "./landingContent";

/** "Cách hoạt động": danh sách 5 bước bên trái, bấm bước nào thì khung bên phải đổi theo. */
export default function HowItWorks() {
  const [cur, setCur] = useState(0);
  const step = STEPS[cur];
  const panelRef = useSwap<HTMLDivElement>(cur);

  return (
    <div className="ld-how">
      <ol className="ld-how-list">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button type="button" className={i === cur ? "on" : ""} aria-pressed={i === cur} aria-controls="ld-how-panel" onClick={() => setCur(i)}>
              <span className="ld-how-num" aria-hidden>{i < cur ? <Check /> : i + 1}</span>
              <span className="ld-how-label">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <div id="ld-how-panel" className="ld-how-panel" aria-live="polite">
        <div ref={panelRef} className="ld-how-inner">
          <h3 className="display">{step.title}</h3>
          <p>{step.text}</p>
        </div>
      </div>
    </div>
  );
}
