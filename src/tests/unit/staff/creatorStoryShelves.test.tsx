import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CreatorDraft } from '@/app/types/creator';
import {
  CREATOR_SHELVES,
  creatorShelfOf,
  currentCreatorPublication,
  groupCreatorStories,
  resolveStoryDisplayState,
} from '@/app/features/staff/creatorStoryShelves';
import { CreatorStoryCard, CreatorStoryDetailMeta } from '@/app/features/staff/CreatorMyStories';

const baseDraft = (over: Partial<CreatorDraft>): CreatorDraft => ({
  storyId: 44,
  authorUserId: 7,
  title: 'Mái Nhà Ấm Áp Sau Cơn Mưa',
  description: 'Mô tả truyện',
  language: 'vi',
  ageBand: '9-10',
  genre: 'Đời sống hằng ngày',
  experienceMode: 'reading',
  audienceRevision: 1,
  revisionToken: 'tok-1',
  selectedVersionId: 440,
  lastVersionNo: 4,
  coverImageUrl: null,
  createdAt: '2026-11-03T12:38:00Z',
  updatedAt: '2026-11-10T13:46:00Z',
  source: 'Ai',
  status: 'Ready',
  isPublished: false,
  reviewStatus: 'None',
  ...over,
});

describe('publication snapshot after reloading Creator stories', () => {
  const pending = {
    storyId: 44, versionId: 440, isPublished: false, reviewStatus: 'Pending',
    openItemId: 91, openItemType: 'PublicStoryReview', openItemStatus: 'Pending',
  };

  it.each([
    ['Approved', true, 'published'],
    ['Rejected', false, 'rejected'],
    ['ChangesRequested', false, 'changes_requested'],
  ] as const)('uses refreshed list when Moderator returns %s instead of the cached Pending snapshot', (reviewStatus, isPublished, shelfId) => {
    const oldList = [baseDraft({ reviewStatus: 'Pending' })];
    const snapshot = { list: oldList, revision: 0, data: pending };
    expect(currentCreatorPublication(snapshot, oldList, 44, 0)).toBe(pending);

    const refreshedList = [baseDraft({ reviewStatus, isPublished })];
    // Also rejects a late response belonging to the old list, before effect cleanup runs.
    const pub = currentCreatorPublication(snapshot, refreshedList, 44, 0);
    expect(pub).toBeNull();
    const story = resolveStoryDisplayState(refreshedList[0], pub);
    expect(groupCreatorStories([story])[0].id).toBe(shelfId);
    const html = renderToStaticMarkup(<CreatorStoryDetailMeta story={story} pub={pub} />);
    expect(html).not.toContain('Đang chờ Moderator duyệt');
    expect(html).toContain(isPublished ? 'Đã công khai' : 'Chưa công khai');
  });

  it('accepts a new snapshot for the refreshed list and ignores a different selection or revision', () => {
    const list = [baseDraft({ reviewStatus: 'Pending' })];
    const data = { ...pending, reviewStatus: 'Approved', isPublished: true, openItemId: null };
    const snapshot = { list, revision: 1, data };
    expect(currentCreatorPublication(snapshot, list, 44, 1)).toBe(data);
    expect(creatorShelfOf(resolveStoryDisplayState(list[0], data)).id).toBe('published');
    expect(currentCreatorPublication(snapshot, list, 45, 1)).toBeNull();
    expect(currentCreatorPublication(snapshot, list, 44, 2)).toBeNull();
    // If fetching /publication fails after reload, list state remains the source for rendering.
    expect(currentCreatorPublication(null, list, 44, 1)).toBeNull();
  });
});

describe('creatorStoryShelves (Kiểu A)', () => {
  it('đưa truyện Ready nhưng bị Moderator từ chối (ReviewStatus = Rejected) vào section riêng Bị từ chối thay vì Sẵn sàng', () => {
    const rejectedReady = baseDraft({ storyId: 44, status: 'Ready', isPublished: false, reviewStatus: 'Rejected' });
    const rejectedStory = baseDraft({ storyId: 45, status: 'Rejected', isPublished: false, reviewStatus: null });
    const shelfA = creatorShelfOf(rejectedReady);
    const shelfB = creatorShelfOf(rejectedStory);

    expect(shelfA.id).toBe('rejected');
    expect(shelfA.title).toBe('Bị từ chối');
    expect(shelfA.tone).toBe('flag');
    expect(shelfB.id).toBe('rejected');
  });

  it('phân loại đúng thứ tự và tách riêng tất cả trạng thái kiểm duyệt & soạn thảo theo Kiểu A', () => {
    const stories: CreatorDraft[] = [
      baseDraft({ storyId: 1, status: 'Ready', isPublished: true, reviewStatus: 'Approved', title: 'Đã công khai' }),
      baseDraft({ storyId: 2, status: 'Ready', isPublished: false, reviewStatus: 'ChangesRequested', title: 'Cần sửa' }),
      baseDraft({ storyId: 3, status: 'Ready', isPublished: false, reviewStatus: 'Pending', title: 'Đang chờ duyệt' }),
      baseDraft({ storyId: 4, status: 'Ready', isPublished: false, reviewStatus: 'None', title: 'Sẵn sàng gửi' }),
      baseDraft({ storyId: 5, status: 'Ready', isPublished: false, reviewStatus: 'Withdrawn', title: 'Đã rút yêu cầu' }),
      baseDraft({ storyId: 6, status: 'Ready', isPublished: false, reviewStatus: 'Approved', title: 'Đã gỡ công khai' }),
      baseDraft({ storyId: 7, status: 'MediaProcessing', isPublished: false, reviewStatus: 'None', title: 'Đang tạo media' }),
      baseDraft({ storyId: 8, status: 'Draft', isPublished: false, reviewStatus: null, title: 'Bản nháp' }),
      baseDraft({ storyId: 9, status: 'Ready', isPublished: false, reviewStatus: 'Rejected', title: 'Mái Nhà Ấm Áp Sau Cơn Mưa' }),
    ];

    const groups = groupCreatorStories(stories);
    expect(groups.map((g) => g.id)).toEqual([
      'published',
      'changes_requested',
      'pending_review',
      'revision_required',
      'ready',
      'review',
      'draft',
      'rejected',
    ]);
    expect(groups.find((g) => g.id === 'published')?.items.map((x) => x.storyId)).toEqual([1]);
    expect(groups.find((g) => g.id === 'changes_requested')?.items.map((x) => x.storyId)).toEqual([2]);
    expect(groups.find((g) => g.id === 'pending_review')?.items.map((x) => x.storyId)).toEqual([3]);
    expect(groups.find((g) => g.id === 'ready')?.items.map((x) => x.storyId)).toEqual([4, 5]);
    expect(groups.find((g) => g.id === 'revision_required')?.items.map((x) => x.storyId)).toEqual([6]);
    expect(groups.find((g) => g.id === 'review')?.items.map((x) => x.storyId)).toEqual([7]);
    expect(groups.find((g) => g.id === 'draft')?.items.map((x) => x.storyId)).toEqual([8]);
    expect(groups.find((g) => g.id === 'rejected')?.items.map((x) => x.storyId)).toEqual([9]);
  });

  it('giữ tương thích khi dữ liệu cũ thiếu isPublished / reviewStatus hoặc khi merge trạng thái publication mới nhất', () => {
    const legacyReady = baseDraft({ status: 'Ready', isPublished: undefined, reviewStatus: undefined });
    expect(creatorShelfOf(legacyReady).id).toBe('ready');

    const staleRejected = baseDraft({ storyId: 44, status: 'Ready', isPublished: false, reviewStatus: 'None' });
    const merged = resolveStoryDisplayState(staleRejected, {
      storyId: 44,
      versionId: 440,
      isPublished: false,
      reviewStatus: 'Rejected',
      openItemId: null,
      openItemType: null,
      openItemStatus: null,
    });
    expect(creatorShelfOf(merged).id).toBe('rejected');
  });

  it('thẻ truyện và chi tiết truyện bị từ chối hiển thị nhãn đỏ Bị từ chối, không hiển thị nhãn Sẵn sàng', () => {
    const rejected = baseDraft({ storyId: 44, status: 'Ready', isPublished: false, reviewStatus: 'Rejected' });
    const cardHtml = renderToStaticMarkup(
      <CreatorStoryCard story={rejected} selected={false} onPick={() => undefined} />,
    );
    expect(cardHtml).toContain('pill flag bk-badge');
    expect(cardHtml).toContain('Bị từ chối');
    expect(cardHtml).not.toContain('>Sẵn sàng<');

    const metaHtml = renderToStaticMarkup(
      <CreatorStoryDetailMeta story={rejected} pub={null} />,
    );
    expect(metaHtml).toContain('Bị từ chối');
    expect(metaHtml).toContain('Chưa công khai');
    expect(metaHtml).not.toContain('>Sẵn sàng<');
    expect(CREATOR_SHELVES.at(-1)?.id).toBe('rejected');
  });
});
