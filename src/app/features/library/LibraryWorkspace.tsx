"use client";

import "@/app/styles/features/library/library.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Flame,
  Heart,
  PencilLine,
  Route,
  Search,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import Select from "@/app/components/Select";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { avatarOf } from "@/app/lib/guardian";
import { useRiseIn } from "@/app/lib/motion";
import { ageLabel, toCard, type StoryCard } from "@/app/lib/storyView";
import { showToast } from "@/app/lib/toast";
import { storyService } from "@/app/services/storyService";
import { roadmapTemplate } from "@/app/services/roadmapAdapters";
import { backToLearning, takeLibraryPick, type LibraryPick } from "@/app/features/learning/learningIntent";
import AddToRoadmapDialog from "@/app/features/roadmap/AddToRoadmapDialog";
import RoadmapAlbum from "@/app/features/roadmap/RoadmapAlbum";
import TemplateDialog from "@/app/features/roadmap/TemplateDialog";
import { useRoadmapTemplates } from "@/app/features/roadmap/roadmapData";
import type { StoryDto } from "@/app/types/story";
import type { RoadmapTemplate } from "@/app/types/progress";
import type * as B from "@/app/types/backendContracts";
import { ReportDialog } from "./ModerationDialogs";
import { useCommunityStatShelves } from "./useCommunityStatShelves";
import { Preview, type PreviewStory } from "./StoryPreviewDialog";
import { LibraryBookCard, LibrarySkeletonGrid, Shelf, ShelfRow } from "./LibraryCards";
import LibraryDetailDialog from "./LibraryDetailDialog";
import LibraryFilterPopover from "./LibraryFilterPopover";
import {
  countActiveFilters,
  countPopoverFilters,
  filterAndSortStories,
  filterRoadmaps,
  isFocusedCatalog,
  recommendedStories,
  shouldShowRecommended,
  SHOWN_GROUPS,
  SORT_OPTIONS,
  sortByNewest,
  SOURCE_LABEL,
  STATUS_GROUPS,
  statusOf,
  topicOf,
  type LibrarySort,
  type StorySourceKey,
} from "./libraryFilters";

export { Preview, type PreviewStory, Shelf, ShelfRow };

/**
 * Bộ nhớ đệm của thư viện trong phiên: mở lại trang thì hiện ngay truyện đã tải, rồi tải bản mới ở nền.
 * Gắn với người dùng để đăng nhập tài khoản khác không thấy dữ liệu cũ.
 */
let pubCache: { userId: number; cards: StoryCard[]; at: number } | null = null;
const PUB_FRESH_MS = 30_000;

/** Tải lần lượt mọi trang của một API danh sách (mỗi trang tối đa 100 truyện, giới hạn của backend). */
async function loadAllPages<T extends StoryDto = StoryDto>(
  fetchPage: (pageIndex: number) => Promise<{
    success: boolean;
    data?: { items?: T[]; hasNextPage?: boolean; totalCount?: number } | null;
    message?: string | null;
  }>,
) {
  const items: T[] = [];
  for (let pageIndex = 1; pageIndex <= 50; pageIndex++) {
    const res = await fetchPage(pageIndex);
    if (!res.success) return { items, message: res.message ?? null };
    const page = res.data?.items ?? [];
    items.push(...page);
    if (page.length === 0 || res.data?.hasNextPage === false || items.length >= (res.data?.totalCount ?? Infinity)) break;
  }
  return { items, message: null as string | null };
}

export default function LibraryWorkspace({ go, onKid }: Pick<WorkspaceProps, "go" | "onKid">) {
  const { user } = useAuth();
  const { children: kids } = useWorkspaceData();

  // Mở từ nút "Thêm truyện" ở trang Học tập của bé: chọn sẵn bé đó, thêm xong thì quay về lộ trình của bé.
  const [libPick, setLibPick] = useState<LibraryPick | null>(null);
  useEffect(() => {
    setLibPick(takeLibraryPick());
  }, []);
  const pickKid = kids.find((k) => k.id === libPick?.childId) ?? null;
  const pickStage = pickKid ? (libPick?.stage ?? undefined) : undefined;
  const addedRef = useRef(false);
  const closeRoadmapDialog = (close: () => void) => {
    close();
    if (addedRef.current && pickKid) {
      addedRef.current = false;
      backToLearning(go, pickKid.id);
    }
  };

  // Thư viện lấy truyện đã công khai từ GET /Story và GET /Story/community rồi gộp.
  const cached = pubCache && pubCache.userId === user?.id ? pubCache : null;
  const [pub, setPub] = useState<StoryCard[]>(() => cached?.cards ?? []);
  const [storiesLoading, setStoriesLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const loadPublic = useCallback(async () => {
    const [mine, community] = await Promise.all([
      loadAllPages((pageIndex) => storyService.getStories({ pageIndex, pageSize: 100, isDescending: true })),
      loadAllPages((pageIndex) => storyService.getCommunityStories({ pageIndex, pageSize: 100, isDescending: true })),
    ]);
    const ids = new Set(mine.items.map((s) => s.id));
    const communityMap = new Map(community.items.map((s) => [s.id, s]));
    const all = [...mine.items, ...community.items.filter((s) => !ids.has(s.id))];
    const cards: StoryCard[] = all.map((s) => {
      const comm = communityMap.get(s.id);
      return comm
        ? { ...toCard(s), creator: true, viewCount: comm.viewCount, favoriteCount: comm.favoriteCount }
        : toCard(s);
    });
    const message = mine.message ?? community.message;
    setPub(cards);
    if (!message && user) pubCache = { userId: user.id, cards, at: Date.now() };
    setError(message);
    setStoriesLoading(false);
  }, [user]);

  useEffect(() => {
    if (cached && Date.now() - cached.at < PUB_FRESH_MS) return;
    void loadPublic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPublic]);

  const stories = useMemo(
    () => pub.filter((s) => s.raw.isPublished && (SHOWN_GROUPS as readonly string[]).includes(statusOf(s))),
    [pub],
  );

  const [tab, setTab] = useState<"stories" | "roadmaps">("stories");
  const [spotlightTab, setSpotlightTab] = useState<"views" | "favorites">("views");
  const [filterOpen, setFilterOpen] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [genreF, setGenreF] = useState("all");
  const [ageF, setAgeF] = useState("all");
  const [srcF, setSrcF] = useState("all");
  const [sort, setSort] = useState<LibrarySort>("recent");

  const [roadmapQuery, setRoadmapQuery] = useState("");
  const [roadmapAge, setRoadmapAge] = useState("all");
  const { templates, error: roadmapError } = useRoadmapTemplates();
  const [openedTpl, setOpenedTpl] = useState<B.RoadmapLibraryItemDto | null>(null);
  const [addingTpl, setAddingTpl] = useState<RoadmapTemplate | null>(null);

  const [selected, setSelected] = useState<number | null>(null);
  const [dialog, setDialog] = useState<"preview" | "roadmap" | "report" | null>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);

  const closeDetails = useCallback(() => {
    setSelected(null);
    returnFocus.current?.focus({ preventScroll: true });
  }, []);

  const clearStoryFilters = useCallback(() => {
    setQ("");
    setStatus("all");
    setGenreF("all");
    setAgeF("all");
    setSrcF("all");
    setSort("recent");
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
  const ageBands = useMemo(() => [...new Set(sorted.map((s) => s.ageBand).filter(Boolean))], [sorted]);

  const filterState = useMemo(
    () => ({ query: q, status, genre: genreF, age: ageF, source: srcF, sort }),
    [q, status, genreF, ageF, srcF, sort],
  );
  const activeCount = countActiveFilters(filterState);
  const popoverCount = countPopoverFilters(filterState);
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
    spotlightTab === "favorites" && favoritedCards.length > 0
      ? "favorites"
      : viewedCards.length > 0
        ? "views"
        : "favorites";
  const spotlightCards = activeSpotlight === "views" ? viewedCards : favoritedCards;

  const childAgeBands = useMemo(() => (pickKid ? [pickKid] : kids).map((kid) => kid.ageBand), [pickKid, kids]);
  const recommended = useMemo(() => recommendedStories(sorted, childAgeBands, 6), [sorted, childAgeBands]);
  const showRecommended = shouldShowRecommended(sorted, recommended, !!pickKid);

  const roadmapAges = useMemo(() => [...new Set((templates ?? []).map((t) => t.ageBand).filter(Boolean))], [templates]);
  const roadmapResults = useMemo(
    () => filterRoadmaps(templates, roadmapQuery, roadmapAge),
    [templates, roadmapQuery, roadmapAge],
  );

  const sel =
    stories.find((s) => s.id === selected) ??
    viewedCards.find((s) => s.id === selected) ??
    favoritedCards.find((s) => s.id === selected) ??
    null;
  const detailOpen = !!sel && !dialog;

  const pickStory = useCallback((storyId: number, button: HTMLButtonElement) => {
    returnFocus.current = button;
    setSelected(storyId);
  }, []);

  const gridAnimKey = results.map((s) => s.id).join(",");
  const gridRef = useRiseIn<HTMLDivElement>(".bk", [tab, focused, gridAnimKey], { delay: 18, distance: 10 });

  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; remove: () => void }[] = [];
    if (q.trim()) chips.push({ id: "q", label: `Từ khóa: “${q.trim()}”`, remove: () => setQ("") });
    if (genreF !== "all") chips.push({ id: "genre", label: `Thể loại: ${genreF}`, remove: () => setGenreF("all") });
    if (ageF !== "all") chips.push({ id: "age", label: `Độ tuổi: ${ageLabel(ageF)}`, remove: () => setAgeF("all") });
    if (srcF !== "all")
      chips.push({ id: "src", label: `Nguồn: ${SOURCE_LABEL[srcF as StorySourceKey] ?? srcF}`, remove: () => setSrcF("all") });
    if (status !== "all") {
      const label = STATUS_GROUPS.find((g) => g.id === status)?.label ?? status;
      chips.push({ id: "status", label: `Trạng thái: ${label}`, remove: () => setStatus("all") });
    }
    if (sort !== "recent") {
      const label = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort;
      chips.push({ id: "sort", label: `Sắp xếp: ${label}`, remove: () => setSort("recent") });
    }
    return chips;
  }, [q, genreF, ageF, srcF, status, sort]);

  return (
    <section className="ws dock lib lib-catalog">
      <div className="pane">
        <div className="lib-scroll">
          {pickKid && (
            <div className="lib-pickbar" role="status">
              <span className="av" aria-hidden="true">
                {avatarOf(pickKid.avatarId).emoji}
              </span>
              <b className="grow">
                Đang chọn truyện cho {pickKid.nickname}
                {pickStage !== undefined && ` · ${pickStage === "new" ? "Chặng mới" : `Chặng ${pickStage}`}`}
              </b>
              <button type="button" className="btn btn-s" onClick={() => backToLearning(go, pickKid.id)}>
                <ArrowLeft className="ic" aria-hidden="true" />
                Quay lại
              </button>
              <button
                type="button"
                className="btn btn-g icon-only"
                aria-label="Thôi chọn"
                title="Thôi chọn"
                onClick={() => setLibPick(null)}
              >
                <X className="ic" aria-hidden="true" />
              </button>
            </div>
          )}

          <header className="lib-head">
            <div className="lib-head-copy">
              <h2 className="display lib-title">Thư viện</h2>
              <p className="lib-sub">
                {pickKid
                  ? `Chọn truyện phù hợp để thêm vào lộ trình của ${pickKid.nickname}.`
                  : "Khám phá kho truyện đã kiểm duyệt và các lộ trình đọc gợi ý cho bé."}
              </p>
            </div>
            <div className="lib-switch" role="tablist" aria-label="Danh mục thư viện">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "stories"}
                className={tab === "stories" ? "on" : ""}
                onClick={() => {
                  setTab("stories");
                  setFilterOpen(false);
                }}
              >
                <BookOpen className="ic" aria-hidden="true" />
                <span>Truyện</span>
                {!storiesLoading && <span className="lib-switch-n lib-num">{stories.length}</span>}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "roadmaps"}
                className={tab === "roadmaps" ? "on" : ""}
                onClick={() => {
                  setTab("roadmaps");
                  setFilterOpen(false);
                }}
              >
                <Route className="ic" aria-hidden="true" />
                <span>Lộ trình mẫu</span>
                {templates !== null && <span className="lib-switch-n lib-num">{templates.length}</span>}
              </button>
            </div>
          </header>

          <div className="lib-toolbar">
            <div className="lib-search">
              <Search className="ic lib-search-ic" aria-hidden="true" />
              <input
                className="lib-search-inp"
                type="search"
                value={tab === "stories" ? q : roadmapQuery}
                onChange={(event) => (tab === "stories" ? setQ : setRoadmapQuery)(event.target.value)}
                placeholder={tab === "stories" ? "Tìm theo tên hoặc chủ đề truyện…" : "Tìm lộ trình mẫu…"}
                aria-label={tab === "stories" ? "Tìm theo tên truyện" : "Tìm lộ trình mẫu"}
              />
              {(tab === "stories" ? q : roadmapQuery) && (
                <button
                  type="button"
                  className="btn btn-g icon-only lib-search-clear"
                  aria-label="Xoá từ khóa tìm kiếm"
                  onClick={() => (tab === "stories" ? setQ("") : setRoadmapQuery(""))}
                >
                  <X className="ic" aria-hidden="true" />
                </button>
              )}
            </div>

            {tab === "stories" && (
              <div className="lib-toolbar-actions">
                <div className="lib-sort">
                  <span className="lib-sort-lbl">Sắp xếp</span>
                  <Select<LibrarySort>
                    className="lib-sort-sel"
                    ariaLabel="Sắp xếp truyện"
                    value={sort}
                    options={SORT_OPTIONS}
                    onChange={setSort}
                    portal
                  />
                </div>
                <LibraryFilterPopover
                  open={filterOpen}
                  onToggle={() => setFilterOpen((v) => !v)}
                  onClose={() => setFilterOpen(false)}
                  stories={stories}
                  ageBands={ageBands}
                  status={status}
                  age={ageF}
                  source={srcF}
                  activePopoverCount={popoverCount}
                  hasAnyFilter={activeCount > 0}
                  onStatusChange={setStatus}
                  onAgeChange={setAgeF}
                  onSourceChange={setSrcF}
                  onClearAll={() => {
                    setStatus("all");
                    setGenreF("all");
                    setAgeF("all");
                    setSrcF("all");
                  }}
                />
              </div>
            )}
          </div>

          {tab === "stories" ? (
            <>
              {topicEntries.length > 1 && (
                <div className="lib-topics" role="group" aria-label="Lọc nhanh theo thể loại">
                  <button
                    type="button"
                    className={`lib-topic-pill${genreF === "all" ? " on" : ""}`}
                    aria-pressed={genreF === "all"}
                    onClick={() => setGenreF("all")}
                  >
                    <span>Tất cả</span>
                    <span className="lib-pill-n lib-num">{stories.length}</span>
                  </button>
                  {topicEntries.map(([label, count]) => (
                    <button
                      type="button"
                      key={label}
                      className={`lib-topic-pill${genreF === label ? " on" : ""}`}
                      aria-pressed={genreF === label}
                      onClick={() => setGenreF((cur) => (cur === label ? "all" : label))}
                    >
                      <span>{label}</span>
                      <span className="lib-pill-n lib-num">{count}</span>
                    </button>
                  ))}
                </div>
              )}

              {(focused || activeChips.length > 0) && (
                <div className="lib-summary">
                  <span className="lib-count lib-num" role="status">
                    {storiesLoading
                      ? "Đang tải truyện…"
                      : `Hiển thị ${results.length} / ${stories.length} truyện`}
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
                    <button type="button" className="lib-reset-btn" onClick={clearStoryFilters}>
                      Đặt lại
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="notice err" role="alert">
                  {error}
                </div>
              )}

              {storiesLoading && stories.length === 0 ? (
                <LibrarySkeletonGrid count={6} label="Đang tải danh sách truyện…" />
              ) : stories.length === 0 && !error ? (
                <div className="lib-empty-panel">
                  <Frog size={96} mood="idle" />
                  <h3 className="display">Thư viện chưa có truyện nào</h3>
                  <p>Bắt đầu tạo truyện mới bằng AI hoặc tự viết câu chuyện riêng cho gia đình bạn.</p>
                  <div className="row lib-empty-actions">
                    <button type="button" className="btn btn-gold" onClick={() => go("studio")}>
                      <WandSparkles className="ic" aria-hidden="true" />
                      Dùng AI tạo truyện
                    </button>
                    <button type="button" className="btn btn-s" onClick={() => go("authoring")}>
                      <PencilLine className="ic" aria-hidden="true" />
                      Viết thủ công
                    </button>
                  </div>
                </div>
              ) : focused ? (
                results.length > 0 ? (
                  <section className="lib-section" aria-labelledby="lib-results-heading">
                    <div className="lib-sec-head">
                      <h3 id="lib-results-heading" className="display">
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
                          rank={sort !== "recent" ? idx + 1 : undefined}
                          onPick={(btn) => pickStory(story.id, btn)}
                        />
                      ))}
                    </div>
                  </section>
                ) : (
                  <div className="lib-empty-panel">
                    <Frog size={88} mood="think" />
                    <h3 className="display">Không tìm thấy truyện phù hợp</h3>
                    <p>Thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc đang áp dụng.</p>
                    <button type="button" className="btn btn-s" onClick={clearStoryFilters}>
                      <X className="ic" aria-hidden="true" />
                      Xoá bộ lọc
                    </button>
                  </div>
                )
              ) : (
                <>
                  {spotlightCards.length > 0 && (
                    <section className="lib-spotlight" aria-labelledby="lib-spotlight-heading">
                      <div className="lib-sec-head">
                        <div className="lib-sec-title-group">
                          <h3 id="lib-spotlight-heading" className="display">
                            {viewedCards.length > 0 && favoritedCards.length > 0
                              ? "Nổi bật trong cộng đồng"
                              : activeSpotlight === "views"
                                ? "Đọc nhiều nhất"
                                : "Được yêu thích"}
                          </h3>
                          {viewedCards.length > 0 && favoritedCards.length > 0 && (
                            <div className="lib-spot-tabs" role="tablist" aria-label="Bảng xếp hạng cộng đồng">
                              <button
                                type="button"
                                role="tab"
                                aria-selected={activeSpotlight === "views"}
                                className={activeSpotlight === "views" ? "on" : ""}
                                onClick={() => setSpotlightTab("views")}
                              >
                                <Flame className="ic" aria-hidden="true" />
                                Đọc nhiều
                              </button>
                              <button
                                type="button"
                                role="tab"
                                aria-selected={activeSpotlight === "favorites"}
                                className={activeSpotlight === "favorites" ? "on" : ""}
                                onClick={() => setSpotlightTab("favorites")}
                              >
                                <Heart className="ic" aria-hidden="true" />
                                Yêu thích
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="shelf-all"
                          onClick={() => setSort(activeSpotlight === "views" ? "views" : "favorites")}
                        >
                          Xem tất cả
                          <ChevronRight className="ic" aria-hidden="true" />
                        </button>
                      </div>
                      <ShelfRow>
                        {spotlightCards.map((story, index) => (
                          <LibraryBookCard
                            key={`${activeSpotlight}-${story.id}`}
                            story={story}
                            rank={index + 1}
                            onPick={(btn) => pickStory(story.id, btn)}
                          />
                        ))}
                      </ShelfRow>
                    </section>
                  )}

                  {showRecommended && (
                    <section className="lib-section" aria-labelledby="lib-recommended-heading">
                      <div className="lib-sec-head">
                        <div className="lib-sec-title-group">
                          <h3 id="lib-recommended-heading" className="display">
                            <Sparkles className="ic lib-sec-ic" aria-hidden="true" />
                            {pickKid ? `Đề xuất cho ${pickKid.nickname}` : "Đề xuất cho bé"}
                          </h3>
                          <span className="lib-sec-meta">Truyện sẵn sàng hợp độ tuổi của bé</span>
                        </div>
                      </div>
                      <ShelfRow>
                        {recommended.map((story) => (
                          <LibraryBookCard
                            key={`rec-${story.id}`}
                            story={story}
                            onPick={(btn) => pickStory(story.id, btn)}
                          />
                        ))}
                      </ShelfRow>
                    </section>
                  )}

                  <section className="lib-section" aria-labelledby="lib-all-heading">
                    <div className="lib-sec-head">
                      <div className="lib-sec-title-group">
                        <h3 id="lib-all-heading" className="display">
                          Tất cả truyện
                        </h3>
                        <span className="lib-sec-meta lib-num" role="status">
                          {sorted.length} truyện
                        </span>
                      </div>
                    </div>
                    <div ref={gridRef} className="lib-grid">
                      {sorted.map((story) => (
                        <LibraryBookCard key={story.id} story={story} onPick={(btn) => pickStory(story.id, btn)} />
                      ))}
                    </div>
                  </section>
                </>
              )}
            </>
          ) : (
            <>
              {roadmapAges.length > 1 && (
                <div className="lib-topics" role="group" aria-label="Lọc lộ trình theo độ tuổi">
                  <button
                    type="button"
                    className={`lib-topic-pill${roadmapAge === "all" ? " on" : ""}`}
                    aria-pressed={roadmapAge === "all"}
                    onClick={() => setRoadmapAge("all")}
                  >
                    <span>Mọi độ tuổi</span>
                    <span className="lib-pill-n lib-num">{(templates ?? []).length}</span>
                  </button>
                  {roadmapAges.map((band) => {
                    const count = (templates ?? []).filter((t) => t.ageBand === band).length;
                    return (
                      <button
                        type="button"
                        key={band}
                        className={`lib-topic-pill${roadmapAge === band ? " on" : ""}`}
                        aria-pressed={roadmapAge === band}
                        onClick={() => setRoadmapAge((cur) => (cur === band ? "all" : band))}
                      >
                        <span>{ageLabel(band)}</span>
                        <span className="lib-pill-n lib-num">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {roadmapError && (
                <div className="notice err" role="alert">
                  {roadmapError}
                </div>
              )}

              {templates === null && !roadmapError ? (
                <LibrarySkeletonGrid count={4} label="Đang tải lộ trình mẫu…" />
              ) : roadmapResults.length > 0 ? (
                <section className="lib-section" aria-labelledby="lib-roadmaps-heading">
                  <div className="lib-sec-head">
                    <div className="lib-sec-title-group">
                      <h3 id="lib-roadmaps-heading" className="display">
                        Bộ lộ trình gợi ý
                      </h3>
                      <span className="lib-sec-meta lib-num" role="status">
                        {roadmapResults.length} lộ trình
                      </span>
                    </div>
                  </div>
                  <div className="lib-roadmap-grid">
                    {roadmapResults.map((t) => (
                      <RoadmapAlbum key={`rm-${t.id}`} item={t} onOpen={() => setOpenedTpl(t)} />
                    ))}
                  </div>
                </section>
              ) : (
                !roadmapError && (
                  <div className="lib-empty-panel">
                    <Frog size={88} mood="think" />
                    <h3 className="display">
                      {roadmapQuery.trim() || roadmapAge !== "all"
                        ? "Không tìm thấy lộ trình phù hợp"
                        : "Chưa có lộ trình mẫu"}
                    </h3>
                    <p>
                      {roadmapQuery.trim() || roadmapAge !== "all"
                        ? "Thử đổi từ khóa hoặc chọn lại độ tuổi khác."
                        : "Các bộ lộ trình đọc gợi ý sẽ xuất hiện tại đây khi được phát hành."}
                    </p>
                    {(roadmapQuery.trim() || roadmapAge !== "all") && (
                      <button
                        type="button"
                        className="btn btn-s"
                        onClick={() => {
                          setRoadmapQuery("");
                          setRoadmapAge("all");
                        }}
                      >
                        <X className="ic" aria-hidden="true" />
                        Xoá bộ lọc
                      </button>
                    )}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>

      {sel && detailOpen && (
        <LibraryDetailDialog
          story={sel}
          go={go}
          onKid={onKid}
          onClose={closeDetails}
          onPreview={() => setDialog("preview")}
          onAddRoadmap={() => setDialog("roadmap")}
          onReport={() => setDialog("report")}
        />
      )}
      {sel && dialog === "preview" && <Preview story={sel} onClose={() => setDialog(null)} />}
      {openedTpl && (
        <TemplateDialog
          item={openedTpl}
          onClose={() => setOpenedTpl(null)}
          onAdd={(d) => {
            setOpenedTpl(null);
            setAddingTpl(roadmapTemplate(d));
          }}
        />
      )}
      {addingTpl && (
        <AddToRoadmapDialog
          template={addingTpl}
          childId={pickKid?.id}
          single={!!pickKid}
          onDone={() => {
            addedRef.current = true;
          }}
          onClose={() => closeRoadmapDialog(() => setAddingTpl(null))}
        />
      )}
      {sel && dialog === "roadmap" && (
        <AddToRoadmapDialog
          story={{ storyId: sel.id, title: sel.title, ageBand: sel.ageBand, length: sel.words }}
          childId={pickKid?.id}
          single={!!pickKid}
          targetStage={pickStage}
          onDone={() => {
            addedRef.current = true;
          }}
          onClose={() => closeRoadmapDialog(() => setDialog(null))}
        />
      )}
      {sel && dialog === "report" && (
        <ReportDialog
          story={sel}
          onClose={() => setDialog(null)}
          onDone={(m) => {
            setDialog(null);
            showToast(m, "ok");
          }}
        />
      )}
    </section>
  );
}
