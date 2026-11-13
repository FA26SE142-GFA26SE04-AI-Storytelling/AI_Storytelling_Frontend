'use client';
import type { ReactNode, RefObject } from 'react';
import { BookOpen, Check, ChevronRight, CircleAlert, History } from 'lucide-react';
import type * as B from '@/app/types/backendContracts';
import { moderationStatusLabel } from './moderationConfig';

export type SnapshotMetric = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone: 'ok' | 'wait' | 'flag' | 'draft';
  targetId?: string;
};

/** Đếm sơ bộ số từ tiếng Việt/Latinh để Moderator ước lượng nhanh độ dài văn bản Creator gửi. */
export function countWords(text: string | null | undefined): number {
  const trimmed = text?.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Thanh tóm tắt nhanh tiến độ rà soát và rào cản ngay đầu hồ sơ kiểm duyệt. */
export function InspectionSnapshotBar({
  metrics,
  onJump,
}: {
  metrics: SnapshotMetric[];
  onJump?: (targetId: string) => void;
}) {
  if (metrics.length === 0) return null;
  return (
    <div className="mod-readiness-strip" role="group" aria-label="Tổng quan tiến độ rà soát">
      {metrics.map(m => {
        const inner = (
          <>
            <span className="mod-stat-label">{m.label}</span>
            <strong className="mod-stat-val">{m.value}</strong>
            {m.hint && <small className="mod-stat-hint">{m.hint}</small>}
          </>
        );
        if (m.targetId && onJump) {
          return (
            <button
              key={m.id}
              type="button"
              className={`mod-stat-card tone-${m.tone} is-link`}
              onClick={() => onJump(m.targetId!)}
            >
              {inner}
            </button>
          );
        }
        return (
          <div key={m.id} className={`mod-stat-card tone-${m.tone}`}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

/** Thẻ đọc văn bản tác giả gửi (nền giấy, font chữ đọc sách rõ nét, đếm từ). */
export function ManuscriptCard({
  label,
  text,
  emptyText,
  variant = 'story',
  badge,
}: {
  label: string;
  text: string | null | undefined;
  emptyText?: string;
  variant?: 'story' | 'brief' | 'note';
  badge?: string;
}) {
  const trimmed = text?.trim() ?? '';
  const words = countWords(trimmed);
  return (
    <section className={`mod-manuscript mod-manuscript-${variant}`}>
      <header className="mod-manuscript-head">
        <span className="mod-manuscript-eyebrow">
          <BookOpen className="ic" aria-hidden="true" />
          {label}
        </span>
        <span className="mod-manuscript-meta">
          {badge && <span className="pill draft">{badge}</span>}
          {words > 0 && <span className="mod-word-badge">{words} từ</span>}
        </span>
      </header>
      {trimmed ? (
        <div className="mod-manuscript-body">{trimmed}</div>
      ) : (
        <p className="sub">{emptyText ?? 'Chưa có nội dung văn bản.'}</p>
      )}
    </section>
  );
}

/** Ba phần dàn ý (Mở đầu / Diễn biến / Kết thúc) do Creator gửi kèm phiên bản. */
export function CreatorOutlineStrip({
  opening,
  development,
  ending,
}: {
  opening: string | null | undefined;
  development: string | null | undefined;
  ending: string | null | undefined;
}) {
  const steps = [
    { key: 'open', step: '1', label: 'Mở đầu', text: opening?.trim() ?? '' },
    { key: 'dev', step: '2', label: 'Diễn biến', text: development?.trim() ?? '' },
    { key: 'end', step: '3', label: 'Kết thúc', text: ending?.trim() ?? '' },
  ].filter(s => s.text.length > 0);
  if (steps.length === 0) return null;

  return (
    <div className="mod-outline-strip" aria-label="Dàn ý truyện Creator gửi">
      <div className="mod-outline-head">
        <b className="st-scene-label">Dàn ý 3 phần từ Creator</b>
      </div>
      <div className="mod-outline-grid">
        {steps.map(s => (
          <article className="mod-outline-card" key={s.key}>
            <span className="mod-outline-step">
              <em>{s.step}</em>
              {s.label}
            </span>
            <p className="mod-outline-text">{s.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

/** Khung cảnh kiểm duyệt song song: văn bản tác phẩm rõ nét bên trái, tranh + âm thanh bên phải. */
export function SceneCardShell({
  sceneNumber,
  viewed,
  headerBadge,
  prose,
  proseExtra,
  hasMedia,
  mediaSlot,
  actionSlot,
}: {
  sceneNumber: number;
  viewed?: boolean;
  headerBadge?: ReactNode;
  prose: string;
  proseExtra?: ReactNode;
  hasMedia: boolean;
  mediaSlot?: ReactNode;
  actionSlot?: ReactNode;
}) {
  return (
    <section className={`st-scene mod-scene-card${viewed ? ' viewed' : ''}${hasMedia ? '' : ' no-media'}`}>
      <header className="mod-scene-head">
        <div className="row st-wrap">
          <b className="mod-scene-num">Cảnh {sceneNumber}</b>
          {viewed && (
            <span className="pill ok">
              <Check className="ic" aria-hidden="true" />
              Đã xem
            </span>
          )}
          {headerBadge}
        </div>
        {countWords(prose) > 0 && <span className="mod-word-badge">{countWords(prose)} từ</span>}
      </header>

      <div className="mod-scene-body">
        <div className="mod-scene-prose-col">
          <div className="mod-scene-prose">
            <p className="st-scene-text">{prose}</p>
          </div>
          {proseExtra}
        </div>
        {hasMedia && <div className="mod-scene-media-col">{mediaSlot}</div>}
      </div>

      {actionSlot && <footer className="mod-scene-foot">{actionSlot}</footer>}
    </section>
  );
}

export type ReadingTabOption<T extends string = string> = {
  id: T;
  label: string;
};

/** Thanh chuyển nhanh góc đọc tác phẩm bên cột trái của bàn kiểm duyệt song song. */
export function ReadingFilterBar<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: ReadingTabOption<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <nav className="mod-read-tabs" aria-label="Bộ lọc vùng đọc tác phẩm">
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          className={`mod-read-tab${value === t.id ? ' on' : ''}`}
          aria-pressed={value === t.id}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

/** Bố cục bàn kiểm duyệt 2 cột song song: Đầu hồ sơ toàn chiều ngang -> Trái đọc nội dung (~60%) | Phải kiểm tra & quyết định ghim cạnh (~40%). */
export function EditorialReviewSplit({
  innerRef,
  header,
  readingControls,
  left,
  right,
}: {
  innerRef?: RefObject<HTMLDivElement | null>;
  header: ReactNode;
  readingControls?: ReactNode;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="mod-desk-shell st-review" ref={innerRef}>
      <div className="st-card mod-desk-header-card">{header}</div>
      <div className="mod-desk-split">
        <div className="st-card mod-desk-main">
          {readingControls}
          {left}
        </div>
        <aside className="st-card mod-desk-rail" aria-label="Kiểm tra và quyết định">
          {right}
        </aside>
      </div>
    </div>
  );
}

/** Tóm tắt lịch sử các lần duyệt trước khi Creator gửi lại phiên bản sửa đổi. */
export function ReviewHistoryList({ history }: { history: B.PublicReviewHistoryEntryDto[] }) {
  if (!history.length) return null;
  return (
    <details className="mod-history-acc">
      <summary>
        <History className="ic" aria-hidden="true" />
        Lịch sử các lần duyệt trước ({history.length})
      </summary>
      <div className="mod-history-list">
        {history.map(h => (
          <article className="mod-history-item" key={h.itemId}>
            <div className="row st-wrap">
              <b>{moderationStatusLabel('PublicStoryReview', h.decision)}</b>
              {h.versionNo != null && <span className="pill draft">Bản V{h.versionNo}</span>}
              {h.decidedByName && <span className="st-review-meta">Bởi {h.decidedByName}</span>}
              {h.decidedAt && (
                <span className="st-review-meta">
                  {new Date(h.decidedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              )}
            </div>
            {(h.reason || h.feedback) && (
              <p className="mod-history-note">{h.feedback || h.reason}</p>
            )}
          </article>
        ))}
      </div>
    </details>
  );
}

/** Thẻ thông báo hệ thống / lý do phân biệt rõ nguồn thông tin với văn bản truyện. */
export function ModerationCallout({
  label,
  tone = 'info',
  children,
}: {
  label: string;
  tone?: 'info' | 'warn' | 'danger';
  children: ReactNode;
}) {
  return (
    <div className={`st-quote mod-callout tone-${tone}`}>
      <small>
        {tone === 'danger' && <CircleAlert className="ic" aria-hidden="true" />}
        {label}
        {tone === 'warn' && <ChevronRight className="ic" aria-hidden="true" />}
      </small>
      {children}
    </div>
  );
}
