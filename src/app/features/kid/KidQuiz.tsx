'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Flag, RotateCcw, SkipForward } from 'lucide-react';
import IconButton from '@/app/components/IconButton';
import { childQuizService } from '@/app/services/childReadingService';
import type { ChildQuiz, ChildQuizResult, QuizAnswerResult } from '@/app/types/childReading';
import Frog from '@/app/components/brand/Frog';

const pct = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v)}%`);

/**
 * Câu đố sau khi đọc: từng câu một, bé có thể bỏ qua; backend chỉ khen hoặc gợi ý, không lộ đáp án.
 * Mỗi câu chỉ trả lời một lần trong một lượt: backend mở lượt mới khi một câu được trả lời lại.
 */
export default function KidQuiz({ token, sessionId, onDone }: { token: string; sessionId: number; onDone: (exp: number, badges: string[]) => void }) {
  const [quiz, setQuiz] = useState<ChildQuiz | null>(null);
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState<QuizAnswerResult | null>(null);
  const [result, setResult] = useState<ChildQuizResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const gained = useRef({ exp: 0, badges: [] as string[] });

  useEffect(() => {
    const controller = new AbortController();
    void childQuizService.get(token, sessionId, controller.signal).then(r => {
      if (controller.signal.aborted) return;
      if (r.success && r.data) setQuiz(r.data); else setNote(r.message);
    });
    return () => controller.abort();
  }, [token, sessionId]);

  const finish = async () => {
    setBusy(true);
    const r = await childQuizService.result(token, sessionId);
    setBusy(false);
    if (r.success && r.data) setResult(r.data); else setNote(r.message);
    onDone(gained.current.exp, gained.current.badges);
  };
  const next = () => {
    setAnswer(null); setText(''); setNote('');
    if (quiz && index < quiz.questions.length - 1) setIndex(index + 1); else void finish();
  };
  const send = async (value: string) => {
    if (busy || !quiz || !value.trim()) return;
    setBusy(true); setNote('');
    const r = await childQuizService.answer(token, sessionId, quiz.questions[index].quizItemId, value.trim());
    setBusy(false);
    if (!r.success || !r.data) { setNote(r.message); return; }
    gained.current = { exp: gained.current.exp + r.data.expGained, badges: [...gained.current.badges, ...r.data.newBadges] };
    setAnswer(r.data);
  };
  const restart = () => { setResult(null); setIndex(0); setAnswer(null); setText(''); gained.current = { exp: 0, badges: [] }; };

  if (!quiz) return <section className="kid-quiz">{note ? <p className="notice" role="status">{note}</p> : <p role="status">Đang mở câu đố…</p>}</section>;
  if (!quiz.questions.length) return <section className="kid-quiz"><p>Truyện này chưa có câu đố.</p></section>;
  if (result) return <section className="kid-quiz kid-story-finish">
    <Frog mood="happy" size={80} />
    <h3 className="display">Em trả lời đúng {result.correct}/{result.totalQuestions} câu</h3>
    {result.answered < result.totalQuestions && <p>Em đã bỏ qua {result.totalQuestions - result.answered} câu.</p>}
    <p>Lần này: {pct(result.currentPercent)} · Tốt nhất: {pct(result.bestPercent)}</p>
    <IconButton icon={RotateCcw} label="Làm lại câu đố" iconClassName="" className="kid-soft-button" disabled={busy} onClick={restart} />
  </section>;

  const q = quiz.questions[index];
  return <section className="kid-quiz">
    <p className="kid-overline">CÂU {index + 1}/{quiz.questions.length}{quiz.bestPercent != null ? ` · TỐT NHẤT ${pct(quiz.bestPercent)}` : ''}</p>
    <h3 className="display">{q.question}</h3>
    {note && <p className="notice" role="status">{note}</p>}
    {!answer && (q.choices.length
      ? <div className="kid-quiz-choices">{q.choices.map((c, i) => <button key={c} className="kid-choice" disabled={busy} onClick={() => void send(c)}><span className="kid-choice-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span><span className="kid-choice-text">{c}</span></button>)}</div>
      : <form className="row" onSubmit={e => { e.preventDefault(); void send(text); }}>
        <input className="inp" aria-label="Câu trả lời của em" maxLength={200} value={text} onChange={e => setText(e.target.value)} />
        <IconButton icon={Check} label="Trả lời" type="submit" iconClassName="" className="kid-soft-button" disabled={busy || !text.trim()} />
      </form>)}
    {answer && <div className={`kid-quiz-feedback ${answer.isCorrect ? 'ok' : 'try'}`} role="status">
      <Frog mood={answer.isCorrect ? 'happy' : 'think'} size={56} />
      <p>{answer.feedback || (answer.isCorrect ? 'Đúng rồi!' : 'Mình thử nghĩ lại nhé.')}{answer.expGained > 0 ? ` +${answer.expGained} EXP` : ''}</p>
    </div>}
    <div className="kid-quiz-footer">
      {index < quiz.questions.length - 1
        ? <button type="button" className={answer ? 'kid-listen-primary' : 'kid-soft-button'} disabled={busy} onClick={next}>{answer ? <>Câu tiếp<ChevronRight aria-hidden="true" /></> : <><SkipForward aria-hidden="true" />Bỏ qua câu này</>}</button>
        : <button type="button" className={answer ? 'kid-listen-primary' : 'kid-soft-button'} disabled={busy} onClick={next}><Flag aria-hidden="true" />{answer ? 'Xem kết quả' : 'Bỏ qua và xem kết quả'}</button>}
    </div>
  </section>;
}
