"use client";

import { useMemo, useState } from "react";
import { BookHeart, Lock, Search, Sparkles, Star } from "lucide-react";
import { readingService } from "@/app/services/readingService";
import type { KidHome as Home, LibraryStory, OpenedFrom, StoryWish } from "@/app/types/reading";
import { gradientFor } from "@/app/lib/storyView";
import { WISH_CARDS } from "@/app/services/readingLocal";
import { useRiseIn } from "@/app/lib/motion";

type Props = {
  home: Home;
  onOpen: (story: LibraryStory, from: OpenedFrom, isRetake?: boolean) => void;
  onWish: () => void;
};

const LENGTH_LABEL = { short: "Ngắn", medium: "Vừa", long: "Dài" } as const;
const card = (id: number | null) => WISH_CARDS.find((c) => c.id === id);

/** Thông điệp điều ước cho bé — không bao giờ nêu lý do từ chối (Bước 3.1b). */
function wishMessage(w: StoryWish): string {
  switch (w.status) {
    case "pending": case "accepted": return "Bố mẹ đang xem điều ước của em";
    case "fulfilled": return w.fulfillmentType === "existing_story" ? "Bố mẹ đã tìm được truyện cho điều ước của em!" : "Điều ước của em đã thành truyện!";
    default: return "Lần này bố mẹ sẽ kể cho em truyện khác nhé";
  }
}

function Cover({ story, onClick, badge, locked }: { story: LibraryStory; onClick?: () => void; badge?: string; locked?: boolean }) {
  return (
    <button className={`kcover big${locked ? " locked" : ""}`} onClick={onClick} disabled={locked}>
      <span className="cover" style={story.coverImageUrl ? { backgroundImage: `url(${story.coverImageUrl})`, backgroundSize: "cover" } : { background: gradientFor(story.storyId) }}>
        {locked && <Lock className="lock" />}
        {badge && <em className="kpill">{badge}</em>}
      </span>
      <b className="display">{story.title}</b>
    </button>
  );
}

/** Luồng 3 Bước 3.1 — Journey Map: đọc tiếp, bố mẹ chọn, điều ước, tìm và lọc truyện. */
export default function KidHome({ home, onOpen, onWish }: Props) {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [length, setLength] = useState<keyof typeof LENGTH_LABEL | null>(null);
  const [onlyFav, setOnlyFav] = useState(false);
  const rootRef = useRiseIn<HTMLDivElement>(".kcover, .ksection", [home.library.length]);
  const hold = home.holdMode;
  const progressOf = (id: number) => home.progress.find((p) => p.storyId === id);

  const genres = useMemo(() => [...new Set(home.library.map((s) => s.genre).filter(Boolean))] as string[], [home.library]);
  // Truyện vừa sức xếp trước, truyện "Thử thách" xếp sau.
  const list = useMemo(() => home.library
    .filter((s) => (!q.trim() || s.title.toLowerCase().includes(q.trim().toLowerCase()))
      && (!genre || s.genre === genre) && (!length || s.lengthCategory === length) && (!onlyFav || progressOf(s.storyId)?.isFavorited))
    .sort((a, b) => Number(a.isChallenge) - Number(b.isChallenge)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [home.library, q, genre, length, onlyFav, home.progress]);

  const continueStory = home.library.find((s) => { const p = progressOf(s.storyId); return p && p.lastPageRead > 1 && !p.completedOnce; });
  const byId = (id: number | null) => home.library.find((s) => s.storyId === id);
  const roadmapOpen = home.roadmap ? byId(home.roadmap.openStoryId) : undefined;
  const openWishes = home.wishes.slice(0, 3);

  const search = (value: string) => {
    setQ(value);
    if (value.length === 3) readingService.log(null, "library_searched");
  };

  return (
    <div ref={rootRef} className="khome">
      {hold && (
        <div className="ksection hold">
          <b className="display">Mình cùng đọc lại một truyện để mở khoá thư viện nhé!</b>
          {byId(hold.triggeringStoryId) && hold.retakesLeft > 0 && <Cover story={byId(hold.triggeringStoryId)!} badge="Đọc lại để mở khoá" onClick={() => onOpen(byId(hold.triggeringStoryId)!, "library", true)} />}
          {hold.retakesLeft <= 0 && <p>Nghỉ một chút rồi thử lại nhé!</p>}
        </div>
      )}

      {!hold && continueStory && (
        <div className="ksection">
          <h3 className="display">Đọc tiếp</h3>
          <div className="kshelf"><Cover story={continueStory} badge={`Trang ${progressOf(continueStory.storyId)!.lastPageRead}`} onClick={() => onOpen(continueStory, "continue_reading")} /></div>
        </div>
      )}

      {home.roadmap && (
        <div className="ksection">
          <h3 className="display">Bố mẹ chọn cho em <small>{home.roadmap.done}/{home.roadmap.total}</small></h3>
          {roadmapOpen ? (
            <div className="kshelf">
              <Cover story={roadmapOpen} onClick={hold ? undefined : () => onOpen(roadmapOpen, "roadmap")} locked={!!hold} />
              {home.roadmap.queued.map((s) => <div key={s.storyId} className="kcover big locked"><span className="cover" style={{ background: gradientFor(s.storyId) }}><Lock className="lock" /></span><b className="display">Chưa tới lượt</b></div>)}
            </div>
          ) : <p className="sub" style={{ fontSize: 15 }}>Con đã đọc hết truyện bố mẹ chọn!</p>}
          {home.roadmap.note && <p className="knote">💌 {home.roadmap.note}</p>}
          {home.roadmap.dueAt && <p className="sub">Mong con đọc xong trước {new Date(home.roadmap.dueAt).toLocaleDateString("vi-VN")}</p>}
        </div>
      )}

      {home.storyWishesEnabled && (
        <div className="ksection">
          <button className="kwish" onClick={onWish}><Sparkles /> Em muốn nghe truyện về…</button>
          {openWishes.map((w) => (
            <div key={w.id} className="kwish-item">
              <span className="kwish-cards" aria-hidden>{[w.characterCardId, w.placeCardId, w.challengeCardId, w.lessonCardId].map((id) => card(id)?.emoji).filter(Boolean).join(" ")}</span>
              <b>{wishMessage(w)}</b>
              {w.status === "fulfilled" && w.storyId && byId(w.storyId) && <button className="kbtn small primary" onClick={() => onOpen(byId(w.storyId)!, "library")}>Đọc ngay</button>}
              {w.status === "pending" && !hold && w.suggestions.length > 0 && (
                <div className="ksugg">
                  <small>Trong lúc chờ bố mẹ, em thử đọc truyện này nhé!</small>
                  <div className="kshelf">
                    {w.suggestions.map((sg) => byId(sg.storyId) && <Cover key={sg.storyId} story={byId(sg.storyId)!} badge={sg.matchedCardIds.map((id) => card(id)?.emoji).join("")} onClick={() => { readingService.log(null, "wish_suggestion_opened", { storyWishId: w.id, storyId: sg.storyId }); onOpen(byId(sg.storyId)!, "wish_suggestion"); }} />)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="ksection">
        <h3 className="display">Thư viện của em</h3>
        <div className="kfilters">
          <label className="ksearch"><Search /><input value={q} onChange={(e) => search(e.target.value)} placeholder="Tìm truyện" aria-label="Tìm truyện" /></label>
          <button className={`kchip${onlyFav ? " on" : ""}`} onClick={() => setOnlyFav(!onlyFav)}><BookHeart size={16} /> Yêu thích</button>
          {genres.map((g) => <button key={g} className={`kchip${genre === g ? " on" : ""}`} onClick={() => setGenre(genre === g ? null : g)}>{g}</button>)}
          {(Object.keys(LENGTH_LABEL) as (keyof typeof LENGTH_LABEL)[]).map((l) => <button key={l} className={`kchip${length === l ? " on" : ""}`} onClick={() => setLength(length === l ? null : l)}>{LENGTH_LABEL[l]}</button>)}
        </div>
        {list.length === 0 && <p className="sub" style={{ fontSize: 15 }}>{home.library.length ? "Không tìm thấy truyện nào." : "Chưa có truyện nào. Bố mẹ sẽ chuẩn bị truyện cho em nhé!"}</p>}
        <div className="kgrid">
          {list.map((s) => {
            const p = progressOf(s.storyId);
            const locked = !!hold && s.storyId !== hold.triggeringStoryId;
            return <Cover key={s.storyId} story={s} locked={locked} onClick={() => onOpen(s, "library")}
              badge={s.isChallenge ? "Thử thách" : p?.completedOnce ? "✓ Đã đọc" : p?.isFavorited ? "♥" : undefined} />;
          })}
        </div>
        {hold && <p className="sub" style={{ fontSize: 15 }}><Star size={14} /> Thư viện sẽ mở lại khi em đọc lại truyện ở trên.</p>}
      </div>
    </div>
  );
}
