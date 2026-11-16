import { ContentGenerationProgressDto, OutlineProgressDto } from '@/app/types/aiStory';

export function providerFailureMessage(code?: string | null): string | null {
  if (code === 'AI_PROVIDER_ACCESS_DENIED')
    return 'Nhà cung cấp AI từ chối truy cập. Quản trị viên cần kiểm tra quyền truy cập và thông báo của Google trước khi bạn thử lại.';
  if (code === 'AI_PROVIDER_CONFIGURATION_REJECTED')
    return 'Nhà cung cấp AI từ chối cấu hình yêu cầu. Vui lòng liên hệ quản trị viên trước khi thử lại.';
  return null;
}

export function normalizeStoryStatus(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

export function isMediaStage(status: string): boolean {
  return ['approved', 'media_processing', 'media_review', 'ready'].includes(normalizeStoryStatus(status));
}

export function contentDestination(progress: ContentGenerationProgressDto): 'media' | 'review' | 'waiting' | 'stopped' {
  const status = normalizeStoryStatus(progress.storyStatus);
  if (isMediaStage(status)) return 'media';
  if (['rejected', 'archived'].includes(status)) return 'stopped';
  if (status === 'content_review' && progress.isComplete) return 'review';
  return 'waiting';
}

export function generationDisplayPhase(progress: ContentGenerationProgressDto | null): 'content' | 'learning' {
  // A candidate or a completed AI call is not enough: the backend must promote stable content.
  return progress?.outputMode !== 'reading_media_only' && progress?.content === 'stable' && typeof progress.stableStoryVersionId === 'number' && progress.stableStoryVersionId > 0
    ? 'learning'
    : 'content';
}

export function outlineReady(progress: OutlineProgressDto, previousVersion?: number): boolean {
  return normalizeStoryStatus(progress.storyStatus) === 'outline_review' &&
    !!progress.currentVersion?.isCurrent && !progress.activeOperation &&
    !progress.currentVersion.outlineApprovedAt &&
    (previousVersion === undefined || progress.currentVersion.versionNo > previousVersion);
}
