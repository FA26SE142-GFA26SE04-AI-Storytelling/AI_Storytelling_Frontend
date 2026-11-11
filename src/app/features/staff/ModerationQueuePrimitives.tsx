'use client';
import type { ReactNode } from 'react';
import {
  AlarmClock, Archive, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, ChevronsUp,
  CircleCheck, CircleX, Clock, Equal, HandHelping, Hourglass, Inbox, RefreshCw, ShieldAlert, UserCheck,
  type LucideIcon,
} from 'lucide-react';
import Frog from '@/app/components/brand/Frog';
import Select from '@/app/components/Select';
import type { QueueItem, QueueItemStatus } from '@/app/types/staff';
import {
  claimOwnershipBadge,
  moderationStatusLabel,
  moderationTypeLabel,
  type ModerationSectionDef,
} from './moderationConfig';
import {
  formatSubmittedAt,
  queueDueInfo,
  queueHandlerName,
  queueSourceLabel,
  queueSubmitterLabel,
  queueWorkTitle,
} from './moderationQueueDisplay';
import type { QueuePriorityFilter } from './useModerationSectionQueue';

export const QUEUE_PRIORITY_META: Record<string, { label: string; Icon: typeof Equal; tone: string }> = {
  High: { label: 'Ưu tiên cao', Icon: ChevronsUp, tone: 'hi' },
  Medium: { label: 'Ưu tiên vừa', Icon: Equal, tone: 'mid' },
  Low: { label: 'Ưu tiên thấp', Icon: ChevronDown, tone: 'lo' },
};

type StateMark = { label: string; Icon: LucideIcon; tone: string };

export function queueStateMark(itemType: string, status: string, late: boolean): StateMark {
  if (late) return { label: 'Quá hạn', Icon: AlarmClock, tone: 'late' };
  const label = moderationStatusLabel(itemType, status);
  switch (status) {
    case 'Pending':
      return { label, Icon: Hourglass, tone: 'wait' };
    case 'Claimed':
      return { label, Icon: UserCheck, tone: 'held' };
    case 'Escalated':
      return { label, Icon: ChevronsUp, tone: 'wait' };
    case 'Approved':
    case 'Cleared':
      return { label, Icon: CircleCheck, tone: 'done' };
    case 'ChangesRequested':
    case 'Rejected':
    case 'Blocked':
    case 'Removed':
    case 'Archived':
      return { label, Icon: CircleX, tone: 'stop' };
    default:
      return { label, Icon: Archive, tone: 'lo' };
  }
}

/** Một dòng hồ sơ trong cột danh sách: tiêu đề, nguồn/tác giả theo quyền riêng tư, badge người giữ khi Claimed, SLA. */
export function QueueItemRow({
  item,
  selected,
  me,
  onSelect,
}: {
  item: QueueItem;
  selected: boolean;
  me?: number | null;
  onSelect: () => void;
}) {
  const due = queueDueInfo(item.slaDueAt, item.status);
  const typeLabel = moderationTypeLabel(item.itemType);
  const workTitle = queueWorkTitle(item, typeLabel);
  const authorLine = queueSubmitterLabel(item);
  const sourceLabel = queueSourceLabel(item);
  const mark = queueStateMark(item.itemType, item.status, !!due?.late);
  const statusLabel = moderationStatusLabel(item.itemType, item.status);
  const ownership = claimOwnershipBadge(item, me);
  const dueText = due ? (due.done ? due.text : due.late ? `quá hạn ${due.span}` : `còn ${due.span}`) : 'chưa đặt hạn';

  return (
    <button className={`st-item${selected ? ' on' : ''}`} onClick={onSelect}>
      <span className="st-item-top">
        <b className="st-item-title">{workTitle}</b>
        <span className={`st-prio ${mark.tone}`} title={mark.label} aria-label={mark.label}>
          <mark.Icon className="ic" />
        </span>
      </span>
      {authorLine && <span className="st-item-author">{authorLine}</span>}
      {(sourceLabel || ownership || item.isResubmission) && (
        <span className="mod-row-pills">
          {sourceLabel && <span className="pill draft">{sourceLabel}</span>}
          {ownership && <span className={`pill ${ownership.tone}`}>{ownership.label}</span>}
          {item.isResubmission && <span className="pill wait">Gửi lại</span>}
        </span>
      )}
      <small className={`st-due${due?.late ? ' late' : ''}`}>
        <Clock className="ic" />
        {typeLabel} · {statusLabel} · {dueText}
      </small>
    </button>
  );
}

/** Khối tóm tắt chỉ đọc cho Pending / Claimed bởi người khác / kết quả kết thúc. Tuyệt đối không mở package tác nghiệp. */
export function QueueSummaryCard({
  item,
  me,
  myName,
  busy,
  onClaim,
  claimLabel = 'Nhận xử lý',
  summaryNotice,
}: {
  item: QueueItem;
  me?: number | null;
  myName?: string;
  busy: boolean;
  onClaim?: () => void;
  claimLabel?: string;
  summaryNotice?: string;
}) {
  const pr = QUEUE_PRIORITY_META[item.priority];
  const due = queueDueInfo(item.slaDueAt, item.status);
  const typeLabel = moderationTypeLabel(item.itemType);
  const workTitle = queueWorkTitle(item, typeLabel);
  const authorLine = queueSubmitterLabel(item);
  const sourceLabel = queueSourceLabel(item);
  const statusLabel = moderationStatusLabel(item.itemType, item.status);
  const ownership = claimOwnershipBadge(item, me);
  const mark = queueStateMark(item.itemType, item.status, !!due?.late);
  const canClaim = item.status === 'Pending' && !!onClaim;

  const fallbackExplain =
    item.status === 'Pending'
      ? 'Nhận xử lý để mở toàn bộ nội dung, media và bằng chứng kiểm duyệt của hồ sơ này.'
      : item.status === 'Claimed'
        ? 'Hồ sơ này đang do người khác giữ nên bạn chỉ xem được thông tin tóm tắt.'
        : 'Hồ sơ đã kết thúc/đã có quyết định. API hiện tại chỉ trả thông tin tóm tắt của hàng đợi, chưa có chức năng mở lại nội dung phiên bản đã nộp hoặc lý do quyết định.';

  return (
    <div className="st-card st-detail">
      <div className="st-detail-head">
        <span className="st-detail-ic" aria-hidden><Inbox className="ic" /></span>
        <div className="grow">
          <b className="display st-detail-title">{workTitle}</b>
          {authorLine && <span className="st-item-author">{authorLine}</span>}
          <span className="st-review-meta">
            {sourceLabel ?? typeLabel} · Thời điểm hồ sơ: {formatSubmittedAt(item.createdAt)}
          </span>
        </div>
        <span className={`st-prio ${mark.tone}`} title={mark.label} aria-label={mark.label}>
          <mark.Icon className="ic" />
        </span>
      </div>

      <p className="st-review-meta" style={{ margin: 0 }}>
        Hồ sơ #{item.id}
        {item.storyId != null ? ` · Truyện #${item.storyId}` : ''}
        {item.isResubmission ? ' · Hồ sơ gửi lại' : ''}
      </p>

      <div className="st-facts">
        <div>
          <small>{sourceLabel ? 'Nguồn' : 'Loại mục'}</small>
          <b>{sourceLabel ?? typeLabel}</b>
        </div>
        <div>
          <small>Thời điểm gửi</small>
          <b>{formatSubmittedAt(item.createdAt)}</b>
        </div>
        <div>
          <small>Trạng thái hồ sơ</small>
          <b>{statusLabel}</b>
          {ownership && <small>{ownership.label}</small>}
        </div>
        <div>
          <small>{item.status === 'Claimed' ? 'Người đang giữ' : 'Người từng nhận gần nhất'}</small>
          <b>{queueHandlerName(item, me, myName)}</b>
        </div>
        <div>
          <small>Mức ưu tiên</small>
          <b>{pr?.label ?? item.priority}</b>
        </div>
        <div>
          <small>Hạn SLA</small>
          <b className={due?.late ? 'st-late' : ''}>{due ? due.text : 'Chưa đặt hạn'}</b>
          {due && (
            <small className={due.late ? 'st-late' : ''}>
              {due.done ? 'Hồ sơ đã qua giai đoạn xử lý' : due.late ? `Quá hạn ${due.span}` : `Còn ${due.span}`}
            </small>
          )}
        </div>
      </div>

      {canClaim ? (
        <div className="row st-wrap">
          <button type="button" className="btn btn-p st-claim" disabled={busy} onClick={onClaim}>
            <HandHelping className="ic" />
            {busy ? 'Đang nhận…' : claimLabel}
          </button>
        </div>
      ) : (
        <div className="notice" role="status" data-inline-notice>
          <ShieldAlert className="ic" aria-hidden />
          <span>{summaryNotice ?? fallbackExplain}</span>
        </div>
      )}
    </div>
  );
}

const PRIORITY_OPTIONS: { value: QueuePriorityFilter; label: string }[] = [
  { value: '', label: 'Mọi ưu tiên' },
  { value: 'High', label: 'Ưu tiên cao' },
  { value: 'Medium', label: 'Ưu tiên vừa' },
  { value: 'Low', label: 'Ưu tiên thấp' },
];

/** Khung 3 cột dùng chung cho cả workspace theo status và workspace đa nguồn tóm tắt; mobile chuyển Danh sách -> Chi tiết giữ filter/page. */
export function ModerationQueueFrame({
  title,
  description,
  sidebar,
  sectionLabel,
  sectionHint,
  filters,
  items,
  selectedId,
  onSelect,
  currentUserId,
  loading,
  error,
  actionNote,
  totalCount,
  pageIndex,
  totalPages,
  hasNextPage,
  onPageChange,
  onReload,
  banner,
  detail,
}: {
  title: string;
  description: string;
  sidebar: ReactNode;
  sectionLabel?: string;
  sectionHint?: string;
  filters?: ReactNode;
  items: QueueItem[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  currentUserId?: number | null;
  loading: boolean;
  error: string;
  actionNote: { ok: boolean; text: string } | null;
  totalCount: number;
  pageIndex: number;
  totalPages: number;
  hasNextPage: boolean;
  onPageChange: (next: number) => void;
  onReload: () => void;
  banner?: ReactNode;
  detail: ReactNode;
}) {
  const hasSelection = selectedId !== null;

  return (
    <section className="ws dock" style={{ gridTemplateColumns: '1fr' }}>
      <div className={`pane st-page mod-shell${hasSelection ? ' has-detail' : ''}`}>
        <header className="mod-head">
          <div className="mod-head-text">
            <h1 className="display">{title}</h1>
            <p className="sub">{description}</p>
          </div>
          <div className="mod-head-actions">
            <button type="button" className="btn btn-g" disabled={loading} onClick={onReload} aria-label="Tải lại danh sách" title="Tải lại">
              <RefreshCw className="ic" />
              <span>Tải lại</span>
            </button>
          </div>
        </header>

        {actionNote && (
          <div className={`notice ${actionNote.ok ? 'ok' : 'err'} mod-banner`} role="status">
            {actionNote.text}
          </div>
        )}
        {banner}
        {error && (
          <div className="notice err mod-banner" role="alert" data-inline-notice>
            <span>{error}</span>
            <button type="button" className="btn btn-s" onClick={onReload}>Thử lại</button>
          </div>
        )}

        <div className="mod-grid">
          {sidebar}

          <div className="mod-list-col">
            <div className="mod-list-tools">
              <div className="mod-list-info">
                <b>{sectionLabel}</b>
                <span className="sub" role="status">
                  {loading ? 'Đang tải…' : !error ? `${totalCount} hồ sơ · Trang ${pageIndex}/${Math.max(1, totalPages)}` : 'Lỗi tải dữ liệu'}
                </span>
              </div>
              {sectionHint && <p className="sub mod-section-hint">{sectionHint}</p>}
              {filters}
            </div>

            <div className="st-list mod-list-scroll">
              {loading && items.length === 0 && <p className="sub">Đang tải danh sách hồ sơ…</p>}
              {!loading && !error && items.length === 0 && (
                <p className="empty-line">Chưa có hồ sơ nào trong mục này.</p>
              )}
              {items.map(item => (
                <QueueItemRow
                  key={item.id}
                  item={item}
                  selected={selectedId === item.id}
                  onSelect={() => onSelect(item.id)}
                  me={currentUserId}
                />
              ))}
            </div>

            <div className="mod-pager">
              <button
                type="button"
                className="btn btn-g"
                aria-label="Trang trước"
                disabled={loading || pageIndex <= 1}
                onClick={() => onPageChange(pageIndex - 1)}
              >
                <ChevronLeft className="ic" />
              </button>
              <span className="sub">Trang {pageIndex}/{Math.max(1, totalPages)}</span>
              <button
                type="button"
                className="btn btn-g"
                aria-label="Trang tiếp"
                disabled={loading || !hasNextPage}
                onClick={() => onPageChange(pageIndex + 1)}
              >
                <ChevronRight className="ic" />
              </button>
            </div>
          </div>

          <div className="mod-detail-col">
            {hasSelection && (
              <div className="mod-mobile-back">
                <button type="button" className="btn btn-s" onClick={() => onSelect(null)}>
                  <ArrowLeft className="ic" />
                  Quay lại danh sách
                </button>
              </div>
            )}
            {detail ?? (
              <div className="st-card st-empty mod-empty">
                <Frog size={110} mood="think" />
                <b className="display">Chọn một hồ sơ để xem</b>
                <span className="sub">
                  {items.length
                    ? 'Bấm vào một hồ sơ bên trái để xem tóm tắt hoặc tác nghiệp.'
                    : error
                      ? 'Chưa tải được danh sách. Bấm Thử lại để tải lại.'
                      : 'Hiện chưa có hồ sơ nào ở phân khu này.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Bố cục 3 cột dùng chung cho các trang kiểm duyệt chuyên biệt theo itemType; mobile chuyển Danh sách -> Chi tiết giữ filter/page. */
export function ModerationWorkspaceShell({
  title,
  description,
  sections,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  onlyOverdue,
  onOnlyOverdueChange,
  items,
  selectedId,
  onSelect,
  currentUserId,
  loading,
  error,
  actionNote,
  totalCount,
  pageIndex,
  totalPages,
  hasNextPage,
  onPageChange,
  onReload,
  banner,
  detail,
}: {
  title: string;
  description: string;
  sections: ModerationSectionDef[];
  status: QueueItemStatus;
  onStatusChange: (s: QueueItemStatus) => void;
  priority: QueuePriorityFilter;
  onPriorityChange: (p: QueuePriorityFilter) => void;
  onlyOverdue: boolean;
  onOnlyOverdueChange: (v: boolean) => void;
  items: QueueItem[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  currentUserId?: number | null;
  loading: boolean;
  error: string;
  actionNote: { ok: boolean; text: string } | null;
  totalCount: number;
  pageIndex: number;
  totalPages: number;
  hasNextPage: boolean;
  onPageChange: (next: number) => void;
  onReload: () => void;
  banner?: ReactNode;
  detail: ReactNode;
}) {
  const workSections = sections.filter(s => s.group !== 'results');
  const resultSections = sections.filter(s => s.group === 'results');
  const activeSection = sections.find(s => s.status === status);
  const showDueFilter = status === 'Pending' || status === 'Claimed';

  const sidebar = (
    <aside className="mod-nav" aria-label="Khu công việc">
      <div className="mod-nav-group">
        <span className="mod-nav-title">Xử lý hồ sơ</span>
        {workSections.map(s => (
          <button
            key={s.status}
            type="button"
            className={status === s.status ? 'on' : ''}
            aria-current={status === s.status ? 'page' : undefined}
            onClick={() => onStatusChange(s.status)}
          >
            <span>{s.label}</span>
            {status === s.status && !loading && !error && <em>{totalCount}</em>}
          </button>
        ))}
      </div>
      {resultSections.length > 0 && (
        <div className="mod-nav-group">
          <span className="mod-nav-title">Kết quả xử lý</span>
          {resultSections.map(s => (
            <button
              key={s.status}
              type="button"
              className={status === s.status ? 'on' : ''}
              aria-current={status === s.status ? 'page' : undefined}
              onClick={() => onStatusChange(s.status)}
            >
              <span>{s.label}</span>
              {status === s.status && !loading && !error && <em>{totalCount}</em>}
            </button>
          ))}
        </div>
      )}
    </aside>
  );

  const filters = (
    <div className="mod-filter-row">
      <Select<QueuePriorityFilter>
        ariaLabel="Lọc theo mức ưu tiên"
        value={priority}
        options={PRIORITY_OPTIONS}
        onChange={onPriorityChange}
      />
      {showDueFilter && (
        <button
          type="button"
          className={`chip${onlyOverdue ? ' on' : ''}`}
          aria-pressed={onlyOverdue}
          onClick={() => onOnlyOverdueChange(!onlyOverdue)}
        >
          Chỉ quá hạn
        </button>
      )}
    </div>
  );

  return (
    <ModerationQueueFrame
      title={title}
      description={description}
      sidebar={sidebar}
      sectionLabel={activeSection?.label}
      sectionHint={activeSection?.hint}
      filters={filters}
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      currentUserId={currentUserId}
      loading={loading}
      error={error}
      actionNote={actionNote}
      totalCount={totalCount}
      pageIndex={pageIndex}
      totalPages={totalPages}
      hasNextPage={hasNextPage}
      onPageChange={onPageChange}
      onReload={onReload}
      banner={banner}
      detail={detail}
    />
  );
}
