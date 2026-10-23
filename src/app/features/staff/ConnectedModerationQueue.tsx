'use client';
import { useCallback, useEffect, useState } from 'react';
import { staffService } from '@/app/services/staffService';
import { useAuth } from '@/app/context/AuthContext';
import type { QueueItem, QueueItemStatus, QueueItemType } from '@/app/types/staff';
import type { ReviewKind } from '@/app/services/moderationService';
import { Page, Notice, useAction, fmt } from './ui';
import ReviewPanel from './ReviewPanel';
const types: Record<string, string> = { PublicStoryReview: 'Truyện công khai', RoadmapTemplateReview: 'Bộ truyện mẫu', CommunitySubmission: 'Truyện cộng đồng', GrayZoneStory: 'Vùng xám', ContentReport: 'Báo cáo nội dung', PublicStoryRemoval: 'Yêu cầu gỡ truyện' };
const statuses: QueueItemStatus[] = ['Pending','Claimed','Escalated','Approved','ChangesRequested','Rejected','Cleared','Blocked','Dismissed','Archived','Withdrawn','Removed','Closed'];
const labels: Record<string, string> = { Pending: 'Đang chờ', Claimed: 'Đang nhận xử lý', Escalated: 'Chuyển lên Admin', Approved: 'Đã duyệt', ChangesRequested: 'Yêu cầu sửa', Rejected: 'Từ chối', Cleared: 'Cho phép tiếp tục', Blocked: 'Bị chặn', Dismissed: 'Bỏ qua', Archived: 'Đã gỡ', Withdrawn: 'Đã rút', Removed: 'Đã gỡ', Closed: 'Đã đóng' };
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
    void staffService.queue({ status, itemType: kind || undefined, pageIndex, pageSize: 20 }).then(r => {
      if (!alive) return;
      if (!r.success || !r.data) { setError(r.message); return; }
      setItems(r.data.items); setHasNext(r.data.hasNextPage);
    });
    return () => { alive = false; };
  }, [status, kind, pageIndex, revision, user?.id]);
  const current = items.find(i => i.id === selected);
  const canOpen = current && current.itemType in types && ((current.status === 'Claimed' && current.claimedByUserId === user?.id) || (current.status === 'Escalated' && current.itemType === 'ContentReport' && user?.role === 'Administrator'));
  return <Page title="Hàng đợi kiểm duyệt" sub="Nhận xử lý trước khi mở nội dung. Mỗi loại mục có checklist và điều kiện quyết định riêng.">
    <Notice note={note} />{error && <div className="notice err" role="alert">{error}</div>}
    <div className="row"><select className="inp" aria-label="Trạng thái" value={status} onChange={e => { setStatus(e.target.value as QueueItemStatus); setPageIndex(1); }}>{statuses.map(s => <option key={s} value={s}>{labels[s]}</option>)}</select>
      <select className="inp" aria-label="Loại mục" value={kind} onChange={e => { setKind(e.target.value as QueueItemType | ''); setPageIndex(1); }}><option value="">Tất cả loại mục</option>{Object.entries(types).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select><button className="btn btn-s" onClick={reload}>Tải lại</button></div>
    <div className="st-split"><div className="st-list">{items.map(i => <button className={`st-item${selected === i.id ? ' on' : ''}`} key={i.id} onClick={() => setSelected(i.id)}><b>{types[i.itemType] ?? i.itemType} #{i.id}</b><small>{labels[i.status]} · {i.claimedByUserId === user?.id ? 'Bạn đang giữ mục' : i.priority}</small><small>Hạn: {fmt(i.slaDueAt)}</small></button>)}{!items.length && !error && <p>Không có mục nào ở trang này.</p>}
      <div className="row"><button className="btn btn-s" disabled={pageIndex === 1} onClick={() => setPageIndex(p => p - 1)}>Trước</button><span>Trang {pageIndex}</span><button className="btn btn-s" disabled={!hasNext} onClick={() => setPageIndex(p => p + 1)}>Tiếp</button></div></div>
      {current ? canOpen ? <ReviewPanel key={`${user?.id}:${current.id}`} kind={current.itemType as ReviewKind} id={current.id} onDecision={reload} /> : <div className="st-card"><h3>{types[current.itemType]} #{current.id}</h3><p>{labels[current.status]}</p>{current.status === 'Pending' ? <button className="btn btn-p" disabled={busy} onClick={() => void run(() => staffService.claim(current.id), 'Đã nhận mục; chọn trạng thái Đang nhận xử lý để tiếp tục.')}>Nhận xử lý</button> : <p className="sub">Chỉ mở nội dung khi đang giữ mục hoặc xử lý report được chuyển cấp.</p>}</div> : <div className="st-card">Chọn một mục để xem.</div>}
    </div>
  </Page>;
}
