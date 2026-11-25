import type { PermissionAccessDto, PermissionDto, RoleDto, RolePermissionsDto } from '@/app/types/accessControl';
import { apiRequest } from './apiClient';

/** Administrator: danh mục quyền và quyền của role nhân viên. */
export const accessControlService = {
  /** Quyền của chính tài khoản đang đăng nhập kèm trạng thái và lý do, để ẩn hoặc khoá nút. */
  mine: () => apiRequest<PermissionAccessDto[]>('/Auth/me/access', 'Không tải được quyền của tài khoản.'),
  permissions: () => apiRequest<PermissionDto[]>('/admin/permissions', 'Không tải được danh mục quyền.'),
  roles: () => apiRequest<RoleDto[]>('/admin/roles', 'Không tải được danh sách role.'),
  rolePermissions: (code: string) =>
    apiRequest<RolePermissionsDto>(`/admin/roles/${encodeURIComponent(code)}/permissions`, 'Không tải được quyền của role.'),
  updateRolePermissions: (code: string, permissionCodes: string[]) =>
    apiRequest<RolePermissionsDto>(`/admin/roles/${encodeURIComponent(code)}/permissions`, 'Không cập nhật được quyền.',
      { method: 'PUT', body: { permissionCodes } }),
};
