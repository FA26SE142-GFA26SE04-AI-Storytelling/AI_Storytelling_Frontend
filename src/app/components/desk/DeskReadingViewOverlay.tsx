'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, Sparkles, MessageCircle, CheckCircle2 } from 'lucide-react';
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
import { flow4Service } from '../../services/flow4Service';
import { AssignmentStatus, Flow4NotificationType } from '../../types/flow4Types';
import { DeskPageTurningBook } from './DeskPageTurningBook';
import { PostReadingDiscussionSheet } from './PostReadingDiscussionSheet';

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

  // Flow 4: Telemetry (4.3) & Post-Reading Discussion (4.3b)
  const [readingSeconds, setReadingSeconds] = useState<number>(0);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState<boolean>(false);
  const [completionBanner, setCompletionBanner] = useState<string | null>(null);

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
    const handleOpened = () => {
      setReadingStage('reading');
      setReadingSeconds(0);
    };
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

  // Step 4.3: Background Telemetry timer while reading
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (readingStage === 'reading') {
      timer = setInterval(() => {
        setReadingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [readingStage]);

  const handleCloseBook = () => {
    setReadingStage('closed');
    window.dispatchEvent(new CustomEvent('room:close-desk-book'));
  };

  const handleCompleteSession = (comprehensionScore: number, reflections: string) => {
    // 1. Cập nhật bài tập nếu câu chuyện này là bài được giao
    const assignments = flow4Service.getAssignments();
    const matchedAssignment = assignments.find(
      (a) => a.storyTitle === activeBook.title || a.storyId.toString() === activeBook.id
    );

    if (matchedAssignment) {
      const recipient = matchedAssignment.recipients.find((r) => r.childProfileId === 1 || r.status !== AssignmentStatus.Completed);
      if (recipient) {
        recipient.status = AssignmentStatus.Completed;
        recipient.completedAt = new Date().toISOString();
        if (matchedAssignment.recipients.every((r) => r.status === AssignmentStatus.Completed || r.status === AssignmentStatus.Cancelled)) {
          matchedAssignment.status = AssignmentStatus.Completed;
        }
        localStorage.setItem('flow4_assignments_store', JSON.stringify(assignments));
      }
    }

    // 2. Telemetry Notification (Step 4.3)
    flow4Service.addNotification({
      type: Flow4NotificationType.TeacherInteractionScore,
      title: 'Bé đã hoàn thành bài đọc truyện!',
      message: `Bé đã đọc xong "${activeBook.title}" trong ${Math.max(1, Math.round(readingSeconds / 60))} phút. Điểm đọc hiểu: ${comprehensionScore}%. Cảm nghĩ: "${reflections || 'Bé rất thích câu chuyện'}"`,
    });

    setCompletionBanner(`Bé đã hoàn thành xuất sắc tác phẩm "${activeBook.title}"! Nhận 1 Sao Thần Kỳ ⭐`);
    setTimeout(() => setCompletionBanner(null), 4000);
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
        <div className="desk-reading-control absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-tod-surface/90 backdrop-blur-2xl border border-tod-border text-tod-text shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-extrabold text-xs sm:text-sm text-tod-text truncate max-w-[180px] sm:max-w-[300px]">
              {selectedBookId ? activeBook.title : 'Bàn Học Đọc Sách'}
            </span>
            <span className="text-[10px] font-bold text-tod-text-muted px-2 py-0.5 rounded-full bg-tod-card border border-tod-border whitespace-nowrap hidden sm:inline">
              {selectedBookId ? `Tập ${activeBook.volume} · ${activeBook.discipline}` : 'Không Gian Đọc Truyện · Nobita'}
            </span>
          </div>
          {selectedBookId && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('room:trigger-open-desk-book'))}
              className="ml-1 sm:ml-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Mở sách trên bàn học để đọc"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Mở Sách Đọc</span>
            </button>
          )}
        </div>
      )}

      {/* 3. TOP-RIGHT ATMOSPHERE SWITCHER & DISCUSSION BUTTON */}
      {readingStage === 'closed' && (
        <div className="desk-reading-control absolute top-3 sm:top-5 right-3 sm:right-6 z-50 flex items-center gap-2 pointer-events-auto">
          {selectedBookId && (
            <button
              onClick={() => setIsDiscussionOpen(true)}
              className="py-2 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Mở bảng thảo luận & bài học đạo đức"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thảo Luận (4.3b)</span>
            </button>
          )}

          <TimeOfDaySwitcher
            timeOfDay={timeOfDay}
            onTimeOfDayChange={onTimeOfDayChange}
            showLabels={false}
          />
        </div>
      )}

      {/* BANNER NOTIFICATION KHI HOÀN TẤT BÀI ĐỌC */}
      {completionBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto p-3.5 px-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-xl text-emerald-300 font-extrabold text-xs shadow-2xl flex items-center gap-2.5 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{completionBanner}</span>
        </div>
      )}

      {/* 4. TRẠNG THÁI READING: TOÀN MÀN HÌNH KHÔNG GIAN ĐỌC SÁCH 3D */}
      {readingStage === 'reading' && (
        <div className="desk-reading-control absolute inset-0 w-full h-full pointer-events-auto flex items-center justify-center p-0 z-30 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
          <DeskPageTurningBook
            book={activeBook}
            onClose={handleCloseBook}
          />

          {/* Quick Floating Post-Reading Discussion Trigger */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 pointer-events-auto">
            <button
              onClick={() => setIsDiscussionOpen(true)}
              className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-2xl shadow-amber-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95 border border-amber-300/40"
            >
              <Sparkles className="w-4 h-4" />
              <span>Thảo Luận & Nhận Sao (4.3b)</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. POST-READING DISCUSSION SHEET (STEP 4.3b) */}
      <PostReadingDiscussionSheet
        isOpen={isDiscussionOpen}
        onClose={() => setIsDiscussionOpen(false)}
        bookTitle={activeBook.title}
        moralLesson={activeBook.moralLesson || activeBook.note}
        readingDurationSeconds={readingSeconds}
        onCompleteSession={handleCompleteSession}
      />
    </div>
  );
};
