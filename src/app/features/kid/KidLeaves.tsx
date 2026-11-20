"use client";

// Hiệu ứng lá rơi trang trí đầm sen cho không gian của bé
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { prefersReducedMotion } from "@/app/lib/motion";
import { petalBurst } from "./kidFx";
import "@/app/styles/features/kid/kid-leaves.css";

interface LeafConfig {
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  sway: number;
  kind: 0 | 1 | 2;
  opacity: number;
  color: string;
  catch: boolean;
  extra: boolean;
}

// 10 lá cấu hình cố định, 4 lá cuối ẩn trên màn hẹp (<=720px), đúng 3 lá bắt được
const LEAVES: readonly LeafConfig[] = [
  { left: "8%", top: "14%", size: 28, duration: 16, delay: -4, sway: 3.8, kind: 0, opacity: 0.7, color: "var(--primary)", catch: false, extra: false },
  { left: "3%", top: "42%", size: 34, duration: 20, delay: -12, sway: 4.4, kind: 1, opacity: 0.8, color: "color-mix(in srgb, var(--primary) 60%, var(--gold))", catch: true, extra: false },
  { left: "37%", top: "26%", size: 24, duration: 15, delay: -7, sway: 3.2, kind: 2, opacity: 0.6, color: "color-mix(in srgb, var(--mint) 70%, var(--primary))", catch: false, extra: false },
  { left: "53%", top: "68%", size: 38, duration: 22, delay: -17, sway: 4.8, kind: 0, opacity: 0.75, color: "var(--gold)", catch: false, extra: false },
  { left: "95%", top: "34%", size: 30, duration: 18, delay: -2, sway: 3.6, kind: 1, opacity: 0.85, color: "var(--primary)", catch: true, extra: false },
  { left: "82%", top: "62%", size: 26, duration: 24, delay: -10, sway: 4.2, kind: 2, opacity: 0.65, color: "color-mix(in srgb, var(--primary) 60%, var(--gold))", catch: false, extra: false },
  { left: "14%", top: "76%", size: 22, duration: 17, delay: -15, sway: 3.4, kind: 0, opacity: 0.55, color: "color-mix(in srgb, var(--mint) 70%, var(--primary))", catch: false, extra: true },
  { left: "91%", top: "18%", size: 40, duration: 14, delay: -5, sway: 4.6, kind: 1, opacity: 0.82, color: "var(--gold)", catch: true, extra: true },
  { left: "76%", top: "82%", size: 32, duration: 21, delay: -19, sway: 4.0, kind: 2, opacity: 0.68, color: "var(--primary)", catch: false, extra: true },
  { left: "92%", top: "46%", size: 36, duration: 23, delay: -9, sway: 3.5, kind: 0, opacity: 0.72, color: "color-mix(in srgb, var(--primary) 60%, var(--gold))", catch: false, extra: true },
];

function LeafSvg({ kind, color }: { kind: 0 | 1 | 2; color: string }) {
  const stroke = "color-mix(in srgb, var(--text) 20%, transparent)";
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" aria-hidden="true">
      {kind === 0 && (
        <>
          <path d="M12 2 C18 7 19 16 12 22 C5 16 6 7 12 2 Z" fill={color} stroke={stroke} strokeWidth="1.2" />
          <path d="M12 4 L12 20" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {kind === 1 && (
        <>
          <path d="M12 12 L14 2.5 A9.5 9.5 0 1 1 10 2.5 Z" fill={color} stroke={stroke} strokeWidth="1.2" />
          <path d="M12 12 L7 7 M12 12 L17 7 M12 12 L6 14 M12 12 L18 14 M12 12 L12 20" stroke={stroke} strokeWidth="0.8" strokeLinecap="round" />
        </>
      )}
      {kind === 2 && (
        <>
          <path d="M12 22 C12 16 12 13 12 11" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M12 13 C7 12 4 7 7 4 C10 4 12 8 12 13 Z" fill={color} stroke={stroke} strokeWidth="1.2" />
          <path d="M12 15 C17 14 20 9 17 6 C14 6 12 10 12 15 Z" fill={color} stroke={stroke} strokeWidth="1.2" />
        </>
      )}
    </svg>
  );
}

export default function KidLeaves() {
  const [reduced, setReduced] = useState(false);
  const [caught, setCaught] = useState<Record<number, boolean>>({});
  const [resetKeys, setResetKeys] = useState<Record<number, number>>({});
  const timersRef = useRef<Record<number, number>>({});

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach((id) => clearTimeout(id));
    };
  }, []);

  const handleCatch = (index: number, e: MouseEvent<HTMLButtonElement>) => {
    if (caught[index]) return; // Đang bay thì bỏ qua

    const rect = e.currentTarget.getBoundingClientRect();
    petalBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 8, [
      "var(--primary)",
      "color-mix(in srgb, var(--mint) 70%, var(--primary))",
    ]);

    setCaught((prev) => ({ ...prev, [index]: true }));
    if (timersRef.current[index]) clearTimeout(timersRef.current[index]);

    timersRef.current[index] = window.setTimeout(() => {
      setCaught((prev) => ({ ...prev, [index]: false }));
      setResetKeys((prev) => ({ ...prev, [index]: (prev[index] ?? 0) + 1 }));
      delete timersRef.current[index];
    }, 6000);
  };

  return (
    <div className="kid-leaves" aria-hidden="true">
      {LEAVES.map((leaf, i) => {
        const extraCls = leaf.extra ? " kid-leaf-extra" : "";
        const isCaught = !!caught[i];

        if (reduced) {
          const staticStyle = {
            position: "absolute" as const,
            left: leaf.left,
            top: leaf.top,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            opacity: isCaught ? 0.2 : leaf.opacity,
          };
          if (leaf.catch) {
            return (
              <button
                key={i}
                type="button"
                aria-label="Chiếc lá"
                onClick={(e) => handleCatch(i, e)}
                className={`kid-leaf-static kid-leaf-catch${extraCls}`}
                style={staticStyle}
              >
                <LeafSvg kind={leaf.kind} color={leaf.color} />
              </button>
            );
          }
          return (
            <span key={i} className={`kid-leaf-static${extraCls}`} style={staticStyle}>
              <LeafSvg kind={leaf.kind} color={leaf.color} />
            </span>
          );
        }

        const fallStyle = {
          left: leaf.left,
          width: `${leaf.size}px`,
          height: `${leaf.size}px`,
          animationDuration: `${leaf.duration}s`,
          animationDelay: `${resetKeys[i] ? 0 : leaf.delay}s`,
          opacity: leaf.opacity,
        };

        const inner = (
          <span className="kid-leaf-sway" style={{ animationDuration: `${leaf.sway}s` }}>
            <LeafSvg kind={leaf.kind} color={leaf.color} />
          </span>
        );

        if (leaf.catch) {
          return (
            <button
              key={`${i}-${resetKeys[i] ?? 0}`}
              type="button"
              aria-label="Chiếc lá"
              onClick={(e) => handleCatch(i, e)}
              className={`kid-leaf-fall kid-leaf-catch${extraCls}${isCaught ? " is-caught" : ""}`}
              style={fallStyle}
            >
              {inner}
            </button>
          );
        }

        return (
          <span key={i} className={`kid-leaf-fall${extraCls}`} style={fallStyle}>
            {inner}
          </span>
        );
      })}
    </div>
  );
}
