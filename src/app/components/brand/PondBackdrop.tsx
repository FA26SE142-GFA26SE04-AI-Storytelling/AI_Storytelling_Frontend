"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { useTheme } from "../../context/ThemeContext";
import { prefersReducedMotion } from "../../utils/motion";
import Lotus from "./Lotus";

const PADS = [
  { x: "6%", y: "78%", s: 120, r: -12, o: 0.55, flower: true },
  { x: "84%", y: "12%", s: 90, r: 18, o: 0.4, flower: false },
  { x: "88%", y: "74%", s: 150, r: 6, o: 0.5, flower: true },
  { x: "10%", y: "10%", s: 70, r: -30, o: 0.35, flower: false },
];

function Pad({ s, r }: { s: number; r: number }) {
  return (
    <svg width={s} height={s * 0.7} viewBox="0 0 100 70" style={{ transform: `rotate(${r}deg)` }} aria-hidden>
      <path d="M50 35 L88 22 A40 28 0 1 1 50 7 Z" fill="var(--primary)" opacity=".28" />
      <ellipse cx="50" cy="35" rx="40" ry="28" fill="var(--primary)" opacity=".16" />
      <path d="M50 35 L88 22" stroke="var(--primary)" strokeWidth="1.5" opacity=".3" />
    </svg>
  );
}

function Reed({ side, height }: { side: "l" | "r"; height: number }) {
  return (
    <svg className={`reed reed-${side}`} width="70" height={height} viewBox="0 0 70 200" aria-hidden>
      <g stroke="var(--primary-strong)" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".55">
        <path d="M20 200 C18 140 24 80 20 30" />
        <path d="M40 200 C44 150 36 100 42 55" />
        <path d="M55 200 C52 160 58 120 54 90" />
      </g>
      <g fill="#8a5a3c" opacity=".7">
        <rect x="16" y="14" width="9" height="30" rx="4.5" />
        <rect x="38" y="40" width="9" height="30" rx="4.5" />
      </g>
      <path d="M8 200 C14 170 6 150 12 130" stroke="var(--primary)" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".4" />
    </svg>
  );
}

function Dragonfly() {
  return (
    <svg className="dragonfly" width="46" height="30" viewBox="0 0 46 30" aria-hidden>
      <g fill="var(--sky)" opacity=".5">
        <ellipse cx="17" cy="9" rx="11" ry="4" transform="rotate(-14 17 9)" />
        <ellipse cx="17" cy="21" rx="11" ry="4" transform="rotate(14 17 21)" />
        <ellipse cx="27" cy="9" rx="10" ry="3.6" transform="rotate(-8 27 9)" />
        <ellipse cx="27" cy="21" rx="10" ry="3.6" transform="rotate(8 27 21)" />
      </g>
      <rect x="6" y="13.5" width="34" height="3" rx="1.5" fill="var(--rose)" />
      <circle cx="40" cy="15" r="3.6" fill="var(--rose)" />
    </svg>
  );
}

type Props = { fireflies?: boolean; /** Thêm lau sậy ở hai bên và chuồn chuồn bay ngang, dùng cho nền cả ứng dụng. */ rich?: boolean };

/** Nền đầm sen: lá sen, hoa sen, gợn nước chậm, đom đóm ở theme tối. Chỉ để trang trí. */
export default function PondBackdrop({ fireflies = true, rich = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const night = theme === "dark" && fireflies;

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const rings = Array.from(root.querySelectorAll<HTMLElement>(".ripple-ring"));
    const pads = Array.from(root.querySelectorAll<HTMLElement>(".pad"));
    const reeds = Array.from(root.querySelectorAll<HTMLElement>(".reed"));
    const fly = root.querySelector<HTMLElement>(".dragonfly");
    const a = [
      animate(rings, { scale: [0.4, 2.4], opacity: [0.5, 0], duration: 4200, delay: stagger(1400), loop: true, ease: "outSine" }),
      animate(pads, { translateY: [0, -6], duration: 3000, delay: stagger(500), loop: true, alternate: true, ease: "inOutSine" }),
    ];
    if (reeds.length) a.push(animate(reeds, { rotate: [-2.5, 2.5], duration: 3200, delay: stagger(600), loop: true, alternate: true, ease: "inOutSine" }));
    if (fly) {
      const w = root.clientWidth || window.innerWidth;
      a.push(animate(fly, { translateX: [w + 60, -120], duration: 16000, loop: true, loopDelay: 6000, ease: "linear" }));
      a.push(animate(fly, { translateY: [0, 36, -10, 28, 0], duration: 4000, loop: true, ease: "inOutSine" }));
    }
    return () => a.forEach((x) => x.revert());
  }, [rich]);

  useEffect(() => {
    const root = ref.current;
    if (!root || !night || prefersReducedMotion()) return;
    const flies = Array.from(root.querySelectorAll<HTMLElement>(".firefly"));
    const a = flies.map((el, i) => animate(el, {
      translateX: [0, (i % 2 ? 1 : -1) * (30 + i * 6)],
      translateY: [0, -20 - (i % 4) * 10],
      opacity: [0.15, 1],
      duration: 2200 + i * 260,
      loop: true,
      alternate: true,
      ease: "inOutSine",
      delay: i * 240,
    }));
    return () => a.forEach((x) => x.revert());
  }, [night]);

  return (
    <div ref={ref} className="pond" aria-hidden>
      {[0, 1, 2].map((i) => <span key={i} className="ripple-ring" style={{ left: `${30 + i * 22}%`, top: `${58 + (i % 2) * 14}%` }} />)}
      {PADS.map((p, i) => (
        <span key={i} className="pad" style={{ left: p.x, top: p.y, opacity: p.o }}>
          <Pad s={p.s} r={p.r} />
          {rich && p.flower && <span className="pad-flower"><Lotus size={p.s * 0.42} /></span>}
        </span>
      ))}
      {rich && <Reed side="l" height={190} />}
      {rich && <Reed side="r" height={150} />}
      {rich && <span className="dragonfly-wrap"><Dragonfly /></span>}
      {night && Array.from({ length: 12 }, (_, i) => (
        <span key={i} className="firefly" style={{ left: `${8 + ((i * 37) % 84)}%`, top: `${10 + ((i * 53) % 78)}%` }} />
      ))}
    </div>
  );
}
