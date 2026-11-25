"use client";

import { useState } from "react";
import StoryRatingDialog from "@/app/components/ratings/StoryRatingDialog";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import type { StoryCard } from "@/app/lib/storyView";
import { showToast } from "@/app/lib/toast";
import { ensureChild } from "@/app/lib/chooseChild";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { roadmapTemplate } from "@/app/services/roadmapAdapters";
import AddToRoadmapDialog from "@/app/features/roadmap/AddToRoadmapDialog";
import TemplateDialog from "@/app/features/roadmap/TemplateDialog";
import type { ChildProfile } from "@/app/types/childProfile";
import type { RoadmapTemplate } from "@/app/types/progress";
import type * as B from "@/app/types/backendContracts";
import LibraryDetailDialog from "./LibraryDetailDialog";
import { ReportDialog } from "./ModerationDialogs";
import { Preview } from "./StoryPreviewDialog";

export type LibraryDialogKind = "preview" | "roadmap" | "report" | "rating" | null;

type RatingStat = { averageRating: number | null; ratingCount: number };

export type LibraryDialogsProps = {
  selectedStory: StoryCard | null;
  dialog: LibraryDialogKind;
  openedTpl: B.RoadmapLibraryItemDto | null;
  addingTpl: RoadmapTemplate | null;
  pickKid: ChildProfile | null;
  pickStage: number | "new" | undefined;
  go: WorkspaceProps["go"];
  onKid?: WorkspaceProps["onKid"];
  onCloseDetails: () => void;
  onDialogChange: (dialog: LibraryDialogKind) => void;
  onCloseOpenedTpl: () => void;
  onStartAddingTpl: (tpl: RoadmapTemplate) => void;
  onMarkRoadmapAdded: () => void;
  onCloseAddingTpl: () => void;
  onCloseStoryRoadmap: () => void;
};

/** Cụm hộp thoại mở từ Thư viện phụ huynh: chi tiết truyện, xem trước, lộ trình mẫu, thêm vào lộ trình và báo cáo. */
export default function LibraryDialogs({
  selectedStory,
  dialog,
  openedTpl,
  addingTpl,
  pickKid,
  pickStage,
  go,
  onKid,
  onCloseDetails,
  onDialogChange,
  onCloseOpenedTpl,
  onStartAddingTpl,
  onMarkRoadmapAdded,
  onCloseAddingTpl,
  onCloseStoryRoadmap,
}: LibraryDialogsProps) {
  // Số sao trong danh sách truyện bị cache tới 1 phút ở backend: giữ số mới nhất sau khi phụ huynh gửi/xoá đánh giá.
  const [ratingOverride, setRatingOverride] = useState<Record<number, RatingStat>>({});
  const { children: kids, childrenLoading } = useWorkspaceData();
  // Chưa có bé đang hoạt động thì không mở form thêm lộ trình (đã chọn sẵn bé thì xét riêng bé đó).
  const canAddRoadmap = () => ensureChild(pickKid ? [pickKid] : kids, childrenLoading);
  const rating: RatingStat | null = selectedStory
    ? ratingOverride[selectedStory.id] ?? {
        averageRating: selectedStory.raw.averageRating ?? null,
        ratingCount: selectedStory.raw.ratingCount ?? 0,
      }
    : null;
  return (
    <>
      {selectedStory && rating && !dialog && (
        <LibraryDetailDialog
          story={selectedStory}
          go={go}
          onKid={onKid}
          onClose={onCloseDetails}
          onPreview={() => onDialogChange("preview")}
          onAddRoadmap={() => { if (canAddRoadmap()) onDialogChange("roadmap"); }}
          onReport={() => onDialogChange("report")}
          onRate={() => onDialogChange("rating")}
          rating={rating}
        />
      )}
      {selectedStory && dialog === "rating" && (
        <StoryRatingDialog
          storyId={selectedStory.id}
          title={selectedStory.title}
          mode="parent"
          onClose={() => onDialogChange(null)}
          onChanged={(summary) =>
            setRatingOverride((prev) => ({
              ...prev,
              [selectedStory.id]: { averageRating: summary.averageRating, ratingCount: summary.ratingCount },
            }))
          }
        />
      )}
      {selectedStory && dialog === "preview" && (
        <Preview story={selectedStory} onClose={() => onDialogChange(null)} />
      )}
      {openedTpl && (
        <TemplateDialog
          item={openedTpl}
          onClose={onCloseOpenedTpl}
          onAdd={(detail) => {
            if (!canAddRoadmap()) return;
            onCloseOpenedTpl();
            onStartAddingTpl(roadmapTemplate(detail));
          }}
        />
      )}
      {addingTpl && (
        <AddToRoadmapDialog
          template={addingTpl}
          childId={pickKid?.id}
          single={!!pickKid}
          onDone={onMarkRoadmapAdded}
          onClose={onCloseAddingTpl}
        />
      )}
      {selectedStory && dialog === "roadmap" && (
        <AddToRoadmapDialog
          story={{
            storyId: selectedStory.id,
            title: selectedStory.title,
            ageBand: selectedStory.ageBand,
            length: selectedStory.words,
          }}
          childId={pickKid?.id}
          single={!!pickKid}
          targetStage={pickStage}
          onDone={onMarkRoadmapAdded}
          onClose={onCloseStoryRoadmap}
        />
      )}
      {selectedStory && dialog === "report" && (
        <ReportDialog
          story={selectedStory}
          onClose={() => onDialogChange(null)}
          onDone={(message) => {
            onDialogChange(null);
            showToast(message, "ok");
          }}
        />
      )}
    </>
  );
}
