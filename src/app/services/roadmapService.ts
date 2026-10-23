import type * as B from '@/app/types/backendContracts';
import { apiQuery, apiRequest } from './apiClient';

const request = <T>(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: unknown, signal?: AbortSignal) =>
  apiRequest<T>(path, 'Không tải hoặc cập nhật được lộ trình.', { method, body, signal });
export const roadmapService = {
  get: (childId: number, signal?: AbortSignal) => request<B.ChildRoadmapDto>(`/ChildRoadmap/${childId}`, 'GET', undefined, signal),
  add: (body: B.AddRoadmapStoryRequestDto) => request<B.AddRoadmapStoryResultDto>('/ChildRoadmap/stories', 'POST', body),
  remove: (childId: number, itemId: number) => request<B.ChildRoadmapDto>(`/ChildRoadmap/${childId}/items/${itemId}`, 'DELETE'),
  reorder: (childId: number, itemIds: number[]) => request<B.ChildRoadmapDto>(`/ChildRoadmap/${childId}/order`, 'PUT', { itemIds }),
  clear: (childId: number) => request<B.ChildRoadmapDto>(`/ChildRoadmap/${childId}/items`, 'DELETE'),
  library: (query: Partial<B.RoadmapLibraryQueryDto> = {}, signal?: AbortSignal) => request<B.PagedResult<B.RoadmapLibraryItemDto>>(`/RoadmapLibrary${apiQuery(query)}`, 'GET', undefined, signal),
  detail: (id: number) => request<B.RoadmapLibraryDetailDto>(`/RoadmapLibrary/${id}`),
  preview: (id: number, body: B.RoadmapCopyRequestDto) => request<B.RoadmapCopyPlanDto>(`/RoadmapLibrary/${id}/preview`, 'POST', body),
  copy: (id: number, body: B.RoadmapCopyRequestDto) => request<B.RoadmapCopyPlanDto>(`/RoadmapLibrary/${id}/copy`, 'POST', body),
  mine: (token: string, signal?: AbortSignal) => apiRequest<B.MyRoadmapDto>('/MyRoadmap', 'Không tải được lộ trình của bé.', { token, session: 'child', signal }),
};
