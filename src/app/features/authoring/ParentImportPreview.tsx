'use client';
import { useState } from 'react';
import { Check, PencilLine, X } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import { showToast } from '@/app/lib/toast';
import type * as B from '@/app/types/backendContracts';
import { parentAuthoringService as service } from '@/app/services/parentAuthoringService';
import { parseStoryFile, type StoryFileFields } from './parseStoryFile';

/** Bản xem trước của máy chủ, kèm token / phiên bản gốc chụp lúc xem trước (xác nhận phải dùng đúng các giá trị này). */
export interface ParentImportPending { preview: B.CreatorImportPreviewDto; revisionToken: string; baseVersionId: number | null; fallbackTitle: string }
type Fields = { title: string; sourceDeclaration: string; rightsDeclaration: string };

/**
 * Popup xem trước nội dung nhập (tệp hoặc văn bản dán): hiện nội dung đã tách, cho sửa tên / nguồn / cam kết,
 * rồi "Xác nhận nhập" (tạo phiên bản Import qua POST /parent/stories/{id}/imports/confirm) hoặc "Điền vào ô" để sửa thêm trước khi lưu.
 */
export default function ParentImportPreview({ storyId, pending, defaults, beforeConfirm, onFill, onSaved, onConflict, onClose }: {
  storyId: number;
  /** Hỏi lại trước khi lưu (ví dụ biểu mẫu đang có thay đổi chưa lưu); trả false để dừng. */
  beforeConfirm?: () => Promise<boolean>;
  pending: ParentImportPending;
  /** Giá trị đang có trên biểu mẫu, dùng khi tệp không ghi sẵn. */
  defaults: Fields;
  onFill: (fields: StoryFileFields) => void;
  onSaved: (saved: B.CreatorContentSavedDto) => void;
  onConflict: () => void;
  onClose: () => void;
}) {
  const parsed = parseStoryFile(pending.preview.content);
  const body = parsed.content ?? '';
  const [fields, setFields] = useState<Fields>({
    title: parsed.title || defaults.title || pending.fallbackTitle,
    sourceDeclaration: parsed.sourceDeclaration || defaults.sourceDeclaration,
    rightsDeclaration: parsed.rightsDeclaration || defaults.rightsDeclaration,
  });
  const [busy, setBusy] = useState(false);
  const ready = !!body.trim() && !!fields.sourceDeclaration.trim() && !!fields.rightsDeclaration.trim();

  const fail = (status: number | undefined, message: string) => {
    if (status === 409) { showToast('Truyện vừa được lưu ở nơi khác hoặc bản xem trước đã hết hạn. Hãy nhập lại nội dung.', 'warn'); onConflict(); return; }
    showToast(message || 'Chưa nhập được nội dung. Bạn thử lại nhé.', 'err');
  };
  const confirm = async () => {
    if (!ready || busy) return;
    if (beforeConfirm && !await beforeConfirm()) return;
    setBusy(true);
    // Máy chủ chỉ nhận đúng nội dung đã xem trước. Tệp theo mẫu có các dòng "Tên truyện:", "Nguồn nội dung:"…
    // nên xem trước lại riêng phần nội dung truyện để các dòng đó không lọt vào thân truyện.
    let preview = pending.preview;
    if (body !== preview.content.trim()) {
      const again = await service.previewImport(storyId, { operationId: crypto.randomUUID(), revisionToken: pending.revisionToken, content: body });
      if (!again.success || !again.data) { setBusy(false); fail(again.status, again.message); return; }
      preview = again.data;
    }
    const r = await service.confirmImport(storyId, {
      operationId: crypto.randomUUID(), revisionToken: pending.revisionToken, baseVersionId: pending.baseVersionId,
      previewToken: preview.previewToken, content: preview.content,
      title: fields.title.trim(), sourceDeclaration: fields.sourceDeclaration.trim(), rightsDeclaration: fields.rightsDeclaration.trim(),
    });
    setBusy(false);
    if (r.success && r.data) { showToast(`Đã nhập nội dung thành phiên bản V${r.data.version.versionNo}.`, 'ok'); onSaved(r.data); return; }
    fail(r.status, r.message);
  };

  return <Dialog title="Xem trước nội dung nhập" onClose={busy ? () => undefined : onClose} wide>
    <div className="pa-import">
      {pending.preview.fileName && <span className="pill draft" style={{ width: 'fit-content' }}>{pending.preview.fileName}</span>}
      <div className="pa-confirmed">
        {body.trim() ? body.split(/\n\s*\n/).map((t, i) => <p key={i}>{t}</p>) : <p>Không tìm thấy nội dung truyện trong phần đã nhập.</p>}
      </div>
      <label className="field"><span className="lbl">Tên truyện</span><input className="inp" maxLength={200} value={fields.title} onChange={e => setFields(f => ({ ...f, title: e.target.value }))} /></label>
      <label className="field"><span className="lbl">Nguồn nội dung</span><input className="inp" maxLength={2000} value={fields.sourceDeclaration} placeholder="VD: Tự sáng tác" onChange={e => setFields(f => ({ ...f, sourceDeclaration: e.target.value }))} /></label>
      <label className="field"><span className="lbl">Cam kết quyền sử dụng</span><input className="inp" maxLength={2000} value={fields.rightsDeclaration} placeholder="VD: Tôi là tác giả hoặc có quyền dùng nội dung này" onChange={e => setFields(f => ({ ...f, rightsDeclaration: e.target.value }))} /></label>
      <div className="pa-actions bar">
        <button type="button" className="btn btn-g" disabled={busy} onClick={onClose}><X className="ic" />Huỷ</button>
        <button type="button" className="btn btn-s" disabled={busy || !body.trim()} title="Đưa vào các ô để sửa thêm, lưu sau" onClick={() => onFill({ ...parsed, ...fields })}><PencilLine className="ic" />Sửa trước</button>
        <button type="button" className="btn btn-p push" disabled={busy || !ready} title={ready ? 'Lưu nội dung này thành phiên bản mới' : 'Điền nguồn nội dung và cam kết quyền sử dụng'} onClick={() => void confirm()}><Check className="ic" />{busy ? 'Đang nhập…' : 'Xác nhận nhập'}</button>
      </div>
    </div>
  </Dialog>;
}
