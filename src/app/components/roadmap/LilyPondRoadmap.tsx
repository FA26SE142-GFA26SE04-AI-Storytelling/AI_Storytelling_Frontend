"use client";

/**
 * Hồ sen lộ trình — MỘT HÀNG NGANG cuộn được, ếch nhảy animation.
 *
 * CSS classes:
 *   .lily-scroll, .lily-stage, .lily-pond, .lily-path,
 *   .lily-pad (.done/.current/.next/.locked),
 *   .lily-n, .lily-cover, .lily-icon, .lily-pick,
 *   .lily-frog, .lily-frog-body, .lily-bob, .lily-land, .lily-splash,
 *   .lily-name, .lily-goal,
 *   .lily-deco, .lily-fish, .lily-dragonfly, .lily-ripple-ring, .lily-reed
 *
 * Dùng lại: .rm-progress, .rm-progress-bar, .rm-empty
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Frog from "@/app/components/brand/Frog";
import { Check, Lock, UserCheck } from "lucide-react";
import "./LilyPondRoadmap.css";

/* ========== Types ========== */

export type LilyStepStatus = "done" | "current" | "next";

export interface LilyStep {
  key: number;
  storyId: number;
  title: string;
  cover: string;
  status: LilyStepStatus;
  locked?: boolean;
  parentPick?: boolean;
}

/* ========== Hằng bố cục ========== */

/** Khoảng cách tâm 2 lá liên tiếp */
const STEP = 160;
/** Lề trái (lá 1 không bị cắt) */
const PAD_L = 90;
/** Khoảng từ lá cuối → đích */
const GOAL_GAP = 130;
/** Chiều cao hồ cố định */
const H = 320;
/** Biên độ sóng */
const AMP = 46;
/** Y cơ sở */
const BASE_Y = 140;

/* ========== Kiểu dùng nội bộ ========== */

interface Pos { x: number; y: number }

/* ========== Vị trí lá & đích ========== */

/** Trả mảng vị trí lá + điểm đích */
function computeLayout(n: number): { leafs: Pos[]; goal: Pos; W: number } {
  if (n === 0) return { leafs: [], goal: { x: 0, y: 0 }, W: 0 };
  const leafs: Pos[] = [];
  for (let i = 0; i < n; i++) {
    leafs.push({
      x: PAD_L + i * STEP,
      y: BASE_Y + (i % 2 === 0 ? -AMP : AMP),
    });
  }
  const goal: Pos = { x: leafs[n - 1].x + GOAL_GAP, y: BASE_Y };
  const W = goal.x + PAD_L;
  return { leafs, goal, W };
}

/* ========== Đường cong S mềm (Cubic Bézier) ========== */

/** Tạo đường cong S mềm qua mảng điểm bằng lệnh M và C */
function buildSmoothPath(points: Pos[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i];
    const q = points[i + 1];
    const dx = q.x - p.x;
    const cp1x = p.x + dx / 2;
    const cp1y = p.y;
    const cp2x = q.x - dx / 2;
    const cp2y = q.y;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${q.x},${q.y}`;
  }
  return d;
}

/** Tạo path toàn bộ, đoạn đã đi, đoạn chưa tới */
function buildPaths(
  leafs: Pos[], goal: Pos, currentIdx: number,
): { full: string; walked: string; remaining: string } {
  if (leafs.length === 0) return { full: "", walked: "", remaining: "" };
  const allPts = [...leafs, goal];
  const full = buildSmoothPath(allPts);

  /* Đoạn đã đi: từ lá 0 tới lá currentIdx (nếu currentIdx < 1 thì rỗng) */
  const walked = currentIdx >= 1 ? buildSmoothPath(leafs.slice(0, currentIdx + 1)) : "";

  /* Đoạn còn lại: từ lá current tới đích */
  let remaining = "";
  if (currentIdx >= 0 && currentIdx < allPts.length - 1) {
    remaining = buildSmoothPath(allPts.slice(currentIdx));
  } else if (currentIdx < 0) {
    remaining = full;
  }

  return { full, walked, remaining };
}

/* ========== Trang trí SVG ========== */

/** Bông sen trang trí (hồng nhỏ) */
function decoLotus(cx: number, cy: number, r: number, key: string) {
  const petals: React.ReactNode[] = [];
  for (let a = 0; a < 5; a++) {
    const angle = (a * 72 - 90) * Math.PI / 180;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    petals.push(
      <ellipse key={a} cx={px} cy={py} rx={r * 0.55} ry={r * 0.9}
        transform={`rotate(${a * 72} ${px} ${py})`}
        fill="#f9a8c4" opacity={0.85} />
    );
  }
  return (
    <g key={key} className="lily-deco">
      {petals}
      <circle cx={cx} cy={cy} r={r * 0.35} fill="#fde68a" />
    </g>
  );
}

/** Cụm sậy */
function decoReed(x: number, y: number, flip: boolean, key: string) {
  const s = flip ? -1 : 1;
  return (
    <g key={key} transform={`translate(${x},${y}) scale(${s},1)`}>
      <g className="lily-reed lily-deco">
        {[0, 6, -5].map((dx, i) => (
          <g key={i}>
            <path d={`M${dx},0 Q${dx + 3},${-30 - i * 8} ${dx + 1},${-55 - i * 6}`}
              stroke="#7a9a6e" strokeWidth="2" fill="none" />
            <ellipse cx={dx + 1} cy={-58 - i * 6} rx={3} ry={6} fill="#8B6914" />
          </g>
        ))}
      </g>
    </g>
  );
}

/** Cá nhỏ ở góc hồ */
function decoFish(cx: number, cy: number, flip: boolean, key: string) {
  const s = flip ? -1 : 1;
  return (
    <g key={key} transform={`translate(${cx},${cy}) scale(${s},1)`}>
      <g className="lily-fish">
        {/* Đuôi tam giác quay về sau (-x) */}
        <polygon points="-12,0 -23,-7 -23,7" fill="#e76f51" />
        {/* Thân ellipse dài ~30px (rx=15, ry=7.5) */}
        <ellipse cx={0} cy={0} rx={15} ry={7.5} fill="#f4a261" />
        {/* Vây lưng nhẹ */}
        <path d="M-2,-7.5 Q3,-11 8,-6" stroke="#e76f51" strokeWidth="1.2" fill="none" />
        {/* Mắt nhỏ hướng về phải */}
        <circle cx={9} cy={-2} r={1.6} fill="#1a1a1a" />
        <circle cx={9.5} cy={-2.4} r={0.5} fill="#ffffff" />
      </g>
    </g>
  );
}

/** Chuồn chuồn thân nằm ngang */
function decoDragonfly(cx: number, cy: number, key: string) {
  return (
    <g key={key} transform={`translate(${cx},${cy})`}>
      <g className="lily-dragonfly">
        {/* 2 cặp cánh ellipse trong suốt phía trên và dưới thân */}
        <ellipse cx={2} cy={-7} rx={10} ry={3.2} fill="#b3ddf2" opacity={0.6}
          transform="rotate(-12 2 -7)" />
        <ellipse cx={-4} cy={-6} rx={8.5} ry={2.8} fill="#b3ddf2" opacity={0.6}
          transform="rotate(-22 -4 -6)" />
        <ellipse cx={2} cy={7} rx={10} ry={3.2} fill="#b3ddf2" opacity={0.6}
          transform="rotate(12 2 7)" />
        <ellipse cx={-4} cy={6} rx={8.5} ry={2.8} fill="#b3ddf2" opacity={0.6}
          transform="rotate(22 -4 6)" />

        {/* Thân nằm ngang (~22px) và đầu */}
        <ellipse cx={0} cy={0} rx={11} ry={2.2} fill="#4e9ac0" />
        <circle cx={12} cy={0} r={2.5} fill="#3b82a6" />
      </g>
    </g>
  );
}

/** Vòng gợn nước */
function decoRipple(cx: number, cy: number, key: string) {
  return (
    <ellipse key={key} className="lily-ripple-ring lily-deco"
      cx={cx} cy={cy} rx={20} ry={8}
      fill="none" stroke="#a7d8de" strokeWidth="1" opacity={0.4} />
  );
}

/** Bông sen vàng đích (SVG inline trong span) */
function GoalLotus() {
  const r = 22;
  const petals: React.ReactNode[] = [];
  for (let a = 0; a < 8; a++) {
    const angle = (a * 45 - 90) * Math.PI / 180;
    const px = 30 + Math.cos(angle) * r * 0.6;
    const py = 30 + Math.sin(angle) * r * 0.6;
    petals.push(
      <ellipse key={a} cx={px} cy={py} rx={r * 0.45} ry={r * 0.85}
        transform={`rotate(${a * 45} ${px} ${py})`}
        fill="#ffd166" stroke="#d97706" strokeWidth="0.8" />
    );
  }
  return (
    <svg width={60} height={60} viewBox="0 0 60 60" aria-hidden="true"
      style={{ display: "block" }}>
      {petals}
      <circle cx={30} cy={30} r={r * 0.3} fill="#fbbf24" />
    </svg>
  );
}

/** Trang trí cố định cho hồ — chỉ ở mép ngoài */
function renderDecorations(stageW: number, ox: number): React.ReactNode {
  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      {/* Sậy mép dưới trái */}
      {decoReed(ox + 12, H - 10, false, "reed1")}
      {/* Sậy mép trên phải */}
      {decoReed(ox + stageW - 50, 65, true, "reed2")}

      {/* Bông sen hồng — vùng trên & dưới, cách xa lá */}
      {decoLotus(ox + 50, 40, 9, "lotus1")}
      {decoLotus(ox + stageW - 70, H - 40, 8, "lotus2")}

      {/* Gợn nước — vùng trên trái */}
      {decoRipple(ox + 80, 45, "rip1")}

      {/* Cá — góc dưới trái */}
      {decoFish(ox + 40, H - 26, false, "fish1")}

      {/* Chuồn chuồn — góc trên phải */}
      {decoDragonfly(ox + stageW - 70, 28, "dfly1")}
    </g>
  );
}

/* ========== Hook: kiểm tra prefers-reduced-motion ========== */

function useReducedMotion(): boolean {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setRm(mq.matches);
    const h = (e: MediaQueryListEvent) => setRm(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return rm;
}

/* ========== Component chính ========== */

export default function LilyPondRoadmap({ steps, mode, done, total, onStepClick, emptyText, storageKey = "default" }: {
  steps: LilyStep[];
  mode: "parent" | "child";
  done: number;
  total: number;
  onStepClick: (step: LilyStep, index: number) => void;
  emptyText?: string;
  /** Khoá localStorage phân biệt nhiều roadmap */
  storageKey?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const frogRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  /* --- Đo clientWidth của lily-scroll --- */
  const [clientW, setClientW] = useState(0);
  const layoutReady = clientW > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setClientW(Math.round(entry.contentRect.width) || 0);
    });
    ro.observe(el);
    setClientW(el.clientWidth || 0);
    return () => ro.disconnect();
  }, []);

  /* --- Bố cục 1 hàng ngang --- */
  const { leafs, goal, W } = useMemo(
    () => computeLayout(steps.length),
    [steps.length],
  );

  /* Chiều rộng stage & offset căn giữa */
  const stageW = Math.max(W, clientW);
  const offsetX = clientW > W ? (clientW - W) / 2 : 0;

  /* --- Phần trăm tiến độ --- */
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  /* --- Index hiện tại --- */
  const currIdx = steps.findIndex(s => s.status === "current");

  /* --- Nhãn trạng thái --- */
  const statusLabel = useCallback((step: LilyStep): string => {
    if (step.status === "done") return "Đã đọc";
    if (step.status === "current") return step.locked ? "Chưa mở" : "Đang đọc";
    return "Chưa tới";
  }, []);

  /* --- Đường SVG --- */
  const paths = useMemo(() => {
    /* Dịch tọa độ theo offsetX */
    const shifted = leafs.map(p => ({ x: p.x + offsetX, y: p.y }));
    const gShifted = { x: goal.x + offsetX, y: goal.y };
    return buildPaths(shifted, gShifted, currIdx);
  }, [leafs, goal, offsetX, currIdx]);

  /* --- Splash state (gợn nước khi ếch đáp) --- */
  const [splash, setSplash] = useState<Pos | null>(null);

  /* --- Ếch nhảy (rAF) --- */
  const [placed, setPlaced] = useState(false);
  const [bobbing, setBobbing] = useState(true);
  const frogPosRef = useRef<Pos | null>(null); // vị trí hiện tại (px)

  /* Vị trí ếch trên lá idx */
  const frogOnLeaf = useCallback((idx: number): Pos => {
    const lf = leafs[idx];
    return { x: lf.x + offsetX, y: lf.y - 30 };
  }, [leafs, offsetX]);

  useEffect(() => {
    if (steps.length === 0 || currIdx < 0 || !layoutReady) return;

    const LS_KEY = "lilypond:lastStep:" + storageKey;
    let prevIdx = -1;
    try {
      const v = localStorage.getItem(LS_KEY);
      if (v !== null) {
        const n = Number(v);
        if (Number.isInteger(n) && n >= 0 && n < steps.length) {
          prevIdx = n;
        }
      }
    } catch { /* bỏ qua */ }

    /* Ghi ngay chỉ số mới */
    try { localStorage.setItem(LS_KEY, String(currIdx)); } catch { /* */ }

    const currPos = frogOnLeaf(currIdx);

    /* Scroll tới lá current */
    const scrollEl = scrollRef.current;
    const scrollTarget = leafs[currIdx].x + offsetX - (clientW / 2);

    /* Nếu không có prev hợp lệ hoặc cùng vị trí hoặc reduced motion */
    if (prevIdx < 0 || prevIdx === currIdx || reducedMotion) {
      /* Đặt ếch ngay */
      if (frogRef.current) {
        frogRef.current.style.transform = `translate(${currPos.x}px, ${currPos.y}px)`;
      }
      frogPosRef.current = currPos;
      setPlaced(true);
      setBobbing(true);
      if (scrollEl) {
        scrollEl.scrollTo({ left: scrollTarget, behavior: reducedMotion ? "auto" : "smooth" });
      }
      return;
    }

    /* --- Nhảy thật --- */
    const startPos = frogOnLeaf(prevIdx);
    if (frogRef.current) {
      frogRef.current.style.transform = `translate(${startPos.x}px, ${startPos.y}px)`;
      frogRef.current.classList.remove("lily-land");
    }
    frogPosRef.current = startPos;
    setPlaced(true);
    setBobbing(false);
    setSplash(null);

    /* Scroll tới đích trước khi nhảy */
    if (scrollEl) {
      scrollEl.scrollTo({ left: scrollTarget, behavior: "smooth" });
    }

    let rafId = 0;
    const JUMP_DURATION = 900; // ms
    const JUMP_HEIGHT = 90;

    const timeoutId = setTimeout(() => {
      const t0 = performance.now();

      const animate = (now: number) => {
        const elapsed = now - t0;
        const t = Math.min(elapsed / JUMP_DURATION, 1);
        const x = startPos.x + (currPos.x - startPos.x) * t;
        const yLerp = startPos.y + (currPos.y - startPos.y) * t;
        const yArc = yLerp - JUMP_HEIGHT * 4 * t * (1 - t);

        if (frogRef.current) {
          frogRef.current.style.transform = `translate(${x}px, ${yArc}px)`;
        }
        frogPosRef.current = { x, y: yArc };

        if (t < 1) {
          rafId = requestAnimationFrame(animate);
        } else {
          /* Đáp */
          if (frogRef.current) {
            frogRef.current.style.transform = `translate(${currPos.x}px, ${currPos.y}px)`;
            frogRef.current.classList.add("lily-land");
          }
          frogPosRef.current = currPos;
          setPlaced(true);
          setBobbing(true);

          /* Gợn nước */
          const splashPos = { x: leafs[currIdx].x + offsetX, y: leafs[currIdx].y };
          setSplash(splashPos);
          setTimeout(() => setSplash(null), 700);
        }
      };

      rafId = requestAnimationFrame(animate);
    }, 400);

    return () => {
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, currIdx, layoutReady]);

  /* ========== Empty state ========== */
  if (steps.length === 0) {
    return (
      <div>
        <div className="rm-progress">
          <div className="rm-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Tiến độ đọc">
            <i style={{ width: `${percent}%` }} />
          </div>
          <b>Đã đọc {done}/{total}</b>
        </div>
        <p className="rm-empty">{emptyText}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Thanh tiến độ */}
      <div className="rm-progress">
        <div className="rm-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Tiến độ đọc">
          <i style={{ width: `${percent}%` }} />
        </div>
        <b>Đã đọc {done}/{total}</b>
      </div>

      {/* Khung cuộn ngang */}
      <div
        ref={scrollRef}
        className="lily-scroll"
        style={{ overflowX: "auto", overflowY: "hidden", position: "relative", width: "100%", minWidth: 0 }}
      >
        {/* Sân khấu */}
        <div
          className="lily-stage lily-pond"
          style={{ width: stageW, height: H, position: "relative" }}
        >
          {/* SVG đường đi + trang trí */}
          <svg
            aria-hidden="true"
            width={stageW}
            height={H}
            viewBox={`0 0 ${stageW} ${H}`}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {/* Nền gradient nước */}
            <defs>
              <linearGradient id="pondGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b2e4dc" />
                <stop offset="100%" stopColor="#7ecfc0" />
              </linearGradient>
            </defs>
            <rect x={0} y={0} width={stageW} height={H} fill="url(#pondGrad)" rx={16} />

            {/* Trang trí mép ngoài */}
            {renderDecorations(stageW, offsetX)}

            {/* Viền nâu (lớp dưới) */}
            <path d={paths.full}
              fill="none" stroke="#c9a86a" strokeWidth={20}
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Nền đường cát */}
            <path d={paths.full}
              fill="none" stroke="#e8d3a0" strokeWidth={16}
              strokeLinecap="round" strokeLinejoin="round" />

            {/* Đoạn chưa tới — nét đứt trắng nhạt */}
            {paths.remaining && (
              <path d={paths.remaining}
                fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={3}
                strokeDasharray="6 8" strokeLinecap="round" />
            )}

            {/* Đoạn đã đi — vàng nổi bật */}
            {paths.walked && (
              <path d={paths.walked}
                fill="none" stroke="#ffd166" strokeWidth={6}
                strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>

          {/* Danh sách lá sen */}
          <ol className="lily-path" aria-label="Lộ trình đọc" style={{ position: "relative", zIndex: 1 }}>
            {steps.map((step, i) => {
              const lx = leafs[i].x + offsetX;
              const ly = leafs[i].y;
              const n = i + 1;
              const showParentPick = mode === "parent" && Boolean(step.parentPick);
              const label =
                `Truyện ${n}: ${step.title} — ${statusLabel(step)}` +
                (showParentPick ? ", Bố mẹ chọn" : "");

              return (
                <li
                  key={step.key}
                  style={{
                    position: "absolute",
                    left: lx,
                    top: ly,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <button
                    type="button"
                    className={
                      `lily-pad ${step.status}` +
                      (step.locked ? " locked" : "")
                    }
                    aria-label={label}
                    onClick={() => onStepClick(step, i)}
                  >
                    {/* Số thứ tự */}
                    <span className="lily-n">{n}</span>

                    {/* Ảnh bìa */}
                    <span className="lily-cover" style={{ background: step.cover }} aria-hidden="true" />

                    {/* Dấu Check / Lock */}
                    {step.status === "done" && (
                      <span className="lily-icon"><Check size={16} /></span>
                    )}
                    {step.locked && (
                      <span className="lily-icon"><Lock size={16} /></span>
                    )}

                    {/* Huy hiệu Bố mẹ chọn */}
                    {showParentPick && (
                      <span className="lily-pick" title="Bố mẹ chọn">
                        <UserCheck size={14} />
                      </span>
                    )}
                  </button>

                  {/* Tên truyện */}
                  <span className="lily-name" title={step.title}>{step.title}</span>
                </li>
              );
            })}
          </ol>

          {/* Đích — bông sen vàng */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: goal.x + offsetX,
              top: goal.y,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          >
            <span className="lily-goal" style={{ display: "block" }}>
              <GoalLotus />
            </span>
          </span>

          {/* Ếch — phần tử duy nhất, di chuyển bằng transform */}
          {currIdx >= 0 && (
            <span
              ref={frogRef}
              className="lily-frog"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translate(${frogOnLeaf(currIdx).x}px, ${frogOnLeaf(currIdx).y}px)`,
                zIndex: 10,
                pointerEvents: "none",
                opacity: placed ? 1 : 0,
                transition: "opacity 0.2s",
              }}
            >
              <span className={`lily-frog-body${bobbing ? " lily-bob" : ""}`}
                style={{ display: "block" }}>
                <Frog size={40} animated={false} mood="happy" />
              </span>
            </span>
          )}

          {/* Gợn nước khi đáp */}
          {splash && (
            <span
              className="lily-splash"
              style={{
                position: "absolute",
                left: splash.x,
                top: splash.y,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 9,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
