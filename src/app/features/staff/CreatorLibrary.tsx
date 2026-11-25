"use client";

import "@/app/styles/features/library/library.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, PencilLine, RefreshCw, Search, Sparkles, WandSparkles, X } from "lucide-react";
import Select from "@/app/components/Select";
import Frog from "@/app/components/brand/Frog";
import { LibrarySkeletonGrid, ShelfRow } from "@/app/features/library/LibraryCards";
import { jumpToSection } from "@/app/features/library/LibraryDiscoveryHighlights";
import LibraryStoriesFilterBar, { type ActiveFilterChip } from "@/app/features/library/LibraryStoriesFilterBar";
import { useRiseIn } from "@/app/lib/motion";
import { creatorService } from "@/app/services/creatorService";
import { creatorPublicationService } from "@/app/services/creatorPublicationService";
import type { CreatorDraft } from "@/app/types/creator";
import CreatorPreview from "./CreatorPreview";
import CreatorLibraryCard from "./CreatorLibraryCard";
import CreatorLibraryDetail from "./CreatorLibraryDetail";
import { CreatorFilterPopover, CreatorLibrarySidebar } from "./CreatorLibrarySidebar";
import {
  ageText, CREATOR_SORT_OPTIONS, EMPTY_FILTERS, facets, filterCreatorStories, isAi, isFiltering, SHELVES, shelfOf, SOURCE, sortCreatorStories, topicFacets,
  type CreatorLibraryFilterState, type CreatorLibrarySort,
} from "./creatorLibraryFilters";
import { Notice } from "./ui";
import type { CreatorPageProps } from "./CreatorStories";

export { SHELVES, shelfOf };

/** Trang "Thư viện" của Content Creator: cùng bố cục Thư viện phụ huynh (thanh lọc trái, tìm kiếm/sắp xếp, lưới thẻ, popup chi tiết). */
export function CreatorLibrary({ go }: CreatorPageProps) {
  const [list, setList] = useState<CreatorDraft[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [filters, setFilters] = useState<CreatorLibraryFilterState>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<number | null>(null);
  const [reading, setReading] = useState(false);
  const returnFocus = useRef<HTMLButtonElement | null>(null);

  // Danh sách truyện của creator không có cờ "đã công khai" (Ready cả khi chưa gửi duyệt), nên hỏi trạng thái phát hành của từng truyện Ready.
  const [published, setPublished] = useState<Record<number, boolean>>({});
  const load = useCallback(async () => {
    setList(null);
    const r = await creatorService.list();
    const items = r.ok ? r.data?.items ?? [] : [];
    setNote(r.ok ? null : { ok: false, text: r.message || "Không tải được thư viện truyện. Vui lòng thử lại." });
    setFailed(!r.ok);
    const ids = items.filter((s) => shelfOf(s) === "ready").map((s) => s.storyId);
    const next: Record<number, boolean> = {};
    for (let i = 0; i < ids.length; i += 6) {
      await Promise.all(ids.slice(i, i + 6).map(async (id) => {
        const p = await creatorPublicationService.status(id).catch(() => null);
        next[id] = !!(p?.success && p.data?.isPublished);
      }));
    }
    setPublished(next);
    setList(items);
  }, []);
  useEffect(() => { void load(); }, [load]);

  // Thư viện chỉ hiện truyện đã được Moderator duyệt công khai.
  const all = useMemo(() => (list ?? []).filter((s) => published[s.storyId]), [list, published]);
  const newest = useMemo(() => sortCreatorStories(all, "updated").slice(0, 4), [all]);
  const results = useMemo(() => filterCreatorStories(all, filters), [all, filters]);
  const focused = isFiltering(filters);
  const change = useCallback((patch: Partial<CreatorLibraryFilterState>) => setFilters((f) => ({ ...f, ...patch })), []);
  const clear = useCallback(() => setFilters((f) => ({ ...EMPTY_FILTERS, sort: f.sort })), []);
  const activeCount = [filters.age, filters.genre, filters.source, filters.status].filter((v) => v !== "all").length;

  const chips: ActiveFilterChip[] = [
    filters.query.trim() && { id: "q", label: `Từ khóa: “${filters.query.trim()}”`, remove: () => change({ query: "" }) },
    filters.genre !== "all" && { id: "genre", label: `Chủ đề: ${filters.genre}`, remove: () => change({ genre: "all" }) },
    filters.age !== "all" && { id: "age", label: `Độ tuổi: ${ageText(filters.age)}`, remove: () => change({ age: "all" }) },
    filters.source !== "all" && { id: "source", label: `Nguồn: ${SOURCE[filters.source]}`, remove: () => change({ source: "all" }) },
    filters.status !== "all" && { id: "status", label: `Trạng thái: ${SHELVES.find((g) => g.id === filters.status)?.title}`, remove: () => change({ status: "all" }) },
  ].filter((c): c is ActiveFilterChip => !!c);

  const gridRef = useRiseIn<HTMLDivElement>(".bk", [focused, results.map((s) => s.storyId).join(",")], { delay: results.length > 24 ? 4 : 18, distance: 10 });

  const sel = all.find((s) => s.storyId === selected) ?? null;
  const pick = (id: number, button: HTMLButtonElement) => { returnFocus.current = button; setSelected(id); };
  const closeDetail = () => {
    setSelected(null);
    if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
  };
  const card = (s: CreatorDraft, compact = false) => <CreatorLibraryCard key={s.storyId} story={s} compact={compact} onPick={(btn) => pick(s.storyId, btn)} />;
  const grid = (items: CreatorDraft[]) => <div ref={gridRef} className="lib-grid">{items.map((s) => card(s))}</div>;
  const filterProps = { stories: all, filters, onChange: change, onClear: clear };

  return (
    <section className="ws dock lib lib-catalog">
      <div className="pane">
        <div className="lib-scroll">
          <Notice note={note} />
          <div className="lib-community-layout">
            <CreatorLibrarySidebar {...filterProps} />
            <div className="lib-community-main">
              <div className="lib-toolbar">
                <div className="lib-search">
                  <Search className="ic lib-search-ic" aria-hidden="true" />
                  <input className="lib-search-inp" type="search" value={filters.query} onChange={(e) => change({ query: e.target.value })} placeholder="Tìm truyện, chủ đề…" aria-label="Tìm theo tên truyện" />
                  {filters.query && (
                    <button type="button" className="btn btn-g icon-only lib-search-clear" aria-label="Xoá từ khóa tìm kiếm" onClick={() => change({ query: "" })}><X className="ic" aria-hidden="true" /></button>
                  )}
                </div>
                <div className="lib-toolbar-actions">
                  <div className="lib-sort">
                    <span className="lib-sort-lbl">Sắp xếp</span>
                    <Select<CreatorLibrarySort> className="lib-sort-sel" ariaLabel="Sắp xếp truyện" value={filters.sort} options={CREATOR_SORT_OPTIONS} onChange={(sort) => change({ sort })} portal />
                  </div>
                  <CreatorFilterPopover {...filterProps} activeCount={activeCount} />
                </div>
              </div>

              <LibraryStoriesFilterBar
                totalStories={all.length}
                resultsCount={results.length}
                storiesLoading={list === null}
                focused={focused}
                genreF={filters.genre}
                ageF={filters.age}
                ageOptions={facets(all, (s) => s.ageBand, ageText)}
                topicEntries={topicFacets(all).map(({ key, count }) => [key, count] as [string, number])}
                activeChips={chips}
                onGenreChange={(genre) => change({ genre })}
                onAgeChange={(age) => change({ age })}
                onClearFilters={clear}
              />

              {list === null ? (
                <LibrarySkeletonGrid count={6} label="Đang tải danh sách truyện…" />
              ) : failed && all.length === 0 ? (
                <div className="lib-empty-panel lib-error-panel">
                  <Frog size={84} mood="think" />
                  <h3 className="display">Không tải được thư viện truyện</h3>
                  <p>Kiểm tra kết nối mạng rồi thử lại.</p>
                  <button type="button" className="btn btn-p" onClick={() => void load()}><RefreshCw className="ic" aria-hidden="true" />Thử lại</button>
                </div>
              ) : all.length === 0 ? (
                <div className="lib-empty-panel">
                  <Frog size={96} mood="idle" />
                  <h3 className="display">Chưa có truyện nào được công khai</h3>
                  <p>Truyện sẽ hiện ở đây sau khi kiểm duyệt viên duyệt công khai.</p>
                  <div className="row lib-empty-actions">
                    <button type="button" className="btn btn-gold" onClick={() => go("create-ai")}><WandSparkles className="ic" aria-hidden="true" />Dùng AI tạo truyện</button>
                    <button type="button" className="btn btn-s" onClick={() => go("create-manual")}><PencilLine className="ic" aria-hidden="true" />Viết thủ công</button>
                  </div>
                </div>
              ) : focused ? (
                results.length > 0 ? (
                  <section className="lib-section" aria-labelledby="creator-lib-results">
                    <div className="lib-sec-head">
                      <h3 id="creator-lib-results" className="display" tabIndex={-1}>Kết quả</h3>
                      <span className="lib-sec-meta lib-num">{results.length} truyện</span>
                    </div>
                    {grid(results)}
                  </section>
                ) : (
                  <div className="lib-empty-panel">
                    <Frog size={88} mood="think" />
                    <h3 className="display">Không tìm thấy truyện phù hợp</h3>
                    <p>Thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc đang áp dụng.</p>
                    <div className="row lib-empty-actions">
                      <button type="button" className="btn btn-s" onClick={clear}><X className="ic" aria-hidden="true" />Xoá bộ lọc</button>
                    </div>
                  </div>
                )
              ) : (
                <>
                  <section className="lib-section" aria-labelledby="creator-lib-recent">
                    <div className="lib-sec-head">
                      <h3 id="creator-lib-recent" className="display" tabIndex={-1}><Sparkles className="ic lib-sec-ic lib-recent-icon" aria-hidden="true" />Mới nhất</h3>
                      <button type="button" className="shelf-all" onClick={() => jumpToSection("creator-lib-all")}>Xem tất cả<ChevronRight className="ic" aria-hidden="true" /></button>
                    </div>
                    <ShelfRow>{newest.map((s) => card(s, true))}</ShelfRow>
                  </section>
                  <section className="lib-section" aria-labelledby="creator-lib-all">
                    <div className="lib-sec-head">
                      <div className="lib-sec-title-group">
                        <h3 id="creator-lib-all" className="display" tabIndex={-1}>Tất cả truyện</h3>
                        <span className="lib-sec-meta lib-num" role="status">{results.length} truyện</span>
                      </div>
                    </div>
                    {grid(results)}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {sel && !reading && (
        <CreatorLibraryDetail story={sel} onClose={closeDetail} onPreview={() => setReading(true)} onOpen={() => go(isAi(sel) ? "create-ai" : "create-manual", sel.storyId)} />
      )}
      {sel && reading && <CreatorPreview story={sel} onClose={() => setReading(false)} />}
    </section>
  );
}
