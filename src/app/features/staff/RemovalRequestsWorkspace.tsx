'use client';
import './moderator-workspaces.css';
import { useState } from 'react';
import { Archive } from 'lucide-react';
import { PUBLIC_STORY_REMOVAL_SECTIONS } from './moderationConfig';
import { ModerationWorkspaceShell, QueueSummaryCard } from './ModerationQueuePrimitives';
import PublicStoryRemovalPanel from './PublicStoryRemovalPanel';
import { useModerationSectionQueue } from './useModerationSectionQueue';

/** Tài liệu 07 — Trang Yêu cầu gỡ truyện (cố định PublicStoryRemoval, một status mỗi phân khu). */
export default function RemovalRequestsWorkspace({ go }: { go?: (pageId: string) => void }) {
  const q = useModerationSectionQueue({ itemType: 'PublicStoryRemoval', initialStatus: 'Pending', pageSize: 10 });
  const [outcomeBanner, setOutcomeBanner] = useState<'Approved' | 'Rejected' | null>(null);
  const current = q.selectedItem;
  const mine = !!current && current.status === 'Claimed' && q.user?.id != null && current.claimedByUserId === q.user.id;

  const summaryNotice = current?.status === 'Approved'
    ? 'Yêu cầu gỡ truyện đã được chấp thuận (không phải quyết định duyệt đăng). Kết quả này không khẳng định toàn bộ trạng thái công khai hiện tại của truyện.'
    : current?.status === 'Rejected'
      ? 'Yêu cầu gỡ đã bị từ chối (không phải từ chối xuất bản và không khẳng định truyện vẫn công khai nếu đã bị gỡ qua báo cáo khác).'
      : undefined;

  const detail = !current ? null : mine ? (
    <PublicStoryRemovalPanel
      key={`${q.user?.id ?? 'anon'}:${current.id}`}
      id={current.id}
      queueItem={current}
      onBack={() => q.setSelectedId(null)}
      onDecision={outcome => {
        setOutcomeBanner(outcome ?? null);
        q.reload();
      }}
    />
  ) : (
    <QueueSummaryCard
      item={current}
      me={q.user?.id}
      myName={q.user?.fullName || q.user?.username}
      busy={q.claiming}
      claimLabel="Nhận xử lý"
      summaryNotice={summaryNotice}
      onClaim={current.status === 'Pending' ? () => {
        setOutcomeBanner(null);
        void q.claimItem(current.id);
      } : undefined}
    />
  );

  const banner = outcomeBanner === 'Approved' ? (
    <div className="notice ok mod-banner" role="status" data-inline-notice>
      <span>Đã chấp thuận gỡ truyện khỏi thư viện công khai.</span>
      {go && (
        <button type="button" className="btn btn-s" onClick={() => go('removal-records')}>
          <Archive className="ic" />Mở Hồ sơ gỡ truyện
        </button>
      )}
    </div>
  ) : outcomeBanner === 'Rejected' ? (
    <div className="notice ok mod-banner" role="status" data-inline-notice>
      <span>
        Đã ghi nhận không chấp thuận yêu cầu gỡ. Lưu ý: kết quả này không khẳng định truyện vẫn công khai nếu có xử lý vi phạm khác.
      </span>
    </div>
  ) : null;

  return (
    <ModerationWorkspaceShell
      title="Yêu cầu gỡ truyện"
      description="Tiếp nhận và xử lý yêu cầu gỡ truyện công khai từ Creator."
      sections={PUBLIC_STORY_REMOVAL_SECTIONS}
      status={q.status}
      onStatusChange={next => {
        setOutcomeBanner(null);
        q.setStatus(next);
      }}
      priority={q.priority}
      onPriorityChange={q.setPriority}
      onlyOverdue={q.onlyOverdue}
      onOnlyOverdueChange={q.setOnlyOverdue}
      items={q.items}
      selectedId={q.selectedId}
      onSelect={q.setSelectedId}
      currentUserId={q.user?.id}
      loading={q.loading}
      error={q.error}
      actionNote={q.actionNote}
      totalCount={q.totalCount}
      pageIndex={q.pageIndex}
      totalPages={q.totalPages}
      hasNextPage={q.hasNextPage}
      onPageChange={q.setPageIndex}
      onReload={q.reload}
      banner={banner}
      detail={detail}
    />
  );
}
