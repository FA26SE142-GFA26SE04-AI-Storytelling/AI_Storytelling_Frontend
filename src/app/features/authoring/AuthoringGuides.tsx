'use client';
import { useEffect, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { authoringGuideService as service } from '@/app/services/authoringGuideService';
export default function AuthoringGuides({ onInsert }: { onInsert: (text: string) => void }) {
  const [page, setPage] = useState(1);
  const [guides, setGuides] = useState<B.GuidePage | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<B.AuthoringGuide | null>(null);
  const [values, setValues] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); let alive = true;
    void service.get(page, undefined, undefined, controller.signal).then(r => { if (alive) { setGuides(r.data); setError(r.success ? '' : r.message); } });
    return () => { alive = false; controller.abort(); };
  }, [page]);
  const insert = async () => { if (!selected || busy) return; setBusy(true); const r = await service.render(selected.id, { values }); setBusy(false); if (r.success && r.data?.isPlainText) onInsert(r.data.text); else setError(r.message || 'Không nhận được gợi ý văn bản hợp lệ.'); };
  return <details><summary>Mẫu hướng dẫn từ catalog</summary><p className="sub">Nội dung biên tập sẵn, dùng làm khung tham khảo. Để AI gợi ý theo nội dung bạn đang viết, dùng mục AI gợi ý theo bản nháp.</p>{error && <p className="notice err">{error}</p>}{guides?.items.map(g => <button className="btn btn-s" key={g.id} onClick={() => { setSelected(g); setValues({}); }}>{g.title}</button>)}
    {selected && <div className="sec"><p>{selected.instruction}</p>{selected.example && <blockquote>{selected.example}</blockquote>}{selected.placeholderDefinitions.map(v => <label className="field" key={v}>{v}<input className="inp" value={values[v] ?? ''} onChange={e => setValues(prev => ({ ...prev, [v]: e.target.value }))} /></label>)}<button className="btn btn-s" disabled={busy} onClick={() => void insert()}>Chèn gợi ý vào bản đang sửa</button></div>}
    <div className="row"><button className="btn btn-s" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Gợi ý trước</button><button className="btn btn-s" disabled={!guides || page * guides.pageSize >= guides.totalCount} onClick={() => setPage(p => p + 1)}>Gợi ý tiếp</button></div>
  </details>;
}
