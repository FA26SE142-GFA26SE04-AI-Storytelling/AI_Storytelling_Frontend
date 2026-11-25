"use client";

import "@/app/styles/features/library/library.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { backToLearning, takeLibraryPick, type LibraryPick } from "@/app/features/learning/learningIntent";
import { useRoadmapTemplates } from "@/app/features/roadmap/roadmapData";
import type * as B from "@/app/types/backendContracts";
import type { RoadmapTemplate } from "@/app/types/progress";
import { Shelf, ShelfRow } from "./LibraryCards";
import LibraryDialogs, { type LibraryDialogKind } from "./LibraryDialogs";
import LibraryFilterSidebar from "./LibraryFilterSidebar";
import LibraryHeader from "./LibraryHeader";
import LibraryRoadmapsView from "./LibraryRoadmapsView";
import LibraryStoriesView from "./LibraryStoriesView";
import EventHighlightBanner from "@/app/features/events/EventHighlightBanner";
import { Preview, type PreviewStory } from "./StoryPreviewDialog";
import { useLibraryCatalog } from "./useLibraryCatalog";
import { useLibraryDiscovery } from "./useLibraryDiscovery";

export { Preview, type PreviewStory, Shelf, ShelfRow };

export default function LibraryWorkspace({ go, onKid }: Pick<WorkspaceProps, "go" | "onKid">) {
  const { user } = useAuth();
  const { children: kids, childrenLoading } = useWorkspaceData();
  const { stories, storiesLoading, error, retryStories } = useLibraryCatalog(user?.id);

  const [libPick, setLibPick] = useState<LibraryPick | null>(null);
  useEffect(() => {
    setLibPick(takeLibraryPick());
  }, []);
  const pickKid = kids.find((k) => k.id === libPick?.childId) ?? null;
  const pickStage = pickKid ? (libPick?.stage ?? undefined) : undefined;
  const addedRef = useRef(false);
  const closeRoadmapDialog = useCallback(
    (close: () => void) => {
      const added = addedRef.current;
      addedRef.current = false;
      close();
      if (added && pickKid) {
        backToLearning(go, pickKid.id);
      }
    },
    [go, pickKid],
  );

  const [tab, setTab] = useState<"stories" | "roadmaps">("stories");
  const [filterOpen, setFilterOpen] = useState(false);
  const closeFilter = useCallback(() => setFilterOpen(false), []);

  const { templates, error: roadmapError, reload: reloadRoadmaps } = useRoadmapTemplates();
  const [openedTpl, setOpenedTpl] = useState<B.RoadmapLibraryItemDto | null>(null);
  const [addingTpl, setAddingTpl] = useState<RoadmapTemplate | null>(null);

  const [selected, setSelected] = useState<number | null>(null);
  const [dialog, setDialog] = useState<LibraryDialogKind>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);

  const closeDetails = useCallback(() => {
    setSelected(null);
    setDialog(null);
    if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
  }, []);

  const pickStory = useCallback((storyId: number, button: HTMLButtonElement) => {
    returnFocus.current = button;
    setDialog(null);
    setSelected(storyId);
  }, []);

  const discovery = useLibraryDiscovery({ stories, templates, kids, pickKid, tab });

  const sel =
    stories.find((s) => s.id === selected) ??
    discovery.viewedCards.find((s) => s.id === selected) ??
    discovery.favoritedCards.find((s) => s.id === selected) ??
    null;

  return (
    <section className="ws dock lib lib-catalog">
      <div className="pane">
        <div className="lib-scroll">
          <div className={tab === "stories" ? "lib-community-layout" : undefined}>
            {tab === "stories" && (
              <LibraryFilterSidebar
                stories={stories}
                ages={discovery.ageOptions}
                topics={discovery.topicEntries}
                age={discovery.ageF}
                genre={discovery.genreF}
                source={discovery.srcF}
                status={discovery.status}
                extraFilters={discovery.extraFilters}
                onAge={discovery.setAgeF}
                onGenre={discovery.setGenreF}
                onSource={discovery.setSrcF}
                onStatus={discovery.setStatus}
                onClear={discovery.clearStoryFilters}
              />
            )}
            <div className="lib-community-main">
              <LibraryHeader
                pickKid={pickKid}
                pickStage={pickStage}
                tab={tab}
                storiesCount={stories.length}
                storiesLoading={storiesLoading}
                templatesCount={templates !== null ? templates.length : null}
                query={discovery.q}
                roadmapQuery={discovery.roadmapQuery}
                sort={discovery.sort}
                filterOpen={filterOpen}
                stories={stories}
                ageOptions={discovery.ageOptions}
                status={discovery.status}
                age={discovery.ageF}
                source={discovery.srcF}
                popoverCount={discovery.popoverCount}
                extraFilters={discovery.extraFilters}
                onBackToLearning={() => pickKid && backToLearning(go, pickKid.id)}
                onDismissPickKid={() => setLibPick(null)}
                onTabChange={(nextTab) => {
                  setTab(nextTab);
                  setFilterOpen(false);
                }}
                onQueryChange={discovery.setQ}
                onRoadmapQueryChange={discovery.setRoadmapQuery}
                onSortChange={discovery.setSort}
                onToggleFilter={() => setFilterOpen((v) => !v)}
                onCloseFilter={closeFilter}
                onStatusChange={discovery.setStatus}
                onAgeChange={discovery.setAgeF}
                onSourceChange={discovery.setSrcF}
                onClearPopover={discovery.clearPopoverFilters}
              />

              {tab === "stories" ? (
                <>
                  <EventHighlightBanner role="Parent" onOpenEvents={() => go("events")} />
                  <LibraryStoriesView
                  stories={stories}
                  sorted={discovery.sorted}
                  results={discovery.results}
                  storiesLoading={storiesLoading}
                  error={error}
                  focused={discovery.focused}
                  sort={discovery.sort}
                  genreF={discovery.genreF}
                  ageF={discovery.ageF}
                  ageOptions={discovery.ageOptions}
                  topicEntries={discovery.topicEntries}
                  activeChips={discovery.activeChips}
                  viewedCards={discovery.viewedCards}
                  favoritedCards={discovery.favoritedCards}
                  activeSpotlight={discovery.activeSpotlight}
                  spotlightCards={discovery.spotlightCards}
                  recommended={discovery.recommended}
                  showRecommended={discovery.showRecommended}
                  pickKidName={pickKid?.nickname ?? null}
                  topicAudience={{
                    kids,
                    loading: childrenLoading,
                    preferredKidId: pickKid?.id,
                    onSelectTopic: (genre, age) => {
                      discovery.setGenreF(genre);
                      discovery.setAgeF(age);
                      discovery.setStatus("ready");
                    },
                  }}
                  matchingRoadmapsCount={discovery.matchingRoadmapsCount}
                  go={go}
                  onGenreChange={discovery.setGenreF}
                  onAgeChange={discovery.setAgeF}
                  onSortChange={discovery.setSort}
                  onSpotlightChange={discovery.setSpotlightTab}
                  onClearFilters={discovery.clearStoryFilters}
                  onRetry={retryStories}
                  onPickStory={pickStory}
                  onJumpToRoadmaps={() => {
                    discovery.setRoadmapQuery(discovery.q.trim());
                    discovery.setRoadmapAge("all");
                    discovery.setQ("");
                    setTab("roadmaps");
                    setFilterOpen(false);
                  }}
                />
                </>
              ) : (
                <LibraryRoadmapsView
                  templates={templates}
                  roadmapResults={discovery.roadmapResults}
                  ageOptions={discovery.roadmapAgeOptions}
                  query={discovery.roadmapQuery}
                  age={discovery.roadmapAge}
                  error={roadmapError}
                  onAgeChange={discovery.setRoadmapAge}
                  onClearQuery={() => discovery.setRoadmapQuery("")}
                  onClearAll={discovery.clearRoadmapFilters}
                  onRetry={reloadRoadmaps}
                  onOpenTemplate={setOpenedTpl}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <LibraryDialogs
        selectedStory={sel}
        dialog={dialog}
        openedTpl={openedTpl}
        addingTpl={addingTpl}
        pickKid={pickKid}
        pickStage={pickStage}
        go={go}
        onKid={onKid}
        onCloseDetails={closeDetails}
        onDialogChange={setDialog}
        onCloseOpenedTpl={() => setOpenedTpl(null)}
        onStartAddingTpl={setAddingTpl}
        onMarkRoadmapAdded={() => {
          addedRef.current = true;
        }}
        onCloseAddingTpl={() => closeRoadmapDialog(() => setAddingTpl(null))}
        onCloseStoryRoadmap={() => closeRoadmapDialog(() => setDialog(null))}
      />
    </section>
  );
}
