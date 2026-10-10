"use client";

import { useEffect, useLayoutEffect, useRef, type DependencyList, type RefObject } from "react";
import { animate, stagger } from "animejs";
import { flushSync } from "react-dom";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Hiệu ứng vào của từng màn bị bỏ khi đang Morph chuyển không gian: Morph đã là hiệu ứng vào, chạy thêm sẽ nháy sau khi xong. */
const entranceOff = () => prefersReducedMotion() || document.documentElement.classList.contains("ws-vt");

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
    if (!root || entranceOff()) return;
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
    if (!root || entranceOff()) return;
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
    if (!root || entranceOff()) return;
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
    if (!el || entranceOff()) return;
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
    if (!el || entranceOff()) return;
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

const MORPH_SELECTOR = ".ph, .display, h1, h2, h3, button, .chip, .tag, .inp, textarea, select, label, svg, img, [data-morph]";

const outside = (r: DOMRect, box: DOMRect) => r.bottom < box.top || r.top > box.bottom || r.right < box.left || r.left > box.right;

/**
 * Khoá ghép đôi kiểu Morph của PowerPoint: số thứ tự khung + (data-morph, hoặc thẻ + chữ hiển thị).
 * Chỉ ghép trong cùng một khung để phần tử không bay xuyên qua khung khác; chỉ lấy phần tử đang nhìn thấy.
 */
function morphKeys(panes: HTMLElement[]): Map<string, HTMLElement> {
  const seen = new Map<string, HTMLElement | null>();
  panes.forEach((pane, i) => {
    const box = pane.getBoundingClientRect();
    pane.querySelectorAll<HTMLElement>(MORPH_SELECTOR).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || outside(r, box)) return;
      const text = (el.dataset.morph ?? el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
      if (!text) return;
      const key = `${i}|${el.dataset.morph ? "d" : el.tagName}:${text}`;
      seen.set(key, seen.has(key) ? null : el);
    });
  });
  const out = new Map<string, HTMLElement>();
  seen.forEach((el, key) => { if (el) out.set(key, el); });
  return out;
}

type Frame = { backgroundColor: string; borderRadius: string; rect: DOMRect };
const frameOf = (el: HTMLElement): Frame => { const s = getComputedStyle(el); return { backgroundColor: s.backgroundColor, borderRadius: s.borderRadius, rect: el.getBoundingClientRect() }; };

/**
 * Khung chỉ có ở một bên được ép dẹt về mép vùng làm việc gần nhất (cột thì ép theo chiều ngang,
 * hàng thì theo chiều dọc). Hai đầu đều là bố cục không chồng nhau và mọi khung chạy cùng nhịp,
 * nên suốt quá trình di chuyển các khung không đè lên nhau.
 */
function collapsed(r: DOMRect, stage: DOMRect): DOMRect {
  if (r.height >= stage.height * 0.9) {
    const x = r.left - stage.left <= stage.right - r.right ? stage.left : stage.right;
    return new DOMRect(x, r.top, 0, r.height);
  }
  const y = r.top - stage.top <= stage.bottom - r.bottom ? stage.top : stage.bottom;
  return new DOMRect(r.left, y, r.width, 0);
}

const box = (r: DOMRect) => ({ transform: `translate(${r.left}px, ${r.top}px)`, width: `${r.width}px`, height: `${r.height}px` });

/**
 * Đổi không gian làm việc kiểu Morph của PowerPoint. Khung thứ i của màn cũ và màn mới là
 * CÙNG một khung: ảnh chụp bỏ nền/viền, khung do ::view-transition-group vẽ và co giãn,
 * dời chỗ, đổi màu nền liên tục; chỉ nội dung bên trong mờ đổi. Phần tử trùng nhau trong
 * cùng khung (tiêu đề, nút, chip, ô nhập… cùng chữ) bay thẳng sang vị trí mới.
 * Khung thừa thì ép dẹt vào mép, khung thiếu thì mở ra từ mép. Không hỗ trợ hoặc bật "giảm chuyển động" thì đổi ngay.
 */
export function transitionWorkspace(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
  const panes = () => Array.from(document.querySelectorAll<HTMLElement>(".stage .ws > *"));
  const stageEl = document.querySelector<HTMLElement>(".stage");
  if (!doc.startViewTransition || !stageEl || prefersReducedMotion()) { update(); return; }
  const tag = (el: HTMLElement, name: string) => { el.style.viewTransitionName = name; };
  const root = document.documentElement;
  const stage = stageEl.getBoundingClientRect();

  const oldPanes = panes();
  const oldFrames = oldPanes.map(frameOf);
  let newFrames: Frame[] = [];
  const names = new Map<string, string>();
  oldPanes.forEach((el, i) => tag(el, `pane-${i}`));
  let i = 0;
  morphKeys(oldPanes).forEach((el, key) => { const n = `m-${i++}`; names.set(key, n); tag(el, n); });
  root.classList.add("ws-vt"); // bỏ nền/viền khỏi ảnh chụp, khung do group vẽ
  root.classList.add("ws-morph"); // giữ luôn: tắt hẳn animation wsin của .ws, tránh nó chạy lại khi gỡ ws-vt

  const transition = doc.startViewTransition(() => {
    flushSync(update);
    const next = panes();
    root.classList.remove("ws-vt");
    newFrames = next.map(frameOf);
    root.classList.add("ws-vt");
    next.forEach((el, j) => tag(el, `pane-${j}`));
    morphKeys(next).forEach((el, key) => { const n = names.get(key); if (n) tag(el, n); });
  });

  const mine: Animation[] = [];
  const opts = { duration: 700, easing: "cubic-bezier(.65, 0, .25, 1)", fill: "both" as const };
  void transition.ready.then(() => {
    const count = Math.max(oldFrames.length, newFrames.length);
    for (let k = 0; k < count; k++) {
      const a = oldFrames[k], b = newFrames[k];
      const pseudoElement = `::view-transition-group(pane-${k})`;
      if (a && b) {
        mine.push(root.animate({ backgroundColor: [a.backgroundColor, b.backgroundColor], borderRadius: [a.borderRadius, b.borderRadius] }, { ...opts, pseudoElement }));
      } else {
        const f = (a ?? b)!;
        const frames = a ? [box(a.rect), box(collapsed(a.rect, stage))] : [box(collapsed(b.rect, stage)), box(b.rect)];
        mine.push(root.animate(frames.map((p) => ({ ...p, backgroundColor: f.backgroundColor, borderRadius: f.borderRadius })), { ...opts, pseudoElement }));
      }
    }
  }).catch(() => {});

  let cleaned = false;
  const done = () => {
    if (cleaned) return;
    cleaned = true;
    mine.forEach((a) => a.cancel());
    root.classList.remove("ws-vt");
    document.querySelectorAll<HTMLElement>("[style*='view-transition-name']").forEach((el) => el.style.removeProperty("view-transition-name"));
  };
  transition.finished.then(done, done);
}
