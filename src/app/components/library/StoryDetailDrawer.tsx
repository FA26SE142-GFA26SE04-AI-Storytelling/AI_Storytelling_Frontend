'use client';

import React from 'react';
import { BookOpen, Headphones, Play, Pause, Heart } from 'lucide-react';
import { ExtendedStoryItem } from './StoryListDrawer';

export interface StoryDetailDrawerProps {
  story: ExtendedStoryItem;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isPlayingAudio: boolean;
  onToggleAudio: () => void;
  audioProgress: number;
  onAudioProgressChange: (progress: number) => void;
  onOpenReader: (story: ExtendedStoryItem) => void;
}

export const StoryDetailDrawer: React.FC<StoryDetailDrawerProps> = ({
  story,
  isFavorite,
  onToggleFavorite,
  isPlayingAudio,
  onToggleAudio,
  audioProgress,
  onAudioProgressChange,
  onOpenReader,
}) => {
  return (
    <div className="bookshelf-right-drawer pointer-events-auto w-full lg:w-[360px] rounded-3xl bg-tod-surface/90 backdrop-blur-2xl border border-tod-border shadow-2xl text-tod-text p-4 flex flex-col gap-3.5 transition-colors duration-500">
      <div className="bookshelf-detail-content flex flex-col gap-3.5">
        {/* 1. Book Cover & Badges */}
        <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-tod-card shadow-inner group">
          <img
            src={story.imageUrl}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-[9px] font-black text-amber-300">
              {story.badge}
            </span>
            <button
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500 text-white shadow-lg'
                  : 'bg-black/60 text-white hover:bg-black/80'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
            </button>
          </div>

          <div className="absolute bottom-2.5 left-2.5 right-2.5">
            <h2 className="font-black text-sm sm:text-base text-white leading-snug drop-shadow-md">
              {story.title}
            </h2>
            <p className="text-[10px] text-amber-200/90 font-semibold mt-0.5">{story.tag}</p>
          </div>
        </div>

        {/* 2. Story Description */}
        <p className="text-[11px] text-tod-text leading-relaxed bg-tod-card/80 p-2.5 rounded-2xl border border-tod-border">
          {story.description}
        </p>

        {/* 3. Bedtime Audio Player */}
        <div className="p-3 rounded-2xl bg-tod-card/80 border border-sky-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-500 dark:text-sky-400">
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-tod-text">Audio Diễn Cảm & Ru Ngủ</span>
                <p className="text-[8px] text-tod-text-muted">Giọng đọc ấm áp cho bé</p>
              </div>
            </div>

            <button
              onClick={onToggleAudio}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-white flex items-center justify-center shadow-md shadow-sky-500/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>
          </div>

          {/* Slider */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[8px] font-mono text-tod-text-muted">01:45</span>
            <input
              type="range"
              min="0"
              max="100"
              value={audioProgress}
              onChange={(e) => onAudioProgressChange(Number(e.target.value))}
              className="flex-1 h-1 bg-tod-surface border border-tod-border rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <span className="text-[8px] font-mono text-tod-text-muted">08:00</span>
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpenReader(story)}
            className="py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 fill-zinc-950" />
            <span>Đọc Truyện</span>
          </button>

          <button
            onClick={onToggleAudio}
            className="py-2.5 rounded-2xl bg-tod-card hover:bg-tod-surface border border-tod-border text-tod-text font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5 text-sky-500" />
            <span>{isPlayingAudio ? 'Tạm Dừng' : 'Nghe Audio'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
