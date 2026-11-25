"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Shapes, SlidersHorizontal, Tag, Users, X } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import Lotus from "@/app/components/brand/Lotus";
import { FilterGroup } from "@/app/features/library/LibraryExtraFilters";
import type { CreatorDraft } from "@/app/types/creator";
import { ageText, facets, SHELVES, shelfOf, SOURCE, sourceOf, topicFacets, type CreatorLibraryFilterState } from "./creatorLibraryFilters";

type Props = {
  stories: CreatorDraft[];
  filters: CreatorLibraryFilterState;
  onChange: (patch: Partial<CreatorLibraryFilterState>) => void;
  onClear: () => void;
};

/** Các nhóm lọc dùng chung cho thanh bên (máy tính) và bảng lọc bật lên (điện thoại), giống Thư viện phụ huynh. */
function FilterGroups({ stories, filters, onChange }: Omit<Props, "onClear">) {
  const count = (pick: (s: CreatorDraft) => string, key: string) => stories.filter((s) => pick(s) === key).length;
  const sources = Object.entries(SOURCE).map(([key, label]) => ({ key, label, count: count(sourceOf, key) }))
    .filter(({ key, count }) => count > 0 || key === filters.source);
  const statuses = SHELVES.map(({ id, title }) => ({ key: id, label: title, count: count(shelfOf, id) }))
    .filter(({ key, count }) => count > 0 || key === filters.status);
  return (
    <>
      <FilterGroup title="Độ tuổi" icon={Users} options={facets(stories, (s) => s.ageBand, ageText)} value={filters.age} onChange={(age) => onChange({ age })} />
      <FilterGroup title="Chủ đề" icon={Shapes} options={topicFacets(stories)} value={filters.genre} onChange={(genre) => onChange({ genre })} limit={6} />
      <FilterGroup title="Nguồn truyện" icon={BookOpen} options={sources} value={filters.source} onChange={(source) => onChange({ source })} defaultOpen={filters.source !== "all"} />
      <FilterGroup title="Trạng thái" icon={Tag} options={statuses} value={filters.status} onChange={(status) => onChange({ status })} defaultOpen={filters.status !== "all"} />
    </>
  );
}

/** Thanh lọc bên trái (ẩn khi màn hẹp hơn 960px). */
export function CreatorLibrarySidebar(props: Props) {
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
          <button type="button" className="lib-reset-btn" onClick={props.onClear}>Xóa tất cả</button>
        </div>
        <FilterGroups {...props} />
      </div>
    </aside>
  );
}

/** Nút "Bộ lọc" trên thanh công cụ, chỉ hiện khi thanh bên bị ẩn (màn hẹp). */
export function CreatorFilterPopover({ activeCount, ...props }: Props & { activeCount: number }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); trigger.current?.focus({ preventScroll: true }); } };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  return (
    <div className="lfilter lib-filter" ref={root}>
      <button ref={trigger} type="button" className={`btn btn-s lib-filter-btn${activeCount > 0 ? " on" : ""}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <SlidersHorizontal className="ic" aria-hidden="true" />
        <span>Bộ lọc</span>
        {activeCount > 0 && <span className="lfilter-n lib-num">{activeCount}</span>}
      </button>
      {open && (
        <div className="lib-filter-pop" role="dialog" aria-label="Lọc truyện">
          <div className="lib-filter-head">
            <b className="display">Lọc truyện</b>
            <button type="button" className="btn btn-g icon-only" aria-label="Đóng bộ lọc" onClick={() => setOpen(false)}><X className="ic" aria-hidden="true" /></button>
          </div>
          <div><FilterGroups {...props} /></div>
          {activeCount > 0 && (
            <div className="lib-filter-foot">
              <button type="button" className="btn btn-g" onClick={() => { props.onClear(); setOpen(false); }}><X className="ic" aria-hidden="true" />Xóa tất cả</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
