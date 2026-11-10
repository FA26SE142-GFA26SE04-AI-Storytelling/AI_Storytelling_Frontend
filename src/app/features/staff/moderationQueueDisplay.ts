import type { ReviewPackage } from '@/app/services/moderationService';
import type { QueueItem } from '@/app/types/staff';

const MISSING_AUTHOR = 'Chưa có thông tin tác giả';

/** Tên tác phẩm ưu tiên tên phiên bản gửi duyệt; thiếu thì rơi về Truyện #<id> hoặc loại mục. */
export function queueWorkTitle(
  item: Pick<QueueItem, 'storyTitle' | 'storyId' | 'itemType'>,
  typeLabel: string,
): string {
  const title = item.storyTitle?.trim();
  if (title) return title;
  if (item.storyId != null) return `Truyện #${item.storyId}`;
  return typeLabel;
}

/** Chỉ hiển thị người gửi cho PublicStoryReview; không làm lộ danh tính người báo cáo hoặc trẻ em. */
export function queueSubmitterLabel(
  item: Pick<QueueItem, 'itemType' | 'createdByName'>,
): string | null {
  if (item.itemType !== 'PublicStoryReview') return null;
  const name = item.createdByName?.trim() || MISSING_AUTHOR;
  return `Tác giả gửi duyệt: ${name}`;
}

export function formatSubmittedAt(value?: string | null): string {
  const raw = value?.trim();
  if (!raw) return 'Chưa rõ';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'Chưa rõ';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function reviewPackageTitle(
  item: ReviewPackage,
  queueItem?: Pick<QueueItem, 'storyTitle' | 'storyId'>,
): string {
  if (item.kind === 'PublicStoryReview') {
    return (
      item.data.version.title?.trim() ||
      item.data.story.title?.trim() ||
      queueItem?.storyTitle?.trim() ||
      `Truyện #${item.data.storyId}`
    );
  }
  if (item.kind === 'CommunitySubmission' || item.kind === 'ContentReport') {
    return (
      item.data.story.title?.trim() ||
      queueItem?.storyTitle?.trim() ||
      `Truyện #${item.data.story.storyId}`
    );
  }
  if (item.kind === 'RoadmapTemplateReview') {
    return item.data.roadmap.name?.trim() || 'Lộ trình mẫu';
  }
  if (item.kind === 'GrayZoneStory') {
    return (
      item.data.title?.trim() ||
      queueItem?.storyTitle?.trim() ||
      (queueItem?.storyId != null ? `Truyện #${queueItem.storyId}` : `Phiên bản #${item.data.storyVersionId}`)
    );
  }
  return (
    item.data.storyTitle?.trim() ||
    queueItem?.storyTitle?.trim() ||
    (item.data.storyId != null ? `Truyện #${item.data.storyId}` : 'Yêu cầu gỡ truyện')
  );
}

export function reviewPackageSubmitterLabel(
  item: ReviewPackage,
  queueItem?: Pick<QueueItem, 'createdByName'>,
): string | null {
  if (item.kind !== 'PublicStoryReview') return null;
  const name =
    item.data.createdByName?.trim() ||
    queueItem?.createdByName?.trim() ||
    MISSING_AUTHOR;
  return `Tác giả gửi duyệt: ${name}`;
}

export function reviewPackageSubmittedAt(
  item: ReviewPackage,
  queueItem?: Pick<QueueItem, 'createdAt'>,
): string | null {
  if (item.kind === 'PublicStoryReview') {
    return item.data.submittedAt || queueItem?.createdAt || null;
  }
  if (item.kind === 'RoadmapTemplateReview') {
    return item.data.roadmap.submittedAt || queueItem?.createdAt || null;
  }
  if (item.kind === 'ContentReport' || item.kind === 'PublicStoryRemoval') {
    return item.data.createdAt || queueItem?.createdAt || null;
  }
  return queueItem?.createdAt || null;
}
