'use client';
import { useEffect, useRef, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { rubricService as service, type RubricAudit, type RubricEvaluation, type RubricPage } from '@/app/services/rubricService';
import { useAuth } from '@/app/context/AuthContext';
import type { ApiResponse } from '@/app/types/auth';
import { CheckCheck, ChevronLeft, ChevronRight, Copy, FilePlus2, History, Play, Power, RefreshCw, Save, Trash2, Eye } from 'lucide-react';
import Select from '@/app/components/Select';
import IconButton from '@/app/components/IconButton';
import Frog from '@/app/components/brand/Frog';
import { Page, fmt } from './ui';
import { confirmDialog } from "@/app/lib/confirm";
import { auditActionLabel, rubricAuditLines } from './readableJson';
const STATUS_LABEL: Record<string, string> = { Draft: 'Bản nháp', Active: 'Đang dùng', Retired: 'Đã ngừng' };
const STATUS_OPTIONS = [{ value: '', label: 'Tất cả trạng thái' }, ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))];
const TRIAL_OPTIONS = {
  phase: ['phase1', 'phase2', 'phase3', 'phase4'].map((value, i) => ({ value, label: `Giai đoạn ${i + 1}` })),
  ageBand: [{ value: '6-8', label: '6–8 tuổi' }, { value: '9-10', label: '9–10 tuổi' }],
  language: [{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'Tiếng Anh' }],
};
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
  const dirty = !current || !definition || versionNo !== current.versionNo || name !== current.name
    || JSON.stringify(definition) !== JSON.stringify(current.definition);
  const select = (r: B.RubricDto) => { scope.current = Symbol(); setCurrent(r); setVersionNo(r.versionNo); setName(r.name); setDefinition(r.definition); setAudit(null); setEvaluation(null); setNote(''); };
  const open = async (id: number) => { const run = Symbol(); scope.current = run; const r = await service.get(id); if (scope.current !== run) return; if (r.success && r.data) select(r.data); else setNote(r.message); };
  const act = async (fn: () => Promise<ApiResponse<unknown>>) => { if (busy) return; const run = scope.current; setBusy(true); setNote(''); const r = await fn(); if (scope.current !== run) return; setBusy(false); setNote(r.message || (r.success ? 'Đã thực hiện.' : 'Thao tác chưa hoàn tất.')); return r; };
  const save = async () => {
    if (!definition) return;
    const body = { name, versionNo, definition, revision: current?.revision ?? 0 };
    const r = await act(() => current ? service.update(current.id, body) : service.create(body));
    if (r?.success && r.data) select(r.data as B.RubricDto);
    // On conflict leave the draft intact. The explicit reload button lets the reviewer compare before editing again.
  };
  const loadAudit = async (p: number) => { if (!current) return; const r = await act(() => service.audit(current.id, p)); if (r?.success) { setAudit(r.data as RubricPage<RubricAudit>); setAuditPage(p); } };
  const writable = !current || current.status === 'Draft';
  const updateCriterion = (index: number, patch: Partial<B.RubricCriterion>) => setDefinition(d => d ? { ...d, criteria: d.criteria.map((c,i) => i === index ? { ...c, ...patch } : c) } : d);
  return <Page fit title="Bộ tiêu chí vùng xám">
    {note && <div className="notice" role="status">{note}</div>}
    <div className="st-split fill">
    <div className="st-list">
    <div className="row st-rubric-bar"><Select<string> ariaLabel="Trạng thái" value={status} options={STATUS_OPTIONS} onChange={v => { setStatus(v); setPage(1); }} /><button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.active()).then(r => { if (r?.success && r.data) void open((r.data as B.RubricSnapshot).id); })}><Eye className="ic" />Bộ đang dùng</button><IconButton icon={FilePlus2} label="Tạo bản nháp" className="btn btn-p" disabled={busy} onClick={() => { scope.current = Symbol(); setCurrent(null); setVersionNo(''); setName(''); setDefinition(emptyDefinition()); setAudit(null); setEvaluation(null); }} /></div>
    {catalog?.items.map(r => <button className={`st-item${current?.id === r.id ? ' on' : ''}`} key={r.id} disabled={busy} onClick={() => void open(r.id)}><b>{r.name}</b><small>{r.versionNo} · {STATUS_LABEL[r.status] ?? r.status} · sửa lần {r.revision}</small></button>)}
    <div className="row"><button className="btn btn-g" aria-label="Trang trước" title="Trang trước" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="ic" /></button><span>Trang {page}</span><button className="btn btn-g" aria-label="Trang tiếp" title="Trang tiếp" disabled={!catalog || page * catalog.pageSize >= catalog.totalCount} onClick={() => setPage(p => p + 1)}><ChevronRight className="ic" /></button></div>
    </div>
    {definition ? <section className="st-card"><div className="st-group"><h3>{current ? current.name : 'Bộ mới'}</h3>
      {current && <p className="sub">{STATUS_LABEL[current.status] ?? current.status} · {current.versionNo} · sửa lần {current.revision}<br />Mã nội dung: {current.contentHash}</p>}</div>
      <div className="st-group"><label className="field">Phiên bản (đặt tên mới khi nhân bản)<input className="inp" maxLength={50} value={versionNo} onChange={e => setVersionNo(e.target.value)} /></label>
      <label className="field">Tên bộ<input className="inp" maxLength={200} value={name} onChange={e => setName(e.target.value)} /></label>
      <fieldset disabled={busy || !writable} style={{ border: 0, padding: 0 }}><label className="field">Mục đích<textarea className="inp" maxLength={2000} value={definition.purpose} onChange={e => setDefinition({ ...definition, purpose: e.target.value })} /></label></fieldset></div>
      <fieldset disabled={busy || !writable} style={{ border: 0, padding: 0 }}><div className="st-group st-acc"><b className="st-group-title">Tiêu chí và ví dụ</b>
      {definition.criteria.map((c,index) => <details key={c.code}><summary>{c.code} · {c.name || 'Chưa đặt tên'}</summary><div className="sec">
        <label className="field">Tên tiêu chí<input className="inp" maxLength={200} value={c.name} onChange={e => updateCriterion(index, { name: e.target.value })} /></label>
        <label className="field">Cách đánh giá<textarea className="inp" maxLength={4000} value={c.check} onChange={e => updateCriterion(index, { check: e.target.value })} /></label>
        <label className="field">Ngữ cảnh<textarea className="inp" maxLength={4000} value={c.context} onChange={e => updateCriterion(index, { context: e.target.value })} /></label>
        {[0,1,2,3,4].map(level => <label className="field" key={level}>Mô tả mức {level}<textarea className="inp" maxLength={2000} value={c.levels[String(level)] ?? ''} onChange={e => updateCriterion(index, { levels: { ...c.levels, [level]: e.target.value } })} /></label>)}
      </div></details>)}
      </div>
      <div className="st-group">{dirty && <div className="row"><button className="btn btn-p" disabled={!name.trim() || !versionNo.trim()} onClick={() => void save()}><Save className="ic" />Lưu</button></div>}</div></fieldset>
      {current && <><div className="st-group"><b className="st-group-title">Thao tác với bộ này</b><div className="row"><button className="btn btn-s" disabled={busy} onClick={() => void open(current.id)}><RefreshCw className="ic" />Tải lại</button><button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.clone(current.id, { versionNo, name })).then(r => { if (r?.success && r.data) select(r.data as B.RubricDto); })}><Copy className="ic" />Nhân bản</button><button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.validate(current.id, current.revision))}><CheckCheck className="ic" />Kiểm tra</button>
        {current.status === 'Draft' && <button className="btn btn-no" disabled={busy} onClick={async () => { if (!(await confirmDialog("Xóa bản nháp tiêu chí? Thao tác này không hoàn tác được."))) return; void act(() => service.remove(current.id, current.revision)).then(r => { if (r?.success) setRevision(v => v + 1); }); }}><Trash2 className="ic" />Xóa</button>}
        {user?.role === 'Administrator' && current.status === 'Draft' && <button className="btn btn-ok" disabled={busy} onClick={async () => { if (!(await confirmDialog("Kích hoạt bộ tiêu chí này? Bộ đang dùng sẽ bị thay thế."))) return; void act(() => service.activate(current.id, current.revision)).then(r => { if (r?.success && r.data) select(r.data as B.RubricDto); }); }}><Power className="ic" />Kích hoạt</button>}
      </div></div>
      <div className="st-group"><details><summary>Thử đánh giá nội dung</summary><p className="sub">Thao tác này gọi AI thật và ghi lịch sử.</p><div className="row st-fields">{(['phase','ageBand','language'] as const).map(key => <div className="field" key={key}><span>{({ phase: 'Giai đoạn', ageBand: 'Độ tuổi', language: 'Ngôn ngữ' })[key]}</span><Select<string> ariaLabel={key} value={trial[key]} options={TRIAL_OPTIONS[key]} onChange={v => setTrial({ ...trial, [key]: v })} /></div>)}</div><label className="field">Tên truyện thử<input className="inp" placeholder="Nhập tên truyện cần thử đánh giá" value={trial.title} onChange={e => setTrial({ ...trial, title: e.target.value })} /></label><label className="field">Nội dung truyện thử<textarea className="inp" rows={6} placeholder="Dán nội dung truyện để AI thử đánh giá theo bộ tiêu chí này" value={trial.content} onChange={e => setTrial({ ...trial, content: e.target.value })} /></label><button className="btn btn-s" disabled={busy || !trial.title.trim() || !trial.content.trim()} onClick={() => void act(() => service.evaluate(current.id, { ...trial, revision: current.revision })).then(r => { if (r?.success) setEvaluation(r.data as RubricEvaluation); })}><Play className="ic" />Chạy thử</button>
        {evaluation && <div className="sec"><b>Mức rủi ro: {evaluation.riskScore}</b><p>{evaluation.provider} · {evaluation.model} · {evaluation.version}</p>{evaluation.findings.map((f,i) => <blockquote key={i}>{f.evidenceQuote}<p>{f.reason} · {f.contextNote}</p></blockquote>)}</div>}
      </details></div><div className="st-group"><button className="btn btn-s st-fit" disabled={busy} onClick={() => void loadAudit(1)}><History className="ic" />Lịch sử</button>{audit && <><ul>{audit.items.map(a => <li key={a.id}>{fmt(a.createdAt)} · <b>{auditActionLabel(a.action)}</b> · người dùng #{a.actorUserId}{(() => { const lines = rubricAuditLines(a.beforeJson, a.afterJson); return lines.length ? <details><summary>Nội dung thay đổi</summary><ul>{lines.map((l, i) => <li key={i}>{l}</li>)}</ul></details> : null; })()}</li>)}</ul><div className="row"><button className="btn btn-s" disabled={busy || auditPage === 1} aria-label="Lịch sử trước" title="Lịch sử trước" onClick={() => void loadAudit(auditPage - 1)}><ChevronLeft className="ic" /></button><button className="btn btn-s" disabled={busy || auditPage * audit.pageSize >= audit.totalCount} aria-label="Lịch sử tiếp" title="Lịch sử tiếp" onClick={() => void loadAudit(auditPage + 1)}><ChevronRight className="ic" /></button></div></>}</div>
      </>}
    </section> : <div className="st-card st-empty"><Frog size={120} mood="think" /><b className="display">Chọn một bộ tiêu chí để xem</b></div>}
    </div>
  </Page>;
}
