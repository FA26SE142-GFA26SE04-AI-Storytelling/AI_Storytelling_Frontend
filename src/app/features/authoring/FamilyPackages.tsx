'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Eye, Loader2, Lock, LockOpen, PackagePlus, RefreshCw, RotateCcw, Send, Sparkles, Undo2, User, Wand2 } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import { confirmDialog } from '@/app/lib/confirm';
import { showToast } from '@/app/lib/toast';
import type * as B from '@/app/types/backendContracts';
import type { ChildProfile } from '@/app/types/childProfile';
import { parentAuthoringService } from '@/app/services/parentAuthoringService';
import { parentPackageService as svc, type PackageCheck, type PackageComponents, type ParentPackage, type ParentPackagePreview } from '@/app/services/parentPackageService';
import { issueText, topicNames } from './issueText';

/** Chi tiết khi AI chấm an toàn không đạt: chủ đề bị chặn, câu dính chủ đề và chỗ đổi cài đặt. */
function SafetyDetail({ check, kid }: { check: PackageCheck; kid: string }) {
  const topics = topicNames(check.violations);
  const quotes = [...new Set(check.evidence ?? [])].slice(0, 3);
  return <div className="fp-safety">
    {topics.length > 0 && <span>Chủ đề {check.reasonCode === 'BLOCKED_TOPIC' ? 'đang bị chặn' : 'cần lưu ý'} với {kid}: <b>{topics.join(', ')}</b></span>}
    {quotes.length > 0 && <span>Chỗ trong truyện: {quotes.map((q) => `“${q}”`).join(' · ')}</span>}
    {check.reasonCode === 'BLOCKED_TOPIC' && <span>Muốn giao cho {kid}, hãy sửa truyện để bỏ chủ đề này, hoặc bỏ chặn ở Hồ sơ bé › An toàn › Chủ đề rồi bấm "Đổi thành phần" để tạo bản gói mới.</span>}
  </div>;
}

const PARTS: { key: keyof PackageComponents; label: string }[] = [
  { key: 'vocabulary', label: 'Từ vựng' }, { key: 'quiz', label: 'Câu đố' }, { key: 'listening', label: 'Tương tác khi nghe' },
  { key: 'images', label: 'Tranh' }, { key: 'narration', label: 'Giọng đọc' },
];
const DEFAULT_PARTS: PackageComponents = { vocabulary: true, quiz: true, listening: false, images: true, narration: true };
/** Nhóm tiến độ của Backend: check, vocabulary, quiz, listening, media (tranh + giọng đọc chung một nhóm). */
const STATUS_GROUP: { key: string; label: string }[] = [
  { key: 'check', label: 'Kiểm tra' }, { key: 'vocabulary', label: 'Từ vựng' }, { key: 'quiz', label: 'Câu đố' },
  { key: 'listening', label: 'Tương tác' }, { key: 'media', label: 'Tranh và giọng đọc' },
];
const PART_STATE: Record<string, [string, string]> = {
  NotStarted: ['draft', 'chưa tạo'], Pending: ['wait', 'đang chờ'], Processing: ['wait', 'đang tạo'], Completed: ['ok', 'xong'], Failed: ['flag', 'lỗi'], Cancelled: ['draft', 'đã huỷ'],
};
const RUNNING = ['PendingCheck', 'Checking', 'Generating'];
/** Gói không dùng được nữa (nội dung đã mở lại hoặc gói đã huỷ). */
const STALE = ['Stale', 'Cancelled'];
const busyPart = (p: ParentPackage) => Object.values(p.componentStatus ?? {}).some((v) => v === 'Pending' || v === 'Processing');
const requested = (p: ParentPackage) => STATUS_GROUP.filter((g) => g.key !== 'check' && p.componentStatus?.[g.key] && p.componentStatus[g.key] !== 'NotRequested');
const allDone = (p: ParentPackage) => p.componentStatus?.check === 'Completed' && requested(p).every((g) => p.componentStatus[g.key] === 'Completed');
const needsGenerate = (p: ParentPackage) => p.status === 'Review' && !!p.check?.passed && requested(p).some((g) => p.componentStatus[g.key] === 'NotStarted');
const canConfirm = (p: ParentPackage) => p.status === 'Review' && !!p.check?.passed && allDone(p);

/** Tóm tắt trạng thái một gói thành [tông, chữ] cho người dùng. */
function headline(p: ParentPackage): [string, string] {
  if (p.status === 'PendingCheck' || p.status === 'Checking') return ['wait', 'Đang kiểm tra cho bé'];
  if (p.status === 'Generating' || busyPart(p)) return ['wait', 'Đang tạo học liệu'];
  if (p.status === 'Review') return needsGenerate(p) ? ['wait', 'Đạt kiểm tra, chờ tạo học liệu'] : ['wait', 'Chờ bạn xem và chốt'];
  if (p.status === 'Confirmed') return ['ok', 'Đã chốt gói'];
  if (p.status === 'Blocked') return ['flag', 'Chưa phù hợp với bé'];
  if (p.status === 'Failed') return ['flag', 'Bị lỗi'];
  if (p.status === 'Stale') return ['draft', 'Gói đã cũ'];
  if (p.status === 'Cancelled') return ['draft', 'Đã huỷ'];
  return ['draft', p.status];
}

/** Gói đang dùng của mỗi bé: bản (revision) mới nhất. */
function latestByChild(list: ParentPackage[]) {
  const map = new Map<number, ParentPackage>();
  for (const p of list) { const cur = map.get(p.childProfileId); if (!cur || p.revision > cur.revision || (p.revision === cur.revision && p.packageId > cur.packageId)) map.set(p.childProfileId, p); }
  return [...map.values()].sort((a, b) => a.childProfileId - b.childProfileId);
}

/** Chọn thành phần gói: dùng cho tạo mới và tạo bản gói mới. */
function PartPicker({ value, onChange, disabled }: { value: PackageComponents; onChange: (v: PackageComponents) => void; disabled?: boolean }) {
  return <div className="fp-parts" role="group" aria-label="Thành phần của gói">
    {PARTS.map((p) => <button key={p.key} type="button" className={`fp-part${value[p.key] ? ' on' : ''}`} aria-pressed={value[p.key]} disabled={disabled} onClick={() => onChange({ ...value, [p.key]: !value[p.key] })}>
      {value[p.key] && <Check className="ic" aria-hidden />}{p.label}</button>)}
  </div>;
}

/** Ảnh / âm thanh xem trước: tải kèm token rồi hiện bằng blob, thu hồi blob khi đóng. */
function ProtectedMedia({ url }: { url: string }) {
  const [media, setMedia] = useState<{ url: string; type: string } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const c = new AbortController(); let made: string | null = null;
    void svc.mediaBlob(url, c.signal).then((r) => { if (r.success && r.data) { made = r.data.url; setMedia(r.data); } else if (!c.signal.aborted) setFailed(true); });
    return () => { c.abort(); if (made) URL.revokeObjectURL(made); };
  }, [url]);
  if (failed) return <div className="fp-media-empty">Chưa tải được tệp</div>;
  if (!media) return <div className="fp-media-empty">Đang tải…</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return media.type.startsWith('audio') ? <audio controls src={media.url} /> : <img src={media.url} alt="Tranh trong gói" />;
}

const choicesOf = (c: unknown): string[] => {
  if (Array.isArray(c)) return c.map(String);
  if (typeof c === 'string') { try { const v = JSON.parse(c); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } }
  return [];
};

function PreviewDialog({ storyId, pkg, kidName, onClose }: { storyId: number; pkg: ParentPackage; kidName: string; onClose: () => void }) {
  const [data, setData] = useState<ParentPackagePreview | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { void svc.preview(storyId, pkg.packageId).then((r) => { if (r.success && r.data) setData(r.data); else setError(r.message); }); }, [storyId, pkg.packageId]);
  return <Dialog title={`Xem trước gói của ${kidName}`} wide onClose={onClose}>
    {error ? <p className="notice err" data-inline-notice>{error}</p> : !data ? <p className="sub">Đang tải…</p> : <div className="fp-preview">
      <section><h4>{data.title}</h4>{data.content.split(/\n\s*\n/).map((t, i) => <p key={i}>{t}</p>)}</section>
      {(data.media ?? []).length > 0 && <section><h4>Tranh và giọng đọc</h4><div className="fp-media">{(data.media ?? []).map((m) => <ProtectedMedia key={m.assetId} url={m.previewUrl} />)}</div></section>}
      {(data.vocabulary ?? []).length > 0 && <section><h4>Từ vựng</h4><ul className="fp-list">{(data.vocabulary ?? []).map((w) => <li key={w.id}><b>{w.term}</b>{w.definition && <> — {w.definition}</>}{w.example && <small>Ví dụ: {w.example}</small>}</li>)}</ul></section>}
      {(data.quiz ?? []).length > 0 && <section><h4>Câu đố (có đáp án, bé không thấy phần này)</h4><ol className="fp-list">{(data.quiz ?? []).map((q) => <li key={q.id}><b>{q.question}</b>
        {choicesOf(q.choices).length > 0 && <span className="fp-choices">{choicesOf(q.choices).map((c) => <span key={c} className={`pill${c === q.correctAnswer ? ' ok' : ''}`}>{c}</span>)}</span>}
        {q.correctAnswer && choicesOf(q.choices).length === 0 && <small>Đáp án: {q.correctAnswer}</small>}</li>)}</ol></section>}
      {(data.listening ?? []).length > 0 && <section><h4>Tương tác khi nghe</h4><ul className="fp-list">{(data.listening ?? []).map((l) => <li key={l.id}><b>{l.prompt ?? l.type}</b>
        {(l.options ?? []).length > 0 && <span className="fp-choices">{(l.options ?? []).map((o) => <span key={o.id} className={`pill${o.isMatch ? ' ok' : ''}`}>{o.text}</span>)}</span>}</li>)}</ul></section>}
    </div>}
  </Dialog>;
}

/**
 * Luồng 3b, gói nhiều bé: chốt nội dung → tạo gói riêng từng bé (Backend kiểm tra theo hồ sơ từng bé)
 * → tạo học liệu / media → xem trước → chốt gói → giao nhiều bé trong một lần; thu hồi riêng từng bé.
 */
/** Còn gói đang kiểm tra hoặc đang tạo học liệu (khi đó khoá các nút chuyển trạng thái). */
export const packagesBusy = (list: ParentPackage[]) => latestByChild(list).some((p) => RUNNING.includes(p.status) || busyPart(p));

/** Tiến độ gói của các bé: số bé có gói, số bé đã xong học liệu (chốt được), số bé đã giao. */
export type PackageProgress = { total: number; prepared: number; delivered: number };
export function packageProgress(list: ParentPackage[], workflow: B.ParentOperationDto[]): PackageProgress {
  const granted = new Set(workflow.filter((o) => o.kind === 'FamilyConfirmation' && !o.revokedAt).map((o) => (o.result as B.ParentFamilyConfirmationDto | null)?.childProfileId));
  const usable = latestByChild(list).filter((p) => !STALE.includes(p.status));
  return {
    total: usable.length,
    prepared: usable.filter((p) => granted.has(p.childProfileId) || p.status === 'Confirmed' || canConfirm(p)).length,
    delivered: usable.filter((p) => granted.has(p.childProfileId)).length,
  };
}

export default function FamilyPackages({ story, kids, workflow, canWrite, onReload, onReopen, onBack, onList }: {
  story: B.CreatorDraftDto; kids: ChildProfile[]; workflow: B.ParentOperationDto[]; canWrite: boolean;
  /** Tải lại bản nháp (token mới, quyền đọc). */ onReload: () => Promise<void> | void;
  /** Mở lại nội dung để sửa (tự thu hồi quyền đọc nếu đã giao). */ onReopen: () => Promise<void> | void;
  /** Chưa có gói nào thì cho quay về cách giao một bé. */ onBack?: () => void;
  /** Nhận danh sách gói mới nhất để hiện tiến độ ở cột trái. */ onList?: (list: ParentPackage[]) => void;
}) {
  const storyId = story.storyId;
  const [list, setList] = useState<ParentPackage[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState<Record<number, PackageComponents | null>>({});
  const [preview, setPreview] = useState<ParentPackage | null>(null);
  const [revise, setRevise] = useState<{ pkg: ParentPackage; parts: PackageComponents } | null>(null);
  const [sendIds, setSendIds] = useState<number[] | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = useCallback(async () => {
    const r = await svc.list(storyId);
    if (!alive.current) return;
    if (r.success) setList(r.data ?? []); else { setList((l) => l ?? []); showToast(r.message, 'err'); }
  }, [storyId]);
  useEffect(() => { void load(); }, [load]);

  const live = latestByChild(list ?? []);
  // Còn gói dùng được (chưa cũ, chưa huỷ) nghĩa là nội dung đang chốt.
  const active = live.some((p) => !STALE.includes(p.status));
  const kidName = (id: number) => kids.find((k) => k.id === id)?.nickname ?? `Bé #${id}`;
  // Quyền đọc đang hiệu lực (giao bằng gói hoặc cách cũ), theo từng bé.
  const grants = workflow.filter((o) => o.kind === 'FamilyConfirmation' && !o.revokedAt).map((o) => o.result as B.ParentFamilyConfirmationDto).filter(Boolean);
  const grantOf = (childId: number) => grants.find((g) => g.childProfileId === childId) ?? null;
  // Báo danh sách gói mới nhất lên để cột "Các bước" hiện tiến độ.
  useEffect(() => { if (list !== null) onList?.(list); }, [list, onList]);
  // Còn gói đang chạy thì tự cập nhật mỗi 3 giây (một vòng, đợi lượt trước xong).
  const running = live.some((p) => RUNNING.includes(p.status) || busyPart(p));
  // Đang tạo thì khoá các nút đổi trạng thái chung (tạo gói, đổi thành phần, giao, mở lại) để tránh lỗi giữa chừng.
  const lock = busy || running;
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => { void load(); }, 3000);
    return () => window.clearTimeout(id);
  }, [running, list, load]);

  const run = async (fn: () => Promise<{ success: boolean; message: string }>, ok: string) => {
    if (busy) return false;
    setBusy(true);
    const r = await fn();
    if (!alive.current) return false;
    setBusy(false);
    showToast(r.success ? ok : r.message, r.success ? 'ok' : 'err');
    await load();
    return r.success;
  };
  const cmd = (): B.CreatorVersionCommand => ({ operationId: crypto.randomUUID(), revisionToken: story.revisionToken, baseVersionId: story.selectedVersionId });

  // Bé chưa có gói còn dùng được (bỏ qua gói Đã huỷ / Đã cũ) thì được chọn để tạo gói.
  const eligible = kids.filter((k) => k.status === 'Active' && !live.some((p) => p.childProfileId === k.id && !STALE.includes(p.status)));
  const picked = Object.entries(pick).filter(([, v]) => v).map(([id, v]) => ({ childProfileId: Number(id), components: v! }));
  const create = async () => {
    if (!picked.length) return;
    // Chốt nội dung trước (bản đã chốt thì Backend báo đã chốt, bỏ qua), rồi tạo gói cho các bé đã chọn.
    // Chỉ còn gói đã cũ (sau khi mở lại) cũng phải chốt lại nội dung mới.
    if (!active) {
      if (!(await confirmDialog('Chốt nội dung để tạo gói? Sau khi chốt, muốn sửa nội dung phải mở lại và các gói cũ sẽ không dùng được nữa.'))) return;
      setBusy(true);
      const f = await svc.finalize(storyId, cmd());
      setBusy(false);
      if (!f.success && !/FINALIZED/i.test(f.message)) { showToast(f.message, 'err'); return; }
    }
    if (await run(() => svc.create(storyId, cmd(), picked), `Đã tạo gói cho ${picked.length} bé. Hệ thống đang kiểm tra truyện theo hồ sơ từng bé.`)) setPick({});
  };
  /** Lệnh trên một gói: đọc gói mới nhất (token đổi theo worker) rồi mới gửi. */
  const onPackage = async (p: ParentPackage, fn: (fresh: ParentPackage) => Promise<{ success: boolean; message: string }>, ok: string) => {
    const fresh = await svc.get(storyId, p.packageId);
    if (!fresh.success || !fresh.data) { showToast(fresh.message, 'err'); return false; }
    return run(() => fn(fresh.data!), ok);
  };

  const confirmed = live.filter((p) => p.status === 'Confirmed' && !grantOf(p.childProfileId));
  const selected = sendIds ?? confirmed.map((p) => p.packageId);
  const deliver = async () => {
    const chosen = confirmed.filter((p) => selected.includes(p.packageId));
    if (!chosen.length || !(await confirmDialog(`Giao truyện cho ${chosen.map((p) => kidName(p.childProfileId)).join(', ')}? Một gói chưa đạt thì không bé nào được giao.`))) return;
    const fresh = await Promise.all(chosen.map((p) => svc.get(storyId, p.packageId)));
    if (fresh.some((r) => !r.success || !r.data)) { showToast('Chưa tải được gói mới nhất. Hãy thử lại.', 'err'); return; }
    if (await run(() => svc.deliver(storyId, fresh.map((r) => r.data!)), 'Đã giao truyện. Các bé thấy truyện trong thư viện của mình.')) { setSendIds(null); await onReload(); }
  };
  const revoke = async (childId: number) => {
    const g = grantOf(childId);
    if (!g || !(await confirmDialog(`Thu hồi quyền đọc của ${kidName(childId)}? Các bé khác vẫn đọc được.`))) return;
    if (await run(() => parentAuthoringService.revokeFamily(storyId, { ...cmd(), confirmationId: g.confirmationId } as B.ParentFamilyRevokeRequest), `Đã thu hồi quyền đọc của ${kidName(childId)}.`)) await onReload();
  };

  return <section className="pa-card fp" aria-label="Gói cho từng bé">
    <div className="pa-head"><h3><span className="pa-num">2</span>Gói cho từng bé</h3>
      <button className="btn btn-g icon-only" disabled={busy} onClick={() => void load()} aria-label="Tải lại" title="Tải lại"><RefreshCw className="ic" /></button></div>

    {list === null ? <p className="sub">Đang tải…</p> : <>
      {running && <p className="fp-running" data-inline-notice><Loader2 className="ic spin" aria-hidden />Đang tạo học liệu. Tạm khoá chuyển bước, giao và mở lại cho tới khi xong.</p>}
      {eligible.length > 0 && canWrite && <div className="pa-step fp-new">
        <h4><PackagePlus className="ic" aria-hidden />{active ? 'Thêm bé nhận truyện' : 'Chọn bé nhận truyện'}</h4>
        {eligible.map((k) => <div className={`fp-kid${pick[k.id] ? ' on' : ''}`} key={k.id}>
          <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={!!pick[k.id]} disabled={busy} onChange={(e) => setPick((v) => ({ ...v, [k.id]: e.target.checked ? { ...DEFAULT_PARTS } : null }))} style={{ accentColor: 'var(--primary)' }} /><b>{k.nickname}</b></label>
          {pick[k.id] && <PartPicker value={pick[k.id]!} disabled={busy} onChange={(v) => setPick((p) => ({ ...p, [k.id]: v }))} />}
        </div>)}
        <div className="pa-actions">
          {onBack && !live.length && <button className="btn btn-s" disabled={lock} onClick={onBack} title="Quay về cách giao cho một bé (4 bước)"><User className="ic" />Chỉ giao cho một bé</button>}
          <button className="btn btn-p push" disabled={lock || !picked.length} onClick={() => void create()}><Lock className="ic" />{active ? `Tạo gói cho ${picked.length || ''} bé` : 'Chốt nội dung và tạo gói'}</button>
        </div>
      </div>}

      {live.map((p) => {
        const [tone, label] = headline(p);
        const grant = grantOf(p.childProfileId);
        // Gói đang chờ người dùng thao tác (tạo học liệu, chốt, giao) có viền vàng nhấn.
        const todo = !grant && (needsGenerate(p) || canConfirm(p) || p.status === 'Confirmed');
        return <article className={`fp-card${todo ? ' todo' : ''}`} key={p.packageId}>
          <div className="row fp-card-h"><b className="display grow">{kidName(p.childProfileId)}</b>{p.revision > 1 && <span className="pill draft">Bản {p.revision}</span>}<span className={`pill ${grant ? 'ok' : tone}`}>{grant ? 'Đã giao' : label}</span></div>
          <div className="fp-progress">{STATUS_GROUP.filter((g) => p.componentStatus?.[g.key] && p.componentStatus[g.key] !== 'NotRequested').map((g) => { const [t, l] = PART_STATE[p.componentStatus[g.key]] ?? ['draft', p.componentStatus[g.key]]; return <span key={g.key} className={`pill ${t}`}>{g.label}: {l}</span>; })}</div>
          {p.check && !p.check.passed && p.check.errors.length > 0 && <ul className="pa-issues">{p.check.errors.map((e) => <li className="err" key={e}>
            {issueText(e)}
            {/* Chấm an toàn không đạt: nói rõ chủ đề nào đang bị chặn cho bé và câu nào trong truyện dính chủ đề đó. */}
            {e === 'CONTENT_SAFETY_NOT_PASSED' && <SafetyDetail check={p.check!} kid={kidName(p.childProfileId)} />}
          </li>)}</ul>}
          {p.status === 'Failed' && p.lastErrorCode && <p className="notice warn" data-inline-notice>Lần tạo vừa rồi bị lỗi ({p.lastErrorCode}). Bấm Thử lại; phần đã xong được giữ nguyên.</p>}
          {(p.vocabularyCount > 0 || p.quizCount > 0 || p.listeningCount > 0) && <p className="fp-counts">{[p.vocabularyCount && `${p.vocabularyCount} từ vựng`, p.quizCount && `${p.quizCount} câu đố`, p.listeningCount && `${p.listeningCount} tương tác`].filter(Boolean).join(' · ')}</p>}
          <div className="pa-actions">
            {needsGenerate(p) && <button className="btn btn-p" disabled={busy || !canWrite} onClick={() => void onPackage(p, (f) => svc.generate(storyId, f), 'Đang tạo học liệu cho gói.')}><Wand2 className="ic" />Tạo học liệu</button>}
            {(canConfirm(p) || p.status === 'Confirmed') && <button className="btn btn-s" onClick={() => setPreview(p)}><Eye className="ic" />Xem trước</button>}
            {canConfirm(p) && <button className="btn btn-ok" disabled={busy || !canWrite} onClick={async () => { if (await confirmDialog(`Chốt gói của ${kidName(p.childProfileId)}? Gói đã chốt không sửa được, chỉ tạo bản mới.`)) void onPackage(p, (f) => svc.confirm(storyId, f), 'Đã chốt gói.'); }}><Check className="ic" />Chốt gói</button>}
            {p.status === 'Failed' && <button className="btn btn-s" disabled={busy || !canWrite} onClick={() => void onPackage(p, (f) => svc.retry(storyId, f), 'Đang thử lại phần bị lỗi.')}><RotateCcw className="ic" />Thử lại</button>}
            {!RUNNING.includes(p.status) && !STALE.includes(p.status) && !busyPart(p) && !grant && <button className="btn btn-g" disabled={lock || !canWrite} onClick={() => setRevise({ pkg: p, parts: { ...p.components } })}><Sparkles className="ic" />Đổi thành phần</button>}
            {grant && <button className="btn btn-no" disabled={busy || !canWrite} onClick={() => void revoke(p.childProfileId)}><Undo2 className="ic" />Thu hồi quyền đọc</button>}
          </div>
        </article>;
      })}

      {confirmed.length > 0 && <div className="pa-step fp-deliver">
        <h4><Send className="ic" aria-hidden />Giao truyện</h4>
        <div className="fp-parts">{confirmed.map((p) => { const on = selected.includes(p.packageId); return <button key={p.packageId} type="button" className={`fp-part${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setSendIds(on ? selected.filter((x) => x !== p.packageId) : [...selected, p.packageId])}>{on && <Check className="ic" aria-hidden />}{kidName(p.childProfileId)}</button>; })}</div>
        <div className="pa-actions"><button className="btn btn-ok push" disabled={lock || !canWrite || !selected.length} onClick={() => void deliver()}><Send className="ic" />Giao cho {selected.length} bé</button></div>
      </div>}

      {active && <div className="pa-actions fp-foot">
        <button className="btn btn-g" disabled={lock || !canWrite} title={running ? 'Đang tạo học liệu, chờ xong rồi mở lại' : undefined} onClick={() => void onReopen()}><LockOpen className="ic" />Mở lại để sửa nội dung</button>
      </div>}
    </>}

    {preview && <PreviewDialog storyId={storyId} pkg={preview} kidName={kidName(preview.childProfileId)} onClose={() => setPreview(null)} />}
    {revise && <Dialog title={`Đổi thành phần gói của ${kidName(revise.pkg.childProfileId)}`} onClose={() => setRevise(null)}>
      <div className="st-form">
        <p className="notice">Tạo bản gói mới với thành phần đã chọn; bản cũ giữ lại để tra cứu. Bản mới được kiểm tra lại theo hồ sơ của bé.</p>
        <PartPicker value={revise.parts} disabled={busy} onChange={(v) => setRevise({ ...revise, parts: v })} />
        <div className="row"><button className="btn btn-g" onClick={() => setRevise(null)}>Huỷ</button><span className="grow" />
          <button className="btn btn-p" disabled={lock} onClick={async () => { if (await onPackage(revise.pkg, (f) => svc.revise(storyId, f, revise.parts), 'Đã tạo bản gói mới. Hệ thống đang kiểm tra lại.')) setRevise(null); }}>Tạo bản gói mới</button></div>
      </div>
    </Dialog>}
  </section>;
}
