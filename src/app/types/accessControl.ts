/** DTO phân quyền của backend (`api/v1/admin/permissions`, `api/v1/admin/roles`). */
export interface PermissionDto {
  code: string;
  group: string;
  description: string;
  isStaffGrantable: boolean;
  /** Phạm vi áp quyền: `Any` (tất cả), `Own` (của mình), `Assigned` (mục đang do mình nhận). Backend cũ chưa trả. */
  scope?: string;
}

/** Quyền của tài khoản đang đăng nhập (`GET Auth/me/access`). */
export interface PermissionAccessDto {
  code: string;
  state: string;
  reason: string | null;
}

export interface RoleDto {
  /** Id role, khớp `entityId` của audit log `RolePermissionsUpdated`. Backend cũ chưa trả. */
  id?: number;
  code: string;
  name: string;
  isStaff: boolean;
}

export interface RolePermissionsDto {
  roleCode: string;
  permissionCodes: string[];
  /** Quyền role được bật: mặc định của role + quyền đang giữ. Ngoài tập này backend từ chối. */
  assignableCodes?: string[];
  /** Điều kiện kèm theo khi role này dùng quyền (câu tiếng Việt), chỉ gồm quyền có điều kiện. Chỉ đọc. */
  conditions?: Record<string, string[]>;
  /** Mã điều kiện theo quyền, cùng thứ tự với `conditions`. */
  conditionCodes?: Record<string, string[]>;
  /** Bản gán mặc định của role. */
  defaultCodes?: string[];
  /** Phạm vi theo role cho từng quyền assignable (`Any` / `Own` / `Assigned`). */
  scopes?: Record<string, string>;
}
