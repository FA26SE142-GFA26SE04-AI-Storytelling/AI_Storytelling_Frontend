'use client';

import React, { useState, useRef } from 'react';
import { X, BookOpen, ChevronLeft, ChevronRight, Volume2, Sparkles, Star } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { animateModalPop } from '../../utils/gsapAnimations';
import { ExtendedStoryItem } from './StoryListDrawer';

export interface StoryReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: ExtendedStoryItem | null;
}

export const StoryReaderModal: React.FC<StoryReaderModalProps> = ({
  isOpen,
  onClose,
  story,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4;
  const modalRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (isOpen) {
      animateModalPop('.story-reader-card');
    }
  }, { scope: modalRef, dependencies: [isOpen] });

  if (!isOpen || !story) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl pointer-events-auto"
    >
      <div className="story-reader-card relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#171a24] border border-amber-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-[#f4eee6] overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:px-5 sm:py-3.5 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-xs sm:text-sm text-white">{story.title}</h2>
              <p className="text-[9px] text-amber-300/80 font-medium">Trang {currentPage} / {totalPages}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Book Reading Area (2-column layout on desktop) */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
          {/* Left Page: Illustration Image */}
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40">
            <img
              src={story.imageUrl}
              alt={story.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[9px] font-bold text-amber-300">
              {story.badge}
            </div>
          </div>

          {/* Right Page: Text & Story Narration */}
          <div className="flex flex-col justify-between h-full bg-white/[0.03] p-4 sm:p-5 rounded-2xl border border-white/5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Chương {currentPage}: Khởi đầu chuyến phiêu lưu
                </span>
              </div>
              <p className="font-serif text-sm sm:text-base leading-relaxed text-[#f4eee6]/90">
                {story.description} Ngày xửa ngày xưa, tại một vùng đất thần tiên nơi những vì sao luôn chiếu sáng rực rỡ, các bạn nhỏ bắt đầu chuyến hành trình kỳ diệu cùng những người bạn động vật đáng yêu.
              </p>
            </div>

            {/* Narration Karaoke Highlight Prompt */}
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-300 text-xs">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="text-[10px] font-medium leading-tight">
                Giọng đọc AI đang đọc trang này. Bé hãy cùng lắng nghe và quan sát nhé!
              </span>
            </div>
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="p-3 sm:px-5 sm:py-3 border-t border-white/10 flex items-center justify-between bg-black/30">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white flex items-center gap-1 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Trang Trước</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentPage === i + 1 ? 'w-5 bg-amber-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-black text-zinc-950 flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>Trang Sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
