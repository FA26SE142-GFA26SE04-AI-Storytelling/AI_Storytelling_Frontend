"use client";

import { statusKey, type StoryCard } from "@/app/lib/storyView";
import type { WorkspaceProps } from "@/app/components/shell/nav";

/** Trạng thái đang chờ phụ huynh làm tiếp trong Studio (truyện chờ duyệt nội dung đã nằm ở "Cần xử lý"). */
const NEEDS_YOU = new Set(["outline_review", "media_review"]);
/** Trạng thái AI đang làm: chỉ cần theo dõi. */
const AI_WORKING = new Set(["input_accepted", "generating", "media_processing", "moderation_review"]);
const MAX = 4;

/** Các truyện chờ bạn làm tiếp hoặc AI đang làm, mới nhất trước. */
export function inProgress(stories: StoryCard[]) {
  return stories
    .filter((s) => { const k = statusKey(s.raw); return NEEDS_YOU.has(k) || AI_WORKING.has(k); })
    .sort((a, b) => Date.parse(b.raw.updatedAt ?? b.createdAt) - Date.parse(a.raw.updatedAt ?? a.createdAt));
}

export const needsYouCount = (stories: StoryCard[]) => stories.filter((s) => NEEDS_YOU.has(statusKey(s.raw))).length;

/** "Truyện đang dở dang": bấm là mở lại Studio đúng truyện đó (resumeStoryId). */
export default function InProgressStories({ stories, go }: { stories: StoryCard[]; go: WorkspaceProps["go"] }) {
  const list = inProgress(stories);
  if (!list.length) return null;

  return (
    <div className="dash-block wide">
      <h3>Truyện đang dở dang <span className="pill draft">{list.length}</span></h3>
      <div className="wip-list">
        {list.slice(0, MAX).map((s) => {
          const mine = NEEDS_YOU.has(statusKey(s.raw));
          return (
            <button key={s.id} className="mini-item" onClick={() => go("studio", { storyId: s.id })}>
              <span className="cover-sm" style={{ background: s.gradient }} aria-hidden />
              <span className="grow" style={{ textAlign: "left", minWidth: 0 }}>
                <b className="wip-title">{s.title || "Truyện chưa đặt tên"}</b>
                <small><span className={`pill ${mine ? "wait" : "ai"}`}>{s.statusLabel}</span></small>
              </span>
              <span className={`btn ${mine ? "btn-p" : "btn-s"} wip-go`}>{mine ? "Làm tiếp" : "Xem tiến trình"}</span>
            </button>
          );
        })}
      </div>
      {list.length > MAX && <button className="btn btn-g" style={{ width: "fit-content" }} onClick={() => go("library")}>Xem tất cả {list.length} truyện trong Thư viện</button>}
    </div>
  );
}
