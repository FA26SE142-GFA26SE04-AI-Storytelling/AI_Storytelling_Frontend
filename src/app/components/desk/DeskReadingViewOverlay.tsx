'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, Layers, Sparkles, X } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { TimeOfDay } from '../three/RoomCanvas';
import { TimeOfDaySwitcher } from '../common/TimeOfDaySwitcher';
import {
  WORKING_VOLUMES_BOOKS,
  WorkingVolumeBook,
  EMPTY_BLANK_BOOK,
  mapStoryDtoToWorkingVolumeBook,
} from '../three/room/textures/workingVolumesBooks';
import { storyService } from '../../services/storyService';
import { DeskPageTurningBook } from './DeskPageTurningBook';

export interface DeskReadingViewOverlayProps {
  currentStage: number;
  onStageChange: (stageIndex: number) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay, e?: React.MouseEvent) => void;
  selectedBookId?: string | null;
}

export const DeskReadingViewOverlay: React.FC<DeskReadingViewOverlayProps> = ({
  onStageChange,
  timeOfDay,
  onTimeOfDayChange,
  selectedBookId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [readingStage, setReadingStage] = useState<'closed' | 'opening' | 'reading'>('closed');
  const [apiBook, setApiBook] = useState<WorkingVolumeBook | null>(null);

  // If selectedBookId refers to a backend story (e.g. "story-123"), fetch from API
  useEffect(() => {
    if (selectedBookId && selectedBookId.startsWith('story-')) {
      const storyId = parseInt(selectedBookId.replace('story-', ''), 10);
      if (!isNaN(storyId)) {
        storyService.getStoryById(storyId).then((res) => {
          if (res.success && res.data) {
            setApiBook(mapStoryDtoToWorkingVolumeBook(res.data, 0));
          }
        }).catch((e) => {
          console.error('Failed to load story details for reading:', e);
        });
      }
    } else {
      setApiBook(null);
    }
  }, [selectedBookId]);

  const activeBook: WorkingVolumeBook =
    apiBook ||
    (selectedBookId && !selectedBookId.startsWith('story-') && WORKING_VOLUMES_BOOKS.find((b) => b.id === selectedBookId)) ||
    EMPTY_BLANK_BOOK;

  useEffect(() => {
    const handleOpening = () => setReadingStage('opening');
    const handleOpened = () => setReadingStage('reading');
    const handleClosed = () => setReadingStage('closed');

    window.addEventListener('room:opening-desk-book', handleOpening);
    window.addEventListener('room:desk-book-opened', handleOpened);
    window.addEventListener('room:desk-book-closed', handleClosed);

    return () => {
      window.removeEventListener('room:opening-desk-book', handleOpening);
      window.removeEventListener('room:desk-book-opened', handleOpened);
      window.removeEventListener('room:desk-book-closed', handleClosed);
    };
  }, []);

  const handleCloseBook = () => {
    setReadingStage('closed');
    window.dispatchEvent(new CustomEvent('room:close-desk-book'));
  };

  useGSAP(
    () => {
      gsap.fromTo(
        '.desk-reading-control',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      data-time-of-day={timeOfDay}
      className={`absolute inset-0 pointer-events-none w-full h-full overflow-hidden z-20 font-sans theme-${timeOfDay} transition-colors duration-500`}
    >
      {/* 1. TOP-LEFT NAVIGATION BUTTONS */}
      {readingStage === 'closed' && (
        <div className="absolute top-3 sm:top-5 left-3 sm:left-6 z-50 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              handleCloseBook();
              onStageChange(0);
            }}
            className="desk-reading-control p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-tod-surface/90 hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text transition-all cursor-pointer flex items-center gap-2 text-xs font-extrabold shadow-2xl backdrop-blur-2xl hover:scale-105 active:scale-95 group"
            title="Quay lại góc nhìn toàn cảnh phòng 3D"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Toàn Cảnh Phòng</span>
          </button>

          <button
            onClick={() => {
              handleCloseBook();
              onStageChange(2);
            }}
            className="desk-reading-control p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-tod-surface/90 hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text transition-all cursor-pointer flex items-center gap-2 text-xs font-extrabold shadow-2xl backdrop-blur-2xl hover:scale-105 active:scale-95 group"
            title="Quay lại Kệ Sách"
          >
            <BookOpen className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Kệ Sách</span>
          </button>
        </div>
      )}

      {/* 2. TOP-CENTER MINIMAL BOOK PILL */}
      {readingStage === 'closed' && (
        <div className="desk-reading-control absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto hidden md:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-tod-surface/90 backdrop-blur-2xl border border-tod-border text-tod-text shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="font-extrabold text-xs sm:text-sm text-tod-text">
            {activeBook.title}
          </span>
          <span className="text-[10px] font-bold text-tod-text-muted px-2 py-0.5 rounded-full bg-tod-card border border-tod-border">
            Tập {activeBook.volume} · {activeBook.discipline}
          </span>
        </div>
      )}

      {/* 3. TOP-RIGHT ATMOSPHERE SWITCHER */}
      {readingStage === 'closed' && (
        <div className="desk-reading-control absolute top-3 sm:top-5 right-3 sm:right-6 z-50 flex items-center gap-2 pointer-events-auto">
          <TimeOfDaySwitcher
            timeOfDay={timeOfDay}
            onTimeOfDayChange={onTimeOfDayChange}
            showLabels={false}
          />
        </div>
      )}

      {/* 4. TRẠNG THÁI READING: TOÀN MÀN HÌNH KHÔNG GIAN ĐỌC SÁCH 3D */}
      {readingStage === 'reading' && (
        <div className="desk-reading-control absolute inset-0 w-full h-full pointer-events-auto flex items-center justify-center p-0 z-30 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
          <DeskPageTurningBook
            book={activeBook}
            onClose={handleCloseBook}
          />
        </div>
      )}
    </div>
  );
};
