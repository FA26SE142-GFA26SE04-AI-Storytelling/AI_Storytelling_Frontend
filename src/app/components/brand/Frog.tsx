"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { prefersReducedMotion } from "@/app/lib/motion";

export type FrogMood = "idle" | "happy" | "think";

type Props = {
  size?: number;
  mood?: FrogMood;
  /** "face" chỉ lấy phần đầu, dùng làm logo. */
  variant?: "full" | "face";
  animated?: boolean;
  className?: string;
};

const BODY = "#3dbe7a";
const BODY_DARK = "#2a9d63";
const BELLY = "#e8f9ef";
const INK = "#1f3a2d";

/** Linh vật ếch Taletale, vẽ bằng SVG. Chớp mắt và thở nhẹ khi `animated`. */
export default function Frog({ size = 120, mood = "idle", variant = "full", animated = true, className }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !animated || prefersReducedMotion()) return;
    const eyes = Array.from(root.querySelectorAll<SVGElement>(".frog-eye"));
    const body = root.querySelector<SVGElement>(".frog-body");
    const blink = animate(eyes, { scaleY: [1, 0.1, 1], duration: 200, loop: true, loopDelay: 3200, ease: "inOutSine" });
    const breathe = body ? animate(body, { translateY: [0, 2.5], duration: 1400, loop: true, alternate: true, ease: "inOutSine" }) : null;
    return () => { blink.revert(); breathe?.revert(); };
  }, [animated]);

  const look = mood === "think" ? { x: 3, y: -3 } : { x: 0, y: 0 };
  const face = variant === "face";
  const mouth = mood === "happy"
    ? <path d="M58 76 Q80 102 102 76 Q80 84 58 76Z" fill="#c2415b" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    : <path d="M60 78 Q80 92 100 78" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />;

  return (
    <svg
      ref={ref}
      className={className}
      width={size}
      height={face ? size * 0.8 : size * 0.82}
      viewBox={face ? "20 14 120 96" : "0 0 160 130"}
      role="img"
      aria-label="Linh vật ếch Taletale"
    >
      {!face && <ellipse cx="80" cy="120" rx="50" ry="7" fill="#000" opacity=".12" />}
      {!face && (
        <>
          <ellipse cx="34" cy="108" rx="22" ry="10" fill={BODY_DARK} />
          <ellipse cx="126" cy="108" rx="22" ry="10" fill={BODY_DARK} />
        </>
      )}
      <g className="frog-body" style={{ transformBox: "fill-box" }}>
        <ellipse cx="80" cy="78" rx="52" ry="40" fill={BODY} />
        <ellipse cx="80" cy="90" rx="34" ry="24" fill={BELLY} />
        {[52, 108].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="42" r="20" fill={BODY} />
            <circle cx={cx} cy="42" r="13" fill="#fff" />
            <g className="frog-eye" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <circle cx={cx + look.x} cy={42 + look.y} r="6.5" fill={INK} />
              <circle cx={cx + look.x + 2} cy={42 + look.y - 2} r="2" fill="#fff" />
            </g>
          </g>
        ))}
        <circle cx="42" cy="70" r="7" fill="#ff9db4" opacity=".7" />
        <circle cx="118" cy="70" r="7" fill="#ff9db4" opacity=".7" />
        <circle cx="74" cy="62" r="1.8" fill={BODY_DARK} />
        <circle cx="86" cy="62" r="1.8" fill={BODY_DARK} />
        {mouth}
        {mood === "think" && (
          <g>
            <circle cx="132" cy="22" r="3" fill="var(--faint)" />
            <circle cx="141" cy="12" r="5" fill="var(--faint)" />
          </g>
        )}
      </g>
    </svg>
  );
}
