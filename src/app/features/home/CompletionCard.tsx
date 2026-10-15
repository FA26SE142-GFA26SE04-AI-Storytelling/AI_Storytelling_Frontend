"use client";

import { useEffect, useState } from "react";
import { Check, Volume2 } from "lucide-react";
import { aiStoryCreationService } from "@/app/services/aiStoryCreationService";
import type { ReadCompletion } from "@/app/types/progress";
import type { DiscussionPromptDto } from "@/app/types/aiStory";
import { fmtDateTime } from "@/app/lib/guardian";
import { useNarrator } from "@/app/features/kid/useNarrator";

const REACTION: Record<string, string> = { love: "😍 Rất thích", like: "🙂 Thích", neutral: "😐 Bình thường", dislike: "🙁 Chưa thích" };

/**
 * Luồng 4 Bước 4.3b — thẻ "Con vừa đọc xong": bài học, cảm nhận của con, điểm câu đố (nếu có quyền xem kết quả)
 * và câu hỏi thảo luận để bố mẹ trò chuyện với con. Không hiển thị cho bé.
 */
export default function CompletionCard({ item, nickname, lesson, showResults, onSeen }: {
  item: ReadCompletion;
  nickname: string;
  lesson: string | null;
  showResults: boolean;
  onSeen: () => void;
}) {
  const [questions, setQuestions] = useState<DiscussionPromptDto[] | null>(null);
  const narrator = useNarrator();

  useEffect(() => {
    void aiStoryCreationService.getDiscussionReview(item.storyId).then((r) => setQuestions(r.data?.items ?? []));
  }, [item.storyId]);

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
      {questions && questions.length > 0 && (
        <ul className="done-q">
          {questions.slice(0, 3).map((q, i) => <li key={q.id ?? i}>{item.reaction === "love" && i === 0 ? `Con nói rất thích truyện này — ${q.question.charAt(0).toLowerCase()}${q.question.slice(1)}` : q.question}</li>)}
        </ul>
      )}
      <div className="row">
        <button className="btn btn-g" onClick={() => (narrator.speaking ? narrator.stop() : narrator.speak(summary))}><Volume2 className="ic" />{narrator.speaking ? "Dừng" : "Nghe tóm tắt"}</button>
        <span className="grow" />
        {!item.seen && <button className="btn btn-s" onClick={onSeen}><Check className="ic" />Đã trò chuyện với con</button>}
      </div>
    </div>
  );
}
