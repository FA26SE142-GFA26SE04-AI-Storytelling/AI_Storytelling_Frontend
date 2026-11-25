"use client";

import "@/app/styles/features/library/library.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { FolderOpen, Search, WandSparkles } from "lucide-react";
import Lotus from "@/app/components/brand/Lotus";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import EventHighlightBanner from "@/app/features/events/EventHighlightBanner";
import LibraryFilterSidebar from "@/app/features/library/LibraryFilterSidebar";
import LibraryStoriesView from "@/app/features/library/LibraryStoriesView";
import { LibraryFeaturedStory } from "@/app/features/library/LibraryDiscoveryHighlights";
import { Preview } from "@/app/features/library/StoryPreviewDialog";
import { loadAllPages } from "@/app/features/library/useLibraryCatalog";
import { useLibraryDiscovery } from "@/app/features/library/useLibraryDiscovery";
import { SORT_OPTIONS } from "@/app/features/library/libraryFilters";
import { storyService } from "@/app/services/storyService";
import { toCard, type StoryCard } from "@/app/lib/storyView";
import type { CreatorPageProps } from "./CreatorStories";

/** Creator's entry page shares Parent's catalogue UI, using only published community APIs. */
export default function CreatorCommunityLibrary({ go }: CreatorPageProps) {
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StoryCard | null>(null);
  const request = useRef(0);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const load = useCallback(async () => {
    const run = ++request.current;
    setLoading(true);
    try {
      const result = await loadAllPages((pageIndex) => storyService.getCommunityStories({ pageIndex, pageSize: 100, isDescending: true }));
      if (run !== request.current) return;
      setStories(result.items.filter((s) => s.isPublished).map((s) => ({ ...toCard(s), creator: true, viewCount: s.viewCount, favoriteCount: s.favoriteCount })));
      setError(result.message);
    } catch (e) {
      if (run === request.current) setError(e instanceof Error ? e.message : "Không tải được thư viện cộng đồng.");
    } finally {
      if (run === request.current) setLoading(false);
    }
  }, []);
  const invalidate = useCallback(() => { request.current++; }, []);
  useEffect(() => { void load(); return invalidate; }, [load, invalidate]);
  const discovery = useLibraryDiscovery({ stories, templates: null, kids: [], pickKid: null, tab: "stories" });
  const pickStory = (id: number, button: HTMLButtonElement) => {
    const story = stories.find((s) => s.id === id) ?? discovery.viewedCards.find((s) => s.id === id) ?? discovery.favoritedCards.find((s) => s.id === id);
    if (!story) return;
    returnFocus.current = button;
    setSelected(story);
  };
  const closePreview = () => { setSelected(null); returnFocus.current?.focus({ preventScroll: true }); };
  const goFromLibrary: WorkspaceProps["go"] = (id) => {
    if (id === "studio") go("create-ai");
    else if (id === "authoring") go("create-manual");
  };
  const featured = discovery.favoritedCards[0] ?? discovery.viewedCards[0] ?? discovery.sorted[0];

  return (
    <section className="ws dock lib lib-catalog">
      <div className="pane"><div className="lib-scroll"><div className="lib-community-layout">
        <LibraryFilterSidebar stories={stories} ages={discovery.ageOptions} topics={discovery.topicEntries}
          age={discovery.ageF} genre={discovery.genreF} source={discovery.srcF} status={discovery.status}
          extraFilters={discovery.extraFilters} onAge={discovery.setAgeF} onGenre={discovery.setGenreF}
          onSource={discovery.setSrcF} onStatus={discovery.setStatus} onClear={discovery.clearStoryFilters} />
        <div className="lib-community-main">
          <header className="lib-head">
            <div className="lib-header-pond" aria-hidden="true"><Lotus className="lib-pond-lotus-small" size={54} /><Lotus className="lib-pond-lotus-large" size={88} /></div>
            <div className="lib-head-copy"><h2 className="display lib-title">Thư viện truyện cộng đồng</h2>
              <p className="lib-sub">Khám phá những tác phẩm đã được duyệt, tìm cảm hứng và cùng Taletale sáng tạo câu chuyện ý nghĩa cho trẻ.</p></div>
          </header>
          <div className="lib-toolbar">
            <div className="lib-search"><Search className="ic lib-search-ic" aria-hidden="true" />
              <input className="lib-search-inp" type="search" aria-label="Tìm truyện cộng đồng" placeholder="Tìm truyện, chủ đề, tác giả…"
                value={discovery.q} onChange={(e) => discovery.setQ(e.target.value)} /></div>
            <label className="row sub">Sắp xếp
              <select className="sel" value={discovery.sort} onChange={(e) => discovery.setSort(e.target.value as typeof discovery.sort)}>
                {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <button type="button" className="btn btn-gold" onClick={() => go("create-ai")}><WandSparkles className="ic" aria-hidden="true" />Sáng tác truyện mới</button>
            <button type="button" className="btn btn-s" onClick={() => go("my-stories")}><FolderOpen className="ic" aria-hidden="true" />Truyện của tôi</button>
          </div>
          <EventHighlightBanner role="ContentCreator" onOpenEvents={() => go("events")} />
          {!discovery.focused && featured && <LibraryFeaturedStory story={featured} onPickStory={pickStory} />}
          <LibraryStoriesView audience="creator" stories={stories} sorted={discovery.sorted} results={discovery.results}
            storiesLoading={loading} error={error} focused={discovery.focused} sort={discovery.sort}
            genreF={discovery.genreF} ageF={discovery.ageF} ageOptions={discovery.ageOptions} topicEntries={discovery.topicEntries}
            activeChips={discovery.activeChips} viewedCards={discovery.viewedCards} favoritedCards={discovery.favoritedCards}
            activeSpotlight={discovery.activeSpotlight} spotlightCards={discovery.spotlightCards}
            recommended={[]} showRecommended={false} pickKidName={null} matchingRoadmapsCount={0}
            go={goFromLibrary} onGenreChange={discovery.setGenreF} onAgeChange={discovery.setAgeF}
            onSortChange={discovery.setSort} onSpotlightChange={discovery.setSpotlightTab}
            onClearFilters={discovery.clearStoryFilters} onRetry={() => void load()} onPickStory={pickStory}
            onJumpToRoadmaps={() => {}} />
        </div>
      </div></div></div>
      {selected && <Preview story={selected} onClose={closePreview} />}
    </section>
  );
}
