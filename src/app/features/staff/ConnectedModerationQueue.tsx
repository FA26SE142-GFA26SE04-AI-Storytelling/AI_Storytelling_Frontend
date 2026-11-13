'use client';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import Frog from '@/app/components/brand/Frog';
import Select from '@/app/components/Select';
import { useAuth } from '@/app/context/AuthContext';
import { useRiseIn } from '@/app/lib/motion';
import { staffService } from '@/app/services/staffService';
import type { ReviewKind } from '@/app/services/moderationService';
import type { QueueItem, QueueItemStatus, QueueItemType } from '@/app/types/staff';
import { MODERATION_TYPE_LABELS, moderationStatusLabel } from './moderationConfig';
import { QueueItemRow, QueueSummaryCard } from './ModerationQueuePrimitives';
import ReviewPanel from './ReviewPanel';
import { Notice, Page, useAction } from './ui';

export { QueueItemRow };

export function DetailCard({
  item,
  me,
  myName,
  busy,
  onClaim,
  userRole,
}: {
  item: QueueItem;
  me?: number;
  myName?: string;
  busy: boolean;
  onClaim?: () => void;
  userRole?: string;
}) {
  const cannotClaim = userRole === 'Administrator' && item.itemType === 'ContentReport';
  return (
    <QueueSummaryCard
      item={item}
      me={me}
      myName={myName}
      busy={busy}
      onClaim={item.status === 'Pending' && !cannotClaim ? onClaim : undefined}
    />
  );
}

const ALL_TYPES: QueueItemType[] = [
  'PublicStoryReview',
  'GrayZoneStory',
  'ContentReport',
  'PublicStoryRemoval',
  'RoadmapTemplateReview',
];

const ALL_STATUSES: QueueItemStatus[] = [
  'Pending',
  'Claimed',
  'Escalated',
  'Approved',
  'ChangesRequested',
  'Rejected',
  'Cleared',
  'Blocked',
  'Dismissed',
  'Archived',
  'Withdrawn',
  'Removed',
  'Closed',
];

export default function ConnectedModerationQueue({
  allowedTypes,
  title = 'Hàng đợi kiểm duyệt',
  description,
}: {
  allowedTypes?: QueueItemType[];
  title?: string;
  description?: string;
}) {
  const { user } = useAuth();
  const visibleTypes = allowedTypes && allowedTypes.length > 0 ? allowedTypes : ALL_TYPES;
  const [status, setStatus] = useState<QueueItemStatus>('Pending');
  const [kind, setKind] = useState<QueueItemType | ''>(allowedTypes?.length ? allowedTypes[0] : '');
  const [pageIndex, setPageIndex] = useState(1);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => {
    setSelected(null);
    setRevision(n => n + 1);
  }, []);
  const { note, busy, run } = useAction(reload);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setItems([]);
    setSelected(null);
    setError('');
    setLoading(true);
    setHasNext(false);
    setTotalCount(0);
    setTotalPages(0);
    const effectiveType = kind || (allowedTypes?.length === 1 ? allowedTypes[0] : undefined);
    void staffService.queue(
      { status, itemType: effectiveType, pageIndex, pageSize: 6 },
      controller.signal,
    ).then(r => {
      if (!alive) return;
      setLoading(false);
      if (!r.success || !r.data) {
        setError(r.message);
        return;
      }
      setItems(r.data.items);
      setHasNext(r.data.hasNextPage);
      setTotalCount(r.data.totalCount);
      setTotalPages(r.data.totalPages);
    });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [status, kind, pageIndex, revision, user?.id, allowedTypes]);

  const listRef = useRiseIn<HTMLDivElement>('.st-item', [items], { delay: 40, distance: 10 });
  const current = items.find(i => i.id === selected);
  const activeType = (kind || current?.itemType || 'PublicStoryReview') as string;
  const canOpen =
    !!current &&
    visibleTypes.includes(current.itemType as QueueItemType) &&
    current.status === 'Claimed' &&
    current.claimedByUserId === user?.id;
  const canClaim = !(user?.role === 'Administrator' && current?.itemType === 'ContentReport');

  const typeOptions: { value: QueueItemType | ''; label: string }[] = allowedTypes?.length
    ? visibleTypes.map(k => ({ value: k, label: MODERATION_TYPE_LABELS[k] }))
    : [{ value: '', label: 'Tất cả loại mục' }, ...visibleTypes.map(k => ({ value: k, label: MODERATION_TYPE_LABELS[k] }))];

  return (
    <Page fit title={title}>
      {description && (
        <div className="st-group" style={{ paddingTop: 0, paddingBottom: 8 }}>
          <h2 className="display" style={{ margin: 0, fontSize: 'var(--fs-xl)' }}>{title}</h2>
          <p className="sub">{description}</p>
        </div>
      )}
      <Notice note={note} />
      {error && <div className="notice err" role="alert">{error}</div>}
      <div className="st-filters">
        <Select<QueueItemType | ''>
          ariaLabel="Loại mục"
          value={kind}
          options={typeOptions}
          onChange={v => { setKind(v); setPageIndex(1); }}
        />
        <Select<QueueItemStatus>
          ariaLabel="Trạng thái"
          value={status}
          options={ALL_STATUSES.map(s => ({ value: s, label: moderationStatusLabel(activeType, s) }))}
          onChange={v => { setStatus(v); setPageIndex(1); }}
        />
        <button type="button" className="btn btn-g" aria-label="Tải lại" onClick={reload}>
          <RefreshCw className="ic" />
        </button>
        {visibleTypes.includes('PublicStoryReview') && (
          <button
            type="button"
            className="btn btn-s"
            onClick={() => { setStatus('Pending'); setKind('PublicStoryReview'); setPageIndex(1); reload(); }}
          >
            Truyện Creator chờ duyệt
          </button>
        )}
        <span className="sub" role="status">
          {loading ? 'Đang tải hàng đợi…' : !error ? `${totalCount} mục · Trang ${pageIndex}/${Math.max(1, totalPages)}` : ''}
        </span>
      </div>
      <div className="st-split fill">
        <div className="st-list" ref={listRef}>
          {items.map(i => (
            <QueueItemRow
              key={i.id}
              item={i}
              selected={selected === i.id}
              me={user?.id}
              onSelect={() => setSelected(i.id)}
            />
          ))}
          {!items.length && !error && !loading && <p>Không có mục nào ở trang này.</p>}
          <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
            <button type="button" className="btn btn-g" aria-label="Trang trước" disabled={loading || pageIndex === 1} onClick={() => setPageIndex(p => p - 1)}>
              <ChevronLeft className="ic" />
            </button>
            <span className="sub">Trang {pageIndex}/{Math.max(1, totalPages)}</span>
            <button type="button" className="btn btn-g" aria-label="Trang tiếp" disabled={loading || !hasNext} onClick={() => setPageIndex(p => p + 1)}>
              <ChevronRight className="ic" />
            </button>
          </div>
        </div>
        {current ? (
          current.itemType === 'CommunitySubmission' ? (
            <div className="st-card st-empty">
              <b className="display">Loại mục này không còn được hỗ trợ</b>
            </div>
          ) : canOpen ? (
            <ReviewPanel
              key={`${user?.id}:${current.id}`}
              kind={current.itemType as ReviewKind}
              id={current.id}
              queueItem={current}
              onDecision={reload}
            />
          ) : (
            <DetailCard
              item={current}
              me={user?.id}
              myName={user?.fullName || user?.username}
              busy={busy}
              userRole={user?.role}
              onClaim={canClaim ? () => void run(() => staffService.claim(current.id), 'Đã nhận mục; chọn trạng thái Đang xử lý để tiếp tục.') : undefined}
            />
          )
        ) : (
          <div className="st-card st-empty">
            <Frog size={120} mood="think" />
            <b className="display">Chọn một mục để xem</b>
            <span className="sub">
              {items.length
                ? 'Bấm vào một mục bên trái để xem chi tiết và nhận xử lý.'
                : error
                  ? 'Chưa tải được hàng đợi. Bấm nút tải lại để thử lại.'
                  : 'Hiện chưa có mục nào cần xử lý.'}
            </span>
          </div>
        )}
      </div>
    </Page>
  );
}
