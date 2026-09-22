'use client';

import React from 'react';
import { Flame, Award, CheckCircle2 } from 'lucide-react';
import { DAY_STREAKS, LIBRARY_BADGES } from '../../constants/mockData';

export const ReadingStreakFooter: React.FC = () => {
  return (
    <div className="bookshelf-bottom-bar pointer-events-auto w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-tod-surface/90 backdrop-blur-2xl border border-tod-border text-tod-text transition-colors duration-500 shadow-xl">
      {/* 1. Day Streak Tracker */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-500 dark:text-amber-400">
          <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-bounce" />
          <span>Thử Thách Đọc 7 Ngày:</span>
        </div>

        <div className="flex items-center gap-1">
          {DAY_STREAKS.map((stk, idx) => (
            <div
              key={idx}
              className={`bookshelf-streak-pill px-2 py-0.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1 ${
                stk.isCompleted
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300'
                  : stk.isCurrent
                  ? 'bg-sky-500/20 border border-sky-500/40 text-sky-600 dark:text-sky-300 animate-pulse'
                  : 'bg-tod-card border border-tod-border text-tod-text-muted'
              }`}
            >
              <span>{stk.day}</span>
              {stk.isCompleted && <CheckCircle2 className="w-2.5 h-2.5 text-amber-500" />}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Badges Quick Preview */}
      <div className="hidden md:flex items-center gap-2 text-xs">
        <Award className="w-4 h-4 text-rose-500" />
        <span className="font-extrabold text-tod-text text-[11px]">Huy hiệu của bé:</span>
        <div className="flex items-center gap-1.5">
          {LIBRARY_BADGES.map((bdg) => (
            <span
              key={bdg.id}
              className="bookshelf-badge-pill px-2 py-0.5 rounded-lg bg-tod-card border border-tod-border text-[9px] font-bold text-tod-text flex items-center gap-1"
            >
              <span>{bdg.icon}</span>
              <span>{bdg.title}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
