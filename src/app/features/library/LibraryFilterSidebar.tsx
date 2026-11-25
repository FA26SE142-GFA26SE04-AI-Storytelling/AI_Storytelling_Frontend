import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, Clock, PanelLeftClose, PanelLeftOpen, Shapes, SlidersHorizontal, Tag, Users } from "lucide-react";
import type { StoryCard } from "@/app/lib/storyView";
import { FilterGroup, LibraryTopAuthors, type LibraryExtraFilterProps } from "./LibraryExtraFilters";
import { SOURCE_LABEL, STATUS_GROUPS, sourceOf, statusOf, type AgeFilterOption } from "./libraryFilters";

const COLLAPSED_KEY = "lib_filter_collapsed";

/**
 * Khung thanh lọc trái dùng chung (Thư viện phụ huynh, Creator, Moderator): tiêu đề "Bộ lọc", "Xóa tất cả" và nút thu gọn.
 * Khi thu gọn chỉ còn dải hẹp có nút mở và số bộ lọc đang bật; trạng thái nhớ theo trình duyệt.
 */
export function FilterSidebarShell({ active, onClear, top, children }: { active: number; onClear: () => void; top?: ReactNode; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  // Đọc sau khi mount để HTML render ở server và lần render đầu ở trình duyệt giống nhau.
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1"); } catch { /* bộ nhớ trình duyệt bị chặn */ }
  }, []);
  const toggle = () => setCollapsed((v) => {
    try { localStorage.setItem(COLLAPSED_KEY, v ? "0" : "1"); } catch { /* bộ nhớ trình duyệt bị chặn */ }
    return !v;
  });

  if (collapsed) {
    return (
      <aside className="lib-sidebar collapsed" aria-label="Bộ lọc thư viện">
        <button type="button" className="lib-side-toggle" onClick={toggle} title="Mở bộ lọc" aria-label="Mở bộ lọc" aria-expanded={false}>
          <PanelLeftOpen aria-hidden="true" />
        </button>
        <button type="button" className="lib-side-rail-filter" onClick={toggle} title="Mở bộ lọc" aria-label={active > 0 ? `Mở bộ lọc, đang bật ${active} bộ lọc` : "Mở bộ lọc"}>
          <SlidersHorizontal aria-hidden="true" />
          {active > 0 && <span className="lib-side-rail-n">{active}</span>}
        </button>
      </aside>
    );
  }

  const sidebar = (
    <aside className="lib-sidebar" aria-label="Bộ lọc thư viện">
      <div className="lib-sidebar-inner">
        <div className="lib-sidebar-head">
          <h3 className="display"><SlidersHorizontal className="ic" aria-hidden="true" />Bộ lọc</h3>
          <span className="lib-sidebar-actions">
            <button type="button" className="lib-reset-btn" onClick={onClear}>Xóa tất cả</button>
            <button type="button" className="lib-side-toggle" onClick={toggle} title="Thu gọn bộ lọc" aria-label="Thu gọn bộ lọc" aria-expanded>
              <PanelLeftClose aria-hidden="true" />
            </button>
          </span>
        </div>
        {children}
      </div>
    </aside>
  );
  // Phần phụ (vd "Tác giả nổi bật") là khung riêng phía trên khung Bộ lọc, cùng một cột.
  return top ? <div className="lib-side-col">{top}{sidebar}</div> : sidebar;
}

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
  const active = [age, genre, extraFilters.duration, extraFilters.author, ...(community ? [] : [source, status])].filter((v) => v !== "all").length;
  return (
    <FilterSidebarShell
      active={active}
      onClear={onClear}
      top={<LibraryTopAuthors authors={extraFilters.authors} author={extraFilters.author} onAuthor={extraFilters.onAuthor} />}
    >
      <FilterGroup title="Độ tuổi" icon={Users} options={ages} value={age} onChange={onAge} />
      <FilterGroup title="Chủ đề" icon={Shapes} options={topics.map(([key, count]) => ({ key, label: key, count }))} value={genre} onChange={onGenre} limit={6} />
      <FilterGroup title="Thời lượng" icon={Clock} options={extraFilters.durations} value={extraFilters.duration} onChange={extraFilters.onDuration} />
      {!community && <FilterGroup title="Nguồn truyện" icon={BookOpen} options={sources.filter(({ key, count }) => count > 0 || key === source)} value={source} onChange={onSource} defaultOpen={source !== "all"} />}
      {!community && <FilterGroup title="Trạng thái" icon={Tag} options={statuses.filter(({ key, count }) => count > 0 || key === status)} value={status} onChange={onStatus} defaultOpen={status !== "all"} />}
    </FilterSidebarShell>
  );
}
