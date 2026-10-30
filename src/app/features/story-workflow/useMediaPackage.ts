'use client';
import { confirmDialog } from "@/app/lib/confirm";
import { useEffect, useRef, useState } from 'react';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import type { StoryMediaPackage } from '@/app/types/aiStory';
import { mediaMutationSnapshot } from '@/app/features/story-workflow/mediaPackage';

export function useMediaPackage({ storyId, versionId, onChanged, disabled = false }: {
  storyId: number; versionId?: number | null; onChanged: () => void; disabled?: boolean;
}) {
  const [pack, setPack] = useState<StoryMediaPackage | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const scope = useRef(Symbol());
  const lock = useRef(false);
  useEffect(() => {
    scope.current = Symbol(); lock.current = false;
    setPack(null); setReviewed(false); setBusy(false); setUncertain(false);
    return () => { scope.current = Symbol(); };
  }, [storyId, versionId]);
  const load = async () => {
    if (lock.current) return;
    const run = scope.current; lock.current = true; setBusy(true); setPack(null); setReviewed(false);
    const r = await api.getMediaPackage(storyId);
    if (run !== scope.current) return;
    lock.current = false; setBusy(false);
    if (r.success && r.data && r.data.storyId === storyId && mediaMutationSnapshot(r.data, versionId)) {
      setPack(r.data); setUncertain(false); setNote('');
    } else setNote(r.message || 'Gói media không còn khớp phiên bản. Hãy đồng bộ trạng thái.');
  };
  const regenerate = async (kind: 'illustration' | 'audio', assetId: number) => {
    if (lock.current || disabled || uncertain || !pack) return;
    const body = mediaMutationSnapshot(pack, versionId);
    if (!body || !await confirmDialog('Tạo lại mục này sẽ cần xác nhận lại toàn bộ gói media. Tiếp tục?')) return;
    const run = scope.current; lock.current = true; setBusy(true); setReviewed(false);
    const command = {...body,operationId:crypto.randomUUID()};
    const r = kind === 'audio' ? await api.regenerateAudio(storyId, assetId, command) : await api.regenerateIllustration(storyId, assetId, command);
    if (run !== scope.current) return;
    lock.current = false; setBusy(false); setPack(null);
    setUncertain(r.status === 0 || (r.status ?? 0) >= 500);
    setNote(r.success ? 'Đã đưa vào hàng đợi. Theo dõi trạng thái rồi tải gói mới để xem và xác nhận.' : r.message);
    onChanged();
  };
  const confirm = async () => {
    if (lock.current || disabled || uncertain || !reviewed || !pack?.isAwaitingConfirmation || !pack.isGenerated) return;
    const body = mediaMutationSnapshot(pack, versionId);
    if (!body || body.packageRevision <= 0) return;
    const run = scope.current; lock.current = true; setBusy(true);
    const r = await api.confirmMedia(storyId, { storyVersionId:body.storyVersionId, packageRevision:body.packageRevision });
    if (run !== scope.current) return;
    lock.current = false; setBusy(false); setPack(null); setReviewed(false);
    setUncertain(r.status === 0 || (r.status ?? 0) >= 500);
    setNote(r.success && r.data?.isReady && r.data.isConfirmed && r.data.approvedStoryVersionId === body.storyVersionId && r.data.packageRevision === body.packageRevision ? 'Đã xác nhận tranh và giọng đọc của phiên bản này.' : r.message || 'Hãy tải lại gói và kiểm tra trạng thái xác nhận.');
    onChanged();
  };
  const keepCurrent = async (candidateAssetId:number) => {
    if(lock.current || disabled || uncertain || !pack)return;
    const snapshot=mediaMutationSnapshot(pack,versionId);
    const candidate=pack.replacements?.find(r=>r.candidateAssetId===candidateAssetId && ['Failed','ManualReview'].includes(r.status));
    if(!snapshot || snapshot.packageRevision<1 || !candidate || !await confirmDialog('Giữ media trước đó và bỏ bản tạo lại bị lỗi?'))return;
    const run=scope.current;lock.current=true;setBusy(true);setReviewed(false);
    const r=await api.keepCurrentMedia(storyId,candidateAssetId,{storyVersionId:snapshot.storyVersionId,packageRevision:snapshot.packageRevision,operationId:crypto.randomUUID()});
    if(run!==scope.current)return;
    lock.current=false;setBusy(false);setPack(null);
    setUncertain(r.status===0 || (r.status ?? 0)>=500);
    setNote(r.success?'Đã giữ media trước đó. Tải lại gói để kiểm tra và xác nhận.':r.message);
    onChanged();
  };
  return { pack, busy, note, reviewed, setReviewed, uncertain, load, regenerate, confirm, keepCurrent };
}
