"use client";

import Frog from "@/app/components/brand/Frog";
import type { StoryCard } from "@/app/lib/storyView";
import { Shelf, ShelfRow } from "./Shelf";

/** Lời chào theo buổi trong ngày (giờ máy của phụ huynh). */
function greeting() {
  const h = new Date().getHours();
  return h < 11 ? "Chào buổi sáng!" : h < 14 ? "Chào buổi trưa!" : h < 18 ? "Chào buổi chiều!" : "Chào buổi tối!";
}

/** Đầu trang thư viện: ếch chào, số truyện đang có trên kệ. */
export function LibraryGreeting({ total, ready }: { total: number; ready: number }) {
  return (
    <div className="lib-hero">
      <Frog size={84} mood="happy" />
      <div className="lib-hero-text">
        <span className="sub">{greeting()}</span>
        <h2 className="display">Hôm nay bé đọc truyện gì nhỉ?</h2>
        <p className="sub">
          {total > 0
            ? `Đầm sen đang có ${total} truyện đã được kiểm duyệt${ready < total ? `, ${ready} truyện đọc được ngay` : ""}.`
            : "Các truyện đã được kiểm duyệt sẽ xuất hiện ở đây."}
        </p>
      </div>
    </div>
  );
}

/**
 * Hàng nổi bật: truyện được đọc nhiều nhất (có xếp hạng); chưa có số liệu lượt đọc thì là truyện mới lên kệ.
 * `card` vẽ một thẻ truyện, nhận thứ hạng khi có.
 */
export function FeaturedShelf({ viewed, latest, card }: { viewed: StoryCard[]; latest: StoryCard[]; card: (s: StoryCard, rank?: number) => React.ReactNode }) {
  const ranked = viewed.length > 0;
  const items = (ranked ? viewed : latest).slice(0, 10);
  if (items.length === 0) return null;
  return (
    <Shelf title="Nổi bật" sub={ranked ? "Được các bé đọc nhiều nhất" : "Mới lên kệ"} items={items}>
      <ShelfRow>{items.map((s, i) => card(s, ranked ? i + 1 : undefined))}</ShelfRow>
    </Shelf>
  );
}
