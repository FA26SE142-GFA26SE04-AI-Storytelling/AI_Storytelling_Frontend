'use client';
import { useEffect, useRef, useState } from 'react';
import { creatorPublicationService as service } from '@/app/services/creatorPublicationService';
import type * as B from '@/app/types/backendContracts';
import { useAuth } from '@/app/context/AuthContext';
import type { ApiResponse } from '@/app/types/auth';
export default function CreatorPublication({ storyId, versionId, storyStatus, onRevision, onLockChange }: { storyId: number; versionId: number | null; storyStatus?: string; onRevision: () => void; onLockChange?: (locked: boolean) => void }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<B.CreatorPublicationStatus | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const scope = useRef(Symbol());
  const knownSubmitted = useRef<number | null>(null);
  const [submittedVersion,setSubmittedVersion] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController(); const run = Symbol(); scope.current = run;
    setStatus(null); onLockChange?.(true);
    if (!versionId) { onLockChange?.(false); return; }
    void service.status(storyId, controller.signal).then(r => {
      if (scope.current !== run) return;
      if (!r.success || !r.data) { setNote(r.message); return; }
      const s = r.data; setStatus(s);
      if (s.reviewStatus !== 'None' || s.openItemId) { knownSubmitted.current = s.versionId; setSubmittedVersion(s.versionId); }
      // Status does not expose past withdrawn submissions. Keep Ready versions read-only; revision is supported for Ready stories.
      const locked = s.isPublished || !!s.openItemId || s.reviewStatus !== 'None' || knownSubmitted.current === s.versionId || ['Ready','Archived'].includes(storyStatus ?? '');
      onLockChange?.(locked);
    });
    return () => { scope.current = Symbol(); controller.abort(); };
  }, [storyId, versionId, storyStatus, refresh, user?.id, onLockChange]);
  const act = async (fn: () => Promise<ApiResponse<unknown>>, revision = false, lockVersion = true) => {
    if (busy) return;
    setBusy(true); setNote(''); const run = scope.current;
    const r = await fn(); if (run !== scope.current) return;
    setBusy(false); setNote(r.message || (r.success ? 'Đã ghi nhận.' : 'Thao tác chưa hoàn tất.'));
    if (r.success) { if (revision) onRevision(); else { if (lockVersion) { knownSubmitted.current = status?.versionId ?? null; setSubmittedVersion(status?.versionId ?? null); onLockChange?.(true); } setRefresh(n => n + 1); } }
    else if (r.status === 409) setRefresh(n => n + 1);
  };
  return <section className="st-card"><h3>Phát hành và chỉnh sửa</h3>{note && <p className="notice" role="status">{note}</p>}
    {status && <><p>{status.isPublished ? 'Đang công khai' : 'Chưa công khai'} · duyệt: {status.reviewStatus}{status.openItemStatus ? ` · mục đang mở: ${status.openItemStatus}` : ''}</p><p className="sub">Bản đã nộp giữ nguyên trong lịch sử. Muốn sửa bản sẵn sàng hoặc đã nộp, hãy tạo phiên bản chỉnh sửa mới.</p>
      <label className="field">Lý do yêu cầu gỡ<textarea className="inp" rows={2} maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label>
      <div className="row"><button className="btn btn-s" disabled={busy} onClick={() => setRefresh(n => n + 1)}>Tải trạng thái</button>
        {storyStatus === 'Ready' && !status.isPublished && !status.openItemId && status.reviewStatus === 'None' && <button className="btn btn-p" disabled={busy} onClick={() => void act(() => service.submit(storyId, status.versionId))}>Gửi bản hiện tại cho Moderator</button>}
        {status.openItemType === 'PublicStoryReview' && status.openItemStatus === 'Pending' && status.openItemId && <button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.withdraw(status.openItemId!))}>Rút yêu cầu duyệt</button>}
        {status.isPublished && !status.openItemId && <button className="btn btn-s" disabled={busy || !reason.trim()} onClick={() => void act(() => service.remove(storyId, reason))}>Yêu cầu gỡ để chỉnh sửa</button>}
        {!status.isPublished && !status.openItemId && storyStatus !== 'Archived' && (storyStatus === 'Ready' || status.reviewStatus !== 'None' || submittedVersion === status.versionId) && <button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.revision(storyId, status.versionId), true)}>Tạo phiên bản chỉnh sửa mới</button>}
        <button className="btn btn-s" disabled={busy || !!status.openItemId || status.isPublished} onClick={() => void act(() => service.check(storyId, status.versionId), false, false)}>Kiểm tra vùng xám</button>
      </div></>}
  </section>;
}
