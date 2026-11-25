"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StoryStatsBadge } from "@/app/components/StoryStatsBadge";
import { useRiseIn } from "@/app/lib/motion";
import type { StoryCard } from "@/app/lib/storyView";
import { canonicalAgeLabel, isNewStory, SOURCE_LABEL, sourceOf, statusOf, topicOf } from "./libraryFilters";

export type ShelfProps = {
  title: string;
  sub?: string;
  /** Kệ cần chú ý (việc phụ huynh phải làm): nền và viền vàng. */
  accent?: boolean;
  items: { id: number }[];
  pills?: { id: string; label: string }[];
  pill?: string;
  onPill?: (id: string) => void;
  onAll?: () => void;
  children: React.ReactNode;
};

/** Một kệ truyện: tiêu đề, nút lọc dạng viên thuốc và "Xem tất cả". */
export function Shelf({ title, sub, accent, items, pills, pill, onPill, onAll, children }: ShelfProps) {
  // Mỗi kệ tự chạy hiệu ứng hiện dần, chỉ khi danh sách truyện của chính kệ đó đổi (đổi chủ đề không làm kệ khác nháy lại).
  const animKey = items.map((s) => s.id).join(",");
  const ref = useRiseIn<HTMLElement>(".bk", [animKey], { delay: 22, distance: 12 });
  return (
    <section ref={ref} className={`shelf${accent ? " accent" : ""}`} aria-label={title}>
      <div className="shelf-h">
        <h3 className="display">{title}</h3>
        {sub && <span className="sub">{sub}</span>}
        {onAll && (
          <button type="button" className="shelf-all" onClick={onAll}>
            Xem tất cả
            <ChevronRight className="ic" aria-hidden="true" />
          </button>
        )}
      </div>
      {pills && pills.length > 0 && (
        <div className="shelf-pills" role="tablist">
          {pills.map((p) => (
            <button
              type="button"
              key={p.id}
              role="tab"
              aria-selected={pill === p.id}
              className={pill === p.id ? "on" : ""}
              onClick={() => onPill?.(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {children}
    </section>
  );
}

/** Hàng ngang cuộn được, có nút mũi tên hai bên. */
export function ShelfRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const start = el.scrollLeft < 4;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdge((v) => (v.start === start && v.end === end ? v : { start, end }));
  }, []);
  useEffect(() => {
    measure();
    const el = ref.current;
    const ro = el ? new ResizeObserver(measure) : null;
    if (el && ro) {
      ro.observe(el);
      Array.from(el.children).forEach((c) => ro.observe(c));
    }
    return () => ro?.disconnect();
  }, [measure, children]);
  const move = (dir: number) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="shelf-row-wrap">
      {!edge.start && (
        <button type="button" className="shelf-arrow left" aria-label="Xem truyện trước" onClick={() => move(-1)}>
          <ChevronLeft className="ic" aria-hidden="true" />
        </button>
      )}
      <div className="shelf-row" ref={ref} onScroll={measure}>
        {children}
      </div>
      {!edge.end && (
        <button type="button" className="shelf-arrow right" aria-label="Xem thêm truyện" onClick={() => move(1)}>
          <ChevronRight className="ic" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Thẻ truyện bìa đứng 3:4 của Thư viện phụ huynh: giữ nguyên vùng cắt bìa (#crop), ưu tiên ảnh minh hoạ sạch và thông tin dễ quét. */
export function LibraryBookCard({
  story,
  rank,
  onPick,
  compact = false,
}: {
  story: StoryCard;
  rank?: number;
  onPick: (button: HTMLButtonElement) => void;
  compact?: boolean;
}) {
  const ready = statusOf(story) === "ready";
  const showNew = ready && rank === undefined && isNewStory(story);
  const hasLeftBadge = !ready || rank !== undefined || showNew;
  const hasStats = story.viewCount !== undefined || story.favoriteCount !== undefined;
  // Tên tác giả từ API; truyện không có tên (truyện gia đình) thì hiện nguồn truyện.
  const author = story.raw.authorName?.trim() || SOURCE_LABEL[sourceOf(story)];

  return (
    <button
      type="button"
      className={compact ? "bk lib-card lib-card-compact" : "bk lib-card"}
      aria-haspopup="dialog"
      onClick={(event) => onPick(event.currentTarget)}
    >
      <span className="lib-card-media">
        <span className="lib-card-cover" style={{ background: story.cover }} aria-hidden="true" />
        {!ready ? (
          <span className={`pill ${story.tone} bk-badge`}>{story.statusLabel}</span>
        ) : rank !== undefined ? (
          <span className="lib-rank-pill" aria-hidden="true">
            #{rank}
          </span>
        ) : (
          showNew && <span className="lib-new-pill">Mới</span>
        )}
        {hasStats && !compact && (
          <StoryStatsBadge viewCount={story.viewCount} favoriteCount={story.favoriteCount} belowPill={hasLeftBadge} />
        )}
      </span>
      <span className="lib-card-body">
        <strong className="display lib-card-title">{story.title}</strong>
        <span className="lib-card-meta">
          <span className="lib-card-topic" title={topicOf(story)}>
            {topicOf(story)}
          </span>
          <span className="lib-card-dot" aria-hidden="true">
            ·
          </span>
          <span className="lib-card-age">{canonicalAgeLabel(story.ageBand)}</span>
        </span>
        {compact && story.raw.description?.trim() && <span className="lib-card-synopsis">{story.raw.description}</span>}
        {compact && hasStats ? (
          <StoryStatsBadge viewCount={story.viewCount} favoriteCount={story.favoriteCount} />
        ) : <span className="lib-card-foot">
          <span className="lib-card-author" title={author}>{author}</span>
          {story.words > 0 && (
            <>
              <span className="lib-card-dot" aria-hidden="true">
                ·
              </span>
              <span className="lib-num lib-card-words">{story.words.toLocaleString("vi-VN")} chữ</span>
            </>
          )}
        </span>}
      </span>
    </button>
  );
}

/** Khung xương tải trước đồng bộ hình học 3:4 của thẻ truyện / lộ trình. */
export function LibrarySkeletonGrid({ count = 6, label }: { count?: number; label: string }) {
  return (
    <div className="lib-skeleton-wrap" aria-busy="true">
      <span className="sr-only" role="status">
        {label}
      </span>
      <div className="lib-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="lib-skel-card">
            <div className="lib-skel-cover" />
            <div className="lib-skel-body">
              <div className="lib-skel-line title" />
              <div className="lib-skel-line meta" />
              <div className="lib-skel-line foot" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
