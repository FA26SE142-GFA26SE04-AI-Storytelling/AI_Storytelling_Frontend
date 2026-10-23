import type { RegenerateMediaRequest, StoryMediaPackage, MediaProgressDto } from '@/app/types/aiStory';
export function mediaMutationSnapshot(pack: StoryMediaPackage, versionId?: number | null): RegenerateMediaRequest | null {
  if (!Number.isInteger(pack.storyVersionId) || pack.storyVersionId < 1 ||
      !Number.isInteger(pack.packageRevision) || pack.packageRevision < 0 ||
      typeof pack.isConfirmed !== 'boolean' || versionId != null && pack.storyVersionId !== versionId) return null;
  return { storyVersionId:pack.storyVersionId, packageRevision:pack.packageRevision, expectedConfirmed:pack.isConfirmed };
}
export const mediaNeedsPolling = (p: MediaProgressDto) => !p.isReady && !p.isAwaitingConfirmation && !p.errorCode && !['Failed','Cancelled'].includes(p.jobStatus);
