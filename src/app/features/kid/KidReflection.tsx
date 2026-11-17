'use client';
import { useEffect, useState } from 'react';
import { ChevronRight, Mic, RotateCcw, Send, SkipForward, Square } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { showToast } from '@/app/lib/toast';
import { useSwap } from '@/app/lib/motion';
import { childReadingService, childReflectionService as api } from '@/app/services/childReadingService';
import { SUMMARY_MAX_BYTES, type ReadingFeeling, type ReadingScene, type StoryEmotionCode } from '@/app/types/childReading';
import { REFLECTION_MAX_EMOTIONS, REFLECTION_NOTE_MAX_CHARS, type ChildStoryReflection } from '@/app/types/kidReflection';
import KidSceneGrid from './KidSceneGrid';
import { Sent, clock, micToast } from './KidSummary';
import { scenePictures } from './scenePictures';
import { useRecorder } from './useRecorder';

const FEELINGS: { id: ReadingFeeling; label: string; face: string }[] = [
  { id: 'VeryLike', label: 'Rất thích', face: '😍' },
  { id: 'Like', label: 'Thích', face: '🙂' },
  { id: 'Neutral', label: 'Bình thường', face: '😐' },
  { id: 'Dislike', label: 'Chưa thích', face: '🙁' },
];
const EMOTIONS: { code: StoryEmotionCode; label: string; face: string }[] = [
  { code: 'Happy', label: 'Vui', face: '😄' },
  { code: 'Funny', label: 'Buồn cười', face: '😂' },
  { code: 'Surprised', label: 'Ngạc nhiên', face: '😮' },
  { code: 'Excited', label: 'Hồi hộp', face: '😆' },
  { code: 'Touched', label: 'Cảm động', face: '🥹' },
  { code: 'Sad', label: 'Buồn', face: '😢' },
  { code: 'Scared', label: 'Hơi sợ', face: '😨' },
];
const TITLES = ['Em thấy truyện này thế nào?', 'Truyện làm em cảm thấy gì?', 'Cảnh em thích nhất', 'Điều gì em thích ở cảnh này?'];
type Step = 0 | 1 | 2 | 3 | 'done';
/** Bước bắt đầu theo những gì bé đã chọn trước đó trong phiên (mức thích không có trong GET reflection: đã qua bước sau thì bỏ qua). */
const resume = (d: ChildStoryReflection): Step => d.noteText || d.hasNoteRecording ? 'done' : d.favoriteSceneId != null ? 3 : d.emotions.length ? 2 : 0;

/** Sau khi đọc: một thẻ "Cảm nhận của em" đi từng bước (mức thích → cảm xúc → cảnh thích nhất → lời gửi bố mẹ), bước nào cũng bỏ qua được. */
export default function KidReflection({ token, sessionId, scenes }: { token: string; sessionId: number; scenes: ReadingScene[] }) {
  const rec = useRecorder(SUMMARY_MAX_BYTES);
  const [data, setData] = useState<ChildStoryReflection | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [sceneId, setSceneId] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const swap = useSwap<HTMLDivElement>(step);
  useEffect(() => micToast(rec.state), [rec.state]);

  useEffect(() => {
    const controller = new AbortController();
    void api.get(token, sessionId, controller.signal).then(r => {
      if (controller.signal.aborted) return;
      setLoaded(true);
      if (!r.success || !r.data) { showToast(r.message, 'err'); return; }
      setData(r.data); setEmotions(r.data.emotions.map(e => e.code)); setSceneId(r.data.favoriteSceneId);
      setStep(resume(r.data));
    });
    return () => controller.abort();
  }, [token, sessionId]);

  const tiles = scenes.slice().sort((a, b) => a.sceneIndex - b.sceneIndex)
    .map(s => ({ key: String(s.sceneId), sceneId: s.sceneId, sceneIndex: s.sceneIndex, url: scenePictures(s)[0]?.url ?? null }));
  const picked = tiles.find(t => t.sceneId === sceneId) ?? null;
  const recording = rec.state === 'recording' || rec.state === 'converting';
  const canRecord = !!data?.canRecord;

  /** Gửi một bước; thành công thì nhớ kết quả và sang bước sau, lỗi hiện toast lời của Backend. */
  const send = async (call: () => ReturnType<typeof api.get>, next: Step) => {
    if (busy) return false;
    setBusy(true);
    const r = await call();
    setBusy(false);
    if (!r.success || !r.data) { showToast(r.message, 'err'); return r.status ?? 0; }
    setData(r.data); setStep(next);
    return true;
  };
  /** Mức thích lưu ở phiên đọc (PUT feeling); chọn xong tự sang bước cảm xúc. */
  const like = async (value: ReadingFeeling) => {
    if (busy) return;
    setBusy(true);
    const r = await childReadingService.feeling(token, sessionId, value);
    setBusy(false);
    if (r.success && r.data) { setFeeling(r.data.feeling); setStep(1); } else showToast(r.message, 'err');
  };
  const toggle = (code: string) => setEmotions(v => v.includes(code) ? v.filter(c => c !== code) : v.length < REFLECTION_MAX_EMOTIONS ? [...v, code] : v);
  const sendNote = async () => {
    const result = await send(() => api.note(token, sessionId, { text, audio: canRecord ? rec.blob : null }), 'done');
    if (result === true) rec.reset();
    // 409: cảnh vừa bị đổi ở nơi khác, mời bé chọn lại cảnh.
    else if (result === 409) setStep(2);
    else if (result === 403) { setData(d => d ? { ...d, canRecord: false } : d); rec.reset(); }
  };
  const finish = () => setStep('done');

  const faces = [...FEELINGS.filter(f => f.id === feeling), ...EMOTIONS.filter(e => (data?.emotions.map(x => x.code) ?? []).includes(e.code))];
  const saved = !!feeling || (!!data && (data.emotions.length > 0 || data.favoriteSceneId != null || !!data.noteText || data.hasNoteRecording));

  if (step === 'done') return <section className="kid-reflection is-done" aria-label="Cảm nhận của em">
    <Sent text={data?.message || (saved ? 'Đã gửi cho bố mẹ' : 'Cảm ơn em nhé!')} />
    {faces.length > 0 && <p className="kid-reflection-faces" aria-label={`Cảm nhận của em: ${faces.map(f => f.label).join(', ')}`}>{faces.map(f => <span key={f.label} aria-hidden="true">{f.face}</span>)}</p>}
  </section>;

  return <section className="kid-reflection" aria-label="Cảm nhận của em" aria-busy={!loaded}>
    <header className="kid-reflection-head">
      <h3 className="display">Cảm nhận của em</h3>
      <ol className="kid-reflection-dots" aria-label={`Bước ${step + 1} trên ${TITLES.length}`}>{TITLES.map((t, i) => <li key={t} className={i === step ? 'on' : i < step ? 'past' : ''} aria-current={i === step ? 'step' : undefined}><span className="sr-only">{t}</span></li>)}</ol>
    </header>
    <div className="kid-reflection-step" ref={swap}>
      <h4 className="display">{TITLES[step]}</h4>
      {step === 0 && <div className="kid-feelings" role="group" aria-label="Chọn mức em thích truyện">
        {FEELINGS.map(f => <button key={f.id} type="button" className="kid-btn3d is-sky kid-btn-icon" aria-label={f.label} title={f.label} aria-pressed={feeling === f.id} disabled={!loaded || busy} onClick={() => void like(f.id)}>
          <span aria-hidden="true">{f.face}</span>
        </button>)}
      </div>}
      {step === 1 && <div className="kid-emotions" role="group" aria-label="Chọn tối đa hai cảm xúc">
        {EMOTIONS.map(e => {
          const on = emotions.includes(e.code);
          return <button key={e.code} type="button" className="kid-btn3d is-sky kid-emotion" aria-pressed={on} disabled={busy || (!on && emotions.length >= REFLECTION_MAX_EMOTIONS)} onClick={() => toggle(e.code)}>
            <span className="kid-emotion-face" aria-hidden="true">{e.face}</span>{e.label}
          </button>;
        })}
      </div>}
      {step === 2 && <KidSceneGrid tiles={tiles} picked={picked?.key ?? null} disabled={busy} label="Chọn cảnh em thích nhất" onPick={t => setSceneId(t.sceneId)} />}
      {step === 3 && <>
        {picked && <SafeImage className="kid-ask-pic" src={picked.url} alt={`Tranh cảnh ${picked.sceneIndex + 1}`} />}
        {canRecord && <div className="kid-actions">
          {rec.state === 'recording'
            ? <button type="button" className="kid-btn3d is-gold" onClick={rec.stop}><Square aria-hidden="true" />Dừng ({clock(rec.seconds)})</button>
            : <button type="button" className="kid-btn3d is-sky" disabled={rec.state === 'converting' || busy} onClick={() => void rec.start()}><Mic aria-hidden="true" />{rec.state === 'converting' ? 'Đang chuẩn bị…' : rec.state === 'ready' ? 'Ghi lại' : 'Bấm để kể'}</button>}
          {rec.state === 'ready' && rec.url && <>
            <audio controls src={rec.url} aria-label="Nghe lại lời em vừa kể" />
            <button type="button" className="kid-btn3d is-sky kid-btn-icon" aria-label="Bỏ bản ghi" title="Bỏ bản ghi" onClick={rec.reset}><RotateCcw aria-hidden="true" /></button>
          </>}
        </div>}
        <textarea className="inp kid-reflection-text" aria-label="Điều em thích ở cảnh này" placeholder="Em viết vài chữ nhé…" rows={2} maxLength={REFLECTION_NOTE_MAX_CHARS} value={text} onChange={e => setText(e.target.value)} />
      </>}
    </div>
    <div className="kid-actions">
      {/* Bỏ qua bước mức thích / cảm xúc thì sang bước sau; bỏ qua cảnh hoặc lời thì kết thúc (lời cần cảnh). */}
      <button type="button" className="kid-btn3d is-sky" disabled={busy || recording} onClick={step === 0 || step === 1 ? () => setStep(step + 1 as Step) : finish}><SkipForward aria-hidden="true" />Bỏ qua</button>
      {step === 1 && <button type="button" className="kid-btn3d is-gold" disabled={busy || !emotions.length} onClick={() => void send(() => api.emotions(token, sessionId, emotions), 2)}>Tiếp<ChevronRight aria-hidden="true" /></button>}
      {step === 2 && <button type="button" className="kid-btn3d is-gold" disabled={busy || sceneId == null} onClick={() => void send(() => api.favoriteScene(token, sessionId, sceneId!), 3)}>Tiếp<ChevronRight aria-hidden="true" /></button>}
      {step === 3 && <button type="button" className="kid-btn3d is-gold" disabled={busy || recording || (!text.trim() && !(canRecord && rec.blob))} onClick={() => void sendNote()}><Send aria-hidden="true" />Gửi bố mẹ</button>}
    </div>
  </section>;
}
