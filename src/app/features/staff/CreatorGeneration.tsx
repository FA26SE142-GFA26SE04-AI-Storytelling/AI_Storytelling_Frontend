'use client';
import '@/app/features/studio/studio.css';
import '@/app/features/review/review.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { creatorInputService } from '@/app/services/creatorPublicationService';
import { creatorService } from '@/app/services/creatorService';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import { notifyCreatorQuotaChanged } from '@/app/services/paymentService';
import { useCreatorGeneration } from '@/app/features/story-workflow/useCreatorGeneration';
import { lengthPresets } from '@/app/features/story-workflow/aiStoryInputFlowUtils';
import { useStoryProgressPolling } from '@/app/features/story-workflow/useStoryProgressPolling';
import { ApproveSlot, type ApproveAction } from '@/app/features/story-workflow/approveSlot';
import { mediaKeepPolling } from '@/app/features/story-workflow/mediaPackage';
import { useAuth } from '@/app/context/AuthContext';
import { writeCreatorAiStory } from '@/app/features/story-workflow/storyStudioSession';
import OutlinePanel from '@/app/features/studio/OutlinePanel';
import ReviewGate from '@/app/features/review/ReviewGate';
import CreatorPublication from './CreatorPublication';
import StudioSteps from '@/app/features/studio/StudioSteps';
import { studioProgress } from '@/app/features/studio/studioProgress';
import { useSteppedProgress } from '@/app/features/studio/useSteppedProgress';
import type { Stage } from '@/app/features/story-workflow/generationSnapshot';
import { TabActions } from '@/app/features/story-workflow/tabActions';
import StudioControls from '@/app/features/studio/StudioControls';
import StageProgress from '@/app/features/studio/StageProgress';
import CreatorBrief from './CreatorBrief';
import CreatorMedia from './CreatorMedia';
import { creatorPublicationState } from './creatorPublicationState';
const continueMedia = mediaKeepPolling;
/** Lỗi AI hay gặp, giải thích bằng tiếng Việt; mã lạ thì hiện nguyên mã. */
const FAILURE_VI: Record<string, string> = {
  CONTENT_GENERATION_TIMEOUT: 'AI viết truyện quá thời gian chờ (mã CONTENT_GENERATION_TIMEOUT). Bấm Thử lại để viết lại.',
  AI_TIMEOUT: 'AI phản hồi quá chậm (mã AI_TIMEOUT). Bấm Thử lại.',
};

/** Ý tưởng đã nhập, giữ lại khi quay về form (sửa ý tưởng); null = form trống. */
type Seed = { topic: string; lesson: string; genre: string; charactersText: string; setting: string } | null;

/**
 * Vỏ ngoài: "bỏ truyện / quay lại sửa ý tưởng" dựng lại toàn bộ luồng bằng key mới, nên mọi trạng thái cũ (dàn ý, tiến trình) sạch hẳn.
 * Content Creator không có API huỷ truyện, nên đây chỉ là làm mới form; bản nháp vẫn nằm trong Thư viện.
 */
export default function CreatorGeneration({ initialId = null, onBuyCredits }: { initialId?: number | null; onBack: () => void; onBuyCredits?: () => void }) {
  const [run, setRun] = useState(0);
  const [seed, setSeed] = useState<Seed>(null);
  return <CreatorGenerationRun key={run} initialId={run === 0 ? initialId : null} seed={seed} onReset={(next) => { setSeed(next); setRun((n) => n + 1); }} onBuyCredits={onBuyCredits} />;
}
function CreatorGenerationRun({ initialId, seed, onReset, onBuyCredits }: { initialId: number | null; seed: Seed; onReset: (seed: Seed) => void; onBuyCredits?: () => void }) {
  const flow = useCreatorGeneration(initialId);
  // Nhớ truyện AI đang soạn để tải lại trang vẫn mở lại đúng truyện (truyện mới bắt đầu thì xóa).
  const { user: sessionUser } = useAuth();
  const sessionUserId = sessionUser?.id ?? null;
  useEffect(() => { if (sessionUserId !== null) writeCreatorAiStory(sessionUserId, flow.id); }, [sessionUserId, flow.id]);
  const retryKey = useRef<{ storyId: number; kind: string; key: string } | null>(null);
  const [context, setContext] = useState<B.CreatorAIStoryInputContextDto | null>(null);
  const [ageBand, setAgeBand] = useState('6-8');
  const [readingLevel, setReadingLevel] = useState(2);
  const [topic, setTopic] = useState(seed?.topic ?? '');
  const [genre, setGenre] = useState(seed?.genre ?? '');
  const [charactersText, setCharactersText] = useState(seed?.charactersText ?? '');
  const [setting, setSetting] = useState(seed?.setting ?? '');
  const [lesson, setLesson] = useState(seed?.lesson ?? '');
  const [targetLength, setTargetLength] = useState(500);
  const [vocabularyLevel, setVocabularyLevel] = useState('basic');
  const [outputMode, setOutputMode] = useState('reading_media_only');
  const [contextError, setContextError] = useState('');
  const [approve, setApprove] = useState<ApproveAction | null>(null);
  const [locked, setLocked] = useState(true);
  const [savedStatus, setSavedStatus] = useState('');
  const [savedVersion, setSavedVersion] = useState<number | null>(null);
  const [publicationStatus, setPublicationStatus] = useState<B.CreatorPublicationStatus | null>(null);
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
  const creative = (): B.AIStoryCreativeInputDto => {
    // Nhiều nhân vật cách nhau bằng dấu phẩy; để trống thì AI tự nghĩ (giống form của phụ huynh).
    const characters = charactersText.split(',').map(c => c.trim()).filter(Boolean);
    const place = setting.trim();
    return { topic, genre: genre || null, characterMode: characters.length ? 'specified' : 'ai_suggested', characters, settingMode: place ? 'specified' : 'ai_suggested', setting: place || null, lesson, vocabularyLevel, language: 'vi', targetLength };
  };
  const start = () => {
    const body = { ...creative(), ageBand, readingLevel, outputMode, existingStoryId: null, idempotencyKey: `creator-${crypto.randomUUID()}` };
    // Tải lại số lượt sau khi Backend nhận yêu cầu (đã trừ lượt), không phải ngay lúc bấm.
    setSubmitted(body); void Promise.resolve(flow.submit(body)).finally(notifyCreatorQuotaChanged);
  };
  const outline = flow.snapshot?.outline?.currentVersion ?? null;
  const storyStatus = media.data?.storyStatus ?? savedStatus;
  const versionId = media.data?.approvedStoryVersionId ?? savedVersion;
  const failed = flow.failure?.code ?? null;
  const stage: Stage = flow.id === null ? 'brief'
    : flow.input && flow.input.inputStatus !== 'input_accepted' ? (['input_blocked', 'input_check_failed'].includes(flow.input.inputStatus) ? 'blocked' : 'checking')
    : flow.stage;
  const baseProgress = studioProgress(stage, flow.snapshot, media.data, stage === 'media' ? null : failed);
  const publicationState = publicationStatus?.storyId === flow.id && publicationStatus.versionId === versionId
    ? creatorPublicationState(publicationStatus) : null;
  const progress = useSteppedProgress(baseProgress.mode === 'done'
    ? { ...baseProgress, caption: publicationState?.kind === 'revision' ? 'Cần tạo bản chỉnh sửa để gửi lại' : publicationState?.label ?? 'Nội dung và media đã hoàn tất' }
    : baseProgress);
  const reviewing = flow.id !== null && flow.stage === 'review' && stage === 'review';
  // Bước Tranh & giọng đọc có bố cục riêng như phụ huynh: khung giữa + cột phải cuộn riêng (không còn một trang dài cuộn dọc).
  const mediaStage = flow.id !== null && flow.stage === 'media' && stage === 'media';
  const publication = (hidden: boolean) => flow.id !== null && <CreatorPublication storyId={flow.id} versionId={versionId} storyStatus={storyStatus} onLockChange={setLocked} onPublicationChange={setPublicationStatus} onRevision={refreshState} hidden={hidden} onBuyCredits={onBuyCredits} />;
  const waiting = flow.id !== null && !flow.failure && ['checking', 'outline_wait', 'generating', 'moderation'].includes(stage);
  // Thử lại bước AI vừa lỗi (như phụ huynh): viết truyện / học liệu qua generation/retry, hoặc tạo dàn ý lần đầu qua outline/retry.
  // Lỗi khi viết lại dàn ý đã có thì không có ở đây: bấm "Viết lại" trong dàn ý.
  const canRetry = flow.id !== null && flow.failure !== null && (flow.failure.kind === 'generation' || !outline);
  const retryFailed = async () => {
    if (flow.id === null || !flow.failure) return;
    const storyId = flow.id, kind = flow.failure.kind;
    // Cùng một khoá cho cùng một lỗi: gửi lại sau khi mất phản hồi không tạo thêm lệnh mới.
    if (retryKey.current?.storyId !== storyId || retryKey.current.kind !== kind) retryKey.current = { storyId, kind, key: `retry-${storyId}-${crypto.randomUUID()}` };
    const key = retryKey.current.key;
    const r = await flow.command(() => kind === 'generation' ? api.retryGeneration(storyId, { retryKey: key }) : api.retryOutline(storyId, { operationKey: key }));
    if (r && r.status !== 0 && (r.status ?? 0) < 500) retryKey.current = null;
  };
  const notices = <>
    {(flow.message || flow.error || contextError) && <p className="notice" role="status">{flow.error || contextError || flow.message}</p>}
    {flow.timedOut && <p className="notice" role="status">Đã dừng theo dõi tự động. Kiểm tra trạng thái trước khi gửi lệnh khác.</p>}
    {flow.input && flow.input.inputStatus !== 'input_accepted' && <><p>{flow.input.fallbackMessage ?? 'Đang kiểm tra ý tưởng…'}</p>{flow.input.canRetry && submitted && <button className="btn btn-s" disabled={flow.busy} onClick={() => void flow.retry(submitted!)}>Kiểm tra lại</button>}</>}
    {flow.failure && <div className="notice err" role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
      <span>{FAILURE_VI[flow.failure.code] ?? `Máy chủ xác nhận bước xử lý thất bại (${flow.failure.code}).`}</span>
      {canRetry && <button type="button" className="btn btn-s" disabled={flow.busy} onClick={() => void retryFailed()}>{flow.busy ? 'Đang gửi yêu cầu…' : 'Thử lại'}</button>}
    </div>}
    {flow.stage === 'stopped' && <p className="notice" role="status">Luồng đã dừng theo trạng thái backend; không tự tạo lệnh thử lại.</p>}
  </>;
  // Cụm nút điều khiển giống phụ huynh (quay lại / bỏ / duyệt, chỉ có biểu tượng). Creator không có API huỷ truyện,
  // nên "bỏ" chỉ làm mới form và bản nháp vẫn nằm trong Thư viện.
  const currentSeed: Seed = { topic, lesson, genre, charactersText, setting };
  const controls = <StudioControls stage={stage} valuesKnown={submitted !== null} localOnly failed={failed !== null}
    onEditIdea={() => onReset(currentSeed)}
    onRestart={async (keepIdea) => { onReset(keepIdea ? currentSeed : null); return null; }}
    onLeave={(keepIdea) => onReset(keepIdea ? currentSeed : null)}
    onStartNew={() => onReset(null)}
    approve={approve ? { ...approve, disabled: approve.disabled || locked } : null} />;
  return <section className="ws with-steps" style={reviewing || mediaStage ? undefined : { gridTemplateColumns: 'minmax(0, 1fr)' }}>
    <StudioSteps progress={progress} context={flow.error || flow.timedOut ? <button className="btn btn-s" onClick={refreshState}>Tải lại</button> : undefined}>
      {/* Màn duyệt truyện tự hiện cụm nút ở thanh tab của nó (như phụ huynh); các bước khác hiện ngay trên thanh tiến trình. */}
      {!reviewing && controls}
    </StudioSteps>
    <TabActions.Provider value={controls}>
    <ApproveSlot.Provider value={setApprove}>
      {reviewing && <ReviewGate key={`${flow.id}:${refresh}`} storyId={flow.id!} ageBand={ageBand} actor="creator" onApproved={refreshState} />}
      {/* Nút duyệt bị tắt khi `locked`, mà `locked` chỉ được tính bởi CreatorPublication. Ở bước duyệt phải luôn có nó chạy (ẩn, không vẽ gì),
          nếu không `locked` giữ giá trị cũ (thường là "khóa") cho tới khi tải lại trang nên dấu ✓ không bật dù đã đủ điều kiện. */}
      {reviewing && publication(true)}
      {mediaStage && flow.id !== null && (
        <CreatorMedia storyId={flow.id} versionId={versionId} media={media} locked={locked} busy={flow.busy}
          onRetry={() => void flow.command(() => api.retryMedia(flow.id!)).then(() => media.refresh())}
          onChanged={() => { media.refresh(); refreshState(); }}>
          {publication(false)}
        </CreatorMedia>
      )}
      {!reviewing && !mediaStage && <div className="pane"><div className="plan-stage"><div className="plan-scroll">
        {flow.id === null && <CreatorBrief
          values={{ topic, lesson, genre, charactersText, setting, targetLength, vocabularyLevel, outputMode }} context={context} contextError={contextError} busy={flow.busy}
          ageBand={ageBand} readingLevel={readingLevel} onAudience={(a, l) => { setAgeBand(a); setReadingLevel(l); }}
          onChange={(v) => { if (v.topic !== undefined) setTopic(v.topic); if (v.lesson !== undefined) setLesson(v.lesson); if (v.genre !== undefined) setGenre(v.genre); if (v.charactersText !== undefined) setCharactersText(v.charactersText); if (v.setting !== undefined) setSetting(v.setting); if (v.targetLength !== undefined) setTargetLength(v.targetLength); if (v.vocabularyLevel !== undefined) setVocabularyLevel(v.vocabularyLevel); if (v.outputMode !== undefined) setOutputMode(v.outputMode); }}
          onSubmit={start} onBuyCredits={onBuyCredits} />}
        {/* Lúc AI đang làm: thẻ chờ giống phụ huynh (con cóc ngồi chờ + bước hiện tại). */}
        {waiting && <div style={{ height: '100%', minHeight: 380 }}><StageProgress stage={stage} snapshot={flow.snapshot} outputMode={outputMode} message={flow.error || flow.message} onRetry={refreshState} /></div>}
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 16 }}>
          {notices}
          {flow.id !== null && flow.stage === 'outline' && outline && <div className="st-card"><OutlinePanel key={outline.versionNo} storyId={flow.id} version={outline} editable={!locked} visible onReveal={() => {}} onApproved={refreshState} onChanged={refreshState} /></div>}
          {/* Chưa tới bước media: chỉ chạy ngầm để tính trạng thái khóa chỉnh sửa, không vẽ gì. */}
          {publication(true)}
        </div>
      </div></div></div>}
    </ApproveSlot.Provider>
    </TabActions.Provider>
  </section>;
}
