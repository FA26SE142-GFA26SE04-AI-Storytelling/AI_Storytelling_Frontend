import type { ContentCategory } from '@/app/types/childProfile';
import { apiRequest } from './apiClient';
export const contentCategoryService = {
  get: (id: number) => apiRequest<ContentCategory>(`/ContentCategory/${id}`,'Không tải được danh mục.'),
  remove: (id: number) => apiRequest<null>(`/ContentCategory/${id}`,'Không xóa được danh mục.',{method:'DELETE'}),
};
