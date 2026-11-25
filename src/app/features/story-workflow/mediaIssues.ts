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

/** Vì sao mục đang chờ thử lại, theo mã lỗi của lần thất bại gần nhất; null khi không có thông tin hữu ích. */
export function mediaIssueReason(errorCode: string): string | null {
  if (errorCode.endsWith('_HTTP_429')) return 'Dịch vụ AI đang giới hạn lượt yêu cầu.';
  if (errorCode === 'MEDIA_PROVIDER_COOLDOWN') return 'Dịch vụ AI đang nghỉ ngắn sau nhiều lần bị giới hạn.';
  if (errorCode === 'MEDIA_PROVIDER_TIMEOUT') return 'Dịch vụ AI phản hồi quá chậm.';
  switch (errorCode) {
    case 'MEDIA_STORAGE_UPLOAD_NOT_CONFIGURED': return 'Kho lưu trữ media chưa được cấu hình.';
    case 'MEDIA_STORAGE_UPLOAD_ACCESS_DENIED': return 'Máy chủ không có quyền ghi vào kho media.';
    case 'MEDIA_STORAGE_UPLOAD_BUCKET_NOT_FOUND': return 'Không tìm thấy kho media đã cấu hình.';
    case 'MEDIA_STORAGE_UPLOAD_RATE_LIMITED': return 'Kho media đang giới hạn lượt tải lên.';
    case 'MEDIA_STORAGE_UPLOAD_TIMEOUT': return 'Tải file lên kho media quá thời gian chờ.';
    case 'MEDIA_STORAGE_UPLOAD_UNAVAILABLE': return 'Kho media tạm thời không phản hồi.';
    case 'MEDIA_STORAGE_UPLOAD_INVALID':
    case 'MEDIA_STORAGE_UPLOAD_REJECTED': return 'Không thể lưu file media vừa tạo.';
    case 'AUDIO_QUALITY_GATE_FAILED': return 'Giọng đọc không đạt kiểm tra chất lượng.';
    case 'TTS_PROVIDER_ACCESS_DENIED': return 'Máy chủ không có quyền gọi dịch vụ tạo giọng đọc.';
    case 'TTS_PROVIDER_REJECTED': return 'Dịch vụ tạo giọng đọc từ chối yêu cầu.';
    case 'TTS_PROVIDER_UNAVAILABLE': return 'Dịch vụ tạo giọng đọc tạm thời không phản hồi.';
    case 'TTS_GENERATION_FAILED':
    case 'TTS_RETRY_EXHAUSTED': return 'Chưa tạo được giọng đọc.';
    case 'ILLUSTRATION_CONTAINS_TEXT': return 'Tranh AI vẽ có chữ nên không dùng được.';
    case 'ILLUSTRATION_RETRY_EXHAUSTED': return 'AI đã vẽ lại nhiều lần nhưng tranh vẫn chưa đạt.';
    default: return null;
  }
}

/** Mục đã dừng hẳn (hỏng hoặc chờ kiểm tra thủ công): người dùng cần bấm tạo lại, hệ thống không tự thử nữa. */
export const mediaItemStopped = (status: string | null | undefined) => status === 'Failed' || status === 'ManualReview';

export function mediaIssueMessage(issue: MediaGenerationIssue): string {
  if (issue.status === 'Processing') return 'Đang xử lý lại mục này.';
  if (issue.status === 'Pending') return 'Đang chờ hệ thống tự thử lại.';
  if (issue.errorCode === 'MEDIA_PROVIDER_TIMEOUT') return 'Xử lý quá thời gian chờ.';
  const reason = mediaIssueReason(issue.errorCode);
  if (issue.status === 'ManualReview') return reason ? `${reason} Hãy tạo lại mục này.` : 'Cần kiểm tra thủ công trước khi sử dụng.';
  if (reason) return reason;
  if (issue.errorCode === 'MEDIA_MANUAL_REVIEW_REQUIRED') return 'Cần xem lại chất lượng trước khi sử dụng.';
  if (issue.errorCode === 'MEDIA_ITEM_INCOMPLETE') return 'Mục này chưa hoàn thành, hệ thống chưa cho biết lý do.';
  return issue.type === 'Illustration' ? 'Chưa vẽ được tranh này.' : issue.type === 'TtsAudio' ? 'Chưa tạo được giọng đọc đoạn này.' : 'Chưa xử lý thành công mục này.';
}

/** Chuyển đổi danh sách mã lỗi & mục ảnh hưởng thành thông báo thân thiện với người dùng. */
export function friendlyMediaDetails(items: readonly MediaGenerationIssue[]): string {
  const explanations = [...new Set(items.map(item => item.status === 'ManualReview'
    ? mediaIssueMessage(item)
    : (mediaIssueReason(item.errorCode) ?? mediaIssueMessage(item))))];
  const affected = items.map(mediaIssueLabel).join(', ');
  const reasonPart = explanations.join(' ');
  return affected ? `${reasonPart} Các mục bị ảnh hưởng: ${affected}.` : reasonPart;
}
