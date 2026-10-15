"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { readingService } from "@/app/services/readingService";
import type { LibraryStory, StoryWish, WishCard, WishGroup } from "@/app/types/reading";
import { gradientFor } from "@/app/lib/storyView";
import Frog from "@/app/components/brand/Frog";
import { useNarrator } from "./useNarrator";

const STEPS: { group: WishGroup; title: string; optional: boolean }[] = [
  { group: "character", title: "Em muốn nhân vật là ai?", optional: false },
  { group: "place", title: "Câu chuyện xảy ra ở đâu?", optional: false },
  { group: "challenge", title: "Nhân vật gặp chuyện gì?", optional: true },
  { group: "lesson", title: "Em muốn học điều gì?", optional: true },
];

/** Luồng 3 Bước 3.1b — Bé ước một câu chuyện: 4 màn chọn thẻ hình, mỗi màn tối đa 8 thẻ, có đọc tên thẻ. */
export default function KidWish({ childId, library, onBack, onOpen }: { childId: number; library: LibraryStory[]; onBack: () => void; onOpen: (s: LibraryStory) => void }) {
  const [cards, setCards] = useState<WishCard[]>([]);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Record<WishGroup, number | null>>({ character: null, place: null, challenge: null, lesson: null });
  const [result, setResult] = useState<StoryWish | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const narrator = useNarrator();

  useEffect(() => { void readingService.wishCards(childId).then((r) => setCards(r.data ?? [])); }, [childId]);

  const cur = STEPS[step];
  const choose = (c: WishCard) => {
    narrator.speak(c.label);
    setPicked((p) => ({ ...p, [c.group]: c.id }));
  };
  const next = async () => {
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    setBusy(true);
    const r = await readingService.submitWish(childId, { characterCardId: picked.character!, placeCardId: picked.place!, challengeCardId: picked.challenge, lessonCardId: picked.lesson });
    setBusy(false);
    if (r.success && r.data) { setResult(r.data); readingService.log(null, "story_wish_submitted", { storyWishId: r.data.id }); }
    else setErr(r.message);
  };

  if (err) {
    return (
      <div className="kpane"><div className="kcard" style={{ textAlign: "center", alignItems: "center" }}>
        <Frog size={110} mood="think" /><h2 className="display">{err}</h2>
        <button className="kbtn primary" onClick={onBack}><Home />Về trang chính</button>
      </div></div>
    );
  }

  if (result) {
    const chosen = [result.characterCardId, result.placeCardId, result.challengeCardId, result.lessonCardId].map((id) => cards.find((c) => c.id === id)).filter(Boolean) as WishCard[];
    return (
      <div className="kpane"><div className="kcard" style={{ textAlign: "center", alignItems: "center" }}>
        <Frog size={110} mood="happy" />
        <h2 className="display">Bố mẹ sẽ xem điều ước của em nhé!</h2>
        <div className="kwish-cards big" aria-label="Thẻ em đã chọn">{chosen.map((c) => <span key={c.id} title={c.label}>{c.emoji}</span>)}</div>
        {result.suggestions.length > 0 && (
          <>
            <p style={{ fontSize: 16, margin: 0 }}>Trong lúc chờ bố mẹ, em thử đọc truyện này nhé!</p>
            <div className="kshelf" style={{ justifyContent: "center" }}>
              {result.suggestions.map((s) => {
                const story = library.find((l) => l.storyId === s.storyId);
                return story && (
                  <button key={s.storyId} className="kcover big" onClick={() => onOpen(story)}>
                    <span className="cover" style={{ background: gradientFor(s.storyId) }}><em className="kpill">{s.matchedCardIds.map((id) => cards.find((c) => c.id === id)?.emoji).join("")}</em></span>
                    <b className="display">{s.title}</b>
                  </button>
                );
              })}
            </div>
          </>
        )}
        <button className="kbtn" onClick={onBack}><Home />Về trang chính</button>
      </div></div>
    );
  }

  const options = cards.filter((c) => c.group === cur.group).slice(0, 8);
  const chosenId = picked[cur.group];
  return (
    <div className="kpane"><div className="kcard">
      <div className="row"><button className="kbtn" onClick={step === 0 ? onBack : () => setStep(step - 1)} aria-label="Quay lại"><ArrowLeft /></button>
        <span className="kpill">{step + 1}/{STEPS.length}</span></div>
      <h2 className="display">{cur.title}</h2>
      <div className="wish-grid">
        {options.map((c) => (
          <button key={c.id} className={`wish-card${chosenId === c.id ? " on" : ""}`} onClick={() => choose(c)} aria-pressed={chosenId === c.id}>
            <span aria-hidden>{c.emoji}</span>{c.label}
          </button>
        ))}
        {cur.group === "lesson" && <button className={`wish-card${chosenId === null ? " on" : ""}`} onClick={() => setPicked((p) => ({ ...p, lesson: null }))}><span aria-hidden>👨‍👩‍👧</span>Để bố mẹ chọn</button>}
      </div>
      <div className="row">
        <span className="grow" />
        {cur.optional && chosenId === null && cur.group !== "lesson" && <button className="kbtn" onClick={() => void next()}>Bỏ qua</button>}
        <button className="kbtn primary" disabled={busy || (!cur.optional && chosenId === null)} onClick={() => void next()}>{step === STEPS.length - 1 ? "Gửi điều ước" : "Tiếp tục"}</button>
      </div>
    </div></div>
  );
}
