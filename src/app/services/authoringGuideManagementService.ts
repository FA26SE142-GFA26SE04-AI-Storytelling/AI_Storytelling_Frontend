import type * as G from '@/app/types/authoringGuideManagement';
import type { PagedResult } from '@/app/types/backendContracts';
import { apiRequest, apiQuery } from './apiClient';
const root = '/moderation/authoring-guides';
const fallback = 'Không cập nhật được hướng dẫn sáng tác.';
export const authoringGuideManagementService = {
  overview: (signal?: AbortSignal) => apiRequest<G.GuideManagementOverview>(root, fallback, { signal }),
  versions: (pageIndex = 1, signal?: AbortSignal) => apiRequest<PagedResult<G.GuideVersionSummary>>(`${root}/versions${apiQuery({ pageIndex, pageSize:20 })}`, fallback, { signal }),
  version: (id: number, signal?: AbortSignal) => apiRequest<G.GuideVersionDetail>(`${root}/versions/${id}`, fallback, { signal }),
  createDraft: (sourceVersionId: number | null) => apiRequest<G.GuideDraftChange>(`${root}/draft`, fallback, { method:'POST', body:{ sourceVersionId } }),
  upsert: (guideId: string, body: G.UpsertGuideItemRequest) => apiRequest<G.GuideDraftChange>(`${root}/draft/items/${encodeURIComponent(guideId)}`, fallback, { method:'PUT', body }),
  remove: (guideId: string, revisionToken: string) => apiRequest<G.GuideDraftChange>(`${root}/draft/items/${encodeURIComponent(guideId)}${apiQuery({ revisionToken })}`, fallback, { method:'DELETE' }),
  discard: (revisionToken: string) => apiRequest<G.GuideDraftDiscard>(`${root}/draft${apiQuery({ revisionToken })}`, fallback, { method:'DELETE' }),
  preview: (body: G.PreviewGuideDraftRequest) => apiRequest<G.GuideDraftPreview>(`${root}/draft/preview`, fallback, { method:'POST', body }),
  publish: (revisionToken: string) => apiRequest<G.GuidePublishResult>(`${root}/draft/publish`, fallback, { method:'POST', body:{ revisionToken } }),
};
