"use client";

import { BookOpen, BookOpenCheck, ChevronRight, Mic, Route, Sparkles } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import { fmtDate } from "@/app/lib/guardian";
import type { ChildProfile } from "@/app/types/childProfile";
import type { RoadmapItem } from "@/app/types/progress";
import { useStoryCovers } from "@/app/features/roadmap/roadmapData";
import { shortDate, splitRoadmap, useReadingFeedback, useStorySummaries } from "./learningData";
import { feelingPill, quizPill } from "./ResultsTab";
import type { LearningTabId } from "./LearningWorkspace";

/** Tab "Tổng quan": bé đang đọc gì, đã đọc bao nhiêu, kết quả gần đây và việc bố mẹ cần xem. */
export default function OverviewTab({ child, items, wishCount, onTab }: {
  child: ChildProfile;
  items: RoadmapItem[] | undefined;
  wishCount: number | null;
  onTab: (t: LearningTabId) => void;
}) {
  const { done, open, queued, total } = splitRoadmap(items);
  const feedback = useReadingFeedback(child.id, 1, 3);
  const summaries = useStorySummaries(child.id, 1, 1);
  const next = queued.slice(0, 3);
  const cover = useStoryCovers([...(open ? [open] : []), ...next].map((i) => i.storyId));
  const percent = total ? Math.round((done.length / total) * 100) : 0;

  const tiles: { id: LearningTabId; icon: typeof Route; label: string; value: string; alert?: boolean }[] = [
    { id: "roadmap", icon: Route, label: "Lộ trình", value: items === undefined ? "…" : `${done.length}/${total}` },
    { id: "results", icon: BookOpenCheck, label: "Đã đọc xong", value: feedback.data ? String(feedback.data.totalCount) : "…" },
    { id: "results", icon: Mic, label: "Bé kể lại", value: summaries.data ? String(summaries.data.totalCount) : "…" },
    { id: "wishes", icon: Sparkles, label: "Điều ước chờ", value: wishCount === null ? "…" : String(wishCount), alert: !!wishCount },
  ];

  return (
    <>
      <div className="lr-tiles">
        {tiles.map((t) => (
          <button key={t.label} className={`lr-tile${t.alert ? " alert" : ""}`} onClick={() => onTab(t.id)}>
            <t.icon className="ic" aria-hidden />
            <b className="display">{t.value}</b>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <section className="lr-card lr-card-now">
        <div className="lr-card-h">
          <h3 className="display">Đang đọc</h3>
          <button className="btn btn-g" onClick={() => onTab("roadmap")}>Xem lộ trình<ChevronRight className="ic" /></button>
        </div>
        {items === undefined ? <p className="sub">Đang tải…</p> : !open ? (
          <div className="lr-empty">
            <Frog size={72} mood="think" />
            <b>{total ? `${child.nickname} đã đọc hết lộ trình` : "Lộ trình đang trống"}</b>
            <button className="btn btn-p" onClick={() => onTab("roadmap")}><Route className="ic" />Thêm truyện</button>
          </div>
        ) : (
          <div className="lr-now">
            <span className="lr-now-cover" style={{ background: cover(open.storyId) }} aria-hidden />
            <div className="lr-now-body">
              <b className="display lr-now-title">{open.title}</b>
              <div className="lr-pills">
                <span className="pill wait"><BookOpen className="ic" aria-hidden />Đang đọc</span>
                {open.dueAt && <span className={`pill ${Date.parse(open.dueAt) < Date.now() ? "flag" : "draft"}`}>Hạn {fmtDate(open.dueAt)}</span>}
              </div>
              <div className="rm-progress">
                <div className="rm-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done.length} aria-label="Tiến độ lộ trình"><i style={{ width: `${percent}%` }} /></div>
                <b>{done.length}/{total}</b>
              </div>
              {next.length > 0 && (
                <div className="lr-next" aria-label="Truyện tiếp theo">
                  {next.map((n) => (
                    <span key={n.id} className="lr-next-item" title={n.title}>
                      <span className="rm-step-cover" style={{ background: cover(n.storyId) }} aria-hidden />
                      <span>{n.title}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="lr-card">
        <div className="lr-card-h">
          <h3 className="display">Mới đọc xong</h3>
          {!!feedback.data?.items.length && <button className="btn btn-g" onClick={() => onTab("results")}>Xem tất cả<ChevronRight className="ic" /></button>}
        </div>
        {!feedback.data ? <p className="sub">{feedback.error || "Đang tải…"}</p>
          : feedback.data.items.length === 0 ? <p className="rm-empty">{child.nickname} chưa đọc xong truyện nào.</p>
          : (
            <ul className="lr-list">
              {feedback.data.items.map((i) => (
                <li key={i.sessionId} className="lr-result">
                  <div className="lr-result-h">
                    <b className="grow">{i.title}</b>
                    {feelingPill(i)}
                    {quizPill(i)}
                    <span className="pill draft">{shortDate(i.completedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </section>
    </>
  );
}
