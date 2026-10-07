"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { prefersReducedMotion } from "../../utils/motion";
import Frog, { type FrogMood } from "./Frog";
import Lotus from "./Lotus";

/** Ếch ngồi trên lá sen giữa gợn nước, thỉnh thoảng nhảy một cái. Dùng làm hình đầu trang. */
export default function HeroPond({ mood = "happy" }: { mood?: FrogMood }) {
  const frogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frogRef.current;
    if (!el || prefersReducedMotion()) return;
    const hop = animate(el, { translateY: [0, -26, 0], duration: 700, ease: "outQuad", loop: true, loopDelay: 4200 });
    return () => { hop.revert(); };
  }, []);

  return (
    <div className="hero-pond" aria-hidden>
      <span className="hero-ring r1" /><span className="hero-ring r2" />
      <svg className="hero-pad" width="190" height="62" viewBox="0 0 190 62">
        <ellipse cx="95" cy="38" rx="88" ry="22" fill="var(--primary)" opacity=".35" />
        <ellipse cx="95" cy="32" rx="84" ry="22" fill="var(--primary)" opacity=".55" />
        <path d="M95 32 L176 16" stroke="var(--primary-strong)" strokeWidth="2" opacity=".5" />
      </svg>
      <div ref={frogRef} className="hero-frog"><Frog size={118} mood={mood} /></div>
      <span className="hero-lotus"><Lotus size={64} /></span>
    </div>
  );
}
