'use client';

import React from 'react';
import { ArrowLeft, BookOpen, Search, X } from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';
import { TimeOfDaySwitcher } from '../common/TimeOfDaySwitcher';

export interface BookshelfTopBarProps {
  onBackToOverview: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay, e?: React.MouseEvent) => void;
}

export const BookshelfTopBar: React.FC<BookshelfTopBarProps> = ({
  onBackToOverview,
  searchQuery,
  onSearchChange,
  timeOfDay,
  onTimeOfDayChange,
}) => {
  return (
    <div className="bookshelf-top-bar pointer-events-auto w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:px-5 sm:py-3 rounded-3xl bg-tod-surface/90 backdrop-blur-2xl border border-tod-border shadow-2xl text-tod-text transition-colors duration-500">
      {/* 1. Back Button & Title */}
      <div className="flex items-center justify-between sm:justify-start gap-3">
        <button
          onClick={onBackToOverview}
          className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-tod-card hover:bg-tod-surface border border-tod-border text-tod-text-muted hover:text-tod-text transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0 hover:scale-105 active:scale-95 shadow-sm"
          title="Quay lại góc nhìn toàn cảnh phòng 3D"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span className="hidden xs:inline">Toàn Cảnh</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
            <BookOpen className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <h1 className="font-black text-xs sm:text-sm tracking-tight text-tod-text flex items-center gap-2">
              <span>Kệ Sách Thần Kỳ Của Bé</span>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-[9px] font-extrabold text-amber-600 dark:text-amber-300 uppercase tracking-wider hidden sm:inline-block">
                Góc Nhìn 3D Zoom
              </span>
            </h1>
            <p className="text-[9px] text-tod-text-muted font-medium">Bấm chọn sách trên kệ 3 tầng để đọc & nghe ngay</p>
          </div>
        </div>
      </div>

      {/* 2. Search Input */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-tod-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm truyện trên kệ sách..."
            className="w-full pl-9 pr-8 py-1.5 sm:py-2 rounded-2xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder-tod-text-muted focus:outline-none focus:border-amber-400 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 p-0.5 text-tod-text-muted hover:text-tod-text cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Time of Day Switcher & Close Button */}
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
        <TimeOfDaySwitcher
          timeOfDay={timeOfDay}
          onTimeOfDayChange={onTimeOfDayChange}
          showLabels={true}
        />

        <button
          onClick={onBackToOverview}
          className="p-2 rounded-xl bg-tod-card hover:bg-rose-500/20 text-tod-text-muted hover:text-rose-500 border border-tod-border transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Đóng bảng Kệ Sách (Quay lại Toàn Cảnh)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
