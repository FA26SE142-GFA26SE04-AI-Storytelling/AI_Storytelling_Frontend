'use client';

import React from 'react';

export interface MoralOption {
  id: string;
  label: string;
  icon: string;
}

interface MoralOptionsProps {
  morals: MoralOption[];
  selectedMorals: string[];
  toggleMoral: (id: string) => void;
  isInteractiveBranching: boolean;
  setIsInteractiveBranching: (val: boolean) => void;
  isBedtimeMode: boolean;
  setIsBedtimeMode: (val: boolean) => void;
}

export const MoralOptions: React.FC<MoralOptionsProps> = ({
  morals,
  selectedMorals,
  toggleMoral,
  isInteractiveBranching,
  setIsInteractiveBranching,
  isBedtimeMode,
  setIsBedtimeMode,
}) => {
  return (
    <div className="relative group">
      {/* Glowing Blur Backdrop Layer */}
      <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-emerald-500/20 to-sky-500/20 blur-xl opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none" />

      <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-outline-variant/40 shadow-xs space-y-5 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 flex items-center justify-center text-xs font-extrabold">
            3
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-on-surface">
            Bài Học Ý Nghĩa & Tùy Chọn
          </h2>
        </div>

        {/* Selectable Moral Chips */}
        <div className="flex flex-wrap gap-2">
          {morals.map((moral) => {
            const isSelected = selectedMorals.includes(moral.id);
            return (
              <button
                key={moral.id}
                onClick={() => toggleMoral(moral.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-500 text-white shadow-xs scale-105'
                    : 'bg-surface-container/70 dark:bg-[#181B25] text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container'
                }`}
              >
                <span>{moral.icon}</span>
                <span>{moral.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feature Toggles Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          
          {/* Switch 1: Interactive Branching */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container/40 dark:bg-[#181B25] border border-outline-variant/30">
            <div className="pr-2">
              <span className="font-extrabold text-xs text-on-surface block">
                Truyện Tương Tác Nhánh
              </span>
              <span className="text-[10px] text-on-surface-variant opacity-75 block">
                Bé được tự chọn bước tiếp theo
              </span>
            </div>
            <button
              onClick={() => setIsInteractiveBranching(!isInteractiveBranching)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer p-0.5 ${
                isInteractiveBranching ? 'bg-tertiary-container' : 'bg-outline-variant/60'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  isInteractiveBranching ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Switch 2: Soft Bedtime Mode */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container/40 dark:bg-[#181B25] border border-outline-variant/30">
            <div className="pr-2">
              <span className="font-extrabold text-xs text-on-surface block">
                Chế độ Kể Ru Ngủ Êm Dịu
              </span>
              <span className="text-[10px] text-on-surface-variant opacity-75 block">
                Nhịp điệu thong thả & giọng đọc nhẹ nhàng
              </span>
            </div>
            <button
              onClick={() => setIsBedtimeMode(!isBedtimeMode)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer p-0.5 ${
                isBedtimeMode ? 'bg-tertiary-container' : 'bg-outline-variant/60'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  isBedtimeMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
