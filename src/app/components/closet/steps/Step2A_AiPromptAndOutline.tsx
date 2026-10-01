'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { aiStoryCreationService as api } from '../../../services/aiStoryCreationService';
import { ChildProfile } from '../../../types/childProfile';
import { OutlineProgressDto } from '../../../types/aiStory';
import { useAIStoryInputFlow } from '../hooks/useAIStoryInputFlow';
import { useStoryProgressPolling } from '../hooks/useStoryProgressPolling';
import { normalizeStoryStatus, outlineReady } from '../hooks/storyGenerationFlow';
import { AIStoryGuardrailStatus } from '../subcomponents/AIStoryGuardrailStatus';
import { AIStoryInputForm } from '../subcomponents/AIStoryInputForm';
import { ThreeActsOutlineView } from '../subcomponents/ThreeActsOutlineView';
import { AIStoryOutlineHistory } from '../subcomponents/AIStoryOutlineHistory';

export interface Step2A_AiPromptAndOutlineProps {
  selectedChild: ChildProfile | null;
  onProceedToConvergence: (storyId: number) => void;
  onBack: () => void;
  resumedStoryId?: number | null;
  resumedRequestId?: number | null;
  onInputProgress?: (storyId: number, requestId: number) => void;
}
const loadOutline = (id: number, signal: AbortSignal) => api.getOutline(id, signal);

export const Step2A_AiPromptAndOutline: React.FC<Step2A_AiPromptAndOutlineProps> = ({
  selectedChild, onProceedToConvergence, onBack, resumedStoryId, resumedRequestId, onInputProgress,
}) => {
  const input = useAIStoryInputFlow(selectedChild?.id ?? null, resumedStoryId, resumedRequestId);
  const acceptedId = ['input_accepted', 'waiting_outline'].includes(input.phase) ? input.progress?.storyId : null;
  const storyId = (!resumedRequestId ? resumedStoryId : null) ?? acceptedId ?? null;
  const [previousVersion, setPreviousVersion] = useState<number | undefined>();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({ title: '', opening: '', development: '', ending: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const lock = useRef(false);
  const keys = useRef<Record<string, string>>({});
  const alive = useRef(true);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; controller.current?.abort(); }; }, []);
  const key = (operation: string) => keys.current[operation] ??= crypto.randomUUID();
  const shouldContinue = useCallback((p: OutlineProgressDto) => {
    const status = normalizeStoryStatus(p.storyStatus);
    if (['archived', 'rejected'].includes(status) || p.currentVersion?.outlineApprovedAt) return false;
    if (p.activeOperation) return true;
    return !outlineReady(p, previousVersion) && !p.lastErrorCode;
  }, [previousVersion]);
  const poll = useStoryProgressPolling(storyId, loadOutline, shouldContinue);
  const outline = poll.data;
  const ready = !!outline && outlineReady(outline, previousVersion);
  const canRegenerateFailed = !!outline?.currentVersion && !outline.activeOperation && !!outline.lastErrorCode && !outline.currentVersion.outlineApprovedAt && normalizeStoryStatus(outline.storyStatus) === 'outline_review';
  useEffect(() => {
    if (input.progress) onInputProgress?.(input.progress.storyId, input.progress.requestId);
  }, [input.progress, onInputProgress]);
  useEffect(() => {
    if (outline?.currentVersion?.outlineApprovedAt) onProceedToConvergence(outline.storyId);
  }, [outline, onProceedToConvergence]);

  const mutate = async (operation: 'save' | 'regenerate' | 'approve' | 'retry') => {
    if (lock.current || storyId === null) return;
    if (operation !== 'retry' && !ready && !(operation === 'regenerate' && canRegenerateFailed)) return;
    lock.current = true; setBusy(true); setMessage(null);
    controller.current = new AbortController();
    const signal = controller.current.signal;
    const version = outline?.currentVersion?.versionNo;
    if (operation === 'regenerate' && canRegenerateFailed) delete keys.current['regenerate-' + version];
    try {
      if (operation === 'save' && version !== undefined) {
        const result = await api.editOutline(storyId, version, values, signal);
        if (!alive.current || signal.aborted) return;
        if (!result.success || !result.data) { setMessage(result.message); return; }
        setEditing(false); poll.refresh();
      } else {
        const result = operation === 'retry'
          ? await api.retryOutline(storyId, { operationKey: key('retry') }, signal)
          : operation === 'regenerate'
            ? await api.regenerateOutline(storyId, version!, { operationKey: key('regenerate-' + version) }, signal)
            : await api.approveOutline(storyId, version!, { approvalKey: key('approve-' + version) }, signal);
        if (!alive.current || signal.aborted) return;
        if (!result.success || !result.data) { setMessage(result.message); poll.refresh(); return; }
        if (operation === 'approve') onProceedToConvergence(storyId);
        else {
          if (operation === 'regenerate') setPreviousVersion(version);
          delete keys.current.retry;
          poll.refresh();
        }
      }
    } finally {
      if (alive.current && !signal.aborted) { lock.current = false; setBusy(false); }
    }
  };

  if (storyId !== null) return (
    <div className="space-y-4">
      <h3 className="text-lg font-black text-tod-text">{ready ? 'Dàn ý đã sẵn sàng' : 'Đang chuẩn bị dàn ý cho bé'}</h3>
      {(message || poll.error) && <p role="alert" className="text-sm text-rose-500">{message || poll.error}</p>}
      {outline?.lastErrorCode && !outline.activeOperation && !ready && <p role="alert" className="text-sm text-rose-500">Chưa thể hoàn tất dàn ý. Vui lòng kiểm tra lại hoặc thử lại.</p>}
      {outline && ['archived', 'rejected'].includes(normalizeStoryStatus(outline.storyStatus)) && <p>Câu chuyện đã dừng, không thể tiếp tục sáng tác.</p>}
      {outline?.currentVersion && <ThreeActsOutlineView outlineProgress={outline} isEditing={editing && ready} editValues={editing ? values : undefined} onEditChange={(field, value) => setValues(v => ({ ...v, [field]: value }))} />}
      <AIStoryOutlineHistory key={storyId} storyId={storyId} currentVersionNo={outline?.currentVersion?.versionNo} />
      {poll.timedOut && <p>AI đang mất nhiều thời gian hơn dự kiến. Việc sáng tác vẫn có thể tiếp tục ở máy chủ.</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={poll.refresh} className="dashboard-card px-4 py-2">Kiểm tra lại trạng thái</button>
        {outline && !outline.activeOperation && outline.lastErrorCode && !outline.currentVersion && normalizeStoryStatus(outline.storyStatus) === 'draft' &&
          <button type="button" disabled={busy} onClick={() => void mutate('retry')} className="btn-dashboard-primary px-4 py-2">Thử lại dàn ý</button>}
        {canRegenerateFailed && !ready && <button type="button" disabled={busy} onClick={() => void mutate('regenerate')} className="btn-dashboard-primary px-4 py-2">Tạo lại gợi ý</button>}
        {ready && !editing && <button type="button" disabled={busy} onClick={() => {
          const v = outline!.currentVersion!;
          setValues({ title: v.title, opening: v.opening, development: v.development, ending: v.ending }); setEditing(true);
        }} className="dashboard-card px-4 py-2">Chỉnh sửa</button>}
        {ready && editing && <button type="button" disabled={busy} onClick={() => void mutate('save')} className="btn-dashboard-primary px-4 py-2">Lưu dàn ý</button>}
        {ready && !editing && <>
          <button type="button" disabled={busy} onClick={() => void mutate('regenerate')} className="dashboard-card px-4 py-2">Gợi ý khác</button>
          <button type="button" disabled={busy} onClick={() => void mutate('approve')} className="btn-dashboard-primary px-4 py-2">Bắt đầu viết toàn văn</button>
        </>}
      </div>
    </div>
  );
  return <div className="space-y-4">
    {input.phase === 'loading_context' && <p>Đang tải cấu hình sáng tác cho bé...</p>}
    {input.phase === 'editing_input' && input.context && input.values && <>
      {input.errorMessage && <p role="alert" className="text-sm text-rose-500">{input.errorMessage}</p>}
      <AIStoryInputForm context={input.context} values={input.values} isSubmitting={input.isBusy} onChange={input.updateValues} onSubmit={() => void input.submit()} onBack={onBack} />
    </>}
    {input.phase === 'editing_input' && !input.context && <><p role="alert">{input.errorMessage || 'Chưa có cấu hình sáng tác.'}</p><button type="button" onClick={onBack}>Quay lại</button></>}
    {['submitting', 'checking_input', 'input_blocked', 'input_check_failed'].includes(input.phase) &&
      <AIStoryGuardrailStatus phase={input.phase} progress={input.progress} message={input.errorMessage} isPollingTimedOut={input.isPollingTimedOut} canRetryInput={input.canRetryInput} onRetry={() => void input.retry()} onCheckStatus={() => void input.checkStatus()} onEdit={input.editInput} />}
  </div>;
};
