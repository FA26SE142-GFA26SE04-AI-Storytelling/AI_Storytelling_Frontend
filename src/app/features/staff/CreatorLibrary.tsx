"use client";

import "@/app/styles/features/library/library.css";
import { useCallback, useRef, useState } from "react";
import { Eye, PencilLine, WandSparkles } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import { useAuth } from "@/app/context/AuthContext";
import { LibraryDetailShell } from "@/app/features/library/LibraryDetailDialog";
import LibraryFilterSidebar from "@/app/features/library/LibraryFilterSidebar";
import LibraryHeader from "@/app/features/library/LibraryHeader";
import LibraryStoriesView from "@/app/features/library/LibraryStoriesView";
import { Preview } from "@/app/features/library/StoryPreviewDialog";
import { useLibraryCatalog } from "@/app/features/library/useLibraryCatalog";
import { useLibraryDiscovery } from "@/app/features/library/useLibraryDiscovery";
import type { ChildProfile } from "@/app/types/childProfile";
import type { CreatorPageProps } from "./CreatorStories";

const NO_KIDS: ChildProfile[] = [];
const noop = () => {};

/**
 * Trang "Thư viện" của Content Creator: cùng dữ liệu và giao diện Thư viện phụ huynh, nhưng chỉ có truyện cộng đồng đã công khai
 * (GET /Story/community). Truyện của chính Creator (authorUserId trùng tài khoản đang đăng nhập) có thêm nút "Mở để soạn tiếp".
 */
export function CreatorLibrary({ go }: CreatorPageProps) {
  const { user } = useAuth();
  const { stories, storiesLoading, error, retryStories } = useLibraryCatalog(user?.id, { communityOnly: true });
  const d = useLibraryDiscovery({ stories, templates: null, kids: NO_KIDS, pickKid: null, tab: "stories" });
  const [filterOpen, setFilterOpen] = useState(false);
  const closeFilter = useCallback(() => setFilterOpen(false), []);

  const [selected, setSelected] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const pickStory = useCallback((storyId: number, button: HTMLButtonElement) => {
    returnFocus.current = button;
    setPreviewing(false);
    setSelected(storyId);
  }, []);
  const closeDetails = useCallback(() => {
    setSelected(null);
    if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
  }, []);

  const sel = [...stories, ...d.viewedCards, ...d.favoritedCards].find((s) => s.id === selected) ?? null;
  const mine = !!sel && user?.id !== undefined && sel.raw.authorUserId === user.id;

  return (
    <section className="ws dock lib lib-catalog">
      <div className="pane">
        <div className="lib-scroll">
          <div className="lib-community-layout">
            <LibraryFilterSidebar
              stories={stories}
              ages={d.ageOptions}
              topics={d.topicEntries}
              age={d.ageF}
              genre={d.genreF}
              source={d.srcF}
              status={d.status}
              extraFilters={d.extraFilters}
              community
              onAge={d.setAgeF}
              onGenre={d.setGenreF}
              onSource={d.setSrcF}
              onStatus={d.setStatus}
              onClear={d.clearStoryFilters}
            />
            <div className="lib-community-main">
              <LibraryHeader
                community
                pickKid={null}
                pickStage={undefined}
                tab="stories"
                storiesCount={stories.length}
                storiesLoading={storiesLoading}
                templatesCount={null}
                query={d.q}
                roadmapQuery=""
                filterOpen={filterOpen}
                stories={stories}
                ageOptions={d.ageOptions}
                status={d.status}
                age={d.ageF}
                source={d.srcF}
                popoverCount={d.popoverCount}
                extraFilters={d.extraFilters}
                onBackToLearning={noop}
                onDismissPickKid={noop}
                onTabChange={noop}
                onQueryChange={d.setQ}
                onRoadmapQueryChange={noop}
                onToggleFilter={() => setFilterOpen((v) => !v)}
                onCloseFilter={closeFilter}
                onStatusChange={d.setStatus}
                onAgeChange={d.setAgeF}
                onSourceChange={d.setSrcF}
                onClearPopover={d.clearPopoverFilters}
              />
              <LibraryStoriesView
                stories={stories}
                sorted={d.sorted}
                results={d.results}
                storiesLoading={storiesLoading}
                error={error}
                focused={d.focused}
                sort={d.sort}
                genreF={d.genreF}
                ageF={d.ageF}
                ageOptions={d.ageOptions}
                topicEntries={d.topicEntries}
                activeChips={d.activeChips}
                favoritedCards={d.favoritedCards}
                activeSpotlight={d.activeSpotlight}
                spotlightCards={d.spotlightCards}
                recommended={[]}
                showRecommended={false}
                pickKidName={null}
                matchingRoadmapsCount={0}
                emptyState={
                  <div className="lib-empty-panel">
                    <Frog size={96} mood="idle" />
                    <h3 className="display">Thư viện chưa có truyện nào</h3>
                    <p>Truyện của các Creator sẽ hiện ở đây sau khi được kiểm duyệt và công khai.</p>
                    <div className="row lib-empty-actions">
                      <button type="button" className="btn btn-gold" onClick={() => go("create-ai")}><WandSparkles className="ic" aria-hidden="true" />Dùng AI tạo truyện</button>
                      <button type="button" className="btn btn-s" onClick={() => go("create-manual")}><PencilLine className="ic" aria-hidden="true" />Viết thủ công</button>
                    </div>
                  </div>
                }
                onGenreChange={d.setGenreF}
                onAgeChange={d.setAgeF}
                onSortChange={d.setSort}
                onClearFilters={d.clearStoryFilters}
                onRetry={retryStories}
                onPickStory={pickStory}
                onJumpToRoadmaps={noop}
              />
            </div>
          </div>
        </div>
      </div>

      {sel && !previewing && (
        <LibraryDetailShell story={sel} onClose={closeDetails} rating={{ averageRating: sel.raw.averageRating ?? null, ratingCount: sel.raw.ratingCount ?? 0 }}>
          {mine && (
            <div className="lib-detail-primary">
              <button type="button" className="btn btn-p btn-c" onClick={() => go(sel.fromAi ? "create-ai" : "create-manual", sel.id)}>
                {sel.fromAi ? <WandSparkles className="ic" aria-hidden="true" /> : <PencilLine className="ic" aria-hidden="true" />}
                Mở để soạn tiếp
              </button>
            </div>
          )}
          <div className="lib-detail-secondary">
            <button type="button" className="btn btn-s" onClick={() => setPreviewing(true)}>
              <Eye className="ic" aria-hidden="true" />
              Đọc thử như bé thấy
            </button>
          </div>
        </LibraryDetailShell>
      )}
      {sel && previewing && <Preview story={sel} onClose={() => setPreviewing(false)} />}
    </section>
  );
}
