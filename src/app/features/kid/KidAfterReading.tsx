'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Library, Puzzle, X } from 'lucide-react';
import { useSwap } from '@/app/lib/motion';
import { childQuizService, childRewardsService } from '@/app/services/childReadingService';
import type { ChildBadge, ReadingCompleted, ReadingScene } from '@/app/types/childReading';
import KidQuiz from './KidQuiz';
import KidReflection from './KidReflection';
import KidSummary from './KidSummary';
import { useDialog } from './useDialog';
import { FEATURE_OFF_MESSAGE, KID_FEATURE, useKidFeature } from './kidFeatures';

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

/** 7 trang trong popup sau khi đọc: cảm nhận 4 trang, ghi âm, thắc mắc, câu đố. */
const PAGES = 7;
const TITLES = [
  'Em thấy truyện này thế nào?',
  'Truyện làm em cảm thấy gì?',
  'Tranh em thích nhất',
  'Điều gì em thích ở tranh này?',
  'Em kể lại cho bố mẹ nghe nhé',
  'Chỗ nào em còn thắc mắc?',
  'Câu đố về truyện',
];

/**
 * Sau khi bé đọc xong (trong popup): một thẻ gọn vừa một màn, nội dung dài thì cuộn trong thẻ.
 * Trên là phần thưởng (nếu có), giữa là 7 trang (cảm nhận 4 trang → kể lại → thắc mắc → câu đố), dưới là thanh điều hướng có chấm tiến độ.
 * Các trang chỉ ẩn đi (không gỡ) để lật qua lại không mất bản ghi hay bước đang làm.
 */
export default function KidAfterReading({ token, completed, scenes = [], onLibrary }: { token: string; completed: ReadingCompleted; scenes?: ReadingScene[]; onLibrary?: () => void }) {
  const quizOn = useKidFeature(KID_FEATURE.quiz);
  const reflectionOn = useKidFeature(KID_FEATURE.reflection);
  const voiceOn = useKidFeature(KID_FEATURE.voice);
  const [quiz, setQuiz] = useState(false);
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const touched = useRef(false);
  const swap = useSwap<HTMLDivElement>(page, dir);
  const go = (p: number) => { setDir(p > page ? 1 : -1); setPage(p); };
  const userGo = (p: number) => { touched.current = true; go(p); };
  const onNext = () => userGo(page + 1);
  const onGoto = userGo;
  const onResume = useCallback((p: number) => { if (!touched.current) { setDir(1); setPage(p); } }, []);
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

  // Truyện không có câu đố (API trả danh sách câu rỗng) thì bỏ trang câu đố ở cuối.
  const [hasQuiz, setHasQuiz] = useState(true);
  useEffect(() => {
    if (!quizOn) return;
    const controller = new AbortController();
    void childQuizService.get(token, completed.sessionId, controller.signal).then(r => {
      if (controller.signal.aborted || !r.success || !r.data || r.data.questions.length) return;
      setHasQuiz(false); setPage(p => Math.min(p, PAGES - 2));
    });
    return () => controller.abort();
  }, [quizOn, token, completed.sessionId]);
  const pages = hasQuiz ? PAGES : PAGES - 1;

  return <div className="kid-finish-card kid-after-card">
    {(exp > 0 || newBadges.length > 0 || completed.roadmapStepCompleted) && <div className="kid-after-intro">
      {(exp > 0 || newBadges.length > 0) && <p className="kid-reward-line display" role="status">
        {exp > 0 && <>Em nhận được <b>+{exp} EXP</b>. </>}
        {newBadges.length > 0 && <>Huy hiệu mới: <b>{newBadges.join(', ')}</b>!</>}
      </p>}
      {completed.roadmapStepCompleted && <p>Em đã đi thêm một bước trong hành trình đọc!</p>}
    </div>}
    <div className="kid-after-page" ref={swap}>
      <div hidden={page > 3}>
        <h3 className="display">{TITLES[Math.min(page, 3)]}</h3>
        {reflectionOn ? <KidReflection
          token={token}
          sessionId={completed.sessionId}
          scenes={scenes}
          step={Math.min(page, 3) as 0 | 1 | 2 | 3}
          onNext={onNext}
          onGoto={onGoto}
          onResume={onResume}
        /> : <p className="kid-after-off">{FEATURE_OFF_MESSAGE}</p>}
      </div>
      <div hidden={page !== 4}>
        <h3 className="display">{TITLES[4]}</h3>
        {voiceOn ? <KidSummary part="voice" token={token} sessionId={completed.sessionId} scenes={scenes} /> : <p className="kid-after-off">{FEATURE_OFF_MESSAGE}</p>}
      </div>
      <div hidden={page !== 5}>
        <KidSummary part="questions" token={token} sessionId={completed.sessionId} scenes={scenes} />
      </div>
      {hasQuiz && <div hidden={page !== 6}>
        <h3 className="display">{TITLES[6]}</h3>
        {quizOn ? <button type="button" className="kid-btn3d is-gold kid-quiz-open" onClick={() => setQuiz(true)}><Puzzle aria-hidden="true" />Làm câu đố về truyện</button> : <p className="kid-after-off">{FEATURE_OFF_MESSAGE}</p>}
      </div>}
    </div>
    <nav className="kid-story-navigation kid-after-nav" aria-label="Trang sau khi đọc">
      <button type="button" className="kid-side-nav kid-btn3d is-sky" aria-label="Phần trước" title="Phần trước" disabled={page === 0} onClick={() => userGo(page - 1)}><ChevronLeft aria-hidden="true" /></button>
      <ol className="kid-reflection-dots" aria-label={`Bước ${page + 1} trên ${pages}`}>
        {Array.from({ length: pages }, (_, i) => (
          <li key={i} className={i === page ? 'on' : i < page ? 'past' : ''} aria-current={i === page ? 'step' : undefined}>
            <span className="sr-only">{TITLES[i]}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="kid-side-nav kid-btn3d is-sky" aria-label="Phần sau" title="Phần sau" disabled={page === pages - 1} onClick={() => userGo(page + 1)}><ChevronRight aria-hidden="true" /></button>
      {onLibrary && <button type="button" className="kid-btn3d is-gold kid-after-lib" aria-label="Về thư viện" title="Về thư viện" onClick={onLibrary}><Library aria-hidden="true" /><span className="kid-after-lib-text">Về thư viện</span></button>}
    </nav>
    {quiz && quizOn && <QuizPopup onClose={() => setQuiz(false)}>
      <KidQuiz token={token} sessionId={completed.sessionId} onLibrary={onLibrary} onDone={(gained, codes) => { setExp(v => v + gained); setBadgeCodes(v => [...v, ...codes]); }} />
    </QuizPopup>}
  </div>;
}
