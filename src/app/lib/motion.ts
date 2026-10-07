"use client";

import { useEffect, useLayoutEffect, useRef, type DependencyList, type RefObject } from "react";
import { animate, stagger } from "animejs";
import { flushSync } from "react-dom";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clear = (els: Element[], props: string[]) =>
  els.forEach((el) => props.forEach((p) => (el as HTMLElement).style.removeProperty(p)));

/**
 * Cho các phần tử khớp selector trượt nhẹ từ dưới lên và hiện dần, lần lượt từng cái.
 * Xoá style inline khi xong để không đè lên hiệu ứng hover bằng CSS.
 */
export function useRiseIn<T extends HTMLElement = HTMLElement>(selector: string, deps: DependencyList, opts: { delay?: number; distance?: number } = {}): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (els.length === 0) return;
    const anim = animate(els, {
      opacity: [0, 1],
      translateY: [opts.distance ?? 14, 0],
      delay: stagger(opts.delay ?? 45, { start: 20 }),
      duration: 460,
      ease: "outExpo",
      onComplete: () => clear(els, ["opacity", "transform"]),
    });
    return () => { anim.revert(); clear(els, ["opacity", "transform"]); };
  }, deps);
  return ref;
}

/** Các cột biểu đồ mọc lên từ 0 đến chiều cao ghi trong data-h (tránh đọc style đã bị animation ghi đè). */
export function useGrowBars<T extends HTMLElement = HTMLElement>(selector: string, deps: DependencyList): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const bars = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const targets = bars.map((b) => b.dataset.h ?? (b.style.height || "0%"));
    bars.forEach((b) => { b.style.height = "0%"; });
    const anims = bars.map((b, i) => animate(b, { height: ["0%", targets[i]], delay: 80 + i * 70, duration: 750, ease: "outBack(1.4)", onComplete: () => { b.style.height = targets[i]; } }));
    return () => { anims.forEach((a) => a.revert()); bars.forEach((b, i) => { b.style.height = targets[i]; }); };
  }, deps);
  return ref;
}

/** Vẽ dần các cung của biểu đồ tròn (mỗi cung có strokeDasharray "độ-dài khoảng-trống"). */
export function useDrawDonut<T extends SVGElement = SVGSVGElement>(deps: DependencyList): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const arcs = Array.from(root.querySelectorAll<SVGCircleElement>("circle[data-d]"));
    const finals = arcs.map((c) => c.dataset.d ?? c.getAttribute("stroke-dasharray") ?? "");
    arcs.forEach((c) => c.setAttribute("stroke-dasharray", "0 101"));
    const anims = arcs.map((c, i) => animate(c, { strokeDasharray: ["0 101", finals[i]], delay: i * 160, duration: 900, ease: "outCubic", onComplete: () => c.setAttribute("stroke-dasharray", finals[i]) }));
    return () => { anims.forEach((a) => a.revert()); arcs.forEach((c, i) => c.setAttribute("stroke-dasharray", finals[i])); };
  }, deps);
  return ref;
}

/** Chạy hiệu ứng "bật lên" một lần mỗi khi `key` đổi (toast, huy hiệu, bước hoàn thành…). */
export function usePop<T extends HTMLElement = HTMLElement>(key: unknown, scaleFrom = 0.9): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const anim = animate(el, { scale: [scaleFrom, 1], opacity: [0, 1], duration: 420, ease: "outBack(2)", onComplete: () => clear([el], ["transform", "opacity"]) });
    return () => { anim.revert(); clear([el], ["transform", "opacity"]); };
  }, [key, scaleFrom]);
  return ref;
}

/** Chuyển nội dung: trượt ngang + hiện dần mỗi khi `key` đổi (lật trang, đổi cảnh). */
export function useSwap<T extends HTMLElement = HTMLElement>(key: unknown, dir = 1): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const anim = animate(el, { opacity: [0, 1], translateX: [24 * dir, 0], duration: 380, ease: "outCubic", onComplete: () => clear([el], ["transform", "opacity"]) });
    return () => { anim.revert(); clear([el], ["transform", "opacity"]); };
  }, [key]);
  return ref;
}

/** Lắc nhẹ phần tử (đáp án sai). */
export function shake(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return;
  animate(el, { translateX: [0, -8, 8, -6, 6, 0], duration: 420, ease: "inOutSine", onComplete: () => clear([el], ["transform"]) });
}

/** Nảy nhẹ phần tử (đáp án đúng, nhận sao). */
export function bounce(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return;
  animate(el, { scale: [1, 1.06, 1], duration: 480, ease: "outBack(3)", onComplete: () => clear([el], ["transform"]) });
}

/**
 * Đổi theme với vòng tròn lan ra từ điểm bấm (View Transitions API).
 * Pseudo-element của view transition không animejs nào chạm tới được nên dùng Web Animations API.
 * Trình duyệt không hỗ trợ hoặc bật "giảm chuyển động" thì đổi ngay.
 */
export function circleReveal(x: number, y: number, update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  if (!doc.startViewTransition || prefersReducedMotion()) { update(); return; }
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const transition = doc.startViewTransition(() => flushSync(update));
  void transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 700, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" },
    );
  }).catch(() => {});
}

/** Gợn nước lan ra tại điểm bấm nút (gắn một lần ở cấp cao nhất). */
export function useClickRipple() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest("button:not(:disabled), a.btn")) return;
      const ring = document.createElement("span");
      ring.className = "click-ripple";
      ring.style.left = `${e.clientX}px`;
      ring.style.top = `${e.clientY}px`;
      document.body.appendChild(ring);
      animate(ring, { scale: [0.2, 1], opacity: [0.55, 0], duration: 650, ease: "outQuad", onComplete: () => ring.remove() });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}
