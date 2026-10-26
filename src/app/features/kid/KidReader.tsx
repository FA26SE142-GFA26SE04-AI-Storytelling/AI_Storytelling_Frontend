"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Heart, Home, Pause, Volume2, X } from "lucide-react";
import { readingService } from "@/app/services/readingService";
import type { LibraryStory, OpenedFrom, ReadingMode, ReadingPackage, ReadingVocabulary } from "@/app/types/reading";
import { gradientFor } from "@/app/lib/storyView";
import { tokenize } from "@/app/lib/readingRules";
import Frog, { type FrogMood } from "@/app/components/brand/Frog";
import { useNarrator } from "./useNarrator";
import { useDialog } from "./useDialog";

type Props = {
  childId: number;
  story: LibraryStory;
  openedFrom: OpenedFrom;
  isRetake: boolean;
  readingMode: ReadingMode;
  onFinished: (sessionId: number, pack: ReadingPackage) => void;
  onLeave: () => void;
  onForceExit: () => void;
};

type Segment = { start: number; end: number; text: string; vocab?: ReadingVocabulary; word: boolean };

/** Tách trang thành đoạn: từ trong danh sách từ vựng của truyện (gạch chân chấm) và các chữ còn lại. */
function segmentsOf(text: string, vocab: ReadingVocabulary[]): Segment[] {
  const marks: { start: number; end: number; vocab: ReadingVocabulary }[] = [];
  const lower = text.toLowerCase();
  for (const v of vocab.slice().sort((a, b) => b.term.length - a.term.length)) {
    const term = v.term.toLowerCase();
    let at = lower.indexOf(term);
    while (at >= 0) {
      const end = at + term.length;
      const boundary = (i: number) => i < 0 || i >= text.length || !/[\p{L}\p{N}]/u.test(text[i]);
      if (boundary(at - 1) && boundary(end) && !marks.some((m) => at < m.end && end > m.start)) marks.push({ start: at, end, vocab: v });
      at = lower.indexOf(term, end);
    }
  }
  marks.sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let cursor = 0;
  const pushPlain = (from: number, to: number) => {
    let pos = from;
    for (const t of tokenize(text.slice(from, to))) { out.push({ start: pos, end: pos + t.text.length, text: t.text, word: t.word }); pos += t.text.length; }
  };
  for (const m of marks) { pushPlain(cursor, m.start); out.push({ start: m.start, end: m.end, text: text.slice(m.start, m.end), vocab: m.vocab, word: true }); cursor = m.end; }
  pushPlain(cursor, text.length);
  return out;
}

const sentenceWith = (pages: string[], term: string) =>
  pages.flatMap((p) => p.match(/[^.!?…]+[.!?…]*/g) ?? []).find((s) => s.toLowerCase().includes(term.toLowerCase()))?.trim() ?? "";

/** Hộp nghĩa từ: giữ focus bên trong, Esc để đóng. */
function VocabPopup({ term, onClose, children }: { term: string; onClose: () => void; children: ReactNode }) {
  const ref = useDialog<HTMLDivElement>(onClose);
  return (
    <div ref={ref} className="kpop" role="dialog" aria-modal="true" aria-label={`Từ ${term}`}>
      <div className="row"><b className="display grow" style={{ fontSize: 26 }}>{term}</b><button className="kbtn" onClick={onClose} aria-label="Đóng"><X /></button></div>
      {children}
    </div>
  );
}

/** Luồng 3 Bước 3.2 — Immersive Mode. */
export default function KidReader({ childId, story, openedFrom, isRetake, readingMode, onFinished, onLeave, onForceExit }: Props) {
  const [pack, setPack] = useState<ReadingPackage | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [bookmark, setBookmark] = useState<number | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [listenAll, setListenAll] = useState(readingMode === "listen_first");
  const [popup, setPopup] = useState<ReadingVocabulary | null>(null);
  const [toast, setToast] = useState("");
  const [mood, setMood] = useState<FrogMood>("idle");
  const [leaving, setLeaving] = useState(false);
  const narrator = useNarrator();
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Chặn bấm "Đọc xong rồi!" hai lần (bé hay bấm liên tục) → không gửi hoàn thành hai lần.
  const finishing = useRef(false);
  const big = readingMode === "listen_first";

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (moodTimer.current) clearTimeout(moodTimer.current);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [p, s] = await Promise.all([readingService.getPackage(story.storyId), readingService.startSession(childId, story.storyId, openedFrom, isRetake)]);
      if (!alive) return;
      if (!p.success || !p.data || !p.data.pages.length) { setErr(p.message || "Truyện này chưa có nội dung."); return; }
      if (!s.success || !s.data) { setErr(s.message || "Chưa mở được truyện."); return; }
      setPack(p.data);
      setSessionId(s.data.readingSessionId);
      const pr = s.data.progress;
      // Đọc tiếp từ trang dở (Continue Reading), trừ khi đọc lại để mở khoá.
      setPage(isRetake ? 0 : Math.min(Math.max(0, pr.lastPageRead - 1), p.data.pages.length - 1));
      setBookmark(pr.bookmarkPage);
      setFavorite(pr.isFavorited);
      readingService.log(s.data.readingSessionId, "session_started", { openedFrom, isRetake });
    })();
    return () => { alive = false; };
  }, [childId, story.storyId, openedFrom, isRetake]);

  const pagesText = useMemo(() => pack?.pages.map((p) => p.text) ?? [], [pack]);
  const cur = pack?.pages[page];
  const last = !!pack && page === pack.pages.length - 1;
  const segments = useMemo(() => (cur ? segmentsOf(cur.text, pack!.vocabulary) : []), [cur, pack]);

  const toastFor = (t: string) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const readPage = useCallback((auto: boolean) => {
    if (!cur) return;
    readingService.log(sessionId, "tts_started", { page: page + 1 });
    narrator.speak(cur.text, {
      audioUrl: cur.audioUrl, timings: cur.wordTimings,
      onEnd: () => {
        readingService.log(sessionId, "tts_completed", { page: page + 1 });
        // "Nghe cả truyện": tự sang trang sau 1,5 giây; dừng ở trang cuối để bé tự bấm.
        if (auto && pack && page < pack.pages.length - 1) nextTimer.current = setTimeout(() => setPage((p) => p + 1), 1500);
      },
    });
  }, [cur, narrator, pack, page, sessionId]);

  // Mỗi lần sang trang: lưu vị trí đọc, ghi telemetry, tự đọc nếu đang "Nghe cả truyện".
  useEffect(() => {
    if (!pack || sessionId === null) return;
    void readingService.saveProgress(childId, story.storyId, { lastPageRead: page + 1 });
    readingService.log(sessionId, "page_viewed", { page: page + 1 });
    if (listenAll) readPage(true);
    return () => { if (nextTimer.current) clearTimeout(nextTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pack, sessionId]);

  // Ngắt an toàn: hỏi máy chủ mỗi 15 giây (Bước 3.2, 3.5).
  useEffect(() => {
    if (sessionId === null) return;
    const t = setInterval(() => {
      void readingService.forceExitRequested(sessionId).then((r) => { if (r.data) { narrator.stop(); readingService.log(sessionId, "session_force_exited"); onForceExit(); } });
    }, 15_000);
    return () => clearInterval(t);
  }, [sessionId, narrator, onForceExit]);

  const go = (delta: number) => {
    if (!pack) return;
    narrator.stop();
    if (nextTimer.current) clearTimeout(nextTimer.current);
    if (delta > 0) readingService.log(sessionId, "page_completed", { page: page + 1 });
    setPage((p) => Math.min(Math.max(0, p + delta), pack.pages.length - 1));
    setMood("happy");
    if (moodTimer.current) clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => setMood("idle"), 900);
  };

  // Lật trang bằng phím ← → (máy tính bảng có bàn phím), trừ khi đang mở hộp nghĩa từ hoặc gõ chữ.
  const goRef = useRef(go);
  useEffect(() => { goRef.current = go; });
  useEffect(() => {
    if (popup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") goRef.current(1);
      else if (e.key === "ArrowLeft") goRef.current(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [popup]);

  const toggleListenAll = () => {
    const next = !listenAll;
    setListenAll(next);
    if (next) readPage(true); else { narrator.stop(); if (nextTimer.current) clearTimeout(nextTimer.current); }
  };

  const toggleBookmark = () => {
    const next = bookmark === page + 1 ? null : page + 1;
    setBookmark(next);
    void readingService.saveProgress(childId, story.storyId, { bookmarkPage: next });
    if (next) readingService.log(sessionId, "story_bookmarked", { page: next });
    toastFor(next ? "Đã đánh dấu trang này" : "Đã bỏ đánh dấu");
  };

  const toggleFavorite = () => {
    const next = !favorite;
    setFavorite(next);
    void readingService.saveProgress(childId, story.storyId, { isFavorited: next });
    if (next) readingService.log(sessionId, "story_favorited");
    toastFor(next ? "Đã thêm vào truyện yêu thích" : "Đã bỏ khỏi yêu thích");
  };

  const openVocab = (v: ReadingVocabulary) => {
    narrator.stop();
    setPopup(v);
    readingService.log(sessionId, "vocabulary_opened", { term: v.term });
  };

  const saveWord = async (v: ReadingVocabulary) => {
    const r = await readingService.collectWord(childId, story.storyId, v);
    if (r.success) {
      readingService.log(sessionId, "vocabulary_collected", { term: v.term });
      toastFor(r.data?.expGained ? `Đã lưu “${v.term}” vào sổ tay! +${r.data.expGained} ⭐` : r.message || "Em đã lưu từ này rồi.");
    }
    setPopup(null);
  };

  const leave = async () => {
    if (leaving) return;
    setLeaving(true);
    narrator.stop();
    if (sessionId !== null) await readingService.exit(childId, sessionId, page + 1);
    onLeave();
  };

  const finish = async () => {
    if (finishing.current) return;
    narrator.stop();
    if (sessionId !== null && pack) {
      finishing.current = true;
      readingService.log(sessionId, "page_completed", { page: page + 1 });
      onFinished(sessionId, pack);
    }
  };

  const closePopup = useCallback(() => setPopup(null), []);

  if (err) {
    return (
      <div className="kpane"><div className="kcard" style={{ alignItems: "center", textAlign: "center" }}>
        <Frog size={110} mood="think" /><h2 className="display">Ôi, chưa mở được truyện</h2><p className="sub" style={{ fontSize: 15 }}>{err}</p>
        <button className="btn btn-p" onClick={onLeave}><Home className="ic" />Về trang chính</button>
      </div></div>
    );
  }
  if (!pack || !cur) return <div className="kpane"><div className="kcard"><h2 className="display">Đang mở truyện…</h2></div></div>;

  // Chữ đang được đọc (karaoke).
  const hl = narrator.charIndex;

  return (
    <div className="reader">
      <div className="reader-top">
        <button className="kbtn" onClick={() => void leave()} disabled={leaving} aria-label="Về trang chính"><Home /></button>
        <div className="grow">
          <b className="display reader-title">{pack.title}{isRetake && <span className="kpill">Đọc lại để mở khoá</span>}</b>
          <div className="kprogress" role="progressbar" aria-valuemin={1} aria-valuemax={pack.pages.length} aria-valuenow={page + 1} aria-label="Tiến độ đọc">
            <i style={{ width: `${((page + 1) / pack.pages.length) * 100}%` }} />
          </div>
        </div>
        <button className={`kbtn${bookmark === page + 1 ? " on" : ""}`} onClick={toggleBookmark} aria-label="Đánh dấu trang" aria-pressed={bookmark === page + 1}><Bookmark /></button>
        <button className={`kbtn${favorite ? " on" : ""}`} onClick={toggleFavorite} aria-label="Yêu thích" aria-pressed={favorite}><Heart /></button>
      </div>

      <div className={`book reading${big ? " big" : ""}`}>
        <div className="illus cover" role="img" aria-label={`Tranh minh hoạ trang ${page + 1}`} style={cur.imageUrl ? { backgroundImage: `url(${cur.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: gradientFor(story.storyId + page) }}>
          {!cur.imageUrl && <span className="illus-frog"><Frog size={big ? 150 : 110} mood={mood} /></span>}
        </div>
        <div className="kpage">
          <small className="sub">Trang {page + 1} / {pack.pages.length}{bookmark && bookmark !== page + 1 ? ` · Đã đánh dấu trang ${bookmark}` : ""}</small>
          <p className="display ktext" lang="vi">
            {segments.map((s) => {
              const active = hl !== null && hl >= s.start && hl < s.end;
              if (s.vocab) return <button key={s.start} className={`kword vocab${active ? " hl" : ""}`} onClick={() => openVocab(s.vocab!)}>{s.text}</button>;
              if (!s.word) return <span key={s.start}>{s.text}</span>;
              return <button key={s.start} type="button" className={`kword${active ? " hl" : ""}`} onClick={() => narrator.speak(s.text, { rate: 0.8 })}>{s.text}</button>;
            })}
          </p>
          <div className="row" style={{ marginTop: "auto", flexWrap: "wrap" }}>
            <button className="kbtn" onClick={() => (narrator.speaking ? narrator.stop() : readPage(false))} aria-label={narrator.speaking ? "Dừng đọc" : "Nghe trang này"}>{narrator.speaking ? <Pause /> : <Volume2 />}</button>
            <button className={`kbtn small${listenAll ? " on" : ""}`} onClick={toggleListenAll} aria-pressed={listenAll}>Nghe cả truyện</button>
            <span className="grow" />
            <button className="kbtn" onClick={() => go(-1)} disabled={page === 0} aria-label="Trang trước"><ChevronLeft /></button>
            {last
              ? <button className="kbtn primary" onClick={() => void finish()}>Đọc xong rồi!</button>
              : <button className="kbtn" onClick={() => go(1)} aria-label="Trang sau"><ChevronRight /></button>}
          </div>
        </div>
      </div>

      {popup && (
        <div className="kpop-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closePopup(); }}>
          <VocabPopup term={popup.term} onClose={closePopup}>
            <p style={{ fontSize: 17, margin: 0 }}>{popup.definition}</p>
            {sentenceWith(pagesText, popup.term) && <p className="sub" style={{ fontSize: 15, margin: 0 }}>“{sentenceWith(pagesText, popup.term)}”</p>}
            <div className="row">
              <button className="kbtn" onClick={() => narrator.speak(`${popup.term}. ${popup.definition}`)} aria-label="Nghe"><Volume2 /></button>
              <button className="kbtn primary grow" onClick={() => void saveWord(popup)}>Lưu vào sổ tay</button>
            </div>
          </VocabPopup>
        </div>
      )}
      {/* Vùng thông báo luôn có mặt để trình đọc màn hình đọc được nội dung mới. */}
      <div className={toast ? "ktoast" : "sr-only"} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
