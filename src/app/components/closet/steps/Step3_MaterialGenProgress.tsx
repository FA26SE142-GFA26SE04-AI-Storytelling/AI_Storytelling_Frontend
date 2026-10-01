'use client';

import React, { useEffect, useRef, useState } from 'react';
import { aiStoryCreationService as api } from '../../../services/aiStoryCreationService';
import { ContentGenerationProgressDto } from '../../../types/aiStory';
import { contentDestination, generationDisplayPhase, normalizeStoryStatus } from '../hooks/storyGenerationFlow';
import { useStoryProgressPolling } from '../hooks/useStoryProgressPolling';
import { AIStoryGenerationStages } from '../subcomponents/AIStoryGenerationStages';

export interface Step3_MaterialGenProgressProps {
  storyId: number;
  onProceedToReview: () => void;
  onProceedToMedia?: (storyId: number) => void;
}
const load = (id: number, signal: AbortSignal) => api.getGenerationProgress(id, signal);
const waiting = (p: ContentGenerationProgressDto) => contentDestination(p) === 'waiting' && !p.currentStep.startsWith('failed_');

export const Step3_MaterialGenProgress: React.FC<Step3_MaterialGenProgressProps> = ({ storyId, onProceedToReview, onProceedToMedia }) => {
  const poll = useStoryProgressPolling(storyId, load, waiting, 300_000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryKey = useRef<string | null>(null);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const progress = poll.data;
  const destination = progress ? contentDestination(progress) : 'waiting';
  useEffect(() => {
    if (destination === 'media') onProceedToMedia?.(storyId);
  }, [destination, onProceedToMedia, storyId]);
  const failed = !!progress?.currentStep.startsWith('failed_');
  const phase = generationDisplayPhase(progress);
  const canRetry = failed && !progress?.stableStoryVersionId && normalizeStoryStatus(progress?.storyStatus ?? '') === 'outline_review';

  const retry = async () => {
    if (lock.current || !canRetry) return;
    lock.current = true; setBusy(true); setError(null);
    const c = new AbortController(); controller.current = c;
    try {
      retryKey.current ??= crypto.randomUUID();
      const result = await api.retryGeneration(storyId, { retryKey: retryKey.current }, c.signal);
      if (c.signal.aborted) return;
      if (!result.success) setError(result.message);
      else { retryKey.current = null; poll.refresh(); }
    } finally { if (!c.signal.aborted) { lock.current = false; setBusy(false); } }
  };

  return <section className="dashboard-glass-panel p-6 space-y-4">
    <AIStoryGenerationStages progress={progress} isRetrying={busy} />
    {(error || poll.error) && <p role="alert" className="text-sm text-rose-500">{error || poll.error}</p>}
    {failed && !busy && destination === 'waiting' && <p role="alert">{phase === 'content' ? 'Chưa thể hoàn tất nội dung truyện. Học liệu chưa được tạo.' : 'Một phần học liệu chưa hoàn tất.'} {canRetry ? 'Bạn có thể thử lại nội dung truyện.' : 'Bạn có thể kiểm tra lại trạng thái.'}</p>}
    {failed && !busy && phase === 'learning' && destination === 'waiting' && <p className="text-sm text-tod-text-muted">Hiện chưa hỗ trợ thử lại học liệu tại bước này.</p>}
    {failed && !busy && phase === 'content' && progress?.qualityFailure && <p>Nội dung chưa vượt qua kiểm tra chất lượng hoặc an toàn. Chưa thể bắt đầu tạo học liệu.</p>}
    {poll.timedOut && <p>Quá trình sáng tác lâu hơn dự kiến. Bạn có thể kiểm tra lại; máy chủ vẫn có thể đang xử lý.</p>}
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy} className="dashboard-card px-4 py-2" onClick={poll.refresh}>Kiểm tra lại trạng thái</button>
      {canRetry && <button type="button" disabled={busy} className="btn-dashboard-primary px-4 py-2" onClick={() => void retry()}>{busy ? 'Đang thử lại...' : 'Thử lại nội dung truyện'}</button>}
      {phase === 'learning' && destination !== 'stopped' && <button type="button" disabled={destination !== 'review' || busy || !!poll.error} className="btn-dashboard-primary px-4 py-2 disabled:opacity-50" onClick={onProceedToReview}>Xem và tinh chỉnh học liệu</button>}
    </div>
  </section>;
};
