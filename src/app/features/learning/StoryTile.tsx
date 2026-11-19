"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import SafeImage from "@/app/components/SafeImage";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import type { ParentReadingFeedbackItem } from "@/app/types/childReading";
import { shortDate } from "./learningData";
import { feelingPill, quizPill } from "./resultPills";
import SessionDialog from "./SessionDialog";

export interface StoryTileProps {
  items: ParentReadingFeedbackItem[];
  childId: number;
  nickname: string;
}

export default function StoryTile({ items, childId, nickname }: StoryTileProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ParentReadingFeedbackItem | null>(null);
  const { stories } = useWorkspaceData();

  if (!items.length) return null;

  const latest = items[0];
  const title = latest.title;
  const coverUrl = stories.find((s) => s.id === latest.storyId)?.raw.coverImageUrl ?? null;

  return (
    <div className="lr-story">
      <SafeImage src={coverUrl} alt={title} className="lr-story-cover" />
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
        onClick={() => setOpen((v) => !v)}
      >
        <span>{items.length} lần đọc</span>
        <ChevronDown className="ic lr-story-chev" aria-hidden />
      </button>

      {open && (
        <ul className="lr-runs">
          {items.map((i, idx) => {
            const ordinal = i.readOrdinal ?? (items.length - idx);
            return (
              <li key={i.sessionId}>
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
