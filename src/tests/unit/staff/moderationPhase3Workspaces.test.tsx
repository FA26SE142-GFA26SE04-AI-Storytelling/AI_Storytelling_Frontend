import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReviewPackage } from '@/app/services/moderationService';
import type { QueueItem } from '@/app/types/staff';

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
  PUBLIC_STORY_REMOVAL_SECTIONS,
  ROADMAP_REVIEW_SECTIONS,
  moderationStatusLabel,
} from '@/app/features/staff/moderationConfig';
import PublicStoryRemovalPanel from '@/app/features/staff/PublicStoryRemovalPanel';
import RoadmapReviewPanel from '@/app/features/staff/RoadmapReviewPanel';
import RoadmapTemplates from '@/app/features/staff/RoadmapTemplates';
import PublishedReviewWorkspace from '@/app/features/staff/PublishedReviewWorkspace';
import RubricEvaluationHistory from '@/app/features/staff/RubricEvaluationHistory';
import GuidePreviewSection from '@/app/features/staff/GuidePreviewSection';
import GuideHistorySection from '@/app/features/staff/GuideHistorySection';

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

const removalQueueItem: QueueItem = {
  id: 601,
  itemType: 'PublicStoryRemoval',
  status: 'Claimed',
  priority: 'Medium',
  storyId: 44,
  storyTitle: 'Ngôi Nhà Trên Đồi',
  storyVersionId: 90,
  contentReportId: null,
  readingRoadmapId: null,
  createdByUserId: null,
  createdByName: null,
  isResubmission: false,
  slaDueAt: '2099-01-01T12:00:00Z',
  isOverdue: false,
  claimedByUserId: 5,
  claimedByName: 'Kiểm duyệt viên',
  claimedAt: '2026-11-11T09:00:00Z',
  claimExpiresAt: '2026-11-11T11:00:00Z',
  createdAt: '2026-11-10T07:00:00Z',
};

describe('Moderator Phase 3 workspaces (specs 07-10, 12-13)', () => {
  it('spec 07: defines PublicStoryRemoval sections, renders Flags.requestReason cleanly without leaking private fields, and locks actions on conflict', () => {
    expect(PUBLIC_STORY_REMOVAL_SECTIONS.map(s => s.status)).toEqual([
      'Pending', 'Claimed', 'Approved', 'Rejected', 'Closed',
    ]);
    expect(moderationStatusLabel('PublicStoryRemoval', 'Approved')).toBe('Đã chấp thuận gỡ');
    expect(moderationStatusLabel('PublicStoryRemoval', 'Rejected')).toBe('Đã từ chối yêu cầu gỡ');

    testState.reviewHookState = {
      ...testState.reviewHookState,
      claimBlocked: true,
      message: 'Hồ sơ đã hết thời gian giữ (409).',
      item: {
        kind: 'PublicStoryRemoval',
        data: {
          ...removalQueueItem,
          storyVersionId: null,
          rowVersion: 3,
          flags: '{"requestReason":"Cần chỉnh sửa phần kết cho phù hợp hơn","secretActor":"Creator Gia"}',
          checklist: null,
          reviewProgress: null,
        },
      },
    };

    const html = renderToStaticMarkup(
      <PublicStoryRemovalPanel id={601} queueItem={removalQueueItem} onBack={() => {}} onDecision={() => {}} />,
    );
    expect(html).toContain('Cần chỉnh sửa phần kết cho phù hợp hơn');
    expect(html).toContain('Không hiển thị trong hồ sơ hàng đợi');
    expect(html).not.toContain('Creator Gia');
    expect(html).not.toContain('secretActor');
    expect(html).not.toContain('ModerationItemDetailDto');
    expect(html).not.toContain('Chưa có thông tin chi tiết yêu cầu trong API hiện tại');
    expect(html).toContain('Quay lại danh sách');
    expect(html).toContain('Tải lại hồ sơ');
    expect(html).toContain('Chấp thuận gỡ');
    expect(html).toContain('Không chấp thuận gỡ');
    expect(html).toContain('readOnly=""');
    expect(html).toContain('disabled=""');

    testState.reviewHookState = {
      ...testState.reviewHookState,
      claimBlocked: false,
      item: {
        kind: 'PublicStoryRemoval',
        data: {
          ...removalQueueItem,
          rowVersion: 3,
          flags: '{broken',
          checklist: null,
          reviewProgress: null,
        },
      },
    };
    const emptyReasonHtml = renderToStaticMarkup(
      <PublicStoryRemovalPanel id={601} queueItem={removalQueueItem} onBack={() => {}} onDecision={() => {}} />,
    );
    expect(emptyReasonHtml).toContain('Creator không ghi lý do hoặc chưa có dữ liệu lý do.');
    expect(emptyReasonHtml).not.toContain('{broken');

    for (const file of [
      'app/features/staff/PublicStoryRemovalPanel.tsx',
      'app/features/staff/RemovalRequestsWorkspace.tsx',
      'app/features/staff/GrayZoneReviewPanel.tsx',
      'app/features/staff/GrayZoneReviewWorkspace.tsx',
      'app/features/staff/ContentReportReviewPanel.tsx',
      'app/features/staff/ContentReportsWorkspace.tsx',
    ]) {
      const src = readFileSync(path.resolve(process.cwd(), file), 'utf8');
      expect(src, file).not.toContain('IsPublished');
      expect(src, file).not.toContain('RemovedAt');
      expect(src, file).not.toContain('PublicStoryRemoval / Approved');
      expect(src, file).not.toContain('(Clear)');
      expect(src, file).not.toContain('(Block)');
      expect(src, file).not.toContain('(Cleared)');
      expect(src, file).not.toContain('(Archived)');
      expect(src, file).not.toContain('(SafetyConcern)');
    }
  });

  it('spec 08: defines RoadmapTemplateReview sections, renders roadmap review checklist/ineligibility, and preserves Authoring groups + Role-based Library view', () => {
    expect(ROADMAP_REVIEW_SECTIONS.map(s => s.status)).toEqual([
      'Pending', 'Claimed', 'ChangesRequested', 'Approved', 'Rejected', 'Withdrawn', 'Closed',
    ]);

    testState.reviewHookState = {
      ...testState.reviewHookState,
      item: {
        kind: 'RoadmapTemplateReview',
        data: {
          itemId: 701,
          roadmap: {
            id: 40,
            name: 'Hành Trình Thiên Nhiên',
            description: 'Bộ 3 truyện thiên nhiên',
            ageBand: '6-8',
            mainCategory: { id: 1, code: 'nature', displayName: 'Thiên nhiên' },
            readingLevelMin: 1,
            readingLevelMax: 3,
            defaultDaysPerStory: 3,
            createdByUserId: 9,
            createdByName: 'Mod Soạn Thảo',
            submittedAt: '2026-11-10T08:00:00Z',
            clonedFromId: null,
          },
          stories: [
            { storyId: 1, position: 0, days: 3, title: 'Ếch Con', ageBand: '6-8', readingLevel: 1, isEligible: true },
            { storyId: 2, position: 1, days: null, title: 'Truyện Đã Gỡ', ageBand: '6-8', readingLevel: 2, isEligible: false },
          ],
          checks: [{ code: 'min_stories', passed: false, message: 'Có truyện không còn đủ điều kiện', relatedRoadmapId: null }],
          checklist: [{ code: 'order', label: 'Thứ tự hợp lý', passed: true, note: null }],
          blockers: [{ code: 'story_ineligible', message: 'Cần yêu cầu sửa vì truyện thành phần không còn đủ điều kiện' }],
          canApprove: false,
          claimExpiresAt: '2026-11-11T11:00:00Z',
        },
      },
    };

    const reviewHtml = renderToStaticMarkup(<RoadmapReviewPanel id={701} onDecision={() => {}} />);
    expect(reviewHtml).toContain('Hành Trình Thiên Nhiên');
    expect(reviewHtml).toContain('Mod Soạn Thảo');
    expect(reviewHtml).toContain('Không còn đủ điều kiện');
    expect(reviewHtml).toContain('Cần yêu cầu sửa vì truyện thành phần không còn đủ điều kiện');
    expect(reviewHtml).toContain('Yêu cầu sửa');

    const tmplHtml = renderToStaticMarkup(<RoadmapTemplates />);
    expect(tmplHtml).toContain('Soạn lộ trình');
    expect(tmplHtml).toContain('Duyệt lộ trình');
    expect(tmplHtml).toContain('Đang phát hành');
    expect(tmplHtml).toContain('Lưu trữ');
    expect(tmplHtml).toContain('Cần tiếp quản');
    expect(tmplHtml).toContain('Tạo lộ trình mới');

    testState.userRole = 'Moderator';
    const modPubHtml = renderToStaticMarkup(<PublishedReviewWorkspace />);
    expect(modPubHtml).toContain('Truyện Creator đang công khai');
    expect(modPubHtml).not.toContain('Lộ trình mẫu công khai');

    testState.userRole = 'Administrator';
    const adminPubHtml = renderToStaticMarkup(<PublishedReviewWorkspace />);
    expect(adminPubHtml).toContain('Lộ trình mẫu công khai');
  });

  it('spec 09 & 10: separates rubric evaluation/validation/permission and guide preview/history cleanly', () => {
    const rubric = {
      id: 12,
      versionNo: 'v2.1',
      name: 'Rubric chuẩn',
      status: 'Draft',
      revision: 4,
      schemaVersion: '1.0',
      contentHash: 'hash123',
      definition: { purpose: 'P', criteria: [] },
      createdByUserId: 5,
      createdAt: '2026-11-10T08:00:00Z',
      activatedByUserId: null,
      activatedAt: null,
      retiredAt: null,
    };
    const evalHtml = renderToStaticMarkup(
      <RubricEvaluationHistory
        rubric={rubric}
        dirty={false}
        busy={false}
        conflictBlocked={false}
        validation={{ valid: true, id: 12, revision: 4, contentHash: 'hash123', schemaVersion: '1.0' }}
        onValidate={() => {}}
        trial={{ phase: 'phase2', ageBand: '6-8', language: 'vi', title: 'Thử', content: 'Nội dung thử' }}
        onTrialChange={() => {}}
        evaluation={{
          rubricId: 12,
          version: 'v2.1',
          contentHash: 'hash123',
          revision: 4,
          provider: 'MockAI',
          model: 'gemini',
          riskScore: 0.15,
          scores: [],
          findings: [],
        }}
        onEvaluate={() => {}}
        audit={null}
        auditPage={1}
        onLoadAudit={() => {}}
      />,
    );
    expect(evalHtml).toContain('Áp dụng bộ #12');
    expect(evalHtml).toContain('v2.1 (revision 4)');
    expect(evalHtml).toContain('Định nghĩa hợp lệ');

    const rubricSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/RubricWorkspace.tsx'), 'utf8');
    expect(rubricSrc).toContain("user?.role === 'Administrator' && current.status === 'Draft'");
    expect(rubricSrc).toContain('conflictBlocked');
    expect(rubricSrc).toContain('guardUnsaved');

    const previewHtml = renderToStaticMarkup(
      <GuidePreviewSection
        purpose=""
        group=""
        previewPage={1}
        selectedGuide={{
          id: 'ending_1',
          audienceRole: 'Parent',
          purposes: ['free'],
          supportGroup: 'ending',
          itemType: 'template',
          title: 'Kết ấm áp',
          instruction: 'Gợi ý kết thúc',
          example: null,
          templateText: 'Bé {{name}} đã mỉm cười',
          placeholderDefinitions: [{ key: 'name', label: 'Tên bé', hint: null }],
          order: 1,
        }}
        values={{ name: 'Bông' }}
        preview={{
          revisionToken: 'tok-1',
          page: null,
          render: { guideId: 'ending_1', text: 'Bé Bông đã mỉm cười' },
        }}
        previewValid={true}
        dirty={false}
        disabled={false}
        onPurposeChange={() => {}}
        onGroupChange={() => {}}
        onPreviewPageChange={() => {}}
        onValueChange={() => {}}
        onRunPreview={() => {}}
        onPublish={() => {}}
      />,
    );
    expect(previewHtml).toContain('Xem thử thành công không tự động phát hành');
    expect(previewHtml).toContain('Bé Bông đã mỉm cười');

    const historyHtml = renderToStaticMarkup(
      <GuideHistorySection
        history={{
          items: [{ versionId: 9, catalogVersion: '1.0', status: 'Published', publishedAt: '2026-11-10T08:00:00Z' }],
          totalCount: 1,
          pageIndex: 1,
          pageSize: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }}
        page={1}
        version={{
          version: { versionId: 9, catalogVersion: '1.0', status: 'Published', publishedAt: '2026-11-10T08:00:00Z' },
          items: [],
        }}
        hasDraft={false}
        disabled={false}
        onPageChange={() => {}}
        onSelectVersion={() => {}}
        onCreateDraftFrom={() => {}}
      />,
    );
    expect(historyHtml).toContain('chỉ đọc');
    expect(historyHtml).toContain('Tạo nháp từ bản này');

    const guideSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/AuthoringGuideManagement.tsx'), 'utf8');
    expect(guideSrc).toContain('if (h.busy) return;');
    expect(guideSrc).toContain('versionCtrl.current?.abort()');
    expect(guideSrc).toContain("h.errorKind === 'load'");
  });

  it('spec 00, 12, 13: routes all 6 moderation types via ReviewPanel cleanly and avoids all future proposal endpoints', () => {
    const reviewPanelSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/ReviewPanel.tsx'), 'utf8');
    expect(reviewPanelSrc).not.toContain('LegacyReviewPanel');
    for (const kind of [
      'PublicStoryReview',
      'GrayZoneStory',
      'ContentReport',
      'PublicStoryRemoval',
      'RoadmapTemplateReview',
    ]) {
      expect(reviewPanelSrc).toContain(kind);
    }

    for (const file of [
      'app/features/staff/PublicStoryRemovalPanel.tsx',
      'app/features/staff/RemovalRequestsWorkspace.tsx',
      'app/features/staff/RoadmapReviewPanel.tsx',
      'app/features/staff/RoadmapReviewWorkspace.tsx',
      'app/features/staff/RoadmapPublishedView.tsx',
      'app/features/staff/RoadmapStoryPicker.tsx',
      'app/features/staff/RoadmapAuthoringWorkspace.tsx',
      'app/features/staff/RoadmapTemplates.tsx',
      'app/features/staff/RubricEvaluationHistory.tsx',
      'app/features/staff/RubricWorkspace.tsx',
      'app/features/staff/GuidePreviewSection.tsx',
      'app/features/staff/GuideHistorySection.tsx',
      'app/features/staff/AuthoringGuideManagement.tsx',
      'app/features/story-workflow/useGuideManagement.ts',
    ]) {
      const text = readFileSync(path.resolve(process.cwd(), file), 'utf8');
      expect(text, file).not.toMatch(/\/history|escalation-summary|removed-stories|community-library|assignment=|statuses=/);
    }
  });
});
