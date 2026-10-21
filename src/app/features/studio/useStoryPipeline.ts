"use client";

import { useCallback, useEffect } from "react";
import { aiStoryCreationService as api } from "@/app/services/aiStoryCreationService";
import type { ContentGenerationProgressDto, MediaProgressDto, OutlineProgressDto } from "@/app/types/aiStory";
import type { ApiResponse } from "@/app/types/auth";
import { normalizeStoryStatus, outlineReady } from "@/app/features/story-workflow/storyGenerationFlow";
import { readStorySession, writeStorySession } from "@/app/features/story-workflow/storyStudioSession";
import { useAIStoryInputFlow } from "@/app/features/story-workflow/useAIStoryInputFlow";
import type { AIStoryInputFormValues } from "@/app/features/story-workflow/aiStoryInputFlowUtils";
import { studioActions } from "./studioProgress";
import { useStoryProgressPolling } from "@/app/features/story-workflow/useStoryProgressPolling";

export type Stage = "brief" | "checking" | "blocked" | "outline_wait" | "outline" | "generating" | "moderation" | "review" | "media" | "stopped";

export type StatusSnapshot = { outline: OutlineProgressDto | null; generation: ContentGenerationProgressDto | null };

/** Đọc cả hai endpoint tiến trình; thành công nếu ít nhất một endpoint trả dữ liệu. */
export async function loadSnapshot(id: number, signal: AbortSignal): Promise<ApiResponse<StatusSnapshot>> {
  const [o, g] = await Promise.all([api.getOutline(id, signal), api.getGenerationProgress(id, signal)]);
  if (!o.data && !g.data) return { success: false, data: null, message: o.message || g.message };
  return { success: true, message: "", data: { outline: o.data, generation: g.data } };
}

export function snapshotStage(snap: StatusSnapshot | null, approvedLocally: boolean): Stage {
  if (!snap) return "outline_wait";
  const status = normalizeStoryStatus(snap.outline?.storyStatus ?? snap.generation?.storyStatus ?? "");
  if (["rejected", "archived", "blocked"].includes(status)) return "stopped";
  // Luồng 2 mục 3.4 — truyện vùng xám chờ Moderator, thường trong 24 giờ.
  if (status === "moderation_review") return "moderation";
  if (status === "content_review") return "review";
  if (["approved", "media_processing", "ready"].includes(status)) return "media";
  if (status === "outline_review") {
    if (snap.outline?.currentVersion?.outlineApprovedAt || approvedLocally) return "generating";
    return snap.outline && outlineReady(snap.outline) ? "outline" : "outline_wait";
  }
  return "outline_wait";
}

const keepPolling = (stage: Stage) => stage === "outline_wait" || stage === "generating";

export function useStoryPipeline(userId: number, childId: number | null, approvedLocally: boolean, initialValues?: AIStoryInputFormValues | null) {
  const resumed = childId !== null ? readStorySession(userId, childId) : null;
  const flow = useAIStoryInputFlow(childId, resumed?.storyId, resumed?.requestId, initialValues);
  const storyId = flow.progress?.storyId ?? null;
  const accepted = flow.phase === "input_accepted" && storyId !== null;

  useEffect(() => {
    if (flow.progress && childId !== null) writeStorySession(userId, childId, { storyId: flow.progress.storyId, requestId: flow.progress.requestId });
  }, [flow.progress, userId, childId]);

  const shouldContinue = useCallback((snap: StatusSnapshot) => keepPolling(snapshotStage(snap, approvedLocally)), [approvedLocally]);
  const status = useStoryProgressPolling<StatusSnapshot>(accepted ? storyId : null, loadSnapshot, shouldContinue);

  let stage: Stage = "brief";
  if (flow.phase === "submitting" || flow.phase === "checking_input") stage = "checking";
  else if (flow.phase === "input_blocked" || flow.phase === "input_check_failed") stage = "blocked";
  else if (accepted) stage = snapshotStage(status.data, approvedLocally);

  const errorCode = status.data?.generation?.lastErrorCode ?? status.data?.outline?.lastErrorCode ?? null;
  /** Huỷ truyện hiện tại trên backend (từ chối dàn ý hoặc lưu trữ) trước khi làm lại. */
  const cancel = async (): Promise<ApiResponse<unknown>> => {
    const how = studioActions(stage).cancelWith;
    if (storyId === null || !how) return { success: false, data: null, message: "Chưa thể huỷ ở bước này." };
    if (how === "reject_outline") {
      const version = status.data?.outline?.currentVersion?.versionNo;
      if (!version) return { success: false, data: null, message: "Chưa tải được dàn ý để huỷ." };
      return api.rejectOutline(storyId, version, { reason: "Phụ huynh huỷ để làm lại từ ý tưởng" });
    }
    return api.archiveStory(storyId, { reason: "supervisor_preference" });
  };

  /**
   * Thử lại bước AI vừa lỗi: viết truyện / học liệu (`generation/retry`) hoặc tạo dàn ý lần đầu (`outline/retry`).
   * Lỗi khi viết lại dàn ý đã có thì không có ở đây: phụ huynh bấm "Viết lại" trong tab Dàn ý.
   */
  const generationFailed = status.data?.generation?.currentStep?.startsWith("failed_") ?? false;
  const outlineFailed = !!status.data?.outline?.lastErrorCode && !status.data.outline.currentVersion;
  const retryFailed = storyId !== null && (generationFailed || outlineFailed) ? async () => {
    const key = `retry-${storyId}-${crypto.randomUUID()}`;
    const r = generationFailed ? await api.retryGeneration(storyId, { retryKey: key }) : await api.retryOutline(storyId, { operationKey: key });
    status.refresh();
    return r;
  } : undefined;

  return { cancel, flow, storyId, stage, snapshot: status.data, statusError: status.error, timedOut: status.timedOut, errorCode, retryFailed, refresh: status.refresh };
}

const mediaContinue = (m: MediaProgressDto) => !m.isReady && !m.errorCode;
export function useMediaProgress(storyId: number | null) {
  return useStoryProgressPolling<MediaProgressDto>(storyId, api.getMediaProgress, mediaContinue, 600_000);
}
