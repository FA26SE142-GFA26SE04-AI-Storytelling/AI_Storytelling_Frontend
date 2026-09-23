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
  onSelectBook?: (bookId: string) => void;
  onReadBook?: (bookId: string) => void;
  is2DViewAvailable?: boolean;
  onToggleViewMode?: () => void;
}

export const LibraryBookshelfZoomOverlay: React.FC<LibraryBookshelfZoomOverlayProps> = ({
  onStageChange,
  timeOfDay,
  onTimeOfDayChange,
  selectedBookId,
  onSelectBook,
  onReadBook,
  is2DViewAvailable = false,
  onToggleViewMode,
}) => {
  const [activeBookId, setActiveBookId] = useState<string | null>(selectedBookId || 'xcode');
  const [isExiting, setIsExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedBookId) {
      setActiveBookId(selectedBookId);
    }
  }, [selectedBookId]);

  // GSAP: Hiệu ứng xuất hiện
  useGSAP(() => {
    animateHeaderDown('.floating-top-control', { duration: 0.5 });
  }, { scope: containerRef });

  const handleBackToRoom = () => {
    if (isExiting) return;
    setIsExiting(true);

    if (containerRef.current) {
      // 1. Animate floating top controls & headline up
      gsap.to('.floating-top-control, .headline-control', {
        opacity: 0,
        y: -40,
        duration: 0.35,
        ease: 'power2.in',
      });

      // 2. Animate side navigation chevrons
      gsap.to('.prev-btn-control', {
        opacity: 0,
        x: -30,
        y: -20,
        scale: 0.8,
        duration: 0.35,
        ease: 'power2.in',
      });

      gsap.to('.next-btn-control', {
        opacity: 0,
        x: 30,
        y: -20,
        scale: 0.8,
        duration: 0.35,
        ease: 'power2.in',
      });

      // 3. Animate entire overlay smoothly upwards and out
      gsap.to(containerRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.42,
        ease: 'power2.in',
      });

      // 4. Trigger stage change after the 3D book upward fly animation has finished
      setTimeout(() => {
        onStageChange(0);
      }, 440);
    } else {
      onStageChange(0);
    }
  };

  const handleReadBook = (bookId: string) => {
    if (isExiting) return;
    setIsExiting(true);

    if (containerRef.current) {
      // 1. Animate floating controls & carousel upwards
      gsap.to('.floating-top-control, .headline-control', {
        opacity: 0,
        y: -40,
        duration: 0.35,
        ease: 'power2.in',
      });

      gsap.to('.prev-btn-control', {
        opacity: 0,
        x: -30,
        y: -20,
        scale: 0.8,
        duration: 0.35,
        ease: 'power2.in',
      });

      gsap.to('.next-btn-control', {
        opacity: 0,
        x: 30,
        y: -20,
        scale: 0.8,
        duration: 0.35,
        ease: 'power2.in',
      });

      gsap.to(containerRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.42,
        ease: 'power2.in',
      });

      // 2. Zoom camera to Desk (Stage 1) and place book on desk
      setTimeout(() => {
        if (onReadBook) {
          onReadBook(bookId);
        } else {
          onStageChange(1);
        }
      }, 440);
    } else {
      if (onReadBook) {
        onReadBook(bookId);
      } else {
        onStageChange(1);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      data-time-of-day={timeOfDay}
      className={`absolute inset-0 pointer-events-none w-full h-full overflow-hidden z-20 font-sans theme-${timeOfDay} transition-colors duration-500`}
    >
      {/* 1. DISCREET FLOATING BACK BUTTON (Top Left) */}
      <button
        onClick={handleBackToRoom}
        disabled={isExiting}
        className="floating-top-control absolute top-4 sm:top-6 left-4 sm:left-6 z-40 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-tod-surface/90 hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text transition-all cursor-pointer flex items-center gap-2 text-xs font-extrabold shadow-2xl backdrop-blur-2xl hover:scale-105 active:scale-95 group pointer-events-auto"
        title="Quay lại góc nhìn toàn cảnh phòng 3D"
      >
        <ArrowLeft className="w-4 h-4 text-amber-500 group-hover:-translate-x-1 transition-transform" />
        <span className="hidden sm:inline">Toàn Cảnh Phòng</span>
      </button>

      {/* 2. DISCREET FLOATING ATMOSPHERE SWITCHER (Top Right) */}
      <div className="floating-top-control absolute top-4 sm:top-6 right-4 sm:right-6 z-40 flex items-center gap-2 pointer-events-auto">
        <TimeOfDaySwitcher
          timeOfDay={timeOfDay}
          onTimeOfDayChange={onTimeOfDayChange}
          showLabels={false}
        />

        {is2DViewAvailable && onToggleViewMode && (
          <button
            onClick={onToggleViewMode}
            disabled={isExiting}
            className="py-2 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            title="Chuyển sang danh mục 2D"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Danh Mục</span>
          </button>
        )}
      </div>

      {/* 3. FULL-SCREEN 3D BOOKSHELF CAROUSEL */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto">
        <BookshelfSelectorFrame
          selectedBookId={activeBookId}
          isExiting={isExiting}
          onSelectBook={(bookId) => {
            setActiveBookId(bookId);
            onSelectBook?.(bookId);
          }}
          onOpenBook={handleReadBook}
        />
      </div>
    </div>
  );
};
