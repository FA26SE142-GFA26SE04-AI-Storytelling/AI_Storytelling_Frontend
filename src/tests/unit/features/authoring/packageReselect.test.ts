import { describe, expect, it, vi } from 'vitest';
import type * as B from '@/app/types/backendContracts';
import type { PackageComponents, ParentPackage } from '@/app/services/parentPackageService';
import {
  buildInitialReselectDrafts,
  componentsEqual,
  executePackageReselect,
  planPackageReselect,
  type PackageReselectDeps,
} from '@/app/features/authoring/packageReselect';

const baseComponents: PackageComponents = {
  vocabulary: true,
  quiz: true,
  listening: false,
  images: true,
  narration: true,
};

function makePkg(overrides: Partial<ParentPackage> = {}): ParentPackage {
  return {
    packageId: 101,
    storyId: 10,
    storyVersionId: 5,
    childProfileId: 1,
    revision: 1,
    packageToken: 'tok-1',
    status: 'Review',
    components: { ...baseComponents },
    check: null,
    lastErrorCode: null,
    confirmedAt: null,
    componentStatus: {},
    vocabularyCount: 0,
    quizCount: 0,
    listeningCount: 0,
    ...overrides,
  };
}

function makeGrant(childProfileId: number): B.ParentFamilyConfirmationDto {
  return {
    confirmationId: 900 + childProfileId,
    storyId: 10,
    storyVersionId: 5,
    childProfileId,
    preparationId: null,
    confirmedAt: '2026-11-16T00:00:00Z',
    parentStoryPackageId: 100 + childProfileId,
  } as unknown as B.ParentFamilyConfirmationDto;
}

describe('packageReselect helpers', () => {
  it('componentsEqual compares all five flags', () => {
    expect(componentsEqual(baseComponents, { ...baseComponents })).toBe(true);
    expect(
      componentsEqual(baseComponents, { ...baseComponents, listening: true }),
    ).toBe(false);
  });

  it('buildInitialReselectDrafts prefills single and multiple children from latest packages', () => {
    const pkg1 = makePkg({ packageId: 1, childProfileId: 11 });
    const pkg2 = makePkg({
      packageId: 2,
      childProfileId: 22,
      components: {
        vocabulary: false,
        quiz: false,
        listening: false,
        images: false,
        narration: false,
      },
    });
    const drafts = buildInitialReselectDrafts([pkg1, pkg2]);
    expect(drafts[11]).toEqual(baseComponents);
    expect(drafts[22]).toEqual({
      vocabulary: false,
      quiz: false,
      listening: false,
      images: false,
      narration: false,
    });
  });

  it('planPackageReselect reuses unchanged packages and only revises changed ungranted child', () => {
    const pkgA = makePkg({ packageId: 1, childProfileId: 1, storyVersionId: 5 });
    const pkgB = makePkg({ packageId: 2, childProfileId: 2, storyVersionId: 5 });

    const plan = planPackageReselect({
      livePackages: [pkgA, pkgB],
      drafts: {
        1: { ...baseComponents, quiz: false },
        2: { ...baseComponents },
      },
      addedPicks: {},
      grants: [],
      currentVersionId: 5,
      active: true,
    });

    expect(plan.hasChanges).toBe(true);
    expect(plan.toRevise).toHaveLength(1);
    expect(plan.toRevise[0].pkg.childProfileId).toBe(1);
    expect(plan.toRevise[0].components.quiz).toBe(false);
    expect(plan.reused.map((p) => p.childProfileId)).toEqual([2]);
    expect(plan.toCreate).toEqual([]);
    expect(plan.needsFinalize).toBe(false);
  });

  it('planPackageReselect keeps granted packages readonly and never queues revise or create for them', () => {
    const pkgGranted = makePkg({ packageId: 1, childProfileId: 1, status: 'Confirmed' });
    const plan = planPackageReselect({
      livePackages: [pkgGranted],
      drafts: {
        1: { ...baseComponents, vocabulary: false },
      },
      addedPicks: {},
      grants: [makeGrant(1)],
      currentVersionId: 5,
      active: true,
    });

    expect(plan.grantedReadOnly.map((p) => p.childProfileId)).toEqual([1]);
    expect(plan.toRevise).toEqual([]);
    expect(plan.toCreate).toEqual([]);
    expect(plan.hasChanges).toBe(false);
  });

  it('planPackageReselect routes stale or old-version packages and new children to finalize/create', () => {
    const staleOldPkg = makePkg({
      packageId: 1,
      childProfileId: 1,
      storyVersionId: 4,
      status: 'Stale',
    });
    const plan = planPackageReselect({
      livePackages: [staleOldPkg],
      drafts: { 1: { ...baseComponents } },
      addedPicks: {
        3: { vocabulary: false, quiz: false, listening: false, images: false, narration: false },
      },
      grants: [],
      currentVersionId: 5,
      active: false,
    });

    expect(plan.reused).toEqual([]);
    expect(plan.toRevise).toEqual([]);
    expect(plan.toCreate).toEqual([
      { childProfileId: 1, components: baseComponents },
      {
        childProfileId: 3,
        components: {
          vocabulary: false,
          quiz: false,
          listening: false,
          images: false,
          narration: false,
        },
      },
    ]);
    expect(plan.needsFinalize).toBe(true);
    expect(plan.hasChanges).toBe(true);
  });
});

describe('executePackageReselect orchestration', () => {
  it('returns no_changes and calls zero APIs when plan has no diff', async () => {
    const deps: PackageReselectDeps = {
      getDraft: vi.fn(),
      finalizeContent: vi.fn(),
      createPackages: vi.fn(),
      getPackage: vi.fn(),
      revisePackage: vi.fn(),
    };
    const plan = planPackageReselect({
      livePackages: [makePkg()],
      drafts: { 1: { ...baseComponents } },
      addedPicks: {},
      grants: [],
      currentVersionId: 5,
      active: true,
    });

    const res = await executePackageReselect(10, plan, async () => true, deps);
    expect(res).toEqual({ status: 'no_changes', reusedCount: 1 });
    expect(deps.getPackage).not.toHaveBeenCalled();
    expect(deps.revisePackage).not.toHaveBeenCalled();
    expect(deps.finalizeContent).not.toHaveBeenCalled();
    expect(deps.createPackages).not.toHaveBeenCalled();
  });

  it('fetches fresh tokens before finalize and create after reopen/new version', async () => {
    const getDraft = vi
      .fn()
      .mockResolvedValueOnce({
        success: true,
        status: 200,
        message: '',
        data: { story: { storyId: 10, revisionToken: 'rev-before-fin', selectedVersionId: 6 } },
      })
      .mockResolvedValueOnce({
        success: true,
        status: 200,
        message: '',
        data: { story: { storyId: 10, revisionToken: 'rev-after-fin', selectedVersionId: 6 } },
      });
    const finalizeContent = vi.fn().mockResolvedValue({ success: true, status: 200, message: '', data: {} });
    const createPackages = vi.fn().mockResolvedValue({ success: true, status: 200, message: '', data: [] });

    const plan = planPackageReselect({
      livePackages: [makePkg({ storyVersionId: 5, status: 'Stale' })],
      drafts: { 1: { ...baseComponents } },
      addedPicks: {},
      grants: [],
      currentVersionId: 6,
      active: false,
    });

    const res = await executePackageReselect(10, plan, async () => true, {
      getDraft,
      finalizeContent,
      createPackages,
      getPackage: vi.fn(),
      revisePackage: vi.fn(),
      newOperationId: () => 'op-1',
    });

    expect(res).toEqual({ status: 'success', revisedCount: 0, createdCount: 1, reusedCount: 0 });
    expect(finalizeContent).toHaveBeenCalledWith(10, {
      operationId: 'op-1',
      revisionToken: 'rev-before-fin',
      baseVersionId: 6,
    });
    expect(createPackages).toHaveBeenCalledWith(
      10,
      {
        operationId: 'op-1',
        revisionToken: 'rev-after-fin',
        baseVersionId: 6,
      },
      [{ childProfileId: 1, components: baseComponents }],
    );
  });

  it('stops on partial failure, preserves succeeded count, and retry does not resend succeeded child', async () => {
    const pkgA = makePkg({ packageId: 1, childProfileId: 1, packageToken: 'tok-a1' });
    const pkgB = makePkg({ packageId: 2, childProfileId: 2, packageToken: 'tok-b1' });
    const drafts = {
      1: { ...baseComponents, quiz: false },
      2: { ...baseComponents, images: false },
    };

    const getPackage = vi
      .fn()
      .mockResolvedValueOnce({ success: true, status: 200, message: '', data: { ...pkgA, packageToken: 'tok-a-fresh' } })
      .mockResolvedValueOnce({ success: true, status: 200, message: '', data: { ...pkgB, packageToken: 'tok-b-fresh' } });

    const revisePackage = vi
      .fn()
      .mockResolvedValueOnce({ success: true, status: 200, message: '', data: { ...pkgA, revision: 2, components: drafts[1] } })
      .mockResolvedValueOnce({ success: false, status: 409, message: 'Token cũ, thử lại.', data: null });

    const getDraft = vi.fn().mockResolvedValue({
      success: true,
      status: 200,
      message: '',
      data: { story: { storyId: 10, revisionToken: 'story-tok-1', selectedVersionId: 5 } },
    });

    const plan1 = planPackageReselect({
      livePackages: [pkgA, pkgB],
      drafts,
      addedPicks: {},
      grants: [],
      currentVersionId: 5,
      active: true,
    });

    const res1 = await executePackageReselect(10, plan1, async () => true, {
      getDraft,
      finalizeContent: vi.fn(),
      createPackages: vi.fn(),
      getPackage,
      revisePackage,
    });

    expect(res1).toEqual({
      status: 'error',
      message: 'Token cũ, thử lại.',
      succeededCount: 1,
    });

    // After reload, pkgA's latest revision has drafts[1]; retry only revises pkgB.
    const reloadedPkgA = makePkg({
      packageId: 10,
      childProfileId: 1,
      revision: 2,
      packageToken: 'tok-a2',
      components: drafts[1],
    });
    const plan2 = planPackageReselect({
      livePackages: [reloadedPkgA, pkgB],
      drafts,
      addedPicks: {},
      grants: [],
      currentVersionId: 5,
      active: true,
    });

    expect(plan2.toRevise.map((x) => x.pkg.childProfileId)).toEqual([2]);
    expect(plan2.reused.map((x) => x.childProfileId)).toEqual([1]);

    const getPackageRetry = vi.fn().mockResolvedValueOnce({
      success: true,
      status: 200,
      message: '',
      data: { ...pkgB, packageToken: 'tok-b-retry' },
    });
    const revisePackageRetry = vi.fn().mockResolvedValueOnce({
      success: true,
      status: 200,
      message: '',
      data: { ...pkgB, revision: 2, components: drafts[2] },
    });

    const res2 = await executePackageReselect(10, plan2, async () => true, {
      getDraft,
      finalizeContent: vi.fn(),
      createPackages: vi.fn(),
      getPackage: getPackageRetry,
      revisePackage: revisePackageRetry,
    });

    expect(res2).toEqual({
      status: 'success',
      revisedCount: 1,
      createdCount: 0,
      reusedCount: 1,
    });
    expect(getPackageRetry).toHaveBeenCalledTimes(1);
    expect(getPackageRetry).toHaveBeenCalledWith(10, 2);
    expect(revisePackageRetry).toHaveBeenCalledTimes(1);
    expect(revisePackageRetry).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ packageId: 2, packageToken: 'tok-b-retry' }),
      drafts[2],
    );
  });

  it('rejects source version race before revise without calling revisePackage', async () => {
    const getDraft = vi.fn().mockResolvedValue({
      success: true,
      status: 200,
      message: '',
      data: { story: { storyId: 10, revisionToken: 'tok-other', selectedVersionId: 99 } },
    });
    const revisePackage = vi.fn();

    const plan = planPackageReselect({
      livePackages: [makePkg({ storyVersionId: 5 })],
      drafts: { 1: { ...baseComponents, quiz: false } },
      addedPicks: {},
      grants: [],
      currentVersionId: 5,
      active: true,
    });

    const res = await executePackageReselect(10, plan, async () => true, {
      getDraft,
      finalizeContent: vi.fn(),
      createPackages: vi.fn(),
      getPackage: vi.fn(),
      revisePackage,
    });

    expect(res.status).toBe('error');
    expect(revisePackage).not.toHaveBeenCalled();
  });

  it('rejects source version race between finalize and create without calling createPackages', async () => {
    const getDraft = vi
      .fn()
      .mockResolvedValueOnce({
        success: true,
        status: 200,
        message: '',
        data: { story: { storyId: 10, revisionToken: 'rev-1', selectedVersionId: 6 } },
      })
      .mockResolvedValueOnce({
        success: true,
        status: 200,
        message: '',
        data: { story: { storyId: 10, revisionToken: 'rev-2', selectedVersionId: 7 } },
      });
    const finalizeContent = vi.fn().mockResolvedValue({ success: true, status: 200, message: '', data: {} });
    const createPackages = vi.fn();

    const plan = planPackageReselect({
      livePackages: [makePkg({ storyVersionId: 5, status: 'Stale' })],
      drafts: { 1: { ...baseComponents } },
      addedPicks: {},
      grants: [],
      currentVersionId: 6,
      active: false,
    });

    const res = await executePackageReselect(10, plan, async () => true, {
      getDraft,
      finalizeContent,
      createPackages,
      getPackage: vi.fn(),
      revisePackage: vi.fn(),
    });

    expect(res.status).toBe('error');
    expect(finalizeContent).toHaveBeenCalledTimes(1);
    expect(createPackages).not.toHaveBeenCalled();
  });

  it('stops without create when finalizeContent fails even if message mentions FINALIZED', async () => {
    const getDraft = vi.fn().mockResolvedValue({
      success: true,
      status: 200,
      message: '',
      data: { story: { storyId: 10, revisionToken: 'rev-1', selectedVersionId: 6 } },
    });
    const finalizeContent = vi.fn().mockResolvedValue({
      success: false,
      status: 409,
      message: 'ALREADY_FINALIZED',
      data: null,
    });
    const createPackages = vi.fn();

    const plan = planPackageReselect({
      livePackages: [makePkg({ storyVersionId: 5, status: 'Stale' })],
      drafts: { 1: { ...baseComponents } },
      addedPicks: {},
      grants: [],
      currentVersionId: 6,
      active: false,
    });

    const res = await executePackageReselect(10, plan, async () => true, {
      getDraft,
      finalizeContent,
      createPackages,
      getPackage: vi.fn(),
      revisePackage: vi.fn(),
    });

    expect(res).toEqual({
      status: 'error',
      message: 'ALREADY_FINALIZED',
      succeededCount: 0,
    });
    expect(createPackages).not.toHaveBeenCalled();
  });

  it('does not auto-retry uncertain network rejections with a new operation key', async () => {
    const getDraft = vi.fn().mockResolvedValue({
      success: true,
      status: 200,
      message: '',
      data: { story: { storyId: 10, revisionToken: 'rev-1', selectedVersionId: 6 } },
    });
    const finalizeContent = vi.fn().mockRejectedValue(new Error('Network timeout'));
    const createPackages = vi.fn();
    const newOperationId = vi.fn(() => 'op-fixed');

    const plan = planPackageReselect({
      livePackages: [makePkg({ storyVersionId: 5, status: 'Stale' })],
      drafts: { 1: { ...baseComponents } },
      addedPicks: {},
      grants: [],
      currentVersionId: 6,
      active: false,
    });

    await expect(
      executePackageReselect(10, plan, async () => true, {
        getDraft,
        finalizeContent,
        createPackages,
        getPackage: vi.fn(),
        revisePackage: vi.fn(),
        newOperationId,
      }),
    ).rejects.toThrow('Network timeout');

    expect(finalizeContent).toHaveBeenCalledTimes(1);
    expect(newOperationId).toHaveBeenCalledTimes(1);
    expect(createPackages).not.toHaveBeenCalled();
  });
});
