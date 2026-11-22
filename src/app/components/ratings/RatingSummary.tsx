"use client";

import Frog from "@/app/components/brand/Frog";
import { StarRating } from "@/app/components/StarRating";
import type { StoryRatingSummaryDto } from "@/app/types/storyRating";
import "@/app/styles/components/StoryRatingDialog.css";

export default function RatingSummary({ summary }: { summary: StoryRatingSummaryDto }) {
  if (!summary || summary.ratingCount === 0 || summary.averageRating === null) {
    return (
      <div className="srd-empty">
        <Frog mood="think" size={96} />
        <div>Chưa có đánh giá nào</div>
      </div>
    );
  }

  const avg = summary.averageRating ?? 0;
  const ratingCount = summary.ratingCount;
  const formattedAvg = avg.toLocaleString("vi-VN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div className="srd-summary">
      <div>
        <div className="srd-avg">{formattedAvg}</div>
        <StarRating value={avg} size={20} />
        <div className="srd-avg-count">{ratingCount} đánh giá</div>
      </div>

      <div className="srd-bars">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = summary.distribution?.[String(n)] ?? 0;
          const pct = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
          return (
            <div key={n} className="srd-bar-row">
              <span>{n} sao</span>
              <div className="srd-track">
                <div className="srd-fill" style={{ width: `${pct}%` }} />
              </div>
              <span>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
