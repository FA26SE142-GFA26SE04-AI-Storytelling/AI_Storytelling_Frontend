import type { ApiResponse } from '@/app/types/auth';
import type {
  AppNotification, ChildRef, ContentReport, ReportReason,
  RoadmapAddResult, RoadmapItem, RoadmapPosition, RoadmapStoryInput, RoadmapTemplate,
} from '@/app/types/progress';
import { apiRequest } from './apiClient';
import { roadmapService } from './roadmapService';
import { roadmapItems, roadmapAddResult, roadmapCopyResult } from './roadmapAdapters';
import type * as B from '@/app/types/backendContracts';

/** Parent workspace facade: available operations always use the Core API. */

const positionWire = (p: RoadmapPosition) => p === 'next' ? 'NextUp' as const : 'End' as const;
const reportReasons = { safety_concern: 'SafetyConcern', inappropriate: 'Inappropriate', wrong_age_band: 'WrongAgeBand', copyright: 'Copyright', cultural: 'Cultural', other: 'Other' } as const;

export type { ChildRef };

export const guardianService = {

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
  previewTemplate: (children: ChildRef[], template: RoadmapTemplate, position: RoadmapPosition, daysPerStory: number | null) =>
    roadmapService.preview(template.id, { childProfileIds: children.map(c => c.id), position: positionWire(position), daysPerStory }),
  async applyTemplate(children: ChildRef[], template: RoadmapTemplate, position: RoadmapPosition, daysPerStory: number | null): Promise<ApiResponse<RoadmapAddResult>> {
    const r = await roadmapService.copy(template.id, { childProfileIds: children.map(c => c.id), position: positionWire(position), daysPerStory });
    return { ...r, data: r.data ? roadmapCopyResult(r.data, children) : null };
  },

  // Điều ước của bé: xem storyWishService (parentWishService).

  async reportStory(storyId: number, reason: ReportReason, description: string): Promise<ApiResponse<ContentReport>> {
    const r = await apiRequest<B.ContentReportResultDto>('/ContentReport', 'Không gửi được báo cáo.', { method: 'POST', body: { storyId, reason: reportReasons[reason], description: description || null } });
    return { ...r, data: r.data ? { id: r.data.reportId, storyId: r.data.storyId, reason, description, status: r.data.status.toLowerCase() as ContentReport['status'], createdAt: r.data.createdAt } : null };
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
