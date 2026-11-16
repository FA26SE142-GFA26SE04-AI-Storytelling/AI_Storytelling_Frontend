"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { parentReadingFeedbackService } from "@/app/services/childReadingService";
import type { ParentQuizDetail } from "@/app/types/childReading";
import { showToast } from "@/app/lib/toast";

export default function QuizDetailDialog({
  childId,
  sessionId,
  title,
  onClose,
}: {
  childId: number;
  sessionId: number;
  title: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<ParentQuizDetail | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    parentReadingFeedbackService.quiz(childId, sessionId, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      if (r.success) {
        setData(r.data);
      } else {
        showToast(r.message, "err");
        onClose();
      }
    });
    return () => {
      controller.abort();
    };
  }, [childId, sessionId, onClose]);

  return (
    <Dialog title={"Câu đố · " + title} onClose={onClose} wide>
      {data == null ? (
        <p className="sub">Đang tải…</p>
      ) : (
        <>
          {data.runs && data.runs.length > 0 && (
            <>
              <b className="lr-sum-h">Các lần làm</b>
              <div className="chips lr-quiz-runs">
                {data.runs.slice(-10).reverse().map((run) => {
                  const percent = Math.round(run.percent);
                  const pillClass = percent >= 80 ? "ok" : percent >= 50 ? "wait" : "flag";
                  return (
                    <span key={run.runNo} className={`pill ${pillClass}`}>
                      Lần {run.runNo}: {percent}%
                    </span>
                  );
                })}
                {data.runs.length > 10 && (
                  <span className="pill draft">+{data.runs.length - 10} lần trước</span>
                )}
              </div>
            </>
          )}

          <ol className="lr-q-list">
            {data.questions.map((q) => (
              <li key={q.quizItemId} className="lr-q-item">
                <b>{q.question}</b>
                {q.type === "MultipleChoice" || q.type === "TrueFalse" ? (
                  <div className="chips">
                    {q.choices.map((choice, i) => {
                      const isCorrect = choice === q.correctAnswer;
                      const isWrong = choice === q.latestAnswer && q.latestIsCorrect === false;
                      const chipClass = `chip${isCorrect ? " on" : ""}${isWrong ? " block" : ""}`;
                      return (
                        <span key={i} className={chipClass}>
                          {isCorrect && <Check className="ic" aria-hidden="true" />}
                          {isWrong && <X className="ic" aria-hidden="true" />}
                          {choice}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <p className="sub">Bé trả lời: {q.latestAnswer ?? "—"}</p>
                    <p className="sub">Đáp án: {q.correctAnswer ?? "—"}</p>
                  </>
                )}
                {q.timesAnswered === 0 ? (
                  <span className="pill draft">Bé chưa trả lời</span>
                ) : (
                  <span className={`pill ${q.latestIsCorrect ? "ok" : "draft"}`}>Đúng {q.timesCorrect}/{q.timesAnswered} lần</span>
                )}
                {q.explanation != null && (
                  <p className="lr-q-explain">{q.explanation}</p>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </Dialog>
  );
}
