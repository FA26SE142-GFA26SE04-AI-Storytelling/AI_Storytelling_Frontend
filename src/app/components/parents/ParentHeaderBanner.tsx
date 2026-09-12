'use client';

import React from 'react';
import { Zap, Settings, ShieldCheck, Clock, ChevronRight } from 'lucide-react';

export const ParentHeaderBanner: React.FC = () => {
  return (
    <div className="relative group">
      {/* Glowing Blur Backdrop Layer */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-indigo-500/25 blur-2xl opacity-75 group-hover:opacity-95 transition-opacity pointer-events-none" />

      <section className="relative w-full rounded-3xl hero-animated-bg border border-outline-variant/40 p-5 sm:p-8 shadow-xl overflow-hidden space-y-6">
        
        {/* Background Ambient Glowing Blobs */}
        <div
          className="absolute -top-16 -left-16 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-35 dark:opacity-25 animate-float-blob-1"
          style={{ background: 'var(--badge-gradient-1)' }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-35 dark:opacity-25 animate-float-blob-2"
          style={{ background: 'var(--badge-gradient-2)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Left Info */}
          <div className="space-y-3 max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-container-lowest/90 dark:bg-[#181B25]/90 backdrop-blur-md border border-amber-400/40 text-amber-700 dark:text-amber-300 font-extrabold text-xs shadow-xs">
              <Zap className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse" />
              <span>⚡ Không gian đồng hành độc quyền cho cha mẹ MagicTales</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
              Góc Đồng Hành Của Cha Mẹ & Bé Bo 🌱
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed opacity-90">
              Theo dõi hành trình phát triển cảm xúc, quản lý thời gian sử dụng lành mạnh và nâng cao khả năng ngôn ngữ yêu thích mỗi ngày.
            </p>
          </div>

          {/* Right Profile Pill Box */}
          <div className="w-full lg:w-auto p-4 rounded-2xl bg-surface-container-lowest/80 dark:bg-[#181B25]/80 backdrop-blur-md border border-outline-variant/40 flex items-center justify-between lg:justify-start gap-4 shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                B
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base text-on-surface">Bé Bo 🌟</span>
                </div>
                <span className="text-xs text-on-surface-variant opacity-80 block">4 tuổi • Mầm non lớn</span>
              </div>
            </div>

            <button className="px-3 py-1.5 rounded-xl border border-outline-variant/60 bg-surface-bright dark:bg-[#0F1626] hover:bg-surface-container text-on-surface font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer">
              <Settings className="w-3.5 h-3.5" />
              <span>Thiết lập hồ sơ bé</span>
            </button>
          </div>

        </div>

        {/* Bottom Security & Timestamp Strip */}
        <div className="relative z-10 pt-4 border-t border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface-variant opacity-85">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold">
              <ShieldCheck className="w-4 h-4" />
              Chứng nhận Không Quảng Cáo & Chuẩn Bảo Mật COPPA Quốc Tế
            </span>
            <span className="hidden sm:inline text-outline-variant">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5" />
              Cập nhật mới nhất: 30 phút trước
            </span>
          </div>

          <button className="self-start sm:self-auto font-extrabold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer">
            <span>Tùy chỉnh quyền riêng tư</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
