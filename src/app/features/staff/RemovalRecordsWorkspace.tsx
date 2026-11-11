'use client';
import './moderator-workspaces.css';
import { useState } from 'react';
import Select from '@/app/components/Select';
import { REMOVAL_RECORD_SOURCES, type RemovalRecordSourceDef } from './moderationConfig';
import { ModerationQueueFrame, QueueSummaryCard } from './ModerationQueuePrimitives';
import { useModerationSectionQueue, type QueuePriorityFilter } from './useModerationSectionQueue';

const PRIORITY_OPTIONS: { value: QueuePriorityFilter; label: string }[] = [
  { value: '', label: 'Mọi ưu tiên' },
  { value: 'High', label: 'Ưu tiên cao' },
  { value: 'Medium', label: 'Ưu tiên vừa' },
  { value: 'Low', label: 'Ưu tiên thấp' },
];

/** Tài liệu 04 — Hồ sơ gỡ truyện: 3 danh sách tóm tắt độc lập theo nguồn, không gộp hay khử trùng storyId. */
export default function RemovalRecordsWorkspace() {
  const [sourceId, setSourceId] = useState<RemovalRecordSourceDef['id']>(REMOVAL_RECORD_SOURCES[0].id);
  const activeSource = REMOVAL_RECORD_SOURCES.find(s => s.id === sourceId) ?? REMOVAL_RECORD_SOURCES[0];

  return (
    <RemovalRecordSourceView
      key={activeSource.id}
      source={activeSource}
      onSelectSource={setSourceId}
    />
  );
}

function RemovalRecordSourceView({
  source,
  onSelectSource,
}: {
  source: RemovalRecordSourceDef;
  onSelectSource: (id: RemovalRecordSourceDef['id']) => void;
}) {
  const q = useModerationSectionQueue({
    itemType: source.itemType,
    initialStatus: source.status,
    pageSize: 10,
  });
  const current = q.selectedItem;

  const sidebar = (
    <aside className="mod-nav" aria-label="Nguồn hồ sơ gỡ truyện">
      <div className="mod-nav-group">
        <span className="mod-nav-title">Theo luồng kết thúc</span>
        {REMOVAL_RECORD_SOURCES.map(entry => {
          const active = entry.id === source.id;
          return (
            <button
              key={entry.id}
              type="button"
              className={active ? 'on' : ''}
              aria-current={active ? 'page' : undefined}
              onClick={() => onSelectSource(entry.id)}
            >
              <span>{entry.label}</span>
              {active && !q.loading && !q.error && <em>{q.totalCount}</em>}
            </button>
          );
        })}
      </div>
    </aside>
  );

  const filters = (
    <div className="mod-filter-row">
      <Select<QueuePriorityFilter>
        ariaLabel="Lọc theo mức ưu tiên"
        value={q.priority}
        options={PRIORITY_OPTIONS}
        onChange={q.setPriority}
      />
    </div>
  );

  const banner = (
    <div className="notice mod-banner" role="status" data-inline-notice>
      <span>
        Hiển thị 2 danh sách hồ sơ kết thúc độc lập trên hàng đợi ({source.itemType}/{source.status}), không gộp theo{' '}
        <code>storyId</code> và chưa phản ánh trạng thái công khai hiện tại. API tóm tắt chưa trả về ngày ra quyết định,
        người ra quyết định hoặc lý do gỡ chi tiết.
      </span>
    </div>
  );

  const detail = current ? (
    <QueueSummaryCard
      item={current}
      me={q.user?.id}
      myName={q.user?.fullName || q.user?.username}
      busy={false}
      summaryNotice={source.summaryNotice}
    />
  ) : null;

  return (
    <ModerationQueueFrame
      title="Hồ sơ gỡ truyện"
      description="Theo dõi các hồ sơ gỡ truyện và xử lý vi phạm theo từng nguồn độc lập trên hàng đợi."
      sidebar={sidebar}
      sectionLabel={source.label}
      sectionHint={source.hint}
      filters={filters}
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
