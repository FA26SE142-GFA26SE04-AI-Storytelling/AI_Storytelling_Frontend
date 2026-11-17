"use client";

import { useEffect } from "react";
import { BookOpenCheck, Clock, Smile, Sparkles, Star } from "lucide-react";
import { useRiseIn } from "@/app/lib/motion";
import { showToast } from "@/app/lib/toast";
import type { ReadingFeedbackFilter } from "@/app/types/childReading";
import { EMOTION_FACE, EMOTION_KEYS, EMOTION_LABEL, FEELING_FACE, useReadingOverview } from "./learningData";

const FEELING_KEYS = ["VeryLike", "Like", "Neutral", "Dislike"] as const;

function formatTime(sec: number): string {
  if (sec < 60) return "dưới 1 phút";
  if (sec < 3600) {
    const mins = Math.max(1, Math.floor(sec / 60));
    return `${mins} phút`;
  }
  const hours = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  return mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
}

export default function ReadingOverview({
  childId,
  range,
}: {
  childId: number;
  range: ReadingFeedbackFilter["range"];
}) {
  const o = useReadingOverview(childId, range);
  const ref = useRiseIn<HTMLDivElement>(".lr-tile", [o.data]);

  useEffect(() => {
    if (o.error) showToast(o.error, "err");
  }, [o.error]);

  const d = o.data;
  const emotions = d ? EMOTION_KEYS.map((k) => ({ k, n: d.emotionCounts?.[k] ?? 0 })).filter((e) => e.n > 0) : [];

  return (
    <div ref={ref} className="lr-overview">
      <div className="lr-tiles">
        <div className="lr-tile lr-tile-static">
          <BookOpenCheck className="ic" aria-hidden />
          <b className="display">{d ? d.completedSessions : "…"}</b>
          <span>Lần đọc xong</span>
        </div>

        <div className="lr-tile lr-tile-static">
          <Clock className="ic" aria-hidden />
          <b className="display">{d ? formatTime(d.totalTimeSpentSeconds) : "…"}</b>
          <span>Thời gian đọc</span>
        </div>

        <div className="lr-tile lr-tile-static">
          <Star className="ic" aria-hidden />
          <b className="display">
            {d
              ? d.averageQuizBestPercent != null
                ? `${Math.round(d.averageQuizBestPercent)}%`
                : "—"
              : "…"}
          </b>
          <span>Điểm câu đố TB</span>
        </div>

        <div className="lr-tile lr-tile-static">
          <Sparkles className="ic" aria-hidden />
          <b className="display">{d ? `+${d.expEarned}` : "…"}</b>
          <span>EXP nhận</span>
        </div>
      </div>

      <div className="lr-pills">
        {d && (
          <>
            {FEELING_KEYS.map((key) => {
              const count = d.feelingCounts[key] ?? 0;
              return count > 0 ? (
                <span key={key} className="pill draft">
                  {FEELING_FACE[key]} {count}
                </span>
              ) : null;
            })}
            <span className="pill ai">{d.wordsCollected} từ mới</span>
            {d.readAloudGoodPercent != null && (
              <span className={`pill ${d.readAloudGoodPercent >= 80 ? "ok" : d.readAloudGoodPercent >= 50 ? "wait" : "flag"}`}>
                Đọc to tốt {Math.round(d.readAloudGoodPercent)}%
              </span>
            )}
            <span className="pill draft">{d.retellCount} lần kể lại</span>
            {d.unfinishedStories > 0 && (
              <span className="pill wait">
                {d.unfinishedStories} truyện đang dở
              </span>
            )}
          </>
        )}
      </div>

      {d && (
        <div className="lr-emotions">
          <b className="lr-sum-h"><Smile className="ic" aria-hidden />Cảm xúc của bé</b>
          {emotions.length === 0 ? (
            <span className="sub">Bé chưa chọn cảm xúc nào</span>
          ) : (
            emotions.map(({ k, n }) => (
              <span key={k} className="pill wait">{EMOTION_FACE[k]} {EMOTION_LABEL[k]} <b>{n}</b></span>
            ))
          )}
        </div>
      )}
    </div>
  );
}
