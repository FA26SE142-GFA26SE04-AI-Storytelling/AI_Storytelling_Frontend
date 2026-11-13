import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { creatorPublicationState } from '@/app/features/staff/creatorPublicationState';
import { creatorShelfOf, resolveStoryDisplayState } from '@/app/features/staff/creatorStoryShelves';
import { CreatorStoryCard, CreatorStoryDetailMeta } from '@/app/features/staff/CreatorMyStories';
import { notificationText } from '@/app/lib/notifications';
import type { CreatorDraft } from '@/app/types/creator';
import type { AppNotification } from '@/app/types/progress';

const story: CreatorDraft = { storyId: 44, authorUserId: 1, title: 'Mái Nhà Ấm Áp Sau Cơn Mưa',
  description: '', language: 'vi', ageBand: '9-10', genre: '', experienceMode: 'reading', audienceRevision: 1,
  revisionToken: 'revision', selectedVersionId: 101, lastVersionNo: 5, createdAt: '2026-11-11', updatedAt: null,
  status: 'Ready', isPublished: false, reviewStatus: 'Approved' };

describe('Creator publication lifecycle', () => {
  it('keeps an approved unpublished version out of the ready shelf and explains the next action', () => {
    expect(creatorShelfOf(story).id).toBe('revision_required');
    expect(creatorPublicationState(story)?.kind).toBe('revision');
    const card = renderToStaticMarkup(<CreatorStoryCard story={story} selected={false} onPick={() => {}} />);
    const detail = renderToStaticMarkup(<CreatorStoryDetailMeta story={story} pub={null} />);
    expect(card).toContain('Cần bản chỉnh sửa');
    expect(card).not.toContain('Sẵn sàng gửi');
    expect(detail).toContain('Đã duyệt, hiện chưa công khai');
    expect(detail).toContain('hãy tạo bản chỉnh sửa mới');
  });

  it.each(['Pending', 'Claimed'] as const)('shows removal %s while retaining the published shelf', openItemStatus => {
    const s = { ...story, isPublished: true, openItemType: 'PublicStoryRemoval', openItemStatus };
    expect(creatorShelfOf(s).id).toBe('published');
    const state = creatorPublicationState(s)!;
    expect(state.kind).toBe(openItemStatus === 'Pending' ? 'removal_pending' : 'removal_claimed');
    const html = renderToStaticMarkup(<CreatorStoryCard story={s} selected={false} onPick={() => {}} />);
    expect(html).toContain(state.label);
  });

  it('separates a received review from a pending review using the latest publication response', () => {
    const waiting = { ...story, reviewStatus: 'Pending', openItemType: 'PublicStoryReview', openItemStatus: 'Pending' };
    expect(creatorShelfOf(waiting).id).toBe('pending_review');
    const claimed = resolveStoryDisplayState(waiting, { storyId: 44, versionId: 101, isPublished: false,
      reviewStatus: 'Pending', openItemId: 25, openItemType: 'PublicStoryReview', openItemStatus: 'Claimed' });
    expect(creatorShelfOf(claimed).id).toBe('claimed_review');
    expect(creatorPublicationState(claimed)?.hint).toContain('chưa thể rút');
  });

  it('clears the old open item after withdrawal and allows the normal ready shelf for a fresh revision', () => {
    const claimed = { ...story, reviewStatus: 'Pending', openItemId: 25, openItemType: 'PublicStoryReview', openItemStatus: 'Claimed' };
    const withdrawn = resolveStoryDisplayState(claimed, { storyId: 44, versionId: 101, isPublished: false,
      reviewStatus: 'None', openItemId: null, openItemType: null, openItemStatus: null });
    expect(creatorShelfOf(withdrawn).id).toBe('ready');
    expect(creatorPublicationState(withdrawn)).toBeNull();
    expect(creatorShelfOf({ ...story, reviewStatus: 'None' }).id).toBe('ready');
    expect(creatorShelfOf({ ...story, isPublished: true }).id).toBe('published');
    expect(creatorShelfOf({ ...story, reviewStatus: 'ChangesRequested' }).id).toBe('changes_requested');
  });

  it.each(['approved', 'rejected'])('labels a removal notification as %s rather than a publication decision', decision => {
    const n = { type: 'ContentModerationResult', payload: JSON.stringify({ itemType: 'PublicStoryRemoval', storyTitle: story.title, decision }) } as AppNotification;
    expect(notificationText(n)).toContain('Yêu cầu gỡ truyện');
    expect(notificationText(n)).toContain(decision === 'approved' ? 'chấp thuận' : 'từ chối');
    expect(notificationText({ ...n, payload: '{broken' })).toBe('Nội dung đã được kiểm duyệt');
    expect(notificationText({ ...n, payload: '{"itemType":"PublicStoryReview","decision":"approved"}' })).toBe('Nội dung đã được kiểm duyệt');
  });
});
