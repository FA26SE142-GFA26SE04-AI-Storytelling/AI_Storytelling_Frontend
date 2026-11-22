import { describe, expect, it } from "vitest";
import type { StoryCard } from "@/app/lib/storyView";
import type * as B from "@/app/types/backendContracts";
import {
  countActiveFilters,
  countPopoverFilters,
  filterAndSortStories,
  filterRoadmaps,
  isFocusedCatalog,
  isNewStory,
  normalizeAgeKey,
  recommendedStories,
  shouldShowRecommended,
  sortByNewest,
  sourceOf,
  statusOf,
  topicOf,
  type LibraryFilterState,
} from "@/app/features/library/libraryFilters";

function makeCard(overrides: Partial<StoryCard> & { raw?: Partial<StoryCard["raw"]> } = {}): StoryCard {
  const { raw: rawOverrides, ...rest } = overrides;
  return {
    id: 1,
    title: "Ếch con khám phá",
    ageBand: "6-8",
    topic: "Khám phá",
    fromAi: true,
    words: 120,
    tone: "ok",
    statusLabel: "Đã xuất bản",
    by: "Bạn",
    cover: 'center / cover no-repeat url("/default-cover.svg")',
    createdAt: "2026-11-10T00:00:00Z",
    ...rest,
    raw: {
      id: rest.id ?? 1,
      title: rest.title ?? "Ếch con khám phá",
      content: "Nội dung mẫu.",
      ageBand: rest.ageBand ?? "6-8",
      status: "Ready",
      isPublished: true,
      source: "Ai",
      genre: rest.topic ?? "Khám phá",
      createdAt: rest.createdAt ?? "2026-11-10T00:00:00Z",
      authorUserId: 1,
      language: "vi",
      description: "Mô tả mẫu",
      moralLesson: "Biết giúp đỡ bạn bè",
      coverImageUrl: null,
      ...rawOverrides,
    },
  };
}

const DEFAULT_FILTERS: LibraryFilterState = {
  query: "",
  status: "all",
  genre: "all",
  age: "all",
  source: "all",
  sort: "recent",
};

describe("libraryFilters", () => {
  it("normalizes whitespace topics and resolves story source and status", () => {
    const blankTopic = makeCard({ topic: "   ", creator: true });
    const familyDraft = makeCard({ family: true, fromAi: false, raw: { status: "MediaProcessing", isPublished: false } });
    const manual = makeCard({ fromAi: false });

    expect(topicOf(blankTopic)).toBe("Khác");
    expect(sourceOf(blankTopic)).toBe("creator");
    expect(sourceOf(familyDraft)).toBe("family");
    expect(sourceOf(manual)).toBe("manual");
    expect(statusOf(blankTopic)).toBe("ready");
    expect(statusOf(familyDraft)).toBe("media");
  });

  it("identifies new stories within the 3-day window and handles invalid or future timestamps safely", () => {
    const now = Date.parse("2026-11-22T12:00:00Z");
    expect(isNewStory(makeCard({ createdAt: "2026-11-21T00:00:00Z" }), now)).toBe(true);
    expect(isNewStory(makeCard({ createdAt: "2026-11-19T12:00:01Z" }), now)).toBe(true);
    expect(isNewStory(makeCard({ createdAt: "2026-11-19T12:00:00Z" }), now)).toBe(false);
    expect(isNewStory(makeCard({ createdAt: "2026-11-23T00:00:00Z" }), now)).toBe(false);
    expect(isNewStory(makeCard({ createdAt: "not-a-date" }), now)).toBe(false);
  });

  it("filters by query (title or topic), genre, ageBand, source, status and sorts accurately", () => {
    const a = makeCard({
      id: 1,
      title: "Chuyến đi đầm sen",
      topic: " Thiên nhiên ",
      ageBand: "6-8",
      creator: true,
      viewCount: 15,
      favoriteCount: 9,
      createdAt: "2026-11-01T00:00:00Z",
    });
    const b = makeCard({
      id: 2,
      title: "Phi hành gia nhí",
      topic: "Khoa học",
      ageBand: "9-10",
      fromAi: true,
      viewCount: 80,
      favoriteCount: 3,
      createdAt: "2026-11-20T00:00:00Z",
    });
    const c = makeCard({
      id: 3,
      title: "Bạn thỏ dũng cảm",
      topic: "Tình bạn",
      ageBand: "6-8",
      fromAi: false,
      createdAt: "2026-11-15T00:00:00Z",
      raw: { status: "MediaProcessing", isPublished: false },
    });

    const newest = sortByNewest([a, b, c]);
    expect(newest.map((s) => s.id)).toEqual([2, 3, 1]);

    expect(filterAndSortStories(newest, { ...DEFAULT_FILTERS, query: "  thiên nhiên " }).map((s) => s.id)).toEqual([1]);
    expect(filterAndSortStories(newest, { ...DEFAULT_FILTERS, genre: "Thiên nhiên" }).map((s) => s.id)).toEqual([1]);
    expect(filterAndSortStories(newest, { ...DEFAULT_FILTERS, age: "9-10" }).map((s) => s.id)).toEqual([2]);
    expect(filterAndSortStories(newest, { ...DEFAULT_FILTERS, source: "creator" }).map((s) => s.id)).toEqual([1]);
    expect(filterAndSortStories(newest, { ...DEFAULT_FILTERS, status: "media" }).map((s) => s.id)).toEqual([3]);
    expect(filterAndSortStories(newest, { ...DEFAULT_FILTERS, sort: "views" }).map((s) => s.id)).toEqual([2, 1, 3]);
    expect(filterAndSortStories(newest, { ...DEFAULT_FILTERS, sort: "favorites" }).map((s) => s.id)).toEqual([1, 2, 3]);
    expect(filterAndSortStories([], { ...DEFAULT_FILTERS, query: "abc" })).toEqual([]);
  });

  it("matches normalized age bands for recommendations and avoids duplicating tiny catalogs", () => {
    expect(normalizeAgeKey("Age_6_8")).toBe("6-8 tuổi");
    expect(normalizeAgeKey("6-8")).toBe("6-8 tuổi");
    expect(normalizeAgeKey("6–8")).toBe("6-8 tuổi");

    const s1 = makeCard({ id: 1, ageBand: "6-8" });
    const s2 = makeCard({ id: 2, ageBand: "9-10" });
    const s3 = makeCard({ id: 3, ageBand: "6-8", raw: { status: "MediaProcessing", isPublished: false } });

    const rec = recommendedStories([s1, s2, s3], ["Age_6_8"]);
    expect(rec.map((s) => s.id)).toEqual([1]);
    expect(shouldShowRecommended([s1, s2, s3], rec, false)).toBe(true);

    const onlyOne = recommendedStories([s1], ["Age_6_8"]);
    expect(shouldShowRecommended([s1], onlyOne, false)).toBe(false);
    expect(shouldShowRecommended([s1], onlyOne, true)).toBe(true);
    expect(shouldShowRecommended([s1], [], true)).toBe(false);
  });

  it("tracks active counts, popover counts, focused catalog state, and roadmap filtering", () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    expect(countPopoverFilters(DEFAULT_FILTERS)).toBe(0);
    expect(isFocusedCatalog(DEFAULT_FILTERS)).toBe(false);

    const withGenreOnly: LibraryFilterState = { ...DEFAULT_FILTERS, genre: "Khám phá" };
    expect(countActiveFilters(withGenreOnly)).toBe(1);
    expect(countPopoverFilters(withGenreOnly)).toBe(0);
    expect(isFocusedCatalog(withGenreOnly)).toBe(true);

    expect(isFocusedCatalog({ ...DEFAULT_FILTERS, sort: "views" })).toBe(true);
    expect(isFocusedCatalog({ ...DEFAULT_FILTERS, query: "ếch" })).toBe(true);

    const templates = [
      {
        id: 1,
        name: "Bộ khám phá",
        description: "Đọc vui mỗi tối",
        ageBand: "6-8",
        mainCategory: { id: 1, code: "nature", displayName: "Thiên nhiên" },
      },
      {
        id: 2,
        name: "Vũ trụ kỳ thú",
        description: null,
        ageBand: "9-10",
        mainCategory: { id: 2, code: "science", displayName: "Khoa học" },
      },
    ] as unknown as B.RoadmapLibraryItemDto[];

    expect(filterRoadmaps(null, "abc")).toEqual([]);
    expect(filterRoadmaps(templates, "thiên nhiên").map((t) => t.id)).toEqual([1]);
    expect(filterRoadmaps(templates, "", "9-10").map((t) => t.id)).toEqual([2]);
    expect(filterRoadmaps(templates, "không tồn tại")).toEqual([]);
  });
});
