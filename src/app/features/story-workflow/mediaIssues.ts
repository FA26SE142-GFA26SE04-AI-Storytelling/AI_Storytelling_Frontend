import type { MediaGenerationIssue, MediaProgressDto, StoryMediaPackage } from '@/app/types/aiStory';

/** Prefer task diagnostics. Older APIs can locate failed assets, but cannot report their exact error. */
export function mediaIssuesOf(progress: MediaProgressDto | null, pack: StoryMediaPackage | null): MediaGenerationIssue[] {
  if (progress?.isReady || progress?.isGenerated) return [];
  if (progress?.issues) return progress.issues;
  if (!progress || !pack || pack.storyId !== progress.storyId || pack.storyVersionId !== progress.approvedStoryVersionId ||
      pack.packageRevision !== progress.packageRevision) return [];
  return pack.scenes.flatMap(scene => [
    ...scene.illustrations.slice().sort((a, b) => a.beatOrder - b.beatOrder).flatMap((image, index) =>
      image.assetId != null && ['Failed', 'ManualReview'].includes(image.status) ? [{
        sceneId: scene.sceneId, sceneIndex: scene.sceneIndex, assetId: image.assetId, type: 'Illustration', targetId: image.beatId,
        itemNumber: index + 1, status: image.status, errorCode: 'MEDIA_ITEM_INCOMPLETE', attemptCount: 0, nextRetryAt: null,
      }] : []),
    ...(scene.audio ?? []).slice().sort((a, b) => a.segmentOrder - b.segmentOrder).flatMap((audio, index) =>
      audio.assetId != null && ['Failed', 'ManualReview'].includes(audio.status) ? [{
        sceneId: scene.sceneId, sceneIndex: scene.sceneIndex, assetId: audio.assetId, type: 'TtsAudio', targetId: audio.segmentId,
        itemNumber: index + 1, status: audio.status, errorCode: 'MEDIA_ITEM_INCOMPLETE', attemptCount: 0, nextRetryAt: null,
      }] : []),
  ]);
}

export const mediaIssueLabel = (issue: MediaGenerationIssue): string =>
  `Cảnh ${issue.sceneIndex + 1} · ${issue.type === 'Illustration' ? 'Tranh' : 'Giọng đọc đoạn'} ${issue.itemNumber}`;

export function mediaIssueMessage(issue: MediaGenerationIssue): string {
  if (issue.status === 'Processing') return 'Đang xử lý lại mục này.';
  if (issue.status === 'Pending') return 'Đang chờ hệ thống tự thử lại.';
  if (issue.status === 'ManualReview') return 'Cần xem lại chất lượng trước khi sử dụng.';
  if (issue.errorCode === 'MEDIA_PROVIDER_TIMEOUT') return 'Xử lý quá thời gian chờ.';
  if (issue.errorCode.endsWith('_HTTP_429')) return 'Dịch vụ AI đang giới hạn lượt yêu cầu.';
  if (issue.errorCode === 'MEDIA_ITEM_INCOMPLETE') return 'Mục này chưa hoàn thành; API hiện chưa cung cấp nguyên nhân riêng.';
  return 'Chưa xử lý thành công mục này.';
}
