'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { WorkingVolumeBook } from '../three/room/textures/workingVolumesBooks';
import { generateSpreads, PageSpread } from './deskSpreadsGenerator';
import { DeskPageTurningStyles } from './deskPageTurningStyles';
import { buildCurl, MAX_BETA_CURL, N_STRIPS } from './deskStripCurlBuilder';
import { DeskReadingBottomToolbar } from './DeskReadingBottomToolbar';

gsap.registerPlugin(useGSAP);

export interface DeskPageTurningBookProps {
  book: WorkingVolumeBook;
  onPageChange?: (pageIndex: number, totalPages: number) => void;
  onClose?: () => void;
}

export const DeskPageTurningBook: React.FC<DeskPageTurningBookProps> = ({
  book,
  onPageChange,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sb3dRef = useRef<HTMLDivElement>(null);
  const bookDomRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);

  const [pageSpreads, setPageSpreads] = useState<PageSpread[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const currentPageRef = useRef<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  useEffect(() => {
    currentPageRef.current = currentPageIndex;
  }, [currentPageIndex]);

  // Focus Mode & Zoom State (Phóng to trang sách & Giảm phân tâm)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isFocusDimmer, setIsFocusDimmer] = useState<boolean>(true);

  // GSAP: Hiệu ứng phóng to rõ dần (Blur-to-Clear Depth of Field Zoom-In) khi vào chế độ đọc sách
  useGSAP(
    () => {
      if (!containerRef.current) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo('.desk-dimmer-backdrop', { opacity: 0 }, { opacity: 1, duration: 0.6 });

      if (sb3dRef.current) {
        tl.fromTo(
          sb3dRef.current,
          { scale: 0.52, opacity: 0, filter: 'blur(22px)', y: 90, rotateX: 14 },
          { scale: zoomLevel, opacity: 1, filter: 'blur(0px)', y: 0, rotateX: 2, duration: 0.75, ease: 'power3.out' },
          '-=0.45'
        );
      }

      tl.fromTo('.desk-top-exit-btn', { opacity: 0, y: -25, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.4 }, '-=0.35');

      if (captionRef.current) {
        tl.fromTo(captionRef.current, { opacity: 0, y: 40, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.4)' }, '-=0.25');
      }

      tl.fromTo('.desk-nav-arrow-left', { opacity: 0, x: -25 }, { opacity: 0.75, x: 0, duration: 0.4 }, '-=0.3');
      tl.fromTo('.desk-nav-arrow-right', { opacity: 0, x: 25 }, { opacity: 0.75, x: 0, duration: 0.4 }, '-=0.4');
    },
    { scope: containerRef }
  );

  // GSAP: Hiệu ứng thu nhỏ lùi dần và mờ đi khi thoát chế độ đọc (Exit Animation)
  const handleExit = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);

    if (containerRef.current) {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.in', duration: 0.35 },
        onComplete: () => {
          onClose?.();
        },
      });

      tl.to('.desk-nav-arrow-left', { opacity: 0, x: -20, duration: 0.25 });
      tl.to('.desk-nav-arrow-right', { opacity: 0, x: 20, duration: 0.25 }, '-=0.25');

      if (captionRef.current) {
        tl.to(captionRef.current, { opacity: 0, y: 30, scale: 0.95, duration: 0.3 }, '-=0.2');
      }

      tl.to('.desk-top-exit-btn', { opacity: 0, y: -20, duration: 0.25 }, '-=0.25');

      if (sb3dRef.current) {
        tl.to(
          sb3dRef.current,
          { scale: 0.58, opacity: 0, filter: 'blur(18px)', y: 70, rotateX: 10, duration: 0.38, ease: 'power2.in' },
          '-=0.25'
        );
      }

      tl.to('.desk-dimmer-backdrop', { opacity: 0, duration: 0.3 }, '-=0.2');
    } else {
      onClose?.();
    }
  }, [isExiting, onClose]);

  // Khởi tạo danh sách Spreads từ book data
  useEffect(() => {
    const spreads = generateSpreads(book);
    setPageSpreads(spreads);
    setCurrentPageIndex(0);
    currentPageRef.current = 0;
    setIsReady(true);
  }, [book]);

  // CSS 3D Strip Page Turning Engine Ref States
  const turnRef = useRef<{
    dir: 'next' | 'prev';
    from: number;
    to: number;
    t: number;
  } | null>(null);

  const stripsRef = useRef<HTMLDivElement[]>([]);
  const springRef = useRef<{
    kind: 'spring' | 'tween';
    v: number;
    target: number;
    done?: () => void;
    k: number;
    c: number;
  } | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // 1. Áp dụng tiến trình xoay uốn cong dải 3D và ánh sáng quang học
  const applyTurn = useCallback((t: number) => {
    if (!sb3dRef.current) return;
    const th = Math.PI * t;
    const beta = MAX_BETA_CURL * Math.sin(Math.PI * t);
    const D = 180 / Math.PI;
    const tt = th + beta;
    const td = (2 * beta) / N_STRIPS;

    sb3dRef.current.style.setProperty('--tt', `${(tt * D).toFixed(2)}deg`);
    sb3dRef.current.style.setProperty('--td', `${(td * D).toFixed(3)}deg`);
    sb3dRef.current.style.setProperty('--shade', Math.sin(Math.PI * t).toFixed(3));

    for (let i = 0; i < stripsRef.current.length; i++) {
      const l1 = Math.abs(Math.cos(tt - i * td));
      const l2 = Math.abs(Math.cos(tt - (i + 1) * td));
      const st = stripsRef.current[i].style;
      st.setProperty('--lit', l1.toFixed(3));
      st.setProperty('--a1', ((1 - l1) * 0.62).toFixed(3));
      st.setProperty('--a2', ((1 - l2) * 0.62).toFixed(3));
    }
  }, []);

  // 2. Vẽ trạng thái DOM cuốn sách
  const paint = useCallback((overrideIndex?: number) => {
    const bookEl = bookDomRef.current;
    if (!bookEl || pageSpreads.length === 0) return;

    bookEl.innerHTML = '';
    const turn = turnRef.current;
    const activeIdx = overrideIndex !== undefined ? overrideIndex : currentPageRef.current;

    if (!turn) {
      const f = document.createElement('div');
      f.className = 'sb-full';
      const im = new Image();
      im.src = pageSpreads[activeIdx]?.dataUrl || '';
      im.alt = pageSpreads[activeIdx]?.title || '';
      im.draggable = false;
      f.appendChild(im);
      bookEl.appendChild(f);
      sb3dRef.current?.style.setProperty('--shade', '0');
    } else {
      const isNext = turn.dir === 'next';

      // Left half
      const leftHalf = document.createElement('div');
      leftHalf.className = 'sb-half left';
      const leftImg = new Image();
      leftImg.className = 'sb-half-img left';
      leftImg.draggable = false;
      leftImg.src = pageSpreads[isNext ? turn.from : turn.to]?.dataUrl || '';
      leftHalf.appendChild(leftImg);
      const gutterL = document.createElement('div');
      gutterL.className = 'gutter-shade left';
      leftHalf.appendChild(gutterL);
      bookEl.appendChild(leftHalf);

      // Right half
      const rightHalf = document.createElement('div');
      rightHalf.className = 'sb-half right';
      const rightImg = new Image();
      rightImg.className = 'sb-half-img right';
      rightImg.draggable = false;
      rightImg.src = pageSpreads[isNext ? turn.to : turn.from]?.dataUrl || '';
      rightHalf.appendChild(rightImg);
      const gutterR = document.createElement('div');
      gutterR.className = 'gutter-shade right';
      rightHalf.appendChild(gutterR);
      bookEl.appendChild(rightHalf);

      // 3D Nested Curved Leaf
      const curl = buildCurl(turn.dir, turn.from, turn.to, pageSpreads, stripsRef);
      bookEl.appendChild(curl);

      applyTurn(turn.t);
    }

    // Touch click zones
    const zonePrev = document.createElement('button');
    zonePrev.className = 'sb-zone sb-prev';
    zonePrev.setAttribute('aria-label', 'Previous page');
    const zoneNext = document.createElement('button');
    zoneNext.className = 'sb-zone sb-next';
    zoneNext.setAttribute('aria-label', 'Next page');
    bookEl.appendChild(zonePrev);
    bookEl.appendChild(zoneNext);

    if (sb3dRef.current && bookEl) {
      sb3dRef.current.style.setProperty('--bw', `${bookEl.clientWidth}px`);
    }

    onPageChange?.(activeIdx + 1, pageSpreads.length);
  }, [applyTurn, pageSpreads, onPageChange]);

  // 3. Vòng lặp vật lý lò xo
  const kick = useCallback(() => {
    if (rafRef.current === null) {
      lastTimeRef.current = performance.now();
      const tick = (now: number) => {
        rafRef.current = null;
        const dt = Math.min(0.032, (now - lastTimeRef.current) / 1000 || 0.016);
        lastTimeRef.current = now;

        const turn = turnRef.current;
        const s = springRef.current;

        if (s && turn) {
          if (s.kind === 'spring') {
            const x = turn.t - s.target;
            s.v += (-s.k * x - s.c * s.v) * dt;
            turn.t += s.v * dt;

            if (Math.abs(turn.t - s.target) < 0.002 && Math.abs(s.v) < 0.02) {
              turn.t = s.target;
              springRef.current = null;
              applyTurn(turn.t);
              s.done?.();
            } else {
              applyTurn(turn.t);
            }
          }
        }

        if (springRef.current && rafRef.current === null) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [applyTurn]);

  const animateTo = useCallback(
    (target: number, onDone: () => void, stiff = 160, damp = 24) => {
      springRef.current = {
        kind: 'spring',
        v: 0,
        target,
        done: onDone,
        k: stiff,
        c: damp,
      };
      kick();
    },
    [kick]
  );

  const startTurn = useCallback(
    (dir: 'next' | 'prev', t = 0) => {
      springRef.current = null;
      if (turnRef.current) {
        const prevTo = turnRef.current.to;
        currentPageRef.current = prevTo;
        setCurrentPageIndex(prevTo);
        turnRef.current = null;
      }
      const M = pageSpreads.length;
      if (M <= 1) return;

      const from = currentPageRef.current;
      if (from === 0 && dir === 'prev') return;
      if (from === M - 1 && dir === 'next') return;

      const to = dir === 'next' ? from + 1 : from - 1;

      turnRef.current = { dir, from, to, t };
      paint();
    },
    [pageSpreads.length, paint]
  );

  const commit = useCallback(() => {
    if (!turnRef.current) return;
    animateTo(1, () => {
      if (turnRef.current) {
        const nextIdx = turnRef.current.to;
        turnRef.current = null;
        currentPageRef.current = nextIdx;
        setCurrentPageIndex(nextIdx);
        paint(nextIdx);
      } else {
        paint();
      }
    });
  }, [animateTo, paint]);

  const cancel = useCallback(() => {
    if (!turnRef.current) return;
    animateTo(0, () => {
      const stayIdx = turnRef.current ? turnRef.current.from : currentPageRef.current;
      turnRef.current = null;
      currentPageRef.current = stayIdx;
      setCurrentPageIndex(stayIdx);
      paint(stayIdx);
    });
  }, [animateTo, paint]);

  const step = useCallback(
    (dir: 'next' | 'prev') => {
      if (currentPageRef.current === 0 && dir === 'prev') return;
      if (currentPageRef.current === pageSpreads.length - 1 && dir === 'next') return;

      if (turnRef.current) {
        const target = turnRef.current.to;
        turnRef.current = null;
        currentPageRef.current = target;
        setCurrentPageIndex(target);
      }
      startTurn(dir, 0);
      commit();
    },
    [pageSpreads.length, startTurn, commit]
  );

  // 4. Pointer drag listeners
  useEffect(() => {
    const stage = containerRef.current;
    const bookEl = bookDomRef.current;
    if (!stage || !bookEl || pageSpreads.length === 0) return;

    let drag: {
      dir: 'next' | 'prev';
      x0: number;
      w: number;
      moved: number;
      vel: number;
      tPrev: number;
    } | null = null;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const onBook = (e.target as HTMLElement)?.closest('.sb-zone');
      if (!onBook) return;

      const r = bookEl.getBoundingClientRect();
      const isRightSide = (e.clientX - r.left) / r.width > 0.5;
      const dir: 'next' | 'prev' = isRightSide ? 'next' : 'prev';

      if (currentPageRef.current === 0 && dir === 'prev') return;
      if (currentPageRef.current === pageSpreads.length - 1 && dir === 'next') return;

      startTurn(dir, 0);
      drag = {
        dir,
        x0: e.clientX,
        w: r.width,
        moved: 0,
        vel: 0,
        tPrev: performance.now(),
      };
      stage.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x0;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      const raw = (drag.dir === 'next' ? -dx : dx) / (drag.w * 0.62);
      const t = Math.max(0, Math.min(1, raw));
      const now = performance.now();
      const curTurnT = turnRef.current ? turnRef.current.t : 0;
      drag.vel = (t - curTurnT) / Math.max(0.001, (now - drag.tPrev) / 1000);
      drag.tPrev = now;

      if (turnRef.current) {
        turnRef.current.t = t;
        applyTurn(t);
      }
    };

    const handlePointerUp = () => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!turnRef.current) return;

      if (d.moved < 8) {
        commit();
        return;
      }

      const go = turnRef.current.t > 0.38 || d.vel > 1.1;
      if (go) commit();
      else cancel();
    };

    stage.addEventListener('pointerdown', handlePointerDown);
    stage.addEventListener('pointermove', handlePointerMove);
    stage.addEventListener('pointerup', handlePointerUp);
    stage.addEventListener('pointercancel', handlePointerUp);

    return () => {
      stage.removeEventListener('pointerdown', handlePointerDown);
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerup', handlePointerUp);
      stage.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [pageSpreads, startTurn, applyTurn, commit, cancel]);

  // Initial and reactive painting
  useEffect(() => {
    if (isReady && pageSpreads.length > 0) {
      paint();
    }
  }, [isReady, pageSpreads, paint]);

  // Resize listener
  useEffect(() => {
    const updateBw = () => {
      if (bookDomRef.current && sb3dRef.current) {
        sb3dRef.current.style.setProperty('--bw', `${bookDomRef.current.clientWidth}px`);
      }
    };
    updateBw();
    window.addEventListener('resize', updateBw);
    return () => window.removeEventListener('resize', updateBw);
  }, [zoomLevel, isReady]);

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft') {
        step('prev');
      } else if (e.key === 'ArrowRight') {
        step('next');
      } else if (e.key === 'Escape') {
        handleExit();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((prev) => Math.min(1.45, Number((prev + 0.1).toFixed(2))));
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel((prev) => Math.max(0.85, Number((prev - 0.1).toFixed(2))));
      } else if (e.key === '0') {
        setZoomLevel(1.0);
      } else if (e.key.toLowerCase() === 'f') {
        setIsFocusDimmer((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, handleExit]);

  const activeSpread = pageSpreads[currentPageIndex] || pageSpreads[0];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full max-w-full flex items-center justify-center p-0 select-none font-sans overflow-hidden"
    >
      {/* 1. FOCUS MODE BACKDROP DIMMER */}
      <div
        className={`desk-dimmer-backdrop fixed inset-0 pointer-events-none transition-all duration-700 ease-out -z-10 ${
          isFocusDimmer ? 'bg-zinc-950/90 backdrop-blur-lg opacity-100' : 'bg-zinc-950/40 opacity-100'
        }`}
        aria-hidden="true"
      />

      {/* 2. TOP FLOATING QUICK EXIT BUTTON */}
      {onClose && (
        <button
          type="button"
          onClick={handleExit}
          className="desk-top-exit-btn absolute top-3 sm:top-5 right-3 sm:right-6 p-2.5 sm:px-3.5 sm:py-2 rounded-2xl bg-tod-surface/90 hover:bg-rose-500/20 border border-tod-border hover:border-rose-500/40 text-tod-text-muted hover:text-rose-400 shadow-2xl backdrop-blur-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer z-50 flex items-center gap-2 text-xs font-bold group"
          title="Đóng sách và quay lại xem bàn học (ESC)"
        >
          <X className="w-4 h-4 text-amber-500 group-hover:text-rose-400 group-hover:rotate-90 transition-transform" />
          <span className="hidden sm:inline">Đóng sách</span>
        </button>
      )}

      {/* 3. ENLARGED 3D CURVED PAGE TURN STAGE */}
      <div className="desk-reading-book-stage relative w-full h-full flex items-center justify-center touch-none">
        {currentPageIndex > 0 && (
          <button
            type="button"
            onClick={() => step('prev')}
            className="desk-nav-arrow-left absolute left-2 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 rounded-2xl bg-tod-surface/85 hover:bg-tod-surface border border-tod-border/80 text-tod-text shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer z-40 group opacity-70 hover:opacity-100"
            title="Trang trước (←)"
          >
            <ChevronLeft className="w-6 h-6 text-amber-500 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        <div
          ref={sb3dRef}
          className="relative flex items-center justify-center transition-transform duration-300 ease-out"
          style={
            {
              perspective: '2800px',
              perspectiveOrigin: '50% 50%',
              width: 'min(99vw, calc((100vh - 28px) * 1.777))',
              maxWidth: '99.5vw',
              maxHeight: 'calc(100vh - 24px)',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
            } as React.CSSProperties
          }
        >
          <div
            className="relative w-full aspect-[1920/1080]"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(2deg) rotateY(0deg)',
            }}
          >
            <div
              className="absolute pointer-events-none -inset-6 rounded-3xl"
              style={{
                background: 'radial-gradient(50% 50% at 50% 55%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 80%)',
                filter: 'blur(32px)',
                zIndex: 0,
              }}
            />

            <div
              ref={bookDomRef}
              className="relative w-full aspect-[1920/1080] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.75)] overflow-visible"
              style={{ transformStyle: 'preserve-3d', zIndex: 1 }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => step('next')}
          className="desk-nav-arrow-right absolute right-2 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 rounded-2xl bg-tod-surface/85 hover:bg-tod-surface border border-tod-border/80 text-tod-text shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer z-40 group opacity-70 hover:opacity-100"
          title="Trang tiếp theo (→)"
        >
          <ChevronRight className="w-6 h-6 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 4. FOCUS MODE FLOATING BOTTOM CONTROLS PILL */}
      <DeskReadingBottomToolbar
        ref={captionRef}
        activeSpread={activeSpread}
        bookTitle={book.title}
        zoomLevel={zoomLevel}
        onZoomIn={() => setZoomLevel((prev) => Math.min(1.45, Number((prev + 0.1).toFixed(2))))}
        onZoomOut={() => setZoomLevel((prev) => Math.max(0.85, Number((prev - 0.1).toFixed(2))))}
        onResetZoom={() => setZoomLevel(1.0)}
        isFocusDimmer={isFocusDimmer}
        onToggleFocusDimmer={() => setIsFocusDimmer((prev) => !prev)}
        currentPageIndex={currentPageIndex}
        totalPages={pageSpreads.length}
      />

      <DeskPageTurningStyles />
    </div>
  );
};
