'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  BookOpen,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  WorkingVolumeBook,
  createWorkingVolumeCoverTexture,
  createWorkingVolumeInsideCoverTexture,
  createWorkingVolumePageTexture,
} from '../three/room/textures/workingVolumesBooks';

export interface DeskPageTurningBookProps {
  book: WorkingVolumeBook;
  onPageChange?: (pageIndex: number, totalPages: number) => void;
  onClose?: () => void;
}

interface PageSpread {
  title: string;
  subtitle: string;
  dataUrl: string;
}

// Số lượng strips để tạo độ cong mượt mà
const N = 18;
// Tỷ lệ độ rộng từ gáy ra mép trang
const SPAN = 0.449;
// Độ cong cực đại của trang giấy (radian)
const BETA = 0.60;

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
  const [isReady, setIsReady] = useState<boolean>(false);

  // Focus Mode & Zoom State (Phóng to trang sách & Giảm phân tâm)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isFocusDimmer, setIsFocusDimmer] = useState<boolean>(true);

  // Helper tạo canvas 2 trang đôi (Spread 1760x1240)
  const generateSpreads = useCallback((): PageSpread[] => {
    const W = 1760;
    const H = 1240;
    const halfW = W / 2;

    const spreads: PageSpread[] = [];

    // --- Spread 0: Bìa sách gập đôi (Bìa sau & Bìa trước) ---
    {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Nền vải sách
      ctx.fillStyle = book.color;
      ctx.fillRect(0, 0, W, H);

      // Gáy sách ở giữa
      const spineGrad = ctx.createLinearGradient(halfW - 50, 0, halfW + 50, 0);
      spineGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
      spineGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
      spineGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = spineGrad;
      ctx.fillRect(halfW - 50, 0, 100, H);

      // Bìa sau (Left)
      ctx.strokeStyle = book.foil;
      ctx.lineWidth = 3;
      ctx.strokeRect(60, 60, halfW - 120, H - 120);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`"${book.note}"`, halfW / 2, H / 2 - 40);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = book.foil;
      ctx.fillText(`ẤN BẢN TẬP ${book.volume} · ${book.discipline.toUpperCase()}`, halfW / 2, H / 2 + 40);

      // Bìa trước (Right)
      ctx.strokeRect(halfW + 60, 60, halfW - 120, H - 120);
      ctx.strokeRect(halfW + 80, 80, halfW - 160, H - 160);

      ctx.fillStyle = book.foil;
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`TẬP ${book.volume} · ${book.roman}`, halfW + halfW / 2, 160);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 92px sans-serif';
      ctx.fillText(book.title, halfW + halfW / 2, H / 2 - 50);

      ctx.fillStyle = book.foil;
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(`✦  ${book.discipline.toUpperCase()}  ✦`, halfW + halfW / 2, H / 2 + 40);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('MAGICTALES 3D EDITION', halfW + halfW / 2, H - 130);

      spreads.push({
        title: `${book.title} — Bìa Ấn Bản`,
        subtitle: `Tập ${book.volume} · ${book.discipline}`,
        dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      });
    }

    // --- Spread 1: Trang Ex Libris & Trang Tiêu Đề (Trang 01) ---
    {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Trang giấy ấm áp
      ctx.fillStyle = '#fbf7ee';
      ctx.fillRect(0, 0, W, H);

      // Bóng râm gáy ở giữa
      const spineShadow = ctx.createLinearGradient(halfW - 80, 0, halfW + 80, 0);
      spineShadow.addColorStop(0, 'rgba(0,0,0,0)');
      spineShadow.addColorStop(0.5, 'rgba(0,0,0,0.22)');
      spineShadow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = spineShadow;
      ctx.fillRect(halfW - 80, 0, 160, H);

      // Left Page: Ex Libris
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(100, 140, halfW - 200, H - 280, 20);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = book.color;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.strokeStyle = book.foil;
      ctx.lineWidth = 2;
      ctx.strokeRect(120, 160, halfW - 240, H - 320);

      ctx.fillStyle = book.color;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EX LIBRIS', halfW / 2, 240);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText(book.title, halfW / 2, 340);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`ẤN BẢN NOBITA · TẬP ${book.volume}`, halfW / 2, 420);
      ctx.fillText('✦ MagicTales Storytelling ✦', halfW / 2, 480);

      // Right Page: Mở đầu câu chuyện
      ctx.textAlign = 'left';
      ctx.fillStyle = book.color;
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`TẬP ${book.volume} · ${book.discipline.toUpperCase()}`, halfW + 90, 160);

      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText(book.title, halfW + 90, 240);

      // Deck synopsis
      ctx.fillStyle = '#1e293b';
      ctx.font = 'medium 26px sans-serif';
      const words = book.deck.split(' ');
      let line = '';
      let y = 330;
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        if (ctx.measureText(testLine).width > halfW - 180 && i > 0) {
          ctx.fillText(line, halfW + 90, y);
          line = words[i] + ' ';
          y += 44;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, halfW + 90, y);

      // Quote box
      y += 50;
      ctx.fillStyle = `${book.color}15`;
      ctx.beginPath();
      ctx.roundRect(halfW + 80, y, halfW - 160, 120, 14);
      ctx.fill();
      ctx.strokeStyle = book.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(halfW + 80, y + 10);
      ctx.lineTo(halfW + 80, y + 110);
      ctx.stroke();

      ctx.fillStyle = '#09090b';
      ctx.font = 'italic bold 22px sans-serif';
      ctx.fillText(`"${book.note}"`, halfW + 110, y + 68);

      // Page numbers
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('— Trang 01 —', halfW + halfW / 2, H - 70);

      spreads.push({
        title: `${book.title} — Mở Đầu Câu Chuyện`,
        subtitle: `Tập ${book.volume} · Trang 01`,
        dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      });
    }

    // --- Spread 2: Nội dung chương 1 & Thử thách khám phá ---
    {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#fbf7ee';
      ctx.fillRect(0, 0, W, H);

      const spineShadow = ctx.createLinearGradient(halfW - 80, 0, halfW + 80, 0);
      spineShadow.addColorStop(0, 'rgba(0,0,0,0)');
      spineShadow.addColorStop(0.5, 'rgba(0,0,0,0.22)');
      spineShadow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = spineShadow;
      ctx.fillRect(halfW - 80, 0, 160, H);

      // Left Page: Minh họa & Bối cảnh
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Chương I: Khởi Nguồn Sáng Tạo', 90, 160);

      ctx.fillStyle = '#334155';
      ctx.font = '24px sans-serif';
      ctx.fillText('Mỗi câu chuyện đều bắt đầu từ một ý niệm nhỏ bé.', 90, 220);
      ctx.fillText('Khi bàn tay chạm vào trang giấy, trí tưởng tượng', 90, 265);
      ctx.fillText('mở ra vô vàn những thế giới diệu kỳ đang chờ đón.', 90, 310);

      // Minh họa thẻ màu
      ctx.fillStyle = book.color;
      ctx.beginPath();
      ctx.roundRect(90, 370, halfW - 180, 240, 20);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(book.motif, 90 + (halfW - 180) / 2, 480);
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`Chủ đề: ${book.theme}`, 90 + (halfW - 180) / 2, 530);

      // Right Page: Thử thách & Câu hỏi tương tác
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('Câu Hỏi Suy Ngẫm Cho Bé', halfW + 90, 160);

      const questions = [
        '1. Bé thích chi tiết nào nhất trong hành trình vừa qua?',
        '2. Nếu là nhân vật chính, bé sẽ lựa chọn giải pháp nào?',
        '3. Cùng chia sẻ cảm xúc của bé với ba mẹ nhé!',
      ];

      let y = 230;
      ctx.fillStyle = '#1e293b';
      ctx.font = '24px sans-serif';
      questions.forEach((q) => {
        ctx.fillText(q, halfW + 90, y);
        y += 70;
      });

      // Box bài học
      y += 40;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(halfW + 80, y, halfW - 160, 160, 16);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = book.color;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('✦ BÀI HỌC Ý NGHĨA ✦', halfW + 110, y + 45);
      ctx.fillStyle = '#334155';
      ctx.font = 'italic 20px sans-serif';
      ctx.fillText('Kiên trì và sáng tạo sẽ mở ra những cánh cửa bất ngờ.', halfW + 110, y + 90);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('— Trang 02 —', halfW + halfW / 2, H - 70);

      spreads.push({
        title: `${book.title} — Chương I & Bài Học`,
        subtitle: `Tập ${book.volume} · Trang 02`,
        dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      });
    }

    return spreads;
  }, [book]);

  useEffect(() => {
    const spreads = generateSpreads();
    setPageSpreads(spreads);
    setCurrentPageIndex(0);
    setIsReady(true);
  }, [generateSpreads]);

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

  // 1. Build nested strip chain for curved realistic page curl
  const buildCurl = useCallback(
    (dir: 'next' | 'prev', from: number, to: number): HTMLDivElement => {
      stripsRef.current = [];
      const c = document.createElement('div');
      c.className = `curl ${dir}`;
      c.style.setProperty('--n', String(N));
      c.style.setProperty('--span', String(SPAN));

      let host: HTMLElement = c;
      for (let i = 0; i < N; i++) {
        const s = document.createElement('div');
        s.className = 'strip';
        s.style.setProperty('--i', String(i));

        const gut = 'calc(var(--bw) * 0.5)';
        const sw = `calc(var(--bw) * ${SPAN} / ${N})`;
        const A = `calc(-1 * (${gut} + ${i} * ${sw}))`; // faces from-page
        const B = `calc(${(i + 1)} * ${sw} - ${gut})`; // faces to-page

        const f = document.createElement('div');
        f.className = 'face front';
        const b = document.createElement('div');
        b.className = 'face back';

        const dress = (el: HTMLElement, url: string, px: string) => {
          el.style.backgroundImage = `url(${url})`;
          el.style.backgroundPositionX = px;
        };

        if (pageSpreads[from] && pageSpreads[to]) {
          dress(f, pageSpreads[from].dataUrl, dir === 'next' ? A : B);
          dress(b, pageSpreads[to].dataUrl, dir === 'next' ? B : A);
        }

        const shF = document.createElement('div');
        shF.className = 'sh';
        const glF = document.createElement('div');
        glF.className = 'gl';
        f.appendChild(shF);
        f.appendChild(glF);

        const shB = document.createElement('div');
        shB.className = 'sh';
        const glB = document.createElement('div');
        glB.className = 'gl';
        b.appendChild(shB);
        b.appendChild(glB);

        s.appendChild(f);
        s.appendChild(b);

        if (i === N - 1) {
          s.classList.add('edge');
        }

        host.appendChild(s);
        host = s;
        stripsRef.current.push(s);
      }

      return c;
    },
    [pageSpreads]
  );

  // 2. Apply dynamic turn progress t (0 -> 1) to rotate and curve strips with lighting
  const applyTurn = useCallback((t: number) => {
    if (!sb3dRef.current) return;
    const th = Math.PI * t; // how far the leaf has swung
    const beta = BETA * Math.sin(Math.PI * t); // flat at both ends
    const D = 180 / Math.PI;
    const tt = th + beta;
    const td = (2 * beta) / N;

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

  // 3. Paint book DOM state
  const paint = useCallback(() => {
    const bookEl = bookDomRef.current;
    if (!bookEl || pageSpreads.length === 0) return;

    bookEl.innerHTML = '';
    const turn = turnRef.current;

    if (!turn) {
      const f = document.createElement('div');
      f.className = 'sb-full';
      const im = new Image();
      im.src = pageSpreads[currentPageIndex]?.dataUrl || '';
      im.alt = pageSpreads[currentPageIndex]?.title || '';
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
      const curl = buildCurl(turn.dir, turn.from, turn.to);
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

    onPageChange?.(currentPageIndex + 1, pageSpreads.length);
  }, [buildCurl, applyTurn, currentPageIndex, pageSpreads, onPageChange]);

  // 4. Spring loop physics
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
        setCurrentPageIndex(turnRef.current.to);
        turnRef.current = null;
      }
      const M = pageSpreads.length;
      if (M <= 1) return;

      const from = currentPageIndex;
      const to = dir === 'next' ? (from + 1) % M : (from - 1 + M) % M;

      turnRef.current = { dir, from, to, t };
      paint();
    },
    [currentPageIndex, pageSpreads.length, paint]
  );

  const commit = useCallback(() => {
    if (!turnRef.current) return;
    animateTo(1, () => {
      if (turnRef.current) {
        setCurrentPageIndex(turnRef.current.to);
        turnRef.current = null;
      }
      paint();
    });
  }, [animateTo, paint]);

  const cancel = useCallback(() => {
    if (!turnRef.current) return;
    animateTo(0, () => {
      turnRef.current = null;
      paint();
    });
  }, [animateTo, paint]);

  const step = useCallback(
    (dir: 'next' | 'prev') => {
      if (turnRef.current) {
        setCurrentPageIndex(turnRef.current.to);
        turnRef.current = null;
      }
      startTurn(dir, 0);
      commit();
    },
    [startTurn, commit]
  );

  // 5. Pointer drag listeners for physics interactive turning
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
      const dir: 'next' | 'prev' =
        (e.clientX - r.left) / r.width > 0.5 ? 'next' : 'prev';

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

  // Dynamic resize listener to keep --bw matching actual width
  useEffect(() => {
    const updateBw = () => {
      if (bookDomRef.current && sb3dRef.current) {
        sb3dRef.current.style.setProperty(
          '--bw',
          `${bookDomRef.current.clientWidth}px`
        );
      }
    };
    updateBw();
    window.addEventListener('resize', updateBw);
    return () => window.removeEventListener('resize', updateBw);
  }, [zoomLevel, isReady]);

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === 'ArrowLeft') {
        step('prev');
      } else if (e.key === 'ArrowRight') {
        step('next');
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
  }, [step]);

  const activeSpread = pageSpreads[currentPageIndex] || pageSpreads[0];

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(1.45, Number((prev + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.85, Number((prev - 0.1).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full max-w-full flex flex-col items-center justify-between px-2 sm:px-6 py-2 select-none font-sans overflow-hidden"
    >
      {/* 1. FOCUS MODE BACKDROP DIMMER (Tối & mờ không gian phòng để tập trung đọc sách) */}
      <div
        className={`fixed inset-0 pointer-events-none transition-all duration-700 ease-out -z-10 ${
          isFocusDimmer
            ? 'bg-zinc-950/85 backdrop-blur-md opacity-100'
            : 'bg-transparent opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* 2. ENLARGED 3D CURVED PAGE TURN STAGE */}
      <div className="relative flex-1 w-full min-h-0 flex items-center justify-center touch-none my-auto">
        {/* Nút lùi trang nổi bên trái */}
        <button
          onClick={() => step('prev')}
          className="absolute left-2 sm:left-6 lg:left-10 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-2xl bg-tod-surface/95 hover:bg-tod-card border border-tod-border text-tod-text shadow-2xl backdrop-blur-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer z-40 group"
          title="Trang trước (←)"
        >
          <ChevronLeft className="w-6 h-6 text-amber-500 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Khung 3D Perspective Book (Tự động tính toán tỷ lệ để vừa vặn màn hình mà không che thanh công cụ) */}
        <div
          ref={sb3dRef}
          className="relative flex items-center justify-center transition-transform duration-300 ease-out"
          style={
            {
              perspective: '2400px',
              perspectiveOrigin: '50% 50%',
              width: 'min(90vw, calc((100vh - 200px) * 1.419), 1280px)',
              maxWidth: '92vw',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
            } as React.CSSProperties
          }
        >
          <div
            className="relative w-full aspect-[1760/1240]"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(2.5deg) rotateY(0deg)',
            }}
          >
            {/* Đổ bóng tự nhiên dưới mặt sách */}
            <div
              className="absolute pointer-events-none -inset-8 rounded-3xl"
              style={{
                background:
                  'radial-gradient(50% 50% at 50% 55%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 50%, transparent 80%)',
                filter: 'blur(28px)',
                zIndex: 0,
              }}
            />

            {/* DOM Container của sách 3D */}
            <div
              ref={bookDomRef}
              className="relative w-full aspect-[1760/1240] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-visible"
              style={{ transformStyle: 'preserve-3d', zIndex: 1 }}
            />
          </div>
        </div>

        {/* Nút tiến trang nổi bên phải */}
        <button
          onClick={() => step('next')}
          className="absolute right-2 sm:right-6 lg:right-10 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-2xl bg-tod-surface/95 hover:bg-tod-card border border-tod-border text-tod-text shadow-2xl backdrop-blur-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer z-40 group"
          title="Trang tiếp theo (→)"
        >
          <ChevronRight className="w-6 h-6 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 3. FOCUS MODE BOTTOM TOOLBAR & CAPTION */}
      <div
        ref={captionRef}
        className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-3xl px-4 py-2.5 rounded-2xl bg-tod-surface/95 border border-tod-border backdrop-blur-2xl shadow-2xl z-40 text-tod-text shrink-0"
      >
        {/* Left: Book Spread Title */}
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-xs sm:text-sm text-tod-text truncate">
              {activeSpread?.title || book.title}
            </span>
            <span className="text-[11px] font-semibold text-tod-text-muted truncate">
              {activeSpread?.subtitle || 'Lật trang bằng kéo chuột hoặc phím ← →'}
            </span>
          </div>
        </div>

        {/* Right: Focus & Zoom Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.85}
            className="p-1.5 rounded-xl bg-tod-card hover:bg-tod-surface border border-tod-border text-tod-text disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom % Indicator (Click to toggle 100% / 115%) */}
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 rounded-xl bg-tod-card hover:bg-tod-surface border border-tod-border text-[11px] font-extrabold text-amber-500 min-w-[50px] text-center transition-all cursor-pointer hover:scale-105"
            title="Đặt lại mức phóng to mặc định"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 1.45}
            className="p-1.5 rounded-xl bg-tod-card hover:bg-tod-surface border border-tod-border text-tod-text disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Phóng to (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-tod-border mx-1" />

          {/* Focus Mode Dimmer Toggle */}
          <button
            onClick={() => setIsFocusDimmer((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isFocusDimmer
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-sm shadow-amber-500/10'
                : 'bg-tod-card hover:bg-tod-surface border-tod-border text-tod-text-muted hover:text-tod-text'
            }`}
            title="Bật/tắt chế độ tập trung làm tối nền phòng (Phím F)"
          >
            {isFocusDimmer ? (
              <Eye className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-tod-text-muted" />
            )}
            <span className="hidden md:inline">Tập trung</span>
          </button>

          {/* Spread Count Badge */}
          {pageSpreads.length > 0 && (
            <span className="text-[11px] font-bold text-tod-text-muted px-2 py-1 rounded-xl bg-tod-card border border-tod-border ml-1">
              {currentPageIndex + 1} / {pageSpreads.length}
            </span>
          )}

          {/* Close / Minimize to Desk Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 ml-1 rounded-xl bg-tod-card hover:bg-rose-500/20 border border-tod-border hover:border-rose-500/40 text-tod-text-muted hover:text-rose-400 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Đóng sách và quay lại xem bàn học"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* CSS 3D Nested Curved Strips Styles */}
      <style jsx global>{`
        .sb-full {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          overflow: hidden;
        }
        .sb-full img {
          width: 100%;
          height: auto;
          display: block;
        }
        .sb-half {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50%;
          overflow: hidden;
        }
        .sb-half.left {
          left: 0;
          border-top-left-radius: 14px;
          border-bottom-left-radius: 14px;
        }
        .sb-half.right {
          left: 50%;
          border-top-right-radius: 14px;
          border-bottom-right-radius: 14px;
        }
        .sb-half-img {
          width: 200%;
          max-width: none;
          height: 100%;
          display: block;
        }
        .sb-half-img.right {
          margin-left: -100%;
        }
        .gutter-shade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 40%;
          pointer-events: none;
          opacity: calc(var(--shade, 0) * 0.65);
        }
        .gutter-shade.left {
          right: 0;
          background: linear-gradient(
            270deg,
            rgba(0, 0, 0, 0.35),
            rgba(0, 0, 0, 0) 80%
          );
        }
        .gutter-shade.right {
          left: 0;
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.35),
            rgba(0, 0, 0, 0) 80%
          );
        }

        /* 3D Turning Nested Strips */
        .curl {
          position: absolute;
          top: 0;
          height: 100%;
          width: calc(var(--bw, 0px) * var(--span, 0.449));
          transform-style: preserve-3d;
          z-index: 6;
        }
        .curl.next {
          left: 50%;
          transform-origin: left center;
          transform: rotateY(calc(-1 * var(--tt, 0deg)));
        }
        .curl.prev {
          right: 50%;
          transform-origin: right center;
          transform: rotateY(var(--tt, 0deg));
        }
        .strip {
          position: absolute;
          top: 0;
          height: 100%;
          width: calc(var(--bw, 0px) * var(--span, 0.449) / var(--n, 18));
          transform-style: preserve-3d;
        }
        .curl.next .strip {
          transform-origin: left center;
        }
        .curl.prev .strip {
          transform-origin: right center;
        }
        .curl.next > .strip {
          left: 0;
        }
        .curl.prev > .strip {
          right: 0;
          left: auto;
        }
        .curl.next .strip .strip {
          left: 100%;
          transform: rotateY(var(--td, 0deg));
        }
        .curl.prev .strip .strip {
          right: 100%;
          transform: rotateY(calc(-1 * var(--td, 0deg)));
        }
        .face {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: -1.2px;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          background-repeat: no-repeat;
          background-size: var(--bw, 0px) auto;
        }
        .face.back {
          transform: rotateY(180deg);
        }
        .face .sh {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .curl.next .face.front .sh,
        .curl.prev .face.back .sh {
          background: linear-gradient(
            90deg,
            rgba(40, 25, 10, var(--a1, 0)),
            rgba(40, 25, 10, var(--a2, 0))
          );
        }
        .curl.next .face.back .sh,
        .curl.prev .face.front .sh {
          background: linear-gradient(
            90deg,
            rgba(40, 25, 10, var(--a2, 0)),
            rgba(40, 25, 10, var(--a1, 0))
          );
        }
        .face .gl {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: #ffffff;
          opacity: calc(
            var(--shade, 0) * var(--lit, 1) * var(--lit, 1) * 0.22
          );
        }
        .sb-zone {
          position: absolute;
          top: 0;
          bottom: 0;
          border: 0;
          background: transparent;
          cursor: grab;
          z-index: 20;
          touch-action: none;
        }
        .sb-zone:active {
          cursor: grabbing;
        }
        .sb-prev {
          left: 0;
          width: 50%;
        }
        .sb-next {
          right: 0;
          width: 50%;
        }
      `}</style>
    </div>
  );
};
