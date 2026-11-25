import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { StoryCard } from "@/app/lib/storyView";
import { coverFor } from "@/app/lib/storyView";

vi.mock("@/app/context/WorkspaceDataContext", () => ({
  useWorkspaceData: () => ({ children: [], childrenLoading: false }),
}));

import { LibraryBookCard, LibrarySkeletonGrid } from "@/app/features/library/LibraryCards";
import { LibraryFeaturedStory, LibraryGenreTiles } from "@/app/features/library/LibraryDiscoveryHighlights";
import LibraryDetailDialog, { LibraryDetailShell } from "@/app/features/library/LibraryDetailDialog";
import LibraryFilterPopover from "@/app/features/library/LibraryFilterPopover";
import LibraryFilterSidebar from "@/app/features/library/LibraryFilterSidebar";
import LibraryHeader from "@/app/features/library/LibraryHeader";
import LibrarySpotlightSection from "@/app/features/library/LibrarySpotlightSection";
import LibraryStoriesFilterBar from "@/app/features/library/LibraryStoriesFilterBar";
import LibraryStoriesView from "@/app/features/library/LibraryStoriesView";
import LibraryRoadmapsView from "@/app/features/library/LibraryRoadmapsView";
import LibraryWorkspace, { Preview, Shelf, ShelfRow } from "@/app/features/library/LibraryWorkspace";
import type { ChildProfile } from "@/app/types/childProfile";

function makeStory(overrides: Partial<StoryCard> & { raw?: Partial<StoryCard["raw"]> } = {}): StoryCard {
  const { raw: rawOverrides, ...rest } = overrides;
  return {
    id: 7,
    title: "Ếch con khám phá",
    ageBand: "6-8",
    topic: "Khám phá",
    fromAi: true,
    words: 1250,
    tone: "ok",
    statusLabel: "Đã xuất bản",
    by: "Tác giả Sen",
    cover: coverFor("https://example.invalid/cover.jpg#crop=0.1,0.05,0.6,0.8"),
    createdAt: "2020-01-01T00:00:00Z",
    ...rest,
    raw: {
      id: rest.id ?? 7,
      title: rest.title ?? "Ếch con khám phá",
      content: "Nội dung mẫu.",
      ageBand: rest.ageBand ?? "6-8",
      status: "Ready",
      isPublished: true,
      source: "Ai",
      genre: rest.topic ?? "Khám phá",
      createdAt: rest.createdAt ?? "2020-01-01T00:00:00Z",
      authorUserId: 1,
      language: "vi",
      description: "Một chuyến phiêu lưu quanh đầm sen.",
      moralLesson: "Luôn tò mò và sẻ chia cùng bạn bè.",
      coverImageUrl: "https://example.invalid/cover.jpg#crop=0.1,0.05,0.6,0.8",
      ...rawOverrides,
    },
  };
}

describe("Library UI components", () => {
  it("LibraryBookCard keeps .bk smoke selector, preserves crop cover, and stacks stats below left badge", () => {
    const rankedHtml = renderToStaticMarkup(
      <LibraryBookCard story={makeStory({ creator: true, viewCount: 42, favoriteCount: 11 })} rank={1} onPick={() => {}} />,
    );
    expect(rankedHtml).toContain('class="bk lib-card"');
    expect(rankedHtml).toContain("#1");
    expect(rankedHtml).toContain("below-pill");
    expect(rankedHtml).toContain("Ếch con khám phá");
    expect(rankedHtml).toContain("1.250 chữ");

    // Chân thẻ hiện tên tác giả thay cho nhãn nguồn "Của creator".
    const authoredHtml = renderToStaticMarkup(
      <LibraryBookCard story={makeStory({ creator: true, raw: { authorName: "Đặng Lê Anh Tuấn" } })} onPick={() => {}} />,
    );
    expect(authoredHtml).toContain('class="lib-card-author" title="Đặng Lê Anh Tuấn"');
    expect(authoredHtml).not.toContain("Của creator");
    // Icon câu đố chỉ hiện khi API báo hasQuiz = true; thiếu trường (API cũ) thì không hiện.
    expect(authoredHtml).not.toContain("lib-card-quiz");
    const quizHtml = renderToStaticMarkup(
      <LibraryBookCard story={makeStory({ creator: true, raw: { hasQuiz: true } })} onPick={() => {}} />,
    );
    expect(quizHtml).toContain('aria-label="Có câu đố"');
    expect(rankedHtml).toContain("166.67% 125%");

    const plainReadyHtml = renderToStaticMarkup(
      <LibraryBookCard story={makeStory({ creator: true, viewCount: 8, favoriteCount: 2 })} onPick={() => {}} />,
    );
    expect(plainReadyHtml).toContain("story-stats-badge");
    expect(plainReadyHtml).not.toContain("below-pill");

    const mediaHtml = renderToStaticMarkup(
      <LibraryBookCard
        story={makeStory({ tone: "wait", statusLabel: "Đang tạo minh hoạ", raw: { status: "MediaProcessing", isPublished: false } })}
        onPick={() => {}}
      />,
    );
    expect(mediaHtml).toContain("Đang tạo minh hoạ");
  });

  it("LibraryDetailDialog renders ready story actions, synopsis, moral lesson, and community stats", () => {
    const html = renderToStaticMarkup(
      <LibraryDetailDialog
        story={makeStory({ creator: true, viewCount: 99, favoriteCount: 17 })}
        go={() => {}}
        onKid={() => {}}
        onClose={() => {}}
        onPreview={() => {}}
        onAddRoadmap={() => {}}
        onReport={() => {}}
        onRate={() => {}}
        rating={{ averageRating: 4.5, ratingCount: 12 }}
      />,
    );

    expect(html).toContain("Ếch con khám phá");
    expect(html).toContain("Một chuyến phiêu lưu quanh đầm sen.");
    expect(html).toContain("Bài học");
    expect(html).toContain("Luôn tò mò và sẻ chia cùng bạn bè.");
    expect(html).toContain("99");
    expect(html).toContain("17");
    expect(html).toContain("Cho bé đọc ngay");
    expect(html).toContain("Thêm vào lộ trình");
    expect(html).toContain("Xem trước như bé thấy");
    expect(html).toContain("Báo cáo nội dung");
    expect(html).toContain("4,5 · 12 đánh giá");
    expect(html).toContain("Xem đánh giá của phụ huynh");
  });

  it("LibraryDetailShell (Thư viện Creator) shows custom actions and a read-only rating line", () => {
    const html = renderToStaticMarkup(
      <LibraryDetailShell story={makeStory({ creator: true, viewCount: 5, favoriteCount: 2 })} onClose={() => {}} rating={{ averageRating: 4, ratingCount: 3 }}>
        <button type="button">Mở để soạn tiếp</button>
      </LibraryDetailShell>,
    );
    expect(html).toContain("Mở để soạn tiếp");
    expect(html).toContain("4,0 · 3 đánh giá");
    expect(html).not.toContain("Xem đánh giá của phụ huynh");
    expect(html).not.toContain("Cho bé đọc ngay");
    expect(html).not.toContain("Báo cáo nội dung");
  });

  it("LibraryFilterSidebar community mode drops the single-value Source and Status groups", () => {
    const html = renderToStaticMarkup(
      <LibraryFilterSidebar
        stories={[makeStory({ creator: true })]}
        ages={[{ key: "6-8 tuổi", label: "6–8 tuổi", count: 1 }]}
        topics={[["Khám phá", 1]]}
        age="all"
        genre="all"
        source="all"
        status="all"
        extraFilters={{ durations: [], duration: "all", onDuration: () => {}, authors: [], author: "all", onAuthor: () => {} }}
        community
        onAge={() => {}}
        onGenre={() => {}}
        onSource={() => {}}
        onStatus={() => {}}
        onClear={() => {}}
      />,
    );
    expect(html).toContain("Độ tuổi");
    expect(html).toContain('aria-label="Thu gọn bộ lọc"');
    expect(html).not.toContain("Nguồn truyện");
    expect(html).not.toContain("Trạng thái");
  });

  it("LibraryDetailDialog switches actions cleanly for family drafts and moderation stories", () => {
    const familyHtml = renderToStaticMarkup(
      <LibraryDetailDialog
        story={makeStory({ family: true, fromAi: false })}
        go={() => {}}
        onClose={() => {}}
        onPreview={() => {}}
        onAddRoadmap={() => {}}
        onReport={() => {}}
        onRate={() => {}}
        rating={{ averageRating: 4.5, ratingCount: 12 }}
      />,
    );
    expect(familyHtml).toContain("Mở trong trang Thủ công");
    expect(familyHtml).not.toContain("Thêm vào lộ trình");
    // Đánh giá chỉ dành cho truyện Creator trong thư viện cộng đồng.
    expect(familyHtml).not.toContain("đánh giá");

    const modHtml = renderToStaticMarkup(
      <LibraryDetailDialog
        story={makeStory({ fromAi: true, raw: { status: "ModerationReview", isPublished: false } })}
        go={() => {}}
        onClose={() => {}}
        onPreview={() => {}}
        onAddRoadmap={() => {}}
        onReport={() => {}}
        onRate={() => {}}
        rating={{ averageRating: 4.5, ratingCount: 12 }}
      />,
    );
    expect(modHtml).toContain("Đang chờ kiểm duyệt");
    expect(modHtml).toContain("Tiếp tục trong Studio");
    expect(modHtml).not.toContain("Xem trước như bé thấy");
  });

  it("LibrarySkeletonGrid exposes accessible loading state and requested skeleton count", () => {
    const html = renderToStaticMarkup(<LibrarySkeletonGrid count={4} label="Đang tải truyện mẫu…" />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Đang tải truyện mẫu…");
    expect(html.match(/lib-skel-card/g)).toHaveLength(4);
  });

  it("Parent library catalog CSS uses only design tokens, font-size variables, and preserves cover cropping", () => {
    const css = readFileSync(path.resolve(process.cwd(), "app/styles/features/library/library.css"), "utf8");
    const marker = "/* ===== Parent library catalog (Thư viện phụ huynh) ===== */";
    const start = css.indexOf(marker);
    expect(start).toBeGreaterThan(-1);
    const catalogCss = css.slice(start);

    expect(catalogCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(catalogCss).not.toMatch(/rgba?\s*\(/i);
    expect(catalogCss).not.toMatch(/font-size\s*:\s*\d+(?:\.\d+)?px/i);
    expect(catalogCss).not.toMatch(/background-(?:size|position)\s*:[^;]*!important/i);
    // Đảm bảo tương phản theme tối: không dùng --primary-strong làm màu chữ/icon tiền cảnh trong danh mục thư viện
    expect(catalogCss).not.toMatch(/(?:^|[{;\s])color\s*:\s*var\(--primary-strong\)/);
  });

  it("LibraryDetailDialog avoids misattributing anonymous community stories to 'Bạn'", () => {
    const html = renderToStaticMarkup(
      <LibraryDetailDialog
        story={makeStory({ creator: true, by: "Bạn", raw: { authorName: null } })}
        go={() => {}}
        onClose={() => {}}
        onPreview={() => {}}
        onAddRoadmap={() => {}}
        onReport={() => {}}
        onRate={() => {}}
        rating={{ averageRating: 4.5, ratingCount: 12 }}
      />,
    );
    expect(html).toContain("Tác giả cộng đồng");
    expect(html).not.toContain("<b>Bạn</b>");
  });

  it("LibraryFilterPopover scopes footer clear button strictly to popover filters", () => {
    const emptyPopHtml = renderToStaticMarkup(
      <LibraryFilterPopover
        open
        onToggle={() => {}}
        onClose={() => {}}
        stories={[makeStory()]}
        ageOptions={[{ key: "6-8 tuổi", label: "6–8 tuổi", count: 1 }]}
        status="all"
        age="all"
        source="all"
        activePopoverCount={0}
        onStatusChange={() => {}}
        onAgeChange={() => {}}
        onSourceChange={() => {}}
        onClearPopover={() => {}}
      />,
    );
    expect(emptyPopHtml).not.toContain("lib-filter-foot");

    const activePopHtml = renderToStaticMarkup(
      <LibraryFilterPopover
        open
        onToggle={() => {}}
        onClose={() => {}}
        stories={[makeStory()]}
        ageOptions={[{ key: "6-8 tuổi", label: "6–8 tuổi", count: 1 }]}
        status="all"
        age="6-8 tuổi"
        source="all"
        activePopoverCount={1}
        onStatusChange={() => {}}
        onAgeChange={() => {}}
        onSourceChange={() => {}}
        onClearPopover={() => {}}
      />,
    );
    expect(activePopHtml).toContain("lib-filter-foot");
    expect(activePopHtml).toContain("Xoá bộ lọc");

    const disabledPopHtml = renderToStaticMarkup(
      <LibraryFilterPopover
        open
        onToggle={() => {}}
        onClose={() => {}}
        stories={[]}
        ageOptions={[]}
        status="all"
        age="all"
        source="all"
        activePopoverCount={0}
        onStatusChange={() => {}}
        onAgeChange={() => {}}
        onSourceChange={() => {}}
        onClearPopover={() => {}}
      />,
    );
    expect(disabledPopHtml).toContain("disabled");
    expect(disabledPopHtml).toContain("Chưa có tiêu chí lọc.");
  });

  it("LibraryStoriesView and LibraryRoadmapsView render inline retryable error panels and cross-tab search hint", () => {
    const storyErrHtml = renderToStaticMarkup(
      <LibraryStoriesView
        stories={[]}
        sorted={[]}
        results={[]}
        storiesLoading={false}
        error="Không thể kết nối máy chủ."
        focused={false}
        sort="recent"
        genreF="all"
        topicEntries={[]}
        activeChips={[]}
        favoritedCards={[]}
        activeSpotlight="views"
        spotlightCards={[]}
        recommended={[]}
        showRecommended={false}
        pickKidName={null}
        matchingRoadmapsCount={0}
        go={() => {}}
        onGenreChange={() => {}}
        onSortChange={() => {}}
        onClearFilters={() => {}}
        onRetry={() => {}}
        onPickStory={() => {}}
        onJumpToRoadmaps={() => {}}
      />,
    );
    expect(storyErrHtml).toContain("data-inline-notice");
    expect(storyErrHtml).toContain("Không tải được thư viện truyện");
    expect(storyErrHtml).toContain("Thử lại");

    const noStoryWithRoadmapsHtml = renderToStaticMarkup(
      <LibraryStoriesView
        stories={[makeStory()]}
        sorted={[makeStory()]}
        results={[]}
        storiesLoading={false}
        error={null}
        focused
        sort="recent"
        genreF="all"
        topicEntries={[]}
        activeChips={[]}
        favoritedCards={[]}
        activeSpotlight="views"
        spotlightCards={[]}
        recommended={[]}
        showRecommended={false}
        pickKidName={null}
        matchingRoadmapsCount={2}
        go={() => {}}
        onGenreChange={() => {}}
        onSortChange={() => {}}
        onClearFilters={() => {}}
        onRetry={() => {}}
        onPickStory={() => {}}
        onJumpToRoadmaps={() => {}}
      />,
    );
    expect(noStoryWithRoadmapsHtml).toContain("Xem 2 lộ trình mẫu");

    const roadmapErrHtml = renderToStaticMarkup(
      <LibraryRoadmapsView
        templates={[]}
        roadmapResults={[]}
        ageOptions={[]}
        query=""
        age="all"
        error="Không tải được lộ trình."
        onAgeChange={() => {}}
        onClearQuery={() => {}}
        onClearAll={() => {}}
        onRetry={() => {}}
        onOpenTemplate={() => {}}
      />,
    );
    expect(roadmapErrHtml).toContain("data-inline-notice");
    expect(roadmapErrHtml).toContain("Không tải được lộ trình mẫu");
    expect(roadmapErrHtml).toContain("Thử lại");
  });

  it("Spotlight shelf gates rank pills via rankForStory so zero-stat stories never get fake rank badges", () => {
    const viewedPositive = makeStory({ id: 10, title: "Truyện đọc nhiều", creator: true, viewCount: 25, favoriteCount: 0 });
    const viewedZero = makeStory({ id: 11, title: "Truyện chưa có lượt đọc", creator: true, viewCount: 0, favoriteCount: 9 });
    const viewedUndefined = makeStory({ id: 12, title: "Truyện thiếu thống kê", creator: true });

    const viewsSpotlightHtml = renderToStaticMarkup(
      <LibraryStoriesView
        stories={[viewedPositive, viewedZero, viewedUndefined]}
        sorted={[viewedPositive, viewedZero, viewedUndefined]}
        results={[viewedPositive, viewedZero, viewedUndefined]}
        storiesLoading={false}
        error={null}
        focused={false}
        sort="recent"
        genreF="all"
        topicEntries={[]}
        activeChips={[]}
        favoritedCards={[viewedZero]}
        activeSpotlight="views"
        spotlightCards={[viewedPositive, viewedZero, viewedUndefined]}
        recommended={[]}
        showRecommended={false}
        pickKidName={null}
        matchingRoadmapsCount={0}
        go={() => {}}
        onGenreChange={() => {}}
        onSortChange={() => {}}
        onClearFilters={() => {}}
        onRetry={() => {}}
        onPickStory={() => {}}
        onJumpToRoadmaps={() => {}}
      />,
    );
    expect(viewsSpotlightHtml).toContain("Đọc nhiều nhất");
    expect(viewsSpotlightHtml).not.toContain("lib-spot-tabs");
    expect(viewsSpotlightHtml).toContain("#1");
    expect(viewsSpotlightHtml).not.toContain("#2");
    expect(viewsSpotlightHtml).not.toContain("#3");
    expect(viewsSpotlightHtml.match(/lib-rank-pill/g)).toHaveLength(1);

    const favZeroHtml = renderToStaticMarkup(
      <LibrarySpotlightSection
        activeSpotlight="favorites"
        spotlightCards={[viewedPositive]}
        onSortChange={() => {}}
        onPickStory={() => {}}
      />,
    );
    expect(favZeroHtml).toContain("Được yêu thích");
    expect(favZeroHtml).not.toContain("lib-rank-pill");
    expect(favZeroHtml).not.toContain("#1");

    const favPositiveHtml = renderToStaticMarkup(
      <LibrarySpotlightSection
        activeSpotlight="favorites"
        spotlightCards={[viewedZero]}
        onSortChange={() => {}}
        onPickStory={() => {}}
      />,
    );
    expect(favPositiveHtml).toContain("lib-rank-pill");
    expect(favPositiveHtml).toContain("#1");

    const emptySpotlightHtml = renderToStaticMarkup(
      <LibrarySpotlightSection
        activeSpotlight="views"
        spotlightCards={[]}
        onSortChange={() => {}}
        onPickStory={() => {}}
      />,
    );
    expect(emptySpotlightHtml).toBe("");
  });

  it("LibraryHeader, LibraryStoriesFilterBar, and LibraryWorkspace exports remain intact after decomposition", () => {
    expect(typeof LibraryWorkspace).toBe("function");
    expect(typeof Preview).toBe("function");
    expect(typeof Shelf).toBe("function");
    expect(typeof ShelfRow).toBe("function");

    const kid = { id: 5, nickname: "Bé Bông", avatarId: "frog", ageBand: "6-8" } as unknown as ChildProfile;
    const storiesHeaderHtml = renderToStaticMarkup(
      <LibraryHeader
        pickKid={kid}
        pickStage="new"
        tab="stories"
        storiesCount={12}
        storiesLoading={false}
        templatesCount={3}
        query="sen"
        roadmapQuery=""
        filterOpen={false}
        stories={[makeStory()]}
        ageOptions={[{ key: "6-8 tuổi", label: "6–8 tuổi", count: 1 }]}
        status="all"
        age="all"
        source="all"
        popoverCount={0}
        onBackToLearning={() => {}}
        onDismissPickKid={() => {}}
        onTabChange={() => {}}
        onQueryChange={() => {}}
        onRoadmapQueryChange={() => {}}
        onToggleFilter={() => {}}
        onCloseFilter={() => {}}
        onStatusChange={() => {}}
        onAgeChange={() => {}}
        onSourceChange={() => {}}
        onClearPopover={() => {}}
      />,
    );
    expect(storiesHeaderHtml).toContain("Đang chọn truyện cho Bé Bông");
    expect(storiesHeaderHtml).toContain("Chặng mới");
    expect(storiesHeaderHtml).not.toContain("Sắp xếp");
    expect(storiesHeaderHtml).toContain("Bộ lọc");
    expect(storiesHeaderHtml).toContain("Xoá từ khóa tìm kiếm");

    const roadmapsHeaderHtml = renderToStaticMarkup(
      <LibraryHeader
        pickKid={null}
        pickStage={undefined}
        tab="roadmaps"
        storiesCount={12}
        storiesLoading={false}
        templatesCount={3}
        query=""
        roadmapQuery=""
        filterOpen={false}
        stories={[]}
        ageOptions={[]}
        status="all"
        age="all"
        source="all"
        popoverCount={0}
        onBackToLearning={() => {}}
        onDismissPickKid={() => {}}
        onTabChange={() => {}}
        onQueryChange={() => {}}
        onRoadmapQueryChange={() => {}}
        onToggleFilter={() => {}}
        onCloseFilter={() => {}}
        onStatusChange={() => {}}
        onAgeChange={() => {}}
        onSourceChange={() => {}}
        onClearPopover={() => {}}
      />,
    );
    expect(roadmapsHeaderHtml).toContain("Tìm lộ trình mẫu…");
    expect(roadmapsHeaderHtml).not.toContain("lib-toolbar-actions");

    const filterBarHtml = renderToStaticMarkup(
      <LibraryStoriesFilterBar
        totalStories={5}
        resultsCount={2}
        storiesLoading={false}
        focused
        genreF="Khám phá"
        topicEntries={[
          ["Khám phá", 3],
          ["Tình bạn", 2],
        ]}
        activeChips={[{ id: "genre", label: "Thể loại: Khám phá", remove: () => {} }]}
        onGenreChange={() => {}}
        onClearFilters={() => {}}
      />,
    );
    expect(filterBarHtml).toContain("lib-topics");
    expect(filterBarHtml).toContain("Hiển thị 2 / 5 truyện");
    expect(filterBarHtml).toContain("Thể loại: Khám phá");
    expect(filterBarHtml).toContain("Đặt lại");
  });

  it("LibraryGenreTiles keeps 1 row of up to 4 cards and toggles Xem tất cả chủ đề when > 4 genres exist", () => {
    const story = makeStory();
    const fourTopics: [string, number][] = [
      ["Co tich", 1],
      ["Ngu ngon", 1],
      ["Phieu luu", 1],
      ["Phiêu lưu", 1],
    ];
    const fourHtml = renderToStaticMarkup(
      <LibraryGenreTiles topics={fourTopics} stories={[story]} onGenreChange={() => {}} />,
    );
    expect(fourHtml).toContain("Co tich");
    expect(fourHtml).toContain("Phiêu lưu");
    expect(fourHtml).toContain("lib-genre-row");
    expect(fourHtml).not.toContain("Xem tất cả chủ đề");

    const fiveTopics: [string, number][] = [...fourTopics, ["The thao", 1]];
    const collapsedHtml = renderToStaticMarkup(
      <LibraryGenreTiles topics={fiveTopics} stories={[story]} onGenreChange={() => {}} />,
    );
    expect(collapsedHtml).toContain("Co tich");
    expect(collapsedHtml).toContain("Phiêu lưu");
    expect(collapsedHtml).not.toContain("The thao");
    expect(collapsedHtml).toContain("lib-genre-row");
    expect(collapsedHtml).toContain("Xem tất cả chủ đề");
    expect(collapsedHtml).toContain('aria-expanded="false"');
    expect(collapsedHtml).toContain('aria-controls="lib-genre-grid"');

    const expandedHtml = renderToStaticMarkup(
      <LibraryGenreTiles topics={fiveTopics} stories={[story]} onGenreChange={() => {}} defaultExpanded />,
    );
    expect(expandedHtml).toContain("The thao");
    expect(expandedHtml).not.toContain("lib-genre-row");
    expect(expandedHtml).toContain("Thu gọn");
    expect(expandedHtml).toContain('aria-expanded="true"');
  });

  it("matches reference layout hierarchy: sidebar groups order, section order, filter bar pills, and featured duration", () => {
    const story = makeStory({ id: 1, words: 840, creator: true, viewCount: 20, favoriteCount: 12, raw: { authorUserId: 9, authorName: "Hoa Sen Nhỏ" } });
    const story2 = makeStory({ id: 2, title: "Truyện thứ hai", ageBand: "9-10", topic: "Tình bạn", words: 600 });

    const sidebarHtml = renderToStaticMarkup(
      <LibraryFilterSidebar
        stories={[story, story2]}
        ages={[{ key: "6-8 tuổi", label: "6–8 tuổi", count: 1 }, { key: "9-10 tuổi", label: "9–10 tuổi", count: 1 }]}
        topics={[["Phiêu lưu", 1], ["Tình bạn", 1], ["Cổ tích", 1], ["Gia đình", 1], ["Động vật", 1], ["Thiên nhiên", 1], ["Thể thao", 1]]}
        age="all"
        genre="all"
        source="all"
        status="all"
        extraFilters={{
          durations: [{ key: "5-to-10", label: "5 – dưới 10 phút", count: 2 }],
          duration: "all",
          onDuration: () => {},
          authors: [{ key: "9", label: "Hoa Sen Nhỏ", count: 1 }],
          author: "all",
          onAuthor: () => {},
        }}
        onAge={() => {}}
        onGenre={() => {}}
        onSource={() => {}}
        onStatus={() => {}}
        onClear={() => {}}
      />,
    );
    const iAge = sidebarHtml.indexOf("Độ tuổi");
    const iTopic = sidebarHtml.indexOf("Chủ đề");
    const iDuration = sidebarHtml.indexOf("Thời lượng");
    const iSource = sidebarHtml.indexOf("Nguồn truyện");
    const iStatus = sidebarHtml.indexOf("Trạng thái");
    const iAuthors = sidebarHtml.indexOf("Tác giả nổi bật");
    // Tác giả nổi bật nằm trên cùng, trước các nhóm lọc.
    expect(iAuthors).toBeGreaterThan(-1);
    expect(iAuthors).toBeLessThan(iAge);
    // Tác giả nổi bật là khung riêng, nằm ngoài khung Bộ lọc (<aside>).
    expect(iAuthors).toBeLessThan(sidebarHtml.indexOf("<aside"));
    expect(iAge).toBeLessThan(iTopic);
    expect(iTopic).toBeLessThan(iDuration);
    expect(iDuration).toBeLessThan(iSource);
    expect(iSource).toBeLessThan(iStatus);
    expect(sidebarHtml).toContain("Xem thêm");

    const viewHtml = renderToStaticMarkup(
      <LibraryStoriesView
        stories={[story, story2]}
        sorted={[story, story2]}
        results={[story, story2]}
        storiesLoading={false}
        error={null}
        focused={false}
        sort="recent"
        genreF="all"
        ageF="all"
        ageOptions={[{ key: "6-8 tuổi", label: "6–8 tuổi", count: 1 }]}
        topicEntries={[["Khám phá", 1], ["Tình bạn", 1]]}
        activeChips={[]}
        favoritedCards={[story]}
        activeSpotlight="favorites"
        spotlightCards={[story]}
        recommended={[story]}
        showRecommended
        pickKidName={null}
        matchingRoadmapsCount={0}
        go={() => {}}
        onGenreChange={() => {}}
        onAgeChange={() => {}}
        onSortChange={() => {}}
        onClearFilters={() => {}}
        onRetry={() => {}}
        onPickStory={() => {}}
        onJumpToRoadmaps={() => {}}
      />,
    );
    const iSpot = viewHtml.indexOf("lib-spotlight-heading");
    const iRecent = viewHtml.indexOf("lib-recent-heading");
    const iGenre = viewHtml.indexOf("lib-genre-heading");
    const iRec = viewHtml.indexOf("lib-recommended-heading");
    const iAll = viewHtml.indexOf("lib-all-heading");
    expect(iSpot).toBeGreaterThan(-1);
    expect(iSpot).toBeLessThan(iRecent);
    expect(iRecent).toBeLessThan(iGenre);
    expect(iGenre).toBeLessThan(iRec);
    expect(iRec).toBeLessThan(iAll);
    expect(viewHtml).toContain("Mới nhất");
    expect(viewHtml).toContain("Phổ biến");
    expect(viewHtml).toContain("6–8 tuổi");

    const featuredHtml = renderToStaticMarkup(
      <LibraryFeaturedStory story={story} onPickStory={() => {}} />,
    );
    expect(featuredHtml).toContain("7 phút");
  });

  it("removes the outer .pane border on LibraryWorkspace and shows Được yêu thích tuần này above Mới thêm gần đây without fake ranks", () => {
    const css = readFileSync(
      path.resolve(process.cwd(), "app/styles/features/library/library.css"),
      "utf8",
    );
    expect(css).toMatch(/\.lib\.lib-catalog\s*>\s*\.pane\s*\{[^}]*border:\s*0;/);

    const zeroStatA = makeStory({ id: 31, title: "Truyện mẫu A", viewCount: 0, favoriteCount: 0 });
    const zeroStatB = makeStory({ id: 32, title: "Truyện mẫu B", creator: true, viewCount: 0, favoriteCount: 0 });
    const zeroStatsViewHtml = renderToStaticMarkup(
      <LibraryStoriesView
        stories={[zeroStatA, zeroStatB]}
        sorted={[zeroStatA, zeroStatB]}
        results={[zeroStatA, zeroStatB]}
        storiesLoading={false}
        error={null}
        focused={false}
        sort="recent"
        genreF="all"
        topicEntries={[["Khám phá", 2]]}
        activeChips={[]}
        favoritedCards={[]}
        activeSpotlight="views"
        spotlightCards={[]}
        recommended={[]}
        showRecommended={false}
        pickKidName={null}
        matchingRoadmapsCount={0}
        go={() => {}}
        onGenreChange={() => {}}
        onSortChange={() => {}}
        onClearFilters={() => {}}
        onRetry={() => {}}
        onPickStory={() => {}}
        onJumpToRoadmaps={() => {}}
      />,
    );
    expect(zeroStatsViewHtml).toContain("Được yêu thích tuần này");
    const iSpot = zeroStatsViewHtml.indexOf("lib-spotlight-heading");
    const iRecent = zeroStatsViewHtml.indexOf("lib-recent-heading");
    expect(iSpot).toBeGreaterThan(-1);
    expect(iRecent).toBeGreaterThan(-1);
    expect(iSpot).toBeLessThan(iRecent);
    expect(zeroStatsViewHtml).not.toContain("lib-rank-pill");
  });
});
