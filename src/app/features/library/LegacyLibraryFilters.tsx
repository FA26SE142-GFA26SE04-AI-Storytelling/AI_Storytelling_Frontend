"use client";

import { Search, X } from "lucide-react";
import Select from "@/app/components/Select";
import { ageLabel } from "@/app/lib/storyView";

export type SortKey = "newest" | "views" | "favorites";
export type LibraryFilter = { q: string; age: string; topic: string; sort: SortKey };
export const EMPTY_FILTER: LibraryFilter = { q: "", age: "all", topic: "all", sort: "newest" };

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "views", label: "Đọc nhiều nhất" },
  { value: "favorites", label: "Được yêu thích" },
];

/** Đang lọc hoặc tìm (sắp xếp không tính): khi đó trang ẩn lời chào và hàng nổi bật. */
export const isFiltering = (f: LibraryFilter) => f.q.trim() !== "" || f.age !== "all" || f.topic !== "all";

/** Thanh lọc luôn hiện trên lưới truyện: tìm theo tên, nút chọn độ tuổi, menu chủ đề và cách sắp xếp. */
export default function LibraryFilters({ value, onChange, ages, topics }: { value: LibraryFilter; onChange: (f: LibraryFilter) => void; ages: string[]; topics: string[] }) {
  const set = (patch: Partial<LibraryFilter>) => onChange({ ...value, ...patch });
  const ageOptions = [{ id: "all", label: "Mọi lứa tuổi" }, ...ages.map((a) => ({ id: a, label: ageLabel(a) }))];
  return (
    <div className="lib-filters">
      <label className="lib-search">
        <Search className="ic" aria-hidden />
        <input className="inp" value={value.q} onChange={(e) => set({ q: e.target.value })} placeholder="Tìm theo tên truyện hoặc lộ trình" aria-label="Tìm theo tên truyện hoặc lộ trình" />
        {value.q && <button className="lib-search-clear" aria-label="Xoá ô tìm kiếm" onClick={() => set({ q: "" })}><X className="ic" /></button>}
      </label>
      <div className="lib-filter-row">
        <div className="lib-chips" role="radiogroup" aria-label="Độ tuổi">
          {ageOptions.map((a) => (
            <button key={a.id} role="radio" aria-checked={value.age === a.id} className={`lib-chip${value.age === a.id ? " on" : ""}`} onClick={() => set({ age: a.id })}>{a.label}</button>
          ))}
        </div>
        <div className="lib-selects">
          {topics.length > 0 && (
            <Select<string> className="lib-select" ariaLabel="Lọc theo chủ đề" value={value.topic} onChange={(topic) => set({ topic })}
              options={[{ value: "all", label: "Mọi chủ đề" }, ...topics.map((t) => ({ value: t, label: t }))]} />
          )}
          <Select<SortKey> className="lib-select" ariaLabel="Sắp xếp" value={value.sort} onChange={(sort) => set({ sort })} options={SORTS} />
        </div>
      </div>
    </div>
  );
}
