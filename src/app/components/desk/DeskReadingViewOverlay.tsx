'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, Layers, Sparkles, X } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { TimeOfDay } from '../three/RoomCanvas';
import { TimeOfDaySwitcher } from '../common/TimeOfDaySwitcher';
import { WORKING_VOLUMES_BOOKS } from '../three/room/textures/workingVolumesBooks';

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
  // 'closed' = đang nhìn toàn cảnh bàn học (sách đóng)
  // 'opening' = 3D đang lật mở bìa sách và camera đang lướt zoom vào gần
  // 'reading' = đã zoom vào gần xong, hiển thị giao diện lật sách và chế độ tập trung
  const [readingStage, setReadingStage] = useState<'closed' | 'opening' | 'reading'>('closed');

  const activeBook =
    (selectedBookId && WORKING_VOLUMES_BOOKS.find((b) => b.id === selectedBookId)) ||
    WORKING_VOLUMES_BOOKS[2];

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

  const handleOpenBook = () => {
    window.dispatchEvent(new CustomEvent('room:trigger-open-desk-book'));
  };

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

        {readingStage === 'reading' && (
          <button
            onClick={handleCloseBook}
            className="desk-reading-control p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-tod-surface/90 hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-amber-500 transition-all cursor-pointer flex items-center gap-2 text-xs font-extrabold shadow-2xl backdrop-blur-2xl hover:scale-105 active:scale-95 group"
            title="Đóng sách để xem góc bàn học 3D"
          >
            <X className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline">Đóng Sách</span>
          </button>
        )}
      </div>

      {/* 2. TOP-CENTER MINIMAL BOOK PILL */}
      <div className="desk-reading-control absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto hidden md:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-tod-surface/90 backdrop-blur-2xl border border-tod-border text-tod-text shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="font-extrabold text-xs sm:text-sm text-tod-text">
          {activeBook.title}
        </span>
        <span className="text-[10px] font-bold text-tod-text-muted px-2 py-0.5 rounded-full bg-tod-card border border-tod-border">
          Tập {activeBook.volume} · {activeBook.discipline}
        </span>
      </div>

      {/* 3. TOP-RIGHT ATMOSPHERE SWITCHER */}
      <div className="desk-reading-control absolute top-3 sm:top-5 right-3 sm:right-6 z-50 flex items-center gap-2 pointer-events-auto">
        <TimeOfDaySwitcher
          timeOfDay={timeOfDay}
          onTimeOfDayChange={onTimeOfDayChange}
          showLabels={false}
        />
      </div>

      {/* 4. TRẠNG THÁI CLOSED: NÚT KÊU GỌI LẬT MỞ SÁCH TRÊN BÀN */}
      {readingStage === 'closed' && (
        <div className="desk-reading-control absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
          <button
            onClick={handleOpenBook}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-extrabold text-sm sm:text-base shadow-[0_12px_35px_rgba(245,158,11,0.55)] border border-amber-300/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer group hover:shadow-[0_16px_40px_rgba(245,158,11,0.7)]"
          >
            <BookOpen className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            <span>Lật Mở Sách Để Đọc</span>
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
          </button>
          <span className="text-xs font-bold text-tod-text-muted px-3.5 py-1 rounded-full bg-tod-surface/90 backdrop-blur-md border border-tod-border shadow-md">
            Nhấp vào nút hoặc nhấp thẳng vào quyển sách trên bàn để mở
          </span>
        </div>
      )}

      {/* 5. TRẠNG THÁI READING: ĐÃ MỞ SÁCH & ZOOM XONG -> HIỂN THỊ KHUNG ĐỌC SÁCH 3D VÀ CHẾ ĐỘ TẬP TRUNG */}
      {readingStage === 'reading' && (
        <div className="desk-reading-control absolute inset-0 w-full h-full pointer-events-auto flex items-center justify-center pt-14 sm:pt-16 pb-2 px-2 sm:px-6 z-30 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
          <DeskPageTurningBook
            book={activeBook}
            onClose={handleCloseBook}
          />
        </div>
      )}
    </div>
  );
};
