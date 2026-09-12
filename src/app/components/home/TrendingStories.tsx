import React from 'react';
import { TRENDING_STORIES } from '../../constants/mockData';
import { StoryCard } from '../ui/StoryCard';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export const TrendingStories: React.FC = () => {
  return (
    <section className="mb-12">
      {/* Section Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/90 dark:bg-[#172038]/90 backdrop-blur-md text-on-primary-container border border-primary-container/30 badge-eyebrow-label mb-2 shadow-2xs">
            <Zap className="w-3.5 h-3.5 fill-current text-rose-500" />
            <span>BẢNG XẾP HẠNG HÀNG TUẦN</span>
          </div>
          <h2 className="heading-section">
            Truyện Phép Thuật Bé Sáng Tạo Nhiều Nhất
          </h2>
          <p className="text-subtitle text-xs sm:text-sm mt-1">
            Được bình chọn yêu thích nhất bởi hơn 12.000 bạn nhỏ tuần qua
          </p>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            aria-label="Previous story"
            className="w-9 h-9 rounded-full bg-surface-container-lowest/90 dark:bg-[#172038]/90 backdrop-blur-md border border-outline-variant/40 hover:border-primary-container text-on-surface flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            aria-label="Next story"
            className="w-9 h-9 rounded-full bg-surface-container-lowest/90 dark:bg-[#172038]/90 backdrop-blur-md border border-outline-variant/40 hover:border-primary-container text-on-surface flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid of Story Cards with Blur Backdrops */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {TRENDING_STORIES.map((story) => (
          <div key={story.id} className="relative group">
            {/* Glowing Blur Backdrop Layer */}
            <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-tr from-rose-500/15 via-amber-400/15 to-emerald-400/15 blur-lg opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />

            <StoryCard story={story} />
          </div>
        ))}
      </div>
    </section>
  );
};
