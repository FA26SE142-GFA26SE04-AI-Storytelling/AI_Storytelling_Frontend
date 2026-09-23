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
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  WorkingVolumeBook,
  createWorkingVolumeCoverTexture,
  createWorkingVolumeInsideCoverTexture,
  createWorkingVolumePageTexture,
} from '../three/room/textures/workingVolumesBooks';

gsap.registerPlugin(useGSAP);

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
// Tỷ lệ độ rộng từ gáy ra mép trang (Chính xác 50% độ rộng 2 trang)
const SPAN = 0.5;
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

      // 1. Phông nền tối mờ xuất hiện
      tl.fromTo(
        '.desk-dimmer-backdrop',
        { opacity: 0 },
        { opacity: 1, duration: 0.6 }
      );

      // 2. Quyển sách 3D phóng to từ xa và RÕ DẦN (từ mờ ảo blur(22px) sang sắc nét blur(0px))
      if (sb3dRef.current) {
        tl.fromTo(
          sb3dRef.current,
          {
            scale: 0.52,
            opacity: 0,
            filter: 'blur(22px)',
            y: 90,
            rotateX: 14,
          },
          {
            scale: zoomLevel,
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            rotateX: 2,
            duration: 0.75,
            ease: 'power3.out',
          },
          '-=0.45'
        );
      }

      // 3. Nút đóng sách góc trên trượt xuống
      tl.fromTo(
        '.desk-top-exit-btn',
        { opacity: 0, y: -25, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4 },
        '-=0.35'
      );

      // 4. Thanh công cụ nổi đáy màn hình bật nảy lên
      if (captionRef.current) {
        tl.fromTo(
          captionRef.current,
          { opacity: 0, y: 40, scale: 0.92 },
          { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.4)' },
          '-=0.25'
        );
      }

      // 5. Nút mũi tên điều hướng 2 bên trượt nhẹ vào
      tl.fromTo(
        '.desk-nav-arrow-left',
        { opacity: 0, x: -25 },
        { opacity: 0.75, x: 0, duration: 0.4 },
        '-=0.3'
      );
      tl.fromTo(
        '.desk-nav-arrow-right',
        { opacity: 0, x: 25 },
        { opacity: 0.75, x: 0, duration: 0.4 },
        '-=0.4'
      );
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

      // 1. Mũi tên 2 bên trượt ra
      tl.to('.desk-nav-arrow-left', { opacity: 0, x: -20, duration: 0.25 });
      tl.to('.desk-nav-arrow-right', { opacity: 0, x: 20, duration: 0.25 }, '-=0.25');

      // 2. Thanh điều khiển đáy trượt xuống
      if (captionRef.current) {
        tl.to(captionRef.current, { opacity: 0, y: 30, scale: 0.95, duration: 0.3 }, '-=0.2');
      }

      // 3. Nút đóng sách trượt lên
      tl.to('.desk-top-exit-btn', { opacity: 0, y: -20, duration: 0.25 }, '-=0.25');

      // 4. Quyển sách 3D thu nhỏ lùi dần về phía bàn học và mờ dần (blur(18px))
      if (sb3dRef.current) {
        tl.to(
          sb3dRef.current,
          {
            scale: 0.58,
            opacity: 0,
            filter: 'blur(18px)',
            y: 70,
            rotateX: 10,
            duration: 0.38,
            ease: 'power2.in',
          },
          '-=0.25'
        );
      }

      // 5. Nền tối mờ dần
      tl.to('.desk-dimmer-backdrop', { opacity: 0, duration: 0.3 }, '-=0.2');
    } else {
      onClose?.();
    }
  }, [isExiting, onClose]);

  // Helper tạo canvas 2 trang đôi toàn màn hình chuẩn 16:9 (Spread 1920x1080)
  const generateSpreads = useCallback((): PageSpread[] => {
    const W = 1920;
    const H = 1080;
    const halfW = W / 2;

    const spreads: PageSpread[] = [];

    // --- Spread 0: Bìa trước đơn (Chỉ hiển thị nửa bên phải, sách đang đóng) ---
    {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Nửa bên trái hoàn toàn trong suốt (Sách đang gập lại)
      ctx.clearRect(0, 0, W, H);

      // Nửa bên phải: Bìa trước của sách
      ctx.fillStyle = book.color;
      ctx.beginPath();
      ctx.roundRect(halfW, 0, halfW, H, [0, 20, 20, 0]);
      ctx.fill();

      // Gáy sách ở mép trái của bìa trước (tại halfW)
      const spineGrad = ctx.createLinearGradient(halfW, 0, halfW + 60, 0);
      spineGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
      spineGrad.addColorStop(0.25, 'rgba(255,255,255,0.2)');
      spineGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = spineGrad;
      ctx.fillRect(halfW, 0, 60, H);

      // Bìa trước (Right)
      ctx.strokeStyle = book.foil;
      ctx.lineWidth = 3;
      ctx.strokeRect(halfW + 60, 50, halfW - 120, H - 100);
      ctx.strokeRect(halfW + 80, 70, halfW - 160, H - 140);

      ctx.fillStyle = book.foil;
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`TẬP ${book.volume} · ${book.roman}`, halfW + halfW / 2, 140);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 92px sans-serif';
      ctx.fillText(book.title, halfW + halfW / 2, H / 2 - 40);

      ctx.fillStyle = book.foil;
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(`✦  ${book.discipline.toUpperCase()}  ✦`, halfW + halfW / 2, H / 2 + 50);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('MAGICTALES 3D EDITION', halfW + halfW / 2, H - 110);

      spreads.push({
        title: `${book.title} — Bìa Trước`,
        subtitle: `Tập ${book.volume} · ${book.discipline}`,
        dataUrl: canvas.toDataURL('image/png'),
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
      ctx.roundRect(100, 110, halfW - 200, H - 220, 20);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = book.color;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.strokeStyle = book.foil;
      ctx.lineWidth = 2;
      ctx.strokeRect(120, 130, halfW - 240, H - 260);

      ctx.fillStyle = book.color;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EX LIBRIS', halfW / 2, 210);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText(book.title, halfW / 2, 310);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`ẤN BẢN NOBITA · TẬP ${book.volume}`, halfW / 2, 390);
      ctx.fillText('✦ MagicTales Storytelling ✦', halfW / 2, 450);

      // Right Page: Mở đầu câu chuyện
      ctx.textAlign = 'left';
      ctx.fillStyle = book.color;
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`TẬP ${book.volume} · ${book.discipline.toUpperCase()}`, halfW + 90, 140);

      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText(book.title, halfW + 90, 220);

      // Deck synopsis
      ctx.fillStyle = '#1e293b';
      ctx.font = '28px sans-serif';
      const words = book.deck.split(' ');
      let line = '';
      let y = 300;
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
      y += 45;
      ctx.fillStyle = `${book.color}15`;
      ctx.beginPath();
      ctx.roundRect(halfW + 80, y, halfW - 160, 110, 14);
      ctx.fill();
      ctx.strokeStyle = book.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(halfW + 80, y + 10);
      ctx.lineTo(halfW + 80, y + 100);
      ctx.stroke();

      ctx.fillStyle = '#09090b';
      ctx.font = 'italic bold 22px sans-serif';
      ctx.fillText(`"${book.note}"`, halfW + 110, y + 62);

      // Page numbers
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('— Trang 01 —', halfW + halfW / 2, H - 55);

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
      ctx.fillText('Chương I: Khởi Nguồn Sáng Tạo', 90, 140);

      ctx.fillStyle = '#334155';
      ctx.font = '24px sans-serif';
      ctx.fillText('Mỗi câu chuyện đều bắt đầu từ một ý niệm nhỏ bé.', 90, 200);
      ctx.fillText('Khi bàn tay chạm vào trang giấy, trí tưởng tượng', 90, 245);
      ctx.fillText('mở ra vô vàn những thế giới diệu kỳ đang chờ đón.', 90, 290);

      // Minh họa thẻ màu
      ctx.fillStyle = book.color;
      ctx.beginPath();
      ctx.roundRect(90, 350, halfW - 180, 220, 20);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(book.motif, 90 + (halfW - 180) / 2, 450);
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`Chủ đề: ${book.theme}`, 90 + (halfW - 180) / 2, 500);

      // Right Page: Thử thách & Câu hỏi tương tác
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('Câu Hỏi Suy Ngẫm Cho Bé', halfW + 90, 140);

      const questions = [
        '1. Bé thích chi tiết nào nhất trong hành trình vừa qua?',
        '2. Nếu là nhân vật chính, bé sẽ lựa chọn giải pháp nào?',
        '3. Cùng chia sẻ cảm xúc của bé với ba mẹ nhé!',
      ];

      let y = 210;
      ctx.fillStyle = '#1e293b';
      ctx.font = '24px sans-serif';
      questions.forEach((q) => {
        ctx.fillText(q, halfW + 90, y);
        y += 65;
      });

      // Box bài học
      y += 35;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(halfW + 80, y, halfW - 160, 140, 16);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = book.color;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('✦ BÀI HỌC Ý NGHĨA ✦', halfW + 110, y + 40);
      ctx.fillStyle = '#334155';
      ctx.font = 'italic 20px sans-serif';
      ctx.fillText('Kiên trì và sáng tạo sẽ mở ra những cánh cửa bất ngờ.', halfW + 110, y + 80);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('— Trang 02 —', halfW + halfW / 2, H - 55);

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

    onPageChange?.(activeIdx + 1, pageSpreads.length);
  }, [buildCurl, applyTurn, pageSpreads, onPageChange]);

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
      className="relative w-full h-full max-w-full flex items-center justify-center p-0 select-none font-sans overflow-hidden"
    >
      {/* 1. FOCUS MODE BACKDROP DIMMER (Tối & mờ không gian phòng để tập trung đọc sách) */}
      <div
        className={`desk-dimmer-backdrop fixed inset-0 pointer-events-none transition-all duration-700 ease-out -z-10 ${
          isFocusDimmer
            ? 'bg-zinc-950/90 backdrop-blur-lg opacity-100'
            : 'bg-zinc-950/40 opacity-100'
        }`}
        aria-hidden="true"
      />

      {/* 2. TOP FLOATING QUICK EXIT BUTTON */}
      {onClose && (
        <button
          onClick={handleExit}
          className="desk-top-exit-btn absolute top-3 sm:top-5 right-3 sm:right-6 p-2.5 sm:px-3.5 sm:py-2 rounded-2xl bg-tod-surface/90 hover:bg-rose-500/20 border border-tod-border hover:border-rose-500/40 text-tod-text-muted hover:text-rose-400 shadow-2xl backdrop-blur-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer z-50 flex items-center gap-2 text-xs font-bold group"
          title="Đóng sách và quay lại xem bàn học (ESC)"
        >
          <X className="w-4 h-4 text-amber-500 group-hover:text-rose-400 group-hover:rotate-90 transition-transform" />
          <span className="hidden sm:inline">Đóng sách</span>
        </button>
      )}

      {/* 3. ENLARGED 3D CURVED PAGE TURN STAGE (MỞ RỘNG TOÀN MÀN HÌNH) */}
      <div className="desk-reading-book-stage relative w-full h-full flex items-center justify-center touch-none">
        {/* Nút lùi trang nổi bên trái */}
        {currentPageIndex > 0 && (
          <button
            onClick={() => step('prev')}
            className="desk-nav-arrow-left absolute left-2 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 rounded-2xl bg-tod-surface/85 hover:bg-tod-surface border border-tod-border/80 text-tod-text shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer z-40 group opacity-70 hover:opacity-100"
            title="Trang trước (←)"
          >
            <ChevronLeft className="w-6 h-6 text-amber-500 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Khung 3D Perspective Book (Trải rộng tối đa theo chiều ngang toàn màn hình 99vw) */}
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
            {/* Đổ bóng tự nhiên dưới mặt sách */}
            <div
              className="absolute pointer-events-none -inset-6 rounded-3xl"
              style={{
                background:
                  'radial-gradient(50% 50% at 50% 55%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 80%)',
                filter: 'blur(32px)',
                zIndex: 0,
              }}
            />

            {/* DOM Container của sách 3D */}
            <div
              ref={bookDomRef}
              className="relative w-full aspect-[1920/1080] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.75)] overflow-visible"
              style={{ transformStyle: 'preserve-3d', zIndex: 1 }}
            />
          </div>
        </div>

        {/* Nút tiến trang nổi bên phải */}
        <button
          onClick={() => step('next')}
          className="desk-nav-arrow-right absolute right-2 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 rounded-2xl bg-tod-surface/85 hover:bg-tod-surface border border-tod-border/80 text-tod-text shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer z-40 group opacity-70 hover:opacity-100"
          title="Trang tiếp theo (→)"
        >
          <ChevronRight className="w-6 h-6 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 4. FOCUS MODE FLOATING BOTTOM CONTROLS PILL */}
      <div
        ref={captionRef}
        className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-between gap-3 sm:gap-4 w-auto max-w-[94vw] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-tod-surface/90 border border-tod-border/80 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-40 text-tod-text transition-all hover:bg-tod-surface/98"
      >
        {/* Left: Book Spread Title */}
        <div className="flex items-center gap-2 min-w-0 max-w-[200px] sm:max-w-[320px]">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-xs text-tod-text truncate">
              {activeSpread?.title || book.title}
            </span>
            <span className="text-[10px] font-semibold text-tod-text-muted truncate hidden sm:inline">
              {activeSpread?.subtitle || 'Lật trang bằng kéo chuột hoặc phím ← →'}
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-tod-border/80" />

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.85}
            className="p-1 rounded-lg bg-tod-card/80 hover:bg-tod-card border border-tod-border/60 text-tod-text disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="w-3 h-3" />
          </button>

          <button
            onClick={handleResetZoom}
            className="px-1.5 py-0.5 rounded-lg bg-tod-card/80 hover:bg-tod-card border border-tod-border/60 text-[10px] font-extrabold text-amber-500 min-w-[40px] text-center transition-all cursor-pointer hover:scale-105"
            title="Đặt lại mức phóng to mặc định"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 1.45}
            className="p-1 rounded-lg bg-tod-card/80 hover:bg-tod-card border border-tod-border/60 text-tod-text disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Phóng to (+)"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        <div className="h-4 w-px bg-tod-border/80" />

        {/* Right: Dimmer & Page Counter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsFocusDimmer((prev) => !prev)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
              isFocusDimmer
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                : 'bg-tod-card/80 hover:bg-tod-card border-tod-border/60 text-tod-text-muted hover:text-tod-text'
            }`}
            title="Bật/tắt làm tối nền phòng (Phím F)"
          >
            {isFocusDimmer ? (
              <Eye className="w-3 h-3 text-amber-500" />
            ) : (
              <EyeOff className="w-3 h-3 text-tod-text-muted" />
            )}
            <span className="hidden md:inline">Tập trung</span>
          </button>

          {pageSpreads.length > 0 && (
            <span className="text-[10px] font-bold text-tod-text-muted px-2 py-0.5 rounded-full bg-tod-card/80 border border-tod-border/60">
              {currentPageIndex + 1}/{pageSpreads.length}
            </span>
          )}
        </div>
      </div>

      {/* CSS 3D Nested Curved Strips Styles */}
      <style jsx global>{`
        .sb-full {
          position: absolute;
          inset: 0;
          border-radius: 16px;
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
          border-top-left-radius: 16px;
          border-bottom-left-radius: 16px;
        }
        .sb-half.right {
          left: 50%;
          border-top-right-radius: 16px;
          border-bottom-right-radius: 16px;
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
          width: calc(var(--bw, 0px) * var(--span, 0.5));
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
          width: calc(var(--bw, 0px) * var(--span, 0.5) / var(--n, 18));
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
          background-size: var(--bw, 0px) 100%;
        }
        .face.back {
          transform: rotateY(180deg);
        }
        /* Bo viền các góc ngoài của trang sách khi đang lật / nhấc lên */
        .curl.next .strip.edge .face.front {
          border-top-right-radius: 16px;
          border-bottom-right-radius: 16px;
          overflow: hidden;
        }
        .curl.next .strip.edge .face.back {
          border-top-left-radius: 16px;
          border-bottom-left-radius: 16px;
          overflow: hidden;
        }
        .curl.prev .strip.edge .face.front {
          border-top-left-radius: 16px;
          border-bottom-left-radius: 16px;
          overflow: hidden;
        }
        .curl.prev .strip.edge .face.back {
          border-top-right-radius: 16px;
          border-bottom-right-radius: 16px;
          overflow: hidden;
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
