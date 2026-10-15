"use client";

import { Check, Sparkles } from "lucide-react";
import type { DiscussionPromptDto, QuizQuestionDto, ReviewArtifact, VocabularyItemDto } from "@/app/types/aiStory";

export type ArtifactKind = Exclude<ReviewArtifact, "story">;

export const ARTIFACT_LABEL: Record<ArtifactKind, string> = {
  vocabulary: "Từ vựng",
  quiz: "Câu hỏi đọc hiểu",
  discussion: "Gợi ý thảo luận",
};

const QUIZ_TYPE: Record<string, string> = {
  multiple_choice: "Trắc nghiệm",
  true_false: "Đúng / Sai",
  short_answer: "Trả lời ngắn",
};

const same = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** Danh sách học liệu chỉ đọc; dùng cho tab học liệu và cho thẻ đề xuất của AI. */
export function ArtifactItems({ kind, items }: { kind: ArtifactKind; items: unknown[] }) {
  if (items.length === 0) return <p className="sub">Chưa có mục nào.</p>;
  if (kind === "vocabulary") {
    return (
      <div className="art-list">
        {(items as VocabularyItemDto[]).map((v, i) => <div key={v.id ?? `${v.term}-${i}`} className="voc-i"><b>{v.term}</b><span>{v.definition}</span></div>)}
      </div>
    );
  }
  if (kind === "quiz") {
    return (
      <ol className="art-list quiz-list">
        {(items as QuizQuestionDto[]).map((q, i) => (
          <li key={q.id ?? i}>
            <div className="row"><b className="grow">{q.question}</b><span className="pill draft">{QUIZ_TYPE[q.type] ?? q.type}</span></div>
            {q.choices && q.choices.length > 0 ? (
              <ul className="choices">
                {q.choices.map((c, j) => <li key={j} className={same(c, q.correctAnswer) ? "right" : ""}>{same(c, q.correctAnswer) && <Check />}{c}</li>)}
              </ul>
            ) : q.correctAnswer && <p className="sub">Đáp án: {q.correctAnswer}</p>}
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ul className="art-list disc-list">
      {(items as DiscussionPromptDto[]).map((d, i) => (
        <li key={d.id ?? i}>{d.question}{d.isMoralLesson && <span className="pill ai"><Sparkles />Bài học</span>}</li>
      ))}
    </ul>
  );
}
