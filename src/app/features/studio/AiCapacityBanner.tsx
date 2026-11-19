'use client';

import { RefreshCw, RotateCcw } from 'lucide-react';
import {
  AI_STORY_CONCURRENCY_LIMIT_MESSAGE,
  type AiGenerationCapacityDto,
} from '@/app/services/aiStoryCreationService';

type Props = {
  capacity: AiGenerationCapacityDto | null;
  loading: boolean;
  limitRejected: boolean;
  onRefresh: () => void;
  onRetrySubmit?: () => void;
  onOpenStory: (storyId: number) => void;
  busy?: boolean;
};

export default function AiCapacityBanner({
  capacity,
  loading,
  limitRejected,
  onRefresh,
  onRetrySubmit,
  onOpenStory,
  busy = false,
}: Props) {
  const isAtLimit = limitRejected || (capacity !== null && !capacity.canStartNewStory);
  if (!isAtLimit && (!capacity || capacity.activeCount === 0)) {
    return null;
  }

  return (
    <div
      className={isAtLimit ? 'notice err' : 'notice'}
      role={isAtLimit ? 'alert' : 'status'}
      data-inline-notice
      style={{ display: 'grid', gap: 8 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span>
          {isAtLimit
            ? AI_STORY_CONCURRENCY_LIMIT_MESSAGE
            : `Đang thực hiện ${capacity?.activeCount ?? 0}/${capacity?.limit ?? 2} truyện AI.`}
        </span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-s" disabled={loading || busy} onClick={onRefresh}>
            <RefreshCw className="ic" />
            {loading ? 'Đang cập nhật…' : 'Làm mới'}
          </button>
          {isAtLimit && onRetrySubmit && (
            <button type="button" className="btn btn-p" disabled={busy || loading} onClick={onRetrySubmit}>
              <RotateCcw className="ic" />
              Thử gửi lại
            </button>
          )}
        </div>
      </div>
      {capacity && capacity.activeStories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--fs-xs)', opacity: 0.85 }}>Truyện đang mở:</span>
          {capacity.activeStories.map((item) => (
            <button
              key={item.storyId}
              type="button"
              className="btn btn-s"
              onClick={() => onOpenStory(item.storyId)}
            >
              {item.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
