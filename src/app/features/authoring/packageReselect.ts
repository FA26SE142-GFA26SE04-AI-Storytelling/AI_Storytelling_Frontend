import type * as B from '@/app/types/backendContracts';
import type { ApiResponse } from '@/app/types/auth';
import { parentAuthoringService } from '@/app/services/parentAuthoringService';
import {
  parentPackageService,
  type PackageComponents,
  type ParentPackage,
} from '@/app/services/parentPackageService';

export const DEFAULT_PACKAGE_PARTS: PackageComponents = {
  vocabulary: true,
  quiz: true,
  listening: false,
  images: true,
  narration: true,
};

export const STALE_PACKAGE_STATUSES = ['Stale', 'Cancelled'] as const;

export function componentsEqual(a: PackageComponents, b: PackageComponents): boolean {
  return (
    a.vocabulary === b.vocabulary &&
    a.quiz === b.quiz &&
    a.listening === b.listening &&
    a.images === b.images &&
    a.narration === b.narration
  );
}

/** Điền sẵn cấu hình gói gần nhất của từng bé trên cùng story. */
export function buildInitialReselectDrafts(
  livePackages: ParentPackage[],
): Record<number, PackageComponents> {
  const drafts: Record<number, PackageComponents> = {};
  for (const pkg of livePackages) {
    drafts[pkg.childProfileId] = { ...pkg.components };
  }
  return drafts;
}

export interface PackageReselectPlan {
  expectedStoryVersionId: number | null;
  reused: ParentPackage[];
  toRevise: { pkg: ParentPackage; components: PackageComponents }[];
  toCreate: { childProfileId: number; components: PackageComponents }[];
  grantedReadOnly: ParentPackage[];
  needsFinalize: boolean;
  hasChanges: boolean;
}

/** Tính diff giữa cấu hình người dùng chọn và các gói hiện có của từng bé. */
export function planPackageReselect({
  livePackages,
  drafts,
  addedPicks,
  grants,
  currentVersionId,
  active,
}: {
  livePackages: ParentPackage[];
  drafts: Record<number, PackageComponents>;
  addedPicks: Record<number, PackageComponents | null>;
  grants: B.ParentFamilyConfirmationDto[];
  currentVersionId: number | null;
  active: boolean;
}): PackageReselectPlan {
  const grantedChildIds = new Set(grants.map((g) => g.childProfileId));
  const reused: ParentPackage[] = [];
  const toRevise: { pkg: ParentPackage; components: PackageComponents }[] = [];
  const toCreate: { childProfileId: number; components: PackageComponents }[] = [];
  const grantedReadOnly: ParentPackage[] = [];
  const liveChildIds = new Set<number>();

  for (const pkg of livePackages) {
    liveChildIds.add(pkg.childProfileId);
    if (grantedChildIds.has(pkg.childProfileId)) {
      grantedReadOnly.push(pkg);
      continue;
    }

    const nextComponents = drafts[pkg.childProfileId] ?? pkg.components;
    const isStaleOrOldVersion =
      (STALE_PACKAGE_STATUSES as readonly string[]).includes(pkg.status) ||
      currentVersionId == null ||
      pkg.storyVersionId !== currentVersionId;

    if (isStaleOrOldVersion) {
      toCreate.push({
        childProfileId: pkg.childProfileId,
        components: { ...nextComponents },
      });
    } else if (componentsEqual(nextComponents, pkg.components)) {
      reused.push(pkg);
    } else {
      toRevise.push({
        pkg,
        components: { ...nextComponents },
      });
    }
  }

  for (const [idStr, picked] of Object.entries(addedPicks)) {
    const childProfileId = Number(idStr);
    if (!picked || liveChildIds.has(childProfileId)) continue;
    toCreate.push({
      childProfileId,
      components: { ...picked },
    });
  }

  return {
    expectedStoryVersionId: currentVersionId,
    reused,
    toRevise,
    toCreate,
    grantedReadOnly,
    needsFinalize: !active && toCreate.length > 0,
    hasChanges: toRevise.length > 0 || toCreate.length > 0,
  };
}

export interface PackageReselectDeps {
  getDraft: (storyId: number) => Promise<ApiResponse<B.ParentDraftDto>>;
  finalizeContent: (
    storyId: number,
    cmd: B.CreatorVersionCommand,
  ) => Promise<ApiResponse<unknown>>;
  createPackages: (
    storyId: number,
    cmd: B.CreatorVersionCommand,
    recipients: { childProfileId: number; components: PackageComponents }[],
  ) => Promise<ApiResponse<ParentPackage[]>>;
  getPackage: (storyId: number, packageId: number) => Promise<ApiResponse<ParentPackage>>;
  revisePackage: (
    storyId: number,
    pkg: ParentPackage,
    components: PackageComponents,
  ) => Promise<ApiResponse<ParentPackage>>;
  newOperationId?: () => string;
}

const defaultDeps: PackageReselectDeps = {
  getDraft: (storyId) => parentAuthoringService.get(storyId),
  finalizeContent: (storyId, cmd) => parentPackageService.finalize(storyId, cmd),
  createPackages: (storyId, cmd, recipients) =>
    parentPackageService.create(storyId, cmd, recipients),
  getPackage: (storyId, packageId) => parentPackageService.get(storyId, packageId),
  revisePackage: (storyId, pkg, components) =>
    parentPackageService.revise(storyId, pkg, components),
  newOperationId: () => crypto.randomUUID(),
};

export type ExecuteReselectResult =
  | { status: 'no_changes'; reusedCount: number }
  | { status: 'success'; revisedCount: number; createdCount: number; reusedCount: number }
  | { status: 'error'; message: string; succeededCount: number };

/**
 * Thực thi các lệnh diff-only: lấy token mới trước từng command, dừng ngay khi có lỗi
 * để không báo cả lượt thành công và không gửi lại các lệnh đã thành công.
 */
export async function executePackageReselect(
  storyId: number,
  plan: PackageReselectPlan,
  confirmFinalize: () => Promise<boolean>,
  deps: PackageReselectDeps = defaultDeps,
): Promise<ExecuteReselectResult> {
  if (!plan.hasChanges) {
    return { status: 'no_changes', reusedCount: plan.reused.length };
  }

  const nextOp = deps.newOperationId ?? (() => crypto.randomUUID());
  let succeededCount = 0;

  if (plan.needsFinalize) {
    const confirmed = await confirmFinalize();
    if (!confirmed) {
      return { status: 'error', message: '', succeededCount: 0 };
    }
  }

  const fetchVerifiedDraftCmd = async (): Promise<
    { ok: true; cmd: B.CreatorVersionCommand } | { ok: false; message: string }
  > => {
    const draftRes = await deps.getDraft(storyId);
    if (!draftRes.success || !draftRes.data) {
      return {
        ok: false,
        message: draftRes.message || 'Chưa tải được trạng thái bản nháp mới nhất.',
      };
    }
    if (
      plan.expectedStoryVersionId == null ||
      draftRes.data.story.selectedVersionId !== plan.expectedStoryVersionId
    ) {
      return {
        ok: false,
        message:
          'Nội dung truyện đã thay đổi ở phiên bản khác. Vui lòng tải lại trước khi lưu cấu hình gói.',
      };
    }
    return {
      ok: true,
      cmd: {
        operationId: nextOp(),
        revisionToken: draftRes.data.story.revisionToken,
        baseVersionId: draftRes.data.story.selectedVersionId,
      },
    };
  };

  if (plan.toRevise.length > 0) {
    const revCheck = await fetchVerifiedDraftCmd();
    if (!revCheck.ok) {
      return { status: 'error', message: revCheck.message, succeededCount };
    }
  }

  for (const item of plan.toRevise) {
    const fresh = await deps.getPackage(storyId, item.pkg.packageId);
    if (!fresh.success || !fresh.data) {
      return {
        status: 'error',
        message: fresh.message || 'Chưa tải được gói mới nhất.',
        succeededCount,
      };
    }
    const revised = await deps.revisePackage(storyId, fresh.data, item.components);
    if (!revised.success) {
      return {
        status: 'error',
        message: revised.message || 'Chưa tạo được bản gói mới.',
        succeededCount,
      };
    }
    succeededCount += 1;
  }

  if (plan.toCreate.length > 0) {
    if (plan.needsFinalize) {
      const fCmd = await fetchVerifiedDraftCmd();
      if (!fCmd.ok) {
        return { status: 'error', message: fCmd.message, succeededCount };
      }
      const fin = await deps.finalizeContent(storyId, fCmd.cmd);
      if (!fin.success) {
        return {
          status: 'error',
          message: fin.message || 'Chưa chốt được nội dung.',
          succeededCount,
        };
      }
    }

    const cCmd = await fetchVerifiedDraftCmd();
    if (!cCmd.ok) {
      return { status: 'error', message: cCmd.message, succeededCount };
    }
    const created = await deps.createPackages(storyId, cCmd.cmd, plan.toCreate);
    if (!created.success) {
      return {
        status: 'error',
        message: created.message || 'Chưa tạo được gói cho các bé.',
        succeededCount,
      };
    }
    succeededCount += plan.toCreate.length;
  }

  return {
    status: 'success',
    revisedCount: plan.toRevise.length,
    createdCount: plan.toCreate.length,
    reusedCount: plan.reused.length,
  };
}
