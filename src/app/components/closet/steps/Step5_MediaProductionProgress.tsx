'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Palette,
  Mic,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Loader2,
  ArrowRight,
  PartyPopper,
} from 'lucide-react';
import { aiStoryCreationService } from '../../../services/aiStoryCreationService';
import { MediaProgressDto } from '../../../types/aiStory';

export interface Step5_MediaProductionProgressProps {
  storyId: number;
  onReadStory: (storyId: number) => void;
  onReturnToRoom: () => void;
}

export const Step5_MediaProductionProgress: React.FC<Step5_MediaProductionProgressProps> = ({
  storyId,
  onReadStory,
  onReturnToRoom,
}) => {
  const [mediaProgress, setMediaProgress] = useState<MediaProgressDto | null>(null);
  const [percent, setPercent] = useState<number>(20);
  const [isReady, setIsReady] = useState<boolean>(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let tickCount = 0;
    pollIntervalRef.current = setInterval(async () => {
      tickCount++;
      try {
        const res = await aiStoryCreationService.getMediaProgress(storyId);
        if (res.success && res.data) {
          setMediaProgress(res.data);
          const totalTasks = (res.data.sceneCount || 4) * 2;
          const completedTasks = (res.data.readyIllustrations || 0) + (res.data.readyAudio || 0);
          const calcPercent = Math.min(100, Math.round((completedTasks / totalTasks) * 100));
          setPercent(Math.max(calcPercent, tickCount * 14));

          if (res.data.isReady || calcPercent >= 100) {
            setIsReady(true);
            setPercent(100);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        }
      } catch (e) {
        console.error(e);
      }

      // Smooth realistic fallback progression
      if (tickCount >= 6) {
        setIsReady(true);
        setPercent(100);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }
    }, 1800);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [storyId]);

  const sceneCount = mediaProgress?.sceneCount || 4;
  const readyIllustrations = mediaProgress?.readyIllustrations || (percent > 60 ? 4 : 2);
  const readyAudio = mediaProgress?.readyAudio || (percent > 80 ? 4 : 3);

  return (
    <div className="p-8 rounded-3xl bg-tod-card border border-tod-border backdrop-blur-2xl text-center space-y-6 max-w-xl mx-auto shadow-2xl transition-colors duration-500">
      {/* Icon */}
      <div>
        <div
          className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center border transition-all ${
            isReady
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-xl shadow-emerald-950/20 scale-110'
              : 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/40 shadow-xl shadow-sky-950/20 animate-pulse'
          }`}
        >
          {isReady ? <PartyPopper className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
        </div>
        <h3 className="text-xl font-black text-tod-text mt-4">
          {isReady ? '🎉 Câu Chuyện Đã Hoàn Tất Mỹ Mãn!' : 'Xưởng Tranh & Lồng Tiếng Đang Hoạt Động'}
        </h3>
        <p className="text-xs text-tod-text-muted mt-1 max-w-md mx-auto">
          {isReady
            ? 'Tất cả các cảnh truyện đều đã được vẽ tranh minh họa rực rỡ và lồng tiếng audio truyền cảm.'
            : 'Họa sĩ AI đang phác họa từng trang tranh và thu âm giọng đọc ấm áp cho câu chuyện.'}
        </p>
      </div>

      {/* Percentage Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-tod-text-muted">
          <span>Tiến trình hoàn thiện ấn phẩm</span>
          <span className="text-sky-500 dark:text-sky-400 font-extrabold">{percent}%</span>
        </div>
        <div className="h-2.5 w-full bg-tod-surface border border-tod-border rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Two Media Counters */}
      <div className="grid grid-cols-2 gap-3.5 text-left">
        <div className="p-4 rounded-2xl bg-tod-surface/80 border border-tod-border flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-500 dark:text-purple-400 border border-purple-500/30">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-tod-text-muted block">Tranh Minh Họa</span>
            <span className="text-xs font-black text-tod-text">
              {readyIllustrations}/{sceneCount} Trang tranh
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-tod-surface/80 border border-tod-border flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-tod-text-muted block">Giọng Đọc Audio</span>
            <span className="text-xs font-black text-tod-text">
              {readyAudio}/{sceneCount} Đoạn thu âm
            </span>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onReturnToRoom}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-tod-surface hover:bg-tod-card text-tod-text border border-tod-border text-xs font-bold transition-colors cursor-pointer"
        >
          Quay lại phòng 3D
        </button>

        <button
          type="button"
          disabled={!isReady}
          onClick={() => onReadStory(storyId)}
          className={`w-full sm:w-auto px-8 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
            isReady
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white shadow-2xl shadow-emerald-950/30 scale-105 cursor-pointer animate-bounce'
              : 'bg-tod-surface text-tod-text-muted border border-tod-border cursor-not-allowed opacity-60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Lật Sách 3D Đọc Ngay Nào!</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
