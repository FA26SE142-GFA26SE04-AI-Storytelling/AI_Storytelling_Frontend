"use client";

import "@/app/styles/features/library/library.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Info, RefreshCw, X } from "lucide-react";
import AsidePane, { AsideContext } from "@/app/components/shell/AsidePane";
import Frog from "@/app/components/brand/Frog";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { avatarOf } from "@/app/lib/guardian";
import { useRiseIn } from "@/app/lib/motion";
import { toCard, type StoryCard } from "@/app/lib/storyView";
import { showToast } from "@/app/lib/toast";
import { backToLearning, takeLibraryPick, type LibraryPick } from "@/app/features/learning/learningIntent";
import AddToRoadmapDialog from "@/app/features/roadmap/AddToRoadmapDialog";
import RoadmapAlbum from "@/app/features/roadmap/RoadmapAlbum";
import TemplateDialog from "@/app/features/roadmap/TemplateDialog";
import { useRoadmapTemplates } from "@/app/features/roadmap/roadmapData";
import { roadmapTemplate } from "@/app/services/roadmapAdapters";
import type { RoadmapTemplate } from "@/app/types/progress";
import type * as B from "@/app/types/backendContracts";
import BookCard, { BookCardSkeleton } from "./BookCard";
import LibraryFilters, { EMPTY_FILTER, isFiltering, type LibraryFilter } from "./LibraryFilters";
import { FeaturedShelf, LibraryGreeting } from "./LibraryHero";
import { ReportDialog } from "./ModerationDialogs";
import { Shelf, ShelfRow } from "./Shelf";
import StoryDetail from "./StoryDetail";
import { Preview } from "./StoryPreview";
import { isReady, useLibraryStories } from "./useLibraryStories";
import { useCommunityStatShelves } from "./useCommunityStatShelves";

const byDate = (a: StoryCard, b: StoryCard) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
const SORTERS: Record<LibraryFilter["sort"], (a: StoryCard, b: StoryCard) => number> = {
  newest: byDate,
  views: (a, b) => (b.viewCount ?? -1) - (a.viewCount ?? -1) || byDate(a, b),
  favorites: (a, b) => (b.favoriteCount ?? -1) - (a.favoriteCount ?? -1) || byDate(a, b),
};

/** Lưới truyện: chạy hiệu ứng hiện dần mỗi khi danh sách kết quả đổi. */
function StoryGrid({ items, children }: { items: StoryCard[]; children: React.ReactNode }) {
  const ref = useRiseIn<HTMLDivElement>(".lbk", [items.map((s) => s.id).join(",")], { delay: 18, distance: 10 });
  return <div ref={ref} className="lib-grid">{children}</div>;
}

/**
 * Thư viện cộng đồng của phụ huynh: lời chào của ếch, hàng nổi bật, thanh lọc luôn hiện và lưới truyện đã được duyệt;
 * khung "Chi tiết" bên phải mở khi chọn một truyện.
 */
export default function LibraryWorkspace({ go, onKid }: Pick<WorkspaceProps, "go" | "onKid">) {
  const { children: kids } = useWorkspaceData();
  // Mở từ nút "Thêm truyện" ở trang Học tập của bé: chọn sẵn bé đó, thêm xong thì quay về lộ trình của bé.
  const [libPick, setLibPick] = useState<LibraryPick | null>(null);
  useEffect(() => { setLibPick(takeLibraryPick()); }, []);
  const pickKid = kids.find((k) => k.id === libPick?.childId) ?? null;
  // Chặng đích (khi đi từ một chặng trên bản đồ lộ trình): số chặng, hoặc "new" = chặng mới ở cuối.
  const pickStage = pickKid ? libPick?.stage ?? undefined : undefined;
  const addedRef = useRef(false);
  const closeRoadmapDialog = (close: () => void) => {
    close();
    if (addedRef.current && pickKid) { addedRef.current = false; backToLearning(go, pickKid.id); }
  };

  const { stories, loading, error, reload } = useLibraryStories();
  const [filter, setFilter] = useState<LibraryFilter>(EMPTY_FILTER);
  const filtering = isFiltering(filter);
  const { mostViewed } = useCommunityStatShelves(!filtering);
  const viewed = useMemo(() => mostViewed.map((s) => ({ ...toCard(s), creator: true, viewCount: s.viewCount, favoriteCount: s.favoriteCount })), [mostViewed]);

  const ages = useMemo(() => [...new Set(stories.map((s) => s.ageBand).filter(Boolean))].sort(), [stories]);
  const topics = useMemo(() => [...new Set(stories.map((s) => s.topic).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")), [stories]);
  const results = useMemo(() => {
    const needle = filter.q.trim().toLocaleLowerCase("vi");
    return stories
      .filter((s) => (filter.age === "all" || s.ageBand === filter.age) && (filter.topic === "all" || s.topic === filter.topic) && s.title.toLocaleLowerCase("vi").includes(needle))
      .sort(SORTERS[filter.sort]);
  }, [stories, filter]);

  // Lộ trình mẫu (album) nằm cuối trang; khi tìm theo tên thì lọc cả lộ trình.
  const { templates } = useRoadmapTemplates();
  const [openedTpl, setOpenedTpl] = useState<B.RoadmapLibraryItemDto | null>(null);
  const [addingTpl, setAddingTpl] = useState<RoadmapTemplate | null>(null);
  const roadmaps = useMemo(() => {
    const needle = filter.q.trim().toLocaleLowerCase("vi");
    if (!needle) return filtering ? [] : (templates ?? []).slice(0, 12);
    return (templates ?? []).filter((t) => `${t.name} ${t.description ?? ""}`.toLocaleLowerCase("vi").includes(needle));
  }, [templates, filter.q, filtering]);

  const [selected, setSelected] = useState<number | null>(null);
  const [dialog, setDialog] = useState<"preview" | "roadmap" | "report" | null>(null);
  // Khung "Chi tiết" thu gọn được; mới vào thì thu gọn, bấm vào một truyện sẽ tự mở.
  const [asideCollapsed, setAsideCollapsed] = useState(true);
  const toggleAside = useCallback(() => setAsideCollapsed((v) => !v), []);
  const aside = useMemo(() => ({ collapsed: asideCollapsed, toggle: toggleAside }), [asideCollapsed, toggleAside]);
  const sel = stories.find((s) => s.id === selected) ?? viewed.find((s) => s.id === selected) ?? null;
  const pick = (id: number) => { setSelected(id); setAsideCollapsed(false); };
  const card = (s: StoryCard, rank?: number) => <BookCard key={s.id} story={s} rank={rank} on={sel?.id === s.id} onPick={() => pick(s.id)} />;

  const firstLoad = loading && stories.length === 0;
  const latest = stories.slice(0, 10);

  return (
    <AsideContext.Provider value={aside}>
    <section className="ws dock lib lib-community" data-aside={asideCollapsed ? "collapsed" : undefined}>
      <div className="pane">
        <div className="lib-scroll">
          {pickKid && (
            <div className="lib-pickbar" role="status">
              <span className="av" aria-hidden>{avatarOf(pickKid.avatarId).emoji}</span>
              <b className="grow">Đang chọn truyện cho {pickKid.nickname}{pickStage !== undefined && ` · ${pickStage === "new" ? "Chặng mới" : `Chặng ${pickStage}`}`}</b>
              <button className="btn btn-s" onClick={() => backToLearning(go, pickKid.id)}><ArrowLeft className="ic" />Quay lại</button>
              <button className="btn btn-g icon-only" aria-label="Thôi chọn" title="Thôi chọn" onClick={() => setLibPick(null)}><X className="ic" /></button>
            </div>
          )}
          {error && (
            <div className="notice err row" role="alert" data-inline-notice>
              <span className="grow">{error}</span>
              <button className="btn btn-s" onClick={() => void reload()}><RefreshCw className="ic" />Thử lại</button>
            </div>
          )}
          {!filtering && <LibraryGreeting total={stories.length} ready={stories.filter(isReady).length} />}
          {!filtering && !firstLoad && <FeaturedShelf viewed={viewed} latest={latest} card={card} />}

          <section className="lib-all" aria-label="Tất cả truyện">
            <div className="shelf-h">
              <h3 className="display">{filtering ? "Kết quả" : "Tất cả truyện"}</h3>
              {!firstLoad && <span className="sub">{results.length} truyện</span>}
            </div>
            <LibraryFilters value={filter} onChange={setFilter} ages={ages} topics={topics} />
            {firstLoad ? (
              <div className="lib-grid" role="status" aria-label="Đang tải truyện">{Array.from({ length: 8 }, (_, i) => <BookCardSkeleton key={i} />)}</div>
            ) : stories.length === 0 ? (
              <div className="lib-nores">
                <Frog size={110} mood="think" />
                <b className="display">Đầm sen chưa có truyện nào</b>
                <p className="sub">Khi nhà sáng tạo có truyện được kiểm duyệt và công khai, truyện sẽ xuất hiện ở đây.</p>
              </div>
            ) : results.length === 0 ? (
              <div className="lib-nores">
                <Frog size={96} mood="think" />
                <b className="display">Không tìm thấy truyện phù hợp</b>
                <p className="sub">Thử tìm tên khác hoặc bỏ bớt bộ lọc nhé.</p>
                <button className="btn btn-s" onClick={() => setFilter({ ...EMPTY_FILTER, sort: filter.sort })}><X className="ic" />Xoá bộ lọc</button>
              </div>
            ) : (
              <StoryGrid items={results}>{results.map((s) => card(s))}</StoryGrid>
            )}
          </section>

          {roadmaps.length > 0 && (
            <Shelf title="Lộ trình mẫu" sub={filtering ? `${roadmaps.length} lộ trình` : "Bộ truyện xếp sẵn theo chặng"} items={roadmaps}>
              <ShelfRow>{roadmaps.map((t) => <RoadmapAlbum key={`rm-${t.id}`} item={t} onOpen={() => setOpenedTpl(t)} />)}</ShelfRow>
            </Shelf>
          )}
        </div>
      </div>

      <AsidePane title="Chi tiết" icon={Info}>
        <StoryDetail story={sel} onKid={onKid} onRoadmap={() => setDialog("roadmap")} onReport={() => setDialog("report")} onPreview={() => setDialog("preview")} />
      </AsidePane>
      {sel && dialog === "preview" && <Preview story={sel} onClose={() => setDialog(null)} />}
      {openedTpl && <TemplateDialog item={openedTpl} onClose={() => setOpenedTpl(null)} onAdd={(d) => { setOpenedTpl(null); setAddingTpl(roadmapTemplate(d)); }} />}
      {addingTpl && <AddToRoadmapDialog template={addingTpl} childId={pickKid?.id} single={!!pickKid} onDone={() => { addedRef.current = true; }} onClose={() => closeRoadmapDialog(() => setAddingTpl(null))} />}
      {sel && dialog === "roadmap" && <AddToRoadmapDialog story={{ storyId: sel.id, title: sel.title, ageBand: sel.ageBand, length: sel.words }} childId={pickKid?.id} single={!!pickKid} targetStage={pickStage} onDone={() => { addedRef.current = true; }} onClose={() => closeRoadmapDialog(() => setDialog(null))} />}
      {sel && dialog === "report" && <ReportDialog story={sel} onClose={() => setDialog(null)} onDone={(m) => { setDialog(null); showToast(m); }} />}
    </section>
    </AsideContext.Provider>
  );
}
