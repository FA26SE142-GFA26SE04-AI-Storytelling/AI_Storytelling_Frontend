import type { MediaBranchProgress, MediaProgressDto, StoryMediaPackage } from '@/app/types/aiStory';

const terminal = (status?: string) => ['Failed', 'Cancelled'].includes(status ?? '');
export function mediaPackageDisplay(p: MediaProgressDto | null) {
  if (p?.isReady && p.isConfirmed) return { kind: 'ready', label: 'Đã hoàn tất' } as const;
  if (p?.jobStatus === 'Failed' || p?.jobStatus === 'Cancelled') return { kind: 'failed', label: 'Tạo media thất bại' } as const;
  if (p?.isGenerated && p.isAwaitingConfirmation) return { kind: 'confirm', label: 'Chờ bạn xác nhận gói media' } as const;
  if (p?.isAwaitingSelection) return { kind: 'selection', label: 'Chờ chọn nguồn tranh và giọng đọc' } as const;
  if ([p?.audio, p?.images].some(b => b?.nextRetryAt && !terminal(b.status))) return { kind: 'retry', label: 'Chờ thử lại media' } as const;
  if (p?.errorCode || [p?.audio, p?.images].some(b => terminal(b?.status))) return { kind: 'failed', label: 'Tạo media thất bại' } as const;
  if (!p || p.jobStatus === 'NotStarted' || p.jobStatus === 'Pending' && !p.sceneCount) return { kind: 'preparing', label: 'Đang chuẩn bị media' } as const;
  return { kind: 'processing', label: p.isGenerated ? 'Đang chuẩn bị xác nhận gói media' : 'Đang tạo media' } as const;
}

export function audioBranchDisplay(p: MediaProgressDto | null) {
  const b = p?.audio;
  const ready = b?.readyCount ?? p?.readyAudio ?? 0;
  const required = b?.requiredCount ?? (p?.missingAudioSegmentIds ? ready + p.missingAudioSegmentIds.length : 0);
  const done = required > 0 && ready >= required && !terminal(b?.status);
  const label = done ? 'Giọng đọc đã sẵn sàng' : terminal(b?.status) ? 'Tạo giọng đọc thất bại'
    : b?.nextRetryAt ? 'Giọng đọc đang chờ thử lại' : b?.status === 'AwaitingSelection' ? 'Giọng đọc chờ chọn nguồn'
    : b?.status === 'Processing' ? 'Đang tạo giọng đọc' : b?.status === 'Pending' ? 'Giọng đọc đang chờ xử lý' : 'Đang chuẩn bị giọng đọc';
  return { done, label, detail: required > 0 ? `${ready}/${required} đoạn` : 'Chưa xác định số đoạn', errorCode: b?.errorCode, nextRetryAt: b?.nextRetryAt };
}

export const mediaBranchError = (p: MediaProgressDto | null) => p?.errorCode ?? p?.audio?.errorCode ?? p?.images?.errorCode;
export const mediaBranchChanged = (b?: MediaBranchProgress) => b ? `${b.status}:${b.readyCount}:${b.requiredCount}:${b.errorCode}:${b.nextRetryAt}` : '';
export function completionState(pack: StoryMediaPackage | null, progress: MediaProgressDto | null) {
  const matched = !!pack && !!progress && pack.storyId === progress.storyId && pack.storyVersionId === progress.approvedStoryVersionId && pack.packageRevision === progress.packageRevision;
  return {
    ready: matched && pack.isConfirmed && pack.isReady && progress.isConfirmed && progress.isReady,
    canConfirm: matched && pack.packageRevision > 0 && pack.isGenerated && pack.isAwaitingConfirmation && !pack.isConfirmed &&
      progress.isGenerated && progress.isAwaitingConfirmation && !progress.isConfirmed && mediaPackageDisplay(progress).kind === 'confirm',
  };
}
