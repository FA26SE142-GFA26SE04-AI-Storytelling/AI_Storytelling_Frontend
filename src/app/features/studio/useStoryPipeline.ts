"use client";

import { useCallback, useEffect, useState } from "react";
import { aiStoryCreationService as api } from "@/app/services/aiStoryCreationService";
import type { MediaProgressDto } from "@/app/types/aiStory";
import type { ApiResponse } from "@/app/types/auth";
import { readStorySession, writeStorySession } from "@/app/features/story-workflow/storyStudioSession";
import { useAIStoryInputFlow } from "@/app/features/story-workflow/useAIStoryInputFlow";
import type { AIStoryInputFormValues } from "@/app/features/story-workflow/aiStoryInputFlowUtils";
import { studioActions } from "./studioProgress";
import { useStoryProgressPolling } from "@/app/features/story-workflow/useStoryProgressPolling";

import { loadSnapshot, snapshotStage, keepPolling, type Stage, type StatusSnapshot } from '@/app/features/story-workflow/generationSnapshot';
import { loadResumeSnapshot } from '@/app/features/story-workflow/resumeStory';
export { snapshotStage, type Stage, type StatusSnapshot } from '@/app/features/story-workflow/generationSnapshot';

export function useStoryPipeline(userId: number, childId: number | null, approvedLocally: boolean, initialValues?: AIStoryInputFormValues | null, resumeStoryId?:number | null) {
  // Freeze the initial target: writing a newly submitted session must not restart its input flow.
  const [resumed] = useState(() => {
    if (initialValues) return null;
    const cached = childId !== null ? readStorySession(userId,childId) : null;
    return resumeStoryId ? cached?.storyId === resumeStoryId ? cached : {storyId:resumeStoryId,requestId:null} : cached;
  });
  const inputFlow = useAIStoryInputFlow(resumed ? null : childId, undefined, undefined, initialValues);
  const storyId = resumed?.storyId ?? inputFlow.progress?.storyId ?? null;
  const accepted = !!resumed || inputFlow.phase === "input_accepted" && storyId !== null;

  useEffect(() => {
    if (childId !== null && resumed) writeStorySession(userId,childId,resumed);
    else if (inputFlow.progress && childId !== null) writeStorySession(userId, childId, { storyId: inputFlow.progress.storyId, requestId: inputFlow.progress.requestId });
  }, [inputFlow.progress, resumed, userId, childId]);

  const shouldContinue = useCallback((snap: StatusSnapshot) => keepPolling(snapshotStage(snap, approvedLocally)), [approvedLocally]);
  const loadResumed = useCallback((id:number,signal:AbortSignal) => loadResumeSnapshot(id,resumed?.requestId ?? null,signal),[resumed]);
  const status = useStoryProgressPolling<StatusSnapshot>(accepted ? storyId : null, resumed ? loadResumed : loadSnapshot, shouldContinue);
  const flow = resumed ? {...inputFlow,progress:status.data?.input ?? null,errorMessage:status.data?.input?.fallbackMessage ?? status.error} : inputFlow;

  let stage: Stage = "brief";
  if (resumed) stage = snapshotStage(status.data,approvedLocally);
  else if (flow.phase === "submitting" || flow.phase === "checking_input") stage = "checking";
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

  return { cancel, flow, storyId, stage, snapshot: status.data, resumed:!!resumed, statusError: status.error, timedOut: status.timedOut, errorCode, retryFailed, refresh: status.refresh };
}

const mediaContinue = (m: MediaProgressDto) => !m.isReady && !m.isAwaitingConfirmation && !m.errorCode;
export function useMediaProgress(storyId: number | null) {
  return useStoryProgressPolling<MediaProgressDto>(storyId, api.getMediaProgress, mediaContinue, 600_000);
}
