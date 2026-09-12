'use client';

import React from 'react';
import { TrendingUp, Calendar, Clock, BookOpen, Sparkles, Smile } from 'lucide-react';

export const ParentWeeklyStats: React.FC = () => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg sm:text-xl font-extrabold text-on-surface">
            Chỉ số tuần này (04/11 - 10/11)
          </h2>
        </div>
        <div className="px-3 py-1 rounded-full bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md border border-outline-variant/40 text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>Tuần 45 - Năm 2026</span>
        </div>
      </div>

      {/* 4 Stat Cards Grid with Glowing Blur Backdrops */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat Card 1 */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-rose-500/25 to-amber-500/20 blur-xl opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />
          
          <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-5 border border-outline-variant/30 shadow-xs space-y-3 flex flex-col justify-between overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant opacity-80">
                Thời gian nghe đọc tuần này
              </span>
              <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                165 <span className="text-sm font-bold text-on-surface-variant">phút</span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
                  <span>Đạt mục tiêu tuần</span>
                  <span className="text-rose-500">85%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full w-[85%]" />
                </div>
              </div>
            </div>
            <span className="relative z-10 text-[11px] text-on-surface-variant opacity-75 pt-1 border-t border-outline-variant/20 block">
              Trung bình 23 phút/ngày
            </span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-amber-500/25 to-yellow-500/20 blur-xl opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />

          <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-5 border border-outline-variant/30 shadow-xs space-y-3 flex flex-col justify-between overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant opacity-80">
                Số câu chuyện đã đọc
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                18 <span className="text-sm font-bold text-on-surface-variant">truyện</span>
              </div>
              <div className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                Tự đi truyện 10 | Tự sáng tạo 8
              </div>
            </div>
            <span className="relative z-10 text-[11px] text-on-surface-variant opacity-75 pt-1 border-t border-outline-variant/20 block">
              14 truyện hoàn thành trọn vẹn
            </span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-emerald-500/25 to-teal-500/20 blur-xl opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />

          <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-5 border border-outline-variant/30 shadow-xs space-y-3 flex flex-col justify-between overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant opacity-80">
                Từ vựng mới tích lũy
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                +42 <span className="text-sm font-bold text-on-surface-variant">từ vựng</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                Thêm từ mới: & Lắng nghe vị
              </div>
            </div>
            <span className="relative z-10 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1 border-t border-outline-variant/20 block">
              Tăng 120% so với tuần trước
            </span>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-amber-400/25 to-orange-400/20 blur-xl opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />

          <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-5 border border-outline-variant/30 shadow-xs space-y-3 flex flex-col justify-between overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant opacity-80">
                Trạng thái cảm xúc sau nghe
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center">
                <Smile className="w-4 h-4" />
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                95% <span className="text-sm font-bold text-amber-600 dark:text-amber-400">tích cực</span>
              </div>
              <p className="mt-1 text-[11px] text-on-surface-variant opacity-85 leading-tight">
                Mặt cười nhẹ, thư giãn và đi vào giấc ngủ nhanh hơn trong các bài phát biểu.
              </p>
            </div>
            <span className="relative z-10 text-[11px] text-on-surface-variant opacity-75 pt-1 border-t border-outline-variant/20 block">
              Đánh giá tâm lý tích cực
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
