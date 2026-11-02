'use client';
import '@/app/features/studio/studio.css';
import '@/app/features/review/review.css';
import { useCallback, useEffect, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { creatorInputService } from '@/app/services/creatorPublicationService';
import { creatorService } from '@/app/services/creatorService';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import { useCreatorGeneration } from '@/app/features/story-workflow/useCreatorGeneration';
import { lengthPresets } from '@/app/features/story-workflow/aiStoryInputFlowUtils';
import { useStoryProgressPolling } from '@/app/features/story-workflow/useStoryProgressPolling';
import { ApproveSlot, type ApproveAction } from '@/app/features/story-workflow/approveSlot';
import OutlinePanel from '@/app/features/studio/OutlinePanel';
import ReviewGate from '@/app/features/review/ReviewGate';
import CreatorPublication from './CreatorPublication';
import type { MediaProgressDto } from '@/app/types/aiStory';
import MediaAssets from '@/app/features/studio/MediaAssets';
import MediaIssues from '@/app/features/studio/MediaIssues';
import StudioSteps from '@/app/features/studio/StudioSteps';
import { studioProgress } from '@/app/features/studio/studioProgress';
import { useSteppedProgress } from '@/app/features/studio/useSteppedProgress';
import type { Stage } from '@/app/features/story-workflow/generationSnapshot';
import CreatorBrief from './CreatorBrief';
const continueMedia = (m: MediaProgressDto) => !m.isReady && !m.isAwaitingConfirmation && !m.errorCode;
export default function CreatorGeneration({ initialId = null, onBack }: { initialId?: number | null; onBack: () => void }) {
  const flow = useCreatorGeneration(initialId);
  const [context, setContext] = useState<B.CreatorAIStoryInputContextDto | null>(null);
  const [ageBand, setAgeBand] = useState('6-8');
  const [readingLevel, setReadingLevel] = useState(2);
  const [topic, setTopic] = useState('');
  const [genre, setGenre] = useState('');
  const [lesson, setLesson] = useState('');
  const [targetLength, setTargetLength] = useState(500);
  const [vocabularyLevel, setVocabularyLevel] = useState('basic');
  const [outputMode, setOutputMode] = useState('reading_media_only');
  const [contextError, setContextError] = useState('');
  const [approve, setApprove] = useState<ApproveAction | null>(null);
  const [locked, setLocked] = useState(true);
  const [savedStatus, setSavedStatus] = useState('');
  const [savedVersion, setSavedVersion] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [submitted, setSubmitted] = useState<B.SubmitCreatorAIStoryInputRequestDto | null>(null);
  useEffect(() => {
    const controller = new AbortController(); let alive = true; setContext(null);
    void creatorInputService.context(ageBand, readingLevel, 'vi', controller.signal).then(r => { if (!alive) return; if (r.success && r.data) { setContext(r.data); setContextError(''); setVocabularyLevel(r.data.availableVocabularyLevels[0] ?? 'basic'); setTargetLength(lengthPresets(r.data.maximumLength, r.data.readingLevel, r.data.recommendedTargetLength).medium); } else setContextError(r.message); });
    return () => { alive = false; controller.abort(); };
  }, [ageBand, readingLevel]);
  useEffect(() => {
    if (flow.id === null) return;
    let alive = true;
    void creatorService.get(flow.id).then(r => { if (alive && r.ok && r.data) { setAgeBand(r.data.ageBand === 'Age_9_10' || r.data.ageBand === '9-10' ? '9-10' : '6-8'); setSavedStatus(r.data.status ?? ''); setSavedVersion(r.data.selectedVersionId); } });
    return () => { alive = false; };
  }, [flow.id, flow.stage, refresh]);
  const media = useStoryProgressPolling(flow.stage === 'media' ? flow.id : null, api.getMediaProgress, continueMedia, 600_000);
  const refreshFlow = flow.refresh;
  const refreshState = useCallback(() => { refreshFlow(); setRefresh(v => v + 1); }, [refreshFlow]);
  const creative = (): B.AIStoryCreativeInputDto => ({ topic, genre: genre || null, characterMode: 'ai_suggested', characters: [], settingMode: 'ai_suggested', setting: null, lesson, vocabularyLevel, language: 'vi', targetLength });
  const start = () => {
    const body = { ...creative(), ageBand, readingLevel, outputMode, existingStoryId: null, idempotencyKey: `creator-${crypto.randomUUID()}` };
    setSubmitted(body); void flow.submit(body);
  };
  const outline = flow.snapshot?.outline?.currentVersion ?? null;
  const storyStatus = media.data?.storyStatus ?? savedStatus;
  const versionId = media.data?.approvedStoryVersionId ?? savedVersion;
  const failed = flow.failure?.code ?? null;
  const stage: Stage = flow.id === null ? 'brief'
    : flow.input && flow.input.inputStatus !== 'input_accepted' ? (['input_blocked', 'input_check_failed'].includes(flow.input.inputStatus) ? 'blocked' : 'checking')
    : flow.stage;
  const progress = useSteppedProgress(studioProgress(stage, flow.snapshot, media.data, stage === 'media' ? null : failed));
  const reviewing = flow.id !== null && flow.stage === 'review' && stage === 'review';
  const notices = <>
    {(flow.message || flow.error || contextError) && <p className="notice" role="status">{flow.error || contextError || flow.message}</p>}
    {flow.timedOut && <p className="notice" role="status">Đã dừng theo dõi tự động. Kiểm tra trạng thái trước khi gửi lệnh khác.</p>}
    {flow.input && flow.input.inputStatus !== 'input_accepted' && <><p>{flow.input.fallbackMessage ?? 'Đang kiểm tra ý tưởng…'}</p>{flow.input.canRetry && submitted && <button className="btn btn-s" disabled={flow.busy} onClick={() => void flow.retry(submitted!)}>Thử lại kiểm tra ý tưởng</button>}</>}
    {flow.stage === 'generating' && !flow.failure && <p role="status">Đang viết và kiểm tra nội dung. Hãy chờ kết quả từ máy chủ.</p>}
    {flow.stage === 'outline_wait' && flow.id !== null && !flow.failure && <p role="status">Đang chờ dàn ý…</p>}
    {flow.failure && <p className="notice err" role="alert">Máy chủ xác nhận bước xử lý thất bại ({flow.failure.code}). Hãy kiểm tra lại trạng thái trước khi thử lại.</p>}
    {flow.stage === 'moderation' && <p className="notice" role="status">Nội dung đang chờ kiểm duyệt vùng xám. Hãy kiểm tra lại trạng thái sau.</p>}
    {flow.stage === 'stopped' && <p className="notice" role="status">Luồng đã dừng theo trạng thái backend; không tự tạo lệnh thử lại.</p>}
  </>;
  return <section className="ws with-steps" style={reviewing ? undefined : { gridTemplateColumns: 'minmax(0, 1fr)' }}>
    <StudioSteps progress={progress}>
      <button className="btn btn-g" onClick={onBack}>Về thư viện</button>
      <button className="btn btn-s" onClick={refreshState}>Kiểm tra trạng thái</button>
      {approve && <button className="btn btn-p" disabled={approve.disabled || locked} title={approve.reason ?? ''} onClick={approve.run}>{approve.label}</button>}
    </StudioSteps>
    <ApproveSlot.Provider value={setApprove}>
      {reviewing && <ReviewGate key={`${flow.id}:${refresh}`} storyId={flow.id!} ageBand={ageBand} actor="creator" onApproved={refreshState} onArchived={onBack} />}
      {!reviewing && <div className="pane"><div className="plan-stage"><div className="plan-scroll">
        {flow.id === null && <CreatorBrief
          values={{ topic, lesson, genre, targetLength, vocabularyLevel, outputMode }} context={context} contextError={contextError} busy={flow.busy}
          ageBand={ageBand} readingLevel={readingLevel} onAudience={(a, l) => { setAgeBand(a); setReadingLevel(l); }}
          onChange={(v) => { if (v.topic !== undefined) setTopic(v.topic); if (v.lesson !== undefined) setLesson(v.lesson); if (v.genre !== undefined) setGenre(v.genre); if (v.targetLength !== undefined) setTargetLength(v.targetLength); if (v.vocabularyLevel !== undefined) setVocabularyLevel(v.vocabularyLevel); if (v.outputMode !== undefined) setOutputMode(v.outputMode); }}
          onSubmit={start} />}
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 16 }}>
          {notices}
          {flow.id !== null && flow.stage === 'outline' && outline && <div className="st-card"><OutlinePanel key={outline.versionNo} storyId={flow.id} version={outline} editable={!locked} visible onReveal={() => {}} onApproved={refreshState} onChanged={refreshState} /></div>}
          {flow.stage === 'media' && <MediaIssues progress={media.data} />}
          {flow.id !== null && flow.stage === 'media' && <div className="st-card"><h3>{media.data?.isReady ? 'Media đã sẵn sàng' : media.data?.isAwaitingConfirmation ? 'Chờ bạn xác nhận tranh và giọng đọc' : 'Đang chuẩn bị media'}</h3><p>{media.error ?? media.data?.errorCode ?? media.data?.jobStatus}</p><p>{media.data?.readyIllustrations ?? 0} tranh sẵn sàng · {media.data?.readyAudio ?? 0} đoạn âm thanh sẵn sàng</p>{media.data?.errorCode && <button className="btn btn-s" disabled={flow.busy} onClick={() => void flow.command(() => api.retryMedia(flow.id!)).then(() => media.refresh())}>Thử lại media</button>}<MediaAssets storyId={flow.id} versionId={versionId} disabled={locked} onChanged={() => { media.refresh(); refreshState(); }} /></div>}
          {flow.id !== null && <CreatorPublication storyId={flow.id} versionId={versionId} storyStatus={storyStatus} onLockChange={setLocked} onRevision={refreshState} />}
        </div>
      </div></div></div>}
    </ApproveSlot.Provider>
  </section>;
}
