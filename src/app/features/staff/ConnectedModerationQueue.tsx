'use client';
import { useCallback, useEffect, useState } from 'react';
import { AlarmClock, Archive, ChevronLeft, ChevronRight, ChevronsUp, Equal, ChevronDown, CircleCheck, CircleX, Clock, HandHelping, Hourglass, Inbox, RefreshCw, UserCheck, type LucideIcon } from 'lucide-react';
import Frog from '@/app/components/brand/Frog';
import Select from '@/app/components/Select';
import { staffService } from '@/app/services/staffService';
import { useAuth } from '@/app/context/AuthContext';
import type { QueueItem, QueueItemStatus, QueueItemType } from '@/app/types/staff';
import { formatSubmittedAt, queueSubmitterLabel, queueWorkTitle } from './moderationQueueDisplay';
import type { ReviewKind } from '@/app/services/moderationService';
import { Page, Notice, useAction } from './ui';
import { useRiseIn } from '@/app/lib/motion';
import ReviewPanel from './ReviewPanel';
const types: Record<string, string> = { PublicStoryReview: 'Truyện công khai', RoadmapTemplateReview: 'Lộ trình mẫu', CommunitySubmission: 'Truyện cộng đồng', GrayZoneStory: 'Vùng xám', ContentReport: 'Báo cáo nội dung', PublicStoryRemoval: 'Yêu cầu gỡ truyện' };
const statuses: QueueItemStatus[] = ['Pending','Claimed','Escalated','Approved','ChangesRequested','Rejected','Cleared','Blocked','Dismissed','Archived','Withdrawn','Removed','Closed'];
const labels: Record<string, string> = { Pending: 'Đang chờ', Claimed: 'Đang nhận xử lý', Escalated: 'Chuyển lên Admin', Approved: 'Đã duyệt', ChangesRequested: 'Yêu cầu sửa', Rejected: 'Từ chối', Cleared: 'Cho phép tiếp tục', Blocked: 'Bị chặn', Dismissed: 'Bỏ qua', Archived: 'Đã lưu trữ', Withdrawn: 'Đã rút', Removed: 'Đã gỡ', Closed: 'Đã đóng' };
const PRIORITY: Record<string, { label: string; Icon: typeof Equal; tone: string }> = {
  High: { label: 'Ưu tiên cao', Icon: ChevronsUp, tone: 'hi' },
  Medium: { label: 'Ưu tiên vừa', Icon: Equal, tone: 'mid' },
  Low: { label: 'Ưu tiên thấp', Icon: ChevronDown, tone: 'lo' },
};
/** Dấu trạng thái của một mục: quá hạn, chờ nhận, đã nhận, đã duyệt… (thay cho dấu mức ưu tiên). */
type StateMark = { label: string; Icon: LucideIcon; tone: string };
function stateOf(status: string, late: boolean): StateMark {
  if (late) return { label: 'Quá hạn', Icon: AlarmClock, tone: 'late' };
  switch (status) {
    case 'Pending': return { label: 'Chờ nhận', Icon: Hourglass, tone: 'wait' };
    case 'Claimed': return { label: 'Đã nhận', Icon: UserCheck, tone: 'held' };
    case 'Escalated': return { label: 'Chuyển lên Admin', Icon: ChevronsUp, tone: 'wait' };
    case 'Approved': case 'Cleared': return { label: status === 'Approved' ? 'Đã duyệt' : 'Cho phép tiếp tục', Icon: CircleCheck, tone: 'done' };
    case 'ChangesRequested': case 'Rejected': case 'Blocked': case 'Removed': return { label: labels[status], Icon: CircleX, tone: 'stop' };
    default: return { label: labels[status] ?? status, Icon: Archive, tone: 'lo' };
  }
}
/** Hạn xử lý: ngày giờ rõ ràng, kèm còn bao lâu hoặc đã quá hạn bao lâu. */
/** Người xử lý: chưa có người nhận thì để trống. Backend trả tên người nhận ở claimedByName; chưa có tên thì hiện theo mã. */
const handlerName = (item: QueueItem, me?: number | null, myName?: string) => (item.claimedByUserId == null ? 'Chưa có' : item.claimedByUserId === me ? `${myName || item.claimedByName || 'Bạn'} (bạn)` : item.claimedByName || `Tài khoản #${item.claimedByUserId}`);
/** Hạn xử lý chỉ còn ý nghĩa khi mục chưa có quyết định; mục đã xử lý xong thì không tính quá hạn. */
const OPEN_STATUSES = ['Pending', 'Claimed', 'Escalated'];
function dueInfo(iso: string | null, status: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const span = abs >= 86400000 ? `${Math.floor(abs / 86400000)} ngày` : abs >= 3600000 ? `${Math.floor(abs / 3600000)} giờ` : `${Math.max(1, Math.floor(abs / 60000))} phút`;
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return { text: `${time}, ${date}`, late: OPEN_STATUSES.includes(status) && diff < 0, done: !OPEN_STATUSES.includes(status), span };
}
/** Một dòng trong danh sách hàng đợi: tên tác phẩm nổi bật, tác giả gửi duyệt (với PublicStoryReview), loại/trạng thái/hạn ở dòng phụ. */
export function QueueItemRow({ item, selected, me, onSelect }: { item: QueueItem; selected: boolean; me?: number | null; onSelect: () => void }) {
  const due = dueInfo(item.slaDueAt, item.status);
  const typeLabel = types[item.itemType] ?? item.itemType;
  const workTitle = queueWorkTitle(item, typeLabel);
  const authorLine = queueSubmitterLabel(item);
  const meta = stateOf(item.status, !!due?.late);
  const mineLabel = item.claimedByUserId === me ? (item.status === 'Claimed' ? ' · bạn đang giữ' : ' · bạn đã xử lý') : '';
  const dueText = due ? (due.done ? due.text : due.late ? `quá hạn ${due.span}` : `còn ${due.span}`) : 'chưa đặt hạn';
  return <button className={`st-item${selected ? ' on' : ''}`} onClick={onSelect}>
    <span className="st-item-top">
      <b className="st-item-title">{workTitle}</b>
      <span className={`st-prio ${meta.tone}`} title={meta.label} aria-label={meta.label}><meta.Icon className="ic" /></span>
    </span>
    {authorLine && <span className="st-item-author">{authorLine}</span>}
    <small className={`st-due${due?.late ? ' late' : ''}`}><Clock className="ic" />{typeLabel} · {labels[item.status] ?? item.status}{mineLabel} · {dueText}</small>
  </button>;
}

/** Tóm tắt một mục chưa mở được nội dung: tên tác phẩm, tác giả gửi duyệt (với PublicStoryReview), thời điểm gửi, trạng thái và nút nhận xử lý. */
export function DetailCard({ item, me, myName, busy, onClaim }: { item: QueueItem; me?: number; myName?: string; busy: boolean; onClaim: () => void }) {
  const pr = PRIORITY[item.priority]; const due = dueInfo(item.slaDueAt, item.status);
  const typeLabel = types[item.itemType] ?? item.itemType;
  const workTitle = queueWorkTitle(item, typeLabel);
  const authorLine = queueSubmitterLabel(item);
  return <div className="st-card st-detail">
    <div className="st-detail-head">
      <span className="st-detail-ic" aria-hidden><Inbox className="ic" /></span>
      <div className="grow">
        <b className="display st-detail-title">{workTitle}</b>
        {authorLine && <span className="st-item-author">{authorLine}</span>}
        <span className="st-review-meta">{typeLabel} · Thời điểm gửi: {formatSubmittedAt(item.createdAt)}</span>
      </div>
      {(() => { const m = stateOf(item.status, !!due?.late); return <span className={`st-prio ${m.tone}`} title={m.label} aria-label={m.label}><m.Icon className="ic" /></span>; })()}
    </div>
    <div className="st-facts">
      <div><small>Loại mục</small><b>{typeLabel}</b></div>
      <div><small>Thời điểm gửi</small><b>{formatSubmittedAt(item.createdAt)}</b></div>
      <div><small>Trạng thái</small><b>{labels[item.status]}{item.claimedByUserId === me ? (item.status === 'Claimed' ? ' · bạn đang giữ' : ' · bạn đã xử lý') : ''}</b></div>
      <div><small>Người xử lý</small><b>{handlerName(item, me, myName)}</b></div>
      <div><small>Mức ưu tiên</small><b>{pr?.label ?? item.priority}</b></div>
      <div><small>Hạn xử lý</small><b className={due?.late ? 'st-late' : ''}>{due ? due.text : 'Chưa đặt hạn'}</b>{due && <small className={due.late ? 'st-late' : ''}>{due.done ? 'Đã xử lý xong' : due.late ? `Quá hạn ${due.span}` : `Còn ${due.span}`}</small>}</div>
    </div>
    {item.status === 'Pending'
      ? <button className="btn btn-p st-claim" disabled={busy} onClick={onClaim}><HandHelping className="ic" />Nhận xử lý</button>
      : <p className="sub">{item.status === 'Claimed' ? 'Mục này đang do người khác giữ nên bạn chưa mở được nội dung.' : 'Mục đã được xử lý xong nên không mở lại nội dung được. Chỉ xem được lúc đang giữ mục.'}</p>}
  </div>;
}
export default function ConnectedModerationQueue({ admin }: { admin?: boolean }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<QueueItemStatus>(admin ? 'Escalated' : 'Pending');
  const [kind, setKind] = useState<QueueItemType | ''>('');
  const [pageIndex, setPageIndex] = useState(1);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [hasNext, setHasNext] = useState(false);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => { setSelected(null); setRevision(n => n + 1); }, []);
  const { note, busy, run } = useAction(reload);
  useEffect(() => {
    let alive = true;
    setItems([]); setSelected(null); setError('');
    void staffService.queue({ status, itemType: kind || undefined, pageIndex, pageSize: 6 }).then(r => {
      if (!alive) return;
      if (!r.success || !r.data) { setError(r.message); return; }
      setItems(r.data.items); setHasNext(r.data.hasNextPage);
    });
    return () => { alive = false; };
  }, [status, kind, pageIndex, revision, user?.id]);
  const listRef = useRiseIn<HTMLDivElement>('.st-item', [items], { delay: 40, distance: 10 });
  const current = items.find(i => i.id === selected);
  const canOpen = current && current.itemType in types && ((current.status === 'Claimed' && current.claimedByUserId === user?.id) || (current.status === 'Escalated' && current.itemType === 'ContentReport' && user?.role === 'Administrator'));
  return <Page fit title="Hàng đợi kiểm duyệt">
    <Notice note={note} />{error && <div className="notice err" role="alert">{error}</div>}
    <div className="st-filters">
      <Select<QueueItemStatus> ariaLabel="Trạng thái" value={status} options={statuses.map(s => ({ value: s, label: labels[s] }))} onChange={v => { setStatus(v); setPageIndex(1); }} />
      <Select<QueueItemType | ''> ariaLabel="Loại mục" value={kind} options={[{ value: '', label: 'Tất cả loại mục' }, ...Object.entries(types).map(([k, v]) => ({ value: k as QueueItemType, label: v }))]} onChange={v => { setKind(v); setPageIndex(1); }} />
      <button className="btn btn-g" aria-label="Tải lại" onClick={reload}><RefreshCw className="ic" /></button>
    </div>
    <div className="st-split fill"><div className="st-list" ref={listRef}>{items.map(i => <QueueItemRow key={i.id} item={i} selected={selected === i.id} me={user?.id} onSelect={() => setSelected(i.id)} />)}{!items.length && !error && <p>Không có mục nào ở trang này.</p>}
      <div className="row" style={{ justifyContent: 'center', gap: 12 }}><button className="btn btn-g" aria-label="Trang trước" disabled={pageIndex === 1} onClick={() => setPageIndex(p => p - 1)}><ChevronLeft className="ic" /></button><span className="sub">Trang {pageIndex}</span><button className="btn btn-g" aria-label="Trang tiếp" disabled={!hasNext} onClick={() => setPageIndex(p => p + 1)}><ChevronRight className="ic" /></button></div></div>
      {current ? canOpen ? <ReviewPanel key={`${user?.id}:${current.id}`} kind={current.itemType as ReviewKind} id={current.id} queueItem={current} onDecision={reload} /> : <DetailCard item={current} me={user?.id} myName={(user?.fullName || user?.username)} busy={busy} onClaim={() => void run(() => staffService.claim(current.id), 'Đã nhận mục; chọn trạng thái Đang nhận xử lý để tiếp tục.')} /> : <div className="st-card st-empty"><Frog size={120} mood="think" /><b className="display">Chọn một mục để xem</b><span className="sub">{items.length ? 'Bấm vào một mục bên trái để xem chi tiết và nhận xử lý.' : error ? 'Chưa tải được hàng đợi. Bấm nút tải lại để thử lại.' : 'Hiện chưa có mục nào cần xử lý.'}</span></div>}
    </div>
  </Page>;
}
