'use client';
import { useEffect, useState } from 'react';
import { Mic, RotateCcw, Send, Square } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { showToast } from '@/app/lib/toast';
import { useSwap } from '@/app/lib/motion';
import { childReadingService, childReflectionService as api } from '@/app/services/childReadingService';
import { SUMMARY_MAX_BYTES, type ReadingFeeling, type ReadingScene, type StoryEmotionCode } from '@/app/types/childReading';
import { REFLECTION_MAX_EMOTIONS, REFLECTION_NOTE_MAX_CHARS, type ChildStoryReflection } from '@/app/types/kidReflection';
import KidSceneGrid from './KidSceneGrid';
import { clock, micToast, Sent } from './KidSummary';
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
/** Trang bắt đầu theo những gì bé đã chọn trước đó trong phiên (mức thích không có trong GET reflection: đã qua bước sau thì bỏ qua). */
const resume = (d: ChildStoryReflection): number => d.noteText || d.hasNoteRecording ? 4 : d.favoriteSceneId != null ? 3 : d.emotions.length ? 2 : 0;

/** Sau khi đọc: một thẻ "Cảm nhận của em" đi từng bước (mức thích → cảm xúc → cảnh thích nhất → lời gửi bố mẹ). */
export default function KidReflection({ token, sessionId, scenes, step, onNext, onGoto, onResume }: { token: string; sessionId: number; scenes: ReadingScene[]; step: 0 | 1 | 2 | 3; onNext: () => void; onGoto: (page: number) => void; onResume: (page: number) => void }) {
  const rec = useRecorder(SUMMARY_MAX_BYTES);
  const [data, setData] = useState<ChildStoryReflection | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [sceneId, setSceneId] = useState<number | null>(null);
  const [pickKey, setPickKey] = useState<string | null>(null);
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
      setData(r.data); setEmotions(r.data.emotions.map(e => e.code)); setSceneId(r.data.favoriteSceneId); setText(r.data.noteText ?? '');
      onResume(resume(r.data));
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ tải lại khi đổi token hoặc phiên
  }, [token, sessionId]);

  // Bé đọc theo tranh nên chọn tranh ("Tranh N" như lúc lật trang); Backend chỉ lưu cảnh của tranh (favorite-scene nhận SceneId).
  const tiles = scenes.slice().sort((a, b) => a.sceneIndex - b.sceneIndex)
    .flatMap(s => scenePictures(s).map((p, i) => ({ key: `${s.sceneId}-${i}`, sceneId: s.sceneId, url: p.url })))
    .map((t, i) => ({ ...t, label: `Tranh ${i + 1}` }));
  // Tải lại trang thì chỉ biết cảnh: chọn sẵn tranh đầu của cảnh đó.
  const picked = tiles.find(t => t.key === pickKey) ?? tiles.find(t => t.sceneId === sceneId) ?? null;
  const recording = rec.state === 'recording' || rec.state === 'converting';
  const canRecord = !!data?.canRecord;
  // Đã gửi lời cho bố mẹ (quay lại trang này vẫn thấy): nút gửi chỉ hiện khi bé sửa chữ hoặc ghi âm mới, và thành "Gửi lại".
  const noteSent = !!(data?.noteText || data?.hasNoteRecording);
  const noteChanged = text.trim() !== (data?.noteText ?? '').trim() || (canRecord && !!rec.blob);

  /** Gửi một bước; thành công thì nhớ kết quả và sang bước sau, lỗi hiện toast lời của Backend. */
  const send = async (call: () => ReturnType<typeof api.get>, next: (saved: ChildStoryReflection) => void) => {
    if (busy) return false;
    setBusy(true);
    const r = await call();
    setBusy(false);
    if (!r.success || !r.data) { showToast(r.message, 'err'); return r.status ?? 0; }
    setData(r.data); next(r.data);
    return true;
  };
  /** Mức thích lưu ở phiên đọc (PUT feeling); chọn xong tự sang bước cảm xúc. */
  const like = async (value: ReadingFeeling) => {
    if (busy) return;
    setBusy(true);
    const r = await childReadingService.feeling(token, sessionId, value);
    setBusy(false);
    if (r.success && r.data) { setFeeling(r.data.feeling); onNext(); } else showToast(r.message, 'err');
  };
  /**
   * Không có nút "Tiếp": mỗi lần chọn / bỏ chọn là lưu luôn; đủ 2 cảm xúc thì tự sang trang sau (chờ chút để bé thấy mình đã chọn).
   * shortcut: bỏ chọn hết thì không gửi danh sách rỗng nên cảm xúc đã lưu trước đó vẫn còn; cần xoá được thì BE phải nhận [].
   */
  const toggle = (code: string) => {
    if (busy) return;
    const next = emotions.includes(code) ? emotions.filter(c => c !== code) : emotions.length < REFLECTION_MAX_EMOTIONS ? [...emotions, code] : emotions;
    setEmotions(next);
    if (!next.length) return;
    void send(() => api.emotions(token, sessionId, next), () => { if (next.length >= REFLECTION_MAX_EMOTIONS) setTimeout(onNext, 500); });
  };
  /** Chạm tranh là lưu tranh thích nhất và sang trang sau. */
  const pickScene = (t: { key: string; sceneId: number }) => {
    if (busy) return;
    setSceneId(t.sceneId); setPickKey(t.key);
    void send(() => api.favoriteScene(token, sessionId, t.sceneId), onNext);
  };
  const sendNote = async () => {
    const result = await send(
      () => api.note(token, sessionId, { text, audio: canRecord ? rec.blob : null }),
      (saved) => { rec.reset(); setText(saved.noteText ?? ''); showToast('Đã gửi cho bố mẹ', 'ok'); onNext(); }
    );
    // 409: cảnh vừa bị đổi ở nơi khác, mời bé chọn lại cảnh.
    if (result === 409) onGoto(2);
    else if (result === 403) { setData(d => d ? { ...d, canRecord: false } : d); rec.reset(); }
  };

  return <section className="kid-reflection" aria-label="Cảm nhận của em" aria-busy={!loaded}>
    <div className="kid-reflection-step" ref={swap}>
      {step === 0 && <div className="kid-feelings" role="group" aria-label="Chọn mức em thích truyện">
        {FEELINGS.map(f => <button key={f.id} type="button" className="kid-btn3d is-sky kid-btn-icon" aria-label={f.label} title={f.label} aria-pressed={feeling === f.id} disabled={!loaded || busy} onClick={() => void like(f.id)}>
          <span aria-hidden="true">{f.face}</span>
        </button>)}
      </div>}
      {step === 1 && <>
        <div className="kid-emotions" role="group" aria-label="Chọn tối đa hai cảm xúc">
          {EMOTIONS.map(e => {
            const on = emotions.includes(e.code);
            return <button key={e.code} type="button" className="kid-btn3d is-sky kid-emotion" aria-pressed={on} disabled={busy || (!on && emotions.length >= REFLECTION_MAX_EMOTIONS)} onClick={() => toggle(e.code)}>
              <span className="kid-emotion-face" aria-hidden="true">{e.face}</span>{e.label}
            </button>;
          })}
        </div>
      </>}
      {step === 2 && <>
        <KidSceneGrid tiles={tiles} picked={picked?.key ?? null} disabled={busy} label="Chọn tranh em thích nhất" onPick={pickScene} />
      </>}
      {step === 3 && (!picked ? <>
        <p className="kid-ask-hint">Em chọn tranh em thích nhất trước nhé</p>
        <div className="kid-actions">
          <button type="button" className="kid-btn3d is-sky" onClick={() => onGoto(2)}>Chọn tranh</button>
        </div>
      </> : <>
        <SafeImage className="kid-ask-pic" src={picked.url} alt={picked.label} />
        {canRecord && <div className="kid-actions">
          {rec.state === 'recording'
            ? <button type="button" className="kid-btn3d is-gold" onClick={rec.stop}><Square aria-hidden="true" />Dừng ({clock(rec.seconds)})</button>
            : <button type="button" className="kid-btn3d is-sky" disabled={rec.state === 'converting' || busy} onClick={() => void rec.start()}><Mic aria-hidden="true" />{rec.state === 'converting' ? 'Đang chuẩn bị…' : rec.state === 'ready' ? 'Ghi lại' : 'Bấm để kể'}</button>}
          {rec.state === 'ready' && rec.url && <>
            <audio controls src={rec.url} aria-label="Nghe lại lời em vừa kể" />
            <button type="button" className="kid-btn3d is-sky kid-btn-icon" aria-label="Bỏ bản ghi" title="Bỏ bản ghi" onClick={rec.reset}><RotateCcw aria-hidden="true" /></button>
          </>}
        </div>}
        <textarea className="inp kid-reflection-text" aria-label="Điều em thích ở tranh này" placeholder="Em viết vài chữ nhé…" rows={2} maxLength={REFLECTION_NOTE_MAX_CHARS} value={text} onChange={e => setText(e.target.value)} />
        {noteSent && !noteChanged && <Sent text={data?.hasNoteRecording ? 'Đã gửi lời kể cho bố mẹ' : 'Đã gửi cho bố mẹ'} />}
        {(!noteSent || noteChanged) && <div className="kid-actions">
          <button type="button" className="kid-btn3d is-gold" disabled={busy || recording || (!text.trim() && !(canRecord && rec.blob))} onClick={() => void sendNote()}><Send aria-hidden="true" />{noteSent ? 'Gửi lại' : 'Gửi bố mẹ'}</button>
        </div>}
      </>)}
    </div>
  </section>;
}
