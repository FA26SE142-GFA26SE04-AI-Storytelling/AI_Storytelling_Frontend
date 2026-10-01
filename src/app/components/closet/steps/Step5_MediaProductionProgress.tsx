'use client';

import React, { useEffect, useRef, useState } from 'react';
import { aiStoryCreationService as api } from '../../../services/aiStoryCreationService';
import { MediaProgressDto } from '../../../types/aiStory';
import { normalizeStoryStatus } from '../hooks/storyGenerationFlow';
import { useStoryProgressPolling } from '../hooks/useStoryProgressPolling';

export interface Step5_MediaProductionProgressProps {
  storyId: number;
  onReadStory: (storyId: number) => void;
  onReturnToRoom: () => void;
}
const load = (id: number, signal: AbortSignal) => api.getMediaProgress(id, signal);
const waiting = (p: MediaProgressDto) => !p.isReady && !['archived', 'rejected'].includes(normalizeStoryStatus(p.storyStatus));

export const Step5_MediaProductionProgress: React.FC<Step5_MediaProductionProgressProps> = ({ storyId, onReadStory, onReturnToRoom }) => {
  const poll = useStoryProgressPolling(storyId, load, waiting, 600_000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const progress = poll.data;
  const ready = progress?.isReady === true && !poll.error;
  const stopped = !!progress && ['archived', 'rejected'].includes(normalizeStoryStatus(progress.storyStatus));
  const run = async (read: boolean) => {
    if (lock.current || (read && !ready)) return;
    lock.current = true; setBusy(true); setError(null);
    const c = new AbortController(); controller.current = c;
    try {
      if (read) {
        // Verify freshness at the click; counters never grant readiness.
        const fresh = await api.getMediaProgress(storyId, c.signal);
        if (c.signal.aborted) return;
        if (!fresh.success || !fresh.data?.isReady) { setError(fresh.message || 'Ấn phẩm chưa sẵn sàng.'); poll.refresh(); return; }
        const pack = await api.getMediaPackage(storyId, c.signal);
        if (c.signal.aborted) return;
        if (!pack.success || !pack.data || pack.data.storyVersionId !== fresh.data.approvedStoryVersionId || !pack.data.scenes.length) {
          setError(pack.message || 'Chưa thể tải ấn phẩm của câu chuyện.'); return;
        }
        onReadStory(storyId);
      } else {
        const result = await api.retryMedia(storyId, c.signal);
        if (c.signal.aborted) return;
        if (!result.success) setError(result.message);
        poll.refresh();
      }
    } finally { if (!c.signal.aborted) { lock.current = false; setBusy(false); } }
  };
  return <section className="dashboard-glass-panel p-6 space-y-4">
    <h3 className="text-lg font-black">{ready ? 'Câu chuyện đã sẵn sàng để đọc!' : 'Đang chuẩn bị tranh minh họa và giọng đọc'}</h3>
    {(error || poll.error) && <p role="alert" className="text-sm text-rose-500">{error || poll.error}</p>}
    {stopped && <p>Câu chuyện đã dừng, không thể tiếp tục.</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      <p className="dashboard-card p-4">Tranh sẵn sàng: {progress?.readyIllustrations ?? 0}/{progress?.requiredIllustrations ?? 0}</p>
      <p className="dashboard-card p-4">Đoạn giọng đọc sẵn sàng: {progress?.readyAudio ?? 0}</p>
    </div>
    {!!progress?.missingAudioSegmentIds?.length && <p>Còn {progress.missingAudioSegmentIds.length} đoạn giọng đọc cần hoàn tất.</p>}
    {!!progress?.manualReviewAssetIds?.length && <p role="alert">Có hình ảnh hoặc giọng đọc cần kiểm duyệt trước khi mở sách.</p>}
    {!!progress?.scenesWithoutValidBeats?.length && <p>Một số cảnh chưa có bộ tranh hợp lệ.</p>}
    {progress?.errorCode && !ready && <p>Quá trình chuẩn bị chưa hoàn tất. Máy chủ có thể đang thử lại; bạn có thể kiểm tra trạng thái.</p>}
    {poll.timedOut && <p>Ấn phẩm mất nhiều thời gian hơn dự kiến. Quá trình xử lý ở máy chủ không bị hủy.</p>}
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={onReturnToRoom} className="dashboard-card px-4 py-2">Quay lại phòng 3D</button>
      <button type="button" disabled={busy} onClick={poll.refresh} className="dashboard-card px-4 py-2">Kiểm tra lại trạng thái</button>
      {progress && normalizeStoryStatus(progress.jobStatus) === 'failed' && !stopped && <button type="button" disabled={busy} onClick={() => void run(false)} className="dashboard-card px-4 py-2">Thử lại</button>}
      <button type="button" disabled={!ready || busy} onClick={() => void run(true)} className="btn-dashboard-primary px-4 py-2 disabled:opacity-50">Mở sách để đọc</button>
    </div>
  </section>;
};
