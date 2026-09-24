'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, BookOpen, Layers, X, Info, BookX, Wand2 } from 'lucide-react';
import {
  WorkingVolumeBook,
  mapStoryDtoToWorkingVolumeBook,
  EMPTY_BLANK_BOOK,
} from '../three/room/textures/workingVolumesBooks';
import { ThreeDShowcaseCarousel } from './ThreeDShowcaseCarousel';
import { BookDetailSidePopup } from './BookDetailSidePopup';
import { storyService } from '../../services/storyService';
import { StoryDto } from '../../types/story';

export interface BookshelfSelectorFrameProps {
  selectedBookId: string | null;
  isExiting?: boolean;
  onSelectBook: (bookId: string) => void;
  onOpenBook?: (bookId: string) => void;
}

export const BookshelfSelectorFrame: React.FC<BookshelfSelectorFrameProps> = ({
  selectedBookId,
  isExiting = false,
  onSelectBook,
  onOpenBook,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [backendStories, setBackendStories] = useState<StoryDto[]>([]);
  const [isLoadingApiStories, setIsLoadingApiStories] = useState<boolean>(true);

  // Fetch published stories exclusively from Backend API
  useEffect(() => {
    let isMounted = true;
    const loadPublishedStories = async () => {
      setIsLoadingApiStories(true);
      try {
        const res = await storyService.getStories({ pageSize: 20, sortBy: 'CreatedAt', sortDescending: true });
        if (isMounted && res.success && res.data?.items && res.data.items.length > 0) {
          setBackendStories(res.data.items);
        } else {
          setBackendStories([]);
        }
      } catch (err) {
        console.error('Failed to load published stories from API:', err);
        if (isMounted) setBackendStories([]);
      } finally {
        if (isMounted) setIsLoadingApiStories(false);
      }
    };
    loadPublishedStories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Chỉ lấy truyện từ Backend API. Nếu API không có truyện hoặc rỗng -> hiện 1 quyển sách trống không tiêu đề
  const allBooks: WorkingVolumeBook[] = useMemo(() => {
    if (backendStories.length > 0) {
      return backendStories.map((s, idx) => mapStoryDtoToWorkingVolumeBook(s, idx));
    }
    return [EMPTY_BLANK_BOOK];
  }, [backendStories]);

  const initialIndex = Math.max(
    0,
    allBooks.findIndex((b) => b.id === selectedBookId)
  );

  const [activeIndex, setActiveIndex] = useState<number>(
    initialIndex >= 0 ? initialIndex : 0
  );

  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Sync active index nếu selectedBookId thay đổi từ ngoài
  useEffect(() => {
    if (selectedBookId) {
      const idx = allBooks.findIndex((b) => b.id === selectedBookId);
      if (idx >= 0 && idx !== activeIndex) {
        setActiveIndex(idx);
      }
    }
  }, [selectedBookId, allBooks, activeIndex]);

  const activeBook = allBooks[activeIndex] || allBooks[0] || EMPTY_BLANK_BOOK;

  const handlePrev = useCallback(() => {
    if (allBooks.length <= 1) return;
    const prevIdx = (activeIndex - 1 + allBooks.length) % allBooks.length;
    setActiveIndex(prevIdx);
    onSelectBook(allBooks[prevIdx].id);
  }, [activeIndex, allBooks, onSelectBook]);

  const handleNext = useCallback(() => {
    if (allBooks.length <= 1) return;
    const nextIdx = (activeIndex + 1) % allBooks.length;
    setActiveIndex(nextIdx);
    onSelectBook(allBooks[nextIdx].id);
  }, [activeIndex, allBooks, onSelectBook]);

  const toggleDetail = useCallback(() => {
    setIsDetailOpen((prev) => !prev);
  }, []);

  // Điều khiển phím mũi tên & Enter / Space / ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Enter' || e.key === ' ') {
        toggleDetail();
      } else if (e.key === 'Escape') {
        setIsDetailOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, toggleDetail]);

  const handleSelectIndex = (idx: number) => {
    setActiveIndex(idx);
    onSelectBook(allBooks[idx].id);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none font-sans"
    >
      {/* 1. Active Book Headline & Quick Action Pill */}
      <div className="headline-control absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 rounded-2xl bg-tod-surface/90 backdrop-blur-2xl border border-tod-border text-tod-text shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-500 font-sans">
        <div className="flex items-center gap-2">
          {activeBook.isEmptyPlaceholder ? (
            <BookX className="w-4 h-4 text-amber-500" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
          )}
          <span className="font-extrabold text-sm sm:text-base text-tod-text tracking-wide">
            {activeBook.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tod-card border border-tod-border text-[11px] font-bold text-tod-text-muted">
          <Layers className="w-3 h-3 text-amber-500" />
          <span>{activeBook.isEmptyPlaceholder ? 'Thư viện trống' : `Tập ${activeBook.volume} · ${activeBook.discipline}`}</span>
        </div>

        <button
          onClick={toggleDetail}
          className={`ml-1 sm:ml-2 px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            isDetailOpen
              ? 'bg-tod-card hover:bg-tod-surface border border-tod-border text-tod-text'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white shadow-amber-500/20'
          }`}
          title={isDetailOpen ? 'Đóng chi tiết' : 'Xem thông tin chi tiết ấn bản'}
        >
          {isDetailOpen ? (
            <>
              <X className="w-3.5 h-3.5 text-amber-500" />
              <span>Đóng Chi Tiết</span>
            </>
          ) : (
            <>
              <Info className="w-3.5 h-3.5" />
              <span>Chi Tiết Ấn Bản</span>
            </>
          )}
        </button>

        {onOpenBook && !activeBook.isEmptyPlaceholder && (
          <button
            onClick={() => onOpenBook(activeBook.id)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Đọc Truyện</span>
          </button>
        )}
      </div>

      {/* 2. Nút lùi / tiến sách (Chỉ hiện khi có từ 2 quyển trở lên) */}
      {allBooks.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="prev-btn-control absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-40 pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-tod-surface/85 hover:bg-tod-card border border-tod-border text-tod-text flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-2xl backdrop-blur-xl"
            title="Xem cuốn trước (←)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          <button
            onClick={handleNext}
            className="next-btn-control absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-40 pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-tod-surface/85 hover:bg-tod-card border border-tod-border text-tod-text flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-2xl backdrop-blur-xl"
            title="Xem cuốn tiếp theo (→)"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </>
      )}

      {/* 3. Full-Screen 3D WebGL Carousel Canvas */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto">
        <ThreeDShowcaseCarousel
          books={allBooks}
          activeIndex={activeIndex}
          isDetailOpen={isDetailOpen}
          isExiting={isExiting}
          onSelectIndex={handleSelectIndex}
          onToggleDetail={toggleDetail}
        />
      </div>

      {/* 4. Rich Glassmorphic Side Detail Popup Next to 3D Book */}
      <BookDetailSidePopup
        book={activeBook}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onReadBook={onOpenBook}
      />
    </div>
  );
};
