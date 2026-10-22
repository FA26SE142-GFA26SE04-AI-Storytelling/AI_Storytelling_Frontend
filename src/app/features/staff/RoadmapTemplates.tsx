'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { roadmapTemplateService as service } from '@/app/services/roadmapTemplateService';
import { staffService } from '@/app/services/staffService';
import type * as B from '@/app/types/backendContracts';
import { useAuth } from '@/app/context/AuthContext';
import type { ApiResponse } from '@/app/types/auth';
import { Page, fmt } from './ui';
const blank = (): B.SaveRoadmapRequestDto => ({ name: '', description: null, ageBand: '6-8', mainCategoryId: 0, readingLevelMin: 1, readingLevelMax: 3, defaultDaysPerStory: 3 });
const groups: Record<B.RoadmapListGroupName, string> = { Drafts: 'Bản nháp', Pending: 'Đang chờ duyệt', Published: 'Đang công khai', Archived: 'Đã lưu trữ', Orphaned: 'Nháp cần tiếp quản' };
export default function RoadmapTemplates() {
  const { user } = useAuth();
  const moderator = user?.role === 'Moderator';
  const [group, setGroup] = useState<B.RoadmapListGroupName>('Drafts');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<B.PagedResult<B.RoadmapListItemDto> | null>(null);
  const [detail, setDetail] = useState<B.RoadmapDetailDto | null>(null);
  const [form, setForm] = useState<B.SaveRoadmapRequestDto | null>(null);
  const [items, setItems] = useState<B.RoadmapItemInputDto[]>([]);
  const [categories, setCategories] = useState<{ id: number; displayName: string }[]>([]);
  const [candidates, setCandidates] = useState<B.PagedResult<B.CandidateStoryDto> | null>(null);
  const [candidatePage, setCandidatePage] = useState(1);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [uncertainCreate, setUncertainCreate] = useState(false);
  const [revision, setRevision] = useState(0);
  const scope = useRef(Symbol());
  const reload = useCallback(() => setRevision(v => v + 1), []);
  useEffect(() => {
    const controller = new AbortController(); let alive = true;
    scope.current = Symbol(); setDetail(null); setForm(null); setList(null);
    void service.list(group, page, controller.signal).then(r => { if (alive) { setList(r.data); if (!r.success) setNote(r.message); } });
    void staffService.categories().then(r => { if (alive) setCategories(r.data ?? []); });
    return () => { alive = false; scope.current = Symbol(); controller.abort(); };
  }, [group, page, revision, user?.id]);
  useEffect(() => {
    const controller = new AbortController(); let alive = true;
    void service.candidates({ pageIndex: candidatePage, pageSize: 20, ageBand: form?.ageBand }, controller.signal).then(r => { if (alive) { setCandidates(r.data); if (!r.success) setNote(r.message); } });
    return () => { alive = false; controller.abort(); };
  }, [candidatePage, form?.ageBand, user?.id]);
  const open = async (id: number) => {
    const run = Symbol(); scope.current = run; setNote(''); setBusy(true);
    const r = await service.get(id);
    if (scope.current !== run) return;
    setBusy(false);
    if (!r.success || !r.data) { setNote(r.message); return; }
    const d = r.data; setDetail(d); setItems(d.stories.map(s => ({ storyId: s.storyId, days: s.days })));
    setForm({ name: d.name, description: d.description, ageBand: d.ageBand, mainCategoryId: d.mainCategory?.id ?? 0, readingLevelMin: d.readingLevelMin, readingLevelMax: d.readingLevelMax, defaultDaysPerStory: d.defaultDaysPerStory });
  };
  const act = async (fn: () => Promise<ApiResponse<unknown>>) => { if (busy) return; const run = scope.current; setBusy(true); const r = await fn(); if (scope.current !== run) return; setBusy(false); setNote(r.message || (r.success ? 'Đã cập nhật.' : 'Thao tác chưa hoàn tất.')); if (r.success) reload(); };
  const save = async () => {
    if (!form || busy || uncertainCreate) return;
    const run = scope.current; setBusy(true); setNote('');
    const r = detail ? await service.update(detail.id, form) : await service.create(form);
    if (scope.current !== run) return;
    if (!r.success || !r.data) { setBusy(false); if (!detail && r.status === 0) { setUncertainCreate(true); setNote('Chưa rõ bộ truyện đã được tạo. Tải lại danh sách để kiểm tra trước khi tạo thêm.'); } else setNote(r.message); return; }
    setDetail(r.data); // Preserve the created id if saving items fails: retry must not create a second roadmap.
    const saved = await service.items(r.data.id, items);
    if (scope.current !== run) return;
    setBusy(false); setNote(saved.message || (saved.success ? 'Đã lưu bộ truyện.' : 'Metadata đã lưu; chưa lưu được danh sách truyện. Hãy thử lưu lại.'));
    if (saved.success && saved.data) setDetail(saved.data);
  };
  const writable = moderator && (!detail || detail.isMine && detail.status === 'Draft');
  const move = (index: number, delta: number) => { const next = [...items]; const target = index + delta; if (target < 0 || target >= next.length) return; [next[index],next[target]] = [next[target],next[index]]; setItems(next); };
  return <Page title="Bộ truyện mẫu" sub="Moderator soạn bộ; reviewer khác kiểm duyệt trước khi Parent sao chép cho trẻ." actions={moderator && <button className="btn btn-p" disabled={busy || uncertainCreate} onClick={() => { scope.current = Symbol(); setDetail(null); setItems([]); setForm(blank()); }}>Tạo bộ mới</button>}>
    {note && <div className="notice" role="status">{note}</div>}{uncertainCreate && <button className="btn btn-s" onClick={() => { setUncertainCreate(false); reload(); }}>Tải lại để đối chiếu bộ vừa tạo</button>}
    <div className="row"><select className="inp" value={group} onChange={e => { setGroup(e.target.value as B.RoadmapListGroupName); setPage(1); }}>{Object.entries(groups).map(([k,v]) => <option value={k} key={k}>{v}</option>)}</select><button className="btn btn-s" disabled={busy} onClick={reload}>Tải lại</button></div>
    <div className="st-list">{list?.items.map(d => <button className="st-item" key={d.id} onClick={() => void open(d.id)}><b>{d.name}</b><span>{d.storyCount} truyện · {d.status}</span><small>{fmt(d.publishedAt ?? d.submittedAt)}{d.needsUpdate ? ' · Có truyện cần cập nhật' : ''}</small></button>)}</div>
    <div className="row"><button className="btn btn-s" disabled={page === 1} onClick={() => setPage(v => v - 1)}>Trước</button><span>Trang {page}</span><button className="btn btn-s" disabled={!list?.hasNextPage} onClick={() => setPage(v => v + 1)}>Tiếp</button></div>
    {form && <section className="st-card">
      <h3>{detail ? `Bộ #${detail.id}` : 'Bộ mới'}</h3><fieldset disabled={!writable || busy} style={{ border: 0, padding: 0 }}>
        <label className="field">Tên bộ<input className="inp" maxLength={200} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label className="field">Mô tả<textarea className="inp" maxLength={2000} value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value || null })} /></label>
        <div className="st-form"><label className="field">Độ tuổi<select className="inp" value={form.ageBand} onChange={e => setForm({ ...form, ageBand: e.target.value })}><option>6-8</option><option>9-10</option></select></label><label className="field">Chủ đề chính<select className="inp" value={form.mainCategoryId} onChange={e => setForm({ ...form, mainCategoryId: Number(e.target.value) })}><option value={0}>Chọn chủ đề</option>{categories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}</select></label>
          {(['readingLevelMin','readingLevelMax','defaultDaysPerStory'] as const).map(key => <label className="field" key={key}>{({ readingLevelMin: 'Mức đọc từ', readingLevelMax: 'Mức đọc đến', defaultDaysPerStory: 'Số ngày mỗi truyện' })[key]}<input type="number" className="inp" min={1} max={key === 'defaultDaysPerStory' ? 30 : 10} value={form[key]} onChange={e => setForm({ ...form, [key]: Number(e.target.value) })} /></label>)}</div>
        <h4>Truyện theo thứ tự</h4>{items.map((i,index) => <div className="row" key={i.storyId}><span>{index + 1}. {candidates?.items.find(s => s.storyId === i.storyId)?.title ?? detail?.stories.find(s => s.storyId === i.storyId)?.title ?? `#${i.storyId}`}</span><input className="inp" aria-label="Số ngày cho truyện" type="number" min={1} max={30} value={i.days ?? ''} onChange={e => setItems(v => v.map(x => x.storyId === i.storyId ? { ...x, days: e.target.value ? Number(e.target.value) : null } : x))} /><button className="btn btn-g" onClick={() => move(index,-1)}>Lên</button><button className="btn btn-g" onClick={() => move(index,1)}>Xuống</button><button className="btn btn-g" onClick={() => setItems(v => v.filter(x => x.storyId !== i.storyId))}>Bỏ</button></div>)}
        <div className="chips">{candidates?.items.filter(c => !items.some(i => i.storyId === c.storyId)).map(c => <button className="chip" key={c.storyId} onClick={() => setItems(v => [...v,{ storyId: c.storyId, days: null }])}>+ {c.title}</button>)}</div>
        <div className="row"><button className="btn btn-s" disabled={candidatePage === 1} onClick={() => setCandidatePage(v => v - 1)}>Truyện trước</button><button className="btn btn-s" disabled={!candidates?.hasNextPage} onClick={() => setCandidatePage(v => v + 1)}>Truyện tiếp</button></div>
        <button className="btn btn-p" disabled={uncertainCreate || !form.name.trim() || !form.mainCategoryId} onClick={() => void save()}>Lưu nháp và thứ tự</button>
      </fieldset>
      {detail?.checks.map(c => <p className={c.passed ? 'sub' : 'notice warn'} key={c.code}>{c.message}</p>)}
      {detail?.lastReview && <p className="notice">Phản hồi: {detail.lastReview.generalNote ?? detail.lastReview.reason ?? detail.lastReview.decision}</p>}
      {moderator && detail && <><label className="field">Lý do lưu trữ<input className="inp" maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label><div className="row">
        {detail.isMine && detail.canSubmit && <button className="btn btn-p" disabled={busy} onClick={() => void act(() => service.submit(detail.id))}>Gửi duyệt</button>}
        {detail.isMine && detail.status === 'PendingReview' && <button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.withdraw(detail.id))}>Rút yêu cầu duyệt</button>}
        {(detail.status === 'Published' || group === 'Orphaned') && <button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.clone(detail.id))}>Nhân bản để sửa</button>}
        {detail.status === 'Published' && <button className="btn btn-no" disabled={busy || reason.trim().length < 3} onClick={() => void act(() => service.archive(detail.id, reason))}>Lưu trữ bộ</button>}
      </div></>}
    </section>}
  </Page>;
}
