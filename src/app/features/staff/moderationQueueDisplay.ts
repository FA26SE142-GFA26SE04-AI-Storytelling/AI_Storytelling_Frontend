import type { ReviewPackage } from '@/app/services/moderationService';
import type { QueueItem } from '@/app/types/staff';
import { OPEN_MODERATION_STATUSES } from './moderationConfig';

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

/** Nguồn hiển thị an toàn cho các loại cần phân biệt nguồn mà không lộ danh tính (như CommunitySubmission). */
export function queueSourceLabel(item: Pick<QueueItem, 'itemType'>): string | null {
  if (item.itemType === 'CommunitySubmission') return 'Gia đình chia sẻ';
  return null;
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

export function queueDueInfo(iso: string | null, status: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const span = abs >= 86400000
    ? `${Math.floor(abs / 86400000)} ngày`
    : abs >= 3600000
      ? `${Math.floor(abs / 3600000)} giờ`
      : `${Math.max(1, Math.floor(abs / 60000))} phút`;
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const open = (OPEN_MODERATION_STATUSES as readonly string[]).includes(status);
  return { text: `${time}, ${date}`, late: open && diff < 0, done: !open, span };
}

/** Người đang giữ hoặc người từng nhận gần nhất ở summary (không phải người ra quyết định cuối). */
export function queueHandlerName(
  item: Pick<QueueItem, 'claimedByUserId' | 'claimedByName'>,
  me?: number | null,
  myName?: string,
): string {
  if (item.claimedByUserId == null) return 'Chưa có';
  if (me != null && item.claimedByUserId === me) {
    return `${myName || item.claimedByName || 'Bạn'} (bạn)`;
  }
  return item.claimedByName?.trim() || `Tài khoản #${item.claimedByUserId}`;
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
      item.data.version?.title?.trim() ||
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
