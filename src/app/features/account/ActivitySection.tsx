'use client';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { profileLifecycleService as service } from '@/app/services/profileLifecycleService';
import Select from '@/app/components/Select';
import { fmtDateTime } from '@/app/lib/guardian';
import type { AuditLogDto } from '@/app/types/backendContracts';

const ACTION: Record<string, string> = {
  RESTORE_CHILD_PROFILE: 'Khôi phục hồ sơ',
  ARCHIVE_CHILD_PROFILE: 'Lưu trữ hồ sơ',
  RESUME_CHILD_PROFILE: 'Mở lại hồ sơ',
  SUSPEND_CHILD_PROFILE: 'Khóa hồ sơ',
};
const ENTITY: Record<string, string> = {
  ChildProfile: 'Hồ sơ bé',
};

const PER_PAGE = 8;
const MAX_PAGES = 5;
/** Nhóm lọc theo loại đối tượng; backend chưa lọc được nên lọc trên nhật ký đã tải. */
const GROUPS = [
  { value: 'all', label: 'Tất cả', types: null },
  { value: 'profile', label: 'Hồ sơ bé', types: ['ChildProfile'] },
] as const;
type Group = (typeof GROUPS)[number]['value'];

/** Nhật ký hoạt động của tài khoản (hoặc của một bé khi có childId). */
export default function ActivitySection({ childId }: { childId?: number }) {
  const [page,setPage] = useState(1);
  const [group,setGroup] = useState<Group>('all');
  const [items,setItems] = useState<AuditLogDto[] | null>(null);
  const [error,setError] = useState('');
  const [refresh,setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); let alive = true; setItems(null); setError('');
    void (async () => {
      const all: AuditLogDto[] = [];
      for (let p = 1; p <= MAX_PAGES; p++) {
        const r = childId === undefined ? await service.accountAudit(p,controller.signal) : await service.childAudit(childId,p,controller.signal);
        if (!alive) return;
        if (!r.success || !r.data) { setError(r.message); break; }
        all.push(...r.data.items);
        if (!r.data.hasNextPage) break;
      }
      if (alive) setItems(all);
    })();
    return () => { alive=false; controller.abort(); };
  }, [childId,refresh]);
  const shown = useMemo(() => {
    const types = GROUPS.find(g => g.value === group)?.types;
    return (items ?? []).filter(i => !types || (types as readonly string[]).includes(i.entityType));
  }, [items,group]);
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const rows = shown.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  return <section className="sec" style={{ gap: 4 }}>
    <div className="row act-head"><h3 className="display grow" style={{ margin: 0 }}>Lịch sử hoạt động</h3>
      <Select<Group> className="act-filter" ariaLabel="Lọc lịch sử" value={group} options={GROUPS.map(g => ({ value: g.value, label: g.label }))} onChange={(v) => { setGroup(v); setPage(1); }} />
      <button className="btn btn-g" aria-label="Tải lại nhật ký" onClick={()=>setRefresh(n=>n+1)}><RefreshCw className="ic" /></button></div>
    {error && <p className="notice err" role="alert" data-inline-notice>{error}</p>}
    {items === null && !error && <p className="sub">Đang tải…</p>}
    {rows.map(item => <div className="act-row" key={item.id}>
      <b>{ACTION[item.action] ?? item.action}</b>
      <small>{ENTITY[item.entityType] ?? item.entityType} #{item.entityId} · {fmtDateTime(item.occurredAt)}</small>
    </div>)}
    {items !== null && shown.length === 0 && <p className="sub">Chưa có hoạt động.</p>}
    <div className="row act-pager">
      <button className="btn btn-g" aria-label="Trang trước" disabled={cur===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="ic" /></button>
      <span className="sub">Trang {cur}/{pages}</span>
      <button className="btn btn-g" aria-label="Trang tiếp" disabled={cur>=pages} onClick={()=>setPage(p=>p+1)}><ChevronRight className="ic" /></button>
    </div>
  </section>;
}
