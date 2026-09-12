'use client';

import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExploreHeroHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  quickTags: Array<{ label: string; icon: string }>;
}

export const ExploreHeroHeader: React.FC<ExploreHeroHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  quickTags,
}) => {
  return (
    <section className="relative w-full rounded-3xl hero-animated-bg border border-outline-variant/40 p-6 sm:p-10 shadow-lg overflow-hidden flex flex-col gap-6 transition-colors duration-300">
      {/* Background Glowing Blobs */}
      <div
        className="absolute -top-12 -left-12 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-35 dark:opacity-25 animate-float-blob-1"
        style={{ background: 'var(--badge-gradient-1)' }}
      />
      <div
        className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-35 dark:opacity-25 animate-float-blob-2"
        style={{ background: 'var(--badge-gradient-2)' }}
      />

      {/* Magical Twinkling Stardust Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-6 left-[10%] animate-twinkle-1 drop-shadow-xs" style={{ color: 'var(--badge-gradient-1)' }}>
          <Sparkles className="w-5 h-5 fill-current" />
        </div>
        <div className="absolute top-1/3 left-[40%] animate-twinkle-2 drop-shadow-xs" style={{ color: 'var(--badge-gradient-2)' }}>
          <Sparkles className="w-4 h-4 fill-current" />
        </div>
        <div className="absolute bottom-10 left-[22%] animate-twinkle-3 drop-shadow-xs" style={{ color: 'var(--badge-gradient-3)' }}>
          <Sparkles className="w-5 h-5 fill-current" />
        </div>
        <div className="absolute top-8 right-[15%] animate-twinkle-2 drop-shadow-xs" style={{ color: 'var(--badge-gradient-1)' }}>
          <Sparkles className="w-5 h-5 fill-current" />
        </div>
        <div className="absolute bottom-6 right-[28%] animate-twinkle-1 drop-shadow-xs" style={{ color: 'var(--badge-gradient-3)' }}>
          <Sparkles className="w-4 h-4 fill-current" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Main Title & Subtitle */}
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/30 border border-secondary-container/50 text-on-secondary-container dark:text-amber-300 text-xs font-extrabold w-fit shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-400" />
            <span>⚡ KHO TÀNG 5.000+ CÂU CHUYỆN DIỆU KỲ</span>
          </div>

          <h1 className="heading-hero text-on-surface">
            Khám phá Kho Tàng Truyện Cổ Tích & Khoa Học Diệu Kỳ
          </h1>

          <p className="text-subtitle">
            Hơn 5.000+ câu chuyện được tạo bởi AI và đội ngũ chuyên gia tâm lý thiếu nhi, giúp bồi đắp tâm hồn, nuôi dưỡng lòng nhân ái và kích hoạt trí tưởng tượng vô tận của bé.
          </p>
        </div>

        {/* Top Right Floating Expert Verification Card */}
        <div className="relative group shrink-0 max-w-xs">
          <div className="radiant-glow-aura" />
          <div className="relative z-10 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/50 p-4 rounded-2xl shadow-md flex items-center gap-3.5 group hover:border-primary-container/60 transition-all">
            <div className="w-11 h-11 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl shrink-0 group-hover:scale-110 transition-transform">
              🧠
            </div>
            <div className="flex flex-col">
              <span className="badge-eyebrow-label text-amber-600 dark:text-amber-400">
                Được kiểm duyệt bởi
              </span>
              <span className="text-xs font-bold text-on-surface leading-snug">
                Chuyên gia tâm lý mầm non & sư phạm thiếu nhi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Big Search Bar Input */}
      <div className="relative z-10 w-full mt-2 group">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="relative flex items-center w-full rounded-2xl bg-surface-container-lowest border-2 border-outline-variant/60 focus-within:border-primary-container shadow-md p-1.5 transition-all"
        >
          <Search className="w-5 h-5 ml-3 text-on-surface-variant/60 shrink-0 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên truyện, nhân vật (chú gấu, phi hành gia, rùa con...)"
            className="w-full bg-transparent px-3 py-2 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Search className="w-4 h-4" />}
          >
            Tìm kiếm phép thuật
          </Button>
        </form>

        {/* Quick Suggestion Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-1 text-xs">
          <span className="badge-eyebrow-label text-on-surface-variant/80 flex items-center gap-1">
            <span>🪄</span> Gợi ý cho bé:
          </span>
          {quickTags.map((tag, idx) => (
            <button
              key={idx}
              onClick={() => setSearchQuery(tag.label)}
              className="px-3 py-1 rounded-full bg-surface-container/70 hover:bg-primary-container/20 hover:text-primary-container border border-outline-variant/30 text-on-surface-variant text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
            >
              <span>{tag.icon}</span>
              <span>{tag.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
