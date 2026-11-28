"use client";

import { useRef } from "react";
import { bounce, jelly } from "@/app/lib/motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ParentReadingFeedbackItem, ReadingFeedbackFilter } from "@/app/types/childReading";
import { shortDate, useReadingFeedback } from "./learningData";
import { feelingPill, quizPill } from "./resultPills";

export interface StoryTileProps {
  /** Các lần đọc của truyện nằm trong trang danh sách đang xem (có thể thiếu lần cũ ở trang sau). */
  items: ParentReadingFeedbackItem[];
  childId: number;
  filter: ReadingFeedbackFilter;
  /** Giá trị CSS background của bìa (useStoryCovers), bìa mẫu khi chưa có. */
  cover: string;
  /** Ô này đang mở cột lần đọc (cả lưới chỉ mở một ô, ResultsTab giữ). */
  open: boolean;
  onToggle: () => void;
  /** Bấm một lần đọc: mở trang chi tiết lần đọc đó. */
  onSelect: (item: ParentReadingFeedbackItem) => void;
}

export default function StoryTile({ items: pageItems, childId, filter, cover, open, onToggle, onSelect }: StoryTileProps) {
  const coverRef = useRef<HTMLDivElement>(null);
  // Mở ô thì tải đủ các lần đọc của riêng truyện này (lọc storyId), không chỉ những lần nằm trong trang đang xem.
  // shortcut: chỉ lấy 50 lần mới nhất (pageSize tối đa của API), khi có bé đọc một truyện hơn 50 lần thì thêm phân trang trong cột.
  const storyRuns = useReadingFeedback(childId, 1, 50, filter, open, pageItems[0]?.storyId ?? null);
  // Chỉ dùng kết quả đã tải xong của lần mở này (đổi bộ lọc thì dữ liệu cũ không còn đúng).
  const fetched = open && !storyRuns.loading && storyRuns.data?.items.length ? storyRuns.data : null;
  const items = fetched?.items ?? pageItems;
  // Chưa tải: lọc "Đã đọc xong" + "Tất cả" thì readCount từ API là tổng chính xác; còn lại đếm theo trang đang xem.
  const total = fetched?.totalCount
    ?? (filter.status === "Completed" && filter.range === "all" ? Math.max(pageItems[0]?.readCount ?? 0, pageItems.length) : pageItems.length);
  /** Bấm mở / đóng cột lần đọc: nút rung kiểu thạch, bìa truyện nảy nhẹ. */
  const toggle = (btn: HTMLButtonElement) => {
    jelly(btn);
    bounce(coverRef.current);
    onToggle();
  };

  if (!items.length) return null;

  const latest = items[0];
  const title = latest.title;

  return (
    // Mở danh sách lần đọc thì ô nở ra 2 cột: thẻ truyện bên trái, cột lần đọc bên phải (đẩy các truyện sau sang).
    <div className={`lr-story${open ? " is-open" : ""}`}>
      <div className="lr-story-main">
        <div ref={coverRef} className="lr-story-cover-wrap"><span className="lr-story-cover" role="img" aria-label={`Bìa truyện ${title}`} style={{ background: cover }} /></div>
        <h3 className="lr-story-title">{title}</h3>
        <div className="lr-pills">
          {feelingPill(latest)}
          {quizPill(latest)}
        </div>
        <div className="lr-story-meta">
          Lần gần nhất {shortDate(latest.completedAt ?? latest.startedAt)}
        </div>
        <button
          type="button"
          className="btn btn-g lr-story-toggle"
          aria-expanded={open}
          onClick={(e) => toggle(e.currentTarget)}
        >
          <span>{total} lần đọc</span>
          <ChevronDown className="ic lr-story-chev" aria-hidden />
        </button>
      </div>

      {open && (
        <div className="lr-runs-col">
        <ul className="lr-runs">
          {items.map((i, idx) => {
            const ordinal = i.readOrdinal ?? (items.length - idx);
            return (
              <li key={i.sessionId} style={{ "--i": Math.min(idx, 8) } as React.CSSProperties}>
                <button
                  type="button"
                  className="lr-run"
                  onClick={() => onSelect(i)}
                >
                  <span>
                    Lần {ordinal} · {shortDate(i.completedAt ?? i.startedAt)}
                  </span>
                  {quizPill(i)}
                  {i.status !== "Completed" && (
                    <span className="pill draft">
                      Dừng ở {i.pagesCompleted}/{i.totalPages} trang
                    </span>
                  )}
                  <ChevronRight className="ic" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
        </div>
      )}

    </div>
  );
}
