"use client";

import { useCallback, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CircleHelp,
  Clock,
  FileText,
  Headphones,
  Heart,
  Mic,
  Repeat,
  Sparkles,
} from "lucide-react";
import { useRiseIn } from "@/app/lib/motion";
import type { ParentReadingFeedbackItem } from "@/app/types/childReading";
import { FEELING_FACE, shortDate } from "./learningData";
import { quizPill } from "./resultPills";
import { ReflectionBody } from "./ReflectionDialog";
import { ReadAloudBody } from "./ReadAloudDialog";
import QuizDetailDialog from "./QuizDetailDialog";
import SessionRetell from "./SessionRetell";
import { SessionWords } from "./SessionWords";

export interface SessionDetailProps {
  item: ParentReadingFeedbackItem;
  childId: number;
  nickname: string;
  onBack: () => void;
}

/** Trang chi tiết một lần đọc (thay cho danh sách ở tab Kết quả đọc). */
export default function SessionDetail({
  item,
  childId,
  nickname,
  onBack,
}: SessionDetailProps) {
  const title = item.title;
  const ref = useRiseIn<HTMLElement>(".lr-sum-part", [item.sessionId], { delay: 50, distance: 10 });
  const [quizOpen, setQuizOpen] = useState(false);
  const closeQuiz = useCallback(() => setQuizOpen(false), []);
  const noop = useCallback(() => {}, []);

  const {
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
    quizTotalQuestions,
    quizRunCount,
    quizLatestPercent,
  } = item;

  const timeText =
    timeSpentSeconds < 60
      ? `${timeSpentSeconds} giây`
      : `${Math.max(1, Math.round(timeSpentSeconds / 60))} phút`;

  const percent = totalPages > 0 ? Math.min(100, Math.max(0, (pagesCompleted / totalPages) * 100)) : 0;
  const hasFeeling = reflection != null || (item.emotions?.length ?? 0) > 0 || !!item.feeling;
  const recCount = item.readAloudRecordingCount ?? 0;
  const pageTitle = readOrdinal != null ? `${title} · Lần ${readOrdinal}` : title;

  return (
    <section ref={ref} className="lr-card">
      <div className="lr-card-h">
        <button type="button" className="btn btn-g" onClick={onBack}>
          <ArrowLeft className="ic" aria-hidden />
          Kết quả đọc
        </button>
        <h3 className="display">{pageTitle}</h3>
      </div>
      <div className="lr-sum-part">
        <b className="lr-sum-h">
          <BookOpen className="ic" aria-hidden />
          Tóm tắt
        </b>
        <div className="lr-pills">
          {Number.isFinite(timeSpentSeconds) && (
            <span className="pill draft">
              <Clock className="ic" aria-hidden />
              {timeText}
            </span>
          )}
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
          <span className="pill draft">{shortDate(completedAt ?? startedAt)}</span>
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
      </div>

      {hasFeeling && (
        <div className="lr-sum-part">
          <b className="lr-sum-h">
            <Heart className="ic" aria-hidden />
            Cảm nhận
          </b>
          {/* Chỉ mức thích; cảm xúc đã có trong phần chi tiết bên dưới. */}
          {item.feeling && (
            <div className="chips">
              <span className="pill draft">{FEELING_FACE[item.feeling] ?? ""} {item.feelingLabel ?? item.feeling}</span>
            </div>
          )}
          <ReflectionBody childId={childId} sessionId={item.sessionId} onNoteRemoved={noop} />
        </div>
      )}

      {(readAloud != null || readAloudPractice != null || recCount > 0) && (
        <div className="lr-sum-part">
          <b className="lr-sum-h">
            <Mic className="ic" aria-hidden />
            Đọc to
          </b>
          {readAloud && (
            <>
              <p>{readAloud.segmentsPracticed} đoạn · {readAloud.attempts} lần thử</p>
              <div className="rm-progress">
                <div
                  className="rm-progress-bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={readAloud.goodPercent}
                  aria-label="Tỉ lệ chữ đọc tốt"
                >
                  <i style={{ width: readAloud.goodPercent + "%" }} />
                </div>
              </div>
              <span>{readAloud.goodPercent}% chữ đọc tốt</span>
              <span className="pill wait">{readAloud.retryWords} chữ cần đọc lại</span>
            </>
          )}
          {readAloudPractice && (
            <div className="chips">
              <span className="pill draft">Luyện đọc · {readAloudPractice.attempts} lần</span>
              <span className="pill wait">Gần nhất {Math.round(readAloudPractice.latestGoodPercent)}%</span>
              <span className="pill gold-pill">Tốt nhất {Math.round(readAloudPractice.bestGoodPercent)}%</span>
            </div>
          )}
          {recCount > 0 && (
            <ReadAloudBody childId={childId} sessionId={item.sessionId} onRemoved={noop} />
          )}
        </div>
      )}

      {quizTotalQuestions > 0 && (
        <div className="lr-sum-part">
          <b className="lr-sum-h">
            <CircleHelp className="ic" aria-hidden />
            Câu đố
          </b>
          {quizRunCount === 0 ? (
            <p className="sub">Bé chưa làm câu đố</p>
          ) : (
            <>
              <p>{quizRunCount} lần làm</p>
              <div className="chips">
                {quizPill(item)}
                {quizLatestPercent != null && (
                  <span className={`pill ${Math.round(quizLatestPercent) >= 80 ? "ok" : Math.round(quizLatestPercent) >= 50 ? "wait" : "flag"}`}>
                    Gần nhất {Math.round(quizLatestPercent)}%
                  </span>
                )}
              </div>
              <button type="button" className="btn btn-g" onClick={() => setQuizOpen(true)}>
                <CircleHelp className="ic" aria-hidden />
                Xem câu đố
              </button>
              {quizOpen && (
                <QuizDetailDialog
                  childId={childId}
                  sessionId={item.sessionId}
                  title={title}
                  onClose={closeQuiz}
                />
              )}
            </>
          )}
        </div>
      )}

      <SessionWords item={item} />

      <SessionRetell childId={childId} item={item} nickname={nickname} />
    </section>
  );
}
