'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export const CreateHeroHeader: React.FC = () => {
  return (
    <div className="relative group">
      {/* Glowing Blur Backdrop Layer */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-rose-500/25 via-amber-500/20 to-teal-400/25 blur-3xl opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none" />

      <section className="relative w-full rounded-3xl hero-animated-bg border border-outline-variant/40 p-6 sm:p-10 shadow-xl overflow-hidden text-center space-y-4">
        {/* Background Ambient Floating Blobs */}
        <div
          className="absolute -top-16 -left-16 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40 dark:opacity-30 animate-float-blob-1"
          style={{ background: 'var(--badge-gradient-1)' }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40 dark:opacity-30 animate-float-blob-2"
          style={{ background: 'var(--badge-gradient-2)' }}
        />

        {/* Twinkling Magical Stardust Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-6 left-[12%] animate-twinkle-1 drop-shadow-xs text-amber-400">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div className="absolute top-1/3 left-[45%] animate-twinkle-2 drop-shadow-xs text-rose-400">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div className="absolute bottom-8 left-[25%] animate-twinkle-3 drop-shadow-xs text-teal-400">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div className="absolute top-8 right-[18%] animate-twinkle-2 drop-shadow-xs text-amber-400">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
        </div>

        <div className="relative z-10 space-y-3">
          {/* Magic Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest/90 dark:bg-[#181B25]/90 backdrop-blur-md border border-rose-300/60 dark:border-rose-700/60 shadow-xs text-rose-600 dark:text-rose-300 font-extrabold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>✨ XƯỞNG PHÉP THUẬT AI • DÀNH CHO BÉ VÀ BA MẸ</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">
            Cùng AI Dệt Nên Câu Chuyện Diệu Kỳ Của Riêng Bé
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-xs sm:text-base text-on-surface-variant leading-relaxed opacity-90">
            Chỉ cần chọn nhân vật, bối cảnh và bài học mong muốn — Trí tuệ nhân tạo MagicTales sẽ vẽ tranh minh họa và lồng tiếng sống động chỉ trong vài giây!
          </p>
        </div>
      </section>
    </div>
  );
};
