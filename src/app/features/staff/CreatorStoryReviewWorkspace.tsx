'use client';
import './moderator-workspaces.css';
import { useState } from 'react';
import { LibraryBig } from 'lucide-react';
import { PUBLIC_STORY_SECTIONS } from './moderationConfig';
import { ModerationWorkspaceShell, QueueSummaryCard } from './ModerationQueuePrimitives';
import PublicStoryReviewPanel from './PublicStoryReviewPanel';
import { useModerationSectionQueue } from './useModerationSectionQueue';

/** Tài liệu 01 — Trang Duyệt truyện Creator (cố định PublicStoryReview, một status mỗi phân khu). */
export default function CreatorStoryReviewWorkspace({ go }: { go?: (pageId: string) => void }) {
  const q = useModerationSectionQueue({ itemType: 'PublicStoryReview', initialStatus: 'Pending', pageSize: 10 });
  const [outcomeBanner, setOutcomeBanner] = useState<'Approved' | 'ChangesRequested' | 'Rejected' | null>(null);
  const current = q.selectedItem;
  const mine = !!current && current.status === 'Claimed' && q.user?.id != null && current.claimedByUserId === q.user.id;

  const detail = !current ? null : mine ? (
    <PublicStoryReviewPanel
      key={`${q.user?.id ?? 'anon'}:${current.id}`}
      id={current.id}
      queueItem={current}
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
      claimLabel="Nhận duyệt"
      onClaim={current.status === 'Pending' ? () => {
        setOutcomeBanner(null);
        void q.claimItem(current.id);
      } : undefined}
    />
  );

  const banner = outcomeBanner === 'Approved' ? (
    <div className="notice ok mod-banner" role="status" data-inline-notice>
      <span>Đã duyệt và công khai truyện lên thư viện cộng đồng.</span>
      {go && (
        <button type="button" className="btn btn-s" onClick={() => go('published')}>
          <LibraryBig className="ic" />Mở Thư viện cộng đồng
        </button>
      )}
    </div>
  ) : outcomeBanner ? (
    <div className="notice ok mod-banner" role="status" data-inline-notice>
      <span>
        {outcomeBanner === 'ChangesRequested'
          ? 'Đã gửi yêu cầu chỉnh sửa cho Content Creator.'
          : 'Đã ghi nhận quyết định từ chối phiên bản.'}
      </span>
    </div>
  ) : null;

  return (
    <ModerationWorkspaceShell
      title="Duyệt truyện Creator"
      description="Tiếp nhận và duyệt phiên bản truyện do Content Creator gửi lên thư viện công khai."
      sections={PUBLIC_STORY_SECTIONS}
      status={q.status}
      onStatusChange={next => {
        setOutcomeBanner(null);
        q.setStatus(next);
      }}
      priority={q.priority}
      onPriorityChange={q.setPriority}
      showPriorityFilter={false}
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
      onReload={() => {
        setOutcomeBanner(null);
        q.reload();
      }}
      banner={banner}
      detail={detail}
    />
  );
}
