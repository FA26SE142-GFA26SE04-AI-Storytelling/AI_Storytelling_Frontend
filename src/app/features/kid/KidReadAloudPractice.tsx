'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Mic, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import Frog from '@/app/components/brand/Frog';
import { showToast } from '@/app/lib/toast';
import { useSwap } from '@/app/lib/motion';
import { useAuthedMediaUrl } from '@/app/lib/useAuthedMediaUrl';
import type { ApiResponse } from '@/app/types/auth';
import type { ReadAloudResult } from '@/app/types/childReading';
import type { ReadAloudPractice } from '@/app/types/kidReflection';
import { Caption } from './ChildReaderCaption';
import { useRecorder } from './useRecorder';

const play = (el: HTMLAudioElement | null) => { if (el) { el.currentTime = 0; void el.play().catch(() => {}); } };
/**
 * Lời khen soạn sẵn của bài (praiseFeedback + tiếng) chỉ khen sự cố gắng và mời đọc lại, không theo kết quả chấm:
 * đọc đúng hết thì không hiện / không phát, chỉ còn lời chấm của Backend ("Em đọc hay quá!").
 */
export const needsRetry = (r: ReadAloudResult) => r.goodCount < r.totalCount;

/**
 * Trang cuối của màn đọc: bé nghe câu mẫu rồi đọc to, kết quả tô màu từng chữ như đọc theo đoạn.
 * children: hàng điều hướng (trang trước, số trang, "Em đã đọc xong") do màn đọc truyền vào.
 */
export default function KidReadAloudPractice({ practice, disabled, onRecord, children }: {
  practice: ReadAloudPractice; disabled: boolean;
  onRecord: (interactionId: number, audio: Blob) => Promise<ApiResponse<ReadAloudResult>>; children: ReactNode;
}) {
  const rec = useRecorder(1_000_000);
  const [want, setWant] = useState(false);
  const [result, setResult] = useState<ReadAloudResult | null>(null);
  const sent = useRef<Blob | null>(null);
  const sendRef = useRef(onRecord);
  useEffect(() => { sendRef.current = onRecord; });
  const sample = useAuthedMediaUrl(practice.audioUrl);
  const praise = useAuthedMediaUrl(practice.praiseAudioUrl);
  const sampleRef = useRef<HTMLAudioElement>(null);
  const praiseRef = useRef<HTMLAudioElement>(null);
  const swap = useSwap<HTMLDivElement>('practice');

  useEffect(() => {
    if (rec.state === 'denied') showToast('Em cần cho phép dùng micro để đọc nhé.', 'warn');
    else if (rec.state === 'unsupported') showToast('Máy này chưa hỗ trợ ghi âm.', 'warn');
  }, [rec.state]);

  // Ghi xong thì gửi chấm ngay; mỗi bản ghi chỉ gửi một lần.
  useEffect(() => {
    const blob = rec.blob;
    if (!want || rec.state !== 'ready' || !blob || sent.current === blob) return;
    sent.current = blob;
    void sendRef.current(practice.interactionId, blob).then(r => {
      if (r.success && r.data) {
        setResult(r.data); showToast(r.data.message || 'Em đọc hay quá!', 'ok');
        if (needsRetry(r.data)) play(praiseRef.current);
      }
      else showToast(r.message || 'Em thử đọc lại nhé.', 'err');
    }).finally(() => setWant(false));
  }, [want, rec.state, rec.blob, practice.interactionId]);

  const recording = rec.state === 'recording';
  const scoring = want && (rec.state === 'converting' || rec.state === 'ready');
  const mic = () => {
    if (recording) { rec.stop(); return; }
    sampleRef.current?.pause();
    setResult(null); setWant(true); void rec.start();
  };
  const retry = () => { setResult(null); rec.reset(); };

  return <div className="kid-practice" ref={swap}>
    <section className="kid-practice-card" aria-labelledby="kid-practice-title">
      <div className="kid-practice-head">
        <Frog mood={result ? 'happy' : 'idle'} size={72} />
        <h2 id="kid-practice-title" className="display">Luyện đọc to</h2>
      </div>
      <blockquote className="kid-practice-quote" aria-label="Câu em luyện đọc">
        <Caption text={practice.text} part={null} result={result} segment={null} segmentStart={0} />
      </blockquote>
      <div className="kid-actions">
        {sample.src && <button type="button" className="kid-btn3d is-sky" disabled={recording || scoring} onClick={() => play(sampleRef.current)}><Volume2 aria-hidden="true" />Nghe mẫu</button>}
        <button type="button" className={`kid-btn3d is-gold kid-read-aloud-btn${recording ? ' kid-read-aloud-btn--recording' : scoring ? ' kid-read-aloud-btn--busy' : ''}`} disabled={disabled || scoring} onClick={mic}
          aria-label={recording ? 'Dừng đọc' : scoring ? 'Đang chấm điểm' : 'Đọc to'}><Mic aria-hidden="true" />{recording ? 'Dừng' : scoring ? 'Đang chấm' : 'Đọc to'}</button>
        {result && <button type="button" className="kid-btn3d is-sky kid-btn-icon" aria-label="Đọc lại" title="Đọc lại" disabled={disabled || scoring} onClick={retry}><RotateCcw aria-hidden="true" /></button>}
      </div>
      {result && needsRetry(result) && practice.praiseFeedback && <p className="kid-practice-praise"><Sparkles aria-hidden="true" />{practice.praiseFeedback}</p>}
      {sample.src && <audio ref={sampleRef} src={sample.src} preload="auto" hidden />}
      {praise.src && <audio ref={praiseRef} src={praise.src} preload="auto" hidden />}
    </section>
    {/* Dùng lại kiểu thanh trang của màn đọc (.kid-reader-side .kid-story-navigation). */}
    <div className="kid-reader-side">{children}</div>
  </div>;
}
