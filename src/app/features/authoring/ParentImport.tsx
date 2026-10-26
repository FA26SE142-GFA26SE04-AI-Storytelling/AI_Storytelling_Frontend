'use client';
import { useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { parentAuthoringService as service } from '@/app/services/parentAuthoringService';
export default function ParentImport({ draft, onSaved, onClose }: { draft: B.ParentDraftDto; onSaved: (data: B.CreatorContentSavedDto) => void; onClose: () => void }) {
  const [text, setText] = useState(''); const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState(''); const [rights, setRights] = useState('');
  const [preview, setPreview] = useState<B.CreatorImportPreviewDto | null>(null);
  const [previewSource, setPreviewSource] = useState<typeof draft.story | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [pending, setPending] = useState<(() => Promise<unknown>) | null>(null);
  const story = draft.story;
  const show = async () => { if (busy) return; setBusy(true); setError(''); const operationId = crypto.randomUUID();
    const form = new FormData(); if (file) form.append('File', file); form.append('RevisionToken',story.revisionToken); form.append('OperationId',operationId);
    const r = file ? await service.previewFile(story.storyId, form) : await service.previewImport(story.storyId,{ operationId, revisionToken:story.revisionToken, content:text });
    setBusy(false); if (r.success) { setPreview(r.data); setPreviewSource(story); } else setError(r.message);
  };
  const confirm = async () => {
    if (!preview || !previewSource || busy) return;
    const body: B.ConfirmCreatorImportRequest = { operationId:crypto.randomUUID(),revisionToken:previewSource.revisionToken,baseVersionId:previewSource.selectedVersionId,previewToken:preview.previewToken,content:preview.content,title:previewSource.title,sourceDeclaration:source,rightsDeclaration:rights };
    const run = async () => { setBusy(true); const r = await service.confirmImport(story.storyId,body); setBusy(false); if (r.success && r.data) onSaved(r.data); else { setError(r.message); if (r.status === 0) setPending(() => run); else setPending(null); } };
    await run();
  };
  return <div className="st-card"><h3>Nhập truyện vào bản gia đình</h3>{error && <p className="notice err">{error}</p>}{preview ? <><p className="sub">Kiểm tra bản xem trước. Nội dung và revision đã được ghim cho lần nhập này.</p><pre style={{ whiteSpace:'pre-wrap' }}>{preview.content}</pre><label className="field">Nguồn nội dung<input className="inp" value={source} maxLength={2000} onChange={e => setSource(e.target.value)} /></label><label className="field">Cam kết quyền sử dụng<input className="inp" value={rights} maxLength={2000} onChange={e => setRights(e.target.value)} /></label><button className="btn btn-p" disabled={busy || !source.trim() || !rights.trim() || !!pending} onClick={() => void confirm()}>Xác nhận đúng bản xem trước</button>{pending && <button className="btn btn-s" disabled={busy} onClick={() => void pending()}>Thử lại cùng lệnh nhập</button>}</> : <><textarea className="inp" rows={6} value={text} maxLength={200000} onChange={e => setText(e.target.value)} /><input type="file" accept=".txt,.docx" onChange={e => setFile(e.target.files?.[0] ?? null)} /><button className="btn btn-s" disabled={busy || !file && !text.trim()} onClick={() => void show()}>Xem trước</button></>}<button className="btn btn-g" disabled={busy || !!pending} onClick={onClose}>Đóng</button></div>;
}
