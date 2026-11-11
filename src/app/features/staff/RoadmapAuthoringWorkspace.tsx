'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { roadmapTemplateService as service } from '@/app/services/roadmapTemplateService';
import { staffService } from '@/app/services/staffService';
import type * as B from '@/app/types/backendContracts';
import { useAuth } from '@/app/context/AuthContext';
import type { ApiResponse } from '@/app/types/auth';
import Frog from '@/app/components/brand/Frog';
import Dialog from '@/app/components/Dialog';
import IconButton from '@/app/components/IconButton';
import InfoTip from '@/app/components/InfoTip';
import { useStoryCovers } from '@/app/features/roadmap/roadmapData';
import { confirmDialog } from '@/app/lib/confirm';
import { ArrowDown, ArrowUp, Archive, Check, ChevronLeft, ChevronRight, CircleAlert, Copy, Plus, RefreshCw, Save, Send, Trash2, Undo2, X } from 'lucide-react';
import RoadmapStoryPicker from './RoadmapStoryPicker';
import { Page, fmt } from './ui';

const blank = (): B.SaveRoadmapRequestDto => ({ name: '', description: null, ageBand: '6-8', mainCategoryId: 0, readingLevelMin: 1, readingLevelMax: 3, defaultDaysPerStory: 3 });
const GROUPS: { id: B.RoadmapListGroupName; label: string }[] = [
  { id: 'Drafts', label: 'Bản nháp' }, { id: 'Pending', label: 'Chờ duyệt' }, { id: 'Published', label: 'Đang công khai' },
  { id: 'Archived', label: 'Đã lưu trữ' }, { id: 'Orphaned', label: 'Cần tiếp quản' },
];
const STATUS: Record<string, [string, string]> = {
  Draft: ['Bản nháp', 'draft'], PendingReview: ['Đang chờ duyệt', 'wait'], Published: ['Đang công khai', 'ok'], Archived: ['Đã lưu trữ', 'draft'],
  ChangesRequested: ['Cần sửa', 'flag'], Rejected: ['Bị từ chối', 'flag'],
};
const statusOf = (s: string) => STATUS[s] ?? ['Khác', 'draft'];
const AGES = [{ id: '6-8', label: '6–8 tuổi' }, { id: '9-10', label: '9–10 tuổi' }];
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const LEVELS = range(1, 10);
const DAYS = range(1, 30);
const DAY_CHOICES = [2, 3, 5, 7];

/** Phân khu Soạn lộ trình: giữ đủ 5 group (Drafts, Pending, Published, Archived, Orphaned), two-step save và dirty guard. */
export default function RoadmapAuthoringWorkspace({
  pendingDraftId,
  onConsumedDraft,
  onDirtyChange,
}: {
  pendingDraftId: number | null;
  onConsumedDraft: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { user } = useAuth();
  const moderator = user?.role === 'Moderator';
  const [group, setGroup] = useState<B.RoadmapListGroupName>('Drafts');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<B.PagedResult<B.RoadmapListItemDto> | null>(null);
  const [detail, setDetail] = useState<B.RoadmapDetailDto | null>(null);
  const [form, setForm] = useState<B.SaveRoadmapRequestDto | null>(null);
  const [items, setItems] = useState<B.RoadmapItemInputDto[]>([]);
  const [categories, setCategories] = useState<{ id: number; displayName: string }[]>([]);
  const [picking, setPicking] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [uncertainCreate, setUncertainCreate] = useState(false);
  const [revision, setRevision] = useState(0);
  const [titles, setTitles] = useState<Record<number, { title: string; level: number | null; eligible: boolean }>>({});
  const [base, setBase] = useState<string | null>(null);
  const snapshot = (f: B.SaveRoadmapRequestDto | null, l: B.RoadmapItemInputDto[]) => JSON.stringify({ f, l });
  const scope = useRef(Symbol());
  const reopen = useRef<number | null>(pendingDraftId);
  const openRef = useRef<(id: number) => Promise<void>>(async () => {});
  const reload = useCallback(() => setRevision(v => v + 1), []);

  useEffect(() => {
    if (pendingDraftId == null) return;
    reopen.current = pendingDraftId;
    onConsumedDraft();
    if (group === 'Drafts') reload();
    else { setPage(1); setGroup('Drafts'); }
  }, [pendingDraftId, group, onConsumedDraft, reload]);

  useEffect(() => {
    const controller = new AbortController(); let alive = true;
    scope.current = Symbol(); setDetail(null); setForm(null); setList(null);
    void service.list(group, page, controller.signal).then(r => {
      if (!alive) return;
      setList(r.data); if (!r.success) setNote(r.message);
      if (reopen.current !== null) { const id = reopen.current; reopen.current = null; void openRef.current(id); }
    });
    void staffService.categories().then(r => { if (alive) setCategories(r.data ?? []); });
    return () => { alive = false; scope.current = Symbol(); controller.abort(); };
  }, [group, page, revision, user?.id]);

  const open = async (id: number) => {
    const run = Symbol(); scope.current = run; setNote(''); setBusy(true);
    const r = await service.get(id);
    if (scope.current !== run) return;
    setBusy(false);
    if (!r.success || !r.data) { setNote(r.message); return; }
    const d = r.data; const nextItems = d.stories.slice().sort((a, b) => a.position - b.position).map(s => ({ storyId: s.storyId, days: s.days }));
    const nextForm = { name: d.name, description: d.description, ageBand: d.ageBand, mainCategoryId: d.mainCategory?.id ?? 0, readingLevelMin: d.readingLevelMin, readingLevelMax: d.readingLevelMax, defaultDaysPerStory: d.defaultDaysPerStory };
    setTitles(t => ({ ...t, ...Object.fromEntries(d.stories.map(s => [s.storyId, { title: s.title ?? `Truyện #${s.storyId}`, level: s.readingLevel, eligible: s.isEligible && !d.retiredStoryIds.includes(s.storyId) }])) }));
    setDetail(d); setItems(nextItems); setForm(nextForm); setBase(snapshot(nextForm, nextItems));
  };
  useEffect(() => { openRef.current = open; });

  const thenOpen = (id: number, nextGroup: B.RoadmapListGroupName) => { reopen.current = id; setPage(1); if (group === nextGroup) reload(); else setGroup(nextGroup); };
  const dirty = !detail || snapshot(form, items) !== base;
  const writable = moderator && (!detail || detail.isMine && detail.status === 'Draft');
  const hasUnsavedNavigationRisk = writable && (detail ? dirty : !!form && !!(form.name.trim() || form.description || form.mainCategoryId > 0 || items.length > 0));
  useEffect(() => { onDirtyChange(hasUnsavedNavigationRisk); }, [hasUnsavedNavigationRisk, onDirtyChange]);

  const guardDirty = async () => !hasUnsavedNavigationRisk || await confirmDialog('Bạn có thay đổi lộ trình chưa lưu. Tiếp tục và bỏ thay đổi?');
  const startNew = async () => { if (!(await guardDirty())) return; scope.current = Symbol(); setDetail(null); setItems([]); setForm(blank()); setBase(null); setNote(''); };

  const act = async <T,>(fn: () => Promise<ApiResponse<T>>, after?: (data: T) => void) => {
    if (busy) return false;
    const run = scope.current; setBusy(true); const r = await fn();
    if (scope.current !== run) return false;
    setBusy(false); setNote(r.message || (r.success ? 'Đã cập nhật.' : 'Thao tác chưa hoàn tất.'));
    if (r.success) { if (after && r.data) after(r.data); else reload(); }
    return r.success;
  };

  const save = async () => {
    if (!form || busy || uncertainCreate) return;
    const run = scope.current; setBusy(true); setNote('');
    const r = detail ? await service.update(detail.id, form) : await service.create(form);
    if (scope.current !== run) return;
    if (!r.success || !r.data) {
      setBusy(false);
      if (!detail && r.status === 0) { setUncertainCreate(true); setNote('Chưa rõ lộ trình đã được tạo. Tải lại danh sách để kiểm tra trước khi tạo thêm.'); }
      else setNote(r.message);
      return;
    }
    setDetail(r.data);
    const saved = await service.items(r.data.id, items);
    if (scope.current !== run) return;
    setBusy(false); setNote(saved.message || (saved.success ? 'Đã lưu lộ trình.' : 'Đã lưu thông tin chung; chưa lưu được danh sách truyện. Hãy thử lưu lại.'));
    if (saved.success && saved.data) { setDetail(saved.data); setBase(snapshot(form, items)); }
  };

  const missing = form ? [!form.name.trim() && 'tên lộ trình', !form.mainCategoryId && 'chủ đề chính', form.readingLevelMin > form.readingLevelMax && 'mức đọc "từ" phải nhỏ hơn "đến"'].filter(Boolean) as string[] : [];
  const move = (index: number, delta: number) => { const next = [...items]; const target = index + delta; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setItems(next); };
  const cover = useStoryCovers(items.map(i => i.storyId));
  const set = (patch: Partial<B.SaveRoadmapRequestDto>) => form && setForm({ ...form, ...patch });

  return <Page fit title="Soạn lộ trình mẫu">
    {note && <div className="notice" role="status">{note}</div>}
    <div className="st-split fill rt">
      <div className="st-list rt-side">
        {moderator && <button className="btn btn-p" disabled={busy || uncertainCreate} onClick={() => void startNew()}><Plus className="ic" />Tạo lộ trình mới</button>}
        {uncertainCreate && <button className="btn btn-s" onClick={() => { setUncertainCreate(false); reload(); }}><RefreshCw className="ic" />Tải lại để kiểm tra</button>}
        <div className="rt-groups" role="tablist" aria-label="Nhóm lộ trình">
          {GROUPS.map(g => <button key={g.id} role="tab" aria-selected={group === g.id} className={group === g.id ? 'on' : ''} onClick={() => void guardDirty().then(ok => { if (ok) { setGroup(g.id); setPage(1); } })}>{g.label}</button>)}
          <IconButton icon={RefreshCw} label="Tải lại" className="btn btn-g" disabled={busy} onClick={() => void guardDirty().then(ok => { if (ok) reload(); })} />
        </div>
        {list && list.items.length === 0 && <p className="empty-line">Chưa có lộ trình nào trong nhóm này.</p>}
        {list?.items.map(d => {
          const [label, tone] = statusOf(d.status);
          return <button className={`st-item rt-item${detail?.id === d.id ? ' on' : ''}`} key={d.id} onClick={() => void guardDirty().then(ok => { if (ok) void open(d.id); })}>
            <b>{d.name}</b>
            <span className="rt-pills"><span className={`pill ${tone}`}>{label}</span><span className="pill draft">{d.storyCount} truyện</span>{d.needsUpdate && <span className="pill wait">Có truyện cần cập nhật</span>}</span>
            {(d.publishedAt ?? d.submittedAt) && <small>{fmt(d.publishedAt ?? d.submittedAt)}{!d.isMine && d.createdByName ? ` · ${d.createdByName}` : ''}</small>}
          </button>;
        })}
        {list && (page > 1 || list.hasNextPage) && <div className="rt-pager">
          <IconButton icon={ChevronLeft} label="Trang trước" className="btn btn-g" disabled={page === 1} onClick={() => setPage(v => v - 1)} />
          <span>Trang {page}</span>
          <IconButton icon={ChevronRight} label="Trang sau" className="btn btn-g" disabled={!list.hasNextPage} onClick={() => setPage(v => v + 1)} />
        </div>}
      </div>

      {form ? <section className="st-card rt-editor">
        <header className="rt-head">
          <h3 className="display">{form.name.trim() || (detail ? `Bộ #${detail.id}` : 'Lộ trình mới')}</h3>
          {detail && <span className={`pill ${statusOf(detail.status)[1]}`}>{statusOf(detail.status)[0]}</span>}
          {detail && !detail.isMine && <span className="pill draft">Của {detail.createdByName ?? 'Moderator khác'}</span>}
        </header>
        {detail && !writable && <p className="notice">{!moderator ? 'Bạn đang xem lộ trình (chỉ Moderator được sửa).' : !detail.isMine ? 'Lộ trình của Moderator khác: bạn chỉ xem được.' : detail.status === 'PendingReview' ? 'Đang chờ duyệt nên chưa sửa được. Muốn sửa, hãy rút yêu cầu duyệt.' : detail.status === 'Published' ? 'Đang công khai nên không sửa trực tiếp được. Muốn sửa, hãy nhân bản.' : 'Lộ trình này không còn sửa được.'}</p>}
        <fieldset className="rt-body" disabled={!writable || busy}>
          <section className="rt-step">
            <h4><span className="rt-num">1</span>Thông tin chung</h4>
            <label className="field"><span className="lbl">Tên lộ trình <em className="rt-req">*</em></span><input className="inp" maxLength={200} value={form.name} onChange={e => set({ name: e.target.value })} placeholder="Ví dụ: Khám phá thiên nhiên cho bé 6–8 tuổi" /></label>
            <label className="field"><span className="lbl">Mô tả ngắn</span><textarea className="inp" rows={2} maxLength={2000} value={form.description ?? ''} onChange={e => set({ description: e.target.value || null })} placeholder="Bộ truyện này giúp bé…" /></label>
            <div className="rt-grid">
              <div className="field"><span className="lbl">Độ tuổi</span>
                <div className="seg rt-seg" role="radiogroup" aria-label="Độ tuổi">{AGES.map(a => <button type="button" key={a.id} role="radio" aria-checked={form.ageBand === a.id} className={form.ageBand === a.id ? 'on' : ''} onClick={() => set({ ageBand: a.id })}>{a.label}</button>)}</div></div>
              <label className="field"><span className="lbl">Chủ đề chính <em className="rt-req">*</em></span>
                <select className="inp" value={form.mainCategoryId} onChange={e => set({ mainCategoryId: Number(e.target.value) })}><option value={0}>Chọn chủ đề</option>{categories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}</select></label>
              <div className="field"><span className="lbl">Mức đọc <InfoTip text="Khoảng mức đọc phù hợp của bộ (1 là dễ nhất). Truyện ngoài khoảng này sẽ bị cảnh báo khi kiểm tra." /></span>
                <div className="rt-range">
                  <select className="inp" aria-label="Mức đọc từ" value={form.readingLevelMin} onChange={e => set({ readingLevelMin: Number(e.target.value) })}>{LEVELS.map(l => <option key={l} value={l}>Mức {l}</option>)}</select>
                  <span>đến</span>
                  <select className="inp" aria-label="Mức đọc đến" value={form.readingLevelMax} onChange={e => set({ readingLevelMax: Number(e.target.value) })}>{LEVELS.map(l => <option key={l} value={l}>Mức {l}</option>)}</select>
                </div></div>
              <div className="field"><span className="lbl">Số ngày đọc mỗi truyện <InfoTip text="Thời gian gợi ý cho mỗi truyện; có thể đặt riêng cho từng truyện ở bước 2." /></span>
                <div className="rt-days-pick">
                  <div className="seg rt-seg" role="radiogroup" aria-label="Số ngày đọc mỗi truyện">
                    {DAY_CHOICES.map(d => <button type="button" key={d} role="radio" aria-checked={form.defaultDaysPerStory === d} className={form.defaultDaysPerStory === d ? 'on' : ''} onClick={() => set({ defaultDaysPerStory: d })}>{d} ngày</button>)}
                  </div>
                  <select className={`inp rt-days-other${DAY_CHOICES.includes(form.defaultDaysPerStory) ? '' : ' on'}`} aria-label="Số ngày khác" value={DAY_CHOICES.includes(form.defaultDaysPerStory) ? '' : form.defaultDaysPerStory} onChange={e => e.target.value && set({ defaultDaysPerStory: Number(e.target.value) })}>
                    <option value="">Khác…</option>{DAYS.filter(d => !DAY_CHOICES.includes(d)).map(d => <option key={d} value={d}>{d} ngày</option>)}
                  </select>
                </div></div>
            </div>
          </section>
          <section className="rt-step">
            <h4><span className="rt-num">2</span>Truyện trong lộ trình <span className="pill draft">{items.length}</span>
              <button type="button" className="btn btn-s rt-add" onClick={() => setPicking(true)}><Plus className="ic" />Thêm truyện</button></h4>
            {items.length === 0 ? <p className="empty-line">Chưa có truyện nào. Bấm “Thêm truyện” để chọn truyện cho bộ này.</p> : (
              <ol className="rt-stories">
                {items.map((i, index) => {
                  const info = titles[i.storyId];
                  return <li key={i.storyId} className={info && !info.eligible ? 'warn' : ''}>
                    <span className="rt-n">{index + 1}</span>
                    <span className="rt-cover" style={{ background: cover(i.storyId) }} aria-hidden />
                    <span className="rt-title"><b>{info?.title ?? `Truyện #${i.storyId}`}</b>
                      <span className="rt-pills">{info?.level != null && <span className="pill draft">Mức {info.level}</span>}{info && !info.eligible && <span className="pill flag"><CircleAlert className="ic" />Không còn phù hợp</span>}</span></span>
                    <select className="inp rt-days" aria-label={`Số ngày đọc truyện ${index + 1}`} value={i.days ?? ''} onChange={e => setItems(v => v.map(x => x.storyId === i.storyId ? { ...x, days: e.target.value ? Number(e.target.value) : null } : x))}>
                      <option value="">Mặc định ({form.defaultDaysPerStory} ngày)</option>{DAYS.map(d => <option key={d} value={d}>{d} ngày</option>)}
                    </select>
                    <span className="rt-actions">
                      <IconButton icon={ArrowUp} label="Lên" className="btn btn-g" disabled={index === 0} onClick={() => move(index, -1)} />
                      <IconButton icon={ArrowDown} label="Xuống" className="btn btn-g" disabled={index === items.length - 1} onClick={() => move(index, 1)} />
                      <IconButton icon={Trash2} label="Bỏ khỏi lộ trình" className="btn btn-g" onClick={() => setItems(v => v.filter(x => x.storyId !== i.storyId))} />
                    </span>
                  </li>;
                })}
              </ol>
            )}
          </section>
        </fieldset>
        <section className="rt-step">
          <h4><span className="rt-num">3</span>Kiểm tra và gửi duyệt</h4>
          {!detail ? <p className="empty-line">Lưu nháp để hệ thống kiểm tra lộ trình.</p> : <>
            {detail.checks.length > 0 && <ul className="rt-checks">{detail.checks.map(c => <li key={c.code} className={c.passed ? 'ok' : 'bad'}>{c.passed ? <Check className="ic" /> : <CircleAlert className="ic" />}<span>{c.message}</span></li>)}</ul>}
            {detail.lastReview && <p className="notice warn">Phản hồi của người duyệt: {detail.lastReview.generalNote ?? detail.lastReview.reason ?? detail.lastReview.decision}</p>}
            {moderator && <div className="rt-decide">
              {detail.isMine && detail.status === 'Draft' && <button className="btn btn-p" disabled={busy || dirty || !detail.canSubmit} title={dirty ? 'Lưu thay đổi trước khi gửi duyệt' : !detail.canSubmit ? 'Cần đạt hết các điều kiện ở trên' : undefined} onClick={() => void act(() => service.submit(detail.id), () => thenOpen(detail.id, 'Pending'))}><Send className="ic" />Gửi duyệt</button>}
              {detail.isMine && detail.status === 'PendingReview' && <button className="btn btn-s" disabled={busy} onClick={async () => { if (!(await confirmDialog('Rút yêu cầu duyệt lộ trình này?'))) return; void act(() => service.withdraw(detail.id), () => thenOpen(detail.id, 'Drafts')); }}><Undo2 className="ic" />Rút yêu cầu duyệt</button>}
              {(detail.status === 'Published' || group === 'Orphaned') && <button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.clone(detail.id), (c) => thenOpen(c.roadmapId, 'Drafts'))}><Copy className="ic" />Nhân bản để sửa</button>}
              {detail.status === 'Published' && <button className="btn btn-no" disabled={busy} onClick={() => { setReason(''); setArchiving(true); }}><Archive className="ic" />Lưu trữ</button>}
              {detail.isMine && detail.status === 'Draft' && (dirty || !detail.canSubmit) && <span className="rt-why">{dirty ? 'Lưu thay đổi trước khi gửi duyệt.' : 'Cần đạt hết các điều kiện ở trên.'}</span>}
              {detail.status === 'PendingReview' && <span className="rt-why">Moderator khác sẽ duyệt lộ trình này.</span>}
            </div>}
          </>}
        </section>
        {writable && dirty && <footer className="rt-foot">
          {missing.length > 0 && <span className="rt-why"><CircleAlert className="ic" />Còn thiếu: {missing.join(', ')}</span>}
          <button className="btn btn-p" disabled={busy || uncertainCreate || missing.length > 0} onClick={() => void save()}><Save className="ic" />{busy ? 'Đang lưu…' : 'Lưu nháp'}</button>
        </footer>}
      </section> : <div className="st-card st-empty"><Frog size={120} mood="think" /><b className="display">Chọn một lộ trình để xem</b>{moderator && <button className="btn btn-p" onClick={() => void startNew()}><Plus className="ic" />Tạo lộ trình mới</button>}</div>}
    </div>
    {picking && form && <RoadmapStoryPicker ageBand={form.ageBand} chosen={items.map(i => i.storyId)}
      onAdd={(s) => { setTitles(t => ({ ...t, [s.storyId]: { title: s.title ?? `Truyện #${s.storyId}`, level: s.readingLevel, eligible: true } })); setItems(v => v.some(x => x.storyId === s.storyId) ? v : [...v, { storyId: s.storyId, days: null }]); }}
      onRemove={(id) => setItems(v => v.filter(x => x.storyId !== id))}
      onClose={() => setPicking(false)} />}
    {archiving && detail && <Dialog title="Lưu trữ lộ trình" onClose={() => { if (!busy) setArchiving(false); }}>
      <p style={{ margin: 0 }}>Lộ trình “{detail.name}” sẽ không còn hiện trong thư viện của phụ huynh.</p>
      <label className="field"><span className="lbl">Lý do <em className="rt-req">*</em></span><textarea className="inp" rows={3} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ít nhất 3 ký tự" autoFocus /></label>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-g" disabled={busy} onClick={() => setArchiving(false)}><X className="ic" />Hủy</button>
        <button className="btn btn-no" disabled={busy || reason.trim().length < 3} onClick={() => void act(() => service.archive(detail.id, reason)).then(ok => { if (ok) setArchiving(false); })}><Archive className="ic" />Lưu trữ</button>
      </div>
    </Dialog>}
  </Page>;
}
