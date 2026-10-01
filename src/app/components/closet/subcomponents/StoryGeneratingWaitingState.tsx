'use client';

import React from 'react';
import { Wand2 } from 'lucide-react';

export interface StoryGeneratingWaitingStateProps {
  busy: boolean;
  error: string | null;
  onRefresh: () => void;
  onBackToOutline?: () => void;
}

export const StoryGeneratingWaitingState: React.FC<StoryGeneratingWaitingStateProps> = ({
  busy,
  error,
  onRefresh,
  onBackToOutline,
}) => {
  return (
    <div className="dashboard-glass-panel p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse">
          <Wand2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-tod-text">Bút thần AI đang viết câu chuyện...</h3>
          <p className="text-xs text-tod-text-muted mt-0.5">
            Hệ thống đang phát triển các tình tiết hấp dẫn từ dàn ý đã duyệt
          </p>
        </div>
      </div>

      {/* Animation & Progress Card */}
      <div className="dashboard-card p-6 border border-tod-border bg-tod-card/50 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-tod-text">
          <span>Tiến độ viết câu chuyện</span>
          <span className="text-amber-500 animate-pulse">Đang chắp bút...</span>
        </div>
        <div className="w-full bg-tod-surface h-2.5 rounded-full overflow-hidden border border-tod-border">
          <div className="bg-gradient-to-r from-amber-500 to-sky-500 h-full w-2/3 rounded-full animate-pulse" />
        </div>
        <p className="text-xs text-tod-text-muted italic">
          💡 Mẹo: Câu chuyện sẽ được tự động chia thành các hồi sinh động, lồng ghép bài học nhân văn cho bé.
        </p>
      </div>

      {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onRefresh}
          className="dashboard-card px-4 py-2.5 text-xs font-bold cursor-pointer"
        >
          Kiểm tra trạng thái
        </button>
        {onBackToOutline && (
          <button
            type="button"
            disabled={busy}
            onClick={onBackToOutline}
            className="dashboard-card px-4 py-2.5 text-xs font-bold text-tod-text-muted hover:text-tod-text cursor-pointer"
          >
            Quay lại dàn ý
          </button>
        )}
      </div>
    </div>
  );
};
