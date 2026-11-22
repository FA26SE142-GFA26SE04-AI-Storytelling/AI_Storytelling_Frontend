"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, Clock, Crown, type LucideIcon } from "lucide-react";

type FilterOption = { key: string; label: string; count: number };

export type LibraryExtraFilterProps = {
  durations: FilterOption[];
  duration: string;
  onDuration: (value: string) => void;
  authors: FilterOption[];
  author: string;
  onAuthor: (value: string) => void;
};

export function FilterGroup({ title, icon: Icon, options, value, onChange, defaultOpen = true, limit }: {
  title: string;
  icon: LucideIcon;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  defaultOpen?: boolean;
  limit?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  if (!options.length) return null;
  const hasMore = limit !== undefined && options.length > limit;
  const visible = hasMore && !showAll ? options.slice(0, limit) : options;
  return (
    <details open={defaultOpen} className="lib-side-group">
      <summary><Icon className="ic" aria-hidden="true" />{title}</summary>
      <div role="group" aria-label={title}>
        {visible.map(({ key, label, count }) => (
          <button key={key} type="button" aria-pressed={value === key} disabled={count === 0 && value !== key}
            onClick={() => onChange(value === key ? "all" : key)}>
            <span className="lib-side-mark" aria-hidden="true" />
            <span>{label} <small>({count})</small></span>
          </button>
        ))}
      </div>
      {hasMore && (
        <button type="button" className="lib-side-more" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Thu gọn" : "Xem thêm"}
          <ChevronDown className={`ic${showAll ? " open" : ""}`} aria-hidden="true" />
        </button>
      )}
    </details>
  );
}

export function LibraryTopAuthors({ authors, author, onAuthor }: Pick<LibraryExtraFilterProps, "authors" | "author" | "onAuthor">) {
  const [expanded, setExpanded] = useState(false);
  const visibleAuthors = expanded ? authors : authors.slice(0, 3);
  return (
    <section className="lib-top-authors" aria-label="Tác giả nổi bật">
      <h4 className="display"><Crown className="ic" aria-hidden="true" />Tác giả nổi bật</h4>
      {authors.length === 0 ? <p className="sub">Chưa có thông tin tác giả cộng đồng.</p> : (
        <ul>
          {visibleAuthors.map(({ key, label, count }) => (
            <li key={key}>
              <button type="button" aria-pressed={author === key} onClick={() => onAuthor(author === key ? "all" : key)}>
                <span className="lib-author-initial" aria-hidden="true">{Array.from(label)[0]?.toLocaleUpperCase("vi")}</span>
                <span><strong>{label}</strong><small>{count} truyện</small></span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {authors.length > 3 && (
        <button type="button" className="lib-more-authors" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Thu gọn tác giả" : "Xem thêm tác giả"} <ArrowRight className="ic" aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

export default function LibraryExtraFilters({ durations, duration, onDuration, authors, author, onAuthor }: LibraryExtraFilterProps) {
  return (
    <>
      <FilterGroup title="Thời lượng đọc ước tính" icon={Clock} options={durations} value={duration} onChange={onDuration} />
      <LibraryTopAuthors authors={authors} author={author} onAuthor={onAuthor} />
    </>
  );
}
