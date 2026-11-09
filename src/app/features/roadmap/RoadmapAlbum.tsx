"use client";

import "./roadmap.css";
import type * as B from "@/app/types/backendContracts";
import { ageLabel } from "@/app/lib/storyView";
import { useStoryCovers, useTemplateDetail } from "./roadmapData";

/** Một lộ trình mẫu dạng album: ba bìa truyện đầu xếp chồng, số truyện ở góc, tên và nhóm tuổi bên dưới. */
export default function RoadmapAlbum({ item, onOpen }: { item: B.RoadmapLibraryItemDto; onOpen: () => void }) {
  const { detail } = useTemplateDetail(item.id);
  const first = (detail?.stories ?? []).slice().sort((a, b) => a.position - b.position).slice(0, 3).map((s) => s.storyId);
  const cover = useStoryCovers(first);
  // Chưa có chi tiết thì vẫn vẽ đủ ba lớp bìa mẫu để album không bị nhảy hình khi tải xong.
  const layers = first.length ? first : [-1, -2, -3];
  return (
    <button className="bk rm-album" onClick={onOpen} aria-label={`${item.name}, ${item.storyCount} truyện`}>
      <span className="rm-album-stack" aria-hidden>
        {layers.slice().reverse().map((id, i) => (
          <span key={id} className={`rm-album-layer l${layers.length - 1 - i}`} style={{ background: cover(id) }} />
        ))}
        <span className="rm-album-count">{item.storyCount} truyện</span>
        <span className="bk-name display">{item.name}</span>
      </span>
      <span className="bk-title">{item.name}</span>
      <span className="bk-meta">{ageLabel(item.ageBand)} · Mức {item.readingLevelMin}–{item.readingLevelMax}{item.mainCategory ? ` · ${item.mainCategory.displayName}` : ""}</span>
    </button>
  );
}
