import type { PermissionDto } from '@/app/types/accessControl';

/** Thứ tự nhóm giống danh mục backend (PermissionCatalog.GroupOrder). */
export const GROUP_ORDER = ['Phụ huynh', 'Dùng chung', 'Creator', 'Kiểm duyệt', 'Quản trị'];

const groupRank = (group: string) => {
  const index = GROUP_ORDER.indexOf(group);
  return index < 0 ? GROUP_ORDER.length : index;
};

export function groupPermissions(list: PermissionDto[]): { group: string; items: PermissionDto[] }[] {
  const groups = new Map<string, PermissionDto[]>();
  for (const item of list) groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
  return [...groups.entries()]
    .sort(([a], [b]) => groupRank(a) - groupRank(b) || a.localeCompare(b))
    .map(([group, items]) => ({ group, items: [...items].sort((x, y) => (x.code < y.code ? -1 : x.code > y.code ? 1 : 0)) }));
}

export function changedCodes(saved: string[], draft: string[]): { added: string[]; removed: string[] } {
  const before = new Set(saved);
  const after = new Set(draft);
  return {
    added: [...after].filter((code) => !before.has(code)).sort(),
    removed: [...before].filter((code) => !after.has(code)).sort(),
  };
}

/** Quyền role chưa được cấp (ngoài `assignableCodes` backend trả về): chỉ được thu hoặc trả lại quyền mặc định. */
export function lockedCodes(catalog: PermissionDto[], assignable: string[]): Set<string> {
  const allowed = new Set(assignable);
  return new Set(catalog.filter((p) => !allowed.has(p.code)).map((p) => p.code));
}
