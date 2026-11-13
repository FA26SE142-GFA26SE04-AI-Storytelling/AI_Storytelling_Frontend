"use client";

import { Eye, Heart } from "lucide-react";
import "./StoryStatsBadge.css";

/**
 * Huy hiệu hiển thị số liệu truyện (lượt đọc, lượt yêu thích).
 * Lưu ý: Phần tử cha chứa component này cần có `position: relative`.
 */
export function StoryStatsBadge({
  viewCount,
  favoriteCount,
  belowPill,
}: {
  viewCount?: number | null;
  favoriteCount?: number | null;
  /** Bìa đã có nhãn trạng thái ở góc trên-trái: đặt huy hiệu ngay dưới nhãn để không chạm nhau. */
  belowPill?: boolean;
}) {
  const hasViews = typeof viewCount === "number" && !Number.isNaN(viewCount);
  const hasFavorites = typeof favoriteCount === "number" && !Number.isNaN(favoriteCount);

  if (!hasViews && !hasFavorites) {
    return null;
  }

  const labelParts: string[] = [];
  if (hasViews) {
    labelParts.push(`${viewCount.toLocaleString("vi-VN")} lượt đọc`);
  }
  if (hasFavorites) {
    labelParts.push(`${favoriteCount.toLocaleString("vi-VN")} lượt yêu thích`);
  }
  const ariaLabel = labelParts.join(", ");

  return (
    <span className={`story-stats-badge${belowPill ? " below-pill" : ""}`} aria-label={ariaLabel}>
      {hasViews && (
        <span className="story-stats-item">
          <Eye size={14} aria-hidden="true" />
          <span>{viewCount.toLocaleString("vi-VN")}</span>
        </span>
      )}
      {hasFavorites && (
        <span className="story-stats-item">
          <Heart size={14} aria-hidden="true" className="story-stats-heart" />
          <span>{favoriteCount.toLocaleString("vi-VN")}</span>
        </span>
      )}
    </span>
  );
}

export default StoryStatsBadge;
