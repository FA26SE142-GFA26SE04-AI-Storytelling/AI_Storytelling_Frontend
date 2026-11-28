'use client';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Check, RotateCcw, SkipForward, Volume2 } from 'lucide-react';
import Frog from '@/app/components/brand/Frog';
import SafeImage from '@/app/components/SafeImage';
import type { ListeningAttemptRequest, ListeningAttemptResult, ReadingInteraction } from '@/app/types/childReading';
import { shuffle } from '@/app/lib/shuffle';
import { useDialog } from './useDialog';

/** Câu trả lời ngắn của bé tối đa 100 ký tự (giới hạn của backend). */
const ANSWER_MAX = 100;

type Props = {
  interaction: ReadingInteraction;
  busy: boolean;
  /** Gửi câu trả lời; trả về kết quả của backend, hoặc null khi gửi không được. */
  onSubmit: (body: ListeningAttemptRequest) => Promise<ListeningAttemptResult | null>;
  /** Bé đã xong (hoặc bỏ qua): đóng cửa sổ và đi tiếp. resume = true khi bé bấm "Đọc tiếp" hoặc "Để sau": giọng kể phát tiếp; đóng hộp (Esc) thì false. */
  onContinue: (resume: boolean) => void;
  /** Bé muốn nghe lại một cảnh (số thứ tự cảnh, bắt đầu từ 0). */
  onReplay: (sceneIndex: number) => void;
};

export default function KidInteraction({ interaction: q, busy, onSubmit, onContinue, onReplay }: Props) {
  const player = useRef<HTMLAudioElement | null>(null);
  /** Cửa sổ đã đóng: không phát thêm tiếng nào, kể cả phản hồi backend trả về sau khi bé bỏ qua. */
  const closed = useRef(false);
  /** Mỗi lần phát mới tăng số này để chuỗi đọc đang chạy tự dừng. */
  const run = useRef(0);
  /** Thẻ đáp án đang được đọc, để tô sáng cho bé biết giọng đang đọc thẻ nào. */
  const [reading, setReading] = useState<number | null>(null);
  const stop = () => { run.current++; player.current?.pause(); player.current = null; setReading(null); };
  /** Tắt tiếng ngay khi bé đi tiếp, bỏ qua, nghe lại cảnh hoặc đóng hộp. */
  const leave = (next: () => void) => { closed.current = true; stop(); next(); };
  const ref = useDialog<HTMLDivElement>(() => leave(() => onContinue(false)));
  const [result, setResult] = useState<ListeningAttemptResult | null>(null);
  const [answer, setAnswer] = useState('');
  const [order, setOrder] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);

  // Xáo trộn một lần mỗi khi mở câu hỏi (component được gắn key theo câu), để bé không học thuộc vị trí.
  const [options] = useState(() => shuffle(q.options));

  // Câu hỏi (Checkpoint, PicturePrediction) hoặc câu hướng dẫn (RolePlay, FillBlank, EventOrdering) cho bé chưa biết chữ.
  const question = q.prompt || q.instruction;
  const questionAudio = q.audioUrls?.prompt ?? q.audioUrls?.instruction ?? null;

  /** Đọc lần lượt từng đoạn; bé bấm thứ khác hoặc đóng hộp thì chuỗi dừng. Trình duyệt chặn tự phát thì thôi, bé bấm nút loa. */
  const playClips = (clips: { url?: string | null; optionId?: number }[]) => {
    stop();
    if (closed.current) return;
    const mine = run.current;
    const list = clips.filter(c => !!c.url);
    const next = (i: number) => {
      if (closed.current || mine !== run.current) return;
      const clip = list[i];
      if (!clip) { setReading(null); return; }
      const audio = new Audio(clip.url!);
      player.current = audio;
      setReading(clip.optionId ?? null);
      audio.onended = () => next(i + 1);
      audio.onerror = () => next(i + 1);
      void audio.play().catch(() => { if (mine === run.current) { run.current++; setReading(null); } });
    };
    next(0);
  };
  const play = (url?: string | null) => playClips([{ url }]);
  /** Câu hỏi rồi tới từng đáp án theo thứ tự đang hiện trên màn hình. */
  const readAll = () => playClips([{ url: questionAudio }, ...options.map(o => ({ url: o.audioUrl, optionId: o.id }))]);
  const readOnOpen = useEffectEvent(readAll);
  // Mở câu hỏi thì tự đọc; gỡ cửa sổ thì dừng mọi tiếng còn đang phát.
  useEffect(() => {
    closed.current = false;
    readOnOpen();
    // closed = true cũng làm chuỗi đọc đang chạy tự dừng.
    return () => { closed.current = true; player.current?.pause(); player.current = null; };
  }, []);
  const send = async (body: ListeningAttemptRequest) => {
    const r = await onSubmit(body);
    if (!r || closed.current) return;
    setResult(r);
    play(r.feedbackAudioUrl);
  };
  /** Nút loa trên thẻ: chỉ đọc lại đáp án, không chọn. */
  const listen = (o: { id: number; text: string; audioUrl: string | null }, label: string) => o.audioUrl &&
    <button type="button" className="kid-answer-listen" aria-label={`Nghe ${label}`} title={`Nghe ${label}`}
      onClick={() => playClips([{ url: o.audioUrl, optionId: o.id }])}><Volume2 aria-hidden="true" /></button>;
  const optionText = (id: number) => options.find(o => o.id === id)?.text ?? '';
  const pickFeedback = chosen != null ? options.find(o => o.id === chosen)?.feedback : null;
  // Đã trả lời xong thì chỉ còn nút đi tiếp; EventOrdering chưa khớp thì cho xếp lại hoặc nghe lại.
  const canRetry = result?.type === 'EventOrdering' && result.matched === false && !result.revealed;
  const finished = !!result && !canRetry;

  const body = () => {
    switch (q.type) {
      case 'Checkpoint':
      case 'PicturePrediction':
        return <div className={`kid-answer-grid${q.type === 'PicturePrediction' ? ' pics' : ''}`}>
          {options.map((o, i) => <div key={o.id} className="kid-answer-cell">
            <button type="button" className={`kid-answer${q.type === 'PicturePrediction' ? ' pic' : ''}`} aria-pressed={chosen === o.id} data-reading={reading === o.id || undefined} disabled={busy || !!result}
              onClick={() => { setChosen(o.id); void send({ optionId: o.id }); }}>
              {q.type === 'PicturePrediction' && <SafeImage src={o.imageUrl} alt="" />}
              <span className="kid-answer-body"><span className="kid-answer-mark" aria-hidden="true">{String.fromCharCode(65 + i)}</span><span className="kid-answer-text">{o.text}</span></span>
            </button>
            {listen(o, `đáp án ${String.fromCharCode(65 + i)}`)}
          </div>)}
        </div>;
      case 'RolePlay':
        return <div className="kid-roleplay">
          <b>{q.characterName}</b>
          <p className="kid-roleplay-line">“{q.modelSentence}”</p>
          <button type="button" className="kid-btn3d is-sky" disabled={!q.modelAudioUrl} onClick={() => play(q.modelAudioUrl)}><Volume2 aria-hidden="true" />Nghe mẫu</button>
          {!result && <button type="button" className="kid-btn3d is-gold" disabled={busy} onClick={() => void send({})}><Check aria-hidden="true" />Em nói xong rồi</button>}
        </div>;
      case 'FillBlank':
        return <div className="kid-fill">
          <p className="kid-roleplay-line">{q.maskedSentence}</p>
          {/* Backend đọc nguyên câu ngắn (audioUrls.text) để bé nghe lại rồi điền; thiếu audio thì backend đã ẩn bài. */}
          <button type="button" className="kid-btn3d is-sky" disabled={!q.audioUrls?.text} onClick={() => play(q.audioUrls?.text)}><Volume2 aria-hidden="true" />Nghe câu</button>
          {q.hint && <p className="kid-hint">Gợi ý: {q.hint}</p>}
          {q.hint && q.audioUrls?.hint && <button type="button" className="kid-btn3d is-sky" onClick={() => play(q.audioUrls.hint)}><Volume2 aria-hidden="true" />Nghe gợi ý</button>}
          {!result && <>
            <input className="inp" aria-label="Chữ em điền" maxLength={ANSWER_MAX} value={answer} onChange={e => setAnswer(e.target.value)} />
            <button type="button" className="kid-btn3d is-gold" disabled={busy || !answer.trim()} onClick={() => void send({ answer: answer.trim() })}><Check aria-hidden="true" />Xong</button>
          </>}
        </div>;
      case 'EventOrdering': {
        // Backend gắn tranh minh hoạ của đoạn có sự kiện; có thẻ nào có tranh thì mọi thẻ cùng khung tranh (thiếu tranh hiện ảnh mặc định).
        const pics = options.some(o => o.imageUrl);
        return <div className="kid-order">
          <div className={`kid-answer-grid${pics ? ' pics' : ''}`}>
            {options.map((o, i) => {
              const at = order.indexOf(o.id);
              return <div key={o.id} className="kid-answer-cell">
                <button type="button" className={`kid-answer${pics ? ' pic' : ''}`} aria-pressed={at >= 0} data-reading={reading === o.id || undefined} disabled={busy || finished}
                  onClick={() => { setResult(null); setOrder(v => at >= 0 ? v.filter(x => x !== o.id) : [...v, o.id]); }}>
                  {pics && <SafeImage src={o.imageUrl} alt="" />}
                  <span className="kid-answer-body"><span className={`kid-answer-mark${at >= 0 ? ' on' : ''}`} aria-hidden="true">{at >= 0 ? at + 1 : ''}</span><span className="kid-answer-text">{o.text}</span></span>
                </button>
                {listen(o, `thẻ ${i + 1}`)}
              </div>;
            })}
          </div>
          {!result && <div className="kid-actions">
            <button type="button" className="kid-btn3d is-sky" disabled={!order.length || busy} onClick={() => setOrder([])}><RotateCcw aria-hidden="true" />Xếp lại</button>
            <button type="button" className="kid-btn3d is-gold" disabled={busy || order.length !== options.length} onClick={() => void send({ orderedOptionIds: order })}><Check aria-hidden="true" />Xong</button>
          </div>}
        </div>;
      }
      default:
        return null;
    }
  };

  return <div className="kid-quiz-backdrop">
    <div className="kid-quiz-modal kid-interaction" role="dialog" aria-modal="true" aria-label="Cùng chơi nhé" ref={ref} tabIndex={-1}>
      <Frog mood={result ? 'happy' : 'idle'} size={72} />
      {question && <h2 className="display">{question}</h2>}
      {(questionAudio || options.some(o => o.audioUrl)) && <button type="button" className="kid-btn3d is-sky" onClick={readAll}><Volume2 aria-hidden="true" />{questionAudio ? 'Nghe câu hỏi' : 'Nghe các thẻ'}</button>}
      {body()}
      {result && <div className="kid-feedback" role="status">
        <p>{result.feedback || pickFeedback || 'Em làm tốt lắm!'}</p>
        {result.suggestedAnswer && <p className="kid-hint">Chữ cần điền là: <b>{result.suggestedAnswer}</b></p>}
        {result.revealed && result.correctOrderOptionIds && <ol className="kid-order-answer">{result.correctOrderOptionIds.map(id => <li key={id}>{optionText(id)}</li>)}</ol>}
        {canRetry && <div className="kid-actions">
          {result.replaySceneIndexes.map(i => <button key={i} type="button" className="kid-btn3d is-sky" onClick={() => leave(() => onReplay(i))}><Volume2 aria-hidden="true" />Nghe lại cảnh {i + 1}</button>)}
          <button type="button" className="kid-btn3d is-sky" onClick={() => { setResult(null); setOrder([]); }}><RotateCcw aria-hidden="true" />Xếp lại</button>
        </div>}
      </div>}
      <div className="kid-actions">
        {finished && <button type="button" className="kid-btn3d is-gold" onClick={() => leave(() => onContinue(true))}><Check aria-hidden="true" />Đọc tiếp</button>}
        {!finished && <button type="button" className="kid-btn3d is-sky" disabled={busy} onClick={() => leave(() => onContinue(true))}><SkipForward aria-hidden="true" />Để sau</button>}
      </div>
    </div>
  </div>;
}
