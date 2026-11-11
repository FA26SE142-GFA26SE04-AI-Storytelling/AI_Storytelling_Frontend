import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PublicReviewPackageDto } from '@/app/types/backendContracts';
import type { QueueItem } from '@/app/types/staff';
import type { ReviewPackage } from '@/app/services/moderationService';
import {
  formatSubmittedAt,
  queueSubmitterLabel,
  queueWorkTitle,
  reviewPackageSubmittedAt,
  reviewPackageSubmitterLabel,
  reviewPackageTitle,
} from '@/app/features/staff/moderationQueueDisplay';
import { DetailCard, QueueItemRow } from '@/app/features/staff/ConnectedModerationQueue';
import { ReviewPanelHeader } from '@/app/features/staff/ReviewPanel';

const baseQueueItem: QueueItem = {
  id: 19,
  itemType: 'PublicStoryReview',
  status: 'Pending',
  priority: 'Medium',
  storyId: 44,
  storyTitle: 'Mái Nhà Ấm Áp Sau Cơn Mưa',
  storyVersionId: 100,
  contentReportId: null,
  readingRoadmapId: null,
  createdByUserId: 13,
  createdByName: 'Nguyễn Văn A',
  isResubmission: false,
  slaDueAt: '2099-01-01T12:00:00Z',
  isOverdue: false,
  claimedByUserId: null,
  claimedByName: null,
  claimedAt: null,
  claimExpiresAt: null,
  createdAt: '2026-11-10T07:15:00Z',
};

const basePublicPackage: PublicReviewPackageDto = {
  itemId: 19,
  storyId: 44,
  storyVersionId: 100,
  versionNo: 1,
  isResubmission: false,
  createdByUserId: 13,
  createdByName: 'Nguyễn Văn A',
  submittedAt: '2026-11-10T07:15:00Z',
  proposedLabels: [],
  story: {
    title: 'Tên truyện mới hơn',
    description: null,
    genre: 'Gia đình',
    ageBand: '6-8',
    readingLevel: 1,
    vocabularyLevel: 'Cơ bản',
    language: 'vi',
    moralLesson: null,
    coverImageUrl: null,
    labels: [],
  },
  version: {
    title: 'Mái Nhà Ấm Áp Sau Cơn Mưa',
    outlineOpening: null,
    outlineDevelopment: null,
    outlineEnding: null,
    content: 'Nội dung bản thảo bí mật chỉ thấy sau khi nhận.',
    lesson: null,
  },
  scenes: [],
  vocabulary: [],
  quizzes: [],
  listeningInteractions: [],
  discussionQuestions: [],
  flags: [],
  allFlagsResolved: true,
  progress: {
    totalScenes: 1,
    missingSceneIds: [],
    audioHeardCount: 0,
    missingWarningSegmentIds: [],
    needsAtLeastOneAudio: false,
    requiredViewsComplete: false,
  },
  checklist: {
    safety: null,
    ageFit: null,
    education: null,
    language: null,
    copyright: null,
    image: null,
    audio: null,
    interaction: null,
  },
  approveBlockers: [],
  canApprove: false,
  previousModeratorName: null,
  reviewHistory: [],
};

describe('Moderation queue work title & submitter display', () => {
  it('resolves work title and fallback reliably across queue items and missing data', () => {
    expect(queueWorkTitle(baseQueueItem, 'Duyệt truyện công khai')).toBe('Mái Nhà Ấm Áp Sau Cơn Mưa');
    expect(queueWorkTitle({ ...baseQueueItem, storyTitle: '  ' }, 'Duyệt truyện công khai')).toBe('Truyện #44');
    expect(queueWorkTitle({ ...baseQueueItem, storyTitle: null, storyId: null, itemType: 'RoadmapTemplateReview' }, 'Lộ trình mẫu')).toBe('Lộ trình mẫu');
  });

  it('shows submitter label only for PublicStoryReview with Vietnamese fallback and never for other item types', () => {
    expect(queueSubmitterLabel(baseQueueItem)).toBe('Tác giả gửi duyệt: Nguyễn Văn A');
    expect(queueSubmitterLabel({ ...baseQueueItem, createdByName: '   ' })).toBe('Tác giả gửi duyệt: Chưa có thông tin tác giả');

    for (const itemType of ['ContentReport', 'GrayZoneStory', 'RoadmapTemplateReview', 'CommunitySubmission', 'PublicStoryRemoval'] as const) {
      expect(queueSubmitterLabel({ itemType, createdByName: 'Người Báo Cáo Bí Mật' })).toBeNull();
    }
  });

  it('renders queue list row with work title primary, author secondary, and metadata line', () => {
    const html = renderToStaticMarkup(
      <QueueItemRow item={baseQueueItem} selected={false} me={11} onSelect={() => {}} />
    );

    expect(html).toContain('Mái Nhà Ấm Áp Sau Cơn Mưa');
    expect(html).toContain('Tác giả gửi duyệt: Nguyễn Văn A');
    expect(html).toContain('Truyện công khai');
    expect(html).toContain('Đang chờ');
  });

  it('renders pre-claim DetailCard with title, submitter, submitted timestamp, claim button and zero draft leakage', () => {
    const html = renderToStaticMarkup(
      <DetailCard item={baseQueueItem} me={11} myName="Kiểm duyệt viên" busy={false} onClaim={() => {}} />
    );

    expect(html).toContain('Mái Nhà Ấm Áp Sau Cơn Mưa');
    expect(html).toContain('Tác giả gửi duyệt: Nguyễn Văn A');
    expect(html).toContain('Thời điểm gửi');
    expect(html).toContain(formatSubmittedAt(baseQueueItem.createdAt));
    expect(html).toContain('Nhận xử lý');
    expect(html).not.toContain('Nội dung bản thảo bí mật');
  });

  it('renders missing title and missing author fallbacks without throwing before and after claim', () => {
    const missingItem: QueueItem = {
      ...baseQueueItem,
      storyTitle: null,
      createdByName: null,
      createdAt: 'not-a-date',
    };
    const rowHtml = renderToStaticMarkup(<QueueItemRow item={missingItem} selected={false} me={11} onSelect={() => {}} />);
    const preClaimHtml = renderToStaticMarkup(<DetailCard item={missingItem} me={11} busy={false} onClaim={() => {}} />);

    expect(rowHtml).toContain('Truyện #44');
    expect(rowHtml).toContain('Tác giả gửi duyệt: Chưa có thông tin tác giả');
    expect(preClaimHtml).toContain('Truyện #44');
    expect(preClaimHtml).toContain('Chưa có thông tin tác giả');

    const pkgWithoutSubmitter: ReviewPackage = {
      kind: 'PublicStoryReview',
      data: {
        ...basePublicPackage,
        createdByName: null,
        submittedAt: '',
        story: { ...basePublicPackage.story, title: null },
        version: { ...basePublicPackage.version, title: '' },
      },
    };
    const postClaimHtml = renderToStaticMarkup(
      <ReviewPanelHeader item={pkgWithoutSubmitter} message="" />
    );
    expect(postClaimHtml).toContain('Truyện #44');
    expect(postClaimHtml).toContain('Tác giả gửi duyệt: Chưa có thông tin tác giả');
  });

  it('prefers submitted version title in post-claim ReviewPanelHeader and keeps consistent author and timestamp', () => {
    const pkg: ReviewPackage = { kind: 'PublicStoryReview', data: basePublicPackage };
    expect(reviewPackageTitle(pkg)).toBe('Mái Nhà Ấm Áp Sau Cơn Mưa');
    expect(reviewPackageSubmitterLabel(pkg)).toBe('Tác giả gửi duyệt: Nguyễn Văn A');
    expect(reviewPackageSubmittedAt(pkg)).toBe('2026-11-10T07:15:00Z');

    const html = renderToStaticMarkup(
      <ReviewPanelHeader item={pkg} queueItem={baseQueueItem} message="" />
    );
    expect(html).toContain('Mái Nhà Ấm Áp Sau Cơn Mưa');
    expect(html).not.toContain('Tên truyện mới hơn');
    expect(html).toContain('Tác giả gửi duyệt: Nguyễn Văn A');
    expect(html).toContain(formatSubmittedAt('2026-11-10T07:15:00Z'));
  });

  it('never leaks submitter or reporter identity on ContentReport rows, DetailCard, or ReviewPanelHeader', () => {
    const reportQueueItem: QueueItem = {
      ...baseQueueItem,
      id: 77,
      itemType: 'ContentReport',
      storyId: 50,
      storyTitle: 'Truyện bị báo cáo',
      contentReportId: 88,
      createdByUserId: null,
      createdByName: 'Phụ huynh bí mật' as unknown as null,
    };

    const rowHtml = renderToStaticMarkup(<QueueItemRow item={reportQueueItem} selected={false} me={11} onSelect={() => {}} />);
    const detailHtml = renderToStaticMarkup(<DetailCard item={reportQueueItem} me={11} busy={false} onClaim={() => {}} />);

    expect(rowHtml).toContain('Truyện bị báo cáo');
    expect(rowHtml).not.toContain('Người');
    expect(rowHtml).not.toContain('Tác giả gửi duyệt');
    expect(rowHtml).not.toContain('Phụ huynh bí mật');
    expect(detailHtml).not.toContain('Tác giả gửi duyệt');
    expect(detailHtml).not.toContain('Phụ huynh bí mật');

    const reportPkg = {
      kind: 'ContentReport',
      data: {
        itemId: 77,
        claimExpiresAt: '2099-01-01T14:00:00Z',
        story: { storyId: 50, title: 'Truyện bị báo cáo' },
      },
    } as unknown as ReviewPackage;

    expect(reviewPackageSubmitterLabel(reportPkg, reportQueueItem)).toBeNull();
    const headerHtml = renderToStaticMarkup(
      <ReviewPanelHeader item={reportPkg} queueItem={reportQueueItem} message="" />
    );
    expect(headerHtml).toContain('Truyện bị báo cáo');
    expect(headerHtml).not.toContain('Tác giả gửi duyệt');
    expect(headerHtml).not.toContain('Phụ huynh bí mật');
  });

  it('handles very long titles and author names with word-wrapping CSS classes', () => {
    const longTitle = 'Truyện rất dài '.repeat(12) + 'KhôngKhoảngCáchDàiVôHạn'.repeat(3);
    const longAuthor = 'Nguyễn Thị '.repeat(8) + 'TrầnLêPhạmHoàngHuỳnh'.repeat(2);
    const longItem: QueueItem = {
      ...baseQueueItem,
      storyTitle: longTitle,
      createdByName: longAuthor,
    };

    const rowHtml = renderToStaticMarkup(<QueueItemRow item={longItem} selected onSelect={() => {}} />);
    const detailHtml = renderToStaticMarkup(<DetailCard item={longItem} busy={false} onClaim={() => {}} />);
    expect(rowHtml).toContain('st-item-title');
    expect(rowHtml).toContain('st-item-author');
    expect(rowHtml).toContain(longTitle);
    expect(rowHtml).toContain(longAuthor);
    expect(detailHtml).toContain('st-detail-title');

    const css = readFileSync(path.resolve(process.cwd(), 'app/features/staff/staff.css'), 'utf8');
    expect(css).toMatch(/\.st-item-title[\s\S]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/\.st-item-author[\s\S]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/\.st-detail-title[\s\S]*overflow-wrap:\s*anywhere/);
  });
});
