import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import WishCardDialog, {
  EMPTY_WISH_FORM,
  isWishMediaUrl,
  wishCardValidationProblem,
} from '@/app/features/staff/WishCardDialog';
import WishCardManagement, { WISH_GROUPS } from '@/app/features/staff/WishCardManagement';
import StoryWishCards from '@/app/features/staff/StoryWishCards';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Moderator Phase 4 WishCards & Spec 12-14 boundaries', () => {
  it('spec 11: renders WishCardDialog using shared Dialog for view/edit/create with inline preview and error preservation', () => {
    expect(isWishMediaUrl('https://cdn.example.com/rabbit.png')).toBe(true);
    expect(isWishMediaUrl('javascript:alert(1)')).toBe(false);
    expect(wishCardValidationProblem({ ...EMPTY_WISH_FORM, label: '', imageUrl: 'https://a.com/x.png' })).toBe('Nhập nhãn thẻ.');
    expect(wishCardValidationProblem({ ...EMPTY_WISH_FORM, label: 'Thỏ', imageUrl: 'invalid' })).toContain('http://');
    expect(wishCardValidationProblem({ ...EMPTY_WISH_FORM, label: 'Thỏ', imageUrl: 'https://a.com/x.png', sortOrder: 'abc' })).toContain('số nguyên');

    const editingCard = {
      id: 21,
      group: 'Character',
      label: 'Thỏ Trắng',
      imageUrl: 'https://cdn.example.com/rabbit.png',
      audioUrl: 'https://cdn.example.com/rabbit.mp3',
      ageBand: '6-8',
      contentCategoryId: null,
      sortOrder: 3,
      isActive: true,
    };

    const viewHtml = renderToStaticMarkup(
      <WishCardDialog
        mode="view"
        editing={editingCard}
        form={{
          group: 'Character',
          label: 'Thỏ Trắng',
          imageUrl: editingCard.imageUrl,
          audioUrl: editingCard.audioUrl ?? '',
          ageBand: '6-8',
          contentCategoryId: '',
          sortOrder: '3',
        }}
        categories={[]}
        groups={WISH_GROUPS}
        busy={false}
        saveError=""
        onFormChange={() => {}}
        onSwitchToEdit={() => {}}
        onReloadCard={() => {}}
        onSave={() => {}}
        onClose={() => {}}
      />,
    );
    expect(viewHtml).toContain('Chi tiết thẻ “Thỏ Trắng”');
    expect(viewHtml).toContain('Chỉnh sửa thẻ');
    expect(viewHtml).toContain('Tải lại chi tiết');
    expect(viewHtml).toContain('<audio');

    const editErrorHtml = renderToStaticMarkup(
      <WishCardDialog
        mode="edit"
        editing={editingCard}
        form={{
          group: 'Character',
          label: 'Thỏ Trắng Sửa',
          imageUrl: editingCard.imageUrl,
          audioUrl: editingCard.audioUrl ?? '',
          ageBand: '6-8',
          contentCategoryId: '',
          sortOrder: '3',
        }}
        categories={[]}
        groups={WISH_GROUPS}
        busy={false}
        saveError="Không lưu được thẻ ước; dữ liệu bạn vừa nhập vẫn được giữ."
        onFormChange={() => {}}
        onSwitchToEdit={() => {}}
        onReloadCard={() => {}}
        onSave={() => {}}
        onClose={() => {}}
      />,
    );
    expect(editErrorHtml).toContain('Sửa thẻ “Thỏ Trắng”');
    expect(editErrorHtml).toContain('Thỏ Trắng Sửa');
    expect(editErrorHtml).toContain('Không lưu được thẻ ước; dữ liệu bạn vừa nhập vẫn được giữ.');
    expect(editErrorHtml).toContain('Lưu thay đổi');
  });

  it('spec 11: WishCardManagement keeps catalog status distinct from approval queue and StoryWishCards scopes to storyId/versionId', () => {
    const mgmtHtml = renderToStaticMarkup(<WishCardManagement />);
    expect(mgmtHtml).toContain('Mọi nhóm');
    expect(mgmtHtml).toContain('Đang dùng và đã ẩn');
    expect(mgmtHtml).toContain('Thêm thẻ mới');
    expect(mgmtHtml).not.toContain('Chờ tiếp nhận');
    expect(mgmtHtml).not.toContain('Đang xử lý');

    const storyWishHtml = renderToStaticMarkup(<StoryWishCards storyId={77} versionId={12} />);
    expect(storyWishHtml).toContain('Thẻ ước của truyện');
    expect(storyWishHtml).toContain('AI gợi ý thẻ');
    expect(storyWishHtml).toContain('Gắn thẻ cho truyện');

    const mgmtSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/WishCardManagement.tsx'), 'utf8');
    expect(mgmtSrc).toContain("import Select from '@/app/components/Select'");
    expect(mgmtSrc).not.toContain('dlg-backdrop');
    expect(mgmtSrc).toContain('detailCtrl.current?.abort()');
    expect(mgmtSrc).toContain('submitLock.current');
    expect(mgmtSrc).toContain('restoreFocus');

    const dialogSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/WishCardDialog.tsx'), 'utf8');
    expect(dialogSrc).toContain("import Dialog from '@/app/components/Dialog'");
    expect(dialogSrc).toContain('if (!busy) onClose()');
    expect(dialogSrc).toContain("e.key === 'Escape' && !busy");
  });

  it('spec 12, 13, 14: Moderator navigation covers specs 00-11 completely with zero Spec 14 future backlog APIs or fields', () => {
    const staffAppSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/StaffApp.tsx'), 'utf8');
    for (const id of [
      'queue',
      'published',
      'removal-records',
      'gray-zone',
      'content-reports',
      'removal-requests',
      'rubrics',
      'authoring-guides',
      'templates',
      'wish-cards',
    ]) {
      expect(staffAppSrc, id).toContain(`id: "${id}"`);
    }
    expect(staffAppSrc).not.toContain('other-queue');
    expect(staffAppSrc).not.toContain('id: "shared-review"');
    expect(staffAppSrc).not.toContain('Truyện chia sẻ');
    expect(staffAppSrc).toContain('Administrator:');
    expect(staffAppSrc).toContain('ContentCreator:');

    const libraryWorkspaceSrc = readFileSync(path.resolve(process.cwd(), 'app/features/library/LibraryWorkspace.tsx'), 'utf8');
    const moderationDialogsSrc = readFileSync(path.resolve(process.cwd(), 'app/features/library/ModerationDialogs.tsx'), 'utf8');
    expect(libraryWorkspaceSrc).not.toContain('Nộp thư viện cộng đồng');
    expect(libraryWorkspaceSrc).not.toContain('CommunityDialog');
    expect(moderationDialogsSrc).not.toContain('CommunityDialog');

    const moderatorFiles = [
      'app/services/staffService.ts',
      'app/services/moderationService.ts',
      'app/services/wishCardService.ts',
      'app/services/rubricService.ts',
      'app/services/authoringGuideManagementService.ts',
      'app/services/roadmapTemplateService.ts',
      'app/features/staff/CreatorStoryReviewWorkspace.tsx',
      'app/features/staff/PublishedReviewWorkspace.tsx',
      'app/features/staff/RemovalRecordsWorkspace.tsx',
      'app/features/staff/GrayZoneReviewWorkspace.tsx',
      'app/features/staff/ContentReportsWorkspace.tsx',
      'app/features/staff/RemovalRequestsWorkspace.tsx',
      'app/features/staff/RoadmapTemplates.tsx',
      'app/features/staff/RubricWorkspace.tsx',
      'app/features/staff/AuthoringGuideManagement.tsx',
      'app/features/staff/WishCardManagement.tsx',
      'app/features/staff/WishCardDialog.tsx',
      'app/features/staff/StoryWishCards.tsx',
    ];
    for (const file of moderatorFiles) {
      const text = readFileSync(path.resolve(process.cwd(), file), 'utf8');
      expect(text, file).not.toMatch(/\/history|escalation-summary|removed-stories|community-library|assignment=|statuses=/);
    }
  });

  it('spec 11 / story coverage: displays coverage warning banner when canBeSuggested is false, hides banner when warning is null, and reloads coverage after act', () => {
    // 1. Kiểm tra service storyCoverage endpoint
    const serviceSrc = readFileSync(path.resolve(process.cwd(), 'app/services/wishCardService.ts'), 'utf8');
    expect(serviceSrc).toContain("storyCoverage: (storyId: number, signal?: AbortSignal)");
    expect(serviceSrc).toContain("`/moderation/stories/${storyId}/wish-cards/coverage`");

    // 2. Kiểm tra mã nguồn StoryWishCards.tsx đáp ứng các điều kiện hiển thị banner và reload
    const storyWishCardsSrc = readFileSync(path.resolve(process.cwd(), 'app/features/staff/StoryWishCards.tsx'), 'utf8');
    expect(storyWishCardsSrc).toContain('const [coverage, setCoverage] = useState<StoryWishCardCoverageDto | null>(null);');
    expect(storyWishCardsSrc).toContain('st-coverage-warn');
    // Banner chỉ hiện khi canBeSuggested === false và có warning (ẩn khi canBeSuggested=true hoặc warning null)
    expect(storyWishCardsSrc).toContain('coverage.canBeSuggested === false && coverage.warning');
    // loadCoverage được gọi sau khi act() thành công
    expect(storyWishCardsSrc).toContain('await loadCoverage();');
    expect(storyWishCardsSrc).toMatch(/if\s*\(\s*r\.success\s*\)\s*\{[\s\S]*?await\s+loadCoverage\(\);/);
  });
});
