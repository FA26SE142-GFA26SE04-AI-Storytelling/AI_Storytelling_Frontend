'use client';

import React, { useRef } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Layers,
  Palette,
  Bookmark,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { WorkingVolumeBook } from '../three/room/textures/workingVolumesBooks';

export interface BookDetailSidePopupProps {
  book: WorkingVolumeBook;
  isOpen: boolean;
  onClose: () => void;
  onReadBook?: (bookId: string) => void;
}

export const BookDetailSidePopup: React.FC<BookDetailSidePopupProps> = ({
  book,
  isOpen,
  onClose,
  onReadBook,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (isOpen && popupRef.current) {
      gsap.fromTo(
        popupRef.current,
        { opacity: 0, x: 60, yPercent: -50, scale: 0.96 },
        { opacity: 1, x: 0, yPercent: -50, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [isOpen, book.id]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="pointer-events-auto fixed left-4 right-4 sm:left-1/2 sm:right-auto sm:ml-5 md:ml-8 lg:ml-10 top-1/2 w-auto sm:w-[380px] lg:w-[410px] max-h-[82vh] overflow-y-auto rounded-3xl bg-tod-surface/95 backdrop-blur-2xl border border-tod-border shadow-[0_20px_60px_rgba(0,0,0,0.4)] text-tod-text p-5 sm:p-6 z-50 font-sans transition-all duration-300 custom-scrollbar"
      style={{
        boxShadow: `0 25px 60px -15px ${book.color}33, 0 0 0 1px ${book.color}40`,
      }}
    >
      {/* 1. Header Bar: Volume Tag & Close Button */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm"
            style={{
              backgroundColor: `${book.color}22`,
              color: book.color,
              borderColor: `${book.color}44`,
              borderWidth: 1,
            }}
          >
            <Layers className="w-3.5 h-3.5" />
            Tập {book.volume} · {book.roman}
          </span>
          <span className="text-[11px] font-bold text-tod-text-muted px-2 py-0.5 rounded-md bg-tod-card">
            {book.discipline}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-2xl bg-tod-card hover:bg-tod-surface border border-tod-border text-tod-text-muted hover:text-tod-text transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
          title="Đóng chi tiết"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Main Title & Theme */}
      <div className="mb-3">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-tod-text flex items-center gap-2">
          <span>{book.title}</span>
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
        </h2>
        <p className="text-xs font-semibold text-tod-text-muted mt-0.5 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-500" />
          <span>{book.theme}</span>
        </p>
      </div>

      {/* 3. Story Synopsis / Deck */}
      <div className="mb-3.5 p-3.5 rounded-2xl bg-tod-card/80 border border-tod-border text-xs sm:text-sm leading-relaxed text-tod-text font-medium shadow-inner">
        {book.deck}
      </div>

      {/* 4. Quote Card */}
      <div
        className="mb-3.5 p-3 rounded-2xl border-l-4 relative overflow-hidden"
        style={{
          borderLeftColor: book.color,
          backgroundColor: `${book.color}0d`,
        }}
      >
        <p className="text-xs italic font-semibold text-tod-text">
          "{book.note}"
        </p>
      </div>

      {/* 5. Book Specifications Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="p-2.5 rounded-xl bg-tod-card border border-tod-border">
          <span className="text-[10px] font-bold uppercase text-tod-text-muted flex items-center gap-1 mb-0.5">
            <Bookmark className="w-3 h-3 text-amber-500" />
            Chất liệu bìa
          </span>
          <p className="font-extrabold text-tod-text truncate text-xs">{book.binding}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-tod-card border border-tod-border">
          <span className="text-[10px] font-bold uppercase text-tod-text-muted flex items-center gap-1 mb-0.5">
            <Palette className="w-3 h-3 text-amber-500" />
            Bảng màu ấn bản
          </span>
          <p className="font-extrabold text-tod-text truncate text-xs">{book.paletteLabel}</p>
        </div>
      </div>

      {/* 6. Action Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onReadBook && onReadBook(book.id)}
          className="flex-1 py-2.5 px-4 rounded-2xl font-black text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
          style={{
            background: `linear-gradient(135deg, ${book.color}, #f59e0b)`,
            boxShadow: `0 10px 25px -5px ${book.color}66`,
          }}
        >
          <BookOpen className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span>Đọc Truyện Ngay</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onClose}
          className="py-2.5 px-4 rounded-2xl bg-tod-card hover:bg-tod-surface border border-tod-border font-bold text-xs text-tod-text transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
