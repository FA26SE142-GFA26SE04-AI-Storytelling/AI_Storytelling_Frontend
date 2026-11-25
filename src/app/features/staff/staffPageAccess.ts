import type { StaffRole } from '@/app/types/auth';

/** Quyền cần để dùng một trang: chuỗi là bắt buộc; mảng con nghĩa là chỉ cần một trong các quyền đó. */
export type PageRequirement = (string | string[])[];

const QUEUE = 'moderation.queue.process';

/** Trang không có ở đây (tổng quan, tài khoản) không cần quyền riêng. Chỉ để ẩn menu; API vẫn tự kiểm quyền. */
export const PAGE_REQUIREMENTS: Record<StaffRole, Record<string, PageRequirement>> = {
  Administrator: {
    events: [['event.approve', 'event.operate']],
    queue: [QUEUE],
    published: ['moderation.published.view'],
    rubrics: ['rubric.manage'],
    'authoring-guides': ['guide.manage'],
    templates: ['template.roadmap.view'],
    'wish-cards': ['wishcard.manage'],
    staff: ['staff.account.manage'],
    permissions: ['permission.manage'],
    creators: [['creator.account.manage', 'creator.application.review', 'creator.payout.manage']],
    audit: ['audit.view'],
    business: ['report.business.view'],
    payments: ['payment.manage'],
    plans: ['payment.manage'],
    quota: ['quota.manage'],
  },
  Moderator: {
    events: [['event.manage', 'event.operate']],
    queue: [QUEUE, 'review.public_story'],
    published: ['moderation.published.view'],
    'removal-records': [QUEUE],
    'gray-zone': [QUEUE, 'review.gray_zone'],
    'content-reports': [QUEUE, 'moderation.report.review'],
    'story-ratings': [QUEUE, 'moderation.rating.moderate'],
    'removal-requests': [QUEUE, 'review.creator_publication'],
    rubrics: ['rubric.manage'],
    'authoring-guides': ['guide.manage'],
    templates: ['template.roadmap.view'],
    'wish-cards': ['wishcard.manage'],
    catalog: ['category.manage'],
    stats: [QUEUE, 'moderation.statistics.view'],
  },
  ContentCreator: {
    // Browsing published events only requires an authenticated session; actions are checked by the API.
    events: [],
    library: ['creator.studio'],
    'create-ai': ['creator.studio'],
    'create-manual': ['creator.studio'],
    'my-stories': ['creator.studio'],
    stats: ['creator.studio'],
  },
};

/** `granted` null: chưa tải được quyền (hoặc backend cũ) thì hiện đủ, để API tự chặn. */
export function canOpenPage(role: StaffRole, pageId: string, granted: { has(code: string): boolean } | null): boolean {
  if (!granted) return true;
  return (PAGE_REQUIREMENTS[role][pageId] ?? []).every((need) =>
    typeof need === 'string' ? granted.has(need) : need.some((code) => granted.has(code)));
}

/** Bỏ mục không dùng được; nhóm không còn mục nào thì bỏ cả nhóm. */
export function visibleNav<G extends { items: string[] }>(entries: (string | G)[], canOpen: (id: string) => boolean): (string | G)[] {
  return entries.flatMap((entry): (string | G)[] => {
    if (typeof entry === 'string') return canOpen(entry) ? [entry] : [];
    const items = entry.items.filter(canOpen);
    return items.length ? [{ ...entry, items }] : [];
  });
}
