'use client';

import React from 'react';
import { MessageSquare, Play, Award } from 'lucide-react';

interface ConversationTopicSectionProps {
  isPlayingAudioSample: boolean;
  setIsPlayingAudioSample: (val: boolean) => void;
  feedbackRating: string | null;
  setFeedbackRating: (val: string) => void;
}

export const ConversationTopicSection: React.FC<ConversationTopicSectionProps> = ({
  isPlayingAudioSample,
  setIsPlayingAudioSample,
  feedbackRating,
  setFeedbackRating,
}) => {
  return (
    <div className="space-y-6">
      {/* Box 1: Chủ đề trò chuyện cùng con */}
      <div className="relative group">
        {/* Glowing Blur Backdrop Layer */}
        <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 blur-xl opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none" />

        <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-6 border border-outline-variant/40 shadow-xs space-y-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-sm sm:text-base text-on-surface">
                Chủ đề trò chuyện cùng con
              </h3>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase">
              💬 GỢI Ý HÔM NAY
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/40 text-xs text-on-surface leading-relaxed italic font-medium">
            &quot;Khi nghe truyện Lâu Đài Kẹo Ngọt, mẹ hãy hỏi bé: &apos;Nếu gặp bạn chim cánh cụt bị trượt ngã qua băng, bé sẽ chia sẻ phần bánh của mình như thế nào nhỉ?&apos;&quot;
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPlayingAudioSample(!isPlayingAudioSample)}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlayingAudioSample
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isPlayingAudioSample ? 'Đang phát mẫu...' : 'Nghe mẫu giọng kể thích hợp'}</span>
            </button>
            <button className="px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-500 text-on-secondary-container font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer">
              <span>💡 Lưu nhật ký</span>
            </button>
          </div>

          <div className="pt-2 border-t border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-extrabold text-on-surface-variant opacity-80">
              Gợi ý này có ích với mẹ không?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFeedbackRating('like')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  feedbackRating === 'like'
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'border-outline-variant/40 bg-surface-container text-on-surface'
                }`}
              >
                Rất thích 🌟
              </button>
              <button
                onClick={() => setFeedbackRating('normal')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  feedbackRating === 'normal'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'border-outline-variant/40 bg-surface-container text-on-surface'
                }`}
              >
                Bình thường 😐
              </button>
              <button
                onClick={() => setFeedbackRating('change')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  feedbackRating === 'change'
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'border-outline-variant/40 bg-surface-container text-on-surface'
                }`}
              >
                Đổi chủ đề 🔄
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Box 2: Huy Hiệu Đạt: Bạn Kể Chuyện Bạc */}
      <div className="relative group">
        {/* Glowing Blur Backdrop Layer */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-slate-400/20 to-amber-400/20 blur-lg opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />

        <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-5 border border-outline-variant/40 shadow-xs flex items-center gap-4 overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-400 text-slate-800 flex items-center justify-center shrink-0 shadow-md">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-on-surface">
                Huy Hiệu Đạt: Bạn Kể Chuyện Bạc
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 shrink-0">
                Mới đạt tuần này
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant opacity-80 leading-relaxed">
              Bé cùng mẹ đã duy trì thói quen 5 ngày nghe truyện cùng nhau liên tiếp. Chỉ còn 2 ngày nữa để đạt Huy Hiệu Vàng!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
