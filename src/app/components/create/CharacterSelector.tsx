'use client';

import React from 'react';
import Image from 'next/image';
import { Pencil, Sparkles, Check } from 'lucide-react';

export interface CharacterOption {
  id: string;
  name: string;
  subtitle: string;
  avatar: string;
  badge: string;
  color: string;
}

interface CharacterSelectorProps {
  characters: CharacterOption[];
  selectedCharacter: string;
  setSelectedCharacter: (id: string) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  onSuggestVoice: (voiceId: string) => void;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  characters,
  selectedCharacter,
  setSelectedCharacter,
  customPrompt,
  setCustomPrompt,
  onSuggestVoice,
}) => {
  return (
    <div className="relative group">
      {/* Glowing Blur Backdrop Layer */}
      <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 blur-xl opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none" />

      <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-outline-variant/40 shadow-xs space-y-4 overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 flex items-center justify-center text-xs font-extrabold">
              1
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-on-surface">
              Chọn Bạn Đồng Hành
            </h2>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/50">
            Bé có thể tự nhập gợi ý
          </span>
        </div>

        {/* Character Cards Grid (6 items) */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {characters.map((char) => {
            const isSelected = selectedCharacter === char.id;
            return (
              <button
                key={char.id}
                onClick={() => {
                  setSelectedCharacter(char.id);
                  if (char.id === 'gauchandro') {
                    setCustomPrompt('Sâu Momi (Khăn Đỏ)');
                  } else {
                    setCustomPrompt(`${char.name}`);
                  }
                }}
                className={`relative flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer group/char ${
                  isSelected
                    ? 'bg-surface-bright dark:bg-[#181B25] border-rose-500 ring-2 ring-rose-500/30 shadow-md scale-[1.02]'
                    : 'bg-surface-container-low/40 dark:bg-[#181B25]/50 border-outline-variant/30 hover:border-outline-variant hover:bg-surface-bright'
                }`}
              >
                {isSelected && (
                  <div className="absolute inset-0 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 blur-md pointer-events-none" />
                )}

                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs z-10">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden mb-2 border-2 border-surface-container group-hover/char:scale-105 transition-transform shadow-xs z-10">
                  <Image
                    src={char.avatar}
                    alt={char.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>

                <span className="font-extrabold text-xs sm:text-sm text-on-surface line-clamp-1 relative z-10">
                  {char.name}
                </span>
                
                <span className="text-[10px] text-on-surface-variant opacity-75 line-clamp-1 mt-0.5 relative z-10">
                  {char.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Character Prompt Input */}
        <div className="relative z-10 pt-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-2xl bg-surface-container/60 dark:bg-[#181B25] border border-outline-variant/40">
            <div className="flex items-center gap-2 px-3 py-1.5 flex-1 min-w-0">
              <Pencil className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Nhập tên nhân vật bé thích..."
                className="w-full bg-transparent font-bold text-xs sm:text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
            <button
              onClick={() => onSuggestVoice('suggest')}
              className="px-4 py-2 rounded-xl bg-tertiary-container hover:brightness-105 text-on-tertiary-container font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đề xuất cho bé nghe</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
