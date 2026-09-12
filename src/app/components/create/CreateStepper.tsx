'use client';

import React from 'react';

interface CreateStepperProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  characterName: string;
  characterBadge: string;
  worldName: string;
}

export const CreateStepper: React.FC<CreateStepperProps> = ({
  activeStep,
  setActiveStep,
  characterName,
  characterBadge,
  worldName,
}) => {
  return (
    <div className="relative group">
      {/* Glowing Blur Backdrop Layer */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-500/20 via-amber-400/20 to-teal-400/20 blur-xl opacity-60 pointer-events-none" />

      <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-2xl p-2 sm:p-3 border border-outline-variant/40 shadow-xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          
          {/* Step 1 */}
          <button
            onClick={() => setActiveStep(1)}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeStep === 1
                ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-300 ring-2 ring-rose-500/20'
                : 'bg-surface-bright dark:bg-[#181B25] border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
              ✓
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">Bước 1 • Hoàn thành</span>
              <span className="text-xs font-extrabold truncate block">{characterName} {characterBadge ? `(${characterBadge})` : ''}</span>
            </div>
          </button>

          {/* Step 2 */}
          <button
            onClick={() => setActiveStep(2)}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeStep === 2
                ? 'bg-primary-container/15 border-primary-container text-rose-600 dark:text-amber-300 ring-2 ring-primary-container/30 shadow-xs'
                : 'bg-surface-bright dark:bg-[#181B25] border-outline-variant/40 text-on-surface opacity-80'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-primary-container text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-xs animate-pulse">
              2
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">Bước 2 • Đang chọn</span>
              <span className="text-xs font-extrabold truncate block">{worldName}</span>
            </div>
          </button>

          {/* Step 3 */}
          <button
            onClick={() => setActiveStep(3)}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeStep === 3
                ? 'bg-primary-container/15 border-primary-container text-rose-600 dark:text-amber-300 ring-2 ring-primary-container/30 shadow-xs'
                : 'bg-surface-bright dark:bg-[#181B25] border-outline-variant/30 text-on-surface-variant opacity-70 hover:opacity-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-surface-container text-on-surface flex items-center justify-center text-xs font-bold shrink-0">
              3
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">Bước 3</span>
              <span className="text-xs font-bold truncate block">Bài Học & Cốt Truyện</span>
            </div>
          </button>

          {/* Step 4 */}
          <button
            onClick={() => setActiveStep(4)}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeStep === 4
                ? 'bg-primary-container/15 border-primary-container text-rose-600 dark:text-amber-300 ring-2 ring-primary-container/30 shadow-xs'
                : 'bg-surface-bright dark:bg-[#181B25] border-outline-variant/30 text-on-surface-variant opacity-70 hover:opacity-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-surface-container text-on-surface flex items-center justify-center text-xs font-bold shrink-0">
              4
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">Bước 4</span>
              <span className="text-xs font-bold truncate block">Lồng Tiếng & Tranh</span>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};
