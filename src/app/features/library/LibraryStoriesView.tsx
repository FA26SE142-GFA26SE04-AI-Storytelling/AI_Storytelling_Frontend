"use client";

import type { ReactNode } from "react";
import { ChevronRight, PencilLine, RefreshCw, Route, Sparkles, WandSparkles, X } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import { useRiseIn } from "@/app/lib/motion";
import type { StoryCard } from "@/app/lib/storyView";
import { LibraryBookCard, LibrarySkeletonGrid, ShelfRow } from "./LibraryCards";
import { jumpToSection, LibraryGenreTiles } from "./LibraryDiscoveryHighlights";
import LibraryQuickTopics, { type LibraryTopicAudience } from "./LibraryQuickTopics";
import LibrarySpotlightSection from "./LibrarySpotlightSection";
import LibraryStoriesFilterBar, { type ActiveFilterChip } from "./LibraryStoriesFilterBar";
import { rankForStory, statusOf, type AgeFilterOption, type LibrarySort } from "./libraryFilters";

export type { ActiveFilterChip };

export type LibraryStoriesViewProps = {
  stories: StoryCard[];
  sorted: StoryCard[];
  results: StoryCard[];
  storiesLoading: boolean;
  error: string | null;
  focused: boolean;
  sort: LibrarySort;
  genreF: string;
  ageF?: string;
  ageOptions?: AgeFilterOption[];
  topicEntries: [string, number][];
  activeChips: ActiveFilterChip[];
  viewedCards: StoryCard[];
  favoritedCards: StoryCard[];
  activeSpotlight: "views" | "favorites";
  spotlightCards: StoryCard[];
  recommended: StoryCard[];
  showRecommended: boolean;
  pickKidName: string | null;
  topicAudience?: LibraryTopicAudience;
  matchingRoadmapsCount: number;
  /** Bỏ trống khi có `emptyState` (chỉ dùng cho nút tạo truyện ở trạng thái trống mặc định của phụ huynh). */
  go?: WorkspaceProps["go"];
  /** Trạng thái thư viện trống riêng (Thư viện Creator); không truyền thì dùng lời mời tạo truyện của phụ huynh. */
  emptyState?: ReactNode;
  onGenreChange: (genre: string) => void;
  onAgeChange?: (age: string) => void;
  onSortChange: (sort: LibrarySort) => void;
  onSpotlightChange: (tab: "views" | "favorites") => void;
  onClearFilters: () => void;
  onRetry: () => void;
  onPickStory: (storyId: number, button: HTMLButtonElement) => void;
  onJumpToRoadmaps: () => void;
};

/** Nội dung tab "Truyện" của Thư viện phụ huynh: dải chủ đề, bộ lọc đang bật, kệ nổi bật, đề xuất và lưới toàn bộ truyện. */
export default function LibraryStoriesView({
  stories,
  sorted,
  results,
  storiesLoading,
  error,
  focused,
  sort,
  genreF,
  ageF,
  ageOptions,
  topicEntries,
  activeChips,
  viewedCards,
  favoritedCards,
  activeSpotlight,
  spotlightCards,
  recommended,
  showRecommended,
  pickKidName,
  topicAudience,
  matchingRoadmapsCount,
  go,
  emptyState,
  onGenreChange,
  onAgeChange,
  onSortChange,
  onSpotlightChange,
  onClearFilters,
  onRetry,
  onPickStory,
  onJumpToRoadmaps,
}: LibraryStoriesViewProps) {
  const gridItems = focused ? results : sorted;
  const newest = sorted.filter((story) => statusOf(story) === "ready");
  const featured = favoritedCards.find((story) => (story.favoriteCount ?? 0) > 0 && statusOf(story) === "ready")
    ?? newest.find((story) => story.creator)
    ?? newest[0];
  const fallbackSpotlight = [...newest].sort(
    (a, b) =>
      (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0) ||
      (b.viewCount ?? 0) - (a.viewCount ?? 0) ||
      Number(Boolean(b.creator)) - Number(Boolean(a.creator)),
  );
  const effectiveSpotlightCards = spotlightCards.length > 0 ? spotlightCards : fallbackSpotlight;
  const effectiveSpotlightTab: "views" | "favorites" = spotlightCards.length > 0 ? activeSpotlight : "favorites";
  const gridAnimKey = gridItems.map((story) => story.id).join(",");
  const gridRef = useRiseIn<HTMLDivElement>(".bk", [focused, gridAnimKey], {
    delay: gridItems.length > 24 ? 4 : 18,
    distance: 10,
  });

  return (
    <>
      <LibraryStoriesFilterBar
        totalStories={stories.length}
        resultsCount={results.length}
        storiesLoading={storiesLoading}
        focused={focused}
        genreF={genreF}
        sort={sort}
        ageF={ageF}
        ageOptions={ageOptions}
        topicEntries={topicEntries}
        activeChips={activeChips}
        onGenreChange={onGenreChange}
        onSortChange={onSortChange}
        onAgeChange={onAgeChange}
        onClearFilters={onClearFilters}
      />

      {error && stories.length > 0 && (
        <div className="notice err lib-inline-err" role="alert" data-inline-notice>
          <span className="grow">{error}</span>
          <button type="button" className="btn btn-s" onClick={onRetry}>
            <RefreshCw className="ic" aria-hidden="true" />
            Thử lại
          </button>
        </div>
      )}

      {!focused && topicAudience && (
        <LibraryQuickTopics
          featured={featured}
          stories={newest}
          hasSpotlight={effectiveSpotlightCards.length > 0 && stories.length > 0}
          audience={topicAudience}
          onPickStory={onPickStory}
        />
      )}

      {storiesLoading && stories.length === 0 ? (
        <LibrarySkeletonGrid count={6} label="Đang tải danh sách truyện…" />
      ) : error && stories.length === 0 ? (
        <div className="lib-empty-panel lib-error-panel" role="alert" data-inline-notice>
          <Frog size={84} mood="think" />
          <h3 className="display">Không tải được thư viện truyện</h3>
          <p>{error}</p>
          <button type="button" className="btn btn-p" onClick={onRetry}>
            <RefreshCw className="ic" aria-hidden="true" />
            Thử lại
          </button>
        </div>
      ) : stories.length === 0 ? (
        emptyState ?? <div className="lib-empty-panel">
          <Frog size={96} mood="idle" />
          <h3 className="display">Thư viện chưa có truyện nào</h3>
          <p>Bắt đầu tạo truyện mới bằng AI hoặc tự viết câu chuyện riêng cho gia đình bạn.</p>
          <div className="row lib-empty-actions">
            <button type="button" className="btn btn-gold" onClick={() => go?.("studio")}>
              <WandSparkles className="ic" aria-hidden="true" />
              Dùng AI tạo truyện
            </button>
            <button type="button" className="btn btn-s" onClick={() => go?.("authoring")}>
              <PencilLine className="ic" aria-hidden="true" />
              Viết thủ công
            </button>
          </div>
        </div>
      ) : focused ? (
        results.length > 0 ? (
          <section className="lib-section" aria-labelledby="lib-results-heading">
            <div className="lib-sec-head">
              <h3 id="lib-results-heading" className="display" tabIndex={-1}>
                {sort === "views"
                  ? "Đọc nhiều nhất"
                  : sort === "favorites"
                    ? "Được yêu thích nhất"
                    : "Kết quả tìm kiếm"}
              </h3>
              <span className="lib-sec-meta lib-num">{results.length} truyện</span>
            </div>
            <div ref={gridRef} className="lib-grid">
              {results.map((story, idx) => (
                <LibraryBookCard
                  key={story.id}
                  story={story}
                  rank={rankForStory(story, idx, sort)}
                  onPick={(btn) => onPickStory(story.id, btn)}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="lib-empty-panel">
            <Frog size={88} mood="think" />
            <h3 className="display">Không tìm thấy truyện phù hợp</h3>
            <p>Thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc đang áp dụng.</p>
            <div className="row lib-empty-actions">
              <button type="button" className="btn btn-s" onClick={onClearFilters}>
                <X className="ic" aria-hidden="true" />
                Xoá bộ lọc
              </button>
              {matchingRoadmapsCount > 0 && (
                <button type="button" className="btn btn-p" onClick={onJumpToRoadmaps}>
                  <Route className="ic" aria-hidden="true" />
                  Xem {matchingRoadmapsCount} lộ trình mẫu
                </button>
              )}
            </div>
          </div>
        )
      ) : (
        <>
          <LibrarySpotlightSection
            viewedCards={viewedCards}
            favoritedCards={favoritedCards}
            activeSpotlight={effectiveSpotlightTab}
            spotlightCards={effectiveSpotlightCards}
            onSpotlightChange={onSpotlightChange}
            onSortChange={onSortChange}
            onPickStory={onPickStory}
          />

          {newest.length > 0 && (
            <section className="lib-section" aria-labelledby="lib-recent-heading">
              <div className="lib-sec-head">
                <h3 id="lib-recent-heading" className="display" tabIndex={-1}>
                  <Sparkles className="ic lib-sec-ic lib-recent-icon" aria-hidden="true" />
                  Mới thêm gần đây
                </h3>
                <button type="button" className="shelf-all" onClick={() => jumpToSection("lib-all-heading")}>
                  Xem tất cả
                  <ChevronRight className="ic" aria-hidden="true" />
                </button>
              </div>
              <ShelfRow>
                {newest.slice(0, 4).map((story) => (
                  <LibraryBookCard key={story.id} story={story} compact onPick={(btn) => onPickStory(story.id, btn)} />
                ))}
              </ShelfRow>
            </section>
          )}

          <LibraryGenreTiles topics={topicEntries} stories={sorted} onGenreChange={onGenreChange} />

          {showRecommended && (
            <section className="lib-section" aria-labelledby="lib-recommended-heading">
              <div className="lib-sec-head">
                <div className="lib-sec-title-group">
                  <h3 id="lib-recommended-heading" className="display" tabIndex={-1}>
                    <Sparkles className="ic lib-sec-ic" aria-hidden="true" />
                    {pickKidName ? `Đề xuất cho ${pickKidName}` : "Đề xuất cho bé"}
                  </h3>
                  <span className="lib-sec-meta">Truyện sẵn sàng hợp độ tuổi của bé</span>
                </div>
              </div>
              <ShelfRow>
                {recommended.slice(0, 4).map((story) => (
                  <LibraryBookCard
                    key={`rec-${story.id}`}
                    story={story}
                    compact
                    onPick={(btn) => onPickStory(story.id, btn)}
                  />
                ))}
              </ShelfRow>
            </section>
          )}

          <section className="lib-section" aria-labelledby="lib-all-heading">
            <div className="lib-sec-head">
              <div className="lib-sec-title-group">
                <h3 id="lib-all-heading" className="display" tabIndex={-1}>
                  Tất cả truyện
                </h3>
                <span className="lib-sec-meta lib-num" role="status">
                  {sorted.length} truyện
                </span>
              </div>
            </div>
            <div ref={gridRef} className="lib-grid">
              {sorted.map((story) => (
                <LibraryBookCard key={story.id} story={story} onPick={(btn) => onPickStory(story.id, btn)} />
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
