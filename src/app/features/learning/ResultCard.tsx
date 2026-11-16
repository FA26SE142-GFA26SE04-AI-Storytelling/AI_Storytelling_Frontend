"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, Clock, FileText, Headphones, Repeat, Sparkles } from "lucide-react";
import type { ParentReadingFeedbackItem } from "@/app/types/childReading";
import { FEELING_FACE, shortDate } from "./learningData";
import ResultDetail from "./ResultDetail";

/** Nhãn điểm câu đố: "Không có câu đố", "Chưa làm" hoặc phần trăm tốt nhất. */
export function quizPill(i: ParentReadingFeedbackItem) {
  if (i.quizTotalQuestions === 0) return null;
  if (i.quizBestPercent == null) return <span className="pill draft">Chưa làm câu đố</span>;
  const p = Math.round(i.quizBestPercent);
  return p >= 80 ? <span className="pill gold-pill">⭐ Câu đố {p}%</span> : <span className={`pill ${p >= 50 ? "wait" : "flag"}`}>Câu đố {p}%</span>;
}

export function feelingPill(i: ParentReadingFeedbackItem) {
  return i.feeling ? <span className="pill draft">{FEELING_FACE[i.feeling] ?? ""} {i.feelingLabel ?? i.feeling}</span> : null;
}

export default function ResultCard({
  item,
  childId,
}: {
  item: ParentReadingFeedbackItem;
  childId: number;
}) {
  const [open, setOpen] = useState(false);

  const {
    title,
    completedAt,
    startedAt,
    timeSpentSeconds,
    pagesCompleted,
    totalPages,
    readOrdinal,
    expEarned,
    readingMode,
    status,
    laterCompleted,
    readAloud,
    wordsCollected,
    quizTotalQuestions,
    quizRunCount,
    conversationAnswers,
    retell,
  } = item;

  const timeText =
    timeSpentSeconds < 60
      ? `${timeSpentSeconds} giây`
      : `${Math.max(1, Math.round(timeSpentSeconds / 60))} phút`;

  const percent = totalPages > 0 ? Math.min(100, Math.max(0, (pagesCompleted / totalPages) * 100)) : 0;

  const hasDetail =
    readAloud !== null ||
    (wordsCollected != null && wordsCollected.length > 0) ||
    (quizTotalQuestions > 0 && quizRunCount > 0) ||
    (conversationAnswers != null && conversationAnswers.length > 0) ||
    retell !== null;

  return (
    <li className="lr-result">
      <div className="lr-result-h">
        <b className="grow">{title}</b>
        {feelingPill(item)}
        {quizPill(item)}
        <span className="pill draft">{shortDate(completedAt ?? startedAt)}</span>
      </div>

      <div className="lr-pills">
        <span className="pill draft">
          <Clock className="ic" aria-hidden />
          {timeText}
        </span>
        {totalPages > 0 && (
          <span className="pill draft">
            <FileText className="ic" aria-hidden />
            {pagesCompleted}/{totalPages} trang
          </span>
        )}
        {readOrdinal != null && readOrdinal >= 2 && (
          <span className="pill draft">
            <Repeat className="ic" aria-hidden />
            Lần {readOrdinal}
          </span>
        )}
        {expEarned > 0 && (
          <span className="pill gold-pill">
            <Sparkles className="ic" aria-hidden />
            +{expEarned} EXP
          </span>
        )}
        {readingMode === "ListenFirst" && (
          <span className="pill draft">
            <Headphones className="ic" aria-hidden />
            Nghe là chính
          </span>
        )}
        {readingMode === "ReadFirst" && (
          <span className="pill draft">
            <BookOpen className="ic" aria-hidden />
            Tự đọc
          </span>
        )}
      </div>

      {status !== "Completed" && (
        <>
          {totalPages > 0 && (
            <div className="rm-progress">
              <div
                className="rm-progress-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={totalPages}
                aria-valuenow={pagesCompleted}
                aria-label="Tiến độ đọc"
              >
                <i style={{ width: percent + "%" }} />
              </div>
              <b>{pagesCompleted}/{totalPages}</b>
            </div>
          )}
          {laterCompleted && <span className="pill ok">Đã đọc xong sau đó</span>}
          {(status === "Abandoned" || status === "ForceExited") && (
            <span className="pill flag">Đã dừng giữa chừng</span>
          )}
        </>
      )}

      {hasDetail && (
        <button
          type="button"
          className="btn btn-g lr-more"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          Chi tiết <ChevronDown className="ic" style={{ transform: open ? "rotate(180deg)" : undefined }} />
        </button>
      )}

      {open && <ResultDetail item={item} childId={childId} />}
    </li>
  );
}
