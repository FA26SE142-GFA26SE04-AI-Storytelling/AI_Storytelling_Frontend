"use client";

import { useEffect, useRef } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ageLabel, type StoryCard } from "@/app/lib/storyView";
import { SOURCE_LABEL, STATUS_GROUPS, sourceOf, statusOf, type StorySourceKey } from "./libraryFilters";

export type LibraryFilterPopoverProps = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  stories: StoryCard[];
  ageBands: string[];
  status: string;
  age: string;
  source: string;
  activePopoverCount: number;
  hasAnyFilter: boolean;
  onStatusChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onClearAll: () => void;
};

/** Bảng lọc mở rộng dạng nhóm viên thuốc: chọn nhanh độ tuổi, nguồn và trạng thái trong một lần chạm. */
export default function LibraryFilterPopover({
  open,
  onToggle,
  onClose,
  stories,
  ageBands,
  status,
  age,
  source,
  activePopoverCount,
  hasAnyFilter,
  onStatusChange,
  onAgeChange,
  onSourceChange,
  onClearAll,
}: LibraryFilterPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const statusCounts = Object.fromEntries(
    STATUS_GROUPS.map((group) => [group.id, stories.filter((story) => statusOf(story) === group.id).length]),
  );
  const availableStatuses = STATUS_GROUPS.filter((group) => statusCounts[group.id] > 0 || group.id === status);
  const availableSources = (Object.entries(SOURCE_LABEL) as [StorySourceKey, string][])
    .map(([id, label]) => ({ id, label, count: stories.filter((story) => sourceOf(story) === id).length }))
    .filter((entry) => entry.count > 0 || entry.id === source);

  return (
    <div className="lfilter lib-filter" ref={rootRef}>
      <button
        type="button"
        className={`btn btn-s lib-filter-btn${activePopoverCount > 0 ? " on" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
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
            <button type="button" className="btn btn-g icon-only" aria-label="Đóng bộ lọc" onClick={onClose}>
              <X className="ic" aria-hidden="true" />
            </button>
          </div>

          {ageBands.length > 0 && (
            <fieldset className="lib-filter-group">
              <legend>Độ tuổi</legend>
              <div className="lib-filter-pills">
                <button
                  type="button"
                  className={`lib-pill${age === "all" ? " on" : ""}`}
                  aria-pressed={age === "all"}
                  onClick={() => onAgeChange("all")}
                >
                  Tất cả
                </button>
                {ageBands.map((band) => {
                  const count = stories.filter((story) => story.ageBand === band).length;
                  return (
                    <button
                      type="button"
                      key={band}
                      className={`lib-pill${age === band ? " on" : ""}`}
                      aria-pressed={age === band}
                      onClick={() => onAgeChange(band)}
                    >
                      <span>{ageLabel(band)}</span>
                      <span className="lib-pill-n lib-num">{count}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {availableSources.length > 0 && (
            <fieldset className="lib-filter-group">
              <legend>Nguồn</legend>
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
                    onClick={() => onSourceChange(entry.id)}
                  >
                    <span>{entry.label}</span>
                    <span className="lib-pill-n lib-num">{entry.count}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {(availableStatuses.length > 1 || status !== "all") && (
            <fieldset className="lib-filter-group">
              <legend>Trạng thái</legend>
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
                    onClick={() => onStatusChange(group.id)}
                  >
                    <span>{group.label}</span>
                    <span className="lib-pill-n lib-num">{statusCounts[group.id]}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {hasAnyFilter && (
            <div className="lib-filter-foot">
              <button
                type="button"
                className="btn btn-g"
                onClick={() => {
                  onClearAll();
                  onClose();
                }}
              >
                <X className="ic" aria-hidden="true" />
                Xoá tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
