'use client';

import React, { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Grid,
} from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';
import { TimeOfDaySwitcher } from '../common/TimeOfDaySwitcher';
import { BookshelfSelectorFrame } from './BookshelfSelectorFrame';
import { animateHeaderDown, animateFooterUp } from '../../utils/gsapAnimations';

gsap.registerPlugin(useGSAP);

export interface LibraryBookshelfZoomOverlayProps {
  currentStage: number;
  onStageChange: (stageIndex: number) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay, e?: React.MouseEvent) => void;
  selectedBookId?: string | null;
  onClearSelectedBook?: () => void;
  is2DViewAvailable?: boolean;
  onToggleViewMode?: () => void;
}

export const LibraryBookshelfZoomOverlay: React.FC<LibraryBookshelfZoomOverlayProps> = ({
  onStageChange,
  timeOfDay,
  onTimeOfDayChange,
  selectedBookId,
  is2DViewAvailable = false,
  onToggleViewMode,
}) => {
  const [activeBookId, setActiveBookId] = useState<string | null>(selectedBookId || 'xcode');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedBookId) {
      setActiveBookId(selectedBookId);
    }
  }, [selectedBookId]);

  // GSAP: Hiệu ứng xuất hiện Header
  useGSAP(() => {
    animateHeaderDown('.bookshelf-top-bar', { duration: 0.5 });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      data-time-of-day={timeOfDay}
      className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 overflow-hidden z-20 font-sans theme-${timeOfDay} transition-colors duration-500`}
    >
      {/* 1. TOP FLOATING HEADER BAR */}
      <div className="bookshelf-top-bar pointer-events-auto w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:px-5 sm:py-3.5 rounded-3xl bg-tod-surface/95 backdrop-blur-2xl border border-tod-border shadow-[0_10px_35px_rgba(0,0,0,0.25)] text-tod-text transition-colors duration-500">
        {/* Brand & Stage Navigation */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <button
            onClick={() => onStageChange(0)}
            className="p-2 rounded-2xl bg-tod-card hover:bg-tod-surface border border-tod-border text-tod-text-muted hover:text-tod-text transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0 hover:scale-105 active:scale-95 shadow-sm group"
            title="Quay lại góc nhìn toàn cảnh phòng 3D"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden xs:inline">Toàn Cảnh</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <BookOpen className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base tracking-tight text-tod-text flex items-center gap-2">
                <span>Kệ Sách Thần Kỳ Nobita</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-extrabold text-amber-600 dark:text-amber-300 uppercase tracking-wider hidden sm:inline-block">
                  Góc Nhìn 3D Kệ Sách
                </span>
              </h1>
              <p className="text-[10px] text-tod-text-muted font-medium">
                Thư viện truyện 3D tương tác & tuyển tập ấn bản độc quyền MagicTales
              </p>
            </div>
          </div>
        </div>

        {/* Atmosphere TimeOfDay & Quick View Mode Switchers */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <TimeOfDaySwitcher
            timeOfDay={timeOfDay}
            onTimeOfDayChange={onTimeOfDayChange}
            showLabels={true}
          />

          {is2DViewAvailable && onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              title="Chuyển sang danh mục 2D"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Danh Mục</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN 3D CENTERED BOOK CAROUSEL */}
      <div className="flex-1 w-full h-full flex items-center justify-center px-2 sm:px-6 my-auto z-30 pointer-events-auto">
        <BookshelfSelectorFrame
          selectedBookId={activeBookId}
          onSelectBook={(bookId) => setActiveBookId(bookId)}
        />
      </div>
    </div>
  );
};
