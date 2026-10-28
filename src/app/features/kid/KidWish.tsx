'use client';
import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { childWishService } from '@/app/services/storyWishService';
import type { ReadingStart } from '@/app/types/childReading';
import type { ChildWishCardDto, ChildWishDto, WishCardGroup, WishDraftDto } from '@/app/types/storyWish';
import Frog from '@/app/components/brand/Frog';

const STEPS: { group: WishCardGroup; question: string; optional: boolean }[] = [
  { group: 'Character', question: 'Ai là nhân vật chính?', optional: false },
  { group: 'Place', question: 'Câu chuyện diễn ra ở đâu?', optional: false },
  { group: 'Challenge', question: 'Nhân vật gặp thử thách gì?', optional: true },
  { group: 'Lesson', question: 'Em muốn học điều gì?', optional: true },
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
    <div className="kid-wish-steps" aria-label="Các bước ước">{STEPS.map((s, i) => <button key={s.group} className="kid-soft-button" aria-pressed={i === step} disabled={disabled} onClick={() => setStep(i)}>{i + 1}</button>)}</div>
    <h3 className="display">{current.question}{current.optional && <small> (không bắt buộc)</small>}</h3>
    {note && <p role="status" className="notice">{note}</p>}
    {!cards && <p role="status">Đang tải thẻ…</p>}
    {cards && !cards.length && <p>Chưa có thẻ nào cho bước này.</p>}
    <div className="kid-wish-cards">{cards?.map(c => <button key={c.id} className="kid-wish-card" aria-pressed={chosen?.id === c.id} disabled={disabled} onClick={() => void pick(c)}>
      {c.imageUrl && <img src={c.imageUrl} alt="" />}<span>{c.label}</span>
    </button>)}</div>
    <div className="kid-library-tabs">
      {current.group === 'Lesson' && <button className="kid-soft-button" aria-pressed={draft.lessonLeftToParent} disabled={disabled} onClick={() => void pick(null, true)}>Để bố mẹ chọn</button>}
      {current.optional && step < STEPS.length - 1 && <button className="kid-soft-button" disabled={disabled} onClick={() => setStep(step + 1)}>Bỏ qua</button>}
      {step > 0 && <button className="kid-soft-button" disabled={disabled} onClick={() => setStep(step - 1)}>Quay lại</button>}
    </div>
    <p className="sub">Em đã chọn: {draft.cards.map(c => c.label).join(', ') || 'chưa có thẻ nào'}{draft.lessonLeftToParent ? ' · bài học để bố mẹ chọn' : ''}</p>
    <div className="kid-library-tabs">
      <button className="kid-listen-primary" disabled={disabled || !draft.canSubmit} onClick={() => void submit()}><Sparkles aria-hidden="true" />Gửi điều ước cho bố mẹ</button>
      <button className="kid-soft-button" disabled={disabled} onClick={() => setDraft(null)}>Để sau</button>
    </div>
    {!draft.canSubmit && <p className="sub">Em chọn nhân vật và nơi chốn nhé!</p>}
  </section>;

  return <section className="kid-wish">
    <div className="kid-library-invitation"><Frog mood="happy" size={90} /><div>
      <h3 className="display">Em muốn nghe truyện gì?</h3>
      <p>Chọn vài tấm thẻ, bố mẹ sẽ tìm hoặc viết truyện cho em.</p>
      <button className="kid-listen-primary" disabled={disabled} onClick={() => void start()}><Sparkles aria-hidden="true" />Em ước một câu chuyện</button>
    </div></div>
    {note && <p role="status" className="notice">{note}</p>}
    {!wishes && !note && <p role="status">Đang tải điều ước…</p>}
    {wishes?.map(w => <article className="kcard" key={w.wishId}>
      <h3>{w.cards.map(c => c.label).join(' · ') || 'Điều ước của em'}</h3>
      <p>{w.message}</p>
      {w.fulfilledStoryId != null && <button className="kid-listen-primary" disabled={disabled} onClick={() => onRead({ storyId: w.fulfilledStoryId! })}>Đọc truyện</button>}
      {w.suggestions.length > 0 && <><p className="sub">Trong lúc chờ, em đọc thử nhé:</p>
        <div className="kid-library-tabs">{w.suggestions.filter(s => s.storyId != null || s.communitySubmissionId != null).map(s => <button key={s.rank} className="kid-soft-button" disabled={disabled}
          onClick={() => onRead(s.storyId != null ? { storyId: s.storyId } : { communitySubmissionId: s.communitySubmissionId! })}>{s.title}</button>)}</div></>}
    </article>)}
  </section>;
}
