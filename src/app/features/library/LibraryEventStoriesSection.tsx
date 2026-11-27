"use client";

import { ChevronRight, Trophy } from "lucide-react";
import type { StoryCard } from "@/app/lib/storyView";
import { LibraryBookCard, ShelfRow, type StoryEventTag } from "./LibraryCards";

export type EventStoryShelfItem = {
  story: StoryCard;
  eventTags: StoryEventTag[];
};

export type LibraryEventStoriesSectionProps = {
  items: EventStoryShelfItem[];
  onPickStory: (storyId: number, button: HTMLButtonElement) => void;
  onOpenEvents?: () => void;
};

/** Kệ truyện dùng để tham gia các sự kiện đang diễn ra trên trang Thư viện phụ huynh, gắn tag tên sự kiện lên từng thẻ. */
export default function LibraryEventStoriesSection({
  items,
  onPickStory,
  onOpenEvents,
}: LibraryEventStoriesSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="lib-section lib-event-stories" aria-labelledby="lib-event-stories-heading">
      <div className="lib-sec-head">
        <div className="lib-sec-title-group">
          <h3 id="lib-event-stories-heading" className="display" tabIndex={-1}>
            <Trophy className="ic lib-sec-ic lib-event-icon" aria-hidden="true" />
            Truyện tham gia sự kiện
          </h3>
          <span className="lib-sec-meta lib-num">{items.length} truyện</span>
        </div>
        {onOpenEvents && (
          <button type="button" className="shelf-all" onClick={onOpenEvents}>
            Xem sự kiện
            <ChevronRight className="ic" aria-hidden="true" />
          </button>
        )}
      </div>
      <ShelfRow>
        {items.map(({ story, eventTags }) => (
          <LibraryBookCard
            key={`ev-story-${story.id}`}
            story={story}
            compact
            eventTags={eventTags}
            onPick={(btn) => onPickStory(story.id, btn)}
          />
        ))}
      </ShelfRow>
    </section>
  );
}
