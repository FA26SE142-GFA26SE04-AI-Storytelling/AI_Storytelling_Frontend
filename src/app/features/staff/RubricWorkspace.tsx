'use client';
import { useEffect, useRef, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { rubricService as service, type RubricAudit, type RubricEvaluation, type RubricPage } from '@/app/services/rubricService';
import { useAuth } from '@/app/context/AuthContext';
import type { ApiResponse } from '@/app/types/auth';
import { Page, fmt } from './ui';
const emptyDefinition = (): B.RubricDefinition => ({ purpose: '', criteria: [1,2,3,4,5].map(n => ({ code: `GZ0${n}`, name: '', check: '', context: '', levels: { '0': '', '1': '', '2': '', '3': '', '4': '' }, examples: [] })) });
export default function RubricWorkspace() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [catalog, setCatalog] = useState<RubricPage<B.RubricDto> | null>(null);
  const [current, setCurrent] = useState<B.RubricDto | null>(null);
  const [versionNo, setVersionNo] = useState('');
  const [name, setName] = useState('');
  const [definition, setDefinition] = useState<B.RubricDefinition | null>(null);
  const [examplesText, setExamplesText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [revision, setRevision] = useState(0);
  const [audit, setAudit] = useState<RubricPage<RubricAudit> | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [evaluation, setEvaluation] = useState<RubricEvaluation | null>(null);
  const [trial, setTrial] = useState({ phase: 'phase2', ageBand: '6-8', language: 'vi', title: '', content: '' });
  const scope = useRef(Symbol());
  useEffect(() => {
    const controller = new AbortController(); let alive = true;
    scope.current = Symbol(); setCurrent(null); setDefinition(null); setCatalog(null); setBusy(false);
    void service.list(status || undefined, page, controller.signal).then(r => { if (alive) { setCatalog(r.data); if (!r.success) setNote(r.message); } });
    return () => { alive = false; scope.current = Symbol(); controller.abort(); };
  }, [status, page, revision, user?.id]);
  const select = (r: B.RubricDto) => { scope.current = Symbol(); setCurrent(r); setVersionNo(r.versionNo); setName(r.name); setDefinition(r.definition); setExamplesText(JSON.stringify(r.definition.criteria.map(c => ({ code: c.code, examples: c.examples })), null, 2)); setAudit(null); setEvaluation(null); setNote(''); };
  const open = async (id: number) => { const run = Symbol(); scope.current = run; const r = await service.get(id); if (scope.current !== run) return; if (r.success && r.data) select(r.data); else setNote(r.message); };
  const act = async (fn: () => Promise<ApiResponse<unknown>>) => { if (busy) return; const run = scope.current; setBusy(true); setNote(''); const r = await fn(); if (scope.current !== run) return; setBusy(false); setNote(r.message || (r.success ? 'Đã thực hiện.' : 'Thao tác chưa hoàn tất.')); return r; };
  const save = async () => {
    if (!definition) return;
    let parsed: unknown;
    try { parsed = JSON.parse(examplesText || '[]'); } catch { setNote('Ví dụ JSON chưa hợp lệ.'); return; }
    if (!Array.isArray(parsed) || parsed.some(c => !c || typeof c !== 'object' || !Array.isArray(c.examples))) { setNote('Ví dụ phải là danh sách {code, examples}.'); return; }
    const d = { ...definition, criteria: definition.criteria.map(c => ({ ...c, examples: (parsed as { code: string; examples: B.RubricExample[] }[]).find(x => x.code === c.code)?.examples ?? c.examples })) };
    const body = { name, versionNo, definition: d, revision: current?.revision ?? 0 };
    const r = await act(() => current ? service.update(current.id, body) : service.create(body));
    if (r?.success && r.data) select(r.data as B.RubricDto);
    // On conflict leave the draft intact. The explicit reload button lets the reviewer compare before editing again.
  };
  const loadAudit = async (p: number) => { if (!current) return; const r = await act(() => service.audit(current.id, p)); if (r?.success) { setAudit(r.data as RubricPage<RubricAudit>); setAuditPage(p); } };
  const writable = !current || current.status === 'Draft';
  const updateCriterion = (index: number, patch: Partial<B.RubricCriterion>) => setDefinition(d => d ? { ...d, criteria: d.criteria.map((c,i) => i === index ? { ...c, ...patch } : c) } : d);
  return <Page title="Bộ tiêu chí vùng xám" sub="Chỉnh bản nháp, kiểm tra và thử có chủ đích. Administrator kích hoạt phiên bản dùng cho xử lý mới." actions={<button className="btn btn-p" disabled={busy} onClick={() => { scope.current = Symbol(); setCurrent(null); setVersionNo(''); setName(''); setDefinition(emptyDefinition()); setExamplesText('[]'); setAudit(null); setEvaluation(null); }}>Tạo bản nháp</button>}>
    {note && <div className="notice" role="status">{note}</div>}
    <div className="row"><select className="inp" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tất cả trạng thái</option>{['Draft','Active','Retired'].map(s => <option key={s}>{s}</option>)}</select><button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.active()).then(r => { if (r?.success && r.data) void open((r.data as B.RubricSnapshot).id); })}>Xem bộ đang dùng</button></div>
    <div className="st-list">{catalog?.items.map(r => <button className="st-item" key={r.id} disabled={busy} onClick={() => void open(r.id)}><b>{r.name}</b><small>{r.versionNo} · {r.status} · sửa lần {r.revision}</small></button>)}</div>
    <div className="row"><button className="btn btn-s" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</button><span>Trang {page}</span><button className="btn btn-s" disabled={!catalog || page * catalog.pageSize >= catalog.totalCount} onClick={() => setPage(p => p + 1)}>Tiếp</button></div>
    {definition && <section className="st-card"><h3>{current ? current.name : 'Bộ mới'}</h3>
      {current && <p className="sub">{current.status} · {current.versionNo} · sửa lần {current.revision}<br />Mã nội dung: {current.contentHash}</p>}
      <label className="field">Phiên bản (đặt tên mới khi nhân bản)<input className="inp" maxLength={50} value={versionNo} onChange={e => setVersionNo(e.target.value)} /></label>
      <label className="field">Tên bộ<input className="inp" maxLength={200} value={name} onChange={e => setName(e.target.value)} /></label>
      <fieldset disabled={busy || !writable} style={{ border: 0, padding: 0 }}><label className="field">Mục đích<textarea className="inp" maxLength={2000} value={definition.purpose} onChange={e => setDefinition({ ...definition, purpose: e.target.value })} /></label>
      {definition.criteria.map((c,index) => <details key={c.code}><summary>{c.code} · {c.name || 'Chưa đặt tên'}</summary><div className="sec">
        <label className="field">Tên tiêu chí<input className="inp" maxLength={200} value={c.name} onChange={e => updateCriterion(index, { name: e.target.value })} /></label>
        <label className="field">Cách đánh giá<textarea className="inp" maxLength={4000} value={c.check} onChange={e => updateCriterion(index, { check: e.target.value })} /></label>
        <label className="field">Ngữ cảnh<textarea className="inp" maxLength={4000} value={c.context} onChange={e => updateCriterion(index, { context: e.target.value })} /></label>
        {[0,1,2,3,4].map(level => <label className="field" key={level}>Mô tả mức {level}<textarea className="inp" maxLength={2000} value={c.levels[String(level)] ?? ''} onChange={e => updateCriterion(index, { levels: { ...c.levels, [level]: e.target.value } })} /></label>)}
      </div></details>)}
      <details><summary>Ví dụ cho các tiêu chí</summary><p className="sub">Mỗi tiêu chí tối đa 10 ví dụ, gồm text, level 0–4, reason. Nhập danh sách JSON theo code.</p><textarea className="inp" rows={8} value={examplesText} onChange={e => setExamplesText(e.target.value)} /></details>
      <button className="btn btn-p" disabled={!name.trim() || !versionNo.trim()} onClick={() => void save()}>Lưu bản nháp</button></fieldset>
      {current && <><div className="row"><button className="btn btn-s" disabled={busy} onClick={() => void open(current.id)}>Tải lại bản máy chủ</button><button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.clone(current.id, { versionNo, name })).then(r => { if (r?.success && r.data) select(r.data as B.RubricDto); })}>Nhân bản với tên phiên bản mới</button><button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.validate(current.id, current.revision))}>Kiểm tra cấu trúc</button>
        {current.status === 'Draft' && <button className="btn btn-no" disabled={busy} onClick={() => void act(() => service.remove(current.id, current.revision)).then(r => { if (r?.success) setRevision(v => v + 1); })}>Xóa bản nháp</button>}
        {user?.role === 'Administrator' && current.status === 'Draft' && <button className="btn btn-ok" disabled={busy} onClick={() => void act(() => service.activate(current.id, current.revision)).then(r => { if (r?.success && r.data) select(r.data as B.RubricDto); })}>Kích hoạt thay bộ đang dùng</button>}
      </div>
      <details><summary>Thử đánh giá nội dung</summary><p className="sub">Thao tác này gọi AI thật và ghi lịch sử.</p><div className="row">{(['phase','ageBand','language'] as const).map(key => <select className="inp" aria-label={key} key={key} value={trial[key]} onChange={e => setTrial({ ...trial, [key]: e.target.value })}>{(key === 'phase' ? ['phase1','phase2','phase3','phase4'] : key === 'ageBand' ? ['6-8','9-10'] : ['vi','en']).map(v => <option key={v}>{v}</option>)}</select>)}</div><input className="inp" aria-label="Tên truyện thử" value={trial.title} onChange={e => setTrial({ ...trial, title: e.target.value })} /><textarea className="inp" aria-label="Nội dung thử" rows={6} value={trial.content} onChange={e => setTrial({ ...trial, content: e.target.value })} /><button className="btn btn-s" disabled={busy || !trial.title.trim() || !trial.content.trim()} onClick={() => void act(() => service.evaluate(current.id, { ...trial, revision: current.revision })).then(r => { if (r?.success) setEvaluation(r.data as RubricEvaluation); })}>Chạy thử trên phiên bản đã lưu</button>
        {evaluation && <div className="sec"><b>Mức rủi ro: {evaluation.riskScore}</b><p>{evaluation.provider} · {evaluation.model} · {evaluation.version}</p>{evaluation.findings.map((f,i) => <blockquote key={i}>{f.evidenceQuote}<p>{f.reason} · {f.contextNote}</p></blockquote>)}</div>}
      </details><button className="btn btn-s" disabled={busy} onClick={() => void loadAudit(1)}>Xem lịch sử thay đổi</button>{audit && <><ul>{audit.items.map(a => <li key={a.id}>{fmt(a.createdAt)} · {a.action} · người dùng #{a.actorUserId}<details><summary>Nội dung thay đổi</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{a.beforeJson}</pre><pre style={{ whiteSpace: 'pre-wrap' }}>{a.afterJson}</pre></details></li>)}</ul><div className="row"><button className="btn btn-s" disabled={busy || auditPage === 1} onClick={() => void loadAudit(auditPage - 1)}>Lịch sử trước</button><button className="btn btn-s" disabled={busy || auditPage * audit.pageSize >= audit.totalCount} onClick={() => void loadAudit(auditPage + 1)}>Lịch sử tiếp</button></div></>}
      </>}
    </section>}
  </Page>;
}
