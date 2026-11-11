import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { authService } from '@/app/services/authService';
import { staffService } from '@/app/services/staffService';
import {
  COMMUNITY_SUBMISSION_SECTIONS,
  PUBLIC_STORY_SECTIONS,
  claimOwnershipBadge,
  moderationStatusLabel,
} from '@/app/features/staff/moderationConfig';
import {
  ModerationWorkspaceShell,
  QueueItemRow,
  QueueSummaryCard,
} from '@/app/features/staff/ModerationQueuePrimitives';
import {
  buildModerationQueueQuery,
  resolvePostClaimSelection,
} from '@/app/features/staff/useModerationSectionQueue';
import { publicBlockerAnchor } from '@/app/features/staff/PublicStoryReviewPanel';
import { queueSourceLabel, reviewPackageTitle } from '@/app/features/staff/moderationQueueDisplay';
import { ReviewPanelHeader } from '@/app/features/staff/ReviewPanelHeader';
import type { QueueItem } from '@/app/types/staff';
import type { ReviewPackage } from '@/app/services/moderationService';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const creatorClaimedMine: QueueItem = {
  id: 101,
  itemType: 'PublicStoryReview',
  status: 'Claimed',
  priority: 'High',
  storyId: 44,
  storyTitle: 'Chiếc Lá Đầu Tiên',
  storyVersionId: 999,
  contentReportId: null,
  readingRoadmapId: null,
  createdByUserId: 13,
  createdByName: 'Lê Thị Mai',
  isResubmission: true,
  slaDueAt: '2099-01-01T12:00:00Z',
  isOverdue: false,
  claimedByUserId: 5,
  claimedByName: 'Mod A',
  claimedAt: '2026-11-11T09:00:00Z',
  claimExpiresAt: '2026-11-11T11:00:00Z',
  createdAt: '2026-11-10T07:15:00Z',
};

const communityClaimedOther: QueueItem = {
  id: 202,
  itemType: 'CommunitySubmission',
  status: 'Claimed',
  priority: 'Medium',
  storyId: 88,
  storyTitle: 'Buổi Sáng Của Mèo Con',
  storyVersionId: 555,
  contentReportId: null,
  readingRoadmapId: null,
  createdByUserId: null,
  createdByName: null,
  isResubmission: false,
  slaDueAt: '2099-01-01T12:00:00Z',
  isOverdue: false,
  claimedByUserId: 9,
  claimedByName: 'Mod B',
  claimedAt: '2026-11-11T09:00:00Z',
  claimExpiresAt: '2026-11-11T11:00:00Z',
  createdAt: '2026-11-10T08:00:00Z',
};

describe('Moderator workspaces (specs 00-03 & 12)', () => {
  it('maps status labels per itemType instead of sharing a single Approved label', () => {
    expect(moderationStatusLabel('PublicStoryReview', 'Approved')).toBe('Đã duyệt');
    expect(moderationStatusLabel('CommunitySubmission', 'Approved')).toBe('Đã duyệt chia sẻ');
    expect(moderationStatusLabel('PublicStoryRemoval', 'Approved')).toBe('Đã chấp thuận gỡ');
    expect(moderationStatusLabel('CommunitySubmission', 'Removed')).toBe('Đã gỡ chia sẻ');
    expect(moderationStatusLabel('GrayZoneStory', 'Cleared')).toBe('Đã cho phép tiếp tục');
    expect(PUBLIC_STORY_SECTIONS.map(s => s.status)).toEqual([
      'Pending', 'Claimed', 'ChangesRequested', 'Approved', 'Rejected', 'Withdrawn', 'Closed',
    ]);
    expect(COMMUNITY_SUBMISSION_SECTIONS.map(s => s.status)).toEqual([
      'Pending', 'Claimed', 'Approved', 'Rejected', 'Withdrawn', 'Removed', 'Closed',
    ]);
  });

  it('builds single-type, single-status queue requests without future proposal params and forwards AbortSignal', async () => {
    const query = buildModerationQueueQuery({
      itemType: 'CommunitySubmission',
      status: 'Approved',
      priority: 'High',
      onlyOverdue: false,
      pageIndex: 2,
      pageSize: 10,
    });
    expect(query).toEqual({
      itemType: 'CommunitySubmission',
      status: 'Approved',
      priority: 'High',
      pageIndex: 2,
      pageSize: 10,
    });
    expect('assignment' in query).toBe(false);
    expect('statuses' in query).toBe(false);

    vi.spyOn(authService, 'getStoredAccessToken').mockReturnValue('mod-token');
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      message: '',
      data: { items: [], totalCount: 0, totalPages: 0, pageIndex: 2, pageSize: 10, hasNextPage: false, hasPreviousPage: true },
    })));
    vi.stubGlobal('fetch', fetcher);

    const controller = new AbortController();
    await staffService.queue(query, controller.signal);
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      pageSize: '10',
      itemType: 'CommunitySubmission',
      status: 'Approved',
      priority: 'High',
      pageIndex: '2',
    });
    expect(fetcher.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it('renders Claimed ownership badges while keeping both own and others cards in Claimed', () => {
    expect(claimOwnershipBadge(creatorClaimedMine, 5)).toEqual({ mine: true, label: 'Bạn đang giữ', tone: 'ok' });
    expect(claimOwnershipBadge(communityClaimedOther, 5)).toEqual({ mine: false, label: 'Người khác đang giữ (Mod B)', tone: 'wait' });
    expect(claimOwnershipBadge({ ...creatorClaimedMine, status: 'Pending' }, 5)).toBeNull();

    const html = renderToStaticMarkup(
      <ModerationWorkspaceShell
        title="Duyệt truyện Creator"
        description="Mô tả"
        sections={PUBLIC_STORY_SECTIONS}
        status="Claimed"
        onStatusChange={() => {}}
        priority=""
        onPriorityChange={() => {}}
        onlyOverdue={false}
        onOnlyOverdueChange={() => {}}
        items={[creatorClaimedMine, { ...creatorClaimedMine, id: 102, claimedByUserId: 9, claimedByName: 'Mod B' }]}
        selectedId={null}
        onSelect={() => {}}
        currentUserId={5}
        loading={false}
        error=""
        actionNote={null}
        totalCount={12}
        pageIndex={1}
        totalPages={2}
        hasNextPage
        onPageChange={() => {}}
        onReload={() => {}}
        detail={null}
      />,
    );
    expect(html).toContain('Bạn đang giữ');
    expect(html).toContain('Người khác đang giữ (Mod B)');
    expect(html).toContain('12 hồ sơ · Trang 1/2');
  });

  it('selects post-claim card only if present in the first Claimed page without scanning pages', () => {
    expect(resolvePostClaimSelection([{ id: 101 }, { id: 102 }], 101)).toBe(101);
    expect(resolvePostClaimSelection([{ id: 102 }], 101)).toBeNull();
    expect(resolvePostClaimSelection([{ id: 102 }], null)).toBeNull();
  });

  it('renders CommunitySubmission rows and summaries anonymously as Gia đình chia sẻ without leaking identity or faking versionNo', () => {
    expect(queueSourceLabel(communityClaimedOther)).toBe('Gia đình chia sẻ');
    const rowHtml = renderToStaticMarkup(
      <QueueItemRow item={communityClaimedOther} selected={false} me={5} onSelect={() => {}} />,
    );
    expect(rowHtml).toContain('Gia đình chia sẻ');
    expect(rowHtml).toContain('Buổi Sáng Của Mèo Con');
    expect(rowHtml).not.toContain('Tác giả gửi duyệt');
    expect(rowHtml).not.toContain('555');

    const terminalCommunity: QueueItem = {
      ...communityClaimedOther,
      status: 'Approved',
      claimedByUserId: 9,
      claimedByName: 'Mod B',
    };
    const summaryHtml = renderToStaticMarkup(
      <QueueSummaryCard item={terminalCommunity} me={5} busy={false} />,
    );
    expect(summaryHtml).toContain('Đã duyệt chia sẻ');
    expect(summaryHtml).toContain('API hiện tại chỉ trả thông tin tóm tắt của hàng đợi');
    expect(summaryHtml).not.toContain('Nhận xử lý');
    expect(summaryHtml).not.toContain('555');

    const pkg = {
      kind: 'CommunitySubmission',
      data: {
        itemId: 202,
        claimExpiresAt: '2026-11-11T11:00:00Z',
        story: { storyId: 88, title: 'Buổi Sáng Của Mèo Con' },
        version: { versionId: 555, versionNo: 2, title: 'Buổi Sáng Của Mèo Con (Sửa)' },
      },
    } as unknown as ReviewPackage;
    expect(reviewPackageTitle(pkg)).toBe('Buổi Sáng Của Mèo Con (Sửa)');
    const headerHtml = renderToStaticMarkup(
      <ReviewPanelHeader item={pkg} queueItem={communityClaimedOther} message="" sourceTag="Gia đình chia sẻ" />,
    );
    expect(headerHtml).toContain('Gia đình chia sẻ');
    expect(headerHtml).not.toContain('Tác giả gửi duyệt');
  });

  it('maps PublicStoryReview blocker codes to anchored DOM section IDs', () => {
    expect(publicBlockerAnchor('views_incomplete').id).toBe('creator-sec-media');
    expect(publicBlockerAnchor('checklist_incomplete').id).toBe('creator-sec-checklist');
    expect(publicBlockerAnchor('flags_unresolved').id).toBe('creator-sec-ai');
    expect(publicBlockerAnchor('no_labels').id).toBe('creator-sec-labels');
  });

  it('wires Moderator menu routes cleanly without future backlog endpoints after retiring OtherModerationQueue', () => {
    const staffAppSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/StaffApp.tsx'), 'utf8');
    expect(staffAppSrc).toContain('id: "queue"');
    expect(staffAppSrc).not.toContain('id: "shared-review"');
    expect(staffAppSrc).not.toContain('Truyện chia sẻ');
    expect(staffAppSrc).toContain('id: "published"');
    expect(staffAppSrc).not.toContain('id: "other-queue"');
    expect(staffAppSrc).toContain('Duyệt truyện');

    const modSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/Moderation.tsx'), 'utf8');
    expect(modSrc).not.toContain('OtherModerationQueue');

    for (const file of [
      'app/services/staffService.ts',
      'app/services/moderationService.ts',
      'app/features/staff/CreatorStoryReviewWorkspace.tsx',
      'app/features/staff/SharedStoryReviewWorkspace.tsx',
      'app/features/staff/PublishedReviewWorkspace.tsx',
    ]) {
      const text = readFileSync(path.resolve(process.cwd(), file), 'utf8');
      expect(text, file).not.toMatch(/\/history|escalation-summary|removed-stories|community-library|assignment=|statuses=/);
    }
  });
});
