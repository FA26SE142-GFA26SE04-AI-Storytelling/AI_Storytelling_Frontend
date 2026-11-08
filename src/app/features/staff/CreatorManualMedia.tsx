'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Image as ImageIcon, Loader2, RefreshCw, RotateCcw, ShieldCheck, Volume2 } from 'lucide-react';
import { aiStoryCreationService as media } from '@/app/services/aiStoryCreationService';
import { useStoryProgressPolling } from '@/app/features/story-workflow/useStoryProgressPolling';
import type { CreatorDraft } from '@/app/types/creator';
import MediaAssets from '@/app/features/studio/MediaAssets';
import { mediaNeedsPolling as continuePolling } from '@/app/features/story-workflow/mediaPackage';

/** Trạng thái job media của backend là chuỗi tiếng Anh; dịch các giá trị đã biết. */
const JOB: Record<string, string> = {
  Pending: 'Đang xếp hàng', Processing: 'AI đang tạo tranh và giọng đọc', Completed: 'Đã tạo xong', Failed: 'Tạo media bị lỗi',
  Cancelled: 'Đã huỷ', WaitingForModeration: 'Đang chờ Moderator xem vùng xám',
};

/** Lý do lỗi media theo mã backend; mã lạ hiện nguyên để báo quản trị viên. */
function mediaError(code: string | null | undefined): string {
  if (!code) return 'Tạo media bị lỗi. Bấm Tạo lại media để thử lại.';
  if (/_HTTP_(401|403)$/.test(code)) return `Máy chủ AI từ chối xác thực (${code}). Hãy báo quản trị viên kiểm tra khoá Google, rồi bấm Tạo lại media.`;
  if (/_HTTP_429$/.test(code)) return `Máy chủ AI đang quá tải (${code}). Chờ vài phút rồi bấm Tạo lại media.`;
  if (/_HTTP_5\d\d$/.test(code)) return `Máy chủ AI gặp sự cố (${code}). Bấm Tạo lại media để thử lại.`;
  return `Tạo media bị lỗi (${code}). Bấm Tạo lại media để thử lại.`;
}

/** Một dòng trong checklist tiến độ: icon, tên, số đã xong / tổng, thanh tiến độ. */
function ProgressRow({ icon, label, done, total, state }: { icon: React.ReactNode; label: string; done: number; total: number | null; state: 'done' | 'active' | 'todo' }) {
  const pct = total ? Math.min(100, Math.round((done / total) * 100)) : state === 'done' ? 100 : 0;
  return <li className={`cm-row ${state}`}>
    <span className="cm-ic">{state === 'done' ? <Check className="ic" aria-hidden /> : icon}</span>
    <span className="cm-label"><b>{label}</b>{total !== null && <span className="cm-count">{done}/{total}</span>}</span>
    {total !== null && <span className="cm-bar" aria-hidden><span style={{ width: `${pct}%` }} /></span>}
  </li>;
}

/**
 * Bước 3 của truyện thủ công: theo dõi AI tạo tranh, giọng đọc; xem, tạo lại từng phần và xác nhận gói media.
 * Nội dung được chốt ở bước 2 (CreatorContentCheck), nên bước này chỉ mở khi truyện đã rời trạng thái Draft.
 */
export default function CreatorManualMedia({ draft, disabled, onWorkingChange, onStatus }: {
  draft: CreatorDraft; disabled: boolean; onWorkingChange: (value: boolean) => void; onStatus: (value: string) => void;
}) {
  const queued = ['MediaProcessing', 'MediaReview', 'Ready'].includes(draft.status ?? '');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const progress = useStoryProgressPolling(queued ? draft.storyId : null, media.getMediaProgress, continuePolling, 600_000);
  const current = progress.data?.approvedStoryVersionId === draft.selectedVersionId ? progress.data : null;
  const working = busy || queued && (!current || continuePolling(current) || current.isAwaitingConfirmation);
  useEffect(() => { onWorkingChange(working); return () => onWorkingChange(false); }, [working, onWorkingChange]);
  useEffect(() => { if (current?.isReady) onStatus(current.storyStatus); }, [current, onStatus]);

  const retry = async () => {
    if (busy) return; setBusy(true);
    const r = await media.retryMedia(draft.storyId);
    if (!alive.current) return;
    setBusy(false); setNote(r.message); progress.refresh();
  };

  // Số liệu tiến độ lấy thẳng từ API: tổng tranh = requiredIllustrations; tổng âm thanh = đã xong + còn thiếu.
  const imgDone = current?.readyIllustrations ?? 0;
  const imgTotal = current?.requiredIllustrations || null;
  const audioDone = current?.readyAudio ?? 0;
  const audioTotal = current ? audioDone + (current.missingAudioSegmentIds?.length ?? 0) : null;
  const generated = !!current && (current.isGenerated || current.isAwaitingConfirmation || current.isReady);
  const failed = current?.jobStatus === 'Failed';
  const imgState = generated || (imgTotal !== null && imgDone >= imgTotal) ? 'done' : 'active';
  const audioState = generated || (audioTotal !== null && audioTotal > 0 && audioDone >= audioTotal) ? 'done' : imgState === 'done' ? 'active' : 'todo';
  const confirmState = current?.isReady ? 'done' : current?.isAwaitingConfirmation ? 'active' : 'todo';

  const [tone, headline] = !current ? ['wait', 'Đang lấy trạng thái…']
    : current.isReady ? ['ok', 'Đã xong']
    : failed ? ['flag', 'Tạo media bị lỗi']
    : current.isAwaitingConfirmation ? ['wait', 'Đã tạo xong, chờ bạn xác nhận']
    : ['wait', JOB[current.jobStatus] ?? 'AI đang tạo tranh và giọng đọc'];

  return <section className="pa-card" aria-label="Tranh và giọng đọc">
    <div className="pa-head"><h3><span className="pa-num">3</span>Tranh và giọng đọc</h3>{queued && <span className={`pill ${tone}`}>{headline}</span>}</div>
    {(note || progress.error) && <p className="notice" role="status">{note || progress.error}</p>}
    {!queued
      ? <p className="notice warn" role="status">Hãy chốt nội dung ở bước 2 trước, AI sẽ tạo tranh và giọng đọc sau đó.</p>
      : <>
        <div className="pa-step">
          <ul className="cm-list">
            <ProgressRow icon={<ImageIcon className="ic" aria-hidden />} label="Tranh minh hoạ" done={imgDone} total={imgTotal} state={imgState} />
            <ProgressRow icon={<Volume2 className="ic" aria-hidden />} label="Giọng đọc" done={audioDone} total={audioTotal} state={audioState} />
            <ProgressRow icon={<ShieldCheck className="ic" aria-hidden />} label="Bạn xem và xác nhận gói media" done={0} total={null} state={confirmState} />
          </ul>
          {current?.isAwaitingConfirmation && <p className="cm-hint cm-todo"><b>Việc cần làm:</b> xem tranh, nghe giọng đọc ở mục bên dưới rồi tích ô và bấm <b>Xác nhận media</b>.</p>}
          {!generated && !failed && current && <p className="cm-hint"><Loader2 className="ic cm-spin" aria-hidden />Trang tự cập nhật, mỗi tranh mất khoảng vài chục giây.</p>}
          {failed && <p className="cm-hint cm-todo">{mediaError(current?.errorCode)}</p>}
          {progress.timedOut && <p className="notice warn" role="status">Đã dừng theo dõi tự động. Bấm Tải lại để kiểm tra.</p>}
          <div className="pa-actions">
            <button className="btn btn-s" disabled={busy} onClick={progress.refresh}><RefreshCw className="ic" />Tải lại</button>
            {failed && <button className="btn btn-s" disabled={busy} onClick={() => void retry()}><RotateCcw className="ic" />Tạo lại media</button>}
          </div>
        </div>
        {generated && <MediaAssets key={`${current?.packageRevision}`} autoOpen={!!current?.isAwaitingConfirmation} storyId={draft.storyId} versionId={draft.selectedVersionId} disabled={disabled || busy} onChanged={() => progress.refresh()} />}
      </>}
  </section>;
}
