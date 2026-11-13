'use client';
import './moderator-workspaces.css';
import { useState } from 'react';
import { CONTENT_REPORT_SECTIONS } from './moderationConfig';
import { ModerationWorkspaceShell, QueueSummaryCard } from './ModerationQueuePrimitives';
import ContentReportReviewPanel from './ContentReportReviewPanel';
import { useModerationSectionQueue } from './useModerationSectionQueue';

/** Tài liệu 06 — Trang Báo cáo nội dung (cố định ContentReport). */
export default function ContentReportsWorkspace() {
  const q = useModerationSectionQueue({ itemType: 'ContentReport', initialStatus: 'Pending', pageSize: 10 });
  const [outcomeBanner, setOutcomeBanner] = useState<'Dismissed' | 'Archived' | null>(null);
  const current = q.selectedItem;
  const canOpenPackage = !!current
    && current.status === 'Claimed'
    && q.user?.id != null
    && current.claimedByUserId === q.user.id;

  const summaryNotice = current?.status === 'Archived'
    ? 'Hồ sơ báo cáo đã xử lý gỡ vi phạm. Truyện đã được ngừng hiển thị và các hồ sơ liên quan đã được đóng.'
    : current?.status === 'Dismissed'
      ? 'Báo cáo đã được bác; nội dung giữ nguyên trạng thái.'
      : undefined;

  const detail = !current ? null : canOpenPackage ? (
    <ContentReportReviewPanel
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
      claimLabel="Nhận xử lý"
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
        {outcomeBanner === 'Dismissed'
          ? 'Đã bác báo cáo; nội dung được giữ nguyên.'
          : 'Đã xử lý gỡ nội dung vi phạm và lưu hồ sơ báo cáo.'}
      </span>
    </div>
  ) : null;

  return (
    <ModerationWorkspaceShell
      title="Báo cáo nội dung"
      description="Tiếp nhận và xử lý báo cáo vi phạm nội dung từ cộng đồng và rà soát thư viện."
      sections={CONTENT_REPORT_SECTIONS}
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
