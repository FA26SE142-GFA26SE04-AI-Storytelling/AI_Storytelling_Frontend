import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import type { AIStoryInputProgressDto, ContentGenerationProgressDto, MediaProgressDto, OutlineProgressDto } from '@/app/types/aiStory';
import type { StoryDto } from '@/app/types/story';
import type { ApiResponse } from '@/app/types/auth';
import { normalizeStoryStatus, outlineReady } from './storyGenerationFlow';

export type Stage = "brief" | "checking" | "blocked" | "outline_wait" | "outline" | "generating" | "moderation" | "review" | "media" | "stopped";

export type StatusSnapshot = { outline: OutlineProgressDto | null; generation: ContentGenerationProgressDto | null; story?:StoryDto; input?:AIStoryInputProgressDto; media?:MediaProgressDto };

/** Đọc cả hai endpoint tiến trình; thành công nếu ít nhất một endpoint trả dữ liệu. */
export async function loadSnapshot(id: number, signal: AbortSignal): Promise<ApiResponse<StatusSnapshot>> {
  const [o, g] = await Promise.all([api.getOutline(id, signal), api.getGenerationProgress(id, signal)]);
  const outline = o.success && o.data?.storyId === id ? o.data : null;
  const generation = g.success && g.data?.storyId === id ? g.data : null;
  if (!outline && !generation) return { success: false, status:o.status ?? g.status, data: null, message: o.message || g.message };
  return { success: true, message: "", data: { outline, generation } };
}

export function snapshotStage(snap: StatusSnapshot | null, approvedLocally: boolean): Stage {
  if (!snap) return "outline_wait";
  if (snap.input && ['pending_input','checking_input'].includes(snap.input.inputStatus)) return 'checking';
  if (snap.input && ['input_blocked','input_check_failed'].includes(snap.input.inputStatus)) return 'blocked';
  if (snap.generation?.waitingForModeration) return "moderation";
  const status = normalizeStoryStatus(snap.outline?.storyStatus ?? snap.generation?.storyStatus ?? snap.media?.storyStatus ?? "");
  if (["rejected", "archived", "blocked", "safety_review_blocked"].includes(status)) return "stopped";
  // Luồng 2 mục 3.4 — truyện vùng xám chờ Moderator, thường trong 24 giờ.
  if (status === "moderation_review") return "moderation";
  if (["approved", "media_processing", "media_review", "ready"].includes(status)) return "media";
  if (status !== 'content_review' && outlineJobRunning(snap)) return 'outline_wait';
  if (/^(pending|generating)_/.test(snap.generation?.currentStep ?? '')) return 'generating';
  if (status === "content_review") return "review";
  if (status === "outline_review") {
    if (snap.outline?.currentVersion?.outlineApprovedAt || approvedLocally) return "generating";
    return snap.outline && outlineReady(snap.outline) ? "outline" : "outline_wait";
  }
  return "outline_wait";
}

export const keepPolling = (stage: Stage) => stage === "outline_wait" || stage === "generating" || stage === 'checking';

export function outlineJobRunning(snap: StatusSnapshot): boolean {
  return ['pending','processing'].includes(normalizeStoryStatus(snap.outline?.activeJobStatus ?? '')) &&
    ['generate_outline','regenerate_outline'].includes(normalizeStoryStatus(snap.outline?.activeOperation ?? ''));
}

/** Only a terminal failure in the current phase can stop the UI. Historical error text is insufficient. */
export function pipelineFailure(snap: StatusSnapshot | null, stage: Stage): {kind:'outline'|'generation';code:string} | null {
  if (!snap) return null;
  if (stage === 'outline_wait' || stage === 'outline') {
    if (outlineJobRunning(snap) || snap.outline?.currentVersion?.outlineApprovedAt) return null;
    return snap.outline?.lastErrorCode ? {kind:'outline',code:snap.outline.lastErrorCode} : null;
  }
  if (stage === 'generating' && !snap.generation?.waitingForModeration && !snap.generation?.isComplete &&
      snap.generation?.currentStep?.startsWith('failed_')) {
    return {kind:'generation',code:snap.generation.lastErrorCode ?? 'CONTENT_GENERATION_FAILED'};
  }
  return null;
}

export const keepSnapshotPolling = (snap:StatusSnapshot, approvedLocally=false) => {
  const stage=snapshotStage(snap,approvedLocally);
  return keepPolling(stage) && !pipelineFailure(snap,stage);
};
