"use client";

import { useCallback, useState } from "react";
import { BookOpen, ChevronDown, Clock, FileText, Headphones, Heart, MessageCircleHeart, Repeat, Sparkles } from "lucide-react";
import type { ParentReadingFeedbackItem } from "@/app/types/childReading";
import { EMOTION_FACE, FEELING_FACE, shortDate } from "./learningData";
import ReadAloudDialog from "./ReadAloudDialog";
import ReflectionDialog from "./ReflectionDialog";
import ResultDetail from "./ResultDetail";

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

export default function ResultCard({
  item,
  childId,
}: {
  item: ParentReadingFeedbackItem;
  childId: number;
}) {
  const [open, setOpen] = useState(false);
  const [popup, setPopup] = useState<"read" | "feel" | null>(null);
  // Cập nhật tại chỗ sau khi xoá trong popup, không tải lại cả danh sách.
  const [recCount, setRecCount] = useState(item.readAloudRecordingCount ?? 0);
  const [hasNote, setHasNote] = useState(!!(item.reflection && (item.reflection.hasNoteText || item.reflection.hasNoteRecording)));
  const closePopup = useCallback(() => setPopup(null), []);
  const onRecRemoved = useCallback(() => setRecCount((n) => Math.max(0, n - 1)), []);
  const onNoteRemoved = useCallback(() => setHasNote(false), []);

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
    readAloudPractice,
    reflection,
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

  const hasFeeling = (item.emotions?.length ?? 0) > 0 || reflection != null;
  const hasDetail =
    readAloud != null ||
    readAloudPractice != null ||
    (wordsCollected != null && wordsCollected.length > 0) ||
    (quizTotalQuestions > 0 && quizRunCount > 0) ||
    (conversationAnswers != null && conversationAnswers.length > 0) ||
    retell !== null;

  return (
    <li className="lr-result">
      <div className="lr-result-h">
        <b className="grow">{title}</b>
        {feelingPill(item)}
        {hasNote && <span className="pill gold-pill"><MessageCircleHeart className="ic" aria-hidden />Bé gửi lời</span>}
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

      {(hasDetail || recCount > 0 || hasFeeling) && (
        <div className="lr-actions">
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
          {recCount > 0 && (
            <button type="button" className="btn btn-s" aria-label={`Nghe bé đọc (${recCount} bản ghi)`} onClick={() => setPopup("read")}>
              <Headphones className="ic" aria-hidden />Nghe bé đọc<b className="lr-count">{recCount}</b>
            </button>
          )}
          {hasFeeling && (
            <button type="button" className="btn btn-s" onClick={() => setPopup("feel")}>
              <Heart className="ic" aria-hidden />Cảm nhận
            </button>
          )}
        </div>
      )}
      {popup === "read" && <ReadAloudDialog childId={childId} sessionId={item.sessionId} title={title} onClose={closePopup} onRemoved={onRecRemoved} />}
      {popup === "feel" && <ReflectionDialog childId={childId} sessionId={item.sessionId} title={title} onClose={closePopup} onNoteRemoved={onNoteRemoved} />}

      {open && <ResultDetail item={item} childId={childId} />}
    </li>
  );
}
