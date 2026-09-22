'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import {
  WORKING_VOLUMES_BOOKS,
  WorkingVolumeBook,
} from '../three/room/textures/workingVolumesBooks';

export interface BookInspectorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBookId: string | null;
  onSelectBookId: (id: string) => void;
  onOpenReader?: (book: WorkingVolumeBook) => void;
}

export const BookInspectorOverlay: React.FC<BookInspectorOverlayProps> = ({
  isOpen,
  onClose,
  selectedBookId,
  onSelectBookId,
  onOpenReader,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const currentIndex = Math.max(
    0,
    WORKING_VOLUMES_BOOKS.findIndex((b) => b.id === selectedBookId)
  );
  const currentBook = WORKING_VOLUMES_BOOKS[currentIndex] || WORKING_VOLUMES_BOOKS[2]; // Default Xcode

  const handlePrevBook = () => {
    const prevIdx = (currentIndex - 1 + WORKING_VOLUMES_BOOKS.length) % WORKING_VOLUMES_BOOKS.length;
    onSelectBookId(WORKING_VOLUMES_BOOKS[prevIdx].id);
  };

  const handleNextBook = () => {
    const nextIdx = (currentIndex + 1) % WORKING_VOLUMES_BOOKS.length;
    onSelectBookId(WORKING_VOLUMES_BOOKS[nextIdx].id);
  };

  // GSAP: Hiệu ứng chuyển cảnh bung nở 3D mượt mà, điện ảnh khi mở Book Detail
  useGSAP(() => {
    if (isOpen) {
      // 1. Nền mờ kính tối dần êm ái
      gsap.fromTo(
        '.book-inspector-backdrop',
        { opacity: 0 },
        { opacity: 1, duration: 0.45, ease: 'power2.out' }
      );

      // 2. Thanh tiêu đề phía trên trượt xuống
      gsap.fromTo(
        '.book-inspector-topbar',
        { y: -35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }
      );

      // 3. Khung thông tin biên tập bên phải trượt từ bên phải vào và làm nét
      gsap.fromTo(
        '.book-inspector-right',
        { x: 90, opacity: 0, scale: 0.94 },
        { x: 0, opacity: 1, scale: 1, duration: 0.68, ease: 'power3.out', delay: 0.06 }
      );

      // 4. Badge hướng dẫn tương tác 3D nổi lên
      gsap.fromTo(
        '.book-inspector-3d-hint',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.25 }
      );

      // 5. Các dòng thông số stagger xuất hiện tuần tự
      gsap.fromTo(
        '.book-inspector-detail-item',
        { opacity: 0, y: 18, x: 20 },
        { opacity: 1, y: 0, x: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out', delay: 0.18 }
      );
    }
  }, { scope: containerRef, dependencies: [isOpen, currentBook.id] });

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 flex flex-col justify-between p-4 sm:p-8 lg:p-10 pointer-events-none select-none"
    >
      {/* Dynamic Dark Gradient Backdrop (Sharp 3D model, non-blocking pointer events) */}
      <div className="book-inspector-backdrop absolute inset-0 bg-gradient-to-r from-black/10 via-black/35 to-black/80 transition-opacity pointer-events-none" />

      {/* 1. TOP FLOATING HEADER */}
      <div className="book-inspector-topbar relative z-10 w-full flex items-center justify-between pointer-events-auto">
        {/* Left: Working Volumes Title */}
        <div className="flex flex-col">
          <span className="font-serif text-base sm:text-xl font-bold tracking-tight text-white drop-shadow-md">
            Working Volumes
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-white/70">
            SEVEN FIELD GUIDES FOR MAKING
          </span>
        </div>

        {/* Right: Edition Info & Close Button */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-white/80">
              EDITION {currentBook.volume} · 2026
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              {currentBook.paletteLabel}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-xl border border-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-2xl"
            title="Đóng (Quay lại kệ sách)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN FLOATING INSPECTOR */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 items-center my-auto py-2">
        {/* LEFT: Interactive 3D Hardcover Book Viewport Area (5 cols - Transparent to show 3D Carousel Model) */}
        <div className="book-inspector-3d-book lg:col-span-5 h-[320px] sm:h-[400px] lg:h-[480px] flex flex-col items-center justify-end pointer-events-none">
          <div className="book-inspector-3d-hint pointer-events-auto flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/80 text-[10px] font-mono tracking-wider uppercase shadow-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>KÉO TRỰC TIẾP ĐỂ XOAY 3D 360°</span>
          </div>
        </div>

        {/* RIGHT: Floating Glassmorphic Editorial Panel (7 cols) */}
        <div className="book-inspector-right lg:col-span-7 pointer-events-auto p-6 sm:p-8 lg:p-10 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.6)] text-white flex flex-col justify-between gap-6 sm:gap-8">
          {/* 1. Large Title & Editorial Deck */}
          <div className="book-inspector-detail-item">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {currentBook.title}
            </h1>
            <p className="text-sm sm:text-base text-white/90 font-serif leading-relaxed mt-4 drop-shadow">
              {currentBook.deck}
            </p>
          </div>

          {/* 2. Four-Cell Metadata Specification Grid */}
          <div className="book-inspector-detail-item grid grid-cols-2 gap-y-6 gap-x-8 py-6 border-y border-white/15">
            {/* BINDING */}
            <div>
              <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest block">
                BINDING
              </span>
              <p className="text-xs sm:text-sm font-bold text-white mt-1.5 drop-shadow-sm">
                {currentBook.binding}
              </p>
            </div>

            {/* FORMAT */}
            <div>
              <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest block">
                FORMAT
              </span>
              <p className="text-xs sm:text-sm font-bold text-white mt-1.5 drop-shadow-sm">
                {currentBook.format}
              </p>
            </div>

            {/* THEME */}
            <div>
              <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest block">
                THEME
              </span>
              <p className="text-xs sm:text-sm font-bold text-white mt-1.5 drop-shadow-sm">
                {currentBook.theme}
              </p>
            </div>

            {/* MOTIF */}
            <div>
              <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest block">
                MOTIF
              </span>
              <p className="text-xs sm:text-sm font-bold text-white mt-1.5 drop-shadow-sm">
                {currentBook.motif}
              </p>
            </div>
          </div>

          {/* 3. Cycle Navigation Controls & Direct Action Links */}
          <div className="book-inspector-detail-item flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            {/* Chevron Navigation with Closed status */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevBook}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
                title="Cuốn sách trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex flex-col">
                <span className="font-serif font-black text-sm text-white">
                  Closed
                </span>
                <span className="text-[9px] font-mono text-white/60 uppercase tracking-widest">
                  CLICK BOOK TO OPEN
                </span>
              </div>

              <button
                onClick={handleNextBook}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
                title="Cuốn sách tiếp theo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Micro-instructions & Action links */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {onOpenReader && (
                <button
                  onClick={() => onOpenReader(currentBook)}
                  className="font-mono text-xs font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 underline underline-offset-8 decoration-2 decoration-amber-400/50 hover:decoration-amber-300 transition-all cursor-pointer flex items-center gap-1.5 drop-shadow"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>OPEN BOOK</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="font-mono text-xs font-black uppercase tracking-widest text-white/70 hover:text-white underline underline-offset-8 decoration-2 decoration-white/30 hover:decoration-white transition-all cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET VIEW</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SUBTLE FLOATING FOOTER */}
      <div className="w-full text-center pointer-events-none">
        <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 drop-shadow">
          DRAG COVER OR CLICK ONCE TO OPEN · BACKGROUND TO ORBIT
        </span>
      </div>
    </div>
  );
};
