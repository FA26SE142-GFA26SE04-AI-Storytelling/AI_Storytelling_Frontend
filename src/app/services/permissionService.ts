import { apiRequest } from './apiClient';
import type { Permission } from '@/app/types/supervision';
export const permissionService = {
  catalog: (signal?: AbortSignal) => apiRequest<string[]>('/Permission','Không tải được danh mục quyền.',{signal}),
  list: (id: number) => apiRequest<string[]>(`/Permission/relationships/${id}`,'Không tải được quyền.'),
  grant: (id: number, permission: Permission) => apiRequest<null>(`/Permission/relationships/${id}/${permission}`,'Không cấp được quyền.',{method:'POST'}),
  revoke: (id: number, permission: Permission) => apiRequest<null>(`/Permission/relationships/${id}/${permission}`,'Không thu hồi được quyền.',{method:'DELETE'}),
};
