"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { creatorService, newOperationId } from "@/app/services/creatorService";
import type { ContentSaved, CreatorDraft, ImportPreview } from "@/app/types/creator";
import { fmt } from "./ui";

type Pending = { preview: ImportPreview; revisionToken: string; baseVersionId: number | null };
const MAX_FILE_BYTES = 5_000_000;

/**
 * Nhập văn bản hoặc tệp .txt / .docx vào truyện Creator: xem trước (không tạo phiên bản) → xác nhận (tạo phiên bản Import).
 * Revision / base được chụp lúc xem trước; có lệnh ghi khác thành công thì bản xem trước cũ không còn dùng được.
 */
export default function CreatorImport({ draft, defaultTitle, onSaved, onClose, initialMethod = "paste" }: {
  /** Chế độ mở popup: dán văn bản hoặc tải tệp (theo nút đã bấm). */
  initialMethod?: "paste" | "file";
  draft: CreatorDraft;
  defaultTitle: string;
  onSaved: (r: ContentSaved) => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<"paste" | "file">(initialMethod);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [source, setSource] = useState("");
  const [rights, setRights] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const preview = async () => {
    if (method === "file" && file && file.size > MAX_FILE_BYTES) { setErr("Tệp tối đa 5 MB."); return; }
    setBusy(true);
    setErr(null);
    const snap = { revisionToken: draft.revisionToken, baseVersionId: draft.selectedVersionId };
    const op = newOperationId("preview");
    const r = method === "file" && file
      ? await creatorService.previewFile(draft.storyId, op, snap.revisionToken, file)
      : await creatorService.previewText(draft.storyId, op, snap.revisionToken, text);
    setBusy(false);
    if (r.ok && r.data) setPending({ preview: r.data, ...snap });
    else setErr(r.message);
  };

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    setErr(null);
    const r = await creatorService.confirmImport(draft.storyId, newOperationId("confirm"), pending.revisionToken, pending.baseVersionId, pending.preview,
      { title: title.trim(), sourceDeclaration: source.trim(), rightsDeclaration: rights.trim() });
    setBusy(false);
    if (r.ok && r.data) { onSaved(r.data); onClose(); return; }
    setErr(r.status === 409 ? "Bản xem trước không còn dùng được (truyện vừa được lưu, hoặc bản xem trước đã hết hạn / đã dùng). Hãy xem trước lại." : r.message);
    if (r.status === 409) setPending(null);
  };

  return (
    <Dialog title="Nhập nội dung" onClose={onClose} wide>
    <div className="st-import">
      {!pending ? (
        <>
          <div className="seg" style={{ maxWidth: 320 }}>
            <button type="button" className={method === "paste" ? "on" : ""} onClick={() => setMethod("paste")}>Dán văn bản</button>
            <button type="button" className={method === "file" ? "on" : ""} onClick={() => setMethod("file")}><FileUp size={13} /> Tải tệp .txt / .docx</button>
          </div>
          {method === "paste"
            ? <textarea className="inp" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Dán nội dung truyện" aria-label="Nội dung nhập" />
            : <input className="inp" type="file" accept=".txt,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="Tệp truyện" />}
          <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy || (method === "paste" ? !text.trim() : !file)} onClick={() => void preview()}>{busy ? "Đang đọc…" : "Xem trước"}</button>
        </>
      ) : (
        <>
          <div className="row" style={{ gap: 8 }}>{pending.preview.fileName && <span className="pill draft">{pending.preview.fileName}</span>}<span className="pill wait">Hết hạn {fmt(pending.preview.expiresAt)}</span></div>
          <div className="st-content" style={{ maxHeight: 260, overflowY: "auto" }}>{pending.preview.content}</div>
          <div className="st-form">
            <label className="field"><span className="lbl">Tên truyện</span><input className="inp" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label className="field"><span className="lbl">Nguồn nội dung (bắt buộc)</span><input className="inp" maxLength={2000} value={source} onChange={(e) => setSource(e.target.value)} placeholder="VD: Tự sáng tác" /></label>
            <label className="field"><span className="lbl">Cam kết bản quyền (bắt buộc)</span><input className="inp" maxLength={2000} value={rights} onChange={(e) => setRights(e.target.value)} placeholder="VD: Tôi có quyền sử dụng nội dung này" /></label>
          </div>
          <div className="row">
            <button className="btn btn-g" disabled={busy} onClick={() => setPending(null)}>Xem trước lại</button>
            <span className="grow" />
            <button className="btn btn-p" disabled={busy || !source.trim() || !rights.trim()} onClick={() => void confirm()}>{busy ? "Đang nhập…" : "Xác nhận nhập"}</button>
          </div>
        </>
      )}
      {err && <div className="notice err" role="alert">{err}</div>}
    </div>
    </Dialog>
  );
}
