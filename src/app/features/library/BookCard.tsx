"use client";

import { StoryStatsBadge } from "@/app/components/StoryStatsBadge";
import { ageLabel, type StoryCard } from "@/app/lib/storyView";
import BookCover from "./BookCover";
import { isReady } from "./useLibraryStories";

const NEW_DAYS = 3;
const isNew = (s: StoryCard) => Date.now() - new Date(s.createdAt).getTime() < NEW_DAYS * 86_400_000;

/** Thẻ truyện bìa đứng của thư viện: bìa, nhãn "Mới"/"Đang chuẩn bị", lượt đọc; số thứ tự lớn khi nằm trong hàng nổi bật. */
export default function BookCard({ story, rank, on, onPick }: { story: StoryCard; rank?: number; on: boolean; onPick: () => void }) {
  const ready = isReady(story);
  return (
    <button className={`lbk${on ? " on" : ""}`} onClick={onPick} aria-pressed={on} aria-label={`${story.title}, ${ageLabel(story.ageBand)}`}>
      <BookCover url={story.raw.coverImageUrl} title={story.title} seed={story.id} className="lbk-cover">
        {!ready ? <span className="lbk-badge prep">Đang chuẩn bị</span> : isNew(story) && <span className="lbk-badge new">Mới</span>}
        <StoryStatsBadge viewCount={story.viewCount} favoriteCount={story.favoriteCount} />
        {rank !== undefined && <span className="lbk-rank display" aria-hidden>{rank}</span>}
      </BookCover>
      <span className="lbk-title">{story.title}</span>
      <span className="lbk-meta">{[story.topic, ageLabel(story.ageBand)].filter(Boolean).join(" · ")}</span>
    </button>
  );
}

/** Thẻ giữ chỗ khi đang tải: cùng kích thước thẻ thật để lưới không nhảy khi dữ liệu về. */
export function BookCardSkeleton() {
  return (
    <span className="lbk lbk-skel" aria-hidden>
      <span className="lbk-cover bkc" />
      <span className="lbk-line" />
      <span className="lbk-line short" />
    </span>
  );
}
