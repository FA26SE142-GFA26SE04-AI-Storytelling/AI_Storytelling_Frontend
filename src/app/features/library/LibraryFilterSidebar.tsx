import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Clock, PanelLeftClose, PanelLeftOpen, Shapes, SlidersHorizontal, Tag, Users } from "lucide-react";
import type { StoryCard } from "@/app/lib/storyView";
import { FilterGroup, type LibraryExtraFilterProps } from "./LibraryExtraFilters";
import { SOURCE_LABEL, STATUS_GROUPS, sourceOf, statusOf, type AgeFilterOption } from "./libraryFilters";

/**
 * Thanh lọc trái dùng chung (Thư viện phụ huynh, Creator, Moderator), kiểu menu YouTube:
 * luôn là dải hẹp có nút mở và số bộ lọc đang bật; mở ra thì khung Bộ lọc nổi đè lên trang kèm lớp phủ,
 * bấm ra ngoài / Esc / nút thu để đóng. Khung Bộ lọc luôn có trong DOM (ẩn bằng `hidden`) để giữ trạng thái nhóm lọc.
 */
export function FilterSidebarShell({ active, onClear, children }: { active: number; onClear: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); openBtn.current?.focus({ preventScroll: true }); };
  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); openBtn.current?.focus({ preventScroll: true }); } };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open]);
  const openLabel = active > 0 ? `Mở bộ lọc, đang bật ${active} bộ lọc` : "Mở bộ lọc";

  return (
    <div className="lib-side-rail-wrap">
      <div className="lib-sidebar collapsed">
        <button ref={openBtn} type="button" className="lib-side-rail-filter" onClick={() => setOpen(true)} title="Mở bộ lọc" aria-label={openLabel} aria-expanded={open} aria-controls="lib-filter-drawer">
          <PanelLeftOpen aria-hidden="true" />
          {active > 0 && <span className="lib-side-rail-n">{active}</span>}
        </button>
      </div>
      {open && <div className="lib-drawer-backdrop" aria-hidden="true" onClick={close} />}
      <aside id="lib-filter-drawer" className="lib-sidebar lib-drawer" aria-label="Bộ lọc thư viện" hidden={!open}>
        <div className="lib-sidebar-inner">
          <div className="lib-sidebar-head">
            <h3 className="display"><SlidersHorizontal className="ic" aria-hidden="true" />Bộ lọc</h3>
            <span className="lib-sidebar-actions">
              <button type="button" className="lib-reset-btn" onClick={onClear}>Xóa tất cả</button>
              <button ref={closeBtn} type="button" className="lib-side-toggle" onClick={close} title="Thu gọn bộ lọc" aria-label="Thu gọn bộ lọc">
                <PanelLeftClose aria-hidden="true" />
              </button>
            </span>
          </div>
          {children}
        </div>
      </aside>
    </div>
  );
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
    >
      <FilterGroup title="Độ tuổi" icon={Users} options={ages} value={age} onChange={onAge} />
      <FilterGroup title="Chủ đề" icon={Shapes} options={topics.map(([key, count]) => ({ key, label: key, count }))} value={genre} onChange={onGenre} limit={6} />
      <FilterGroup title="Thời lượng" icon={Clock} options={extraFilters.durations} value={extraFilters.duration} onChange={extraFilters.onDuration} />
      {!community && <FilterGroup title="Nguồn truyện" icon={BookOpen} options={sources.filter(({ key, count }) => count > 0 || key === source)} value={source} onChange={onSource} defaultOpen={source !== "all"} />}
      {!community && <FilterGroup title="Trạng thái" icon={Tag} options={statuses.filter(({ key, count }) => count > 0 || key === status)} value={status} onChange={onStatus} defaultOpen={status !== "all"} />}
    </FilterSidebarShell>
  );
}
