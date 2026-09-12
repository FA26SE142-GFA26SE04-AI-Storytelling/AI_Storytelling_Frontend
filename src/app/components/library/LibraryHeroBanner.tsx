'use client';

import React from 'react';
import { Sparkles, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { Button } from '../ui/Button';

export const LibraryHeroBanner: React.FC = () => {
  return (
    <section className="relative w-full rounded-3xl bg-gradient-to-b from-amber-100/60 via-amber-50/40 to-surface-container-lowest dark:from-[#151D30] dark:to-[#0F1626] border border-outline-variant/40 dark:border-[#283556] p-6 sm:p-8 shadow-sm overflow-hidden flex flex-col gap-6 transition-colors duration-300">
      {/* Decorative Glowing Blobs */}
      <div
        className="absolute -top-10 -left-10 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-30 dark:opacity-20 animate-float-blob-1"
        style={{ background: 'var(--badge-gradient-1)' }}
      />
      <div
        className="absolute -bottom-12 -right-12 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-30 dark:opacity-20 animate-float-blob-2"
        style={{ background: 'var(--badge-gradient-2)' }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Welcome Info */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Top Level Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-xs font-extrabold w-fit shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>📍 CẤP ĐỘ: HIỆP SĨ CỔ TÍCH KHÍ ⚡</span>
          </div>

          {/* Main Heading */}
          <h1 className="heading-hero text-2xl sm:text-3xl lg:text-4xl text-on-surface">
            Tủ Truyện Diệu Kỳ Của Bé Bo 📚✨
          </h1>

          {/* Subtitle */}
          <p className="text-subtitle text-xs sm:text-sm">
            Bé đã khám phá <strong className="text-primary-container font-black">18 câu chuyện kỳ thú</strong> và giành được <strong className="text-amber-500 font-black">4 huy hiệu</strong> thám hiểm nhỏ. Hãy cùng tiếp tục khám phá thế giới thần tiên nhé!
          </p>

          {/* Action Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />}
              className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold"
            >
              Chế độ đọc ngoại tuyến (Offline)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              className="font-bold text-xs"
            >
              Bộ lọc nhanh
            </Button>
          </div>
        </div>

        {/* Right Stats Grid (4 Cards) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          {/* Stat Box 1 */}
          <div className="bg-surface-container-lowest/90 dark:bg-[#121A2D]/90 backdrop-blur-md border border-outline-variant/40 dark:border-[#283556] p-3.5 rounded-2xl shadow-2xs flex items-center gap-3 group hover:border-primary-container/60 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-110 transition-transform">
              📖
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-on-surface leading-tight">18</span>
              <span className="text-[11px] font-semibold text-on-surface-variant opacity-80">Truyện đã đọc</span>
            </div>
          </div>

          {/* Stat Box 2 */}
          <div className="bg-surface-container-lowest/90 dark:bg-[#121A2D]/90 backdrop-blur-md border border-outline-variant/40 dark:border-[#283556] p-3.5 rounded-2xl shadow-2xs flex items-center gap-3 group hover:border-primary-container/60 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-110 transition-transform">
              🎨
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-on-surface leading-tight">6</span>
              <span className="text-[11px] font-semibold text-on-surface-variant opacity-80">Tự tạo cùng AI</span>
            </div>
          </div>

          {/* Stat Box 3 */}
          <div className="bg-surface-container-lowest/90 dark:bg-[#121A2D]/90 backdrop-blur-md border border-outline-variant/40 dark:border-[#283556] p-3.5 rounded-2xl shadow-2xs flex items-center gap-3 group hover:border-primary-container/60 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-110 transition-transform">
              🎧
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-on-surface leading-tight">145</span>
              <span className="text-[11px] font-semibold text-on-surface-variant opacity-80">Phút lắng nghe</span>
            </div>
          </div>

          {/* Stat Box 4 */}
          <div className="bg-surface-container-lowest/90 dark:bg-[#121A2D]/90 backdrop-blur-md border border-outline-variant/40 dark:border-[#283556] p-3.5 rounded-2xl shadow-2xs flex items-center gap-3 group hover:border-primary-container/60 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-110 transition-transform">
              🏆
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-on-surface leading-tight">4/12</span>
              <span className="text-[11px] font-semibold text-on-surface-variant opacity-80">Huy hiệu đã đạt</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
