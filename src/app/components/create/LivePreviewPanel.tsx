'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, Play, Pause, ChevronRight, Wand2 } from 'lucide-react';
import { CharacterOption } from './CharacterSelector';
import { WorldOption } from './WorldSelector';

interface LivePreviewPanelProps {
  currentCharacter: CharacterOption;
  currentWorld: WorldOption;
  selectedBranch: number;
  setSelectedBranch: (branch: number) => void;
  isPlayingAudio: boolean;
  setIsPlayingAudio: (val: boolean) => void;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  currentCharacter,
  currentWorld,
  selectedBranch,
  setSelectedBranch,
  isPlayingAudio,
  setIsPlayingAudio,
}) => {
  return (
    <div className="relative group">
      {/* Vibrant Multi-color Radiant Glowing Blur Backdrop */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-rose-500/30 via-amber-400/25 to-teal-400/25 blur-2xl opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none animate-pulse" />

      <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-5 border border-outline-variant/40 shadow-xl space-y-4 overflow-hidden">
        
        {/* Header Box */}
        <div className="relative z-10 flex items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-extrabold text-xs uppercase tracking-wider text-on-surface">
              👁️ XEM TRƯỚC THỜI GIAN THỰC
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Đang sáng tạo
          </span>
        </div>

        {/* Story Title & Chapter Badge */}
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 uppercase tracking-widest inline-block mb-1">
            CHƯƠNG 1
          </span>
          <h3 className="font-extrabold text-base sm:text-lg text-on-surface leading-snug">
            Chuyến Phiêu Lưu Của Gấu {currentCharacter.badge || 'Momi'} Tại {currentWorld.name}
          </h3>
        </div>

        {/* Generated Story Image Preview */}
        <div className="relative z-10 relative w-full h-52 sm:h-60 rounded-2xl overflow-hidden shadow-md group">
          <Image
            src={currentWorld.imageUrl}
            alt="Story preview"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 1024px) 100vw, 450px"
          />

          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-extrabold flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
            <span>AI Art Studio HD</span>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-8">
            <p className="text-white text-xs leading-relaxed italic line-clamp-3 font-medium">
              &quot;Ngày xửa ngày xưa, dưới chân đồi thung lũng dâu tây, chú gấu Momi nhặt được một chiếc chìa khóa phát sáng kỳ lạ mở ra một tập bính màu. Khi vừa bước vào cổng xóm kẹo-bông, có một vùng đất ngọt ngào hiện ra...&quot;
            </p>
          </div>
        </div>

        {/* Interactive Branch Options */}
        <div className="relative z-10 space-y-2 pt-1">
          <span className="text-[11px] font-extrabold text-on-surface-variant opacity-80 block">
            Lựa chọn của bé ở trang tiếp theo:
          </span>
          
          <button
            onClick={() => setSelectedBranch(1)}
            className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
              selectedBranch === 1
                ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-300'
                : 'bg-surface-container/40 dark:bg-[#181B25] border-outline-variant/30 text-on-surface opacity-80'
            }`}
          >
            <span className="line-clamp-1">Nhánh 1: Sâu Momi gặp cáo ranh ma ở rừng kẹo...</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>

          <button
            onClick={() => setSelectedBranch(2)}
            className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
              selectedBranch === 2
                ? 'bg-tertiary-container/15 border-tertiary-container text-emerald-600 dark:text-teal-300'
                : 'bg-surface-container/40 dark:bg-[#181B25] border-outline-variant/30 text-on-surface opacity-80'
            }`}
          >
            <span className="line-clamp-1">Nhánh 2: Bay qua thung lũng Bánh châm châm châm...</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Audio Player Component */}
        <div className="relative z-10 p-3 rounded-2xl bg-surface-container/60 dark:bg-[#181B25] border border-outline-variant/40 flex items-center gap-3">
          <button
            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
            className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <div className="flex-1 space-y-1">
            <div className="flex items-end gap-1 h-5 justify-between px-1">
              {[40, 70, 30, 90, 60, 100, 50, 80, 40, 90, 60, 30, 70, 50, 80, 40].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlayingAudio ? 'bg-rose-500 animate-pulse' : 'bg-outline-variant/60'
                  }`}
                  style={{ height: isPlayingAudio ? `${(h * (i % 3 + 1)) % 100}%` : '20%' }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant opacity-75 px-0.5">
              <span>Cô Họa Mi kể</span>
              <span>0:15 / 2:30</span>
            </div>
          </div>
        </div>

        {/* AI Mini Assistant Suggestion Bubble */}
        <div className="relative z-10 p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-400/40 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-400 text-on-secondary-container flex items-center justify-center shrink-0 shadow-xs">
            <Wand2 className="w-4 h-4" />
          </div>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-amber-800 dark:text-amber-300">
                Gợi ý Mini từ AI nhí
              </span>
              <span className="text-[10px] opacity-75 font-semibold text-amber-800 dark:text-amber-300">Ngẫu nhiên</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              &quot;Bé Momi ơi, nếu bé chọn học cách chia sẻ, chú gấu Momi sẽ cùng các bạn nhỏ làm một chiếc bánh kem khổng lồ thật ngon đó!&quot;
            </p>
            <button className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer">
              <span>+ Thêm gợi ý này vào truyện</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
