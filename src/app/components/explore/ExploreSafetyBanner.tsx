'use client';

import React from 'react';
import { Button } from '../ui/Button';

export const ExploreSafetyBanner: React.FC = () => {
  return (
    <section className="relative w-full rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-surface-container-lowest border border-emerald-500/30 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-4 overflow-hidden">
      {/* Background glow aura */}
      <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />

      <div className="flex items-start gap-4 z-10">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shrink-0">
          🛡️
        </div>
        <div className="flex flex-col gap-1 max-w-2xl">
          <span className="badge-eyebrow-label text-emerald-600 dark:text-emerald-400">
            📍 TIÊU CHUẨN AN TOÀN TRẺ EM COPPA & NGUYÊN TẮC GIÁO DỤC TÍCH CỰC
          </span>
          <h3 className="heading-card text-base sm:text-lg">
            Cam kết 100% An Toàn & Lành Mạnh Cho Tuổi Thơ Của Bé
          </h3>
          <p className="text-subtitle text-xs leading-relaxed">
            Toàn bộ nội dung và hình ảnh đều trải qua 3 lớp kiểm duyệt nghiêm ngặt: Lớp bộ lọc AI tự động loại bỏ tạp chất, Lớp chuyên gia tâm lý nhi khoa và Lớp cài đặt phụ huynh quản lý trực tiếp.
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="md"
        className="shrink-0 font-extrabold whitespace-nowrap z-10"
      >
        Xem Báo Cáo An Toàn
      </Button>
    </section>
  );
};
