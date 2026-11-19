'use client';
import { useEffect, useState } from 'react';
import { Check, HelpCircle, Mic, RotateCcw, Send, Square } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { showToast } from '@/app/lib/toast';
import { childReadingService } from '@/app/services/childReadingService';
import { SUMMARY_MAX_BYTES, SUMMARY_MAX_QUESTIONS, SUMMARY_QUESTION_MAX_CHARS, type ReadingScene } from '@/app/types/childReading';
import { useRecorder, type RecorderState } from './useRecorder';
import KidSceneGrid from './KidSceneGrid';

type SceneRef = Pick<ReadingScene, 'sceneId' | 'sceneIndex' | 'illustrationUrl' | 'illustrations'>;
/** beatOrder = null: cảnh không có tranh riêng, Backend hỏi về cả cảnh. */
type Pic = { key: string; label: string; sceneId: number; sceneIndex: number; beatOrder: number | null; url: string | null };

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
export const micToast = (s: RecorderState) => {
  if (s === 'denied') showToast('Em cần cho phép dùng micro nhé.', 'warn');
  else if (s === 'unsupported') showToast('Máy này chưa ghi âm được.', 'warn');
};
/**
 * Mọi tranh của truyện theo thứ tự cảnh rồi beatOrder, đánh số "Tranh N" liên tục như lúc lật trang đọc
 * (bỏ tranh không có link giống scenePictures); cảnh không có tranh riêng thành một ô.
 */
const toPictures = (scenes: SceneRef[]): Pic[] => scenes.slice().sort((a, b) => a.sceneIndex - b.sceneIndex).flatMap<Omit<Pic, 'label'>>(s => {
  const ills = (s.illustrations ?? []).filter(i => i.url).sort((a, b) => a.beatOrder - b.beatOrder);
  return ills.length
    ? ills.map(i => ({ key: `${s.sceneId}-${i.beatOrder}`, sceneId: s.sceneId, sceneIndex: s.sceneIndex, beatOrder: i.beatOrder, url: i.url }))
    : [{ key: `${s.sceneId}-`, sceneId: s.sceneId, sceneIndex: s.sceneIndex, beatOrder: null, url: s.illustrationUrl }];
}).map((p, i) => ({ ...p, label: `Tranh ${i + 1}` }));

/** Báo đã gửi xong: dấu tích và chữ cùng một dòng, bật lên nhẹ khi xuất hiện. */
export const Sent = ({ text }: { text: string }) => (
  <p className="kid-sent" role="status"><span className="kid-sent-ic" aria-hidden="true"><Check /></span>{text}</p>
);

/** Cuối truyện: bé kể lại bằng giọng nói và chọn tranh còn thắc mắc để hỏi bố mẹ. */
export default function KidSummary({ token, sessionId, scenes, part }: { token: string; sessionId: number; scenes: SceneRef[]; part: 'voice' | 'questions' }) {
  const rec = useRecorder(SUMMARY_MAX_BYTES);
  const ask = useRecorder(SUMMARY_MAX_BYTES);
  const [sentVoice, setSentVoice] = useState('');
  const [asked, setAsked] = useState<string[]>([]);
  const [lastSent, setLastSent] = useState('');
  const [pick, setPick] = useState<Pic | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const pics = toPictures(scenes);
  // note chỉ nhận lỗi gửi (thành công hiện bằng dấu tích/toast).
  useEffect(() => { if (note) showToast(note, 'err'); }, [note]);
  useEffect(() => micToast(rec.state), [rec.state]);
  useEffect(() => micToast(ask.state), [ask.state]);

  const sendVoice = async () => {
    if (!rec.blob || busy) return;
    setBusy(true); setNote('');
    const r = await childReadingService.summaryRecording(token, sessionId, rec.blob);
    setBusy(false);
    if (r.success && r.data) setSentVoice(r.data.message); else setNote(r.message);
  };
  const choose = (p: Pic) => { ask.reset(); setText(''); setPick(v => v?.key === p.key ? null : p); };
  const sendQuestion = async () => {
    if (!pick || busy) return;
    setBusy(true); setNote('');
    const r = await childReadingService.summaryQuestion(token, sessionId, { sceneId: pick.sceneId, beatOrder: pick.beatOrder, text, audio: ask.blob });
    setBusy(false);
    // 409: tranh này em đã hỏi từ trước, khoá ô lại như đã gửi.
    if ((r.success && r.data) || r.status === 409) { setAsked(v => [...v, pick.key]); setPick(null); setText(''); ask.reset(); }
    if (r.success && r.data) { setLastSent(r.data.message); showToast(r.data.message, 'ok'); } else setNote(r.message);
  };
  const recording = ask.state === 'recording' || ask.state === 'converting';

  return <section className="kid-summary" aria-label="Kể lại cho bố mẹ">
    {part === 'voice' && (
      sentVoice ? <Sent text={sentVoice} /> : <div className="kid-actions">
        {rec.state === 'recording'
          ? <button type="button" className="kid-btn3d is-gold" onClick={rec.stop}><Square aria-hidden="true" />Dừng ({clock(rec.seconds)})</button>
          : <button type="button" className="kid-btn3d is-sky" disabled={rec.state === 'converting'} onClick={() => void rec.start()}><Mic aria-hidden="true" />{rec.state === 'converting' ? 'Đang chuẩn bị…' : rec.state === 'ready' ? 'Ghi lại' : 'Bấm để kể'}</button>}
        {rec.state === 'ready' && rec.url && <>
          <audio controls src={rec.url} aria-label="Nghe lại bản em vừa kể" />
          <button type="button" className="kid-btn3d is-sky kid-btn-icon" aria-label="Bỏ bản ghi" title="Bỏ bản ghi" onClick={rec.reset}><RotateCcw aria-hidden="true" /></button>
          <button type="button" className="kid-btn3d is-gold" disabled={busy} onClick={() => void sendVoice()}><Send aria-hidden="true" />Gửi bố mẹ</button>
        </>}
      </div>
    )}

    {part === 'questions' && pics.length > 0 && <>
      <h3 className="display"><HelpCircle aria-hidden="true" /> Chỗ nào em còn thắc mắc? <span className="kid-ask-count">({asked.length}/{SUMMARY_MAX_QUESTIONS})</span></h3>
      {asked.length >= SUMMARY_MAX_QUESTIONS ? <Sent text={lastSent || 'Đã gửi cho bố mẹ'} /> : <>
        <KidSceneGrid tiles={pics} picked={pick?.key ?? null} done={asked} doneLabel="em đã hỏi" disabled={busy || recording} label="Chọn tranh em muốn hỏi bố mẹ" onPick={choose} />
        {pick && <div className="kid-ask-panel" key={pick.key}>
          <SafeImage className="kid-ask-pic" src={pick.url} alt={pick.label} />
          <div className="kid-actions">
            {ask.state === 'recording'
              ? <button type="button" className="kid-btn3d is-gold" onClick={ask.stop}><Square aria-hidden="true" />Dừng ({clock(ask.seconds)})</button>
              : <button type="button" className="kid-btn3d is-sky" disabled={ask.state === 'converting' || busy} onClick={() => void ask.start()}><Mic aria-hidden="true" />{ask.state === 'converting' ? 'Đang chuẩn bị…' : ask.state === 'ready' ? 'Ghi lại' : 'Bấm để hỏi'}</button>}
            {ask.state === 'ready' && ask.url && <>
              <audio controls src={ask.url} aria-label="Nghe lại câu em vừa hỏi" />
              <button type="button" className="kid-btn3d is-sky kid-btn-icon" aria-label="Bỏ bản ghi" title="Bỏ bản ghi" onClick={ask.reset}><RotateCcw aria-hidden="true" /></button>
            </>}
          </div>
          <input className="inp" aria-label="Câu hỏi của em" placeholder="Em gõ câu hỏi…" maxLength={SUMMARY_QUESTION_MAX_CHARS} value={text} onChange={e => setText(e.target.value)} />
          <button type="button" className="kid-btn3d is-gold" disabled={busy || recording} onClick={() => void sendQuestion()}><Send aria-hidden="true" />Gửi bố mẹ</button>
        </div>}
      </>}
    </>}
  </section>;
}
