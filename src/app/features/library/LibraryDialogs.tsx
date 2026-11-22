"use client";

import type { WorkspaceProps } from "@/app/components/shell/nav";
import type { StoryCard } from "@/app/lib/storyView";
import { showToast } from "@/app/lib/toast";
import { roadmapTemplate } from "@/app/services/roadmapAdapters";
import AddToRoadmapDialog from "@/app/features/roadmap/AddToRoadmapDialog";
import TemplateDialog from "@/app/features/roadmap/TemplateDialog";
import type { ChildProfile } from "@/app/types/childProfile";
import type { RoadmapTemplate } from "@/app/types/progress";
import type * as B from "@/app/types/backendContracts";
import LibraryDetailDialog from "./LibraryDetailDialog";
import { ReportDialog } from "./ModerationDialogs";
import { Preview } from "./StoryPreviewDialog";

export type LibraryDialogKind = "preview" | "roadmap" | "report" | null;

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
  return (
    <>
      {selectedStory && !dialog && (
        <LibraryDetailDialog
          story={selectedStory}
          go={go}
          onKid={onKid}
          onClose={onCloseDetails}
          onPreview={() => onDialogChange("preview")}
          onAddRoadmap={() => onDialogChange("roadmap")}
          onReport={() => onDialogChange("report")}
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
