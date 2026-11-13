import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { QueueItem } from '@/app/types/staff';
import type { ReviewPackage } from '@/app/services/moderationService';

const testState = vi.hoisted(() => ({
  userRole: 'Moderator' as 'Moderator' | 'Administrator',
  userId: 5,
  reviewHookState: {
    item: null as ReviewPackage | null,
    message: '',
    claimBlocked: false,
    busy: false,
    act: vi.fn(async () => true),
    patch: vi.fn(),
    refresh: vi.fn(),
  },
}));

vi.mock('@/app/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: testState.userId, username: 'mod_test', fullName: 'Kiểm duyệt viên', role: testState.userRole },
    accessToken: 'tok',
    isLoggedIn: true,
    isLoading: false,
    backendOnline: true,
    backendStatusMessage: 'OK',
  }),
}));

vi.mock('@/app/features/staff/useReviewItem', () => ({
  useReviewItem: () => testState.reviewHookState,
}));

import {
  CONTENT_REPORT_SECTIONS,
  GRAY_ZONE_SECTIONS,
  REMOVAL_RECORD_SOURCES,
  moderationStatusLabel,
} from '@/app/features/staff/moderationConfig';
import { parseGrayZoneFlags } from '@/app/features/staff/GrayZoneEvidence';
import GrayZoneReviewPanel from '@/app/features/staff/GrayZoneReviewPanel';
import ContentReportReviewPanel, { safeHttpUrl } from '@/app/features/staff/ContentReportReviewPanel';
import RemovalRecordsWorkspace from '@/app/features/staff/RemovalRecordsWorkspace';
import { QueueItemRow, QueueSummaryCard } from '@/app/features/staff/ModerationQueuePrimitives';
import { ReviewPanelHeader } from '@/app/features/staff/ReviewPanelHeader';
import { buildModerationQueueQuery } from '@/app/features/staff/useModerationSectionQueue';

afterEach(() => {
  testState.userRole = 'Moderator';
  testState.userId = 5;
  testState.reviewHookState = {
    item: null,
    message: '',
    claimBlocked: false,
    busy: false,
    act: vi.fn(async () => true),
    patch: vi.fn(),
    refresh: vi.fn(),
  };
  vi.restoreAllMocks();
});

const grayZoneClaimedOther: QueueItem = {
  id: 301,
  itemType: 'GrayZoneStory',
  status: 'Claimed',
  priority: 'High',
  storyId: 91,
  storyTitle: 'Khu Rừng Sương Mù',
  storyVersionId: 1201,
  contentReportId: null,
  readingRoadmapId: null,
  createdByUserId: 99,
  createdByName: 'Phụ huynh Minh',
  isResubmission: false,
  slaDueAt: '2099-01-01T12:00:00Z',
  isOverdue: false,
  claimedByUserId: 12,
  claimedByName: 'Mod C',
  claimedAt: '2026-11-11T09:00:00Z',
  claimExpiresAt: '2026-11-11T11:00:00Z',
  createdAt: '2026-11-10T08:30:00Z',
};

const contentReportPending: QueueItem = {
  id: 401,
  itemType: 'ContentReport',
  status: 'Claimed',
  priority: 'High',
  storyId: 55,
  storyTitle: 'Chuyến Phiêu Lưu Đêm',
  storyVersionId: 222,
  contentReportId: 700,
  readingRoadmapId: null,
  createdByUserId: 88,
  createdByName: 'Phụ huynh Lan Anh',
  isResubmission: false,
  slaDueAt: '2099-01-01T12:00:00Z',
  isOverdue: false,
  claimedByUserId: 5,
  claimedByName: 'Kiểm duyệt viên',
  claimedAt: '2026-11-11T09:00:00Z',
  claimExpiresAt: '2026-11-11T11:00:00Z',
  createdAt: '2026-11-10T09:15:00Z',
};

describe('Moderator Phase 2 workspaces (specs 04-06 & 12)', () => {
  it('defines two independent RemovalRecords sources after locking CommunitySubmission without cross-type merging or fake decision metadata', () => {
    expect(REMOVAL_RECORD_SOURCES.map(s => [s.itemType, s.status])).toEqual([
      ['PublicStoryRemoval', 'Approved'],
      ['ContentReport', 'Archived'],
    ]);

    const queries = REMOVAL_RECORD_SOURCES.map(s =>
      buildModerationQueueQuery({
        itemType: s.itemType,
        status: s.status,
        priority: '',
        onlyOverdue: false,
        pageIndex: 1,
        pageSize: 10,
      }),
    );
    expect(queries[0]).toEqual({ itemType: 'PublicStoryRemoval', status: 'Approved', pageIndex: 1, pageSize: 10 });
    expect(queries[1]).toEqual({ itemType: 'ContentReport', status: 'Archived', pageIndex: 1, pageSize: 10 });

    const html = renderToStaticMarkup(<RemovalRecordsWorkspace />);
    expect(html).toContain('Hồ sơ gỡ truyện');
    expect(html).toContain('Yêu cầu gỡ đã chấp thuận');
    expect(html).toContain('Vi phạm từ báo cáo');
    expect(html).not.toContain('Truyện chia sẻ đã gỡ');
    expect(html).toContain('không gộp theo');
    expect(html).toContain('chưa trả về ngày ra quyết định');

    const recordA: QueueItem = { ...grayZoneClaimedOther, id: 801, itemType: 'PublicStoryRemoval', status: 'Approved', storyId: 900 };
    const recordB: QueueItem = { ...grayZoneClaimedOther, id: 802, itemType: 'ContentReport', status: 'Archived', storyId: 900 };
    const summaryHtml = renderToStaticMarkup(
      <QueueSummaryCard
        item={recordB}
        me={5}
        busy={false}
        summaryNotice={REMOVAL_RECORD_SOURCES[1].summaryNotice}
      />,
    );
    expect(recordA.storyId).toBe(recordB.storyId);
    expect(summaryHtml).toContain('Mỗi dòng phản ánh một hồ sơ xử lý độc lập');
    expect(summaryHtml).not.toContain('Ngày gỡ thực tế');
  });

  it('defines GrayZoneStory sections, parses real AI flags honestly, protects privacy, and locks actions on claim conflict', () => {
    expect(GRAY_ZONE_SECTIONS.map(s => s.status)).toEqual([
      'Pending', 'Claimed', 'Cleared', 'Blocked', 'Closed',
    ]);
    expect(moderationStatusLabel('GrayZoneStory', 'Cleared')).toBe('Đã cho phép tiếp tục');
    expect(moderationStatusLabel('GrayZoneStory', 'Blocked')).toBe('Đã chặn');

    const arrayParsed = parseGrayZoneFlags(JSON.stringify([
      {
        Id: 'f1',
        Kind: 'Rubric',
        Name: 'Cảnh rượt đuổi căng thẳng',
        CriterionCode: 'mild_fear',
        Reason: 'Có yếu tố rượt đuổi trong rừng tối.',
        EvidenceQuote: 'tiếng bước chân dồn dập phía sau',
        ContextNote: 'Nhân vật chạy thoát ngay câu sau.',
        StartOffset: 10,
        EndOffset: 43,
      },
    ]));
    expect(arrayParsed.findings).toHaveLength(1);
    expect(arrayParsed.findings[0]).toMatchObject({
      name: 'Cảnh rượt đuổi căng thẳng',
      kind: 'Rubric',
      criterionCode: 'mild_fear',
      evidenceQuote: 'tiếng bước chân dồn dập phía sau',
    });

    const missingParsed = parseGrayZoneFlags('[]');
    expect(missingParsed.findings).toHaveLength(0);

    // Other-claimed item stays visible with ownership tag and no claim CTA.
    const rowHtml = renderToStaticMarkup(<QueueItemRow item={grayZoneClaimedOther} selected={false} me={5} onSelect={() => {}} />);
    expect(rowHtml).toContain('Người khác đang giữ (Mod C)');
    expect(rowHtml).not.toContain('Phụ huynh Minh');

    testState.reviewHookState = {
      ...testState.reviewHookState,
      claimBlocked: true,
      message: 'Mục này đã hết thời gian giữ hoặc vừa đổi trạng thái (409).',
      item: {
        kind: 'GrayZoneStory',
        data: {
          itemId: 301,
          storyVersionId: 1201,
          versionNo: 2,
          title: 'Khu Rừng Sương Mù',
          content: 'Màn sương buông tiếng bước chân dồn dập phía sau làm bé giật mình rồi bạn gấu xuất hiện.',
          ageBand: '6-8',
          readingLevel: 1,
          flags: '[]',
          rowVersion: 4,
        },
      },
    };
    const panelHtml = renderToStaticMarkup(
      <GrayZoneReviewPanel id={301} queueItem={grayZoneClaimedOther} onDecision={() => {}} />,
    );
    expect(panelHtml).toContain('Ngữ cảnh nguồn');
    expect(panelHtml).toContain('Evidence AI');
    expect(panelHtml).toContain('Nhận định Moderator');
    expect(panelHtml).toContain('Quyết định');
    expect(panelHtml).toContain('KHÔNG tự động xuất bản truyện lên thư viện cộng đồng');
    expect(panelHtml).toContain('Gói hồ sơ không có mục evidence AI chi tiết');
    expect(panelHtml).toContain('readOnly=""');
    expect(panelHtml).toContain('disabled=""');
    expect(panelHtml).not.toContain('Quét lại AI');
    expect(panelHtml).not.toContain('Phụ huynh Minh');

    testState.reviewHookState = {
      ...testState.reviewHookState,
      claimBlocked: false,
      message: '',
      item: {
        kind: 'GrayZoneStory',
        data: {
          itemId: 301,
          storyVersionId: 1201,
          versionNo: 2,
          title: 'Khu Rừng Sương Mù',
          content: 'Màn sương buông tiếng bước chân dồn dập phía sau làm bé giật mình rồi bạn gấu xuất hiện.',
          ageBand: '6-8',
          readingLevel: 1,
          flags: JSON.stringify([
            {
              Id: 'f1',
              Kind: 'Rubric',
              Name: 'Cảnh rượt đuổi căng thẳng',
              CriterionCode: 'mild_fear',
              Reason: 'Có yếu tố rượt đuổi trong rừng tối.',
              EvidenceQuote: 'tiếng bước chân dồn dập phía sau',
              ContextNote: 'Nhân vật chạy thoát ngay câu sau.',
              StartOffset: 10,
              EndOffset: 55,
            },
          ]),
          rowVersion: 4,
        },
      },
    };
    const withEvidenceHtml = renderToStaticMarkup(
      <GrayZoneReviewPanel id={301} queueItem={grayZoneClaimedOther} onDecision={() => {}} />,
    );
    expect(withEvidenceHtml).toContain('Cảnh rượt đuổi căng thẳng');
    expect(withEvidenceHtml).toContain('Tiêu chí vùng xám');
    expect(withEvidenceHtml).toContain('mild_fear');
    expect(withEvidenceHtml).toContain('<mark');
    expect(withEvidenceHtml).toContain('tiếng bước chân dồn dập phía sau');

    testState.reviewHookState = {
      ...testState.reviewHookState,
      item: {
        kind: 'GrayZoneStory',
        data: {
          itemId: 301,
          storyVersionId: 1201,
          versionNo: 2,
          title: 'Khu Rừng Sương Mù',
          content: 'Nội dung diễn biến cần rà soát nhóm tuổi.',
          ageBand: '6-8',
          readingLevel: 1,
          flags: JSON.stringify([
            {
              Id: 'section:development',
              Kind: 'section',
              Name: 'development',
              CriterionCode: null,
              Reason: 'age_band_review',
              EvidenceQuote: '',
              ContextNote: '',
              StartOffset: null,
              EndOffset: null,
            },
          ]),
          rowVersion: 4,
        },
      },
    };
    const sectionFlagHtml = renderToStaticMarkup(
      <GrayZoneReviewPanel id={301} queueItem={grayZoneClaimedOther} onDecision={() => {}} />,
    );
    expect(sectionFlagHtml).toContain('Diễn biến');
    expect(sectionFlagHtml).toContain('Phần nội dung');
    expect(sectionFlagHtml).toContain('Cần rà soát mức độ phù hợp với nhóm tuổi mục tiêu.');
    expect(sectionFlagHtml).toContain('Không có đoạn trích dẫn cụ thể cho cờ này.');
    expect(sectionFlagHtml).not.toContain('age_band_review');
    expect(sectionFlagHtml).not.toContain('đoạn trích evidence');
  });

  it('validates HTTP(S) URLs strictly, hides reporter identity, and enforces role-appropriate ContentReport actions', () => {
    expect(CONTENT_REPORT_SECTIONS.map(s => s.status)).toEqual([
      'Pending', 'Claimed', 'Escalated', 'Dismissed', 'Archived', 'Closed',
    ]);
    expect(safeHttpUrl('https://cdn.example.com/evidence.png')).toBe('https://cdn.example.com/evidence.png');
    expect(safeHttpUrl('http://example.com/doc')).toBe('http://example.com/doc');
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeHttpUrl('/relative/path')).toBeNull();

    const rowHtml = renderToStaticMarkup(<QueueItemRow item={contentReportPending} selected={false} me={5} onSelect={() => {}} />);
    expect(rowHtml).not.toContain('Phụ huynh Lan Anh');

    const pkgBase: ReviewPackage = {
      kind: 'ContentReport',
      data: {
        itemId: 401,
        reportId: 700,
        reason: 'Inappropriate',
        description: 'Lời thoại không hợp độ tuổi 6-8.',
        attachmentUrl: 'javascript:alert(1)',
        isReviewItem: false,
        requestedByUserId: 5,
        requestedByName: 'Moderator An',
        itemStatus: 'Claimed',
        createdAt: '2026-11-10T09:15:00Z',
        story: {
          storyId: 55,
          title: 'Chuyến Phiêu Lưu Đêm',
          description: 'Mô tả truyện',
          genre: 'Phiêu lưu',
          ageBand: '6-8',
          readingLevel: 1,
          language: 'vi',
          scope: 'Parent',
          isArchived: false,
          authorUserId: 9,
          authorName: 'Tác giả Minh',
          labels: [{ code: 'adv', displayName: 'Phiêu lưu' }],
        },
        version: {
          versionId: 222,
          versionNo: 1,
          title: 'Chuyến Phiêu Lưu Đêm',
          content: 'Toàn văn dự phòng',
          lesson: 'Luôn bình tĩnh khi đi lạc.',
        },
        scenes: [
          { sceneIndex: 0, text: 'Cảnh một trong rừng', imageUrls: [], audioUrls: [] },
        ],
        vocabulary: [{ term: 'can đảm', definition: 'không sợ hãi' }],
        quizzes: [],
      },
    };

    const headerHtml = renderToStaticMarkup(<ReviewPanelHeader item={pkgBase} queueItem={contentReportPending} message="" />);
    expect(headerHtml).not.toContain('Phụ huynh Lan Anh');

    testState.userRole = 'Moderator';
    testState.reviewHookState = { ...testState.reviewHookState, item: pkgBase };
    const modPanelHtml = renderToStaticMarkup(
      <ContentReportReviewPanel id={401} queueItem={contentReportPending} onDecision={() => {}} />,
    );
    expect(modPanelHtml).toContain('Báo cáo &amp; minh chứng');
    expect(modPanelHtml).toContain('Nội dung bị báo cáo');
    expect(modPanelHtml).toContain('Quyết định');
    expect(modPanelHtml).toContain('Cảnh một trong rừng');
    expect(modPanelHtml).toContain('can đảm');
    // Backend đã bỏ discussionQuestions khỏi gói report (thay bằng listening); thiếu trường này không được làm crash panel.
    expect(modPanelHtml).toContain('Bỏ qua báo cáo');
    expect(modPanelHtml).toContain('Gỡ truyện vi phạm');
    expect(modPanelHtml).not.toContain('Chuyển Administrator');
    expect(modPanelHtml).toContain('Người yêu cầu rà soát');
    expect(modPanelHtml).toContain('Moderator An');
    expect(modPanelHtml).toContain('Tác giả');
    expect(modPanelHtml).toContain('Tác giả Minh');
    expect(modPanelHtml).toContain('đã chặn mở liên kết');
    expect(modPanelHtml).not.toContain('href="javascript:');
    expect(modPanelHtml).not.toContain('Phụ huynh Lan Anh');

    // Administrator flow does not display "Chuyển Administrator" button
    testState.userRole = 'Administrator';
    testState.reviewHookState = {
      ...testState.reviewHookState,
      item: {
        kind: 'ContentReport',
        data: { ...pkgBase.data, itemStatus: 'Claimed' },
      },
    };
    const adminPanelHtml = renderToStaticMarkup(
      <ContentReportReviewPanel id={401} queueItem={contentReportPending} onDecision={() => {}} />,
    );
    expect(adminPanelHtml).not.toContain('Chuyển Administrator');
  });

  it('wires Phase 2 routes in StaffApp, retires OtherModerationQueue after 6 types complete, updates Published redirect, and avoids future endpoints', () => {
    const staffAppSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/StaffApp.tsx'), 'utf8');
    expect(staffAppSrc).toContain('id: "removal-records"');
    expect(staffAppSrc).toContain('id: "gray-zone"');
    expect(staffAppSrc).toContain('id: "content-reports"');
    expect(staffAppSrc).toContain('id: "removal-requests"');
    expect(staffAppSrc).not.toContain('id: "other-queue"');
    expect(staffAppSrc).toContain('"templates"');

    const modSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/Moderation.tsx'), 'utf8');
    expect(modSrc).not.toContain('OtherModerationQueue');

    const pubSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/PublishedReviewWorkspace.tsx'), 'utf8');
    expect(pubSrc).toContain("'content-reports'");
    expect(pubSrc).not.toContain("'other-queue'");

    const reviewPanelSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/ReviewPanel.tsx'), 'utf8');
    expect(reviewPanelSrc).toContain("'GrayZoneStory'");
    expect(reviewPanelSrc).toContain("'ContentReport'");

    const reportsWsSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/ContentReportsWorkspace.tsx'), 'utf8');
    expect(reportsWsSrc).toContain("current.status === 'Claimed'");
    expect(reportsWsSrc).not.toContain("'Escalated'");

    for (const file of [
      'app/features/staff/RemovalRecordsWorkspace.tsx',
      'app/features/staff/GrayZoneEvidence.ts',
      'app/features/staff/GrayZoneReviewPanel.tsx',
      'app/features/staff/GrayZoneReviewWorkspace.tsx',
      'app/features/staff/ReportedContentSection.tsx',
      'app/features/staff/ContentReportReviewPanel.tsx',
      'app/features/staff/ContentReportsWorkspace.tsx',
    ]) {
      const text = readFileSync(path.resolve(process.cwd(), file), 'utf8');
      expect(text, file).not.toMatch(/\/history|escalation-summary|removed-stories|community-library|assignment=|statuses=/);
    }
  });
});
