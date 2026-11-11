'use client';
import './moderator-workspaces.css';
import { useState } from 'react';
import { GRAY_ZONE_SECTIONS } from './moderationConfig';
import { ModerationWorkspaceShell, QueueSummaryCard } from './ModerationQueuePrimitives';
import GrayZoneReviewPanel from './GrayZoneReviewPanel';
import { useModerationSectionQueue } from './useModerationSectionQueue';

/** Tài liệu 05 — Trang Kiểm tra vùng xám (cố định GrayZoneStory, giữ đủ tất cả Claimed kèm nhãn người giữ). */
export default function GrayZoneReviewWorkspace() {
  const q = useModerationSectionQueue({ itemType: 'GrayZoneStory', initialStatus: 'Pending', pageSize: 10 });
  const [outcomeBanner, setOutcomeBanner] = useState<'Cleared' | 'Blocked' | null>(null);
  const current = q.selectedItem;
  const mine = !!current && current.status === 'Claimed' && q.user?.id != null && current.claimedByUserId === q.user.id;

  const summaryNotice = current?.status === 'Cleared'
    ? 'Hồ sơ vùng xám đã được cho phép tiếp tục. Quyết định này KHÔNG xuất bản truyện ra thư viện công khai.'
    : current?.status === 'Blocked'
      ? 'Hồ sơ vùng xám đã bị chặn theo quyết định kiểm duyệt.'
      : undefined;

  const detail = !current ? null : mine ? (
    <GrayZoneReviewPanel
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
      claimLabel="Nhận kiểm tra"
      summaryNotice={summaryNotice}
      onClaim={current.status === 'Pending' ? () => {
        setOutcomeBanner(null);
        void q.claimItem(current.id);
      } : undefined}
    />
  );

  const banner = outcomeBanner ? (
    <div className="notice ok mod-banner" role="status" data-inline-notice>
      <span>
        {outcomeBanner === 'Cleared'
          ? 'Đã cho phép hồ sơ vùng xám tiếp tục. Quyết định này chỉ mở khóa luồng nguồn, KHÔNG xuất bản truyện lên thư viện công khai.'
          : 'Đã ghi nhận quyết định chặn nội dung vùng xám.'}
      </span>
    </div>
  ) : null;

  return (
    <ModerationWorkspaceShell
      title="Kiểm tra vùng xám"
      description="Kiểm tra các phiên bản rơi vào vùng xám an toàn trước khi luồng nguồn được phép đi tiếp."
      sections={GRAY_ZONE_SECTIONS}
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
