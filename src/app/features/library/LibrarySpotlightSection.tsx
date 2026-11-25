"use client";

import { ChevronRight, Heart } from "lucide-react";
import type { StoryCard } from "@/app/lib/storyView";
import { LibraryBookCard, ShelfRow } from "./LibraryCards";
import { rankForStory, type LibrarySort } from "./libraryFilters";

export type LibrarySpotlightSectionProps = {
  activeSpotlight: "views" | "favorites";
  spotlightCards: StoryCard[];
  onSortChange: (sort: LibrarySort) => void;
  onPickStory: (storyId: number, button: HTMLButtonElement) => void;
};

/** Kệ nổi bật cộng đồng (Đọc nhiều nhất / Được yêu thích), chỉ gắn huy hiệu xếp hạng khi truyện có số lượt > 0. */
export default function LibrarySpotlightSection({
  activeSpotlight,
  spotlightCards,
  onSortChange,
  onPickStory,
}: LibrarySpotlightSectionProps) {
  if (spotlightCards.length === 0) return null;

  return (
    <section className="lib-spotlight" aria-labelledby="lib-spotlight-heading">
      <div className="lib-sec-head">
        <div className="lib-sec-title-group">
          <h3 id="lib-spotlight-heading" className="display" tabIndex={-1}>
            <Heart className="ic lib-sec-ic lib-favorite-icon" aria-hidden="true" />
            {activeSpotlight === "favorites" ? "Được yêu thích tuần này" : "Đọc nhiều nhất"}
          </h3>
        </div>
        <button
          type="button"
          className="shelf-all"
          onClick={() => onSortChange(activeSpotlight === "views" ? "views" : "favorites")}
        >
          Xem tất cả
          <ChevronRight className="ic" aria-hidden="true" />
        </button>
      </div>
      <ShelfRow>
        {spotlightCards.slice(0, 4).map((story, index) => (
          <LibraryBookCard
            key={`${activeSpotlight}-${story.id}`}
            story={story}
            compact
            rank={rankForStory(story, index, activeSpotlight)}
            onPick={(btn) => onPickStory(story.id, btn)}
          />
        ))}
      </ShelfRow>
    </section>
  );
}
