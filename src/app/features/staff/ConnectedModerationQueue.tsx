'use client';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUp, Equal, ChevronDown, Clock, HandHelping, Inbox, RefreshCw } from 'lucide-react';
import Frog from '@/app/components/brand/Frog';
import Select from '@/app/components/Select';
import { staffService } from '@/app/services/staffService';
import { useAuth } from '@/app/context/AuthContext';
import type { QueueItem, QueueItemStatus, QueueItemType } from '@/app/types/staff';
import type { ReviewKind } from '@/app/services/moderationService';
import { Page, Notice, useAction } from './ui';
import ReviewPanel from './ReviewPanel';
const types: Record<string, string> = { PublicStoryReview: 'Truyện công khai', RoadmapTemplateReview: 'Bộ truyện mẫu', CommunitySubmission: 'Truyện cộng đồng', GrayZoneStory: 'Vùng xám', ContentReport: 'Báo cáo nội dung', PublicStoryRemoval: 'Yêu cầu gỡ truyện' };
const statuses: QueueItemStatus[] = ['Pending','Claimed','Escalated','Approved','ChangesRequested','Rejected','Cleared','Blocked','Dismissed','Archived','Withdrawn','Removed','Closed'];
const labels: Record<string, string> = { Pending: 'Đang chờ', Claimed: 'Đang nhận xử lý', Escalated: 'Chuyển lên Admin', Approved: 'Đã duyệt', ChangesRequested: 'Yêu cầu sửa', Rejected: 'Từ chối', Cleared: 'Cho phép tiếp tục', Blocked: 'Bị chặn', Dismissed: 'Bỏ qua', Archived: 'Đã gỡ', Withdrawn: 'Đã rút', Removed: 'Đã gỡ', Closed: 'Đã đóng' };
const PRIORITY: Record<string, { label: string; Icon: typeof Equal; tone: string }> = {
  High: { label: 'Ưu tiên cao', Icon: ChevronsUp, tone: 'hi' },
  Medium: { label: 'Ưu tiên vừa', Icon: Equal, tone: 'mid' },
  Low: { label: 'Ưu tiên thấp', Icon: ChevronDown, tone: 'lo' },
};
/** Hạn xử lý: ngày giờ rõ ràng, kèm còn bao lâu hoặc đã quá hạn bao lâu. */
/** Người xử lý: chưa có người nhận thì để trống. Backend chỉ trả mã người nhận, chưa có tên, nên chỉ gọi được "Bạn" hoặc theo mã. */
const handlerName = (id: number | null, me?: number | null, myUsername?: string) => (id == null ? '' : id === me ? (myUsername ? `${myUsername} (bạn)` : 'Bạn') : `Tài khoản #${id}`);
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
/** Tóm tắt một mục chưa mở được nội dung: loại, trạng thái, ưu tiên, hạn và nút nhận xử lý. */
function DetailCard({ item, me, myUsername, busy, onClaim }: { item: QueueItem; me?: number; myUsername?: string; busy: boolean; onClaim: () => void }) {
  const pr = PRIORITY[item.priority]; const due = dueInfo(item.slaDueAt, item.status);
  return <div className="st-card st-detail">
    <div className="st-detail-head">
      <span className="st-detail-ic" aria-hidden><Inbox className="ic" /></span>
      <div className="grow"><b className="display">{types[item.itemType] ?? item.itemType}</b></div>
      {pr && <span className={`st-prio ${pr.tone}`} title={pr.label} aria-label={pr.label}><pr.Icon className="ic" /></span>}
    </div>
    <div className="st-facts">
      <div><small>Trạng thái</small><b>{labels[item.status]}{item.claimedByUserId === me ? (item.status === 'Claimed' ? ' · bạn đang giữ' : ' · bạn đã xử lý') : ''}</b></div>
      <div><small>Người xử lý</small><b>{handlerName(item.claimedByUserId, me, myUsername)}</b></div>
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
  const current = items.find(i => i.id === selected);
  const canOpen = current && current.itemType in types && ((current.status === 'Claimed' && current.claimedByUserId === user?.id) || (current.status === 'Escalated' && current.itemType === 'ContentReport' && user?.role === 'Administrator'));
  return <Page fit title="Hàng đợi kiểm duyệt">
    <Notice note={note} />{error && <div className="notice err" role="alert" data-inline-notice>{error}</div>}
    <div className="st-filters">
      <Select<QueueItemStatus> ariaLabel="Trạng thái" value={status} options={statuses.map(s => ({ value: s, label: labels[s] }))} onChange={v => { setStatus(v); setPageIndex(1); }} />
      <Select<QueueItemType | ''> ariaLabel="Loại mục" value={kind} options={[{ value: '', label: 'Tất cả loại mục' }, ...Object.entries(types).map(([k, v]) => ({ value: k as QueueItemType, label: v }))]} onChange={v => { setKind(v); setPageIndex(1); }} />
      <button className="btn btn-g" aria-label="Tải lại" onClick={reload}><RefreshCw className="ic" /></button>
    </div>
    <div className="st-split fill"><div className="st-list">{items.map(i => <button className={`st-item${selected === i.id ? ' on' : ''}`} key={i.id} onClick={() => setSelected(i.id)}>{(() => {
          const pr = PRIORITY[i.priority]; const due = dueInfo(i.slaDueAt, i.status);
          return <>
            <span className="st-item-top"><b>{types[i.itemType] ?? i.itemType}</b>{pr && <span className={`st-prio ${pr.tone}`} title={pr.label} aria-label={pr.label}><pr.Icon className="ic" /></span>}</span>
            <small>{labels[i.status]}{i.claimedByUserId === user?.id ? (i.status === 'Claimed' ? ' · Bạn đang giữ mục' : ' · Bạn đã xử lý') : ''}</small>
            {due ? <small className={`st-due${due.late ? ' late' : ''}`}><Clock className="ic" />{due.text} · {due.done ? 'đã xử lý xong' : due.late ? `quá hạn ${due.span}` : `còn ${due.span}`}</small> : <small className="st-due"><Clock className="ic" />Chưa đặt hạn</small>}
          </>;
        })()}</button>)}{!items.length && !error && <p>Không có mục nào ở trang này.</p>}
      <div className="row" style={{ justifyContent: 'center', gap: 12 }}><button className="btn btn-g" aria-label="Trang trước" disabled={pageIndex === 1} onClick={() => setPageIndex(p => p - 1)}><ChevronLeft className="ic" /></button><span className="sub">Trang {pageIndex}</span><button className="btn btn-g" aria-label="Trang tiếp" disabled={!hasNext} onClick={() => setPageIndex(p => p + 1)}><ChevronRight className="ic" /></button></div></div>
      {current ? canOpen ? <ReviewPanel key={`${user?.id}:${current.id}`} kind={current.itemType as ReviewKind} id={current.id} onDecision={reload} /> : <DetailCard item={current} me={user?.id} myUsername={user?.username} busy={busy} onClaim={() => void run(() => staffService.claim(current.id), 'Đã nhận mục; chọn trạng thái Đang nhận xử lý để tiếp tục.')} /> : <div className="st-card st-empty"><Frog size={120} mood="think" /><b className="display">Chọn một mục để xem</b><span className="sub">{items.length ? 'Bấm vào một mục bên trái để xem chi tiết và nhận xử lý.' : 'Hiện chưa có mục nào cần xử lý.'}</span></div>}
    </div>
  </Page>;
}
