import type * as B from '@/app/types/backendContracts';
import { apiRequest, apiQuery } from './apiClient';
export type ReviewKind = 'PublicStoryReview' | 'RoadmapTemplateReview' | 'CommunitySubmission' | 'GrayZoneStory' | 'ContentReport' | 'PublicStoryRemoval';
export type ReviewPackage =
  | { kind: 'PublicStoryReview'; data: B.PublicReviewPackageDto }
  | { kind: 'RoadmapTemplateReview'; data: B.RoadmapReviewPackageDto }
  | { kind: 'CommunitySubmission'; data: B.CommunityReviewPackageDto }
  | { kind: 'GrayZoneStory'; data: B.GrayZoneReviewDto }
  | { kind: 'ContentReport'; data: B.ContentReportDetailDto }
  | { kind: 'PublicStoryRemoval'; data: B.ModerationItemDetailDto };
const roots: Record<ReviewKind, string> = { PublicStoryReview: '/PublicStoryReview', RoadmapTemplateReview: '/RoadmapReview', CommunitySubmission: '/CommunityReview', GrayZoneStory: '/moderation/gray-zone-stories', ContentReport: '/ContentReportReview', PublicStoryRemoval: '/ModerationQueue' };
const send = <T>(path: string, method: 'GET' | 'POST' | 'PUT' = 'GET', body?: unknown, signal?: AbortSignal) => apiRequest<T>(path, 'Không thực hiện được thao tác kiểm duyệt.', { method, body, signal });
export const moderationService = {
  grantReviewView: (body: B.GrantReviewViewRequestDto) => send<B.ModerationReviewViewDto>('/ModerationQueue/review-views','POST',body),
  async package(kind: ReviewKind, itemId: number, signal?: AbortSignal) {
    const r = await send<ReviewPackage['data']>(`${roots[kind]}/${itemId}`, 'GET', undefined, signal);
    return { ...r, data: r.data ? { kind, data: r.data } as ReviewPackage : null };
  },
  view: (id: number, partType: 'scene' | 'audio', partId: number) => send<B.PublicReviewProgressDto>(`/PublicStoryReview/${id}/views`, 'POST', { partType, partId }),
  resolveFlag: (id: number, flagId: string, reason: string) => send<B.PublicReviewFlagsResultDto>(`/PublicStoryReview/${id}/flags/resolve`, 'POST', { flagId, reason }),
  publicChecklist: (id: number, body: Partial<B.PublicReviewChecklistDto>) => send<B.PublicReviewChecklistDto>(`/PublicStoryReview/${id}/checklist`, 'PUT', body),
  labels: (kind: 'PublicStoryReview' | 'CommunitySubmission', id: number, contentCategoryIds: number[]) => send<unknown>(`${roots[kind]}/${id}/labels`, 'PUT', { contentCategoryIds }),
  publicChanges: (id: number, body: B.RequestChangesDto) => send<B.PublicReviewDecisionResultDto>(`/PublicStoryReview/${id}/request-changes`, 'POST', body),
  compare: (id: number, against: 'previous' | 'public') => send<B.PublicVersionComparisonDto>(`/PublicStoryReview/${id}/compare${apiQuery({ against })}`),
  approve: (kind: 'PublicStoryReview' | 'CommunitySubmission' | 'RoadmapTemplateReview', id: number) => send<unknown>(`${roots[kind]}/${id}/approve`, 'POST'),
  reject: (kind: 'PublicStoryReview' | 'CommunitySubmission' | 'RoadmapTemplateReview', id: number, reason: string) => send<unknown>(`${roots[kind]}/${id}/reject`, 'POST', { reason }),
  communityChecklist: (id: number, entries: B.CommunityChecklistEntryDto[]) => send<B.CommunityChecklistEntryDto[]>(`/CommunityReview/${id}/checklist`, 'PUT', { entries }),
  roadmapChecklist: (id: number, entries: B.RoadmapChecklistEntryDto[]) => send<B.RoadmapChecklistEntryDto[]>(`/RoadmapReview/${id}/checklist`, 'PUT', { entries }),
  roadmapChanges: (id: number, body: B.RequestRoadmapChangesDto) => send<B.RoadmapReviewDecisionResultDto>(`/RoadmapReview/${id}/request-changes`, 'POST', body),
  grayDecision: (id: number, body: B.GrayZoneDecisionRequest) => send<null>(`/moderation/gray-zone-stories/${id}/decision`, 'POST', body),
  reportDecision: (id: number, action: 'dismiss' | 'archive' | 'escalate', reason: string, archiveReason: 'SafetyConcern' | 'Copyright' | 'Inappropriate' = 'SafetyConcern') => send<B.ContentReportDecisionResultDto>(`/ContentReportReview/${id}/${action}`, 'POST', action === 'archive' ? { reason, archiveReason } : { reason }),
  removalDecision: (id: number, body: B.RemovalDecisionRequest) => send<B.CreatorPublicationResult>(`/moderation/public-story-removals/${id}/decision`, 'POST', body),
  published: (query: Partial<B.PublishedContentQueryDto> = {}, signal?: AbortSignal) => send<B.PagedResult<B.PublishedContentItemDto>>(`/PublishedContentReview${apiQuery(query)}`, 'GET', undefined, signal),
  publishedStory: (storyId: number) => send<B.PublishedStoryContentDto>(`/PublishedContentReview/stories/${storyId}`),
  publishedRoadmap: (roadmapId: number) => send<B.PublishedRoadmapDto>(`/PublishedContentReview/roadmaps/${roadmapId}`),
  createReviewItem: (body: B.CreateReviewItemRequestDto) => send<B.ContentReportResultDto>('/PublishedContentReview/review-items', 'POST', body),
};
