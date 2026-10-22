import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import type { ContentGenerationProgressDto, OutlineProgressDto } from '@/app/types/aiStory';
import type { ApiResponse } from '@/app/types/auth';
import { normalizeStoryStatus, outlineReady } from './storyGenerationFlow';

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
  if (snap.generation?.waitingForModeration) return "moderation";
  const status = normalizeStoryStatus(snap.outline?.storyStatus ?? snap.generation?.storyStatus ?? "");
  if (["rejected", "archived", "blocked", "safety_review_blocked"].includes(status)) return "stopped";
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

export const keepPolling = (stage: Stage) => stage === "outline_wait" || stage === "generating";
