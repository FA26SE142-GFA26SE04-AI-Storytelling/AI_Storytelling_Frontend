import type { CreatorDraft, CreatorPublication } from '@/app/types/creator';
import type { CreatorPublicationStatus } from '@/app/types/backendContracts';

export interface CreatorPublicationSnapshot {
  list: CreatorDraft[] | null;
  revision: number;
  data: CreatorPublicationStatus;
}

/** A publication response belongs only to the list and selection it was fetched for. */
export function currentCreatorPublication(
  snapshot: CreatorPublicationSnapshot | null,
  list: CreatorDraft[] | null,
  selected: number | null,
  revision: number,
): CreatorPublicationStatus | null {
  return snapshot?.list === list && snapshot.revision === revision && snapshot.data.storyId === selected
    && snapshot.data.versionId === list?.find(s => s.storyId === selected)?.selectedVersionId
    ? snapshot.data : null;
}

export type CreatorShelfId =
  | 'published'
  | 'changes_requested'
  | 'pending_review'
  | 'claimed_review'
  | 'revision_required'
  | 'ready'
  | 'review'
  | 'draft'
  | 'rejected';

export type CreatorPillTone = 'ok' | 'wait' | 'draft' | 'flag';

export interface CreatorShelfMeta {
  id: CreatorShelfId;
  title: string;
  badge: string;
  tone: CreatorPillTone;
}

/** Thứ tự kệ Kiểu A trên "Truyện của tôi": tách rõ phần kiểm duyệt công khai và mục Bị từ chối riêng. */
export const CREATOR_SHELVES: CreatorShelfMeta[] = [
  { id: 'published', title: 'Đã công khai', badge: 'Đã công khai', tone: 'ok' },
  { id: 'changes_requested', title: 'Moderator yêu cầu sửa', badge: 'Yêu cầu sửa', tone: 'wait' },
  { id: 'pending_review', title: 'Chờ Moderator tiếp nhận', badge: 'Chờ tiếp nhận', tone: 'wait' },
  { id: 'claimed_review', title: 'Moderator đang xử lý', badge: 'Đang xử lý', tone: 'wait' },
  { id: 'revision_required', title: 'Cần tạo bản chỉnh sửa', badge: 'Cần bản chỉnh sửa', tone: 'draft' },
  { id: 'ready', title: 'Sẵn sàng gửi duyệt', badge: 'Sẵn sàng gửi', tone: 'draft' },
  { id: 'review', title: 'Đang chuẩn bị', badge: 'Đang chuẩn bị', tone: 'wait' },
  { id: 'draft', title: 'Đang soạn', badge: 'Đang soạn', tone: 'draft' },
  { id: 'rejected', title: 'Bị từ chối', badge: 'Bị từ chối', tone: 'flag' },
];

const SHELF_BY_ID = new Map<CreatorShelfId, CreatorShelfMeta>(
  CREATOR_SHELVES.map((shelf) => [shelf.id, shelf]),
);

const PREPARING_STATUSES = new Set([
  'inputaccepted',
  'generating',
  'outlinereview',
  'moderationreview',
  'contentreview',
  'approved',
  'mediaprocessing',
  'mediareview',
]);

const normalizeKey = (raw: string | null | undefined): string =>
  (raw ?? '').toLowerCase().replace(/[^a-z]/g, '');

/** Hợp nhất trạng thái mới nhất từ /publication khi khớp storyId đang xem. */
export function resolveStoryDisplayState(
  story: CreatorDraft,
  publication: CreatorPublication | null | undefined,
): CreatorDraft {
  if (!publication || publication.storyId !== story.storyId || publication.versionId !== story.selectedVersionId) return story;
  return {
    ...story,
    isPublished: publication.isPublished,
    reviewStatus: publication.reviewStatus,
    openItemId: publication.openItemId,
    openItemType: publication.openItemType,
    openItemStatus: publication.openItemStatus,
  };
}

/** Phân loại mỗi truyện vào đúng 1 section theo trạng thái biên soạn + kiểm duyệt công khai. */
export function creatorShelfOf(
  story: Pick<CreatorDraft, 'status' | 'isPublished' | 'reviewStatus' | 'openItemType' | 'openItemStatus'>,
): CreatorShelfMeta {
  const status = normalizeKey(story.status) || 'draft';
  const review = normalizeKey(story.reviewStatus);

  if (status === 'rejected' || review === 'rejected') {
    return SHELF_BY_ID.get('rejected')!;
  }
  if (story.isPublished === true) {
    return SHELF_BY_ID.get('published')!;
  }
  if (review === 'changesrequested') {
    return SHELF_BY_ID.get('changes_requested')!;
  }
  if (review === 'pending') {
    if (story.openItemType === 'PublicStoryReview' && story.openItemStatus === 'Claimed') return SHELF_BY_ID.get('claimed_review')!;
    return SHELF_BY_ID.get('pending_review')!;
  }
  if (review === 'approved' && story.isPublished === false) return SHELF_BY_ID.get('revision_required')!;
  if (status === 'ready' || status === 'published') {
    return SHELF_BY_ID.get('ready')!;
  }
  if (PREPARING_STATUSES.has(status)) {
    return SHELF_BY_ID.get('review')!;
  }
  return SHELF_BY_ID.get('draft')!;
}

/** Nhóm danh sách truyện theo thứ tự CREATOR_SHELVES, ẩn các nhóm không có truyện. */
export function groupCreatorStories(stories: CreatorDraft[]): Array<CreatorShelfMeta & { items: CreatorDraft[] }> {
  const buckets = new Map<CreatorShelfId, CreatorDraft[]>();
  for (const shelf of CREATOR_SHELVES) buckets.set(shelf.id, []);
  for (const story of stories) {
    buckets.get(creatorShelfOf(story).id)!.push(story);
  }
  return CREATOR_SHELVES
    .map((shelf) => ({ ...shelf, items: buckets.get(shelf.id)! }))
    .filter((group) => group.items.length > 0);
}
