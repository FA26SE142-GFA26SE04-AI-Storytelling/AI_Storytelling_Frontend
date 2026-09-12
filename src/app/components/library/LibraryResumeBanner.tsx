'use client';

import React from 'react';
import Image from 'next/image';
import { BookOpen, Clock, Heart, Play, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface LibraryResumeBannerProps {
  favorites: Record<string, boolean>;
  toggleFav: (id: string) => void;
}

export const LibraryResumeBanner: React.FC<LibraryResumeBannerProps> = ({
  favorites,
  toggleFav,
}) => {
  const isFav = !!favorites['featured'];

  return (
    <section className="relative w-full rounded-3xl bg-surface-container-lowest dark:bg-[#0F1626] border border-outline-variant/40 p-5 sm:p-8 shadow-md flex flex-col gap-5 overflow-hidden group hover:shadow-xl transition-all">
      {/* Subtle Glow Aura behind Card */}
      <div className="radiant-glow-aura" />

      {/* Card Header Tag */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="badge-eyebrow-label text-rose-600 dark:text-rose-400">
            📍 TIẾP TỤC CUỘC PHIÊU LƯU
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-eyebrow-label text-on-surface-variant/80">
            PHIÊU LƯU KỲ THÚ • GIỌNG ĐỌC MẸ HIỀN (AI EMOTION)
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-[10px]">
            Chương 2 / 5
          </span>
        </div>
      </div>

      {/* Card Main Body */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Cover Preview */}
        <div className="lg:col-span-4 relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md group/img">
          <Image
            src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop"
            alt="Lâu Đài Kẹo Ngọt Trên Mây"
            fill
            className="object-cover group-hover/img:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-[11px] font-extrabold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Còn 5 phút</span>
          </span>
        </div>

        {/* Right Content Details & Progress */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="heading-section text-xl sm:text-2xl lg:text-3xl text-on-surface">
              Lâu Đài Kẹo Ngọt Trên Mây
            </h2>

            <p className="text-subtitle text-xs sm:text-sm leading-relaxed italic">
              &ldquo;Bé An và Chú Sóc Bông đã bước qua chiếc cổng vôi cầu phồng. Trước mắt bé là hai cánh cổng bí mật: Cổng Sô-cô-la phát sáng và Cổng Thạch Lam Lấp Lánh...&rdquo;
            </p>
          </div>

          {/* Reading Progress Line */}
          <div className="flex flex-col gap-1.5 bg-surface-container/40 p-3.5 rounded-2xl border border-outline-variant/30">
            <div className="flex items-center justify-between text-xs font-extrabold text-on-surface">
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Tiến độ đọc: 65%</span>
              </span>
              <span className="text-on-surface-variant font-semibold">Đã nghe 7 / 10 phút</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-rose-500 h-full rounded-full w-[65%] transition-all duration-300" />
            </div>
          </div>

          {/* Next Branch Choice Callout */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="font-extrabold text-amber-700 dark:text-amber-300">
                ⚡ Lựa chọn ở nhánh tiếp theo đang chờ bé:
              </span>
              <span className="font-semibold text-on-surface">
                Mở Cổng Sô-cô-la hay Qua Cổng Thạch Lam?
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="primary"
              size="md"
              shimmer
              icon={<Play className="w-4 h-4 fill-current ml-0.5" />}
              className="font-extrabold text-xs sm:text-sm"
            >
              Tiếp tục nghe (Chương 2)
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<BookOpen className="w-4 h-4" />}
              className="font-extrabold text-xs sm:text-sm"
            >
              Đọc sách tranh
            </Button>
            <button
              onClick={() => toggleFav('featured')}
              className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                isFav
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/40'
              }`}
              aria-label="Toggle favorite"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
