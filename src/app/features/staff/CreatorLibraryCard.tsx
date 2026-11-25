"use client";

import { coverFor } from "@/app/lib/storyView";
import type { CreatorDraft } from "@/app/types/creator";
import { ageText, isNewDraft, SOURCE, sourceOf, topicOf } from "./creatorLibraryFilters";

/** Thẻ truyện bìa đứng 3:4, cùng class với thẻ Thư viện phụ huynh (LibraryBookCard) nhưng đọc dữ liệu CreatorDraft. */
export default function CreatorLibraryCard({ story, compact = false, onPick }: { story: CreatorDraft; compact?: boolean; onPick: (button: HTMLButtonElement) => void }) {
  const topic = topicOf(story);
  return (
    <button type="button" className={compact ? "bk lib-card lib-card-compact" : "bk lib-card"} aria-haspopup="dialog" onClick={(e) => onPick(e.currentTarget)}>
      <span className="lib-card-media">
        <span className="lib-card-cover" style={{ background: coverFor(story.coverImageUrl) }} aria-hidden="true" />
        {isNewDraft(story) && <span className="lib-new-pill">Mới</span>}
      </span>
      <span className="lib-card-body">
        <strong className="display lib-card-title">{story.title || "Truyện chưa đặt tên"}</strong>
        <span className="lib-card-meta">
          <span className="lib-card-topic" title={topic}>{topic}</span>
          <span className="lib-card-dot" aria-hidden="true">·</span>
          <span className="lib-card-age">{ageText(story.ageBand)}</span>
        </span>
        {compact && story.description?.trim() && <span className="lib-card-synopsis">{story.description}</span>}
        {!compact && (
          <span className="lib-card-foot">
            <span>{SOURCE[sourceOf(story)]}</span>
            {story.lastVersionNo > 0 && <><span className="lib-card-dot" aria-hidden="true">·</span><span className="lib-num">Phiên bản {story.lastVersionNo}</span></>}
          </span>
        )}
      </span>
    </button>
  );
}
