"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, FileUp, History, RotateCcw, Save } from "lucide-react";
import { creatorService, newOperationId } from "@/app/services/creatorService";
import type { ContentSaved, CreatorDraft, CreatorResult, CreatorVersion, SaveVersionInput } from "@/app/types/creator";
import { detectPii } from "@/app/lib/storyRules";
import { fmt } from "./ui";
import CreatorImport from "./CreatorImport";

import AssistancePanel from "@/app/features/authoring/AssistancePanel";
import type { AssistanceReference } from "@/app/types/backendContracts";
import CreatorPublication from "./CreatorPublication";
import CreatorManualMedia from "./CreatorManualMedia";
import type {AssistanceSelection} from '@/app/features/story-workflow/assistanceSelection';

const ORIGIN: Record<string, string> = { Write: "Viết", Import: "Nhập", Restore: "Khôi phục" };
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
  const editorLocked = publicationLocked || mediaLocked;
  const [draft, setDraft] = useState<CreatorDraft | null>(null);
  const mediaState = useCallback((status: string) => setDraft(d => d && d.status !== status ? { ...d, status } : d), []);
  const [form, setForm] = useState<SaveVersionInput>(EMPTY);
  const [saved, setSaved] = useState<SaveVersionInput>(EMPTY);
  const [versions, setVersions] = useState<CreatorVersion[] | null>(null);
  const [viewing, setViewing] = useState<CreatorVersion | null>(null);
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [conflict, setConflict] = useState(false);
  // Lệnh ghi chưa rõ kết quả (mất mạng): thử lại nguyên lệnh này, với đúng bản chụp lúc gửi.
  const pending = useRef<Write | null>(null);
  const [hasPending, setHasPending] = useState(false);
  const dirty = !same(form, saved);
  const pii = detectPii(`${form.title}\n${form.content}`);

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
      pending.current = null;
      setHasPending(false);
      const snap = replaceForm ? fromVersion(r.data.version) : snapshot;
      if (replaceForm) setForm(snap);
      apply(r.data, snap);
      setNote({ ok: true, text: `${okText} (phiên bản V${r.data.version.versionNo}).` });
      return;
    }
    if (r.status === 0) { pending.current = w; setHasPending(true); }
    if (r.status === 409) setConflict(true);
    setNote({ ok: false, text: r.status === 409 ? `${r.message || "Truyện đã thay đổi ở nơi khác."} Nội dung bạn đang sửa vẫn còn.` : r.message });
  };

  const save = () => {
    if (!draft || editorLocked) return;
    const snapshot = { ...form, assistanceReferences: references };
    const op = newOperationId("save");
    const { revisionToken, selectedVersionId } = draft;
    void runWrite({ call: () => creatorService.save(storyId, op, revisionToken, selectedVersionId, snapshot), snapshot, okText: "Đã lưu", replaceForm: false });
  };

  const restore = (v: CreatorVersion) => {
    if (!draft || editorLocked) return;
    if (dirty && !confirm("Bạn có thay đổi chưa lưu. Khôi phục sẽ thay nội dung đang sửa bằng bản cũ. Tiếp tục?")) return;
    const op = newOperationId("restore");
    const { revisionToken, selectedVersionId } = draft;
    void runWrite({ call: () => creatorService.restore(storyId, op, revisionToken, selectedVersionId, v.versionId), snapshot: form, okText: `Đã khôi phục từ V${v.versionNo}`, replaceForm: true });
  };

  /** Sau 409: lấy revision / bản hiện tại mới nhất của máy chủ, giữ nguyên nội dung đang sửa để người dùng quyết định lưu đè. */
  const resync = async () => {
    const d = await creatorService.get(storyId);
    if (d.ok && d.data) { setDraft(d.data); setConflict(false); setNote({ ok: true, text: "Đã đồng bộ với máy chủ. Bấm Lưu để tạo phiên bản mới từ nội dung bạn đang sửa." }); void loadVersions(); }
  };

  const retry = () => { if (pending.current) void runWrite(pending.current); };

  if (!draft) return <div className="st-card"><p className="sub">{note?.text ?? "Đang mở truyện…"}</p><button className="btn btn-g" style={{ width: "fit-content" }} onClick={onBack}><ArrowLeft className="ic" />Danh sách</button></div>;

  const set = (p: Partial<SaveVersionInput>) => setForm((f) => ({ ...f, ...p }));
  return (
    <>
      <div className="st-card">
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-g" onClick={() => { if (!dirty || confirm("Bỏ các thay đổi chưa lưu?")) onBack(); }}><ArrowLeft className="ic" />Danh sách</button>
          <h3 className="grow">{form.title || "Truyện chưa đặt tên"}</h3>
          <span className="pill draft">Nháp · {draft.lastVersionNo ? `V${draft.lastVersionNo}` : "chưa lưu"}</span>
          {dirty && <span className="pill wait">Chưa lưu</span>}
        </div>
        <small className="sub">{draft.ageBand} tuổi · {draft.genre || "chưa có thể loại"} · cập nhật {fmt(draft.updatedAt ?? draft.createdAt)}</small>
        {editorLocked && <p className="notice warn">Bản này đang được mở chỉ để xem. Kiểm tra phần phát hành hoặc tạo phiên bản chỉnh sửa mới.</p>}
        <fieldset disabled={editorLocked || busy} style={{ border: 0, padding: 0 }}>
        <label className="field"><span className="lbl">Tên truyện</span><input className="inp" maxLength={200} value={form.title} onChange={(e) => set({ title: e.target.value })} /></label>
        <label className="field"><span className="lbl">Nội dung (mỗi đoạn cách nhau một dòng trống)</span>
          <textarea className="inp" rows={14} maxLength={200_000} value={form.content} onSelect={e=>setSelection({snapshot:{title:form.title,content:e.currentTarget.value},start:e.currentTarget.selectionStart,length:e.currentTarget.selectionEnd-e.currentTarget.selectionStart})} onChange={(e) => set({ content: e.target.value })} /></label>
        <div className="st-form">
          <label className="field"><span className="lbl">Nguồn nội dung</span><input className="inp" maxLength={2000} value={form.sourceDeclaration} onChange={(e) => set({ sourceDeclaration: e.target.value })} placeholder="VD: Tự sáng tác" /></label>
          <label className="field"><span className="lbl">Cam kết bản quyền</span><input className="inp" maxLength={2000} value={form.rightsDeclaration} onChange={(e) => set({ rightsDeclaration: e.target.value })} placeholder="VD: Tôi có quyền phát hành nội dung này" /></label>
        </div>
        {pii.length > 0 && <div className="notice err">Truyện còn thông tin cá nhân ({[...new Set(pii.map((p) => p.kind))].join(", ")}). Hãy bỏ trước khi gửi duyệt.</div>}
        {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-s" disabled={busy} onClick={() => setImporting(true)}><FileUp className="ic" />Nhập văn bản / tệp</button>
          <span className="grow" />
          {conflict && <button className="btn btn-g" disabled={busy} onClick={() => void resync()}>Đồng bộ với máy chủ</button>}
          {hasPending && <button className="btn btn-s" disabled={busy} onClick={retry}>Thử lại lệnh vừa rồi</button>}
          <button className="btn btn-p" disabled={busy || !dirty || conflict} onClick={save}><Save className="ic" />{busy ? "Đang lưu…" : "Lưu phiên bản mới"}</button>
        </div>
        </fieldset>
        <AssistancePanel key={`${storyId}:${draft.selectedVersionId}`} actor="creator" story={draft} selection={selection} snapshot={{title:form.title,content:form.content}} disabled={busy || editorLocked || hasPending || conflict} onApply={(next,ref) => { setForm(f => ({...f,...next}));setSelection(null);setReferences(v => v.some(r=>r.taskId===ref.taskId&&r.stepId===ref.stepId)?v:[...v,ref]); }} />
        <p className="sub">Mỗi lần lưu tạo một phiên bản mới; bản đã nộp được giữ nguyên trong lịch sử.</p>
      </div>
      <CreatorManualMedia key={`media:${storyId}:${draft.selectedVersionId}`} draft={draft} disabled={busy || dirty || conflict || hasPending || publicationLocked} onWorkingChange={setMediaLocked} onStatus={mediaState} />
      <CreatorPublication storyId={storyId} versionId={draft.selectedVersionId} storyStatus={draft.status} onRevision={() => void open()} onLockChange={setPublicationLocked} />


      {importing && <CreatorImport draft={draft} defaultTitle={form.title} onClose={() => setImporting(false)}
        onSaved={(r) => { const snap = fromVersion(r.version); setForm(snap); apply(r, snap); setNote({ ok: true, text: `Đã nhập nội dung (phiên bản V${r.version.versionNo}).` }); }} />}

      <div className="st-card">
        <h3><History className="ic" /> Lịch sử phiên bản</h3>
        {versions === null && <p className="sub">Đang tải…</p>}
        {versions?.length === 0 && <p className="sub">Chưa có phiên bản nào. Bấm “Lưu phiên bản mới” để tạo V1.</p>}
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
      </div>
    </>
  );
}
