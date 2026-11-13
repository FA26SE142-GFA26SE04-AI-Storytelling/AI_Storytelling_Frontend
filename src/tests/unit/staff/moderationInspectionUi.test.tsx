import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { QueueItem } from '@/app/types/staff';
import type { ReviewPackage } from '@/app/services/moderationService';
import {
  CreatorOutlineStrip,
  InspectionSnapshotBar,
  ManuscriptCard,
  ReviewHistoryList,
  SceneCardShell,
} from '@/app/features/staff/ModerationInspectionPrimitives';
import { ModerationWorkspaceShell } from '@/app/features/staff/ModerationQueuePrimitives';
import { PUBLIC_STORY_SECTIONS } from '@/app/features/staff/moderationConfig';
import PublicStoryReviewPanel from '@/app/features/staff/PublicStoryReviewPanel';

const mockReviewItem = {
  item: null as ReviewPackage | null,
  message: '',
  claimBlocked: false,
  busy: false,
  act: vi.fn(async () => true),
  patch: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('@/app/features/staff/useReviewItem', () => ({
  useReviewItem: () => mockReviewItem,
}));

describe('Moderator inspection UI primitives', () => {
  it('renders InspectionSnapshotBar metrics, CreatorOutlineStrip, ManuscriptCard word badge, SceneCardShell, and Vietnamese ReviewHistoryList', () => {
    const snapHtml = renderToStaticMarkup(
      <InspectionSnapshotBar
        onJump={() => {}}
        metrics={[
          { id: 'scenes', label: 'Cảnh đã xem', value: '1/2', tone: 'wait', targetId: 'creator-sec-media' },
          { id: 'blockers', label: 'Chặn duyệt', value: 'Sẵn sàng', tone: 'ok' },
        ]}
      />,
    );
    expect(snapHtml).toContain('Cảnh đã xem');
    expect(snapHtml).toContain('1/2');
    expect(snapHtml).toContain('Sẵn sàng');
    expect(snapHtml).toContain('tone-wait');
    expect(snapHtml).toContain('tone-ok');

    const outlineHtml = renderToStaticMarkup(
      <CreatorOutlineStrip
        opening="Mở đầu khu rừng xanh"
        development="Chú ếch giúp bạn tìm đường"
        ending="Mọi người cùng trở về an toàn"
      />,
    );
    expect(outlineHtml).toContain('Dàn ý 3 phần từ Creator');
    expect(outlineHtml).toContain('Mở đầu khu rừng xanh');
    expect(outlineHtml).toContain('Chú ếch giúp bạn tìm đường');
    expect(outlineHtml).toContain('Mọi người cùng trở về an toàn');

    const manuscriptHtml = renderToStaticMarkup(
      <ManuscriptCard label="Toàn văn tác phẩm" text="Một buổi sáng trong lành bên bờ ao." />,
    );
    expect(manuscriptHtml).toContain('mod-manuscript');
    expect(manuscriptHtml).toContain('8 từ');

    const sceneHtml = renderToStaticMarkup(
      <SceneCardShell
        sceneNumber={1}
        viewed
        prose="Chú ếch nhỏ nhảy trên lá sen xanh."
        hasMedia={false}
      />,
    );
    expect(sceneHtml).toContain('Cảnh 1');
    expect(sceneHtml).toContain('Đã xem');
    expect(sceneHtml).toContain('no-media');

    const historyHtml = renderToStaticMarkup(
      <ReviewHistoryList
        history={[
          {
            itemId: 90,
            storyVersionId: 12,
            versionNo: 1,
            decision: 'ChangesRequested',
            decidedByUserId: 5,
            decidedByName: 'Mod Lan',
            decidedAt: '2026-11-10T09:00:00Z',
            reason: 'Cần bổ sung bài học',
            feedback: 'Cần sửa lại đoạn kết cho dịu nhẹ hơn',
          },
        ]}
      />,
    );
    expect(historyHtml).toContain('Lịch sử các lần duyệt trước (1)');
    expect(historyHtml).toContain('Chờ Creator sửa');
    expect(historyHtml).toContain('Cần sửa lại đoạn kết cho dịu nhẹ hơn');
  });

  it('renders PublicStoryReviewPanel snapshot, 3-part creator outline, full-text reader, and inline checklist evidence', () => {
    const queueItem: QueueItem = {
      id: 301,
      itemType: 'PublicStoryReview',
      status: 'Claimed',
      priority: 'High',
      storyId: 44,
      storyTitle: 'Ếch Con Học Chữ',
      storyVersionId: 100,
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

    mockReviewItem.item = {
      kind: 'PublicStoryReview',
      data: {
        itemId: 301,
        storyId: 44,
        storyVersionId: 100,
        versionNo: 2,
        isResubmission: true,
        createdByUserId: 13,
        createdByName: 'Lê Thị Mai',
        submittedAt: '2026-11-10T07:15:00Z',
        proposedLabels: [{ contentCategoryId: 1, code: 'nature', displayName: 'Thiên nhiên', source: 'Creator' }],
        story: {
          title: 'Ếch Con Học Chữ',
          description: 'Câu chuyện về sự kiên trì.',
          genre: 'Đồng thoại',
          ageBand: '6-8',
          readingLevel: 1,
          vocabularyLevel: 'Cơ bản',
          language: 'vi',
          moralLesson: 'Kiên nhẫn sẽ thành công.',
          coverImageUrl: null,
          labels: [],
        },
        version: {
          title: 'Ếch Con Học Chữ',
          outlineOpening: 'Ếch con tập viết bên lá sen.',
          outlineDevelopment: 'Bạn chuồn chuồn cổ vũ mỗi ngày.',
          outlineEnding: 'Ếch con đọc được cả bài thơ.',
          content: 'Ngày xửa ngày xưa bên bờ ao xanh.',
          lesson: 'Kiên nhẫn sẽ thành công.',
        },
        scenes: [
          {
            sceneId: 11,
            sceneIndex: 0,
            sceneText: 'Ngày xửa ngày xưa bên bờ ao xanh.',
            visualDescription: null,
            viewed: false,
            illustrations: [],
            segments: [],
          },
        ],
        vocabulary: [{ id: 1, term: 'Kiên trì', definition: 'Cố gắng không bỏ cuộc' }],
        quizzes: [],
        listeningInteractions: [],
        discussionQuestions: [{ id: 1, sortOrder: 0, question: 'Bé học được tính cách nào?', isMoralLesson: true }],
        flags: [],
        allFlagsResolved: true,
        safetyScan: { status: 'Safe', zone: 'Safe', riskScore: 2, phase: 'phase3', provider: 'Vertex', model: 'gemini', advisoryFindings: [] },
        progress: {
          totalScenes: 1,
          missingSceneIds: [11],
          audioHeardCount: 0,
          missingWarningSegmentIds: [],
          needsAtLeastOneAudio: false,
          requiredViewsComplete: false,
        },
        checklist: {
          safety: true,
          ageFit: null,
          education: null,
          language: null,
          copyright: null,
          image: null,
          audio: null,
          interaction: null,
        },
        approveBlockers: [{ code: 'views_incomplete', message: 'Còn 1 cảnh chưa xác nhận đã xem' }],
        canApprove: false,
        previousModeratorName: null,
        reviewHistory: [],
      },
    };

    const html = renderToStaticMarkup(
      <PublicStoryReviewPanel id={301} queueItem={queueItem} onDecision={() => {}} />,
    );
    expect(html).toContain('mod-desk-split');
    expect(html).toContain('mod-desk-main');
    expect(html).toContain('mod-desk-rail');
    expect(html).toContain('mod-read-tabs');
    expect(html).toContain('Thông tin &amp; Dàn ý');
    expect(html).toContain('Cảnh &amp; Media (1)');
    expect(html).toContain('Tổng quan tiến độ rà soát');
    expect(html).toContain('0/1');
    expect(html).toContain('1/8');
    expect(html).toContain('Dàn ý 3 phần từ Creator');
    expect(html).toContain('Ếch con tập viết bên lá sen.');
    expect(html).toContain('Đọc toàn văn bản gốc Creator gửi');
    expect(html).toContain('Câu hỏi thảo luận (1)');
    expect(html).toContain('Đã quét AI: An toàn (Safe) · điểm rủi ro 2');
    expect(html).toContain('Kiên trì');

    const shellWithSelection = renderToStaticMarkup(
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
        items={[queueItem]}
        selectedId={301}
        onSelect={() => {}}
        currentUserId={5}
        loading={false}
        error=""
        actionNote={null}
        totalCount={1}
        pageIndex={1}
        totalPages={1}
        hasNextPage={false}
        onPageChange={() => {}}
        onReload={() => {}}
        detail={<div>Detail</div>}
      />,
    );
    expect(shellWithSelection).toContain('Ẩn danh sách');
    expect(shellWithSelection).toContain('has-detail');
    expect(shellWithSelection).toContain('role="tablist"');
    expect(shellWithSelection).toContain('aria-selected="true"');
    expect(shellWithSelection).toContain('Xử lý hồ sơ');
    expect(shellWithSelection).toContain('Kết quả xử lý');
    expect(shellWithSelection).toContain('Chờ tiếp nhận');
    expect(shellWithSelection).toContain('Đang xử lý');
    expect(shellWithSelection).toContain('Chờ sửa');
    expect(shellWithSelection).not.toContain('Đã duyệt');
    expect(shellWithSelection).not.toContain('Từ chối');
    expect(shellWithSelection).not.toContain('Đã rút');
    expect(shellWithSelection).not.toContain('Đã đóng');

    const shellInResultsTier = renderToStaticMarkup(
      <ModerationWorkspaceShell
        title="Duyệt truyện Creator"
        description="Mô tả"
        sections={PUBLIC_STORY_SECTIONS}
        status="Approved"
        onStatusChange={() => {}}
        priority=""
        onPriorityChange={() => {}}
        onlyOverdue={false}
        onOnlyOverdueChange={() => {}}
        items={[]}
        selectedId={null}
        onSelect={() => {}}
        currentUserId={5}
        loading={false}
        error=""
        actionNote={null}
        totalCount={4}
        pageIndex={1}
        totalPages={1}
        hasNextPage={false}
        onPageChange={() => {}}
        onReload={() => {}}
        detail={null}
      />,
    );
    expect(shellInResultsTier).toContain('mod-tier-tab--results on');
    expect(shellInResultsTier).toContain('Đã duyệt');
    expect(shellInResultsTier).toContain('Từ chối');
    expect(shellInResultsTier).toContain('Đã rút');
    expect(shellInResultsTier).toContain('Đã đóng');
    expect(shellInResultsTier).not.toContain('Chờ tiếp nhận');
    expect(shellInResultsTier).not.toContain('Chờ sửa');

    const singleGroupShell = renderToStaticMarkup(
      <ModerationWorkspaceShell
        title="Hồ sơ đơn nhóm"
        description="Mô tả"
        sections={PUBLIC_STORY_SECTIONS.filter(s => s.group !== 'results')}
        status="Pending"
        onStatusChange={() => {}}
        priority=""
        onPriorityChange={() => {}}
        onlyOverdue={false}
        onOnlyOverdueChange={() => {}}
        items={[]}
        selectedId={null}
        onSelect={() => {}}
        currentUserId={5}
        loading={false}
        error=""
        actionNote={null}
        totalCount={0}
        pageIndex={1}
        totalPages={1}
        hasNextPage={false}
        onPageChange={() => {}}
        onReload={() => {}}
        detail={null}
      />,
    );
    expect(singleGroupShell).not.toContain('role="tablist"');
    expect(singleGroupShell).toContain('Chờ tiếp nhận');
  });
});
