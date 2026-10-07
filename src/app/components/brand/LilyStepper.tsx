"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { animate } from "animejs";
import { Check } from "lucide-react";
import { prefersReducedMotion } from "../../utils/motion";
import Frog, { type FrogMood } from "./Frog";

type Props = { steps: string[]; current: number; mood?: FrogMood; waiting?: boolean };

/** Các bước là những lá sen nối nhau, ếch nhảy sang lá của bước hiện tại. */
export default function LilyStepper({ steps, current, mood = "idle", waiting = false }: Props) {
  const rowRef = useRef<HTMLOListElement>(null);
  const frogRef = useRef<HTMLDivElement>(null);
  const placed = useRef(false);

  const centerOf = (i: number) => {
    const pad = rowRef.current?.querySelectorAll<HTMLElement>(".lily")[i];
    return pad ? pad.offsetLeft + pad.offsetWidth / 2 : 0;
  };

  useLayoutEffect(() => {
    const frog = frogRef.current;
    if (!frog) return;
    const x = centerOf(current) - frog.offsetWidth / 2;
    if (!placed.current || prefersReducedMotion()) {
      frog.style.transform = `translateX(${x}px)`;
      placed.current = true;
      return;
    }
    const a = animate(frog, { translateX: x, duration: 650, ease: "inOutQuad" });
    const hop = animate(frog.firstElementChild as HTMLElement, { translateY: [0, -34, 0], duration: 650, ease: "outQuad" });
    return () => { a.revert(); hop.revert(); };
  }, [current]);

  useEffect(() => {
    const onResize = () => {
      const frog = frogRef.current;
      if (frog) frog.style.transform = `translateX(${centerOf(current) - frog.offsetWidth / 2}px)`;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [current]);

  return (
    <div className="lily-wrap">
      <div ref={frogRef} className="lily-frog"><div><Frog size={64} mood={waiting ? "happy" : mood} /></div></div>
      <ol ref={rowRef} className="lily-row">
        {steps.map((s, i) => {
          const done = i < current || (waiting && i <= current);
          const run = i === current && !waiting;
          return (
            <li key={s} className={`lily${done ? " done" : ""}${run ? " run" : ""}`}>
              <span className="lily-pad">{done ? <Check /> : i + 1}</span>
              <span className="lily-label">{s}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
