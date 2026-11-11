'use client';
import type { ReviewPackage } from '@/app/services/moderationService';
import type { QueueItem } from '@/app/types/staff';
import { formatSubmittedAt, reviewPackageSubmittedAt, reviewPackageSubmitterLabel, reviewPackageTitle } from './moderationQueueDisplay';

export function ReviewPanelHeader({
  item,
  queueItem,
  message,
  sourceTag,
}: {
  item: ReviewPackage;
  queueItem?: QueueItem;
  message: string;
  sourceTag?: string | null;
}) {
  const { data } = item;
  const title = reviewPackageTitle(item, queueItem);
  const authorLine = reviewPackageSubmitterLabel(item, queueItem);
  const submittedAt = reviewPackageSubmittedAt(item, queueItem);
  const expiryIso = 'claimExpiresAt' in data ? data.claimExpiresAt : queueItem?.claimExpiresAt;

  return (
    <div className="st-group">
      <h3 className="st-detail-title">{title}</h3>
      {authorLine && <span className="st-item-author">{authorLine}</span>}
      <div className="row st-wrap">
        {sourceTag && <span className="pill draft">{sourceTag}</span>}
        <span className="st-review-meta">Thời điểm gửi: {formatSubmittedAt(submittedAt)}</span>
        {expiryIso && (
          <span className="pill wait" style={{ width: 'fit-content' }}>
            Giữ mục đến {new Date(expiryIso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      {message && <div className="notice" role="status" data-inline-notice>{message}</div>}
    </div>
  );
}
