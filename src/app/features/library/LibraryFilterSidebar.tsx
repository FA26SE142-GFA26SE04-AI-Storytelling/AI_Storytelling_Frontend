import { BookOpen, Clock, Shapes, SlidersHorizontal, Tag, Users } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import Lotus from "@/app/components/brand/Lotus";
import type { StoryCard } from "@/app/lib/storyView";
import { FilterGroup, LibraryTopAuthors, type LibraryExtraFilterProps } from "./LibraryExtraFilters";
import { SOURCE_LABEL, STATUS_GROUPS, sourceOf, statusOf, type AgeFilterOption } from "./libraryFilters";

export default function LibraryFilterSidebar({ stories, ages, topics, age, genre, source, status, extraFilters, community = false, onAge, onGenre, onSource, onStatus, onClear }: {
  stories: StoryCard[];
  ages: AgeFilterOption[];
  topics: [string, number][];
  age: string;
  genre: string;
  source: string;
  status: string;
  extraFilters: LibraryExtraFilterProps;
  /** Chỉ có truyện cộng đồng đã công khai (Thư viện Creator): bỏ nhóm Nguồn và Trạng thái vì luôn chỉ có một giá trị. */
  community?: boolean;
  onAge: (value: string) => void;
  onGenre: (value: string) => void;
  onSource: (value: string) => void;
  onStatus: (value: string) => void;
  onClear: () => void;
}) {
  const sources = Object.entries(SOURCE_LABEL).map(([key, label]) => ({ key, label, count: stories.filter((story) => sourceOf(story) === key).length }));
  const statuses = STATUS_GROUPS.map(({ id, label }) => ({ key: id, label, count: stories.filter((story) => statusOf(story) === id).length }));
  return (
    <aside className="lib-sidebar" aria-label="Bộ lọc thư viện">
      <div className="lib-sidebar-art" aria-hidden="true">
        <Frog size={74} mood="happy" animated={false} />
        <BookOpen className="lib-sidebar-book" />
        <Lotus size={50} className="lib-sidebar-lotus" />
      </div>
      <div className="lib-sidebar-inner">
        <div className="lib-sidebar-head">
          <h3 className="display"><SlidersHorizontal className="ic" aria-hidden="true" />Bộ lọc</h3>
          <button type="button" className="lib-reset-btn" onClick={onClear}>Xóa tất cả</button>
        </div>
        <FilterGroup title="Độ tuổi" icon={Users} options={ages} value={age} onChange={onAge} />
        <FilterGroup title="Chủ đề" icon={Shapes} options={topics.map(([key, count]) => ({ key, label: key, count }))} value={genre} onChange={onGenre} limit={6} />
        <FilterGroup title="Thời lượng" icon={Clock} options={extraFilters.durations} value={extraFilters.duration} onChange={extraFilters.onDuration} />
        {!community && <FilterGroup title="Nguồn truyện" icon={BookOpen} options={sources.filter(({ key, count }) => count > 0 || key === source)} value={source} onChange={onSource} defaultOpen={source !== "all"} />}
        {!community && <FilterGroup title="Trạng thái" icon={Tag} options={statuses.filter(({ key, count }) => count > 0 || key === status)} value={status} onChange={onStatus} defaultOpen={status !== "all"} />}
        <LibraryTopAuthors authors={extraFilters.authors} author={extraFilters.author} onAuthor={extraFilters.onAuthor} />
      </div>
    </aside>
  );
}
