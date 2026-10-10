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

// Bảng màu của linh vật
const GREEN = "#7cc455";
const GREEN_DARK = "#4b7b37";
const BELLY = "#d7d088";
const RING = "#e9e9e6";
const INK = "#363636";

const EYES = [{ cx: 130, cy: 64 }, { cx: 276, cy: 64 }];

/** Một bàn chân có đúng 3 ngón xoè ra: [x, y, góc nghiêng]. */
const toes = (list: [number, number, number][], rx: number, ry: number, fill: string) =>
  list.map(([x, y, rot]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={rx} ry={ry} fill={fill} transform={`rotate(${rot} ${x} ${y})`} />);

/**
 * Linh vật ếch Taletale: ếch xanh ngồi nhìn thẳng, bụng kem, hai chân sau xanh đậm.
 * Khi `animated`: chớp mắt (mí mắt phủ xuống) và thở nhẹ (thân nhấp nhô).
 */
export default function Frog({ size = 120, mood = "idle", variant = "full", animated = true, className }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !animated || prefersReducedMotion()) return;
    const lids = Array.from(root.querySelectorAll<SVGElement>(".frog-lid"));
    const body = root.querySelector<SVGElement>(".frog-body");
    const blink = animate(lids, { scaleY: [0, 1, 0], duration: 220, loop: true, loopDelay: 3200, ease: "inOutSine" });
    const breathe = body ? animate(body, { translateY: [0, 4], duration: 1500, loop: true, alternate: true, ease: "inOutSine" }) : null;
    return () => { blink.revert(); breathe?.revert(); };
  }, [animated]);

  const face = variant === "face";
  // Khi nghĩ, mắt liếc lên góc phải
  const look = mood === "think" ? { x: 5, y: -6 } : { x: 0, y: 0 };

  const mouth = mood === "happy"
    ? (
      <g>
        <path d="M156 124 Q203 134 250 124 Q246 168 203 170 Q160 168 156 124Z" fill="#3a3a3a" />
        <path d="M178 156 Q203 146 228 156 Q222 168 203 169 Q184 168 178 156Z" fill="#e0707f" />
      </g>
    )
    : <path d="M158 126 Q203 134 248 126 Q203 154 158 126Z" fill={INK} />;

  return (
    <svg
      ref={ref}
      className={className}
      width={size}
      height={face ? size * 0.6 : size * 1.135}
      viewBox={face ? "68 20 270 162" : "0 0 405 460"}
      role="img"
      aria-label="Linh vật ếch Taletale"
    >
      {/* chân sau: đùi xanh đậm, bàn chân dẹt và 3 ngón xoè */}
      {!face && (
        <g fill={GREEN_DARK}>
          <ellipse cx="62" cy="238" rx="50" ry="72" transform="rotate(-18 62 238)" />
          <ellipse cx="346" cy="246" rx="52" ry="80" transform="rotate(14 346 246)" />
          <ellipse cx="94" cy="326" rx="38" ry="19" transform="rotate(-8 94 326)" />
          <ellipse cx="312" cy="328" rx="38" ry="19" transform="rotate(8 312 328)" />
          {toes([[68, 350, 16], [94, 358, 0], [120, 350, -16]], 9, 17, GREEN_DARK)}
          {toes([[286, 352, 16], [312, 360, 0], [338, 352, -16]], 9, 17, GREEN_DARK)}
        </g>
      )}

      <g className="frog-body" style={{ transformBox: "fill-box" }}>
        {/* thân và đầu */}
        <ellipse cx="203" cy="212" rx="126" ry="140" fill={GREEN} />
        <ellipse cx="203" cy="226" rx="106" ry="122" fill={BELLY} />

        {/* hai chân trước: cánh tay xanh nghiêng, bàn tay có 3 ngón */}
        {!face && (
          <g>
            <line x1="123" y1="204" x2="168" y2="330" stroke={GREEN} strokeWidth="24" strokeLinecap="round" />
            <line x1="269" y1="204" x2="232" y2="330" stroke={GREEN} strokeWidth="24" strokeLinecap="round" />
            <ellipse cx="168" cy="338" rx="21" ry="11" fill={GREEN} />
            <ellipse cx="233" cy="338" rx="21" ry="11" fill={GREEN} />
            {toes([[152, 358, 14], [168, 364, 0], [184, 358, -14]], 8.5, 14, GREEN)}
            {toes([[217, 358, 14], [233, 364, 0], [249, 358, -14]], 8.5, 14, GREEN)}
          </g>
        )}

        {/* mắt: núm xanh, viền trắng, đồng tử xám đậm */}
        {EYES.map(({ cx, cy }) => (
          <g key={cx}>
            <circle cx={cx} cy={cy} r="38" fill={GREEN} />
            <circle cx={cx} cy={cy} r="27" fill={RING} />
            <circle cx={cx + look.x} cy={cy + look.y} r="21" fill={INK} />
            {/* mí mắt: phủ xuống khi chớp */}
            <ellipse className="frog-lid" cx={cx} cy={cy - 27} rx="28" ry="28" fill={GREEN} style={{ transform: "scaleY(0)", transformBox: "fill-box", transformOrigin: "50% 0%" }} />
          </g>
        ))}

        {/* lỗ mũi và miệng */}
        <ellipse cx="190" cy="82" rx="7" ry="6" fill={GREEN_DARK} />
        <ellipse cx="216" cy="82" rx="7" ry="6" fill={GREEN_DARK} />
        {mouth}

        {mood === "think" && (
          <g fill="var(--faint)">
            <circle cx="344" cy="26" r="4" />
            <circle cx="358" cy="12" r="7" />
          </g>
        )}
      </g>
    </svg>
  );
}
