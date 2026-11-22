"use client";

import { ArrowLeft, BookOpen, Route, Search, X } from "lucide-react";
import Select from "@/app/components/Select";
import Lotus from "@/app/components/brand/Lotus";
import { avatarOf } from "@/app/lib/guardian";
import type { StoryCard } from "@/app/lib/storyView";
import type { ChildProfile } from "@/app/types/childProfile";
import LibraryFilterPopover from "./LibraryFilterPopover";
import type { LibraryExtraFilterProps } from "./LibraryExtraFilters";
import { SORT_OPTIONS, type AgeFilterOption, type LibrarySort } from "./libraryFilters";

export type LibraryHeaderProps = {
  pickKid: ChildProfile | null;
  pickStage: number | "new" | undefined;
  tab: "stories" | "roadmaps";
  storiesCount: number;
  storiesLoading: boolean;
  templatesCount: number | null;
  query: string;
  roadmapQuery: string;
  sort: LibrarySort;
  filterOpen: boolean;
  stories: StoryCard[];
  ageOptions: AgeFilterOption[];
  status: string;
  age: string;
  source: string;
  popoverCount: number;
  extraFilters?: LibraryExtraFilterProps;
  onBackToLearning: () => void;
  onDismissPickKid: () => void;
  onTabChange: (tab: "stories" | "roadmaps") => void;
  onQueryChange: (value: string) => void;
  onRoadmapQueryChange: (value: string) => void;
  onSortChange: (value: LibrarySort) => void;
  onToggleFilter: () => void;
  onCloseFilter: () => void;
  onStatusChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onClearPopover: () => void;
};

/** Phần đầu trang Thư viện phụ huynh: thanh chọn truyện cho bé, tiêu đề, chuyển tab và thanh tìm kiếm/lọc. */
export default function LibraryHeader({
  pickKid,
  pickStage,
  tab,
  storiesCount,
  storiesLoading,
  templatesCount,
  query,
  roadmapQuery,
  sort,
  filterOpen,
  stories,
  ageOptions,
  status,
  age,
  source,
  popoverCount,
  extraFilters,
  onBackToLearning,
  onDismissPickKid,
  onTabChange,
  onQueryChange,
  onRoadmapQueryChange,
  onSortChange,
  onToggleFilter,
  onCloseFilter,
  onStatusChange,
  onAgeChange,
  onSourceChange,
  onClearPopover,
}: LibraryHeaderProps) {
  const activeQuery = tab === "stories" ? query : roadmapQuery;

  return (
    <>
      {pickKid && (
        <div className="lib-pickbar" role="status">
          <span className="av" aria-hidden="true">
            {avatarOf(pickKid.avatarId).emoji}
          </span>
          <b className="grow">
            Đang chọn truyện cho {pickKid.nickname}
            {pickStage !== undefined && ` · ${pickStage === "new" ? "Chặng mới" : `Chặng ${pickStage}`}`}
          </b>
          <button type="button" className="btn btn-s" onClick={onBackToLearning}>
            <ArrowLeft className="ic" aria-hidden="true" />
            Quay lại
          </button>
          <button
            type="button"
            className="btn btn-g icon-only"
            aria-label="Thôi chọn"
            title="Thôi chọn"
            onClick={onDismissPickKid}
          >
            <X className="ic" aria-hidden="true" />
          </button>
        </div>
      )}

      <header className="lib-head">
        {tab === "stories" && (
          <div className="lib-header-pond" aria-hidden="true">
            <Lotus className="lib-pond-lotus-small" size={54} />
            <Lotus className="lib-pond-lotus-large" size={88} />
          </div>
        )}
        <div className="lib-head-copy">
          <h2 className="display lib-title">{tab === "stories" ? "Thư viện truyện cộng đồng" : "Lộ trình mẫu"}</h2>
          <p className="lib-sub">
            {pickKid
              ? `Chọn truyện phù hợp để thêm vào lộ trình của ${pickKid.nickname}.`
              : tab === "stories"
                ? "Kho truyện do cộng đồng Taletale cùng sáng tạo – những câu chuyện an toàn, ý nghĩa và phù hợp cho bé."
                : "Khám phá các bộ lộ trình đọc gợi ý theo độ tuổi cho bé."}
          </p>
        </div>
        <div className="lib-switch" role="tablist" aria-label="Danh mục thư viện">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "stories"}
            className={tab === "stories" ? "on" : ""}
            onClick={() => onTabChange("stories")}
          >
            <BookOpen className="ic" aria-hidden="true" />
            <span>Truyện</span>
            {!storiesLoading && <span className="lib-switch-n lib-num">{storiesCount}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "roadmaps"}
            className={tab === "roadmaps" ? "on" : ""}
            onClick={() => onTabChange("roadmaps")}
          >
            <Route className="ic" aria-hidden="true" />
            <span>Lộ trình mẫu</span>
            {templatesCount !== null && <span className="lib-switch-n lib-num">{templatesCount}</span>}
          </button>
        </div>
      </header>

      <div className="lib-toolbar">
        <div className="lib-search">
          <Search className="ic lib-search-ic" aria-hidden="true" />
          <input
            className="lib-search-inp"
            type="search"
            value={activeQuery}
            onChange={(event) => (tab === "stories" ? onQueryChange : onRoadmapQueryChange)(event.target.value)}
            placeholder={tab === "stories" ? "Tìm truyện, chủ đề, tác giả…" : "Tìm lộ trình mẫu…"}
            aria-label={tab === "stories" ? "Tìm theo tên truyện" : "Tìm lộ trình mẫu"}
          />
          {activeQuery && (
            <button
              type="button"
              className="btn btn-g icon-only lib-search-clear"
              aria-label="Xoá từ khóa tìm kiếm"
              onClick={() => (tab === "stories" ? onQueryChange("") : onRoadmapQueryChange(""))}
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
                onChange={onSortChange}
                portal
              />
            </div>
            <LibraryFilterPopover
              open={filterOpen}
              onToggle={onToggleFilter}
              onClose={onCloseFilter}
              stories={stories}
              ageOptions={ageOptions}
              status={status}
              age={age}
              source={source}
              activePopoverCount={popoverCount}
              extraFilters={extraFilters}
              onStatusChange={onStatusChange}
              onAgeChange={onAgeChange}
              onSourceChange={onSourceChange}
              onClearPopover={onClearPopover}
            />
          </div>
        )}
      </div>
    </>
  );
}
