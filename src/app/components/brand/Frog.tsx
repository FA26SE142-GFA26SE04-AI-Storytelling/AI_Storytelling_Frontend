"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { prefersReducedMotion } from "@/app/lib/motion";

export type FrogMood = "idle" | "happy" | "think" | "smile";
export type FrogPokeAction = "wave" | "spin" | "tongue" | "dance" | "wink";

type Props = {
  size?: number;
  mood?: FrogMood;
  /** "face" chỉ lấy phần đầu, dùng làm logo. */
  variant?: "full" | "face";
  animated?: boolean;
  className?: string;
  /** Đổi giá trị (khác 0) thì ếch làm động tác `pokeAction` và má ửng hồng. */
  pokeKey?: number;
  /** Động tác khi được bấm (kèm biểu cảm): vẫy tay + cười tít, xoay + ngạc nhiên, lè lưỡi, nhảy múa + cười tít, nháy mắt. */
  pokeAction?: FrogPokeAction;
  /** Mắt nhìn theo chuột / chỗ chạm. */
  followPointer?: boolean;
  /** Thỉnh thoảng lè lưỡi (mood "happy" hoặc "smile"). */
  tongue?: boolean;
};

// Bảng màu của linh vật
const GREEN = "#7cc455";
const GREEN_DARK = "#4b7b37";
const BELLY = "#d7d088";
const RING = "#e9e9e6";
const INK = "#363636";

const EYES = [{ cx: 130, cy: 64 }, { cx: 276, cy: 64 }];
const VIEW_W = 405;
const VIEW_H = 460;
/** Đồng tử dịch tối đa chừng này đơn vị (trong khung 405x460) khi nhìn theo. */
const PUPIL_MAX = 6;
const BLUSH = "#f4a3b4";

/** Thè lưỡi bắt ruồi: miệng há ra trước, lưỡi thè rồi rút, miệng khép lại (lớp miệng mở chỉ có khi miệng đang ngậm). */
function flickTongue(root: SVGSVGElement, timing: { duration: number; delay?: number; loop?: boolean; loopDelay?: number }) {
  const tongueEl = root.querySelector<SVGElement>(".frog-tongue");
  if (!tongueEl) return [];
  const anims = [animate(tongueEl, { scale: [0, 0, 1, 1, 0, 0], ease: "outQuad", ...timing })];
  const open = root.querySelector<SVGElement>(".frog-mouth-open");
  const closed = root.querySelector<SVGElement>(".frog-mouth");
  if (open && closed) {
    anims.push(animate(open, { opacity: [0, 1, 1, 1, 1, 0], ease: "linear", ...timing }));
    anims.push(animate(closed, { opacity: [1, 0, 0, 0, 0, 1], ease: "linear", ...timing }));
  }
  return anims;
}

/** Một bàn chân có đúng 3 ngón xoè ra: [x, y, góc nghiêng]. */
const toes = (list: [number, number, number][], rx: number, ry: number, fill: string) =>
  list.map(([x, y, rot]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={rx} ry={ry} fill={fill} transform={`rotate(${rot} ${x} ${y})`} />);

/**
 * Linh vật ếch Taletale: ếch xanh ngồi nhìn thẳng, bụng kem, hai chân sau xanh đậm.
 * Khi `animated`: chớp mắt (mí mắt phủ xuống) và thở nhẹ (thân nhấp nhô).
 */
export default function Frog({ size = 120, mood = "idle", variant = "full", animated = true, className, pokeKey = 0, pokeAction = "wave", followPointer = false, tongue = false }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  // Mắt nhìn theo chuột / ngón tay: đặt transform trực tiếp lên đồng tử (không re-render).
  useEffect(() => {
    const root = ref.current;
    if (!root || !followPointer || prefersReducedMotion()) return;
    const pupils = Array.from(root.querySelectorAll<SVGGElement>(".frog-pupil"));
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = root.getBoundingClientRect();
        if (!r.width) return;
        pupils.forEach((p, i) => {
          const ex = r.left + (EYES[i].cx / VIEW_W) * r.width;
          const ey = r.top + (EYES[i].cy / VIEW_H) * r.height;
          const vx = e.clientX - ex, vy = e.clientY - ey;
          const d = Math.hypot(vx, vy) || 1;
          const k = Math.min(1, d / 160) * PUPIL_MAX;
          p.setAttribute("transform", `translate(${((vx / d) * k).toFixed(2)} ${((vy / d) * k).toFixed(2)})`);
        });
      });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      pupils.forEach((p) => p.removeAttribute("transform"));
    };
  }, [followPointer]);

  // Được bấm: má ửng hồng kèm động tác và biểu cảm (bật/tắt các lớp mặt bằng opacity, không re-render).
  useEffect(() => {
    const root = ref.current;
    if (!root || !pokeKey || prefersReducedMotion()) return;
    const arm = root.querySelector<SVGElement>(".frog-arm-r");
    const cheeks = Array.from(root.querySelectorAll<SVGElement>(".frog-blush"));
    const rightLid = root.querySelectorAll<SVGElement>(".frog-lid")[1];
    const show = (sel: string, ms: number) => animate(root.querySelectorAll<SVGElement>(sel), { opacity: [0, 1, 1, 0], duration: ms, ease: "inOutSine" });
    const hide = (sel: string, ms: number) => animate(root.querySelectorAll<SVGElement>(sel), { opacity: [1, 0, 0, 1], duration: ms, ease: "inOutSine" });
    const anims = [animate(cheeks, { opacity: [0, 0.85, 0.85, 0], duration: 1800, ease: "inOutSine" })];
    if ((pokeAction === "wave" || pokeAction === "dance")) anims.push(show(".frog-laugh", 1400));
    if (pokeAction === "wave" && arm) anims.push(animate(arm, { rotate: [0, -155, -132, -162, -136, -155, 0], duration: 1500, ease: "inOutSine" }));
    if (pokeAction === "spin") anims.push(show(".frog-wow", 1200), hide(".frog-mouth", 1200));
    if (pokeAction === "tongue") anims.push(...flickTongue(root, { duration: 760, delay: 100 }));
    if (pokeAction === "wink" && rightLid) anims.push(animate(rightLid, { scaleY: [0, 1, 1, 0], duration: 700, ease: "inOutSine" }));
    return () => anims.forEach((a) => a.revert());
    // pokeAction đi kèm pokeKey (đổi cùng lúc), chỉ chạy lại khi pokeKey đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokeKey]);

  // Lúc chờ: thỉnh thoảng lè lưỡi.
  useEffect(() => {
    const root = ref.current;
    if (!root || !tongue || !animated || prefersReducedMotion()) return;
    const anims = flickTongue(root, { duration: 640, delay: 2500, loop: true, loopDelay: 8300 });
    return () => anims.forEach((a) => a.revert());
  }, [tongue, animated, mood]);

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
      <g className="frog-mouth">
        <path d="M156 124 Q203 134 250 124 Q246 168 203 170 Q160 168 156 124Z" fill="#3a3a3a" />
        <path d="M178 156 Q203 146 228 156 Q222 168 203 169 Q184 168 178 156Z" fill="#e0707f" />
      </g>
    )
    : mood === "smile"
      // Cười mỉm: miệng ngậm, cong đều hai bên
      ? <path className="frog-mouth" d="M168 130 Q203 156 238 130" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      : <path className="frog-mouth" d="M158 126 Q203 134 248 126 Q203 154 158 126Z" fill={INK} />;

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
          {/* đùi gập hai bên, mép dưới đùi chồng lên bàn chân để liền khớp */}
          <ellipse cx="70" cy="262" rx="50" ry="66" transform="rotate(-20 70 262)" />
          <ellipse cx="336" cy="262" rx="50" ry="66" transform="rotate(20 336 262)" />
          <ellipse cx="98" cy="330" rx="42" ry="18" transform="rotate(-6 98 330)" />
          <ellipse cx="308" cy="330" rx="42" ry="18" transform="rotate(6 308 330)" />
          {toes([[74, 348, 16], [98, 354, 0], [122, 348, -16]], 9, 15, GREEN_DARK)}
          {toes([[284, 348, 16], [308, 354, 0], [332, 348, -16]], 9, 15, GREEN_DARK)}
        </g>
      )}

      <g className="frog-body" style={{ transformBox: "fill-box" }}>
        {/* thân và đầu */}
        <ellipse cx="203" cy="212" rx="126" ry="140" fill={GREEN} />
        <ellipse cx="203" cy="226" rx="106" ry="122" fill={BELLY} />

        {/* hai chân trước: cánh tay thẳng, ngắn, từ mép thân xuống bàn tay 3 ngón đặt trước bụng */}
        {!face && (
          <g>
            <line x1="120" y1="250" x2="150" y2="330" stroke={GREEN} strokeWidth="24" strokeLinecap="round" />
            <ellipse cx="150" cy="338" rx="20" ry="11" fill={GREEN} />
            {toes([[136, 356, 14], [150, 362, 0], [164, 356, -14]], 8.5, 14, GREEN)}
            {/* tay phải tách nhóm, xoay quanh vai (286, 250) khi vẫy */}
            <g className="frog-arm-r" style={{ transformBox: "view-box", transformOrigin: "286px 250px" }}>
              <line x1="286" y1="250" x2="256" y2="330" stroke={GREEN} strokeWidth="24" strokeLinecap="round" />
              <ellipse cx="256" cy="338" rx="20" ry="11" fill={GREEN} />
              {toes([[242, 356, 14], [256, 362, 0], [270, 356, -14]], 8.5, 14, GREEN)}
            </g>
          </g>
        )}

        {/* mắt: núm xanh, viền trắng, đồng tử xám đậm */}
        {EYES.map(({ cx, cy }) => (
          <g key={cx}>
            <circle cx={cx} cy={cy} r="38" fill={GREEN} />
            <circle cx={cx} cy={cy} r="27" fill={RING} />
            <g className="frog-pupil"><circle cx={cx + look.x} cy={cy + look.y} r="21" fill={INK} /></g>
            {/* mí mắt: phủ xuống khi chớp */}
            <ellipse className="frog-lid" cx={cx} cy={cy} rx="28" ry="28" fill={GREEN} style={{ transform: "scaleY(0)", transformBox: "fill-box", transformOrigin: "50% 0%" }} />
          </g>
        ))}

        {/* biểu cảm khi được bấm (ẩn mặc định): mắt cười tít "^ ^" phủ lên mắt thường */}
        <g className="frog-laugh" opacity="0">
          {EYES.map(({ cx, cy }) => (
            <g key={cx}>
              <circle cx={cx} cy={cy} r="30" fill={GREEN} />
              <path d={`M${cx - 20} ${cy + 8} Q${cx} ${cy - 16} ${cx + 20} ${cy + 8}`} fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />
            </g>
          ))}
        </g>
        {/* ngạc nhiên: đồng tử nhỏ lại (vòng trắng to ra) và miệng chữ O */}
        <g className="frog-wow" opacity="0">
          {EYES.map(({ cx, cy }) => (
            <g key={cx}>
              <circle cx={cx} cy={cy} r="29" fill={RING} />
              <circle cx={cx} cy={cy} r="11" fill={INK} />
            </g>
          ))}
          <ellipse cx="203" cy="148" rx="20" ry="24" fill="#3a3a3a" />
          <ellipse cx="203" cy="160" rx="11" ry="7" fill="#e0707f" />
        </g>

        {/* má ửng hồng khi được bấm (ẩn mặc định) */}
        <ellipse className="frog-blush" cx="128" cy="142" rx="20" ry="11" fill={BLUSH} opacity="0" />
        <ellipse className="frog-blush" cx="278" cy="142" rx="20" ry="11" fill={BLUSH} opacity="0" />

        {/* lỗ mũi và miệng */}
        <ellipse cx="190" cy="82" rx="7" ry="6" fill={GREEN_DARK} />
        <ellipse cx="216" cy="82" rx="7" ry="6" fill={GREEN_DARK} />
        {mouth}
        {/* miệng há ra lúc thè lưỡi khi miệng đang ngậm (cười mỉm) */}
        {tongue && mood === "smile" && (
          <g className="frog-mouth-open" opacity="0">
            <path d="M156 124 Q203 134 250 124 Q246 168 203 170 Q160 168 156 124Z" fill="#3a3a3a" />
            <path d="M178 156 Q203 146 228 156 Q222 168 203 169 Q184 168 178 156Z" fill="#e0707f" />
          </g>
        )}
        {tongue && (mood === "happy" || mood === "smile") && (
          <line className="frog-tongue" x1="203" y1="152" x2="300" y2="104" stroke="#e0707f" strokeWidth="14" strokeLinecap="round"
            style={{ transformBox: "view-box", transformOrigin: "203px 152px", transform: "scale(0)" }} />
        )}

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
