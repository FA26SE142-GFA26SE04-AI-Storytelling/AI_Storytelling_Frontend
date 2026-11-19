import { BookMarked, MessageCircleHeart } from "lucide-react";
import type { ParentReadingFeedbackItem } from "@/app/types/childReading";

export function SessionWords({ item }: { item: ParentReadingFeedbackItem }) {
  const words = item.wordsCollected ?? [];
  const answers = item.conversationAnswers ?? [];

  if (words.length === 0 && answers.length === 0) return null;

  return (
    <>
      {words.length > 0 && (
        <div className="lr-sum-part">
          <b className="lr-sum-h">
            <BookMarked className="ic" aria-hidden />
            Từ mới
          </b>
          <div className="chips">
            {words.map((w) => (
              <span className="chip" key={w.vocabularyId}>{w.term}</span>
            ))}
          </div>
        </div>
      )}

      {answers.length > 0 && (
        <div className="lr-sum-part">
          <b className="lr-sum-h">
            <MessageCircleHeart className="ic" aria-hidden />
            Bé trả lời
          </b>
          <ul className="lr-answers">
            {answers.map((a, i) => (
              <li key={i}>
                <span className="lr-q">
                  {a.sceneIndex != null && <span className="pill draft">Cảnh {a.sceneIndex + 1}</span>}
                  {a.question}
                </span>
                <b className="lr-a">“{a.answerText}”</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default SessionWords;
