'use client';
import './moderator-workspaces.css';
import { useState } from 'react';
import { ROADMAP_REVIEW_SECTIONS } from './moderationConfig';
import { ModerationWorkspaceShell, QueueSummaryCard } from './ModerationQueuePrimitives';
import RoadmapReviewPanel from './RoadmapReviewPanel';
import { useModerationSectionQueue } from './useModerationSectionQueue';

/** Tài liệu 08 — Phân khu Duyệt lộ trình (cố định RoadmapTemplateReview, một status mỗi mục, giữ đủ mọi Claimed). */
export default function RoadmapReviewWorkspace() {
  const q = useModerationSectionQueue({ itemType: 'RoadmapTemplateReview', initialStatus: 'Pending', pageSize: 10 });
  const [outcomeBanner, setOutcomeBanner] = useState<'Approved' | 'ChangesRequested' | 'Rejected' | null>(null);
  const current = q.selectedItem;
  const mine = !!current && current.status === 'Claimed' && q.user?.id != null && current.claimedByUserId === q.user.id;

  const summaryNotice = current?.status === 'Pending'
    ? 'Lộ trình do bạn tự tạo sẽ không thể tự nhận duyệt theo quy tắc hệ thống.'
    : current?.status && ['Approved', 'Rejected', 'ChangesRequested', 'Withdrawn', 'Closed'].includes(current.status)
      ? 'Kết quả hàng đợi chỉ hiển thị tóm tắt hồ sơ kiểm duyệt; không thay bằng dữ liệu lộ trình đang chỉnh sửa hiện tại.'
      : undefined;

  const detail = !current ? null : mine ? (
    <RoadmapReviewPanel
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
        {outcomeBanner === 'Approved'
          ? 'Đã duyệt và phát hành lộ trình mẫu.'
          : outcomeBanner === 'ChangesRequested'
            ? 'Đã gửi yêu cầu chỉnh sửa cho người soạn lộ trình.'
            : 'Đã ghi nhận quyết định từ chối hồ sơ lộ trình.'}
      </span>
    </div>
  ) : null;

  return (
    <ModerationWorkspaceShell
      title="Duyệt lộ trình mẫu"
      description="Tiếp nhận và duyệt các lộ trình mẫu do Moderator khác gửi lên (không tự duyệt bộ do mình tạo)."
      sections={ROADMAP_REVIEW_SECTIONS}
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
