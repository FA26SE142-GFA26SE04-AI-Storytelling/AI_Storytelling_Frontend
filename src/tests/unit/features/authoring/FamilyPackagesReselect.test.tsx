import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type * as B from '@/app/types/backendContracts';
import type { ChildProfile } from '@/app/types/childProfile';
import type { PackageComponents, ParentPackage } from '@/app/services/parentPackageService';
import PackageReselectForm from '@/app/features/authoring/PackageReselectForm';

const baseComponents: PackageComponents = {
  vocabulary: true,
  quiz: true,
  listening: false,
  images: true,
  narration: true,
};

const readOnlyComponents: PackageComponents = {
  vocabulary: false,
  quiz: false,
  listening: false,
  images: false,
  narration: false,
};

function makePkg(overrides: Partial<ParentPackage> = {}): ParentPackage {
  return {
    packageId: 101,
    storyId: 10,
    storyVersionId: 5,
    childProfileId: 1,
    revision: 1,
    packageToken: 'pkg-tok-1',
    status: 'Review',
    components: { ...baseComponents },
    check: null,
    lastErrorCode: null,
    confirmedAt: null,
    componentStatus: { check: 'Completed' },
    vocabularyCount: 0,
    quizCount: 0,
    listeningCount: 0,
    ...overrides,
  };
}

function makeGrant(childProfileId: number): B.ParentFamilyConfirmationDto {
  return {
    confirmationId: 800 + childProfileId,
    storyId: 10,
    storyVersionId: 5,
    childProfileId,
    preparationId: null,
    confirmedAt: '2026-11-16T00:00:00Z',
    parentStoryPackageId: 100 + childProfileId,
  } as unknown as B.ParentFamilyConfirmationDto;
}

const kids: ChildProfile[] = [
  { id: 1, nickname: 'Bé An', status: 'Active' } as ChildProfile,
  { id: 2, nickname: 'Bé Bình', status: 'Active' } as ChildProfile,
  { id: 3, nickname: 'Bé Cúc', status: 'Active' } as ChildProfile,
];

const kidName = (id: number) => kids.find((k) => k.id === id)?.nickname ?? `Bé #${id}`;

describe('PackageReselectForm SSR rendering', () => {
  it('prefills single and multiple children components and shows diff status badges', () => {
    const pkg1 = makePkg({ packageId: 101, childProfileId: 1, storyVersionId: 5 });
    const pkg2 = makePkg({
      packageId: 102,
      childProfileId: 2,
      storyVersionId: 5,
      components: { ...readOnlyComponents },
    });

    const html = renderToStaticMarkup(
      <PackageReselectForm
        livePackages={[pkg1, pkg2]}
        eligibleNewKids={[kids[2]]}
        drafts={{
          1: { ...baseComponents, quiz: false }, // changed
          2: { ...readOnlyComponents }, // unchanged read-only
        }}
        addedPicks={{}}
        currentVersionId={5}
        canWrite={true}
        busy={false}
        lock={false}
        error=""
        kidName={kidName}
        grantOf={() => null}
        onDraftChange={vi.fn()}
        onAddToggle={vi.fn()}
        onAddedPartsChange={vi.fn()}
        onRevoke={vi.fn()}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(html).toContain('Chọn lại thành phần gói');
    expect(html).toContain('Bé An');
    expect(html).toContain('Bé Bình');
    expect(html).toContain('Sẽ tạo bản gói mới');
    expect(html).toContain('Giữ nguyên gói hiện tại');
    expect(html).toContain('Thêm bé nhận truyện');
    expect(html).toContain('Bé Cúc');
    expect(html).toContain('Huỷ');
    expect(html).toContain('Lưu cấu hình gói');

    // Bé An has 3 pressed (vocab, images, narration) + Bé Bình has 0 pressed
    const pressedTrue = html.match(/aria-pressed="true"/g) ?? [];
    const pressedFalse = html.match(/aria-pressed="false"/g) ?? [];
    expect(pressedTrue).toHaveLength(3);
    expect(pressedFalse).toHaveLength(7);
  });

  it('marks stale or old-version packages to create new package on current version', () => {
    const stalePkg = makePkg({
      packageId: 101,
      childProfileId: 1,
      storyVersionId: 4,
      status: 'Stale',
    });

    const html = renderToStaticMarkup(
      <PackageReselectForm
        livePackages={[stalePkg]}
        eligibleNewKids={[]}
        drafts={{ 1: { ...baseComponents } }}
        addedPicks={{}}
        currentVersionId={5}
        canWrite={true}
        busy={false}
        lock={false}
        error=""
        kidName={kidName}
        grantOf={() => null}
        onDraftChange={vi.fn()}
        onAddToggle={vi.fn()}
        onAddedPartsChange={vi.fn()}
        onRevoke={vi.fn()}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(html).toContain('Tạo gói mới theo nội dung hiện tại');
  });

  it('renders granted package as read-only with explicit revoke button and disabled part pickers', () => {
    const pkg1 = makePkg({ packageId: 101, childProfileId: 1, status: 'Confirmed' });
    const grant1 = makeGrant(1);

    const html = renderToStaticMarkup(
      <PackageReselectForm
        livePackages={[pkg1]}
        eligibleNewKids={[]}
        drafts={{ 1: { ...baseComponents } }}
        addedPicks={{}}
        currentVersionId={5}
        canWrite={true}
        busy={false}
        lock={false}
        error=""
        kidName={kidName}
        grantOf={(id) => (id === 1 ? grant1 : null)}
        onDraftChange={vi.fn()}
        onAddToggle={vi.fn()}
        onAddedPartsChange={vi.fn()}
        onRevoke={vi.fn()}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(html).toContain('Đã giao — chỉ xem');
    expect(html).toContain('Thu hồi quyền đọc');
    // All 5 component buttons in the PartPicker group should be disabled
    const groupMatch = html.match(/<div class="fp-parts"[^>]*>([\s\S]*?)<\/div>/);
    expect(groupMatch).toBeTruthy();
    const disabledBtns = groupMatch![1].match(/disabled=""/g) ?? [];
    expect(disabledBtns).toHaveLength(5);
  });

  it('renders inline error and respects busy/lock/canWrite button states', () => {
    const pkg1 = makePkg({ packageId: 101, childProfileId: 1 });

    const busyHtml = renderToStaticMarkup(
      <PackageReselectForm
        livePackages={[pkg1]}
        eligibleNewKids={[]}
        drafts={{ 1: { ...baseComponents } }}
        addedPicks={{}}
        currentVersionId={5}
        canWrite={true}
        busy={true}
        lock={true}
        error="Lỗi cập nhật gói"
        kidName={kidName}
        grantOf={() => null}
        onDraftChange={vi.fn()}
        onAddToggle={vi.fn()}
        onAddedPartsChange={vi.fn()}
        onRevoke={vi.fn()}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(busyHtml).toContain('role="alert"');
    expect(busyHtml).toContain('Lỗi cập nhật gói');
    expect(busyHtml).toMatch(/<button[^>]*disabled=""[^>]*>Huỷ<\/button>/);
    expect(busyHtml).toMatch(/<button[^>]*disabled=""[^>]*>.*Lưu cấu hình gói<\/button>/);

    const lockedNotBusyHtml = renderToStaticMarkup(
      <PackageReselectForm
        livePackages={[pkg1]}
        eligibleNewKids={[]}
        drafts={{ 1: { ...baseComponents } }}
        addedPicks={{}}
        currentVersionId={5}
        canWrite={true}
        busy={false}
        lock={true}
        error=""
        kidName={kidName}
        grantOf={() => null}
        onDraftChange={vi.fn()}
        onAddToggle={vi.fn()}
        onAddedPartsChange={vi.fn()}
        onRevoke={vi.fn()}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(lockedNotBusyHtml).not.toMatch(/<button[^>]*disabled=""[^>]*>Huỷ<\/button>/);
    expect(lockedNotBusyHtml).toMatch(/<button[^>]*disabled=""[^>]*>.*Lưu cấu hình gói<\/button>/);

    const lockedGrantedHtml = renderToStaticMarkup(
      <PackageReselectForm
        livePackages={[makePkg({ packageId: 101, childProfileId: 1, status: 'Confirmed' })]}
        eligibleNewKids={[]}
        drafts={{ 1: { ...baseComponents } }}
        addedPicks={{}}
        currentVersionId={5}
        canWrite={true}
        busy={false}
        lock={true}
        error=""
        kidName={kidName}
        grantOf={(id) => (id === 1 ? makeGrant(1) : null)}
        onDraftChange={vi.fn()}
        onAddToggle={vi.fn()}
        onAddedPartsChange={vi.fn()}
        onRevoke={vi.fn()}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(lockedGrantedHtml).toMatch(/<button[^>]*disabled=""[^>]*>.*Thu hồi quyền đọc<\/button>/);
  });
});
