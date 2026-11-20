'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Lightbulb, MapPin, Mountain, Send, SkipForward, Sparkles, UserRound, UsersRound, X, type LucideIcon } from 'lucide-react';
import { childWishService } from '@/app/services/storyWishService';
import type { ReadingStart } from '@/app/types/childReading';
import type { ChildWishCardDto, ChildWishDto, WishCardGroup, WishDraftDto } from '@/app/types/storyWish';
import Frog from '@/app/components/brand/Frog';
import IconButton from '@/app/components/IconButton';
import SafeImage from "@/app/components/SafeImage";
import { useRiseIn } from '@/app/lib/motion';
import { showToast } from '@/app/lib/toast';
import '@/app/styles/features/kid/kid-lobby.css';
import '@/app/styles/features/kid/kid-panes.css';

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
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    void childWishService.mine(token, controller.signal).then(r => {
      if (controller.signal.aborted) return;
      if (r.success) setWishes(r.data ?? []);
      else { setWishes([]); showToast(r.message, 'err'); }
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
      if (r.success) setCards(r.data ?? []); else showToast(r.message, 'err');
    });
    return () => controller.abort();
  }, [token, draft?.wishId, current.group]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async <T,>(fn: () => Promise<{ success: boolean; message: string; data: T | null }>) => {
    if (lock.current) return null;
    lock.current = true; setWorking(true);
    const r = await fn();
    lock.current = false; setWorking(false);
    if (!r.success) showToast(r.message, 'err');
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
    if (r?.success) { setDraft(null); showToast('Đã gửi điều ước cho bố mẹ!', 'ok'); setRevision(v => v + 1); }
  };

  const rootRef = useRiseIn<HTMLElement>('.kl-panel', [!!draft, wishes === null], { delay: 70 });

  const chosen = draft?.cards.find(c => c.group === current.group);
  const disabled = working || busy;

  if (draft) return <section ref={rootRef} className="kid-wish">
    <div className="kl-panel kid-wish-panel">
      <div className="kid-wish-steps" aria-label="Các bước ước">{STEPS.map((s, i) => <IconButton key={s.group} icon={s.icon} label={`Bước ${i + 1}: ${s.question}`} iconClassName="" className={`kid-btn3d is-pink kid-btn-sq-lg${i === step ? ' is-active' : ''}`} aria-pressed={i === step} disabled={disabled} onClick={() => setStep(i)} />)}</div>
      <h3 className="display kid-wish-question">{current.question}</h3>
      {!cards && <div className="kid-pane-loading" role="status"><Frog mood="think" size={64} /><span className="sr-only">Đang tải thẻ…</span></div>}
      {cards && !cards.length && <p className="kl-words-empty">Chưa có thẻ nào cho bước này.</p>}
      <div className="kid-wish-cards">{cards?.map((c, i) => <button key={c.id} type="button" className="kid-wish-card" style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }} aria-pressed={chosen?.id === c.id} disabled={disabled} onClick={() => void pick(c)}>
        {c.imageUrl && <SafeImage src={c.imageUrl} alt="" />}<span>{c.label}</span>
      </button>)}</div>
      <div className="kid-wish-actions">
        {step > 0 && <button type="button" className="kid-btn3d is-sky" disabled={disabled} onClick={() => setStep(step - 1)}><ArrowLeft aria-hidden="true" />Quay lại</button>}
        {current.group === 'Lesson' && <button type="button" className="kid-btn3d is-sky" aria-pressed={draft.lessonLeftToParent} disabled={disabled} onClick={() => void pick(null, true)}><UsersRound aria-hidden="true" />Để bố mẹ chọn</button>}
        {current.optional && step < STEPS.length - 1 && <button type="button" className="kid-btn3d is-sky" disabled={disabled} onClick={() => setStep(step + 1)}><SkipForward aria-hidden="true" />Bỏ qua</button>}
      </div>
      <div className="kid-wish-actions">
        <button type="button" className="kid-btn3d is-gold is-big" disabled={disabled || !draft.canSubmit} onClick={() => void submit()}><Send aria-hidden="true" />Gửi điều ước</button>
        <button type="button" className="kid-btn3d is-sky" disabled={disabled} onClick={() => setDraft(null)}><X aria-hidden="true" />Để sau</button>
      </div>
    </div>
  </section>;

  return <section ref={rootRef} className="kid-wish">
    <div className="kl-panel kid-wish-panel kid-wish-invite">
      <Frog mood="happy" size={90} />
      <div>
        <h3 className="display kid-wish-question">Em muốn nghe truyện gì?</h3>
        <button type="button" className="kid-btn3d is-pink is-big" disabled={disabled} onClick={() => void start()}><Sparkles aria-hidden="true" />Em ước một câu chuyện</button>
      </div>
    </div>
    {!wishes && <div className="kid-pane-loading" role="status"><Frog mood="think" size={64} /><span className="sr-only">Đang tải điều ước…</span></div>}
    {wishes && wishes.length > 0 && <section className="kl-panel kid-wish-panel kid-wish-mine" aria-labelledby="kid-wish-h">
      <h2 id="kid-wish-h" className="kl-head display"><Sparkles aria-hidden="true" />Điều ước của em</h2>
      <div className="kid-wish-list">{wishes.map(w => <article className="kid-wish-item" key={w.wishId}>
        <h3 className="display">{w.cards.map(c => c.label).join(' · ') || 'Điều ước của em'}</h3>
        <p className="kid-wish-status">{w.message}</p>
        {(w.fulfilledStoryId != null || w.suggestions.length > 0) && <div className="kid-wish-actions">
          {w.fulfilledStoryId != null && <button type="button" className="kid-btn3d is-gold" disabled={disabled} onClick={() => onRead({ storyId: w.fulfilledStoryId! })}><BookOpen aria-hidden="true" />Đọc truyện</button>}
          {w.suggestions.filter(s => s.storyId != null || s.communitySubmissionId != null).map(s => <button key={s.rank} type="button" className="kid-btn3d is-sky kid-wish-suggest" disabled={disabled}
            onClick={() => onRead(s.storyId != null ? { storyId: s.storyId } : { communitySubmissionId: s.communitySubmissionId! })}><BookOpen aria-hidden="true" />{s.title}</button>)}
        </div>}
      </article>)}</div>
    </section>}
  </section>;
}
