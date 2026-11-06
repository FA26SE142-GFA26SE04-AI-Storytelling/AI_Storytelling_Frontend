'use client';
import { useRef, useState } from 'react';
import { Check, RotateCcw, SkipForward, Volume2 } from 'lucide-react';
import Frog from '@/app/components/brand/Frog';
import SafeImage from '@/app/components/SafeImage';
import type { ListeningAttemptRequest, ListeningAttemptResult, ReadingInteraction } from '@/app/types/childReading';
import { useDialog } from './useDialog';

/** Câu trả lời ngắn của bé tối đa 100 ký tự (giới hạn của backend). */
const ANSWER_MAX = 100;

type Props = {
  interaction: ReadingInteraction;
  busy: boolean;
  /** Gửi câu trả lời; trả về kết quả của backend, hoặc null khi gửi không được. */
  onSubmit: (body: ListeningAttemptRequest) => Promise<ListeningAttemptResult | null>;
  /** Bé đã xong (hoặc bỏ qua): đóng cửa sổ và đi tiếp. */
  onContinue: () => void;
  /** Bé muốn nghe lại một cảnh (số thứ tự cảnh, bắt đầu từ 0). */
  onReplay: (sceneIndex: number) => void;
};

export default function KidInteraction({ interaction: q, busy, onSubmit, onContinue, onReplay }: Props) {
  const ref = useDialog<HTMLDivElement>(onContinue);
  const player = useRef<HTMLAudioElement | null>(null);
  const [result, setResult] = useState<ListeningAttemptResult | null>(null);
  const [answer, setAnswer] = useState('');
  const [order, setOrder] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);

  const play = (url?: string | null) => {
    if (!url) return;
    player.current?.pause();
    player.current = new Audio(url);
    void player.current.play().catch(() => {});
  };
  const send = async (body: ListeningAttemptRequest) => {
    const r = await onSubmit(body);
    if (!r) return;
    setResult(r);
    play(r.feedbackAudioUrl);
  };

  const options = q.options;
  const optionText = (id: number) => options.find(o => o.id === id)?.text ?? '';
  const pickFeedback = chosen != null ? options.find(o => o.id === chosen)?.feedback : null;
  // Đã trả lời xong thì chỉ còn nút đi tiếp; EventOrdering chưa khớp thì cho xếp lại hoặc nghe lại.
  const canRetry = result?.type === 'EventOrdering' && result.matched === false && !result.revealed;
  const finished = !!result && !canRetry;

  const body = () => {
    switch (q.type) {
      case 'Checkpoint':
      case 'PicturePrediction':
        return <div className={`kid-pick-grid${q.type === 'PicturePrediction' ? ' pics' : ''}`}>
          {options.map((o, i) => <button key={o.id} type="button" className={`kid-pick${q.type === 'PicturePrediction' ? ' pic' : ''}`} aria-pressed={chosen === o.id} disabled={busy || !!result}
            onClick={() => { setChosen(o.id); play(o.audioUrl); void send({ optionId: o.id }); }}>
            {q.type === 'PicturePrediction' && <SafeImage src={o.imageUrl} alt="" />}
            <span className="kid-pick-body"><span className="kid-pick-mark" aria-hidden="true">{String.fromCharCode(65 + i)}</span><span className="kid-pick-text">{o.text}</span></span>
          </button>)}
        </div>;
      case 'RolePlay':
        return <div className="kid-roleplay">
          <b>{q.characterName}</b>
          <p className="kid-roleplay-line">“{q.modelSentence}”</p>
          <button type="button" className="kid-soft-button" disabled={!q.modelAudioUrl} onClick={() => play(q.modelAudioUrl)}><Volume2 aria-hidden="true" />Nghe mẫu</button>
          {!result && <button type="button" className="kid-listen-primary" disabled={busy} onClick={() => void send({})}><Check aria-hidden="true" />Em nói xong rồi</button>}
        </div>;
      case 'FillBlank':
        return <div className="kid-fill">
          <p className="kid-roleplay-line">{q.maskedSentence}</p>
          {q.hint && <p className="kid-hint">Gợi ý: {q.hint}</p>}
          {!result && <>
            <input className="inp" aria-label="Chữ em điền" maxLength={ANSWER_MAX} value={answer} onChange={e => setAnswer(e.target.value)} />
            <button type="button" className="kid-listen-primary" disabled={busy || !answer.trim()} onClick={() => void send({ answer: answer.trim() })}><Check aria-hidden="true" />Xong</button>
          </>}
        </div>;
      case 'EventOrdering':
        return <div className="kid-order">
          <div className="kid-pick-grid">
            {options.map(o => {
              const at = order.indexOf(o.id);
              return <button key={o.id} type="button" className="kid-pick" aria-pressed={at >= 0} disabled={busy || finished}
                onClick={() => { setResult(null); setOrder(v => at >= 0 ? v.filter(x => x !== o.id) : [...v, o.id]); }}>
                <span className="kid-pick-body"><span className={`kid-pick-mark${at >= 0 ? ' on' : ''}`} aria-hidden="true">{at >= 0 ? at + 1 : ''}</span><span className="kid-pick-text">{o.text}</span></span>
              </button>;
            })}
          </div>
          {!result && <div className="kid-actions">
            <button type="button" className="kid-soft-button" disabled={!order.length || busy} onClick={() => setOrder([])}><RotateCcw aria-hidden="true" />Xếp lại</button>
            <button type="button" className="kid-listen-primary" disabled={busy || order.length !== options.length} onClick={() => void send({ orderedOptionIds: order })}><Check aria-hidden="true" />Xong</button>
          </div>}
        </div>;
      default:
        return null;
    }
  };

  return <div className="kid-quiz-backdrop">
    <div className="kid-quiz-modal kid-interaction" role="dialog" aria-modal="true" aria-label="Cùng chơi nhé" ref={ref} tabIndex={-1}>
      <Frog mood={result ? 'happy' : 'idle'} size={72} />
      {q.prompt && <h2 className="display">{q.prompt}</h2>}
      {body()}
      {result && <div className="kid-feedback" role="status">
        <p>{result.feedback || pickFeedback || 'Em làm tốt lắm!'}</p>
        {result.suggestedAnswer && <p className="kid-hint">Chữ cần điền là: <b>{result.suggestedAnswer}</b></p>}
        {result.revealed && result.correctOrderOptionIds && <ol className="kid-order-answer">{result.correctOrderOptionIds.map(id => <li key={id}>{optionText(id)}</li>)}</ol>}
        {canRetry && <div className="kid-actions">
          {result.replaySceneIndexes.map(i => <button key={i} type="button" className="kid-soft-button" onClick={() => onReplay(i)}><Volume2 aria-hidden="true" />Nghe lại cảnh {i + 1}</button>)}
          <button type="button" className="kid-soft-button" onClick={() => { setResult(null); setOrder([]); }}><RotateCcw aria-hidden="true" />Xếp lại</button>
        </div>}
      </div>}
      <div className="kid-actions">
        {finished && <button type="button" className="kid-listen-primary" onClick={onContinue}><Check aria-hidden="true" />Đọc tiếp</button>}
        {!finished && <button type="button" className="kid-soft-button" disabled={busy} onClick={onContinue}><SkipForward aria-hidden="true" />Để sau</button>}
      </div>
    </div>
  </div>;
}
