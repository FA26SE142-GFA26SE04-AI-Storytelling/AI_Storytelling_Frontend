import type { PermissionDto, RolePermissionsDto } from '@/app/types/accessControl';

export function changedCodes(saved: string[], draft: string[]): { added: string[]; removed: string[] } {
  const before = new Set(saved);
  const after = new Set(draft);
  return {
    added: [...after].filter((code) => !before.has(code)).sort(),
    removed: [...before].filter((code) => !after.has(code)).sort(),
  };
}

const SCOPE_LABELS: Record<string, string> = { Any: 'Tất cả', Own: 'Của mình', Assigned: 'Mục đã nhận' };

/** Nhãn phạm vi áp quyền; thiếu hoặc lạ thì coi là áp cho tất cả. */
export function scopeLabel(scope?: string): string {
  return SCOPE_LABELS[scope ?? 'Any'] ?? SCOPE_LABELS.Any;
}

/** Nhãn ngắn của điều kiện (mã do backend định nghĩa); câu đầy đủ lấy từ `conditions` của role. */
export const CONDITION_LABELS: Record<string, string> = {
  NotOwnContent: 'Không tự duyệt',
  AdminFallback: 'Dự phòng',
  NoActiveModerator: 'Khi hết KDV',
  OwnChildProfile: 'Của mình',
  OwnCreatorStory: 'Truyện của mình',
  PlanLimits: 'Theo gói',
  DelegatedApproval: 'Cần ủy quyền',
  ParentalGate: 'Parental Gate',
};

export const conditionLabel = (code: string) => CONDITION_LABELS[code] ?? code;

export type Condition = { code: string; label: string; text: string };

/** Điều kiện của một quyền theo role: ghép mã với câu mô tả cùng vị trí. */
export function conditionsOf(data: RolePermissionsDto | undefined, permission: string): Condition[] {
  const codes = data?.conditionCodes?.[permission] ?? [];
  const texts = data?.conditions?.[permission] ?? [];
  return codes.map((code, i) => ({ code, label: conditionLabel(code), text: texts[i] ?? code }));
}

/** Khu vực hiển thị: tách nhóm Kiểm duyệt thành xử lý hàng đợi và cấu hình/xem; đổi tên nhóm trùng tên role. */
export const SECTION_ORDER = [
  'Việc của phụ huynh', 'Dùng chung', 'Việc của nhà sáng tạo',
  'Kiểm duyệt – xử lý hàng đợi', 'Kiểm duyệt – cấu hình và xem', 'Quản trị',
];

export function sectionOf(p: PermissionDto): string {
  switch (p.group) {
    case 'Phụ huynh': return SECTION_ORDER[0];
    case 'Dùng chung': return SECTION_ORDER[1];
    case 'Creator': return SECTION_ORDER[2];
    case 'Kiểm duyệt': return p.scope === 'Assigned' ? SECTION_ORDER[3] : SECTION_ORDER[4];
    case 'Quản trị': return SECTION_ORDER[5];
    default: return p.group;
  }
}

export function sectionPermissions(list: PermissionDto[]): { section: string; items: PermissionDto[] }[] {
  const sections = new Map<string, PermissionDto[]>();
  for (const item of list) {
    const key = sectionOf(item);
    sections.set(key, [...(sections.get(key) ?? []), item]);
  }
  const rank = (s: string) => (SECTION_ORDER.indexOf(s) < 0 ? SECTION_ORDER.length : SECTION_ORDER.indexOf(s));
  return [...sections.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([section, items]) => ({ section, items: [...items].sort((x, y) => x.description.localeCompare(y.description, 'vi')) }));
}

/** Quyền khác bản gán mặc định (đã bị thu hoặc được trả thêm). Backend cũ chưa trả mặc định thì không đánh dấu. */
export function differsFromDefault(data: RolePermissionsDto | undefined): Set<string> {
  if (!data?.defaultCodes) return new Set();
  const { added, removed } = changedCodes(data.defaultCodes, data.permissionCodes);
  return new Set([...added, ...removed]);
}

export type CellState = 'on' | 'off' | 'na';
export type MatrixCell = { state: CellState; changed: boolean; conditions: Condition[] };

/** Ô ma trận: bật / tắt nhưng bật lại được / không áp dụng cho role. */
export function matrixCell(data: RolePermissionsDto | undefined, permission: string): MatrixCell {
  if (!data) return { state: 'na', changed: false, conditions: [] };
  const held = data.permissionCodes.includes(permission);
  const assignable = data.assignableCodes ? data.assignableCodes.includes(permission) : held;
  const state: CellState = held ? 'on' : assignable ? 'off' : 'na';
  return { state, changed: differsFromDefault(data).has(permission), conditions: state === 'na' ? [] : conditionsOf(data, permission) };
}

/** Quyền role có thể bật/tắt trên trang Chỉnh role. */
export function editableCodes(data: RolePermissionsDto | undefined): Set<string> {
  return new Set(data?.assignableCodes ?? data?.permissionCodes ?? []);
}

/** Mọi điều kiện xuất hiện trong ma trận, mỗi mã một lần (chú thích dưới bảng). */
export function conditionLegend(all: (RolePermissionsDto | undefined)[]): Condition[] {
  const seen = new Map<string, Condition>();
  for (const data of all) {
    for (const permission of Object.keys(data?.conditionCodes ?? {})) {
      for (const condition of conditionsOf(data, permission)) if (!seen.has(condition.code)) seen.set(condition.code, condition);
    }
  }
  return [...seen.values()];
}

/** Một lần sửa quyền trong audit log: before/after là danh sách mã quyền dạng JSON. */
export function historyChange(beforeState: string | null, afterState: string | null): { added: string[]; removed: string[] } {
  const parse = (raw: string | null): string[] => {
    if (!raw) return [];
    try {
      const value = JSON.parse(raw);
      return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  };
  return changedCodes(parse(beforeState), parse(afterState));
}
