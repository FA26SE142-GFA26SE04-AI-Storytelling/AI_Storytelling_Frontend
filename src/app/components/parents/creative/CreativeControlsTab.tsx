'use client';

import React from 'react';
import { Sparkles, Play, Pause } from 'lucide-react';

export interface CreativeControlsTabProps {
  isPlayingAudio: boolean;
  setIsPlayingAudio: (val: boolean) => void;
  feedbackRating: 'like' | 'dislike' | null;
  setFeedbackRating: (val: 'like' | 'dislike' | null) => void;
}

export const CreativeControlsTab: React.FC<CreativeControlsTabProps> = ({
  isPlayingAudio,
  setIsPlayingAudio,
  feedbackRating,
  setFeedbackRating,
}) => {
  return (
    <div className="space-y-3 text-tod-text">
      <div className="p-3.5 rounded-2xl bg-tod-card border border-purple-500/30 flex flex-col gap-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-xs text-tod-text">Chủ Đề Trò Chuyện Tối Nay Với Bé</h3>
            <p className="text-[10px] text-purple-600 dark:text-purple-300 font-medium">
              Gợi ý từ AI dựa theo cốt truyện bé vừa đọc
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-tod-surface border border-tod-border text-xs text-tod-text leading-relaxed font-medium">
          "Hôm nay khi chú thỏ Bông nướng bánh quy và chia sẻ cho cả xóm làng, con cảm thấy hành động đó
          như thế nào? Nếu là con, con sẽ chia sẻ món quà nào cho các bạn ở lớp?"
        </div>

        {/* Audio sample toggle */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
            className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-700 dark:text-purple-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlayingAudio ? 'Tạm dừng giọng đọc' : 'Nghe gợi ý giọng nói'}</span>
          </button>

          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setFeedbackRating('like')}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                feedbackRating === 'like'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-300'
                  : 'bg-tod-surface border-tod-border text-tod-text-muted hover:text-tod-text'
              }`}
            >
              👍 Thích
            </button>
            <button
              type="button"
              onClick={() => setFeedbackRating('dislike')}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                feedbackRating === 'dislike'
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-600 dark:text-rose-300'
                  : 'bg-tod-surface border-tod-border text-tod-text-muted hover:text-tod-text'
              }`}
            >
              👎
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
