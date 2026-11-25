"use client";

import { useEffect, useState } from "react";
import { childProfileService } from "@/app/services/childProfileService";
import { eventService, type EventTaskStoryOption } from "@/app/services/eventService";
import type { ApiResponse } from "@/app/types/auth";
import type { TaskVerifierType } from "@/app/types/event";
import { readTaskFilterConfig, writeTaskFilterConfig } from "./eventTaskFilterConfig";

type Option = { id: number; label: string };
type TaskFilterOptions = {
  stories: ApiResponse<EventTaskStoryOption[]>;
  categories: ApiResponse<Option[]>;
};

export function useTaskFilterOptions(eventId: number | undefined, storyCount: number, enabled: boolean, readingSource?: string) {
  const key = eventId === undefined ? "" : `${eventId}/${storyCount}/${readingSource ?? ""}`;
  const [loaded, setLoaded] = useState<{ key: string; options: TaskFilterOptions } | null>(null);
  useEffect(() => {
    if (!enabled || eventId === undefined) return;
    const controller = new AbortController();
    void Promise.all([
      eventService.taskFilterStories(eventId, controller.signal),
      childProfileService.getContentCategories(controller.signal),
    ]).then(([stories, categories]) => {
      if (controller.signal.aborted) return;
      const categoryOptions = categories.data?.filter((category) => category.isActive)
        .map((category) => ({ id: category.id, label: category.displayName }));
      setLoaded({ key, options: { stories, categories: { ...categories, data: categoryOptions ?? null } } });
    });
    return () => controller.abort();
  }, [enabled, eventId, key]);
  return loaded?.key === key ? loaded.options : null;
}

function FilterChoices({ label, items, selected, error, emptyText, searchable = false, onChange }: {
  label: string;
  items?: Option[];
  selected?: number[];
  error?: string;
  emptyText: string;
  searchable?: boolean;
  onChange: (ids: number[] | undefined) => void;
}) {
  const [query, setQuery] = useState("");
  const checked = selected ?? [];
  const choices = (items ?? []).filter((item) => item.label.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")));
  const unavailable = items ? checked.filter((id) => !items.some((item) => item.id === id)) : [];
  const toggle = (id: number) => {
    const next = checked.includes(id) ? checked.filter((item) => item !== id) : [...checked, id];
    onChange(next.length ? next : undefined);
  };

  return (
    <fieldset className="ev-task-filter-field">
      <legend>{label}</legend>
      {searchable && !!items?.length && (
        <input type="search" className="inp" aria-label={`Tìm trong ${label.toLocaleLowerCase("vi")}`}
          placeholder="Tìm theo tên truyện" value={query} onChange={(e) => setQuery(e.target.value)} />
      )}
      {error && <p className="ev-warn-text">{error}</p>}
      {!items && !error && <p className="sub">Đang tải danh sách…</p>}
      {items && !items.length && <p className="sub">{emptyText}</p>}
      {!!items?.length && !choices.length && <p className="sub">Không tìm thấy kết quả phù hợp.</p>}
      {choices.length > 0 && (
        <div className="ev-task-filter-options">
          {choices.map(({ id, label: name }) => (
            <label key={id}>
              <input type="checkbox" checked={checked.includes(id)} onChange={() => toggle(id)} />
              <span>{name}</span>
            </label>
          ))}
        </div>
      )}
      {unavailable.map((id) => (
        <label className="ev-task-filter-unavailable" key={id}>
          <input type="checkbox" checked onChange={() => toggle(id)} />
          <span>Lựa chọn cũ không còn trong danh sách (#{id})</span>
        </label>
      ))}
      {selected?.length === 0 && (
        <p className="ev-warn-text">Bộ lọc cũ đang loại tất cả. Hãy chọn mục cần tính hoặc bỏ giới hạn.</p>
      )}
      {selected !== undefined && (
        <button type="button" className="btn btn-g" onClick={() => onChange(undefined)}>Bỏ giới hạn</button>
      )}
    </fieldset>
  );
}

export default function EventTaskFilterEditor({ value, verifierType, options, onChange, onOpen }: {
  value?: string | null;
  verifierType: TaskVerifierType;
  options: TaskFilterOptions | null;
  onChange: (config: string | null) => void;
  onOpen: () => void;
}) {
  const filters = readTaskFilterConfig(value);
  const storyOptions = options?.stories.success ? (options.stories.data ?? [])
    .filter((story) => verifierType === "VoteEventStories" ? story.source === "CreatorSubmission" :
      story.canUseForReading && (
        (verifierType !== "CompleteStoryQuiz" && verifierType !== "SaveStoryVocabulary") || story.hasLearningContent))
    .map(({ id, title }) => ({ id, label: title })) : undefined;
  const categoryOptions = options?.categories.success ? options.categories.data ?? [] : undefined;

  return (
    <details className="ev-task-filter" onToggle={(e) => { if (e.currentTarget.open) onOpen(); }}>
      <summary>Bộ lọc nhiệm vụ</summary>
      {filters ? (
        <>
          <p className="sub">Bỏ trống để tính mọi truyện phù hợp trong sự kiện. Nếu chọn cả truyện và danh mục, truyện phải thỏa cả hai.</p>
          <div className="ev-task-filter-grid">
            <FilterChoices label="Truyện được tính" items={storyOptions} selected={filters.storyIds} searchable
              error={options && !options.stories.success ? options.stories.message || "Không tải được danh sách truyện." : undefined}
              emptyText="Chưa có truyện phù hợp trong sự kiện. Bạn có thể để trống hoặc bổ sung truyện cho sự kiện."
              onChange={(storyIds) => onChange(writeTaskFilterConfig({ ...filters, storyIds }))} />
            <FilterChoices label="Danh mục được tính" items={categoryOptions} selected={filters.categoryIds}
              error={options && !options.categories.success ? options.categories.message || "Không tải được danh mục." : undefined}
              emptyText="Chưa có danh mục đang hoạt động."
              onChange={(categoryIds) => onChange(writeTaskFilterConfig({ ...filters, categoryIds }))} />
          </div>
          {verifierType === "ReadEventStories" && (
            <label className="ev-field ev-task-filter-time">
              <span>Thời gian đọc tối thiểu mỗi truyện (giây)</span>
              <input type="number" className="inp" inputMode="numeric" min={0} max={2_147_483_647} step={1}
                placeholder="Không giới hạn" value={filters.minReadSeconds || ""}
                onChange={(e) => {
                  const seconds = Math.min(2_147_483_647, Math.max(0, Math.trunc(Number(e.target.value) || 0)));
                  onChange(writeTaskFilterConfig({ ...filters, minReadSeconds: seconds }));
                }} />
            </label>
          )}
        </>
      ) : (
        <div className="row">
          <small className="ev-warn-text">Không đọc được bộ lọc cũ. Bạn có thể đặt lại và chọn điều kiện mới.</small>
          <button type="button" className="btn btn-g" onClick={() => onChange(null)}>Đặt lại bộ lọc</button>
        </div>
      )}
    </details>
  );
}
