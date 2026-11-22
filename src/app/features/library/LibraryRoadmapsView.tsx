"use client";

import { RefreshCw, X } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import RoadmapAlbum from "@/app/features/roadmap/RoadmapAlbum";
import type * as B from "@/app/types/backendContracts";
import { LibrarySkeletonGrid } from "./LibraryCards";
import { canonicalAgeLabel, type AgeFilterOption } from "./libraryFilters";

export type LibraryRoadmapsViewProps = {
  templates: B.RoadmapLibraryItemDto[] | null;
  roadmapResults: B.RoadmapLibraryItemDto[];
  ageOptions: AgeFilterOption[];
  query: string;
  age: string;
  error: string | null;
  onAgeChange: (age: string) => void;
  onClearQuery: () => void;
  onClearAll: () => void;
  onRetry: () => void;
  onOpenTemplate: (template: B.RoadmapLibraryItemDto) => void;
};

/** Nội dung tab "Lộ trình mẫu" của Thư viện phụ huynh: lọc nhanh độ tuổi, lưới album lộ trình và trạng thái lỗi/trống. */
export default function LibraryRoadmapsView({
  templates,
  roadmapResults,
  ageOptions,
  query,
  age,
  error,
  onAgeChange,
  onClearQuery,
  onClearAll,
  onRetry,
  onOpenTemplate,
}: LibraryRoadmapsViewProps) {
  const total = templates?.length ?? 0;
  const hasFilter = query.trim() !== "" || age !== "all";
  const activeAgeLabel = age === "all" ? null : ageOptions.find((o) => o.key === age)?.label ?? canonicalAgeLabel(age);

  return (
    <>
      {ageOptions.length > 1 && (
        <div className="lib-topics" role="group" aria-label="Lọc lộ trình theo độ tuổi">
          <button
            type="button"
            className={`lib-topic-pill${age === "all" ? " on" : ""}`}
            aria-pressed={age === "all"}
            onClick={() => onAgeChange("all")}
          >
            <span className="lib-topic-label">Mọi độ tuổi</span>
            <span className="lib-pill-n lib-num">{total}</span>
          </button>
          {ageOptions.map((opt) => (
            <button
              type="button"
              key={opt.key}
              className={`lib-topic-pill${age === opt.key ? " on" : ""}`}
              aria-pressed={age === opt.key}
              onClick={() => onAgeChange(age === opt.key ? "all" : opt.key)}
            >
              <span className="lib-topic-label">{opt.label}</span>
              <span className="lib-pill-n lib-num">{opt.count}</span>
            </button>
          ))}
        </div>
      )}

      {hasFilter && templates !== null && (
        <div className="lib-summary">
          <span className="lib-count lib-num" role="status">
            Hiển thị {roadmapResults.length} / {total} lộ trình
          </span>
          <div className="lib-active-chips">
            {query.trim() && (
              <button
                type="button"
                className="lib-active-chip"
                onClick={onClearQuery}
                aria-label={`Bỏ từ khóa ${query.trim()}`}
              >
                <span>Từ khóa: “{query.trim()}”</span>
                <X className="ic" aria-hidden="true" />
              </button>
            )}
            {activeAgeLabel && (
              <button
                type="button"
                className="lib-active-chip"
                onClick={() => onAgeChange("all")}
                aria-label={`Bỏ độ tuổi ${activeAgeLabel}`}
              >
                <span>Độ tuổi: {activeAgeLabel}</span>
                <X className="ic" aria-hidden="true" />
              </button>
            )}
            <button type="button" className="lib-reset-btn" onClick={onClearAll}>
              Đặt lại
            </button>
          </div>
        </div>
      )}

      {error && total > 0 && (
        <div className="notice err lib-inline-err" role="alert" data-inline-notice>
          <span className="grow">{error}</span>
          <button type="button" className="btn btn-s" onClick={onRetry}>
            <RefreshCw className="ic" aria-hidden="true" />
            Thử lại
          </button>
        </div>
      )}

      {templates === null && !error ? (
        <LibrarySkeletonGrid count={4} label="Đang tải lộ trình mẫu…" />
      ) : error && total === 0 ? (
        <div className="lib-empty-panel lib-error-panel" role="alert" data-inline-notice>
          <Frog size={84} mood="think" />
          <h3 className="display">Không tải được lộ trình mẫu</h3>
          <p>{error}</p>
          <button type="button" className="btn btn-p" onClick={onRetry}>
            <RefreshCw className="ic" aria-hidden="true" />
            Thử lại
          </button>
        </div>
      ) : roadmapResults.length > 0 ? (
        <section className="lib-section" aria-labelledby="lib-roadmaps-heading">
          <div className="lib-sec-head">
            <div className="lib-sec-title-group">
              <h3 id="lib-roadmaps-heading" className="display">
                Bộ lộ trình gợi ý
              </h3>
              <span className="lib-sec-meta lib-num" role="status">
                {roadmapResults.length} lộ trình
              </span>
            </div>
          </div>
          <div className="lib-roadmap-grid">
            {roadmapResults.map((template) => (
              <RoadmapAlbum key={`rm-${template.id}`} item={template} onOpen={() => onOpenTemplate(template)} />
            ))}
          </div>
        </section>
      ) : (
        <div className="lib-empty-panel">
          <Frog size={88} mood="think" />
          <h3 className="display">{hasFilter ? "Không tìm thấy lộ trình phù hợp" : "Chưa có lộ trình mẫu"}</h3>
          <p>
            {hasFilter
              ? "Thử đổi từ khóa hoặc chọn lại độ tuổi khác."
              : "Các bộ lộ trình đọc gợi ý sẽ xuất hiện tại đây khi được phát hành."}
          </p>
          {hasFilter && (
            <button type="button" className="btn btn-s" onClick={onClearAll}>
              <X className="ic" aria-hidden="true" />
              Xoá bộ lọc
            </button>
          )}
        </div>
      )}
    </>
  );
}
