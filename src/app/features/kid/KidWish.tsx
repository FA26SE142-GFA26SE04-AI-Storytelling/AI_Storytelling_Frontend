'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Lightbulb, MapPin, Mountain, Send, SkipForward, Sparkles, UserRound, UsersRound, X, type LucideIcon } from 'lucide-react';
import { childWishService } from '@/app/services/storyWishService';
import type { ReadingStart } from '@/app/types/childReading';
import type { ChildWishCardDto, ChildWishDto, WishCardGroup, WishDraftDto } from '@/app/types/storyWish';
import Frog from '@/app/components/brand/Frog';
import IconButton from '@/app/components/IconButton';

const STEPS: { group: WishCardGroup; question: string; optional: boolean; icon: LucideIcon }[] = [
  { group: 'Character', question: 'Ai là nhân vật chính?', optional: false, icon: UserRound },
  { group: 'Place', question: 'Câu chuyện diễn ra ở đâu?', optional: false, icon: MapPin },
  { group: 'Challenge', question: 'Nhân vật gặp thử thách gì?', optional: true, icon: Mountain },
  { group: 'Lesson', question: 'Em muốn học điều gì?', optional: true, icon: Lightbulb },
];

const playAudio = (url: string | null) => {
  if (!url) return;
  try { void new Audio(url).play().catch(() => undefined); } catch { /* trình duyệt chặn phát âm thanh */ }
};

/** Bé ước một câu chuyện: chọn thẻ nhân vật, nơi chốn (bắt buộc), thử thách và bài học rồi gửi cho bố mẹ. */
export default function KidWish({ token, busy, onRead }: { token: string; busy: boolean; onRead: (target: ReadingStart) => void }) {
  const [wishes, setWishes] = useState<ChildWishDto[] | null>(null);
  const [draft, setDraft] = useState<WishDraftDto | null>(null);
  const [step, setStep] = useState(0);
  const [cards, setCards] = useState<ChildWishCardDto[] | null>(null);
  const [working, setWorking] = useState(false);
  const [note, setNote] = useState('');
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    void childWishService.mine(token, controller.signal).then(r => {
      if (controller.signal.aborted) return;
      if (r.success) setWishes(r.data ?? []); else setNote(r.message);
    });
    return () => controller.abort();
  }, [token, revision]);

  const current = STEPS[step];
  useEffect(() => {
    if (!draft) return;
    const controller = new AbortController();
    setCards(null);
    void childWishService.cards(token, current.group, controller.signal).then(r => {
      if (controller.signal.aborted) return;
      if (r.success) setCards(r.data ?? []); else setNote(r.message);
    });
    return () => controller.abort();
  }, [token, draft?.wishId, current.group]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async <T,>(fn: () => Promise<{ success: boolean; message: string; data: T | null }>) => {
    if (lock.current) return null;
    lock.current = true; setWorking(true); setNote('');
    const r = await fn();
    lock.current = false; setWorking(false);
    if (!r.success) setNote(r.message);
    return r;
  };

  const start = async () => {
    const r = await act(() => childWishService.startDraft(token));
    if (r?.success && r.data) { setDraft(r.data); setStep(0); }
  };
  const pick = async (card: ChildWishCardDto | null, leaveToParent = false) => {
    if (card) playAudio(card.audioUrl);
    const r = await act(() => childWishService.selectCard(token, { group: current.group, cardId: card?.id ?? null, leaveToParent }));
    if (r?.success && r.data) { setDraft(r.data); if (step < STEPS.length - 1) setStep(step + 1); }
  };
  const submit = async () => {
    const r = await act(() => childWishService.submit(token));
    if (r?.success) { setDraft(null); setNote(r.message || 'Bố mẹ sẽ xem điều ước của em nhé!'); setRevision(v => v + 1); }
  };

  const chosen = draft?.cards.find(c => c.group === current.group);
  const disabled = working || busy;

  if (draft) return <section className="kid-wish">
    <div className="kid-wish-steps" aria-label="Các bước ước">{STEPS.map((s, i) => <IconButton key={s.group} icon={s.icon} label={`Bước ${i + 1}: ${s.question}`} iconClassName="" className="kid-soft-button" aria-pressed={i === step} disabled={disabled} onClick={() => setStep(i)} />)}</div>
    <h3 className="display">{current.question}{current.optional && <small> (không bắt buộc)</small>}</h3>
    {note && <p role="status" className="notice">{note}</p>}
    {!cards && <p role="status">Đang tải thẻ…</p>}
    {cards && !cards.length && <p>Chưa có thẻ nào cho bước này.</p>}
    <div className="kid-wish-cards">{cards?.map(c => <button key={c.id} className="kid-wish-card" aria-pressed={chosen?.id === c.id} disabled={disabled} onClick={() => void pick(c)}>
      {c.imageUrl && <img src={c.imageUrl} alt="" />}<span>{c.label}</span>
    </button>)}</div>
    <div className="kid-library-tabs">
      {step > 0 && <IconButton icon={ArrowLeft} label="Quay lại" iconClassName="" className="kid-soft-button" disabled={disabled} onClick={() => setStep(step - 1)} />}
      {current.group === 'Lesson' && <IconButton icon={UsersRound} label="Để bố mẹ chọn" iconClassName="" className="kid-soft-button" aria-pressed={draft.lessonLeftToParent} disabled={disabled} onClick={() => void pick(null, true)} />}
      {current.optional && step < STEPS.length - 1 && <IconButton icon={SkipForward} label="Bỏ qua" iconClassName="" className="kid-soft-button" disabled={disabled} onClick={() => setStep(step + 1)} />}
    </div>
    <p className="sub">Em đã chọn: {draft.cards.map(c => c.label).join(', ') || 'chưa có thẻ nào'}{draft.lessonLeftToParent ? ' · bài học để bố mẹ chọn' : ''}</p>
    <div className="kid-library-tabs">
      <IconButton icon={Send} label="Gửi điều ước cho bố mẹ" iconClassName="" className="kid-listen-primary" disabled={disabled || !draft.canSubmit} onClick={() => void submit()} />
      <IconButton icon={X} label="Để sau" iconClassName="" className="kid-soft-button" disabled={disabled} onClick={() => setDraft(null)} />
    </div>
    {!draft.canSubmit && <p className="sub">Em chọn nhân vật và nơi chốn nhé!</p>}
  </section>;

  return <section className="kid-wish">
    <div className="kid-library-invitation"><Frog mood="happy" size={90} /><div>
      <h3 className="display">Em muốn nghe truyện gì?</h3>
      <p>Chọn vài tấm thẻ, bố mẹ sẽ tìm hoặc viết truyện cho em.</p>
      <IconButton icon={Sparkles} label="Em ước một câu chuyện" iconClassName="" className="kid-listen-primary" disabled={disabled} onClick={() => void start()} />
    </div></div>
    {note && <p role="status" className="notice">{note}</p>}
    {!wishes && !note && <p role="status">Đang tải điều ước…</p>}
    {wishes?.map(w => <article className="kcard" key={w.wishId}>
      <h3>{w.cards.map(c => c.label).join(' · ') || 'Điều ước của em'}</h3>
      <p>{w.message}</p>
      {w.fulfilledStoryId != null && <IconButton icon={BookOpen} label="Đọc truyện" iconClassName="" className="kid-listen-primary" disabled={disabled} onClick={() => onRead({ storyId: w.fulfilledStoryId! })} />}
      {w.suggestions.length > 0 && <><p className="sub">Trong lúc chờ, em đọc thử nhé:</p>
        <div className="kid-library-tabs">{w.suggestions.filter(s => s.storyId != null || s.communitySubmissionId != null).map(s => <button key={s.rank} className="kid-soft-button" disabled={disabled}
          onClick={() => onRead(s.storyId != null ? { storyId: s.storyId } : { communitySubmissionId: s.communitySubmissionId! })}><BookOpen aria-hidden="true" />{s.title}</button>)}</div></>}
    </article>)}
  </section>;
}
