"use client";

import { useEffect, useMemo, useState } from "react";
import { Home, Volume2 } from "lucide-react";
import { readingService } from "@/app/services/readingService";
import type { Achievements, CompleteResult, QuizAnswerInput, Reaction, ReadingMode, ReadingPackage } from "@/app/types/reading";
import { BADGES, isAnswerCorrect, sequencingItems, shuffle, treeStage } from "@/app/lib/readingRules";
import Frog from "@/app/components/brand/Frog";
import { useNarrator } from "./useNarrator";
import { bounce, shake } from "@/app/lib/motion";

const REACTIONS: { id: Reaction; emoji: string; label: string }[] = [
  { id: "love", emoji: "😍", label: "Rất thích" },
  { id: "like", emoji: "🙂", label: "Thích" },
  { id: "neutral", emoji: "😐", label: "Bình thường" },
  { id: "dislike", emoji: "🙁", label: "Chưa thích" },
];

type Step = "react" | "quiz" | "game" | "tree";
type Props = {
  childId: number;
  sessionId: number;
  pack: ReadingPackage;
  ageBand: string;
  readingMode: ReadingMode;
  isRetake: boolean;
  completed: CompleteResult | null;
  onDone: (a: Achievements | null) => void;
};

/** Luồng 3 Bước 3.3–3.4 — trình tự sau khi đọc. Câu đố không gọi là "bài kiểm tra". */
export default function KidAfter({ childId, sessionId, pack, ageBand, readingMode, isRetake, completed, onDone }: Props) {
  // Phiên đọc lại để mở khoá: xáo trộn câu hỏi và phương án mỗi lượt (Bước 3.5).
  const quiz = useMemo(() => {
    const items = pack.quiz.filter((q) => ageBand !== "Age_6_8" || q.type !== "short_answer");
    return isRetake ? shuffle(items).map((q) => ({ ...q, choices: q.choices ? shuffle(q.choices) : q.choices })) : items;
  }, [pack, ageBand, isRetake]);
  const game = useMemo(() => sequencingItems(pack.pages.map((p) => p.text)), [pack]);
  const [step, setStep] = useState<Step>("react");
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [answers, setAnswers] = useState<QuizAnswerInput[]>([]);
  const [quizExp, setQuizExp] = useState(0);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>(() => shuffle(game));
  const [ach, setAch] = useState<Achievements | null>(completed?.achievements ?? null);
  const [watered, setWatered] = useState(false);
  const narrator = useNarrator();
  const listen = readingMode === "listen_first";
  const q = quiz[qi];

  // Nhóm "Nghe là chính": câu hỏi và phương án được đọc to.
  useEffect(() => {
    if (step === "quiz" && q && listen) narrator.speak([q.question, ...(q.choices ?? [])].join(". "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, qi]);

  const nextAfterQuiz = () => setStep(game.length >= 3 ? "game" : "tree");

  const react = (r: Reaction) => {
    void readingService.react(childId, sessionId, r);
    readingService.log(sessionId, "story_reacted", { reaction: r });
    setStep(quiz.length ? "quiz" : game.length >= 3 ? "game" : "tree");
  };

  const answer = (given: string, el?: HTMLElement | null) => {
    if (picked !== null || !q) return;
    narrator.stop();
    setPicked(given);
    const right = isAnswerCorrect(q, given);
    if (el) (right ? bounce : shake)(el);
    readingService.log(sessionId, "quiz_answered", { quizItemId: q.id, isCorrect: right });
    setAnswers((a) => [...a, { quizItemId: q.id, answerGiven: given }]);
  };

  const nextQuestion = async () => {
    if (qi < quiz.length - 1) { setQi(qi + 1); setPicked(null); setTyped(""); return; }
    const r = await readingService.submitQuiz(childId, sessionId, pack, answers);
    readingService.log(sessionId, "quiz_completed", { correct: r.data?.correct, total: r.data?.total });
    setScore(r.data ? { correct: r.data.correct, total: r.data.total } : null);
    setQuizExp(r.data?.expGained ?? 0);
  };

  const water = async () => {
    const r = await readingService.invest(childId);
    if (r.data) setAch(r.data);
    setWatered(true);
    readingService.log(sessionId, "reward_granted", { exp: (completed?.expGained ?? 0) + quizExp });
  };

  if (step === "react") {
    return (
      <div className="kpane"><div className="kcard" style={{ textAlign: "center", alignItems: "center" }}>
        <Frog size={120} mood="happy" />
        <h2 className="display">Em đọc xong rồi! Em thấy truyện thế nào?</h2>
        <div className="reactions">
          {REACTIONS.map((r) => <button key={r.id} className="reaction" onClick={() => react(r.id)}><span aria-hidden>{r.emoji}</span>{r.label}</button>)}
        </div>
      </div></div>
    );
  }

  if (step === "quiz" && q) {
    const right = picked !== null && isAnswerCorrect(q, picked);
    if (score) {
      return (
        <div className="kpane"><div className="kcard" style={{ textAlign: "center", alignItems: "center" }}>
          <Frog size={110} mood="happy" />
          <h2 className="display">Em trả lời đúng {score.correct}/{score.total} câu!</h2>
          {quizExp > 0 && <p className="kexp">+{quizExp} ⭐</p>}
          <button className="kbtn primary" onClick={nextAfterQuiz}>Tiếp tục</button>
        </div></div>
      );
    }
    return (
      <div className="kpane"><div className="kcard">
        <div className="row"><span className="kpill">Câu đố {qi + 1}/{quiz.length}</span><span className="grow" />
          <button className="kbtn" onClick={() => narrator.speak([q.question, ...(q.choices ?? [])].join(". "))} aria-label="Nghe câu hỏi"><Volume2 /></button></div>
        <h2 className="display">{q.question}</h2>
        {q.type === "short_answer" ? (
          <form className="row" onSubmit={(e) => { e.preventDefault(); if (typed.trim()) answer(typed); }}>
            <input className="inp kinput" value={typed} disabled={picked !== null} onChange={(e) => setTyped(e.target.value)} placeholder="Em viết câu trả lời nhé" aria-label="Câu trả lời" />
            <button className="kbtn primary" disabled={!typed.trim() || picked !== null}>Trả lời</button>
          </form>
        ) : (
          <div className="kans">
            {(q.choices ?? []).map((c) => {
              const isRight = picked !== null && isAnswerCorrect(q, c);
              return <button key={c} className={`kopt${isRight ? " right" : ""}${picked === c && !isRight ? " wrong" : ""}`} onClick={(e) => answer(c, e.currentTarget)}>{c}</button>;
            })}
          </div>
        )}
        {picked !== null && (
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <b className="display" style={{ fontSize: 18 }}>{right ? "Đúng rồi, giỏi quá!" : `Câu trả lời là: ${q.acceptedAnswers[0]}. Lần sau em sẽ nhớ nhé!`}</b>
            <button className="kbtn primary" onClick={() => void nextQuestion()}>{qi < quiz.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}</button>
          </div>
        )}
      </div></div>
    );
  }

  if (step === "game") {
    const solved = order.length === game.length;
    const correct = solved && order.every((s, i) => s === game[i]);
    return (
      <div className="kpane"><div className="kcard">
        <span className="kpill">Trò chơi: Chuyện gì xảy ra trước?</span>
        <h2 className="display">Em bấm các câu theo đúng thứ tự trong truyện nhé</h2>
        <ol className="seq-order">{order.map((s, i) => <li key={s}><b>{i + 1}</b>{s}</li>)}</ol>
        <div className="kans">
          {pool.map((s) => <button key={s} className="kopt" onClick={() => { setOrder([...order, s]); setPool(pool.filter((x) => x !== s)); }}>{s}</button>)}
        </div>
        {solved && <b className="display" style={{ fontSize: 18 }}>{correct ? "Chính xác! Em nhớ truyện thật giỏi!" : "Gần đúng rồi! Mình thử lại nhé."}</b>}
        <div className="row">
          {solved && !correct && <button className="kbtn" onClick={() => { setOrder([]); setPool(shuffle(game)); }}>Thử lại</button>}
          <span className="grow" />
          <button className={`kbtn${solved ? " primary" : ""}`} onClick={() => setStep("tree")}>{solved ? "Tiếp tục" : "Bỏ qua"}</button>
        </div>
      </div></div>
    );
  }

  // Bước 3.4 — đầu tư EXP vào Cây tri thức.
  const gained = (completed?.expGained ?? 0) + quizExp;
  const treeExp = ach?.knowledgeTreeExp ?? 0;
  const stage = treeStage(treeExp);
  const pending = ach?.pendingExp ?? 0;
  return (
    <div className="kpane"><div className="kcard" style={{ textAlign: "center", alignItems: "center" }}>
      <span className="tree-emoji" aria-hidden>{stage.emoji}</span>
      <h2 className="display">Cây tri thức của em: {stage.label}</h2>
      <div className="kprogress wide" aria-label="Cây lớn tới mốc tiếp theo"><i style={{ width: `${stage.progress * 100}%` }} /></div>
      {stage.next && <p className="sub" style={{ fontSize: 14 }}>Còn {stage.next.min - treeExp} ⭐ nữa để thành {stage.next.label.toLowerCase()}</p>}
      {isRetake && <p className="sub" style={{ fontSize: 14 }}>Lần đọc lại này không nhận thêm sao, nhưng em đã cố gắng rất tốt!</p>}
      {!watered && pending > 0 && <button className="kbtn primary" onClick={() => void water()}>Tưới cây (+{pending} ⭐)</button>}
      {watered && <p className="kexp">Cây đã được tưới!</p>}
      {!isRetake && gained === 0 && pending === 0 && <p className="sub" style={{ fontSize: 14 }}>Em đã đọc truyện này rồi nên lần này không nhận thêm sao.</p>}
      {(completed?.newBadges ?? []).map((b) => <p key={b} className="kbadge">{BADGES[b]?.emoji} Huy hiệu mới: {BADGES[b]?.label ?? b}</p>)}
      <button className="kbtn" onClick={() => onDone(ach)}><Home />Về trang chính</button>
    </div></div>
  );
}
