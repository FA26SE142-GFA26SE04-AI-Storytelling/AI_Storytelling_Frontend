'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Library, Puzzle, X } from 'lucide-react';
import { useSwap } from '@/app/lib/motion';
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

/** Hai trang trong popup sau khi đọc: cảm nhận, kể lại + câu đố. */
const PAGES = 2;

/**
 * Sau khi bé đọc xong (trong popup): một thẻ gọn vừa một màn, nội dung dài thì cuộn trong thẻ.
 * Trên là lời chúc + phần thưởng, giữa lật trang: cảm nhận → kể lại + câu đố, dưới là thanh lật trang.
 * Các trang chỉ ẩn đi (không gỡ) để lật qua lại không mất bản ghi hay bước đang làm.
 */
export default function KidAfterReading({ token, completed, scenes = [], onLibrary, children }: { token: string; completed: ReadingCompleted; scenes?: ReadingScene[]; onLibrary?: () => void; children?: React.ReactNode }) {
  const [quiz, setQuiz] = useState(false);
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const swap = useSwap<HTMLDivElement>(page, dir);
  const go = (p: number) => { setDir(p > page ? 1 : -1); setPage(p); };
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

  return <div className="kid-finish-card kid-after-card">
    <div className="kid-after-intro">
      {children}
      {(exp > 0 || newBadges.length > 0) && <p className="kid-reward-line display" role="status">
        {exp > 0 && <>Em nhận được <b>+{exp} EXP</b>. </>}
        {newBadges.length > 0 && <>Huy hiệu mới: <b>{newBadges.join(', ')}</b>!</>}
      </p>}
      {completed.roadmapStepCompleted && <p>Em đã đi thêm một bước trong hành trình đọc!</p>}
    </div>
    <div className="kid-after-page" ref={swap}>
      <div hidden={page !== 0}><KidReflection token={token} sessionId={completed.sessionId} scenes={scenes} /></div>
      <div hidden={page !== 1}>
        <KidSummary token={token} sessionId={completed.sessionId} scenes={scenes} />
        <button type="button" className="kid-btn3d is-gold kid-quiz-open" onClick={() => setQuiz(true)}><Puzzle aria-hidden="true" />Làm câu đố về truyện</button>
      </div>
    </div>
    <nav className="kid-story-navigation kid-after-nav" aria-label="Trang sau khi đọc">
      <button type="button" className="kid-side-nav kid-btn3d is-sky" aria-label="Phần trước" title="Phần trước" disabled={page === 0} onClick={() => go(page - 1)}><ChevronLeft aria-hidden="true" /></button>
      <span className="kid-scene-count">{page + 1}/{PAGES}</span>
      <button type="button" className="kid-side-nav kid-btn3d is-sky" aria-label="Phần sau" title="Phần sau" disabled={page === PAGES - 1} onClick={() => go(page + 1)}><ChevronRight aria-hidden="true" /></button>
      {onLibrary && <button type="button" className="kid-btn3d is-gold" onClick={onLibrary}><Library aria-hidden="true" />Về thư viện</button>}
    </nav>
    {quiz && <QuizPopup onClose={() => setQuiz(false)}>
      <KidQuiz token={token} sessionId={completed.sessionId} onLibrary={onLibrary} onDone={(gained, codes) => { setExp(v => v + gained); setBadgeCodes(v => [...v, ...codes]); }} />
    </QuizPopup>}
  </div>;
}
