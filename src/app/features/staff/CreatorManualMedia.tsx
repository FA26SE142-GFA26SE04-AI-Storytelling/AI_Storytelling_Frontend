'use client';
import { useCallback } from 'react';
import type { CreatorDraft } from '@/app/types/creator';
import type { MediaProgressDto } from '@/app/types/aiStory';
import MediaProgress from '@/app/features/studio/MediaProgress';

/**
 * Bước 3 của truyện thủ công Creator: theo dõi AI tạo tranh, giọng đọc và xác nhận gói media.
 * Nội dung được chốt ở bước 2 (CreatorContentCheck), nên chỉ có job media khi truyện đã rời trạng thái Draft.
 */
export default function CreatorManualMedia({ draft, disabled, onWorkingChange, onStatus }: {
  draft: CreatorDraft; disabled: boolean; onWorkingChange: (value: boolean) => void; onStatus: (value: string) => void;
}) {
  const active = ['MediaProcessing', 'MediaReview', 'Ready'].includes(draft.status ?? '');
  const ready = useCallback((p: MediaProgressDto) => onStatus(p.storyStatus), [onStatus]);
  return <MediaProgress storyId={draft.storyId} versionId={draft.selectedVersionId} active={active} disabled={disabled} stepNo={3}
    onWorkingChange={onWorkingChange} onReady={ready}
    idle={<p className="notice warn" role="status">Hãy chốt nội dung ở bước 2 trước, AI sẽ tạo tranh và giọng đọc sau đó.</p>} />;
}
