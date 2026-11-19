"use client";

import { useRef, useState } from "react";
import { bounce, jelly } from "@/app/lib/motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ParentReadingFeedbackItem } from "@/app/types/childReading";
import { shortDate } from "./learningData";
import { feelingPill, quizPill } from "./resultPills";
import SessionDialog from "./SessionDialog";

export interface StoryTileProps {
  items: ParentReadingFeedbackItem[];
  childId: number;
  nickname: string;
  /** Giá trị CSS background của bìa (useStoryCovers), bìa mẫu khi chưa có. */
  cover: string;
  /** Ô này đang mở cột lần đọc (cả lưới chỉ mở một ô, ResultsTab giữ). */
  open: boolean;
  onToggle: () => void;
}

export default function StoryTile({ items, childId, nickname, cover, open, onToggle }: StoryTileProps) {
  const [selected, setSelected] = useState<ParentReadingFeedbackItem | null>(null);
  const coverRef = useRef<HTMLDivElement>(null);
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
          <span>{items.length} lần đọc</span>
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
                  onClick={() => setSelected(i)}
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

      {selected && (
        <SessionDialog
          item={selected}
          childId={childId}
          title={title}
          nickname={nickname}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
