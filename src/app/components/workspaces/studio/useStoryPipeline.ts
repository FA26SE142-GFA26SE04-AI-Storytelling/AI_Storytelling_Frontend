"use client";

import { useCallback, useEffect } from "react";
import { aiStoryCreationService as api } from "../../../services/aiStoryCreationService";
import type { ContentGenerationProgressDto, MediaProgressDto, OutlineProgressDto } from "../../../types/aiStory";
import type { ApiResponse } from "../../../types/auth";
import { normalizeStoryStatus, outlineReady } from "../../closet/hooks/storyGenerationFlow";
import { readStorySession, writeStorySession } from "../../closet/hooks/storyStudioSession";
import { useAIStoryInputFlow } from "../../closet/hooks/useAIStoryInputFlow";
import { useStoryProgressPolling } from "../../closet/hooks/useStoryProgressPolling";

export type Stage = "brief" | "checking" | "blocked" | "outline_wait" | "outline" | "generating" | "review" | "media" | "stopped";

export type StatusSnapshot = { outline: OutlineProgressDto | null; generation: ContentGenerationProgressDto | null };

/** Đọc cả hai endpoint tiến trình; thành công nếu ít nhất một endpoint trả dữ liệu. */
async function loadSnapshot(id: number, signal: AbortSignal): Promise<ApiResponse<StatusSnapshot>> {
  const [o, g] = await Promise.all([api.getOutline(id, signal), api.getGenerationProgress(id, signal)]);
  if (!o.data && !g.data) return { success: false, data: null, message: o.message || g.message };
  return { success: true, message: "", data: { outline: o.data, generation: g.data } };
}

export function snapshotStage(snap: StatusSnapshot | null, approvedLocally: boolean): Stage {
  if (!snap) return "outline_wait";
  const status = normalizeStoryStatus(snap.outline?.storyStatus ?? snap.generation?.storyStatus ?? "");
  if (["rejected", "archived"].includes(status)) return "stopped";
  if (status === "content_review") return "review";
  if (["approved", "media_processing", "ready"].includes(status)) return "media";
  if (status === "outline_review") {
    if (snap.outline?.currentVersion?.outlineApprovedAt || approvedLocally) return "generating";
    return snap.outline && outlineReady(snap.outline) ? "outline" : "outline_wait";
  }
  return "outline_wait";
}

const keepPolling = (stage: Stage) => stage === "outline_wait" || stage === "generating";

export function useStoryPipeline(userId: number, childId: number | null, approvedLocally: boolean) {
  const resumed = childId !== null ? readStorySession(userId, childId) : null;
  const flow = useAIStoryInputFlow(childId, resumed?.storyId, resumed?.requestId);
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
  return { flow, storyId, stage, snapshot: status.data, statusError: status.error, timedOut: status.timedOut, errorCode, refresh: status.refresh };
}

const mediaContinue = (m: MediaProgressDto) => !m.isReady && !m.errorCode;
export function useMediaProgress(storyId: number | null) {
  return useStoryProgressPolling<MediaProgressDto>(storyId, api.getMediaProgress, mediaContinue, 600_000);
}
