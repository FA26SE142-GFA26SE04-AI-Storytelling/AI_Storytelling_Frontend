"use client";

import "./kid.css";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { aiStoryCreationService } from "@/app/services/aiStoryCreationService";
import { storyService } from "@/app/services/storyService";
import type { QuizQuestionDto } from "@/app/types/aiStory";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import Frog, { type FrogMood } from "@/app/components/brand/Frog";
import { splitScenes } from "@/app/lib/storyView";
import { useRiseIn, useSwap, shake, bounce } from "@/app/lib/motion";

export default function KidMode({ onExit }: { onExit: () => void }) {
  const { child, stories } = useWorkspaceData();
  const readable = stories.filter((s) => s.tone === "ok");
  const [tab, setTab] = useState<"read" | "quiz">("read");
  const [storyId, setStoryId] = useState<number | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestionDto[]>([]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  // Ếch bạn đồng hành: vui khi bé lật trang hoặc trả lời đúng, ngẫm nghĩ khi trả lời sai.
  const [buddyMood, setBuddyMood] = useState<FrogMood>("idle");
  const buddyRef = useRef<HTMLDivElement>(null);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const react = (kind: "hello" | "angry") => {
    setBuddyMood(kind === "hello" ? "happy" : "think");
    if (kind === "hello") bounce(buddyRef.current); else shake(buddyRef.current);
    if (moodTimer.current) clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => setBuddyMood("idle"), 1800);
  };
  useEffect(() => () => { if (moodTimer.current) clearTimeout(moodTimer.current); }, []);

  const open = async (id: number) => {
    setStoryId(id);
    setPage(0);
    setPages([]);
    setQuiz([]);
    setQi(0);
    setPicked(null);
    setLoading(true);
    const [res, qz] = await Promise.all([storyService.getStoryById(id), aiStoryCreationService.getQuizReview(id)]);
    const dto = res.data;
    const fromPages = dto?.pages?.slice().sort((a, b) => a.pageNumber - b.pageNumber).map((p) => p.content) ?? [];
    setPages(fromPages.length ? fromPages : splitScenes(dto?.content ?? ""));
    setQuiz(qz.data?.items.filter((q) => q.choices && q.choices.length > 1 && q.correctAnswer) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (storyId === null && readable[0]) void open(readable[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readable.length]);

  const textRef = useSwap<HTMLParagraphElement>(`${storyId}-${page}`);
  const shelfRef = useRiseIn<HTMLDivElement>(".kcover", [readable.length], { delay: 60 });
  const cardRef = useRiseIn<HTMLDivElement>(":scope > *", [tab, qi], { delay: 60 });
  const cur = readable.find((s) => s.id === storyId);
  const question = quiz[qi];
  const answer = (c: string, el: HTMLElement) => {
    if (picked !== null || !question) return;
    setPicked(c);
    if (c === question.correctAnswer) { setStars((s) => s + 5); bounce(el); react("hello"); } else { shake(el); react("angry"); }
  };

  return (
    <div className="kid" role="dialog" aria-label="Chế độ của bé">
      <PondBackdrop />
      <div ref={buddyRef} className="kid-buddy"><Frog size={120} mood={buddyMood} /></div>
      <div className="ktop">
        <button className="btn btn-s" onClick={onExit}><ArrowLeft className="ic" />Về khu người lớn</button>
        <div className="ktabs" role="tablist">
          {([["read", "Đọc truyện"], ["quiz", "Câu đố"]] as const).map(([id, l]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{l}</button>
          ))}
        </div>
        <span className="kstat">{child?.nickname}</span>
        <span className="kstat"><Star className="ic" style={{ color: "var(--warn-ink)", fill: "var(--gold)" }} />{stars}</span>
      </div>

      {readable.length === 0 && (
        <div className="kpane"><div className="kcard"><h2 className="display">Chưa có truyện nào cho {child?.nickname}</h2><p className="sub">Hãy tạo và duyệt truyện trong Studio nhé!</p></div></div>
      )}

      {readable.length > 0 && (
        <div ref={shelfRef} className="kshelf">
          {readable.map((s) => (
            <button key={s.id} className={`kcover${s.id === storyId ? " on" : ""}`} onClick={() => void open(s.id)}>
              <span className="cover" style={{ background: s.gradient }} /><b className="display">{s.title}</b>
            </button>
          ))}
        </div>
      )}

      {readable.length > 0 && tab === "read" && (
        <div className="kpane">
          <div className="book">
            <div className="illus cover" style={{ background: cur?.gradient }} />
            <div className="kpage">
              <small className="sub">{cur?.title}{pages.length > 0 && ` · Trang ${page + 1} trên ${pages.length}`}</small>
              <p ref={textRef} className="display ktext">{loading ? "Đang mở truyện…" : pages[page] ?? "Truyện này chưa có nội dung."}</p>
              <div className="row" style={{ marginTop: "auto" }}>
                <button className="kbtn" onClick={() => { setPage((p) => Math.max(0, p - 1)); react("hello"); }} disabled={page === 0} aria-label="Trang trước"><ChevronLeft /></button>
                <span className="grow" />
                <button className="kbtn" onClick={() => { react("hello"); if (page < pages.length - 1) setPage(page + 1); else if (quiz.length) setTab("quiz"); }} disabled={page >= pages.length - 1 && quiz.length === 0} aria-label="Trang sau"><ChevronRight /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {readable.length > 0 && tab === "quiz" && (
        <div className="kpane">
          {question ? (
            <div ref={cardRef} className="kcard">
              <span className="pill ai">Câu {qi + 1} / {quiz.length}</span>
              <h2 className="display">{question.question}</h2>
              <div className="kans">
                {question.choices!.map((c) => (
                  <button key={c} className={`kopt${picked !== null && c === question.correctAnswer ? " right" : ""}${picked === c && c !== question.correctAnswer ? " wrong" : ""}`} onClick={(e) => answer(c, e.currentTarget)}>{c}</button>
                ))}
              </div>
              {picked !== null && (
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <b className="display" style={{ fontSize: 18 }}>{picked === question.correctAnswer ? "Giỏi quá! +5 sao" : "Thử lại lần sau nhé!"}</b>
                  <button className="btn btn-p" onClick={() => { setPicked(null); setQi((q) => (q + 1) % quiz.length); }}>Câu tiếp theo</button>
                </div>
              )}
            </div>
          ) : <div className="kcard"><h2 className="display">Truyện này chưa có câu đố</h2></div>}
        </div>
      )}
    </div>
  );
}
