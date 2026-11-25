"use client";

import { useCallback, useMemo, useState } from "react";
import { toCard, type StoryCard } from "@/app/lib/storyView";
import type * as B from "@/app/types/backendContracts";
import type { ChildProfile } from "@/app/types/childProfile";
import type { ActiveFilterChip } from "./LibraryStoriesFilterBar";
import { useCommunityStatShelves } from "./useCommunityStatShelves";
import {
  canonicalAgeLabel,
  collectAgeOptions,
  collectDurationOptions,
  collectLibraryAuthors,
  countActiveFilters,
  countPopoverFilters,
  filterAndSortStories,
  filterRoadmaps,
  isFocusedCatalog,
  recommendedStories,
  shouldShowRecommended,
  SORT_OPTIONS,
  sortByNewest,
  SOURCE_LABEL,
  STATUS_GROUPS,
  topicOf,
  type LibrarySort,
  type StorySourceKey,
} from "./libraryFilters";

export type UseLibraryDiscoveryParams = {
  stories: StoryCard[];
  templates: B.RoadmapLibraryItemDto[] | null;
  kids: ChildProfile[];
  pickKid: ChildProfile | null;
  tab: "stories" | "roadmaps";
};

/** Trạng thái tìm kiếm, lọc, sắp xếp, đề xuất và bảng nổi bật cộng đồng cho Thư viện phụ huynh. */
export function useLibraryDiscovery({ stories, templates, kids, pickKid, tab }: UseLibraryDiscoveryParams) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [genreF, setGenreF] = useState("all");
  const [ageF, setAgeF] = useState("all");
  const [srcF, setSrcF] = useState("all");
  const [duration, setDuration] = useState("all");
  const [author, setAuthor] = useState("all");
  const [sort, setSort] = useState<LibrarySort>("recent");

  const [roadmapQuery, setRoadmapQuery] = useState("");
  const [roadmapAge, setRoadmapAge] = useState("all");

  const clearStoryFilters = useCallback(() => {
    setQ("");
    setStatus("all");
    setGenreF("all");
    setAgeF("all");
    setSrcF("all");
    setDuration("all");
    setAuthor("all");
    setSort("recent");
  }, []);

  const clearPopoverFilters = useCallback(() => {
    setStatus("all");
    setAgeF("all");
    setSrcF("all");
    setDuration("all");
    setAuthor("all");
  }, []);

  const clearRoadmapFilters = useCallback(() => {
    setRoadmapQuery("");
    setRoadmapAge("all");
  }, []);

  const sorted = useMemo(() => sortByNewest(stories), [stories]);
  const topicEntries = useMemo(() => {
    const map = new Map<string, number>();
    for (const story of sorted) {
      const label = topicOf(story);
      map.set(label, (map.get(label) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "vi"));
  }, [sorted]);
  const ageOptions = useMemo(() => collectAgeOptions(sorted), [sorted]);
  const durations = useMemo(() => collectDurationOptions(sorted), [sorted]);
  const authors = useMemo(() => collectLibraryAuthors(sorted), [sorted]);

  const filterState = useMemo(
    () => ({ query: q, status, genre: genreF, age: ageF, source: srcF, duration, author, sort }),
    [q, status, genreF, ageF, srcF, duration, author, sort],
  );
  const popoverCount = countPopoverFilters(filterState);
  const activeCount = countActiveFilters(filterState);
  const focused = isFocusedCatalog(filterState);
  const results = useMemo(() => filterAndSortStories(sorted, filterState), [sorted, filterState]);

  const { mostViewed, mostFavorited } = useCommunityStatShelves(tab === "stories" && !focused);
  const viewedCards = useMemo(
    () => mostViewed.map((s) => ({ ...toCard(s), creator: true, viewCount: s.viewCount, favoriteCount: s.favoriteCount })),
    [mostViewed],
  );
  const favoritedCards = useMemo(
    () => mostFavorited.map((s) => ({ ...toCard(s), creator: true, viewCount: s.viewCount, favoriteCount: s.favoriteCount })),
    [mostFavorited],
  );
  const activeSpotlight: "views" | "favorites" =
    favoritedCards.length > 0
      ? "favorites"
      : viewedCards.length > 0
        ? "views"
        : "favorites";
  const spotlightCards = activeSpotlight === "views" ? viewedCards : favoritedCards;

  const childAgeBands = useMemo(() => (pickKid ? [pickKid] : kids).map((kid) => kid.ageBand), [pickKid, kids]);
  const recommended = useMemo(() => recommendedStories(sorted, childAgeBands, 6), [sorted, childAgeBands]);
  const showRecommended = shouldShowRecommended(sorted, recommended, !!pickKid);

  const roadmapAgeOptions = useMemo(() => collectAgeOptions(templates ?? []), [templates]);
  const roadmapResults = useMemo(
    () => filterRoadmaps(templates, roadmapQuery, roadmapAge),
    [templates, roadmapQuery, roadmapAge],
  );
  const matchingRoadmapsCount = useMemo(
    () => (q.trim() ? filterRoadmaps(templates, q, "all").length : 0),
    [templates, q],
  );

  const activeChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    if (q.trim()) chips.push({ id: "q", label: `Từ khóa: “${q.trim()}”`, remove: () => setQ("") });
    if (genreF !== "all") chips.push({ id: "genre", label: `Thể loại: ${genreF}`, remove: () => setGenreF("all") });
    if (ageF !== "all") {
      const label = ageOptions.find((o) => o.key === ageF)?.label ?? canonicalAgeLabel(ageF);
      chips.push({ id: "age", label: `Độ tuổi: ${label}`, remove: () => setAgeF("all") });
    }
    if (srcF !== "all")
      chips.push({ id: "src", label: `Nguồn: ${SOURCE_LABEL[srcF as StorySourceKey] ?? srcF}`, remove: () => setSrcF("all") });
    if (status !== "all") {
      const label = STATUS_GROUPS.find((g) => g.id === status)?.label ?? status;
      chips.push({ id: "status", label: `Trạng thái: ${label}`, remove: () => setStatus("all") });
    }
    if (duration !== "all") {
      const label = durations.find(({ key }) => key === duration)?.label ?? duration;
      chips.push({ id: "duration", label: `Thời lượng: ${label}`, remove: () => setDuration("all") });
    }
    if (author !== "all") {
      const label = authors.find(({ key }) => key === author)?.label ?? "Đã chọn";
      chips.push({ id: "author", label: `Tác giả: ${label}`, remove: () => setAuthor("all") });
    }
    if (sort !== "recent") {
      const label = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort;
      chips.push({ id: "sort", label: `Sắp xếp: ${label}`, remove: () => setSort("recent") });
    }
    return chips;
  }, [q, genreF, ageF, ageOptions, srcF, status, sort, duration, durations, author, authors]);

  return {
    q,
    setQ,
    status,
    setStatus,
    genreF,
    setGenreF,
    ageF,
    setAgeF,
    srcF,
    setSrcF,
    sort,
    setSort,
    roadmapQuery,
    setRoadmapQuery,
    roadmapAge,
    setRoadmapAge,
    clearStoryFilters,
    clearPopoverFilters,
    clearRoadmapFilters,
    sorted,
    topicEntries,
    ageOptions,
    popoverCount,
    activeCount,
    focused,
    results,
    viewedCards,
    favoritedCards,
    activeSpotlight,
    spotlightCards,
    recommended,
    showRecommended,
    roadmapAgeOptions,
    roadmapResults,
    matchingRoadmapsCount,
    activeChips,
    extraFilters: { durations, duration, authors, author, onDuration: setDuration, onAuthor: setAuthor },
  };
}
