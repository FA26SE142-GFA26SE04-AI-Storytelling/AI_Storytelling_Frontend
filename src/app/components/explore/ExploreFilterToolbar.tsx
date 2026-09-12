'use client';

import React from 'react';
import { ChevronDown, Gamepad2, Moon } from 'lucide-react';

interface ExploreFilterToolbarProps {
  durationFilter: string;
  setDurationFilter: (val: string) => void;
  voiceFilter: string;
  setVoiceFilter: (val: string) => void;
  hasInteractive: boolean;
  setHasInteractive: (val: boolean) => void;
  hasLullabyMusic: boolean;
  setHasLullabyMusic: (val: boolean) => void;
}

export const ExploreFilterToolbar: React.FC<ExploreFilterToolbarProps> = ({
  durationFilter,
  setDurationFilter,
  voiceFilter,
  setVoiceFilter,
  hasInteractive,
  setHasInteractive,
  hasLullabyMusic,
  setHasLullabyMusic,
}) => {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-outline-variant/30 text-xs">
      {/* Left Filter Dropdowns & Toggles */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Duration Selector */}
        <div className="relative">
          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
            className="appearance-none bg-surface-container border border-outline-variant/40 rounded-full px-3.5 py-1.5 pr-8 font-semibold text-on-surface cursor-pointer focus:outline-none focus:border-primary-container"
          >
            <option value="all">⏱️ Thời lượng: Mọi thời lượng</option>
            <option value="short">Dưới 5 phút</option>
            <option value="medium">5 - 10 phút</option>
            <option value="long">Trên 10 phút</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Voice Selector */}
        <div className="relative">
          <select
            value={voiceFilter}
            onChange={(e) => setVoiceFilter(e.target.value)}
            className="appearance-none bg-surface-container border border-outline-variant/40 rounded-full px-3.5 py-1.5 pr-8 font-semibold text-on-surface cursor-pointer focus:outline-none focus:border-primary-container"
          >
            <option value="all">🎙️ Giọng đọc: Tất cả giọng đọc</option>
            <option value="north">Giọng miền Bắc</option>
            <option value="south">Giọng miền Nam</option>
            <option value="warm">Giọng đọc truyền cảm</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Interactive Checkbox Pill */}
        <button
          onClick={() => setHasInteractive(!hasInteractive)}
          className={`px-3.5 py-1.5 rounded-full font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
            hasInteractive
              ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
              : 'bg-surface-container border-outline-variant/40 text-on-surface-variant'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Có ô mảnh tương tác</span>
        </button>

        {/* Lullaby Music Checkbox Pill */}
        <button
          onClick={() => setHasLullabyMusic(!hasLullabyMusic)}
          className={`px-3.5 py-1.5 rounded-full font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
            hasLullabyMusic
              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'bg-surface-container border-outline-variant/40 text-on-surface-variant'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Có nhạc sóng ru ngủ</span>
        </button>
      </div>

      {/* Right Story Count Status */}
      <div className="text-on-surface-variant text-[11px] sm:text-xs font-semibold">
        Đang hiển thị <span className="font-black text-on-surface">36</span> trên{' '}
        <span className="font-black text-on-surface">5.620</span> câu chuyện
      </div>
    </section>
  );
};
