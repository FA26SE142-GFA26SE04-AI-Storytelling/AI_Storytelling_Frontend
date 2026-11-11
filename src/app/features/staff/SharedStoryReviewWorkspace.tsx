'use client';
import './moderator-workspaces.css';
import { useState } from 'react';
import { COMMUNITY_SUBMISSION_SECTIONS } from './moderationConfig';
import { ModerationWorkspaceShell, QueueSummaryCard } from './ModerationQueuePrimitives';
import CommunitySubmissionReviewPanel from './CommunitySubmissionReviewPanel';
import { useModerationSectionQueue } from './useModerationSectionQueue';

/** Tài liệu 02 — Trang Duyệt truyện chia sẻ (cố định CommunitySubmission, ẩn danh gia đình/trẻ, một status mỗi khu). */
export default function SharedStoryReviewWorkspace() {
  const q = useModerationSectionQueue({ itemType: 'CommunitySubmission', initialStatus: 'Pending', pageSize: 10 });
  const [outcomeBanner, setOutcomeBanner] = useState<'Approved' | 'Rejected' | null>(null);
  const current = q.selectedItem;
  const mine = !!current && current.status === 'Claimed' && q.user?.id != null && current.claimedByUserId === q.user.id;

  const detail = !current ? null : mine ? (
    <CommunitySubmissionReviewPanel
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

  const banner = outcomeBanner ? (
    <div className="notice ok mod-banner" role="status" data-inline-notice>
      <span>
        {outcomeBanner === 'Approved'
          ? 'Đã duyệt chia sẻ lên cộng đồng.'
          : 'Đã ghi nhận quyết định từ chối chia sẻ.'}
      </span>
    </div>
  ) : null;

  return (
    <ModerationWorkspaceShell
      title="Duyệt truyện chia sẻ"
      description="Kiểm duyệt truyện gia đình chia sẻ lên cộng đồng: bảo đảm không lộ thông tin cá nhân và phù hợp độ tuổi."
      sections={COMMUNITY_SUBMISSION_SECTIONS}
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
      onReload={() => {
        setOutcomeBanner(null);
        q.reload();
      }}
      banner={banner}
      detail={detail}
    />
  );
}
