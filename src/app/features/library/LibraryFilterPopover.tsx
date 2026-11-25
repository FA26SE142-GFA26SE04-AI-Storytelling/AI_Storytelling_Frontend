"use client";

import { useCallback, useEffect, useRef } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { StoryCard } from "@/app/lib/storyView";
import LibraryExtraFilters, { type LibraryExtraFilterProps } from "./LibraryExtraFilters";
import {
  SOURCE_LABEL,
  STATUS_GROUPS,
  sourceOf,
  statusOf,
  type AgeFilterOption,
  type StorySourceKey,
} from "./libraryFilters";

export type LibraryFilterPopoverProps = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  stories: StoryCard[];
  ageOptions: AgeFilterOption[];
  status: string;
  age: string;
  source: string;
  activePopoverCount: number;
  extraFilters?: LibraryExtraFilterProps;
  /** Chỉ có truyện cộng đồng đã công khai (Thư viện Creator): bỏ nhóm Nguồn và Trạng thái. */
  community?: boolean;
  onStatusChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onClearPopover: () => void;
};

/** Bảng lọc mở rộng dạng nhóm viên thuốc: chọn nhanh độ tuổi, nguồn và trạng thái trong một lần chạm. */
export default function LibraryFilterPopover({
  open,
  onToggle,
  onClose,
  stories,
  ageOptions,
  status,
  age,
  source,
  activePopoverCount,
  extraFilters,
  community = false,
  onStatusChange,
  onAgeChange,
  onSourceChange,
  onClearPopover,
}: LibraryFilterPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeAndReturnFocus = useCallback(() => {
    onClose();
    triggerRef.current?.focus({ preventScroll: true });
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeAndReturnFocus();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, closeAndReturnFocus]);

  const statusCounts = Object.fromEntries(
    STATUS_GROUPS.map((group) => [group.id, stories.filter((story) => statusOf(story) === group.id).length]),
  );
  const availableStatuses = community ? [] : STATUS_GROUPS.filter((group) => statusCounts[group.id] > 0 || group.id === status);
  const availableSources = (community ? [] : (Object.entries(SOURCE_LABEL) as [StorySourceKey, string][]))
    .map(([id, label]) => ({ id, label, count: stories.filter((story) => sourceOf(story) === id).length }))
    .filter((entry) => entry.count > 0 || entry.id === source);
  const hasFilterGroups =
    ageOptions.length > 0 || availableSources.length > 0 || availableStatuses.length > 1 || status !== "all" ||
    !!extraFilters?.durations.some(({ count }) => count > 0) || !!extraFilters?.authors.length;
  const filterDisabled = !hasFilterGroups && activePopoverCount === 0;

  return (
    <div className="lfilter lib-filter" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`btn btn-s lib-filter-btn${activePopoverCount > 0 ? " on" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={filterDisabled}
        onClick={onToggle}
      >
        <SlidersHorizontal className="ic" aria-hidden="true" />
        <span>Bộ lọc</span>
        {activePopoverCount > 0 && <span className="lfilter-n lib-num">{activePopoverCount}</span>}
      </button>

      {open && (
        <div className="lib-filter-pop" role="dialog" aria-label="Lọc truyện">
          <div className="lib-filter-head">
            <b className="display">Lọc truyện</b>
            <button
              type="button"
              className="btn btn-g icon-only"
              aria-label="Đóng bộ lọc"
              onClick={closeAndReturnFocus}
            >
              <X className="ic" aria-hidden="true" />
            </button>
          </div>

          {!hasFilterGroups && <p className="sub">Chưa có tiêu chí lọc.</p>}

          {ageOptions.length > 0 && (
            <div className="lib-filter-group" role="group" aria-labelledby="lib-filter-age">
              <span id="lib-filter-age" className="lib-filter-legend">
                Độ tuổi
              </span>
              <div className="lib-filter-pills">
                <button
                  type="button"
                  className={`lib-pill${age === "all" ? " on" : ""}`}
                  aria-pressed={age === "all"}
                  onClick={() => onAgeChange("all")}
                >
                  Tất cả
                </button>
                {ageOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt.key}
                    className={`lib-pill${age === opt.key ? " on" : ""}`}
                    aria-pressed={age === opt.key}
                    onClick={() => onAgeChange(age === opt.key ? "all" : opt.key)}
                  >
                    <span>{opt.label}</span>
                    <span className="lib-pill-n lib-num">{opt.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableSources.length > 0 && (
            <div className="lib-filter-group" role="group" aria-labelledby="lib-filter-source">
              <span id="lib-filter-source" className="lib-filter-legend">
                Nguồn
              </span>
              <div className="lib-filter-pills">
                <button
                  type="button"
                  className={`lib-pill${source === "all" ? " on" : ""}`}
                  aria-pressed={source === "all"}
                  onClick={() => onSourceChange("all")}
                >
                  Tất cả
                </button>
                {availableSources.map((entry) => (
                  <button
                    type="button"
                    key={entry.id}
                    className={`lib-pill${source === entry.id ? " on" : ""}`}
                    aria-pressed={source === entry.id}
                    onClick={() => onSourceChange(source === entry.id ? "all" : entry.id)}
                  >
                    <span>{entry.label}</span>
                    <span className="lib-pill-n lib-num">{entry.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(availableStatuses.length > 1 || status !== "all") && (
            <div className="lib-filter-group" role="group" aria-labelledby="lib-filter-status">
              <span id="lib-filter-status" className="lib-filter-legend">
                Trạng thái
              </span>
              <div className="lib-filter-pills">
                <button
                  type="button"
                  className={`lib-pill${status === "all" ? " on" : ""}`}
                  aria-pressed={status === "all"}
                  onClick={() => onStatusChange("all")}
                >
                  Tất cả
                </button>
                {availableStatuses.map((group) => (
                  <button
                    type="button"
                    key={group.id}
                    className={`lib-pill${status === group.id ? " on" : ""}`}
                    aria-pressed={status === group.id}
                    onClick={() => onStatusChange(status === group.id ? "all" : group.id)}
                  >
                    <span>{group.label}</span>
                    <span className="lib-pill-n lib-num">{statusCounts[group.id]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {extraFilters && <LibraryExtraFilters {...extraFilters} />}

          {activePopoverCount > 0 && (
            <div className="lib-filter-foot">
              <button
                type="button"
                className="btn btn-g"
                onClick={() => {
                  onClearPopover();
                  closeAndReturnFocus();
                }}
              >
                <X className="ic" aria-hidden="true" />
                Xoá bộ lọc
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
