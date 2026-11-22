"use client";

import { useEffect, useRef } from "react";
import {
  BookOpen,
  Eye,
  Flag,
  Heart,
  PencilLine,
  Route,
  Sparkles,
  Tag,
  User,
  Users,
  WandSparkles,
} from "lucide-react";
import Dialog from "@/app/components/Dialog";
import StoryHandoverButton from "@/app/features/kid/StoryHandoverButton";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import type { StoryCard } from "@/app/lib/storyView";
import { canonicalAgeLabel, displayAuthorOf, SOURCE_LABEL, sourceOf, statusOf, topicOf } from "./libraryFilters";

export type LibraryDetailDialogProps = {
  story: StoryCard;
  go: WorkspaceProps["go"];
  onKid?: WorkspaceProps["onKid"];
  onClose: () => void;
  onPreview: () => void;
  onAddRoadmap: () => void;
  onReport: () => void;
};

/** Hộp chi tiết truyện của Thư viện phụ huynh: bìa đứng 3:4, tóm tắt & bài học trên nền giấy, hàng thao tác rõ thứ bậc. */
export default function LibraryDetailDialog({
  story,
  go,
  onKid,
  onClose,
  onPreview,
  onAddRoadmap,
  onReport,
}: LibraryDetailDialogProps) {
  const detailRef = useRef<HTMLDivElement>(null);
  const storyStatus = statusOf(story);
  const hasViews = typeof story.viewCount === "number" && !Number.isNaN(story.viewCount);
  const hasFavorites = typeof story.favoriteCount === "number" && !Number.isNaN(story.favoriteCount);

  useEffect(() => {
    const modal = detailRef.current?.closest('[role="dialog"]');
    if (!modal) return;
    const tabbable = () =>
      Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]',
        ),
      ).filter((element) => element.getClientRects().length > 0);
    tabbable()[0]?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== modal) return;
      const items = tabbable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (!modal.contains(document.activeElement) || document.activeElement === (event.shiftKey ? first : last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog title={story.title} onClose={onClose} wide className="lib-detail">
      <div ref={detailRef} className="lib-detail-layout">
        <div className="lib-detail-aside">
          <div className="lib-detail-cover" style={{ background: story.cover }} aria-hidden="true" />
          <div className="lib-detail-aside-meta">
            <span className={`pill ${story.tone} lib-detail-status`}>{story.statusLabel}</span>
            {(hasViews || hasFavorites) && (
              <div className="lib-detail-stats" aria-label="Thống kê cộng đồng">
                {hasViews && (
                  <span className="lib-detail-stat">
                    <Eye className="ic" aria-hidden="true" />
                    <b className="lib-num">{story.viewCount!.toLocaleString("vi-VN")}</b>
                    <span>lượt đọc</span>
                  </span>
                )}
                {hasFavorites && (
                  <span className="lib-detail-stat fav">
                    <Heart className="ic" aria-hidden="true" />
                    <b className="lib-num">{story.favoriteCount!.toLocaleString("vi-VN")}</b>
                    <span>yêu thích</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lib-detail-main">
          <div className="lib-detail-tags" aria-label="Thông tin truyện">
            <span className="lib-tag">
              <Users className="ic" aria-hidden="true" />
              {canonicalAgeLabel(story.ageBand)}
            </span>
            <span className="lib-tag">
              <Tag className="ic" aria-hidden="true" />
              {topicOf(story)}
            </span>
            <span className="lib-tag">{SOURCE_LABEL[sourceOf(story)]}</span>
            {story.words > 0 && (
              <span className="lib-tag lib-num">
                <BookOpen className="ic" aria-hidden="true" />
                {story.words.toLocaleString("vi-VN")} tiếng
              </span>
            )}
          </div>

          <p className="lib-detail-author">
            <User className="ic" aria-hidden="true" />
            <span>Người tạo:</span>
            <b>{displayAuthorOf(story)}</b>
          </p>

          {(story.raw.description || story.raw.moralLesson) && (
            <div className="lib-detail-prose">
              {story.raw.description && <p className="lib-detail-desc">{story.raw.description}</p>}
              {story.raw.moralLesson && (
                <div className="lib-detail-moral">
                  <span className="lib-detail-moral-h">
                    <Sparkles className="ic" aria-hidden="true" />
                    Bài học
                  </span>
                  <p>{story.raw.moralLesson}</p>
                </div>
              )}
            </div>
          )}

          <div className="lib-detail-actions">
            {/* Truyện tự soạn đi qua API riêng: kiểm tra, giao cho bé, thu hồi đều làm ở trang Tự soạn. */}
            {story.family ? (
              <div className="lib-detail-primary">
                <button
                  type="button"
                  className="btn btn-p btn-c"
                  onClick={() => go("authoring", { storyId: story.id })}
                >
                  <PencilLine className="ic" aria-hidden="true" />
                  Mở trong trang Thủ công
                </button>
              </div>
            ) : (
              <>
                {storyStatus === "moderation" && (
                  <span className="pill wait lib-state" title="Kiểm duyệt viên thường xem trong 24 giờ">
                    Đang chờ kiểm duyệt
                  </span>
                )}
                {(storyStatus === "ready" ||
                  storyStatus === "review" ||
                  (story.fromAi &&
                    ["draft", "generating", "outline", "review", "media", "moderation"].includes(storyStatus))) && (
                  <div className="lib-detail-primary">
                    {storyStatus === "review" && (
                      <button
                        type="button"
                        className="btn btn-p btn-c"
                        onClick={() => go(story.fromAi ? "studio" : "authoring", { storyId: story.id })}
                      >
                        <WandSparkles className="ic" aria-hidden="true" />
                        Mở để duyệt
                      </button>
                    )}
                    {story.fromAi &&
                      ["draft", "generating", "outline", "review", "media", "moderation"].includes(storyStatus) && (
                        <button
                          type="button"
                          className="btn btn-p btn-c"
                          onClick={() => go("studio", { storyId: story.id })}
                        >
                          <WandSparkles className="ic" aria-hidden="true" />
                          Tiếp tục trong Studio
                        </button>
                      )}
                    {storyStatus === "ready" && (
                      <StoryHandoverButton storyId={story.id} title={story.title} onKid={onKid} />
                    )}
                    {storyStatus === "ready" && (
                      <button type="button" className="btn btn-p btn-c" onClick={onAddRoadmap}>
                        <Route className="ic" aria-hidden="true" />
                        Thêm vào lộ trình
                      </button>
                    )}
                  </div>
                )}
                {storyStatus === "ready" && (
                  <div className="lib-detail-secondary">
                    <button type="button" className="btn btn-s" onClick={onPreview}>
                      <Eye className="ic" aria-hidden="true" />
                      Xem trước như bé thấy
                    </button>
                    <button type="button" className="btn btn-g lib-report-btn" onClick={onReport}>
                      <Flag className="ic" aria-hidden="true" />
                      Báo cáo nội dung
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
