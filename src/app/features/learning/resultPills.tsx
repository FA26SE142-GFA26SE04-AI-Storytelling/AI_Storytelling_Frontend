import type { ParentReadingFeedbackItem } from "@/app/types/childReading";
import { EMOTION_FACE, FEELING_FACE } from "./learningData";

/** Nhãn điểm câu đố: "Không có câu đố", "Chưa làm" hoặc phần trăm tốt nhất. */
export function quizPill(i: ParentReadingFeedbackItem) {
  if (i.quizTotalQuestions === 0) return null;
  if (i.quizBestPercent == null) return <span className="pill draft">Chưa làm câu đố</span>;
  const p = Math.round(i.quizBestPercent);
  return p >= 80 ? <span className="pill gold-pill">⭐ Câu đố {p}%</span> : <span className={`pill ${p >= 50 ? "wait" : "flag"}`}>Câu đố {p}%</span>;
}

/** Mức thích (4 mức) và 0–2 cảm xúc bé chọn sau khi đọc. */
export function feelingPill(i: ParentReadingFeedbackItem) {
  return (
    <>
      {i.feeling && <span className="pill draft">{FEELING_FACE[i.feeling] ?? ""} {i.feelingLabel ?? i.feeling}</span>}
      {(i.emotions ?? []).map((e) => <span key={e.code} className="pill wait">{EMOTION_FACE[e.code] ?? ""} {e.label}</span>)}
    </>
  );
}
