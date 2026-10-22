import type * as B from '@/app/types/backendContracts';
import { apiRequest, apiQuery } from './apiClient';
export const authoringGuideService = {
  get: (pageIndex = 1, purpose?: string, group?: string, signal?: AbortSignal) => apiRequest<B.GuidePage>(`/authoring-guides${apiQuery({ locale: 'vi', purpose, group, pageIndex, pageSize: 10 })}`, 'Không tải được hướng dẫn sáng tác.', { signal }),
  render: (guideId: string, body: B.RenderGuideRequest, signal?: AbortSignal) => apiRequest<B.RenderGuideResult>(`/authoring-guides/${encodeURIComponent(guideId)}/render`, 'Không áp dụng được gợi ý.', { method: 'POST', body, signal }),
};
