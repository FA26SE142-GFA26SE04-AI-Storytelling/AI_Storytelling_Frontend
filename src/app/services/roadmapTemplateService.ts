import type * as B from '@/app/types/backendContracts';
import { apiRequest, apiQuery } from './apiClient';
const send = <T>(path: string, method: 'GET' | 'POST' | 'PUT' = 'GET', body?: unknown, signal?: AbortSignal) => apiRequest<T>('/RoadmapTemplate' + path, 'Không thực hiện được thao tác bộ truyện.', { method, body, signal });
export const roadmapTemplateService = {
  list: (group: B.RoadmapListGroupName, pageIndex = 1, signal?: AbortSignal) => send<B.PagedResult<B.RoadmapListItemDto>>(apiQuery({ group, pageIndex, pageSize: 20 }), 'GET', undefined, signal),
  get: (id: number, signal?: AbortSignal) => send<B.RoadmapDetailDto>(`/${id}`, 'GET', undefined, signal),
  candidates: (query: Partial<B.CandidateQueryDto> = {}, signal?: AbortSignal) => send<B.PagedResult<B.CandidateStoryDto>>(`/candidates${apiQuery(query)}`, 'GET', undefined, signal),
  create: (body: B.SaveRoadmapRequestDto) => send<B.RoadmapDetailDto>('', 'POST', body),
  update: (id: number, body: B.SaveRoadmapRequestDto) => send<B.RoadmapDetailDto>(`/${id}`, 'PUT', body),
  items: (id: number, items: B.RoadmapItemInputDto[]) => send<B.RoadmapDetailDto>(`/${id}/items`, 'PUT', { items }),
  submit: (id: number) => send<B.RoadmapSubmitResultDto>(`/${id}/submit`, 'POST'),
  withdraw: (id: number) => send<B.RoadmapSubmitResultDto>(`/${id}/withdraw`, 'POST'),
  clone: (id: number) => send<B.RoadmapCloneResultDto>(`/${id}/clone`, 'POST'),
  archive: (id: number, reason: string) => send<B.RoadmapDetailDto>(`/${id}/archive`, 'POST', { reason }),
};
