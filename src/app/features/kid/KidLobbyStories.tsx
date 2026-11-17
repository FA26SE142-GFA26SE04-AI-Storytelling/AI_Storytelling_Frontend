"use client";

import { useEffect, useState } from "react";
import { BookOpen, Library, Play } from "lucide-react";
import type { ChildStory } from "@/app/types/childReading";
import { coverFor } from "@/app/lib/storyView";
import { showToast } from "@/app/lib/toast";
import { childAccessService } from "@/app/services/childAccessService";
import { childReadingService } from "@/app/services/childReadingService";

/** Số truyện hiện trong khung, còn lại xem ở Kho truyện. */
const SHOWN = 4;

/**
 * Cột trái của sảnh: "Truyện em đọc được" — cùng nguồn với Kho truyện (truyện của em trước, rồi thư viện).
 * Thư viện đang khóa thì backend chỉ cho đọc truyện đang mở, nên chỉ giữ truyện đó.
 */
export default function KidLobbyStories({ childId, busy, onRead, onOpenLibrary }: {
  childId: number;
  busy: boolean;
  onRead: (storyId: number) => void;
  onOpenLibrary: () => void;
}) {
  const [stories, setStories] = useState<ChildStory[] | null>(null);

  useEffect(() => {
    const session = childAccessService.readSession();
    if (session?.childProfileId !== childId) return;
    const controller = new AbortController();
    const get = (source: "mine" | "library") => childReadingService.stories(session.accessToken, { source, pageIndex: 1 }, controller.signal);
    void Promise.all([get("mine"), get("library")]).then(([mine, lib]) => {
      if (controller.signal.aborted) return;
      const failed = [mine, lib].find((r) => !r.success);
      if (failed) showToast(failed.message, "err");
      const pages = [mine, lib].flatMap((r) => (r.success && r.data ? [r.data] : []));
      const lock = pages.find((p) => p.isLocked);
      const seen = new Set<number>();
      const all = pages.flatMap((p) => p.items).filter((s) => !seen.has(s.storyId) && seen.add(s.storyId));
      setStories(lock ? all.filter((s) => s.storyId === lock.unlockStoryId) : all);
    });
    return () => controller.abort();
  }, [childId]);

  return (
    <section className="kl-panel kl-stories" aria-labelledby="kl-stories-h" aria-busy={stories === null}>
      <h2 id="kl-stories-h" className="kl-head kl-stories-head display"><BookOpen aria-hidden="true" />Truyện em đọc được</h2>
      {stories && stories.length === 0 && <p className="kl-words-empty">Chưa có truyện nào mở cho em.</p>}
      {stories && stories.length > 0 && (
        <div className="kl-rows">
          {stories.slice(0, SHOWN).map((s) => (
            <button key={s.storyId} type="button" className="kl-row is-open" disabled={busy} onClick={() => onRead(s.storyId)} aria-label={`Đọc truyện ${s.title}`}>
              <span className="kl-row-cover" style={{ background: coverFor(s.coverImageUrl) }} aria-hidden="true" />
              <span className="kl-row-name">{s.title}</span>
              <span className="kl-row-badge" aria-hidden="true"><Play /></span>
            </button>
          ))}
        </div>
      )}
      {stories && stories.length > 0 && (
        <button type="button" className="kid-btn3d is-gold kl-words-go" onClick={onOpenLibrary}>
          <Library aria-hidden="true" />{stories.length > SHOWN ? "Xem thêm truyện" : "Kho truyện"}
        </button>
      )}
    </section>
  );
}
