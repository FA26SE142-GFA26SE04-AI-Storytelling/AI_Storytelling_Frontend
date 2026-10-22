'use client';
import { useEffect, useState } from 'react';
import { profileLifecycleService as service } from '@/app/services/profileLifecycleService';
import type { AuditLogDto, PagedResult } from '@/app/types/backendContracts';
export default function ActivitySection({ childId }: { childId?: number }) {
  const [page,setPage] = useState(1);
  const [data,setData] = useState<PagedResult<AuditLogDto> | null>(null);
  const [error,setError] = useState('');
  const [refresh,setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); let alive = true; setData(null); setError('');
    const call = childId === undefined ? service.accountAudit(page,controller.signal) : service.childAudit(childId,page,controller.signal);
    void call.then(r => { if (alive) { if (r.success) setData(r.data); else setError(r.message); } });
    return () => { alive=false; controller.abort(); };
  }, [childId,page,refresh]);
  return <section className="sec"><h3>Lịch sử hoạt động</h3>
    {error && <p className="notice err" role="alert">{error}</p>}
    {data?.items.map(item => <div className="ck" key={item.id}><span>{item.action}<small>{item.entityType} #{item.entityId} · {new Date(item.occurredAt).toLocaleString('vi-VN')}</small></span></div>)}
    {data?.items.length === 0 && <p>Chưa có hoạt động.</p>}
    <div className="row"><button className="btn btn-s" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Trang trước</button><span>Trang {page}</span><button className="btn btn-s" disabled={!data?.hasNextPage} onClick={()=>setPage(p=>p+1)}>Trang tiếp</button><button className="btn btn-g" onClick={()=>setRefresh(n=>n+1)}>Tải lại nhật ký</button></div>
  </section>;
}
