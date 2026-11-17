import { useCallback, useState } from "react";
import { BookMarked, CircleHelp, MessageCircleHeart, MessageSquareQuote, Mic } from "lucide-react";
import QuizDetailDialog from "./QuizDetailDialog";
import type { ParentReadingFeedbackItem } from "@/app/types/childReading";

export default function ResultDetail({
  item,
  childId,
}: {
  item: ParentReadingFeedbackItem;
  childId: number;
}) {
  const [quizOpen, setQuizOpen] = useState(false);
  const closeQuiz = useCallback(() => setQuizOpen(false), []);

  const words = item.wordsCollected ?? [];
  const answers = item.conversationAnswers ?? [];
  const ra = item.readAloud;
  const rt = item.retell;

  return (
    <div className="lr-detail">
      {ra && (
        <div className="lr-sum-part">
          <b className="lr-sum-h"><Mic className="ic" aria-hidden />Đọc to</b>
          <p>{ra.segmentsPracticed} đoạn · {ra.attempts} lần thử</p>
          <div className="rm-progress">
            <div
              className="rm-progress-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={ra.goodPercent}
              aria-label="Tỉ lệ chữ đọc tốt"
            >
              <i style={{ width: ra.goodPercent + "%" }} />
            </div>
          </div>
          <span>{ra.goodPercent}% chữ đọc tốt</span>
          <span className="pill wait">{ra.retryWords} chữ cần đọc lại</span>
        </div>
      )}

      {words.length > 0 && (
        <div className="lr-sum-part">
          <b className="lr-sum-h"><BookMarked className="ic" aria-hidden />Từ mới</b>
          <div className="chips">
            {words.map((w) => (
              <span className="chip" key={w.vocabularyId}>{w.term}</span>
            ))}
          </div>
        </div>
      )}

      {item.quizTotalQuestions > 0 && item.quizRunCount > 0 && (
        <div className="lr-sum-part">
          <b className="lr-sum-h"><CircleHelp className="ic" aria-hidden />Câu đố</b>
          <p>{item.quizRunCount} lần làm · gần nhất {item.quizLatestPercent ?? "—"}%</p>
          <button type="button" className="btn btn-g" onClick={() => setQuizOpen(true)}>
            Xem câu đố
          </button>
          {quizOpen && (
            <QuizDetailDialog
              childId={childId}
              sessionId={item.sessionId}
              title={item.title}
              onClose={closeQuiz}
            />
          )}
        </div>
      )}

      {answers.length > 0 && (
        <div className="lr-sum-part">
          <b className="lr-sum-h"><MessageCircleHeart className="ic" aria-hidden />Bé trả lời</b>
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

      {rt && (
        <div className="lr-sum-part">
          <b className="lr-sum-h"><MessageSquareQuote className="ic" aria-hidden />Kể lại</b>
          {rt.hasRecording ? (
            <span className="pill ok">Có ghi âm</span>
          ) : (
            <span className="pill draft">Chưa ghi âm</span>
          )}
          {rt.flagCount > 0 && (
            <span className="pill draft">{rt.flagCount} câu hỏi</span>
          )}
          {rt.unansweredCount > 0 && (
            <span className="pill wait">{rt.unansweredCount} chưa trả lời</span>
          )}
        </div>
      )}
    </div>
  );
}
