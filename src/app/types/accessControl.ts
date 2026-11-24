/** DTO phân quyền của backend (`api/v1/admin/permissions`, `api/v1/admin/roles`). */
export interface PermissionDto {
  code: string;
  group: string;
  description: string;
  isStaffGrantable: boolean;
  /** Phạm vi áp quyền: `Any` (tất cả), `Own` (của mình), `Assigned` (mục đang do mình nhận). Backend cũ chưa trả. */
  scope?: string;
}

export interface RoleDto {
  code: string;
  name: string;
  isStaff: boolean;
}

export interface RolePermissionsDto {
  roleCode: string;
  permissionCodes: string[];
  /** Quyền nhân viên role được bật: mặc định của role + quyền đang giữ. Ngoài tập này backend từ chối. */
  assignableCodes?: string[];
  /** Điều kiện kèm theo khi role này dùng quyền (câu tiếng Việt), chỉ gồm quyền có điều kiện. Chỉ đọc. */
  conditions?: Record<string, string[]>;
}
