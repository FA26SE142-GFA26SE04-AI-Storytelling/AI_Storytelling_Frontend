"use client";

import { useState } from "react";
import { Flag, RotateCw } from "lucide-react";
import Select from "@/app/components/Select";
import { useAccess } from "@/app/features/staff/staffAccess";
import Pager from "@/app/components/Pager";
import { StarRating } from "@/app/components/StarRating";
import { useRiseIn } from "@/app/lib/motion";
import RatingReportDialog from "@/app/components/ratings/RatingReportDialog";
import type { PagedResult } from "@/app/types/story";
import type { StoryRatingDto, StoryRatingOrder } from "@/app/types/storyRating";

const ORDER_OPTIONS: { value: StoryRatingOrder; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "highest", label: "Sao cao nhất" },
  { value: "lowest", label: "Sao thấp nhất" },
];

export default function RatingComments({
  mode,
  data,
  loading,
  error,
  orderBy,
  onOrderBy,
  page,
  onPage,
  onRetry,
  myRatingId,
}: {
  mode: "parent" | "creator";
  data: PagedResult<StoryRatingDto> | null;
  loading: boolean;
  error: boolean;
  orderBy: StoryRatingOrder;
  onOrderBy: (o: StoryRatingOrder) => void;
  page: number;
  onPage: (p: number) => void;
  onRetry: () => void;
  myRatingId: number | null;
}) {
  const canReport = useAccess("story.rating.report").state !== "Hidden";
  const [reportingId, setReportingId] = useState<number | null>(null);
  const listRef = useRiseIn<HTMLDivElement>(".srd-comment", [data]);

  return (
    <div className="srd-comments">
      {/* 1. Hàng tiêu đề */}
      <div className="srd-header-row">
        <h3 className="srd-section-title">Bình luận</h3>
        <Select<StoryRatingOrder>
          value={orderBy}
          options={ORDER_OPTIONS}
          onChange={onOrderBy}
          ariaLabel="Sắp xếp bình luận"
        />
      </div>

      {/* 2. Loading skeleton */}
      {loading && !data && (
        <div className="srd-list">
          <div className="srd-skeleton" />
          <div className="srd-skeleton" />
          <div className="srd-skeleton" />
        </div>
      )}

      {/* 3. Lỗi */}
      {error && (
        <div className="srd-empty">
          <p className="srd-hint">Không tải được bình luận.</p>
          <button type="button" className="btn btn-s" onClick={onRetry}>
            <RotateCw className="ic" size={16} />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* 4. Rỗng */}
      {!error && data && data.items.length === 0 && (
        <div className="srd-empty">Chưa có bình luận nào.</div>
      )}

      {/* 5. Danh sách bình luận */}
      {!error && data && data.items.length > 0 && (
        <div ref={listRef} className="srd-list">
          {data.items.map((item) => (
            <article key={item.ratingId} className="srd-comment">
              <div className="srd-comment-head">
                <div className="srd-comment-meta">
                  <strong className="srd-comment-name">
                    {item.reviewerName}
                  </strong>
                  <StarRating value={item.rating} size={14} />
                  <span className="srd-comment-date">
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    {item.updatedAt ? " (đã sửa)" : ""}
                  </span>
                </div>

                {mode === "parent" && canReport && item.ratingId !== myRatingId && (
                  <button
                    type="button"
                    className="btn btn-g srd-report-flag"
                    aria-label="Báo cáo bình luận"
                    title="Báo cáo bình luận"
                    onClick={() => setReportingId(item.ratingId)}
                  >
                    <Flag className="ic" size={14} />
                  </button>
                )}
              </div>

              {item.comment ? (
                <p className="srd-comment-text">{item.comment}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {/* 6. Dialog báo cáo bình luận */}
      {reportingId !== null && (
        <RatingReportDialog
          ratingId={reportingId}
          onClose={() => setReportingId(null)}
        />
      )}

      {/* 7. Phân trang */}
      {data && data.totalPages > 1 && (
        <Pager
          page={page}
          totalPages={data.totalPages}
          hasPrev={data.hasPreviousPage}
          hasNext={data.hasNextPage}
          onPage={onPage}
        />
      )}
    </div>
  );
}
