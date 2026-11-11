'use client';
import { useEffect, useRef, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { rubricService as service, type RubricAudit, type RubricEvaluation, type RubricPage } from '@/app/services/rubricService';
import { useAuth } from '@/app/context/AuthContext';
import type { ApiResponse } from '@/app/types/auth';
import { ChevronLeft, ChevronRight, Copy, Eye, FilePlus2, Power, RefreshCw, Save, Trash2 } from 'lucide-react';
import IconButton from '@/app/components/IconButton';
import Frog from '@/app/components/brand/Frog';
import { confirmDialog } from '@/app/lib/confirm';
import RubricEvaluationHistory, { type TrialInput, type ValidationResult } from './RubricEvaluationHistory';
import RubricExamplesEditor from './RubricExamplesEditor';
import { Page, fmt } from './ui';
import './rubric-workspace.css';

const STATUS_LABEL: Record<string, string> = { Draft: 'Bản nháp', Active: 'Đang áp dụng', Retired: 'Ngừng áp dụng' };
const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'Draft', label: 'Bản nháp' },
  { value: 'Active', label: 'Đang áp dụng' },
  { value: 'Retired', label: 'Ngừng áp dụng' },
] as const;

const emptyDefinition = (): B.RubricDefinition => ({
  purpose: '',
  criteria: [1, 2, 3, 4, 5].map(n => ({ code: `GZ0${n}`, name: '', check: '', context: '', levels: { '0': '', '1': '', '2': '', '3': '', '4': '' }, examples: [] })),
});

const draftSnapshot = (versionNo: string, name: string, definition: B.RubricDefinition | null) =>
  JSON.stringify({ versionNo, name, definition });

/** Tài liệu 09 — Trang Tiêu chí vùng xám: chia danh sách theo trạng thái, editor tiêu chí & ví dụ, kiểm tra, thử AI và lịch sử. */
export default function RubricWorkspace() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [catalog, setCatalog] = useState<RubricPage<B.RubricDto> | null>(null);
  const [current, setCurrent] = useState<B.RubricDto | null>(null);
  const [versionNo, setVersionNo] = useState('');
  const [name, setName] = useState('');
  const [definition, setDefinition] = useState<B.RubricDefinition | null>(null);
  const [baseSnap, setBaseSnap] = useState('');
  const [busy, setBusy] = useState(false);
  const [conflictBlocked, setConflictBlocked] = useState(false);
  const [note, setNote] = useState('');
  const [revision, setRevision] = useState(0);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [audit, setAudit] = useState<RubricPage<RubricAudit> | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [evaluation, setEvaluation] = useState<RubricEvaluation | null>(null);
  const [trial, setTrial] = useState<TrialInput>({ phase: 'phase2', ageBand: '6-8', language: 'vi', title: '', content: '' });
  const scope = useRef(Symbol());
  const listScope = useRef(Symbol());
  const activeIdRef = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const run = Symbol();
    listScope.current = run;
    scope.current = Symbol();
    activeIdRef.current = null;
    setCurrent(null); setDefinition(null); setCatalog(null);
    setBusy(false); setConflictBlocked(false); setValidation(null); setAudit(null); setEvaluation(null);
    void service.list(status || undefined, page, controller.signal).then(r => {
      if (listScope.current !== run) return;
      setCatalog(r.data);
      if (!r.success) setNote(r.message);
    });
    return () => { listScope.current = Symbol(); scope.current = Symbol(); controller.abort(); };
  }, [status, page, revision, user?.id]);

  const dirty = !!definition && draftSnapshot(versionNo, name, definition) !== baseSnap;
  const guardUnsaved = async () => !dirty || await confirmDialog('Bạn có thay đổi chưa lưu ở bộ tiêu chí này. Tiếp tục và bỏ thay đổi?');

  const select = (r: B.RubricDto) => {
    scope.current = Symbol();
    activeIdRef.current = r.id;
    setCurrent(r); setVersionNo(r.versionNo); setName(r.name); setDefinition(r.definition);
    setBaseSnap(draftSnapshot(r.versionNo, r.name, r.definition));
    setConflictBlocked(false); setValidation(null); setAudit(null); setEvaluation(null); setNote('');
  };

  const startNewDraft = async () => {
    if (!(await guardUnsaved())) return;
    scope.current = Symbol();
    activeIdRef.current = null;
    const blankDef = emptyDefinition();
    setCurrent(null); setVersionNo(''); setName(''); setDefinition(blankDef);
    setBaseSnap(draftSnapshot('', '', blankDef));
    setConflictBlocked(false); setValidation(null); setAudit(null); setEvaluation(null); setNote('');
  };

  const open = async (id: number, skipConfirm = false) => {
    if (!skipConfirm && !(await guardUnsaved())) return;
    const run = Symbol();
    scope.current = run;
    setBusy(true);
    const r = await service.get(id);
    if (scope.current !== run) return;
    setBusy(false);
    if (r.success && r.data) select(r.data);
    else setNote(r.message);
  };

  const act = async <T,>(fn: () => Promise<ApiResponse<T>>, targetId: number | null = activeIdRef.current) => {
    if (busy) return null;
    const run = scope.current;
    setBusy(true); setNote('');
    const r = await fn();
    if (scope.current !== run || activeIdRef.current !== targetId) return null;
    setBusy(false);
    if (r.status === 409) setConflictBlocked(true);
    setNote(r.message || (r.success ? 'Đã thực hiện.' : 'Thao tác chưa hoàn tất.'));
    return r;
  };

  const save = async () => {
    if (!definition || conflictBlocked) return;
    const body = { name, versionNo, definition, revision: current?.revision ?? 0 };
    const r = await act(() => (current ? service.update(current.id, body) : service.create(body)), current?.id ?? null);
    if (r?.success && r.data) select(r.data);
  };

  const loadAudit = async (p: number) => {
    if (!current) return;
    const targetId = current.id;
    const r = await act(() => service.audit(targetId, p), targetId);
    if (r?.success && r.data && activeIdRef.current === targetId) {
      setAudit(r.data);
      setAuditPage(p);
    }
  };

  const writable = !current || current.status === 'Draft';
  const updateCriterion = (index: number, patch: Partial<B.RubricCriterion>) =>
    setDefinition(d => d ? { ...d, criteria: d.criteria.map((c, i) => (i === index ? { ...c, ...patch } : c)) } : d);

  return (
    <Page fit title="Tiêu chí vùng xám">
      {note && <div className={`notice ${conflictBlocked ? 'err' : ''}`} role={conflictBlocked ? 'alert' : 'status'} data-inline-notice>{note}</div>}
      <div className="st-split fill">
        <aside className="st-list" aria-label="Danh sách bộ tiêu chí">
          <div className="rb-pills" role="group" aria-label="Lọc theo trạng thái">
            {STATUS_FILTERS.map(f => (
              <button key={f.value || 'all'} type="button" className={status === f.value ? 'on' : ''} aria-pressed={status === f.value} onClick={() => void guardUnsaved().then(ok => { if (ok) { setStatus(f.value); setPage(1); } })}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="row st-wrap">
            <button type="button" className="btn btn-s" disabled={busy} onClick={() => void guardUnsaved().then(async ok => { if (!ok) return; const r = await act(() => service.active(), activeIdRef.current); if (r?.success && r.data) void open(r.data.id, true); })}>
              <Eye className="ic" />Bộ đang dùng
            </button>
            <IconButton icon={FilePlus2} label="Tạo bản nháp" className="btn btn-p" disabled={busy} onClick={() => void startNewDraft()} />
          </div>
          {catalog?.items.map(r => (
            <button type="button" className={`st-item${current?.id === r.id ? ' on' : ''}`} key={r.id} disabled={busy} onClick={() => void open(r.id)}>
              <b>{r.name}</b>
              <small>{r.versionNo} · {STATUS_LABEL[r.status] ?? r.status} · revision {r.revision}</small>
            </button>
          ))}
          <div className="row">
            <button type="button" className="btn btn-g" aria-label="Trang trước" title="Trang trước" disabled={page === 1 || busy} onClick={() => void guardUnsaved().then(ok => { if (ok) setPage(p => p - 1); })}>
              <ChevronLeft className="ic" />
            </button>
            <span className="sub">Trang {page}</span>
            <button type="button" className="btn btn-g" aria-label="Trang tiếp" title="Trang tiếp" disabled={!catalog || page * catalog.pageSize >= catalog.totalCount || busy} onClick={() => void guardUnsaved().then(ok => { if (ok) setPage(p => p + 1); })}>
              <ChevronRight className="ic" />
            </button>
          </div>
        </aside>

        {definition ? (
          <section className="st-card" aria-label="Chi tiết bộ tiêu chí">
            <div className="rb-sec">
              <div className="rb-meta">
                <h3 style={{ margin: 0 }}>{current ? current.name : 'Bản nháp bộ tiêu chí mới'}</h3>
                {current && <span className={`pill ${current.status === 'Active' ? 'ok' : current.status === 'Draft' ? 'wait' : 'draft'}`}>{STATUS_LABEL[current.status] ?? current.status}</span>}
                {current && <span className="pill draft">Revision {current.revision}</span>}
              </div>
              {current && <span className="rb-hash">Mã nội dung: {current.contentHash}{current.activatedAt ? ` · Kích hoạt: ${fmt(current.activatedAt)}` : ''}</span>}
              {!writable && <p className="notice" role="status" data-inline-notice>Phiên bản Đang áp dụng / Ngừng áp dụng chỉ cho phép đọc. Muốn chỉnh sửa, đổi Phiên bản và Tên bộ rồi bấm Nhân bản.</p>}
              {conflictBlocked && <p className="notice err" role="alert" data-inline-notice>Phát hiện xung đột revision (409). Nội dung chưa lưu vẫn được giữ; hãy bấm Tải lại để đồng bộ revision mới nhất.</p>}
              <label className="field">Phiên bản (đặt tên mới khi nhân bản)<input className="inp" disabled={busy} maxLength={50} value={versionNo} onChange={e => setVersionNo(e.target.value)} /></label>
              <label className="field">Tên bộ tiêu chí<input className="inp" disabled={busy} maxLength={200} value={name} onChange={e => setName(e.target.value)} /></label>
              <fieldset disabled={busy || conflictBlocked || !writable} style={{ border: 0, padding: 0 }}>
                <label className="field">Mục đích áp dụng<textarea className="inp" maxLength={2000} value={definition.purpose} onChange={e => setDefinition({ ...definition, purpose: e.target.value })} /></label>
              </fieldset>
            </div>

            <fieldset disabled={busy || conflictBlocked || !writable} style={{ border: 0, padding: 0 }}>
              <div className="rb-sec st-acc">
                <b className="st-group-title">Tiêu chí &amp; ví dụ</b>
                {definition.criteria.map((c, index) => (
                  <details key={c.code}>
                    <summary>{c.code} · {c.name || 'Chưa đặt tên'}</summary>
                    <div className="sec">
                      <label className="field">Tên tiêu chí<input className="inp" maxLength={200} value={c.name} onChange={e => updateCriterion(index, { name: e.target.value })} /></label>
                      <label className="field">Cách đánh giá<textarea className="inp" maxLength={4000} value={c.check} onChange={e => updateCriterion(index, { check: e.target.value })} /></label>
                      <label className="field">Ngữ cảnh<textarea className="inp" maxLength={4000} value={c.context} onChange={e => updateCriterion(index, { context: e.target.value })} /></label>
                      {[0, 1, 2, 3, 4].map(level => (
                        <label className="field" key={level}>
                          Mô tả mức {level}
                          <textarea className="inp" maxLength={2000} value={c.levels[String(level)] ?? ''} onChange={e => updateCriterion(index, { levels: { ...c.levels, [level]: e.target.value } })} />
                        </label>
                      ))}
                      <RubricExamplesEditor examples={c.examples ?? []} onChange={examples => updateCriterion(index, { examples })} />
                    </div>
                  </details>
                ))}
                {dirty && (
                  <div className="row st-wrap">
                    <button type="button" className="btn btn-p" disabled={busy || conflictBlocked || !name.trim() || !versionNo.trim()} onClick={() => void save()}>
                      <Save className="ic" />Lưu bản nháp
                    </button>
                  </div>
                )}
              </div>
            </fieldset>

            {current && (
              <>
                <div className="rb-sec">
                  <b className="st-group-title">Thao tác phiên bản</b>
                  <div className="row st-wrap">
                    <button type="button" className="btn btn-s" disabled={busy} onClick={() => void open(current.id)}><RefreshCw className="ic" />Tải lại / Đồng bộ</button>
                    <button type="button" className="btn btn-s" disabled={busy} onClick={() => void act(() => service.clone(current.id, { versionNo, name }), current.id).then(r => { if (r?.success && r.data) select(r.data); })}><Copy className="ic" />Nhân bản</button>
                    {current.status === 'Draft' && (
                      <button type="button" className="btn btn-no" disabled={busy || conflictBlocked} onClick={async () => { if (!(await confirmDialog('Xóa bản nháp tiêu chí? Thao tác này không hoàn tác được.'))) return; void act(() => service.remove(current.id, current.revision), current.id).then(r => { if (r?.success) setRevision(v => v + 1); }); }}>
                        <Trash2 className="ic" />Xóa bản nháp
                      </button>
                    )}
                    {user?.role === 'Administrator' && current.status === 'Draft' && (
                      <button type="button" className="btn btn-ok" disabled={busy || conflictBlocked || dirty} onClick={async () => { if (!(await confirmDialog('Kích hoạt bộ tiêu chí này? Bộ đang áp dụng sẽ bị thay thế.'))) return; void act(() => service.activate(current.id, current.revision), current.id).then(r => { if (r?.success && r.data) select(r.data); }); }}>
                        <Power className="ic" />Kích hoạt
                      </button>
                    )}
                  </div>
                  {user?.role === 'Moderator' && current.status === 'Draft' && (
                    <span className="sub">Quyền Kích hoạt chỉ dành cho Administrator; Moderator chịu trách nhiệm soạn thảo, kiểm tra định nghĩa và chạy thử.</span>
                  )}
                </div>

                <RubricEvaluationHistory
                  rubric={current}
                  dirty={dirty}
                  busy={busy}
                  conflictBlocked={conflictBlocked}
                  validation={validation}
                  onValidate={() => void act(() => service.validate(current.id, current.revision), current.id).then(r => { if (r?.success && r.data && activeIdRef.current === current.id) setValidation(r.data); })}
                  trial={trial}
                  onTrialChange={setTrial}
                  evaluation={evaluation}
                  onEvaluate={() => void act(() => service.evaluate(current.id, { ...trial, revision: current.revision }), current.id).then(r => { if (r?.success && r.data && activeIdRef.current === current.id) setEvaluation(r.data); })}
                  audit={audit}
                  auditPage={auditPage}
                  onLoadAudit={p => void loadAudit(p)}
                />
              </>
            )}
          </section>
        ) : (
          <div className="st-card st-empty">
            <Frog size={120} mood="think" />
            <b className="display">Chọn một bộ tiêu chí để xem</b>
          </div>
        )}
      </div>
    </Page>
  );
}
