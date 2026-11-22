"use client";

import { Clock, Heart, LayoutGrid, Smile, X } from "lucide-react";
import { jumpToSection } from "./LibraryDiscoveryHighlights";
import type { AgeFilterOption, LibrarySort } from "./libraryFilters";

export type ActiveFilterChip = { id: string; label: string; remove: () => void };

export type LibraryStoriesFilterBarProps = {
  totalStories: number;
  resultsCount: number;
  storiesLoading: boolean;
  focused: boolean;
  genreF: string;
  topicEntries: [string, number][];
  activeChips: ActiveFilterChip[];
  sort?: LibrarySort;
  ageF?: string;
  ageOptions?: AgeFilterOption[];
  onGenreChange: (genre: string) => void;
  onSortChange?: (sort: LibrarySort) => void;
  onAgeChange?: (age: string) => void;
  onClearFilters: () => void;
};

/** Dải chọn nhanh theo thể loại/độ tuổi/mức độ và thanh tóm tắt các bộ lọc đang áp dụng trong tab Truyện. */
export default function LibraryStoriesFilterBar({
  totalStories,
  resultsCount,
  storiesLoading,
  focused,
  genreF,
  topicEntries,
  activeChips,
  sort = "recent",
  ageF = "all",
  ageOptions,
  onGenreChange,
  onSortChange,
  onAgeChange,
  onClearFilters,
}: LibraryStoriesFilterBarProps) {
  const showAllActive = genreF === "all" && ageF === "all" && sort === "recent";
  const showPopularActive = sort === "favorites" || sort === "views";
  const showTopicsRow = totalStories > 0 && (topicEntries.length > 0 || (ageOptions?.length ?? 0) > 0);

  return (
    <>
      {showTopicsRow && (
        <div className="lib-topics" role="group" aria-label="Lọc nhanh theo thể loại">
          <button
            type="button"
            className={`lib-topic-pill${showAllActive ? " on" : ""}`}
            aria-pressed={showAllActive}
            onClick={() => {
              onGenreChange("all");
              onAgeChange?.("all");
              onSortChange?.("recent");
            }}
          >
            <LayoutGrid className="ic" aria-hidden="true" />
            <span className="lib-topic-label">Tất cả</span>
            <span className="lib-pill-n lib-num">{totalStories}</span>
          </button>
          {onSortChange && (
            <>
              <button
                type="button"
                className="lib-topic-pill"
                onClick={() => {
                  onSortChange("recent");
                  if (!focused) requestAnimationFrame(() => jumpToSection("lib-recent-heading"));
                }}
              >
                <Clock className="ic" aria-hidden="true" />
                <span className="lib-topic-label">Mới nhất</span>
              </button>
              <button
                type="button"
                className={`lib-topic-pill${showPopularActive ? " on" : ""}`}
                aria-pressed={showPopularActive}
                onClick={() => onSortChange(showPopularActive ? "recent" : "favorites")}
              >
                <Heart className="ic" aria-hidden="true" />
                <span className="lib-topic-label">Phổ biến</span>
              </button>
            </>
          )}
          {topicEntries.map(([label, count]) => (
            <button
              type="button"
              key={label}
              title={label}
              className={`lib-topic-pill${genreF === label ? " on" : ""}`}
              aria-pressed={genreF === label}
              onClick={() => onGenreChange(genreF === label ? "all" : label)}
            >
              <span className="lib-topic-label">{label}</span>
              <span className="lib-pill-n lib-num">{count}</span>
            </button>
          ))}
          {onAgeChange &&
            ageOptions?.map((opt) => (
              <button
                type="button"
                key={opt.key}
                className={`lib-topic-pill${ageF === opt.key ? " on" : ""}`}
                aria-pressed={ageF === opt.key}
                onClick={() => onAgeChange(ageF === opt.key ? "all" : opt.key)}
              >
                <Smile className="ic" aria-hidden="true" />
                <span className="lib-topic-label">{opt.label}</span>
              </button>
            ))}
        </div>
      )}

      {(focused || activeChips.length > 0) && (
        <div className="lib-summary">
          <span className="lib-count lib-num" role="status">
            {storiesLoading ? "Đang tải truyện…" : `Hiển thị ${resultsCount} / ${totalStories} truyện`}
          </span>
          <div className="lib-active-chips">
            {activeChips.map((chip) => (
              <button
                type="button"
                key={chip.id}
                className="lib-active-chip"
                onClick={chip.remove}
                aria-label={`Bỏ ${chip.label}`}
              >
                <span>{chip.label}</span>
                <X className="ic" aria-hidden="true" />
              </button>
            ))}
            <button type="button" className="lib-reset-btn" onClick={onClearFilters}>
              Đặt lại
            </button>
          </div>
        </div>
      )}
    </>
  );
}
