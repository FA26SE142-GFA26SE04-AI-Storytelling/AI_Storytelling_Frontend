'use client';
import { useEffect, useRef, useState } from 'react';
import { creatorPublicationService } from '@/app/services/creatorPublicationService';
import { aiStoryCreationService as media } from '@/app/services/aiStoryCreationService';
import { useStoryProgressPolling } from '@/app/features/story-workflow/useStoryProgressPolling';
import type { CreatorDraft } from '@/app/types/creator';
import type { StoryMediaPackage } from '@/app/types/aiStory';
import type { ConfirmManualContentRequest } from '@/app/types/backendContracts';
import MediaAssets from '@/app/features/studio/MediaAssets';
import { mediaNeedsPolling as continuePolling } from '@/app/features/story-workflow/mediaPackage';

export default function CreatorManualMedia({ draft, disabled, onWorkingChange, onStatus }: {
  draft: CreatorDraft; disabled: boolean; onWorkingChange: (value: boolean) => void; onStatus: (value: string) => void;
}) {
  const [queued, setQueued] = useState(['MediaProcessing','MediaReview','Ready'].includes(draft.status ?? ''));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [pack, setPack] = useState<StoryMediaPackage | null>(null);
  const [pending, setPending] = useState<ConfirmManualContentRequest | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const progress = useStoryProgressPolling(queued ? draft.storyId : null, media.getMediaProgress, continuePolling, 600_000);
  const current = progress.data?.approvedStoryVersionId === draft.selectedVersionId ? progress.data : null;
  const working = busy || !!pending || queued && (!current || continuePolling(current) || current.isAwaitingConfirmation);
  useEffect(() => { onWorkingChange(working); return () => onWorkingChange(false); }, [working, onWorkingChange]);
  useEffect(() => { if (current?.isReady) onStatus(current.storyStatus); }, [current, onStatus]);

  const confirm = async () => {
    if (busy || !draft.selectedVersionId || !pending && disabled) return;
    const body = pending ?? { versionId: draft.selectedVersionId, revisionToken: draft.revisionToken };
    setBusy(true); setNote('');
    const r = await creatorPublicationService.confirmManual(draft.storyId, body);
    if (!alive.current) return;
    setBusy(false); setNote(r.message);
    if (r.success && r.data && r.data.versionId === draft.selectedVersionId) {
      setPending(null); setQueued(true); onStatus(r.data.status); progress.refresh();
    } else if (r.status === 0 || (r.status ?? 0) >= 500) setPending(body);
    else setPending(null);
  };
  const retry = async () => {
    if (busy) return; setBusy(true);
    const r = await media.retryMedia(draft.storyId);
    if (!alive.current) return;
    setBusy(false); setNote(r.message); progress.refresh();
  };
  const preview = async () => {
    if (busy) return; setBusy(true); setPack(null);
    const r = await media.getMediaPackage(draft.storyId);
    if (!alive.current) return;
    setBusy(false);
    if (r.success && r.data?.storyVersionId === draft.selectedVersionId) setPack(r.data);
    else setNote(r.message || 'Gói media không còn khớp bản hiện tại. Hãy tải lại trạng thái.');
  };
  return <section className="st-card"><h3>Chốt nội dung và tạo ảnh, giọng đọc</h3>
    <p className="sub">Lưu bản cuối cùng trước khi chốt. Bước này tạo media cho đúng phiên bản, sau đó bạn mới gửi Moderator duyệt công khai.</p>
    {(note || progress.error) && <p className="notice" role="status">{note || progress.error}</p>}
    {draft.status === 'Draft' && !queued && <button className="btn btn-p" disabled={busy || !pending && disabled || !draft.selectedVersionId} onClick={() => void confirm()}>{pending ? 'Thử lại chốt đúng bản vừa gửi' : 'Chốt bản đã lưu và tạo media'}</button>}
    {queued && <><p>{current?.isReady ? 'Media đã sẵn sàng' : current?.jobStatus ?? 'Đang lấy trạng thái media…'} · {current?.readyIllustrations ?? 0} tranh · {current?.readyAudio ?? 0} đoạn âm thanh</p>
      {progress.timedOut && <p className="notice warn">Đã dừng theo dõi tự động. Hãy kiểm tra lại trạng thái.</p>}
      <div className="row"><button className="btn btn-s" disabled={busy} onClick={progress.refresh}>Kiểm tra media</button>
        {current?.jobStatus === 'Failed' && <button className="btn btn-s" disabled={busy} onClick={() => void retry()}>Thử lại media của bản này</button>}
        {(current?.isGenerated || current?.isReady) && <button className="btn btn-s" disabled={busy} onClick={() => void preview()}>Xem ảnh và nghe thử</button>}
      </div>
    </>}
    {queued && <MediaAssets storyId={draft.storyId} versionId={draft.selectedVersionId} disabled={disabled || busy} onChanged={() => { setPack(null); progress.refresh(); }}/>}
    {pack?.scenes.map(scene => <article key={scene.sceneId}><h4>Cảnh {scene.sceneIndex + 1}</h4><p style={{ whiteSpace:'pre-wrap' }}>{scene.text}</p>
      {scene.illustrations.map(i => i.url && i.status === 'Ready' ?
        // Signed asset URLs are supplied by the API; native image supports arbitrary storage hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i.beatId} src={i.url} alt={i.visualFocus} style={{ maxWidth:'100%', maxHeight:420, objectFit:'contain' }} /> : <p key={i.beatId}>{i.status}</p>)}
      {scene.audio?.map(a => <div key={a.segmentId}><p>{a.text}</p>{a.url && a.status === 'Ready' ? <audio controls preload="none" src={a.url} aria-label={`Nghe đoạn ${a.segmentOrder + 1}`} /> : <p>{a.status}</p>}</div>)}
    </article>)}
  </section>;
}
