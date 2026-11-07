import type { RegenerateMediaRequest, StoryMediaPackage, MediaProgressDto } from '@/app/types/aiStory';
export function mediaMutationSnapshot(pack: StoryMediaPackage, versionId?: number | null): Omit<RegenerateMediaRequest,'operationId'> | null {
  if (!Number.isInteger(pack.storyVersionId) || pack.storyVersionId < 1 ||
      !Number.isInteger(pack.packageRevision) || pack.packageRevision < 0 ||
      typeof pack.isConfirmed !== 'boolean' || versionId != null && pack.storyVersionId !== versionId) return null;
  return { storyVersionId:pack.storyVersionId, packageRevision:pack.packageRevision, expectedConfirmed:pack.isConfirmed };
}
/** Hệ thống còn đang tạo media, kể cả khi có lỗi tạm thời (vd. bị giới hạn lượt) đang chờ tự thử lại. */
export const mediaIsGenerating = (p: MediaProgressDto) => !p.isReady && !p.isAwaitingConfirmation && ['Pending', 'Processing'].includes(p.jobStatus);
/** Chỉ khi việc tạo media đã dừng vì lỗi mới cần người dùng bấm Thử lại; đang tự thử lại thì không. */
export const mediaCanRetry = (p: MediaProgressDto) => !!p.errorCode && !mediaIsGenerating(p);
/** Tiếp tục hỏi trạng thái khi còn đang tạo, hoặc chưa có kết luận và chưa có lỗi. */
export const mediaKeepPolling = (p: MediaProgressDto) => !p.isReady && !p.isAwaitingConfirmation && (mediaIsGenerating(p) || !p.errorCode) && !['Failed', 'Cancelled'].includes(p.jobStatus);
export const mediaNeedsPolling = (p: MediaProgressDto) => !p.isReady && !p.isAwaitingConfirmation && !p.errorCode && !['Failed','Cancelled'].includes(p.jobStatus);
