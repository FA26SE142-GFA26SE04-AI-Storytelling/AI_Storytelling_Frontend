'use client';

import React from 'react';
import { Award, Check, CheckCircle2, Flame, Lock, Printer } from 'lucide-react';
import { Button } from '../ui/Button';
import { DayStreakItem, AchievementBadge } from '../../types/library';

interface LibraryStreakAndBadgesProps {
  dayStreaks: DayStreakItem[];
  badges: AchievementBadge[];
}

export const LibraryStreakAndBadges: React.FC<LibraryStreakAndBadgesProps> = ({
  dayStreaks,
  badges,
}) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: 7-Day Reading Streak Challenge Box */}
      <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-[#0F1626] rounded-3xl p-6 border border-outline-variant/40 shadow-xs flex flex-col justify-between gap-5">
        <div className="flex flex-col gap-1">
          <h3 className="heading-card text-lg sm:text-xl font-black text-on-surface flex items-center gap-2">
            <span className="text-rose-500">🔥</span>
            <span>Thử Thách 7 Ngày Đọc Truyện</span>
          </h3>
          <p className="text-subtitle text-xs">
            Xây dựng thói quen đọc sách trước khi ngủ cùng Bé Bo
          </p>
        </div>

        {/* 7 Days Streak Circles */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3 py-2">
          {(dayStreaks || []).map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm border transition-all ${
                  item.isCompleted
                    ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-500/20'
                    : item.isCurrent
                    ? 'bg-amber-400 text-amber-950 border-amber-400 ring-4 ring-amber-400/20 font-black animate-pulse'
                    : 'bg-surface-container/60 text-on-surface-variant/40 border-outline-variant/30'
                }`}
              >
                {item.isCompleted ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : item.isCurrent ? (
                  <Flame className="w-5 h-5 fill-current text-rose-600" />
                ) : (
                  <Lock className="w-4 h-4 opacity-50" />
                )}
              </div>
              <span className="text-[11px] font-bold text-on-surface-variant">
                {item.day}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Note Box */}
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-rose-500" />
          <span>Bé đã đạt 4/7 ngày đọc liên tiếp! Còn 3 ngày nữa để mở rương quà bảo bối thần kỳ.</span>
        </div>
      </div>

      {/* Right Column: Badges Collection Showcase */}
      <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-[#0F1626] rounded-3xl p-6 border border-outline-variant/40 shadow-xs flex flex-col justify-between gap-5">
        <div className="flex items-center justify-between">
          <h3 className="heading-card text-lg sm:text-xl font-black text-on-surface">
            Bộ Huy Hiệu Của Bé
          </h3>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
            Đã thu thập 4/12
          </span>
        </div>

        {/* Badges List */}
        <div className="grid grid-cols-3 gap-2.5">
          {(badges || []).map((bdg) => (
            <div
              key={bdg.id}
              className="flex flex-col items-center text-center p-3 rounded-2xl bg-surface-container/40 border border-outline-variant/30 hover:border-amber-400/50 transition-all group cursor-pointer"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-1.5 group-hover:scale-110 transition-transform ${bdg.bgColor}`}>
                {bdg.icon}
              </div>
              <span className="text-[11px] font-extrabold text-on-surface line-clamp-1">
                {bdg.title}
              </span>
              <span className="text-[9px] font-semibold text-on-surface-variant/70">
                {bdg.subtitle}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <Button
            variant="gold"
            size="sm"
            icon={<Award className="w-4 h-4" />}
            className="w-full sm:w-auto flex-1 text-xs justify-center font-bold"
          >
            Khoe Thành Tích Cùng Ông Bà
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Printer className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto text-xs justify-center font-bold"
          >
            In phiếu khen thưởng
          </Button>
        </div>
      </div>
    </section>
  );
};
