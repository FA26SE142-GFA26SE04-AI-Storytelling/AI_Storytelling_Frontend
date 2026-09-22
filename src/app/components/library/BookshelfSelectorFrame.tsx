'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import {
  WORKING_VOLUMES_BOOKS,
} from '../three/room/textures/workingVolumesBooks';
import { ThreeDShowcaseCarousel } from './ThreeDShowcaseCarousel';

export interface BookshelfSelectorFrameProps {
  selectedBookId: string | null;
  isInspectorOpen?: boolean;
  onSelectBook: (bookId: string) => void;
  onOpenInspector: (bookId: string) => void;
}

export const BookshelfSelectorFrame: React.FC<BookshelfSelectorFrameProps> = ({
  selectedBookId,
  isInspectorOpen = false,
  onSelectBook,
  onOpenInspector,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const initialIndex = Math.max(
    0,
    WORKING_VOLUMES_BOOKS.findIndex((b) => b.id === selectedBookId)
  );

  const [activeIndex, setActiveIndex] = useState<number>(
    initialIndex >= 0 ? initialIndex : 2 // Default Xcode
  );

  // Sync active index if selectedBookId changes externally
  useEffect(() => {
    if (selectedBookId) {
      const idx = WORKING_VOLUMES_BOOKS.findIndex((b) => b.id === selectedBookId);
      if (idx >= 0 && idx !== activeIndex) {
        setActiveIndex(idx);
      }
    }
  }, [selectedBookId]);

  const activeBook = WORKING_VOLUMES_BOOKS[activeIndex] || WORKING_VOLUMES_BOOKS[2];

  const handlePrev = useCallback(() => {
    const prevIdx = (activeIndex - 1 + WORKING_VOLUMES_BOOKS.length) % WORKING_VOLUMES_BOOKS.length;
    setActiveIndex(prevIdx);
    onSelectBook(WORKING_VOLUMES_BOOKS[prevIdx].id);
  }, [activeIndex, onSelectBook]);

  const handleNext = useCallback(() => {
    const nextIdx = (activeIndex + 1) % WORKING_VOLUMES_BOOKS.length;
    setActiveIndex(nextIdx);
    onSelectBook(WORKING_VOLUMES_BOOKS[nextIdx].id);
  }, [activeIndex, onSelectBook]);

  // Keyboard navigation
  useEffect(() => {
    if (isInspectorOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Enter') {
        onOpenInspector(activeBook.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onOpenInspector, activeBook.id, isInspectorOpen]);

  const handleSelectIndex = (idx: number) => {
    setActiveIndex(idx);
    onSelectBook(WORKING_VOLUMES_BOOKS[idx].id);
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-7xl mx-auto pointer-events-auto flex flex-col items-center justify-center select-none overflow-hidden py-2"
    >
      {/* 1. Active Book Headline & Quick Action Pill */}
      <div
        className={`flex items-center gap-3 mb-2 sm:mb-4 px-5 py-2 rounded-full bg-black/75 backdrop-blur-xl border border-white/20 text-white shadow-2xl transition-all duration-500 ${
          isInspectorOpen
            ? 'opacity-0 -translate-y-6 pointer-events-none'
            : 'opacity-100 translate-y-0 pointer-events-auto'
        }`}
      >
        <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span className="font-serif font-black text-sm sm:text-base text-white tracking-wide">
          {activeBook.title}
        </span>
        <span className="text-xs font-mono tracking-widest text-amber-400 font-bold uppercase">
          Vol. {activeBook.volume} · {activeBook.discipline}
        </span>
        <button
          onClick={() => onOpenInspector(activeBook.id)}
          className="ml-3 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Xem Ấn Bản</span>
        </button>
      </div>

      {/* 2. Centered 3D WebGL Carousel with Left/Right Buttons */}
      <div className="relative w-full flex items-center justify-center px-4 sm:px-12">
        {/* Left Arrow Button */}
        <button
          onClick={handlePrev}
          className={`absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/70 hover:bg-black/90 border border-white/30 text-white/90 hover:text-white flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 cursor-pointer shadow-2xl backdrop-blur-md ${
            isInspectorOpen
              ? 'opacity-0 pointer-events-none scale-75'
              : 'opacity-100 pointer-events-auto scale-100'
          }`}
          title="Xem cuốn trước (←)"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={handleNext}
          className={`absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/70 hover:bg-black/90 border border-white/30 text-white/90 hover:text-white flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 cursor-pointer shadow-2xl backdrop-blur-md ${
            isInspectorOpen
              ? 'opacity-0 pointer-events-none scale-75'
              : 'opacity-100 pointer-events-auto scale-100'
          }`}
          title="Xem cuốn tiếp theo (→)"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* 3D WebGL Carousel Canvas */}
        <div className="w-full flex justify-center">
          <ThreeDShowcaseCarousel
            activeIndex={activeIndex}
            isInspectorOpen={isInspectorOpen}
            onSelectIndex={handleSelectIndex}
            onOpenInspector={onOpenInspector}
          />
        </div>
      </div>

      {/* 3. Subtitle Active Book Summary */}
      <div
        className={`text-center mt-1 sm:mt-2 transition-all duration-500 ${
          isInspectorOpen
            ? 'opacity-0 translate-y-4 pointer-events-none'
            : 'opacity-100 translate-y-0 pointer-events-auto'
        }`}
      >
        <span className="font-serif text-xs sm:text-sm font-black text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          {activeBook.title}
        </span>
        <span className="text-[10px] sm:text-xs font-mono text-white/60 ml-2">
          {activeBook.note}
        </span>
      </div>
    </div>
  );
};

