'use client';
import '@/app/features/studio/studio.css';
import '@/app/features/review/review.css';
import { useCallback, useEffect, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { creatorInputService } from '@/app/services/creatorPublicationService';
import { creatorService } from '@/app/services/creatorService';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import { useCreatorGeneration } from '@/app/features/story-workflow/useCreatorGeneration';
import { useStoryProgressPolling } from '@/app/features/story-workflow/useStoryProgressPolling';
import { ApproveSlot, type ApproveAction } from '@/app/features/story-workflow/approveSlot';
import OutlinePanel from '@/app/features/studio/OutlinePanel';
import ReviewGate from '@/app/features/review/ReviewGate';
import CreatorPublication from './CreatorPublication';
import type { MediaProgressDto } from '@/app/types/aiStory';
const continueMedia = (m: MediaProgressDto) => !m.isReady && !m.errorCode;
export default function CreatorGeneration({ initialId = null, onBack }: { initialId?: number | null; onBack: () => void }) {
  const flow = useCreatorGeneration(initialId);
  const [context, setContext] = useState<B.CreatorAIStoryInputContextDto | null>(null);
  const [ageBand, setAgeBand] = useState('6-8');
  const [readingLevel, setReadingLevel] = useState(2);
  const [topic, setTopic] = useState('');
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
    void creatorInputService.context(ageBand, readingLevel, 'vi', controller.signal).then(r => { if (!alive) return; if (r.success && r.data) { setContext(r.data); setContextError(''); setVocabularyLevel(r.data.availableVocabularyLevels[0] ?? 'basic'); } else setContextError(r.message); });
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
  const creative = (): B.AIStoryCreativeInputDto => ({ topic, genre: null, characterMode: 'ai_suggested', characters: [], settingMode: 'ai_suggested', setting: null, lesson, vocabularyLevel, language: 'vi', targetLength });
  const start = () => {
    const body = { ...creative(), ageBand, readingLevel, outputMode, existingStoryId: null, idempotencyKey: `creator-${crypto.randomUUID()}` };
    setSubmitted(body); void flow.submit(body);
  };
  const outline = flow.snapshot?.outline?.currentVersion ?? null;
  const storyStatus = media.data?.storyStatus ?? savedStatus;
  const versionId = media.data?.approvedStoryVersionId ?? savedVersion;
  return <><div className="st-card"><div className="row"><button className="btn btn-s" onClick={onBack}>Về danh sách</button><h3>Sáng tác bằng AI</h3>{approve && <button className="btn btn-p" disabled={approve.disabled || locked} title={approve.reason ?? ''} onClick={approve.run}>{approve.label}</button>}<button className="btn btn-s" onClick={refreshState}>Kiểm tra trạng thái</button></div>
    {(flow.message || flow.error || contextError) && <p className="notice" role="status">{flow.error || contextError || flow.message}</p>}{flow.timedOut && <p className="notice warn">Đã dừng theo dõi tự động. Kiểm tra trạng thái trước khi gửi lệnh khác.</p>}
    {flow.id === null && <fieldset disabled={flow.busy} style={{ border: 0, padding: 0 }}><div className="st-form"><label className="field">Độ tuổi<select className="inp" value={ageBand} onChange={e => setAgeBand(e.target.value)}><option>6-8</option><option>9-10</option></select></label><label className="field">Mức đọc<input className="inp" type="number" min={1} max={5} value={readingLevel} onChange={e => setReadingLevel(Number(e.target.value))} /></label><label className="field">Đầu ra<select className="inp" value={outputMode} onChange={e => setOutputMode(e.target.value)}>{(context?.availableOutputModes ?? ['reading_media_only']).map(m => <option key={m} value={m}>{m === 'reading_media_only' ? 'Đọc và nghe' : 'Truyện và học liệu'}</option>)}</select></label></div>
      <label className="field">Ý tưởng<textarea className="inp" rows={3} value={topic} onChange={e => setTopic(e.target.value)} /></label><label className="field">Bài học<input className="inp" value={lesson} onChange={e => setLesson(e.target.value)} /></label><label className="field">Mức từ vựng<select className="inp" value={vocabularyLevel} onChange={e => setVocabularyLevel(e.target.value)}>{context?.availableVocabularyLevels.map(v => <option key={v}>{v}</option>)}</select></label><label className="field">Độ dài mong muốn<input type="number" className="inp" min={1} max={context?.maximumLength ?? 1000} value={targetLength} onChange={e => setTargetLength(Number(e.target.value))} /></label><button className="btn btn-p" disabled={!context || !topic.trim() || !lesson.trim() || targetLength < 1 || targetLength > context.maximumLength} onClick={start}>Gửi ý tưởng</button>
    </fieldset>}
    {flow.input && flow.input.inputStatus !== 'input_accepted' && <><p>{flow.input.fallbackMessage ?? 'Đang kiểm tra ý tưởng…'}</p>{flow.input.canRetry && submitted && <button className="btn btn-s" disabled={flow.busy} onClick={() => void flow.retry(submitted!)}>Thử lại kiểm tra ý tưởng</button>}</>}
    {flow.stage === 'generating' && <p>Đang viết và kiểm tra nội dung. {flow.snapshot?.generation?.currentStep}</p>}
    {flow.stage === 'outline_wait' && flow.id !== null && <p>Đang chờ dàn ý…</p>}
    {flow.stage === 'moderation' && <p className="notice warn">Nội dung đang chờ kiểm duyệt vùng xám. Hãy kiểm tra lại trạng thái sau.</p>}
    {flow.stage === 'stopped' && <p className="notice warn">Luồng đã dừng theo trạng thái backend; không tự tạo lệnh thử lại.</p>}
  </div>
  <ApproveSlot.Provider value={setApprove}>
    {flow.id !== null && flow.stage === 'outline' && outline && <div className="st-card"><OutlinePanel key={outline.versionNo} storyId={flow.id} version={outline} editable={!locked} visible onReveal={() => {}} onApproved={refreshState} onChanged={refreshState} /></div>}
    {flow.id !== null && flow.stage === 'review' && <section className="ws with-steps creator-review"><ReviewGate key={`${flow.id}:${refresh}`} storyId={flow.id} ageBand={ageBand} actor="creator" onApproved={refreshState} onArchived={onBack} /></section>}
  </ApproveSlot.Provider>
  {flow.id !== null && flow.stage === 'media' && <div className="st-card"><h3>{media.data?.isReady ? 'Media đã sẵn sàng' : 'Đang chuẩn bị media'}</h3><p>{media.error ?? media.data?.errorCode ?? media.data?.jobStatus}</p><p>{media.data?.readyIllustrations ?? 0} tranh sẵn sàng · {media.data?.readyAudio ?? 0} đoạn âm thanh sẵn sàng</p>{media.data?.errorCode && <button className="btn btn-s" disabled={flow.busy} onClick={() => void flow.command(() => api.retryMedia(flow.id!)).then(() => media.refresh())}>Thử lại media</button>}</div>}
  {flow.id !== null && <CreatorPublication storyId={flow.id} versionId={versionId} storyStatus={storyStatus} onLockChange={setLocked} onRevision={refreshState} />}
  </>;
}
