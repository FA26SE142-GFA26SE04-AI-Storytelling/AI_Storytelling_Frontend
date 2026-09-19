'use client';

import React from 'react';
import { Sunrise, Sun, Moon } from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';
import { animateExpandingCircleRipple } from '../../utils/gsapAnimations';

export interface TimeOfDaySwitcherProps {
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay, e?: React.MouseEvent) => void;
  showLabels?: boolean;
  className?: string;
}

export const TimeOfDaySwitcher: React.FC<TimeOfDaySwitcherProps> = ({
  timeOfDay,
  onTimeOfDayChange,
  showLabels = true,
  className = '',
}) => {
  const handleClick = (newTime: TimeOfDay, e: React.MouseEvent<HTMLButtonElement>) => {
    if (newTime === timeOfDay) return;
    // Kích hoạt hiệu ứng micro-bounce và gọi callback chuyển buổi kèm tọa độ click
    animateExpandingCircleRipple(e.currentTarget, newTime);
    onTimeOfDayChange(newTime, e);
  };

  return (
    <div
      className={`relative flex items-center p-1 bg-tod-card border border-tod-border rounded-xl text-[11px] font-extrabold select-none transition-colors duration-500 shadow-sm ${className}`}
    >
      {/* Nút Buổi Sáng */}
      <button
        type="button"
        onClick={(e) => handleClick('morning', e)}
        className={`relative p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
          timeOfDay === 'morning'
            ? 'bg-sky-500 text-white font-black shadow-sm'
            : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
        }`}
        title="Buổi Sáng"
      >
        <Sunrise className="w-3.5 h-3.5 shrink-0" />
        {showLabels && <span className="hidden sm:inline">Sáng</span>}
      </button>

      {/* Nút Buổi Chiều */}
      <button
        type="button"
        onClick={(e) => handleClick('afternoon', e)}
        className={`relative p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
          timeOfDay === 'afternoon'
            ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
            : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
        }`}
        title="Buổi Chiều"
      >
        <Sun className="w-3.5 h-3.5 shrink-0" />
        {showLabels && <span className="hidden sm:inline">Chiều</span>}
      </button>

      {/* Nút Buổi Tối */}
      <button
        type="button"
        onClick={(e) => handleClick('night', e)}
        className={`relative p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
          timeOfDay === 'night'
            ? 'bg-indigo-600 text-white font-black shadow-sm'
            : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
        }`}
        title="Buổi Tối"
      >
        <Moon className="w-3.5 h-3.5 shrink-0" />
        {showLabels && <span className="hidden sm:inline">Tối</span>}
      </button>
    </div>
  );
};
