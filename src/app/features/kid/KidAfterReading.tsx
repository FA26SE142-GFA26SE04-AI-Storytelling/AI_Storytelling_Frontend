'use client';
import { useEffect, useState } from 'react';
import { Puzzle, X } from 'lucide-react';
import { childRewardsService } from '@/app/services/childReadingService';
import type { ChildBadge, ReadingCompleted, ReadingScene } from '@/app/types/childReading';
import KidQuiz from './KidQuiz';
import KidReflection from './KidReflection';
import KidSummary from './KidSummary';
import { useDialog } from './useDialog';

/** Câu đố hiện trong cửa sổ nổi giữa màn hình: đóng bằng nút X, Esc hoặc bấm ra ngoài. */
function QuizPopup({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = useDialog<HTMLDivElement>(onClose);
  return <div className="kid-quiz-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="kid-quiz-modal" role="dialog" aria-modal="true" aria-label="Câu đố về truyện" ref={ref} tabIndex={-1}>
      <button type="button" className="kid-btn3d is-pink kid-btn-icon kid-quiz-close" aria-label="Đóng câu đố" onClick={onClose}><X aria-hidden="true" /></button>
      {children}
    </div>
  </div>;
}

/** Sau khi bé đọc xong: phần thưởng vừa nhận, thẻ cảm nhận (mức thích, cảm xúc, cảnh, lời), kể lại và câu đố. */
export default function KidAfterReading({ token, completed, scenes = [], onLibrary }: { token: string; completed: ReadingCompleted; scenes?: ReadingScene[]; onLibrary?: () => void }) {
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

  const newBadges = badgeCodes.map(code => badges.find(b => b.code === code)?.name ?? code);

  return <div className="kid-after">
    {(exp > 0 || newBadges.length > 0) && <p className="kid-reward-line display" role="status">
      {exp > 0 && <>Em nhận được <b>+{exp} EXP</b>. </>}
      {newBadges.length > 0 && <>Huy hiệu mới: <b>{newBadges.join(', ')}</b>!</>}
    </p>}
    {completed.roadmapStepCompleted && <p>Em đã đi thêm một bước trong hành trình đọc!</p>}
    <KidReflection token={token} sessionId={completed.sessionId} scenes={scenes} />
    <KidSummary token={token} sessionId={completed.sessionId} scenes={scenes} />
    <button type="button" className="kid-btn3d is-gold kid-quiz-open" onClick={() => setQuiz(true)}><Puzzle aria-hidden="true" />Làm câu đố về truyện</button>
    {quiz && <QuizPopup onClose={() => setQuiz(false)}>
      <KidQuiz token={token} sessionId={completed.sessionId} onLibrary={onLibrary} onDone={(gained, codes) => { setExp(v => v + gained); setBadgeCodes(v => [...v, ...codes]); }} />
    </QuizPopup>}
  </div>;
}
