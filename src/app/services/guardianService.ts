import { unavailable } from './unavailable';
import type { ApiResponse } from '@/app/types/auth';
import type {
  AppNotification, ChildRef, CommunitySubmission, ContentReport, Dashboard, InterventionCase, ProgressReport, ReadCompletion, ReportReason,
  RoadmapAddResult, RoadmapItem, RoadmapPosition, RoadmapStoryInput, RoadmapTemplate,
} from '@/app/types/progress';
import { apiRequest } from './apiClient';
import { roadmapService } from './roadmapService';
import { roadmapItems, roadmapAddResult, roadmapTemplate, roadmapCopyResult } from './roadmapAdapters';
import { communityService } from './communityService';
import type * as B from '@/app/types/backendContracts';

/** Parent workspace facade: available operations always use the Core API. */

const communityItem = (s: B.CommunitySubmissionDto): CommunitySubmission => ({ id: s.itemId, storyId: s.storyId, status: s.status.toLowerCase() as CommunitySubmission['status'], createdAt: s.submittedAt, canWithdraw: s.canWithdraw, canRemove: s.canRemove, rejectReason: s.rejectReason });
const positionWire = (p: RoadmapPosition) => p === 'next' ? 'NextUp' as const : 'End' as const;
const reportReasons = { safety_concern: 'SafetyConcern', inappropriate: 'Inappropriate', wrong_age_band: 'WrongAgeBand', copyright: 'Copyright', cultural: 'Cultural', other: 'Other' } as const;

export type { ChildRef };

export const guardianService = {

  dashboard: (childId: number): Promise<ApiResponse<Dashboard>> => unavailable('tính năng này', [childId]),

  async roadmap(childId: number): Promise<ApiResponse<RoadmapItem[]> & { counts?: { completed: number; total: number } }> {
    const r = await roadmapService.get(childId);
    return { ...r, data: r.data ? roadmapItems(r.data) : null, counts: r.data ? { completed: r.data.completedCount, total: r.data.totalCount } : undefined };
  },
  async addToRoadmap(children: ChildRef[], story: RoadmapStoryInput, position: RoadmapPosition, dueDays: number | null, note: string | null): Promise<ApiResponse<RoadmapAddResult>> {
    const r = await roadmapService.add({ storyId: story.storyId, childProfileIds: children.map(c => c.id), position: positionWire(position), expectedDays: dueDays, note });
    return { ...r, data: r.data ? roadmapAddResult(r.data, children) : null };
  },
  async removeFromRoadmap(childId: number, itemId: number): Promise<ApiResponse<null>> {
    const r = await roadmapService.remove(childId, itemId); return { ...r, data: null };
  },
  async reorderRoadmap(childId: number, itemIds: number[]): Promise<ApiResponse<null>> {
    const r = await roadmapService.reorder(childId, itemIds); return { ...r, data: null };
  },
  async clearRoadmap(childId: number): Promise<ApiResponse<null>> {
    const r = await roadmapService.clear(childId); return { ...r, data: null };
  },
  async templates(): Promise<ApiResponse<RoadmapTemplate[]>> {
    const items: RoadmapTemplate[] = [];
    for (let pageIndex = 1; ; pageIndex++) {
      const r = await roadmapService.library({ pageIndex, pageSize: 20 });
      if (!r.success || !r.data) return { ...r, data: null };
      const details = await Promise.all(r.data.items.map(i => roadmapService.detail(i.id)));
      const failure = details.find(d => !d.success || !d.data);
      if (failure) return { ...failure, data: null };
      items.push(...details.flatMap(d => d.data ? [roadmapTemplate(d.data)] : []));
      if (!r.data.hasNextPage) return { ...r, data: items };
    }
  },
  previewTemplate: (children: ChildRef[], template: RoadmapTemplate, position: RoadmapPosition, daysPerStory: number | null) =>
    roadmapService.preview(template.id, { childProfileIds: children.map(c => c.id), position: positionWire(position), daysPerStory }),
  async applyTemplate(children: ChildRef[], template: RoadmapTemplate, position: RoadmapPosition, daysPerStory: number | null): Promise<ApiResponse<RoadmapAddResult>> {
    const r = await roadmapService.copy(template.id, { childProfileIds: children.map(c => c.id), position: positionWire(position), daysPerStory });
    return { ...r, data: r.data ? roadmapCopyResult(r.data, children) : null };
  },

  holdCase: (childId: number): Promise<ApiResponse<InterventionCase | null>> => unavailable('tính năng này', [childId]),

  unlockHold: (childId: number, caseId: number, notes: string): Promise<ApiResponse<null>> =>
    unavailable('tính năng này', [childId,caseId,notes]),

  addHoldNotes: (childId: number, caseId: number, notes: string): Promise<ApiResponse<null>> =>
    unavailable('tính năng này', [childId,caseId,notes]),

  completions: (childId: number): Promise<ApiResponse<ReadCompletion[]>> => unavailable('tính năng này', [childId]),
  markCompletionSeen: (childId: number, id: number): Promise<ApiResponse<null>> =>
    unavailable('tính năng này', [childId,id]),

  reports: (childId: number): Promise<ApiResponse<ProgressReport[]>> => unavailable('tính năng này', [childId]),

  // Điều ước của bé: xem storyWishService (parentWishService).

  async reportStory(storyId: number, reason: ReportReason, description: string): Promise<ApiResponse<ContentReport>> {
    const r = await apiRequest<B.ContentReportResultDto>('/ContentReport', 'Không gửi được báo cáo.', { method: 'POST', body: { storyId, reason: reportReasons[reason], description: description || null } });
    return { ...r, data: r.data ? { id: r.data.reportId, storyId: r.data.storyId, reason, description, status: r.data.status.toLowerCase() as ContentReport['status'], createdAt: r.data.createdAt } : null };
  },
  async storyModeration(storyId: number): Promise<ApiResponse<{ reports: ContentReport[]; submission: CommunitySubmission | null }>> {
    const r = await communityService.mine();
    return { ...r, data: r.data ? { reports: [], submission: r.data.filter(s => s.storyId === storyId).sort((a,b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt)).map(communityItem)[0] ?? null } : null };
  },
  async submitCommunity(storyId: number, confirmNoPersonalInfo = false, ownWork = false): Promise<ApiResponse<CommunitySubmission>> {
    const r = await communityService.submit({ storyId, confirmNoPersonalInfo, copyrightDeclaration: ownWork ? 2 : null });
    if (!r.success || !r.data) return { ...r, data: null };
    // Fetch server timestamps/permissions instead of manufacturing a submission record.
    const mine = await communityService.mine();
    return mine.success && mine.data ? { ...r, data: mine.data.map(communityItem).find(s => s.id === r.data!.itemId) ?? null } : { ...r, data: null };
  },
  async withdrawCommunity(itemId: number): Promise<ApiResponse<null>> {
    const r = await communityService.withdraw(itemId); return { ...r, data: null };
  },
  async removeCommunity(itemId: number): Promise<ApiResponse<null>> {
    const r = await communityService.remove(itemId); return { ...r, data: null };
  },

  // ---------- Thông báo (API đã có ở backend) ----------
  async notifications(): Promise<ApiResponse<AppNotification[]>> {
    const r = await apiRequest<AppNotification[]>('/Notification', 'Không tải được thông báo.');
    return r;
  },
  async markNotificationRead(n: AppNotification): Promise<void> {
    await apiRequest(`/Notification/${n.id}/read`, '', { method: 'PUT' });
  },
  async markAllNotificationsRead(): Promise<void> {
    await apiRequest('/Notification/read-all', '', { method: 'PUT' });
  },
  /** Số thông báo chưa đọc từ backend, dùng để hỏi định kỳ. */
  async unreadNotificationCount(): Promise<number | null> {
    const r = await apiRequest<number>('/Notification/unread-count', '');
    return r.success && typeof r.data === 'number' ? r.data : null;
  },
  async deleteNotification(n: AppNotification): Promise<ApiResponse<null>> {
    return apiRequest(`/Notification/${n.id}`, 'Không xoá được thông báo.', { method: 'DELETE' });
  },
};
