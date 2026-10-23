import type { AuthoringGuide, GuidePage, RenderGuideResult } from '@/app/types/backendContracts';
export interface GuideVersionSummary {
  versionId: number; versionNo: number; catalogVersion: string; status: string; itemCount: number;
  createdByUserId: number | null; createdAt: string; updatedByUserId: number | null; updatedAt: string | null;
  publishedByUserId: number | null; publishedAt: string | null;
}
export interface GuideVersionDetail { version: GuideVersionSummary; schemaVersion: number; items: AuthoringGuide[] }
export interface GuideManagementOverview { locale: string; audienceRole: string; revisionToken: string; published: GuideVersionDetail | null; draft: GuideVersionDetail | null }
export interface UpsertGuideItemRequest extends Omit<AuthoringGuide, 'id' | 'audienceRole'> { revisionToken: string }
export interface PreviewGuideDraftRequest {
  revisionToken: string; purpose?: string | null; group?: string | null; pageIndex?: number; pageSize?: number;
  guideId?: string | null; values?: Record<string, string> | null;
}
export interface GuideDraftChange { revisionToken: string; draft: GuideVersionSummary }
export interface GuideDraftPreview { revisionToken: string; page: GuidePage | null; render: RenderGuideResult | null }
export interface GuidePublishResult { revisionToken: string; published: GuideVersionSummary }
export interface GuideDraftDiscard { revisionToken: string; discardedVersionId: number; discardedCatalogVersion: string }
