/** DTO phân quyền của backend (`api/v1/admin/permissions`, `api/v1/admin/roles`). */
export interface PermissionDto {
  code: string;
  group: string;
  description: string;
  isStaffGrantable: boolean;
}

export interface RoleDto {
  code: string;
  name: string;
  isStaff: boolean;
}

export interface RolePermissionsDto {
  roleCode: string;
  permissionCodes: string[];
}
