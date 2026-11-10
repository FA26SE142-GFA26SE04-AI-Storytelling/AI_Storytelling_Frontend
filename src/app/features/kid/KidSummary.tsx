'use client';
import { useState } from 'react';
import { Check, HelpCircle, Mic, RotateCcw, Send, Square } from 'lucide-react';
import { childReadingService } from '@/app/services/childReadingService';
import { SUMMARY_MAX_BYTES, SUMMARY_MAX_FLAGS } from '@/app/types/childReading';
import { useRecorder } from './useRecorder';

type SceneRef = { sceneId: number; sceneIndex: number };

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Cuối truyện: bé kể lại bằng giọng nói và chọn những chỗ còn thắc mắc để gửi cho bố mẹ. */
export default function KidSummary({ token, sessionId, scenes }: { token: string; sessionId: number; scenes: SceneRef[] }) {
  const rec = useRecorder(SUMMARY_MAX_BYTES);
  const [sentVoice, setSentVoice] = useState('');
  const [sentFlags, setSentFlags] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const sendVoice = async () => {
    if (!rec.blob || busy) return;
    setBusy(true); setNote('');
    const r = await childReadingService.summaryRecording(token, sessionId, rec.blob);
    setBusy(false);
    if (r.success && r.data) setSentVoice(r.data.message); else setNote(r.message);
  };
  const sendFlags = async () => {
    if (!picked.length || busy) return;
    setBusy(true); setNote('');
    const r = await childReadingService.summaryFlags(token, sessionId, picked);
    setBusy(false);
    if (r.success && r.data) setSentFlags(r.data.message); else setNote(r.message);
  };
  const toggle = (id: number) => setPicked(v => v.includes(id) ? v.filter(x => x !== id) : v.length < SUMMARY_MAX_FLAGS ? [...v, id] : v);

  return <section className="kid-summary" aria-label="Kể lại cho bố mẹ">
    <h3 className="display">Em kể lại cho bố mẹ nghe nhé</h3>
    {sentVoice ? <p role="status"><Check aria-hidden="true" /> {sentVoice}</p> : <div className="kid-actions">
      {rec.state === 'recording'
        ? <button type="button" className="kid-listen-primary" onClick={rec.stop}><Square aria-hidden="true" />Dừng ({clock(rec.seconds)})</button>
        : <button type="button" className="kid-soft-button" onClick={() => void rec.start()}><Mic aria-hidden="true" />{rec.state === 'ready' ? 'Ghi lại' : 'Bấm để kể'}</button>}
      {rec.state === 'ready' && rec.url && <>
        <audio controls src={rec.url} aria-label="Nghe lại bản em vừa kể" />
        <button type="button" className="kid-soft-button icon-only" aria-label="Bỏ bản ghi" title="Bỏ bản ghi" onClick={rec.reset}><RotateCcw aria-hidden="true" /></button>
        <button type="button" className="kid-listen-primary" disabled={busy} onClick={() => void sendVoice()}><Send aria-hidden="true" />Gửi bố mẹ</button>
      </>}
    </div>}
    {rec.state === 'denied' && <p className="notice" role="status">Em cần cho phép dùng micro nhé.</p>}
    {rec.state === 'unsupported' && <p className="notice" role="status">Máy này chưa ghi âm được.</p>}

    {scenes.length > 0 && <>
      <h3 className="display"><HelpCircle aria-hidden="true" /> Chỗ nào em còn thắc mắc?</h3>
      {sentFlags ? <p role="status"><Check aria-hidden="true" /> {sentFlags}</p> : <>
        <div className="kid-flag-list" role="group" aria-label={`Chọn tối đa ${SUMMARY_MAX_FLAGS} cảnh`}>
          {scenes.map(s => <button key={s.sceneId} type="button" className="kid-soft-button" aria-pressed={picked.includes(s.sceneId)}
            disabled={!picked.includes(s.sceneId) && picked.length >= SUMMARY_MAX_FLAGS} onClick={() => toggle(s.sceneId)}>Cảnh {s.sceneIndex + 1}</button>)}
        </div>
        <button type="button" className="kid-listen-primary" disabled={busy || !picked.length} onClick={() => void sendFlags()}><Send aria-hidden="true" />Gửi bố mẹ</button>
      </>}
    </>}
    {note && <p className="notice" role="status">{note}</p>}
  </section>;
}
