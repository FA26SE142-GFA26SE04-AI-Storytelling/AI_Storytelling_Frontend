'use client';
import '@/app/styles/features/staff/moderator-workspaces.css';
import { STORY_RATING_SECTIONS } from './moderationConfig';
import { ModerationWorkspaceShell, QueueSummaryCard } from './ModerationQueuePrimitives';
import StoryRatingReviewPanel from './StoryRatingReviewPanel';
import { useModerationSectionQueue } from './useModerationSectionQueue';

export default function StoryRatingsWorkspace() {
  const q = useModerationSectionQueue({ itemType: 'StoryRating', initialStatus: 'Open', pageSize: 10 });
  const current = q.selectedItem;
  const canOpenPackage = !!current
    && current.status === 'Claimed'
    && q.user?.id != null
    && current.claimedByUserId === q.user.id;

  const detail = !current ? null : canOpenPackage ? (
    <StoryRatingReviewPanel
      key={`${q.user?.id ?? 'anon'}:${current.id}`}
      id={current.id}
      queueItem={current}
      onDecision={() => {
        q.reload();
      }}
    />
  ) : (
    <QueueSummaryCard
      item={current}
      me={q.user?.id}
      myName={q.user?.fullName || q.user?.username}
      busy={q.claiming}
      claimLabel="Nhận và xử lý"
      onClaim={current.status === 'Pending' ? () => {
        void q.claimItem(current.id);
      } : undefined}
    />
  );

  return (
    <ModerationWorkspaceShell
      title="Đánh giá truyện"
      description="Xử lý đánh giá của phụ huynh bị báo cáo hoặc bị bộ lọc tự động giữ lại."
      sections={STORY_RATING_SECTIONS}
      status={q.status}
      onStatusChange={q.setStatus}
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
      detail={detail}
      claimFocusKey={q.claimFocusKey}
    />
  );
}
