import { USE_MOCK } from '@/app/mocks/config';
import type { ApiResponse } from '@/app/types/auth';
import type {
  AppNotification, CommunitySubmission, ContentReport, Dashboard, InterventionCase, ProgressReport, ReadCompletion, ReportReason,
  RoadmapAddResult, RoadmapItem, RoadmapPosition, RoadmapStoryInput, RoadmapTemplate,
} from '@/app/types/progress';
import type { StoryWish } from '@/app/types/reading';
import { apiRequest } from './apiClient';
import { guardianLocal, type ChildRef } from './guardianLocal';
import { notificationLocal } from './notificationLocal';
import { staffLocal } from './staffLocal';

/**
 * Luồng 4 (và phần phụ huynh của Luồng 2 mục 3.5) — dịch vụ phía phụ huynh.
 *
 * HỢP ĐỒNG API ĐỀ XUẤT (backend chưa có — xem docs/FRONTEND_PROGRESS.md, "Luồng 4 — cần backend bổ sung"):
 *   GET    /children/{id}/dashboard                         → Dashboard (khối theo quyền LIVE)
 *   GET    /children/{id}/roadmap                           → RoadmapItem[]
 *   POST   /roadmap/items                                   { childProfileIds, storyId, position, dueDays, note } → RoadmapAddResult
 *   DELETE /roadmap/items/{itemId}
 *   PUT    /children/{id}/roadmap/order                     { itemIds }   (chỉ các truyện đang chờ)
 *   POST   /children/{id}/roadmap/clear
 *   GET    /roadmap-templates                               → RoadmapTemplate[] (đã Published)
 *   POST   /roadmap-templates/{id}/apply                    { childProfileIds, position, daysPerStep } → RoadmapAddResult
 *   GET    /children/{id}/intervention                      → InterventionCase | null
 *   POST   /intervention-cases/{id}/unlock                  { skillGapNotes }
 *   PUT    /intervention-cases/{id}/notes                   { skillGapNotes }
 *   GET    /children/{id}/read-completions                  → ReadCompletion[];  PUT /read-completions/{id}/seen
 *   GET    /children/{id}/progress-reports                  → ProgressReport[]
 *   GET    /children/{id}/wishes                            → StoryWish[]
 *   POST   /wishes/{id}/fulfill-with-existing {storyId} · /accept · /decline   (Luồng 2 mục 11)
 *   POST   /content-reports                                 { storyId, reason, description }
 *   GET    /stories/{id}/moderation-status                  → { reports, submission }
 *   POST   /community-submissions                           { storyId, piiAttested }
 *   POST   /community-submissions/{id}/withdraw
 * Thông báo dùng API đã có: GET /Notification, PUT /Notification/{id}/read, PUT /Notification/read-all.
 */

let backendReady: boolean | null = USE_MOCK ? false : null;

async function call<T>(path: string, fallback: () => ApiResponse<T>, opts: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown } = {}): Promise<ApiResponse<T>> {
  if (backendReady === false) return fallback();
  const r = await apiRequest<T>(path, 'Không kết nối được.', opts);
  if (r.success) { backendReady = true; return r; }
  if (backendReady === null) { backendReady = false; return fallback(); }
  return r;
}

export type { ChildRef };

export const guardianService = {
  isLocal: () => backendReady === false,

  dashboard: (childId: number): Promise<ApiResponse<Dashboard>> => call(`/children/${childId}/dashboard`, () => guardianLocal.dashboard(childId)),

  roadmap: (childId: number): Promise<ApiResponse<RoadmapItem[]>> => call(`/children/${childId}/roadmap`, () => guardianLocal.roadmap(childId)),

  addToRoadmap: (children: ChildRef[], story: RoadmapStoryInput, position: RoadmapPosition, dueDays: number | null, note: string | null): Promise<ApiResponse<RoadmapAddResult>> =>
    call('/roadmap/items', () => guardianLocal.addToRoadmap(children, story, position, { dueDays, note }), { method: 'POST', body: { childProfileIds: children.map((c) => c.id), storyId: story.storyId, position, dueDays, note } }),

  removeFromRoadmap: (childId: number, itemId: number): Promise<ApiResponse<null>> =>
    call(`/roadmap/items/${itemId}`, () => guardianLocal.removeFromRoadmap(childId, itemId), { method: 'DELETE' }),

  reorderRoadmap: (childId: number, queuedIds: number[]): Promise<ApiResponse<null>> =>
    call(`/children/${childId}/roadmap/order`, () => guardianLocal.reorderRoadmap(childId, queuedIds), { method: 'PUT', body: { itemIds: queuedIds } }),

  clearRoadmap: (childId: number): Promise<ApiResponse<null>> =>
    call(`/children/${childId}/roadmap/clear`, () => guardianLocal.clearRoadmap(childId), { method: 'POST' }),

  templates: (): Promise<ApiResponse<RoadmapTemplate[]>> =>
    call('/roadmap-templates', () => ({ ...guardianLocal.templates(), data: [...staffLocal.publishedTemplates(), ...(guardianLocal.templates().data ?? [])] })),

  applyTemplate: (children: ChildRef[], template: RoadmapTemplate, position: RoadmapPosition, daysPerStep: number | null): Promise<ApiResponse<RoadmapAddResult>> =>
    call(`/roadmap-templates/${template.id}/apply`, () => guardianLocal.applyTemplate(children, template, position, daysPerStep), { method: 'POST', body: { childProfileIds: children.map((c) => c.id), position, daysPerStep } }),

  holdCase: (childId: number): Promise<ApiResponse<InterventionCase | null>> => call(`/children/${childId}/intervention`, () => guardianLocal.holdCase(childId)),

  unlockHold: (childId: number, caseId: number, notes: string): Promise<ApiResponse<null>> =>
    call(`/intervention-cases/${caseId}/unlock`, () => guardianLocal.unlockHold(childId, notes), { method: 'POST', body: { skillGapNotes: notes || null } }),

  addHoldNotes: (childId: number, caseId: number, notes: string): Promise<ApiResponse<null>> =>
    call(`/intervention-cases/${caseId}/notes`, () => guardianLocal.addHoldNotes(childId, notes), { method: 'PUT', body: { skillGapNotes: notes } }),

  completions: (childId: number): Promise<ApiResponse<ReadCompletion[]>> => call(`/children/${childId}/read-completions`, () => guardianLocal.completions(childId)),
  markCompletionSeen: (childId: number, id: number): Promise<ApiResponse<null>> =>
    call(`/read-completions/${id}/seen`, () => guardianLocal.markCompletionSeen(childId, id), { method: 'PUT' }),

  reports: (childId: number): Promise<ApiResponse<ProgressReport[]>> => call(`/children/${childId}/progress-reports`, () => guardianLocal.reports(childId)),

  wishes: (childId: number): Promise<ApiResponse<(StoryWish & { label: string })[]>> => call(`/children/${childId}/wishes`, () => guardianLocal.wishes(childId)),
  fulfillWishWithStory: (child: ChildRef, wishId: number, story: RoadmapStoryInput): Promise<ApiResponse<null>> =>
    call(`/wishes/${wishId}/fulfill-with-existing`, () => guardianLocal.fulfillWishWithStory(child, wishId, story), { method: 'POST', body: { storyId: story.storyId } }),
  acceptWish: (childId: number, wishId: number): Promise<ApiResponse<null>> =>
    call(`/wishes/${wishId}/accept`, () => guardianLocal.decideWish(childId, wishId, 'accepted'), { method: 'POST' }),
  declineWish: (childId: number, wishId: number, note: string): Promise<ApiResponse<null>> =>
    call(`/wishes/${wishId}/decline`, () => guardianLocal.decideWish(childId, wishId, 'declined'), { method: 'POST', body: { declineNote: note || null } }),

  reportStory: (storyId: number, reason: ReportReason, description: string): Promise<ApiResponse<ContentReport>> =>
    call('/content-reports', () => guardianLocal.reportStory(storyId, reason, description), { method: 'POST', body: { storyId, reason, description } }),

  storyModeration: (storyId: number): Promise<ApiResponse<{ reports: ContentReport[]; submission: CommunitySubmission | null }>> =>
    call(`/stories/${storyId}/moderation-status`, () => guardianLocal.storyModeration(storyId)),

  submitCommunity: (storyId: number): Promise<ApiResponse<CommunitySubmission>> =>
    call('/community-submissions', () => guardianLocal.submitCommunity(storyId), { method: 'POST', body: { storyId, piiAttested: true } }),

  withdrawCommunity: (submissionId: number): Promise<ApiResponse<null>> =>
    call(`/community-submissions/${submissionId}/withdraw`, () => guardianLocal.withdrawCommunity(submissionId), { method: 'POST' }),

  // ---------- Thông báo (API đã có ở backend) ----------
  async notifications(): Promise<ApiResponse<AppNotification[]>> {
    if (USE_MOCK) return { success: true, message: '', data: notificationLocal.list() };
    const r = await apiRequest<AppNotification[]>('/Notification', 'Không tải được thông báo.');
    // Gộp thêm thông báo từ bộ máy cục bộ khi các luồng khác chưa có backend.
    return r.success ? { ...r, data: [...notificationLocal.list(), ...(r.data ?? [])] } : r;
  },
  async markNotificationRead(n: AppNotification): Promise<void> {
    if (USE_MOCK || notificationLocal.list().includes(n)) { notificationLocal.markRead(n.id); return; }
    await apiRequest(`/Notification/${n.id}/read`, '', { method: 'PUT' });
  },
  async markAllNotificationsRead(): Promise<void> {
    notificationLocal.markAllRead();
    if (!USE_MOCK) await apiRequest('/Notification/read-all', '', { method: 'PUT' });
  },
};
