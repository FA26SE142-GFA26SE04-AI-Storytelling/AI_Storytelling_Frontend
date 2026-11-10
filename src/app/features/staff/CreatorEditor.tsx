"use client";
import { confirmDialog } from "@/app/lib/confirm";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardPaste, Download, FileUp, Lock, RefreshCw, RotateCcw } from "lucide-react";
import { creatorService, newOperationId } from "@/app/services/creatorService";
import type { ContentSaved, CreatorDraft, CreatorResult, CreatorVersion, SaveVersionInput } from "@/app/types/creator";
import { detectPii } from "@/app/lib/storyRules";
import { fmt } from "./ui";
import CreatorImport from "./CreatorImport";
import "@/app/features/authoring/authoring.css";

import AssistancePanel from "@/app/features/authoring/AssistancePanel";
import StoryFields from "@/app/features/authoring/StoryFields";
import { CREATOR_FILE_TEMPLATE, downloadStoryTemplate } from "@/app/features/authoring/parseStoryFile";
import type { AssistanceReference } from "@/app/types/backendContracts";
import CreatorPublication from "./CreatorPublication";
import CreatorManualMedia from "./CreatorManualMedia";
import CreatorContentCheck from "./CreatorContentCheck";
import { useRiseIn } from "@/app/lib/motion";
import type {AssistanceSelection} from '@/app/features/story-workflow/assistanceSelection';

type StepId = 'write' | 'check' | 'media' | 'publish';
function EditorNavigation({ prev, next, nextOk, label = 'Bước tiếp theo', onNext, onNavigate }: {
  prev: StepId | null; next: StepId | null; nextOk: boolean; label?: string;
  onNext?: () => void | Promise<void>; onNavigate: (step: StepId) => void;
}) {
  return <div className="pa-actions bar">
    {prev && <button className="btn btn-g" onClick={() => onNavigate(prev)}><ArrowLeft className="ic" />Quay lại</button>}
    {next && <button className="btn btn-p push" disabled={!nextOk} onClick={() => void (onNext ? onNext() : onNavigate(next))}>{label}<ArrowRight className="ic" /></button>}
  </div>;
}
/** Nhãn trạng thái truyện ở đầu trình soạn: [tông pill, chữ]. */
const STATUS_PILL: Record<string, [string, string]> = {
  Draft: ["draft", "Nháp"], MediaProcessing: ["wait", "Đang tạo media"], MediaReview: ["wait", "Chờ xác nhận media"], Ready: ["ok", "Sẵn sàng"], Archived: ["draft", "Đã lưu trữ"],
};
const ORIGIN: Record<string, string> ={ Write: "Viết", Import: "Nhập", Restore: "Khôi phục" };
const EMPTY: SaveVersionInput = { title: "", content: "", sourceDeclaration: "", rightsDeclaration: "" };
const same = (a: SaveVersionInput, b: SaveVersionInput) =>
  a.title === b.title && a.content === b.content && a.sourceDeclaration === b.sourceDeclaration && a.rightsDeclaration === b.rightsDeclaration;
const fromVersion = (v: CreatorVersion): SaveVersionInput => ({ title: v.title, content: v.content, sourceDeclaration: v.sourceDeclaration, rightsDeclaration: v.rightsDeclaration });

type Note = { ok: boolean; text: string } | null;
/** Một lệnh ghi (lưu / khôi phục) kèm bản chụp nội dung lúc gửi. */
type Write = { call: () => Promise<CreatorResult<ContentSaved>>; snapshot: SaveVersionInput; okText: string; replaceForm: boolean };

/**
 * Soạn truyện Creator: mỗi lần lưu tạo một phiên bản mới; xem lịch sử, khôi phục bản cũ, nhập văn bản / tệp.
 * Theo hướng dẫn backend: chụp nội dung lúc bấm lưu; mất mạng thì thử lại đúng lệnh cũ (cùng operationId);
 * 409 thì giữ nguyên phần đang sửa và để người dùng đồng bộ.
 */
export default function CreatorEditor({ storyId, onBack }: { storyId: number; onBack: () => void }) {
  const [references, setReferences] = useState<AssistanceReference[]>([]);
  const [selection,setSelection]=useState<AssistanceSelection|null>(null);
  const [publicationLocked, setPublicationLocked] = useState(true);
  const [mediaLocked, setMediaLocked] = useState(false);
  const [checkLocked, setCheckLocked] = useState(false);
  const editorLocked = publicationLocked || mediaLocked || checkLocked;
  const [draft, setDraft] = useState<CreatorDraft | null>(null);
  const mediaState = useCallback((status: string) => setDraft(d => d && d.status !== status ? { ...d, status } : d), []);
  const [form, setForm] = useState<SaveVersionInput>(EMPTY);
  const [saved, setSaved] = useState<SaveVersionInput>(EMPTY);
  const [versions, setVersions] = useState<CreatorVersion[] | null>(null);
  const [viewing, setViewing] = useState<CreatorVersion | null>(null);
  // Popup nhập nội dung, mở thẳng ở chế độ dán văn bản hoặc tải tệp.
  const [importing, setImporting] = useState<"paste" | "file" | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [conflict, setConflict] = useState(false);
  const [stepId, setStepId] = useState<StepId>('write');
  // Lệnh ghi chưa rõ kết quả (mất mạng): thử lại nguyên lệnh này, với đúng bản chụp lúc gửi.
  const [pending, setPending] = useState<Write | null>(null);
  const hasPending = pending !== null;
  const dirty = !same(form, saved);
  const pii = detectPii(`${form.title}\n${form.content}`);
  // Đổi bước thì các khung của bước mới hiện lần lượt.
  const stageRef = useRiseIn<HTMLDivElement>(".pa-stage:not([hidden]) > .pa-card, .pa-stage:not([hidden]) > section", [stepId, !!draft], { delay: 50, distance: 10 });

  const loadVersions = useCallback(async () => {
    const r = await creatorService.versions(storyId);
    setVersions(r.ok ? r.data ?? [] : []);
  }, [storyId]);

  const open = useCallback(async () => {
    const d = await creatorService.get(storyId);
    if (!d.ok || !d.data) { setNote({ ok: false, text: d.message }); return; }
    setDraft(d.data);
    // Nội dung không nằm trong Draft: tải phiên bản hiện tại.
    const v = d.data.selectedVersionId ? await creatorService.version(storyId, d.data.selectedVersionId) : null;
    const next = v?.ok && v.data ? fromVersion(v.data) : { ...EMPTY, title: d.data.title };
    setForm(next);
    setSaved(next);
    void loadVersions();
  }, [storyId, loadVersions]);
  useEffect(() => { void open(); }, [open]);

  const apply = (r: ContentSaved, snapshot: SaveVersionInput) => {
    setDraft(r.story);
    setReferences([]);
    setSaved(snapshot);
    setConflict(false);
    setViewing(null);
    void loadVersions();
  };

  const runWrite = async (w: Write) => {
    const { call, snapshot, okText, replaceForm } = w;
    setBusy(true);
    setNote(null);
    const r = await call();
    setBusy(false);
    if (r.ok && r.data) {
      setPending(null);
      const snap = replaceForm ? fromVersion(r.data.version) : snapshot;
      if (replaceForm) setForm(snap);
      apply(r.data, snap);
      setNote({ ok: true, text: `${okText} (phiên bản V${r.data.version.versionNo}).` });
      return true;
    }
    if (r.status === 0) setPending(w);
    if (r.status === 409) setConflict(true);
    setNote({ ok: false, text: r.status === 409 ? `${r.message || "Truyện đã thay đổi ở nơi khác."} Nội dung bạn đang sửa vẫn còn.` : r.message });
    return false;
  };

  const save = async (): Promise<boolean> => {
    if (!draft || editorLocked) return false;
    const snapshot = { ...form, assistanceReferences: references };
    const op = newOperationId("save");
    const { revisionToken, selectedVersionId } = draft;
    return runWrite({ call: () => creatorService.save(storyId, op, revisionToken, selectedVersionId, snapshot), snapshot, okText: "Đã lưu", replaceForm: false });
  };

  const restore = async (v: CreatorVersion) => {
    if (!draft || editorLocked) return;
    if (dirty && !await confirmDialog("Bạn có thay đổi chưa lưu. Khôi phục sẽ thay nội dung đang sửa bằng bản cũ. Tiếp tục?")) return;
    const op = newOperationId("restore");
    const { revisionToken, selectedVersionId } = draft;
    void runWrite({ call: () => creatorService.restore(storyId, op, revisionToken, selectedVersionId, v.versionId), snapshot: form, okText: `Đã khôi phục từ V${v.versionNo}`, replaceForm: true });
  };

  /** Sau 409: lấy revision / bản hiện tại mới nhất của máy chủ, giữ nguyên nội dung đang sửa để người dùng quyết định lưu đè. */
  const resync = async () => {
    const d = await creatorService.get(storyId);
    if (d.ok && d.data) { setDraft(d.data); setConflict(false); setNote({ ok: true, text: "Đã đồng bộ với máy chủ. Bấm Lưu để tạo phiên bản mới từ nội dung bạn đang sửa." }); void loadVersions(); }
  };

  const retry = () => { if (pending) void runWrite(pending); };

  if (!draft) return <div className="st-card"><p className="sub">{note?.text ?? "Đang mở truyện…"}</p><button className="btn btn-g" style={{ width: "fit-content" }} onClick={onBack}><ArrowLeft className="ic" />Danh sách</button></div>;

  const set = (p: Partial<SaveVersionInput>) => setForm((f) => ({ ...f, ...p }));
  const isSaved = !dirty && !!draft.selectedVersionId;
  const mediaDone = draft.status === 'Ready';
  // Lý do khoá sửa nội dung, hiện một lần dạng toast và làm chú thích cho nhãn "Chỉ xem".
  const lockReason = checkLocked ? 'Đang chốt nội dung, tạm khoá sửa.'
    : mediaLocked ? 'AI đang tạo tranh và giọng đọc cho bản đã chốt nên tạm khoá sửa nội dung.'
    : 'Bản này đã chốt hoặc đã gửi duyệt nên chỉ xem được. Muốn sửa, hãy tạo bản chỉnh sửa ở bước Phát hành.';
  const confirmed = draft.status !== 'Draft';
  const missing = [...(saved.sourceDeclaration.trim() ? [] : ['Nguồn nội dung']), ...(saved.rightsDeclaration.trim() ? [] : ['Cam kết bản quyền'])];
  // Các bước theo Luồng 3 (3d): soạn → tự kiểm tra và chốt nội dung → tranh, giọng đọc → gửi Moderator duyệt.
  const steps: { id: StepId; label: string; note: string; done: boolean; locked: boolean }[] = [
    { id: 'write', label: 'Soạn nội dung', note: dirty ? 'Có thay đổi chưa lưu' : isSaved ? 'Đã lưu' : 'Chưa lưu', done: isSaved, locked: false },
    { id: 'check', label: 'Kiểm tra và chốt', note: confirmed ? 'Đã chốt' : 'Chưa chốt', done: confirmed, locked: !isSaved },
    { id: 'media', label: 'Tranh và giọng đọc', note: mediaDone ? 'Đã sẵn sàng' : confirmed ? 'Đang xử lý' : 'Cần chốt nội dung', done: mediaDone, locked: !isSaved || !confirmed },
    { id: 'publish', label: 'Phát hành', note: mediaDone ? 'Có thể gửi duyệt' : 'Cần media sẵn sàng', done: false, locked: !isSaved },
  ];
  const active = steps.find(s => s.id === stepId && !s.locked) ?? steps[0];
  const saveThenNext = async () => { if (!dirty || await save()) setStepId('check'); };
  return (
    <>
      <div className="st-card ce-head">
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-g" onClick={async () => { if (!dirty || await confirmDialog("Bỏ các thay đổi chưa lưu?")) onBack(); }}><ArrowLeft className="ic" />Danh sách</button>
          <h3 className="grow ce-title">{form.title || "Truyện chưa đặt tên"}</h3>
          <span className={`pill ${STATUS_PILL[draft.status ?? ""]?.[0] ?? "draft"}`}>{STATUS_PILL[draft.status ?? ""]?.[1] ?? "Nháp"} · {draft.lastVersionNo ? `V${draft.lastVersionNo}` : "chưa lưu"}</span>
          {dirty && <span className="pill wait">Chưa lưu</span>}
          {editorLocked && <span className="pill draft" title={lockReason}><Lock className="ic" aria-hidden />Chỉ xem</span>}
        </div>
        <small className="sub ce-meta">{draft.ageBand} tuổi · {draft.genre || "chưa có thể loại"} · cập nhật {fmt(draft.updatedAt ?? draft.createdAt)}</small>
        {editorLocked && <p className="notice warn" role="status" data-inline-notice>{lockReason}</p>}
      </div>

      <div className="pa-flow">
        {/* Khung trái: thứ tự các bước; bước chưa mở khoá thì mờ đi. */}
        <nav className="pa-steps" aria-label="Các bước soạn truyện">
          <b className="pa-steps-title">Các bước</b>
          <ol>
            {steps.map((s, i) => <li key={s.id}>
              <button className={`pa-stepbtn${active.id === s.id ? ' on' : ''}${s.done ? ' done' : ''}`} disabled={s.locked} aria-current={active.id === s.id ? 'step' : undefined} onClick={() => setStepId(s.id)}>
                <span className="pa-num">{s.done ? <Check className="ic" aria-hidden /> : i + 1}</span>
                <span className="pa-steptxt"><b>{s.label}</b><small>{s.note}</small></span>
              </button>
            </li>)}
          </ol>
        </nav>

        {/* Cả ba bước luôn được dựng, chỉ ẩn bước không chọn: các bước media và phát hành giữ trạng thái và báo khoá soạn cho trình soạn. */}
        <div className="pa-stage" ref={stageRef}>
          <div className="pa-stage" hidden={active.id !== 'write'}>
            <section className="pa-card" aria-label="Soạn nội dung">
              <div className="pa-head"><h3><span className="pa-num">1</span>Soạn nội dung</h3></div>
              <fieldset className="pa-fieldset" disabled={editorLocked || busy}>
                <StoryFields form={form} onChange={set} onSelect={setSelection} />
                {pii.length > 0 && <div className="notice err" role="alert">Truyện còn thông tin cá nhân ({[...new Set(pii.map((p) => p.kind))].join(", ")}). Hãy bỏ trước khi gửi duyệt.</div>}
                {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
                <div className="pa-actions bar">
                  <button className="btn btn-s" disabled={busy} onClick={() => setImporting("file")}><FileUp className="ic" />Nhập từ tệp</button>
                  <button className="btn btn-s" disabled={busy} onClick={() => setImporting("paste")}><ClipboardPaste className="ic" />Dán văn bản</button>
                  <button className="btn btn-s" onClick={() => downloadStoryTemplate(CREATOR_FILE_TEMPLATE)} title="Tải tệp mẫu .txt để viết nội dung rồi nhập vào"><Download className="ic" />Tải tệp mẫu</button>
                  {conflict && <button className="btn btn-g" disabled={busy} onClick={() => void resync()}><RefreshCw className="ic" />Đồng bộ</button>}
                  {hasPending && <button className="btn btn-s" disabled={busy} onClick={retry}><RotateCcw className="ic" />Thử lại</button>}
                </div>
              </fieldset>
            </section>
            <details className="pa-fold"><summary>AI gợi ý theo bản nháp</summary>
              <AssistancePanel key={`${storyId}:${draft.selectedVersionId}`} actor="creator" story={draft} selection={selection} snapshot={{title:form.title,content:form.content}} disabled={busy || editorLocked || hasPending || conflict} onApply={(next,ref) => { setForm(f => ({...f,...next}));setSelection(null);setReferences(v => v.some(r=>r.taskId===ref.taskId&&r.stepId===ref.stepId)?v:[...v,ref]); }} />
            </details>
            <section className="pa-card" aria-label="Lịch sử phiên bản">
              <details><summary>Lịch sử phiên bản</summary>
                {versions === null && <p className="sub">Đang tải…</p>}
                {versions?.length === 0 && <p className="sub">Chưa có phiên bản nào. Bấm "Lưu và tiếp tục" để tạo V1.</p>}
                <div className="st-list">
                  {versions?.map((v) => (
                    <button key={v.versionId} className={`st-item${viewing?.versionId === v.versionId ? " on" : ""}`} onClick={() => setViewing(viewing?.versionId === v.versionId ? null : v)}>
                      <span className="row"><b className="grow">V{v.versionNo} · {v.title || "Không tên"}</b>
                        {v.versionId === draft.selectedVersionId && <span className="pill ok">Bản hiện tại</span>}
                        <span className="pill draft">{ORIGIN[v.origin] ?? v.origin}{v.restoredFromVersionId ? ` từ #${v.restoredFromVersionId}` : ""}</span></span>
                      <small>{fmt(v.createdAt)}{v.importFileName ? ` · tệp ${v.importFileName}` : ""}</small>
                    </button>
                  ))}
                </div>
                {viewing && (
                  <>
                    <div className="st-content" style={{ maxHeight: 280, overflowY: "auto" }}>{viewing.content || "Phiên bản này chưa có nội dung."}</div>
                    {viewing.versionId !== draft.selectedVersionId && (
                      <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy || conflict || editorLocked} onClick={() => restore(viewing)}><RotateCcw className="ic" />Khôi phục V{viewing.versionNo} thành bản mới</button>
                    )}
                  </>
                )}
              </details>
            </section>
            <EditorNavigation prev={null} next="check" nextOk={isSaved || (dirty && !!form.content.trim() && !busy && !editorLocked && !conflict)} label={dirty ? 'Lưu và tiếp tục' : 'Bước tiếp theo'} onNext={dirty ? saveThenNext : undefined} onNavigate={setStepId}/>
          </div>

          <div className="pa-stage" hidden={active.id !== 'check'}>
            <CreatorContentCheck key={`check:${storyId}:${draft.selectedVersionId}`} draft={draft} disabled={busy || dirty || conflict || hasPending || publicationLocked} missing={missing} onWorkingChange={setCheckLocked} onConfirmed={(status) => { mediaState(status); setStepId('media'); }} />
            <EditorNavigation prev={'write'} next={'media'} nextOk={confirmed} onNavigate={setStepId}/>
          </div>

          <div className="pa-stage" hidden={active.id !== 'media'}>
            <CreatorManualMedia key={`media:${storyId}:${draft.selectedVersionId}`} draft={draft} disabled={busy || dirty || conflict || hasPending || publicationLocked} onWorkingChange={setMediaLocked} onStatus={mediaState} />
            <EditorNavigation prev={'check'} next={'publish'} nextOk={mediaDone} onNavigate={setStepId}/>
          </div>

          <div className="pa-stage" hidden={active.id !== 'publish'}>
            <CreatorPublication storyId={storyId} versionId={draft.selectedVersionId} storyStatus={draft.status} onRevision={() => void open()} onLockChange={setPublicationLocked} showCheck={false} stepNo={4} />
            <EditorNavigation prev="media" next={null} nextOk={false} onNavigate={setStepId}/>
          </div>
        </div>
      </div>

      {importing && <CreatorImport key={importing} initialMethod={importing} draft={draft} defaultTitle={form.title} onClose={() => setImporting(null)}
        onSaved={(r) => { const snap = fromVersion(r.version); setForm(snap); apply(r, snap); setNote({ ok: true, text: `Đã nhập nội dung (phiên bản V${r.version.versionNo}).` }); }} />}

    </>
  );
}
