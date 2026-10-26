import type * as B from '@/app/types/backendContracts';
import { apiRequest } from './apiClient';
export const storyManagementService = {
  create: (body: B.CreateStoryRequestDto) => apiRequest<B.StoryDto>('/Story','Không tạo được truyện.',{method:'POST',body}),
  update: (id: number, body: B.Stories_UpdateStoryRequestDto) => apiRequest<B.StoryDto>(`/Story/${id}`,'Không lưu được truyện.',{method:'PUT',body}),
  remove: (id: number) => apiRequest<boolean>(`/Story/${id}`,'Không xóa được truyện.',{method:'DELETE'}),
  publish: (id: number) => apiRequest<boolean>(`/Story/${id}/publish`,'Không phát hành được truyện.',{method:'PATCH'}),
};
