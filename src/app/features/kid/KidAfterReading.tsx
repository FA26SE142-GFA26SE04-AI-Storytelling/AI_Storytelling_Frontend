'use client';
import { useEffect, useState } from 'react';
import { Puzzle } from 'lucide-react';
import { childReadingService, childRewardsService } from '@/app/services/childReadingService';
import type { ChildBadge, ReadingCompleted, ReadingFeeling } from '@/app/types/childReading';
import KidQuiz from './KidQuiz';

const FEELINGS: { id: ReadingFeeling; label: string; face: string }[] = [
  { id: 'VeryLike', label: 'Rất thích', face: '😍' },
  { id: 'Like', label: 'Thích', face: '🙂' },
  { id: 'Neutral', label: 'Bình thường', face: '😐' },
  { id: 'Dislike', label: 'Chưa thích', face: '🙁' },
];

/** Sau khi bé đọc xong: phần thưởng vừa nhận, chọn cảm nhận và làm câu đố. */
export default function KidAfterReading({ token, completed }: { token: string; completed: ReadingCompleted }) {
  const [feeling, setFeeling] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [quiz, setQuiz] = useState(false);
  const [exp, setExp] = useState(completed.expGained);
  const [badgeCodes, setBadgeCodes] = useState<string[]>(completed.newBadges);
  const [badges, setBadges] = useState<ChildBadge[]>([]);

  // Chỉ có mã huy hiệu trong kết quả: lấy tên từ bảng phần thưởng của bé.
  useEffect(() => {
    if (!badgeCodes.length) return;
    const controller = new AbortController();
    void childRewardsService.get(token, controller.signal).then(r => { if (!controller.signal.aborted && r.success) setBadges(r.data?.badges ?? []); });
    return () => controller.abort();
  }, [token, badgeCodes.length]);

  const choose = async (value: ReadingFeeling) => {
    if (busy) return;
    setBusy(true); setNote('');
    const r = await childReadingService.feeling(token, completed.sessionId, value);
    setBusy(false);
    if (r.success && r.data) setFeeling(r.data.feeling); else setNote(r.message);
  };
  const newBadges = badgeCodes.map(code => badges.find(b => b.code === code)?.name ?? code);

  return <div className="kid-after">
    {(exp > 0 || newBadges.length > 0) && <p className="kid-reward-line" role="status">
      {exp > 0 && <>Em nhận được <b>+{exp} EXP</b>. </>}
      {newBadges.length > 0 && <>Huy hiệu mới: <b>{newBadges.join(', ')}</b>!</>}
    </p>}
    {completed.roadmapStepCompleted && <p>Em đã đi thêm một bước trong hành trình đọc!</p>}
    <section aria-label="Em thấy truyện thế nào?">
      <h3 className="display">Em thấy truyện này thế nào?</h3>
      <div className="kid-feelings">{FEELINGS.map(f => <button key={f.id} className="kid-soft-button" aria-pressed={feeling === f.id} disabled={busy} onClick={() => void choose(f.id)}>
        <span aria-hidden="true" style={{ fontSize: 26 }}>{f.face}</span>{f.label}
      </button>)}</div>
      {feeling && <p className="sub">Cảm ơn em đã chia sẻ, bố mẹ sẽ biết em {FEELINGS.find(f => f.id === feeling)?.label.toLowerCase()} truyện này.</p>}
      {note && <p className="notice" role="status">{note}</p>}
    </section>
    {quiz
      ? <KidQuiz token={token} sessionId={completed.sessionId} onDone={(gained, codes) => { setExp(v => v + gained); setBadgeCodes(v => [...v, ...codes]); }} />
      : <button className="kid-soft-button" onClick={() => setQuiz(true)}><Puzzle aria-hidden="true" />Làm câu đố về truyện</button>}
  </div>;
}
