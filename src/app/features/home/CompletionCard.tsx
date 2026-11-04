"use client";

import { Check, Volume2 } from "lucide-react";
import type { ReadCompletion } from "@/app/types/progress";
import { fmtDateTime } from "@/app/lib/guardian";
import { useNarrator } from "@/app/features/kid/useNarrator";

const REACTION: Record<string, string> = { love: "😍 Rất thích", like: "🙂 Thích", neutral: "😐 Bình thường", dislike: "🙁 Chưa thích" };

/**
 * Thẻ "Con vừa đọc xong": bài học, cảm nhận của con và điểm câu đố khi có quyền xem kết quả.
 */
export default function CompletionCard({ item, nickname, lesson, showResults, onSeen }: {
  item: ReadCompletion;
  nickname: string;
  lesson: string | null;
  showResults: boolean;
  onSeen: () => void;
}) {
  const narrator = useNarrator();


  const summary = `${nickname} vừa đọc xong truyện ${item.title}.${lesson ? ` Bài học của truyện: ${lesson}.` : ""}`;

  return (
    <div className={`done-card${item.seen ? " seen" : ""}`}>
      <div className="row">
        <b className="grow">{item.title}</b>
        <small className="sub">{fmtDateTime(item.completedAt)}</small>
      </div>
      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        {lesson && <span className="pill ai">Bài học: {lesson}</span>}
        {item.reaction && <span className="pill draft">Con thấy: {REACTION[item.reaction]}</span>}
        {showResults && item.quizTotal ? <span className={`pill ${item.quizCorrect! / item.quizTotal >= 0.7 ? "ok" : "wait"}`}>Câu đố {item.quizCorrect}/{item.quizTotal}</span> : null}
      </div>
      <div className="row">
        <button className="btn btn-g" onClick={() => (narrator.speaking ? narrator.stop() : narrator.speak(summary))}><Volume2 className="ic" />{narrator.speaking ? "Dừng" : "Nghe tóm tắt"}</button>
        <span className="grow" />
        {!item.seen && <button className="btn btn-s" onClick={onSeen}><Check className="ic" />Đã trò chuyện với con</button>}
      </div>
    </div>
  );
}
