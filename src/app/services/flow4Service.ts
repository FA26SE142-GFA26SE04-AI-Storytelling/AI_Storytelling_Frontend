import {
  AssignmentItem,
  AssignmentStatus,
  O2OAssessmentItem,
  SharedStoryItem,
  TeacherShareStatus,
  RecipientStatus,
  InterventionCaseItem,
  InterventionStatus,
  ContentReportItem,
  ContentReportReason,
  ContentReportStatus,
  Flow4NotificationItem,
  Flow4NotificationType,
} from '../types/flow4Types';
import { authService } from './authService';
import { API_BASE_URL } from './apiConfig';
import {
  SEED_ASSIGNMENTS,
  SEED_SHARED_STORIES,
  SEED_INTERVENTIONS,
  SEED_REPORTS,
  SEED_NOTIFICATIONS,
} from './flow4SeedData';

const STORAGE_KEYS = {
  ASSIGNMENTS: 'flow4_assignments_store',
  SHARED_STORIES: 'flow4_shared_stories_store',
  INTERVENTIONS: 'flow4_interventions_store',
  CONTENT_REPORTS: 'flow4_content_reports_store',
  NOTIFICATIONS: 'flow4_notifications_store',
};

class Flow4Service {
  private getStorage<T>(key: string, seed: T): T {
    if (typeof window === 'undefined') return seed;
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(data) as T;
    } catch {
      return seed;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  // ==========================================
  // 1. NOTIFICATIONS (TÍCH HỢP TRỰC TIẾP BACKEND API)
  // ==========================================

  getNotifications(): Flow4NotificationItem[] {
    return this.getStorage<Flow4NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
  }

  /**
   * Gọi trực tiếp Backend API: GET /api/v1/Notification
   */
  async fetchNotificationsFromApi(): Promise<Flow4NotificationItem[]> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/Notification`, {
        method: 'GET',
      });

      if (response.ok) {
        const result = await response.json();
        const apiItems = result?.data;
        if (Array.isArray(apiItems) && apiItems.length > 0) {
          const mapped: Flow4NotificationItem[] = apiItems.map((n: Record<string, unknown>) => {
            let parsedPayload: Record<string, unknown> = {};
            try {
              if (typeof n.payload === 'string') parsedPayload = JSON.parse(n.payload);
            } catch {
              parsedPayload = { message: String(n.payload || '') };
            }

            const typeNumber = typeof n.type === 'number'
              ? n.type
              : Flow4NotificationType[n.type as keyof typeof Flow4NotificationType] || Flow4NotificationType.StoryShared;

            return {
              id: Number(n.id) || Date.now(),
              userId: Number(n.recipientUserId) || 1,
              type: typeNumber,
              title: (parsedPayload.title as string) || this.getDefaultTitleForType(typeNumber),
              message: (parsedPayload.message as string) || (n.payload as string) || 'Bạn có thông báo mới từ hệ thống.',
              isRead: n.status === 'Read' || n.status === 2,
              createdAt: String(n.createdAt || new Date().toISOString()),
              metadata: parsedPayload.metadata as Record<string, unknown> | undefined,
            };
          });

          this.setStorage(STORAGE_KEYS.NOTIFICATIONS, mapped);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('flow4:notifications-updated'));
          }
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Backend Notification API not reachable, using cached notifications:', err);
    }

    return this.getNotifications();
  }

  private getDefaultTitleForType(type: Flow4NotificationType): string {
    switch (type) {
      case Flow4NotificationType.AssignmentCancelled:
        return 'Bài đọc giao đã được rút lại';
      case Flow4NotificationType.HoldModeAlert:
        return 'Cần hỗ trợ đọc hiểu (Hold Mode)';
      case Flow4NotificationType.TeacherInteractionScore:
        return 'Bé nhận được 1 sao tương tác từ giáo viên!';
      case Flow4NotificationType.StoryShared:
        return 'Truyện mới chia sẻ từ lớp học';
      case Flow4NotificationType.ContentReported:
      case Flow4NotificationType.ContentReportResolved:
        return 'Cập nhật báo cáo an toàn nội dung';
      default:
        return 'Thông báo học tập';
    }
  }

  async markNotificationAsRead(id: number): Promise<void> {
    const list = this.getNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      this.setStorage(STORAGE_KEYS.NOTIFICATIONS, list);
    }

    try {
      await authService.authenticatedFetch(`${API_BASE_URL}/Notification/${id}/read`, {
        method: 'PUT',
      });
    } catch (err) {
      console.warn('Sync mark as read to backend skipped:', err);
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    const list = this.getNotifications();
    list.forEach((n) => (n.isRead = true));
    this.setStorage(STORAGE_KEYS.NOTIFICATIONS, list);

    try {
      await authService.authenticatedFetch(`${API_BASE_URL}/Notification/read-all`, {
        method: 'PUT',
      });
    } catch (err) {
      console.warn('Sync mark all as read to backend skipped:', err);
    }
  }

  addNotification(params: {
    type: Flow4NotificationType;
    title: string;
    message: string;
    userId?: number;
    metadata?: Record<string, unknown>;
  }): Flow4NotificationItem {
    const list = this.getNotifications();
    const newNotif: Flow4NotificationItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      userId: params.userId || 1,
      type: params.type,
      title: params.title,
      message: params.message,
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: params.metadata,
    };
    list.unshift(newNotif);
    this.setStorage(STORAGE_KEYS.NOTIFICATIONS, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flow4:notifications-updated'));
    }
    return newNotif;
  }

  // ==========================================
  // 2. ASSIGNMENTS (BÀI TẬP & RÚT BÀI 4.1 & 4.1b)
  // ==========================================

  getAssignments(): AssignmentItem[] {
    return this.getStorage<AssignmentItem[]>(STORAGE_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
  }

  async fetchAssignmentsFromApi(): Promise<AssignmentItem[]> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/Assignment`, {
        method: 'GET',
      });
      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json?.data) && json.data.length > 0) {
          this.setStorage(STORAGE_KEYS.ASSIGNMENTS, json.data);
          return json.data;
        }
      }
    } catch {
      // Backend controller will serve once mounted, fallback smoothly
    }
    return this.getAssignments();
  }

  createAssignment(params: {
    storyId: number;
    storyTitle: string;
    assignedByUserId: number;
    assignedByName: string;
    classGroupId?: number | null;
    classGroupName?: string | null;
    childProfileId?: number | null;
    childName?: string | null;
    dueAt?: string | null;
  }): AssignmentItem {
    const list = this.getAssignments();
    const newId = Date.now();
    const newAssignment: AssignmentItem = {
      id: newId,
      storyId: params.storyId,
      storyTitle: params.storyTitle,
      assignedByUserId: params.assignedByUserId,
      assignedByName: params.assignedByName,
      classGroupId: params.classGroupId,
      classGroupName: params.classGroupName,
      childProfileId: params.childProfileId,
      childName: params.childName,
      status: AssignmentStatus.Assigned,
      assignedAt: new Date().toISOString(),
      dueAt: params.dueAt,
      recipients: params.childProfileId
        ? [
            {
              id: newId + 1,
              assignmentId: newId,
              childProfileId: params.childProfileId,
              childName: params.childName || 'Bé',
              status: AssignmentStatus.Assigned,
            },
          ]
        : [
            {
              id: newId + 1,
              assignmentId: newId,
              childProfileId: 1,
              childName: 'Nobita (Bé)',
              status: AssignmentStatus.Assigned,
            },
          ],
    };

    list.unshift(newAssignment);
    this.setStorage(STORAGE_KEYS.ASSIGNMENTS, list);

    // Call API async in background
    authService.authenticatedFetch(`${API_BASE_URL}/Assignment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }).catch(() => {});

    return newAssignment;
  }

  cancelAssignment(
    assignmentId: number,
    cancelledByUserId: number,
    cancelledByName: string,
    recipientId?: number
  ): boolean {
    const list = this.getAssignments();
    const item = list.find((a) => a.id === assignmentId);
    if (!item) return false;

    const now = new Date().toISOString();

    if (recipientId) {
      const r = item.recipients.find((rec) => rec.id === recipientId);
      if (r && r.status !== AssignmentStatus.Completed) {
        r.status = AssignmentStatus.Cancelled;
        r.cancelledByUserId = cancelledByUserId;
        r.cancelledByName = cancelledByName;
        r.cancelledAt = now;
      }
    } else {
      item.status = AssignmentStatus.Cancelled;
      item.recipients.forEach((r) => {
        if (r.status !== AssignmentStatus.Completed) {
          r.status = AssignmentStatus.Cancelled;
          r.cancelledByUserId = cancelledByUserId;
          r.cancelledByName = cancelledByName;
          r.cancelledAt = now;
        }
      });
    }

    this.setStorage(STORAGE_KEYS.ASSIGNMENTS, list);

    // Gửi thông báo tới phụ huynh theo Bước 4.1b
    this.addNotification({
      type: Flow4NotificationType.AssignmentCancelled,
      title: 'Bài đọc giao đã được rút lại',
      message: `Giáo viên ${cancelledByName} đã rút lại bài tập "${item.storyTitle}" để điều chỉnh kế hoạch học tập.`,
    });

    // Call API async in background
    authService.authenticatedFetch(`${API_BASE_URL}/Assignment/${assignmentId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelledByUserId, recipientId }),
    }).catch(() => {});

    return true;
  }

  // ==========================================
  // 3. O2O ASSESSMENT (CHẤM ĐIỂM OFFLINE 4.4)
  // ==========================================

  saveO2OAssessment(params: {
    assignmentId: number;
    recipientId: number;
    teacherUserId: number;
    teacherName: string;
    bonusPoints?: number;
    notes?: string;
  }): boolean {
    const list = this.getAssignments();
    const assignment = list.find((a) => a.id === params.assignmentId);
    if (!assignment) return false;

    const recipient = assignment.recipients.find((r) => r.id === params.recipientId);
    if (!recipient) return false;

    const assessment: O2OAssessmentItem = {
      id: Date.now(),
      assignmentRecipientId: params.recipientId,
      teacherUserId: params.teacherUserId,
      teacherName: params.teacherName,
      bonusPoints: params.bonusPoints ?? 1,
      notes: params.notes,
      assessedAt: new Date().toISOString(),
    };

    recipient.o2oAssessment = assessment;
    this.setStorage(STORAGE_KEYS.ASSIGNMENTS, list);

    this.addNotification({
      type: Flow4NotificationType.TeacherInteractionScore,
      title: 'Bé nhận được 1 sao tương tác từ giáo viên!',
      message: `${params.teacherName} đã ghi nhận nỗ lực đọc truyện "${assignment.storyTitle}": "${params.notes || 'Bé tương tác rất tốt!'}"`,
    });

    // Call API async in background
    authService.authenticatedFetch(`${API_BASE_URL}/Assignment/${params.assignmentId}/o2o`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }).catch(() => {});

    return true;
  }

  // ==========================================
  // 4. COMMUNITY SHARING (CHIA SẺ LỚP HỌC 4.2)
  // ==========================================

  getSharedStories(): SharedStoryItem[] {
    return this.getStorage<SharedStoryItem[]>(STORAGE_KEYS.SHARED_STORIES, SEED_SHARED_STORIES);
  }

  async fetchSharedStoriesFromApi(): Promise<SharedStoryItem[]> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/SharedStory`, {
        method: 'GET',
      });
      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json?.data) && json.data.length > 0) {
          this.setStorage(STORAGE_KEYS.SHARED_STORIES, json.data);
          return json.data;
        }
      }
    } catch {}
    return this.getSharedStories();
  }

  reviewSharedStoryByTeacher(
    sharedStoryId: number,
    approve: boolean,
    teacherNotes?: string,
    teacherUserId: number = 12,
    teacherName: string = 'Cô Mai'
  ): boolean {
    const list = this.getSharedStories();
    const item = list.find((s) => s.id === sharedStoryId);
    if (!item) return false;

    item.teacherStatus = approve ? TeacherShareStatus.Approved : TeacherShareStatus.Rejected;
    item.teacherNotes = teacherNotes;
    item.reviewedByUserId = teacherUserId;
    item.reviewedByName = teacherName;
    item.reviewedAt = new Date().toISOString();

    this.setStorage(STORAGE_KEYS.SHARED_STORIES, list);

    authService.authenticatedFetch(`${API_BASE_URL}/SharedStory/${sharedStoryId}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve, teacherNotes, teacherUserId }),
    }).catch(() => {});

    return true;
  }

  respondSharedStoryByParent(
    sharedStoryId: number,
    recipientId: number,
    accept: boolean
  ): boolean {
    const list = this.getSharedStories();
    const item = list.find((s) => s.id === sharedStoryId);
    if (!item) return false;

    const r = item.recipients.find((rec) => rec.id === recipientId);
    if (!r) return false;

    r.status = accept ? RecipientStatus.Accepted : RecipientStatus.Rejected;
    r.respondedAt = new Date().toISOString();

    this.setStorage(STORAGE_KEYS.SHARED_STORIES, list);

    authService.authenticatedFetch(`${API_BASE_URL}/SharedStory/${sharedStoryId}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId, accept }),
    }).catch(() => {});

    return true;
  }

  // ==========================================
  // 5. INTERVENTION (HOLD MODE & UNLOCK 4.5)
  // ==========================================

  getInterventions(): InterventionCaseItem[] {
    return this.getStorage<InterventionCaseItem[]>(STORAGE_KEYS.INTERVENTIONS, SEED_INTERVENTIONS);
  }

  async fetchInterventionsFromApi(): Promise<InterventionCaseItem[]> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/Intervention`, {
        method: 'GET',
      });
      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json?.data) && json.data.length > 0) {
          this.setStorage(STORAGE_KEYS.INTERVENTIONS, json.data);
          return json.data;
        }
      }
    } catch {}
    return this.getInterventions();
  }

  unlockHoldMode(caseId: number, skillGapNotes: string, teacherUserId: number = 12, teacherName: string = 'Cô Mai'): boolean {
    const list = this.getInterventions();
    const item = list.find((c) => c.id === caseId);
    if (!item) return false;

    item.status = InterventionStatus.ResolvedUnlocked;
    item.skillGapNotes = skillGapNotes;
    item.resolvedByUserId = teacherUserId;
    item.resolvedByName = teacherName;
    item.resolvedAt = new Date().toISOString();

    this.setStorage(STORAGE_KEYS.INTERVENTIONS, list);

    this.addNotification({
      type: Flow4NotificationType.HoldModeAlert,
      title: 'Chế độ hỗ trợ đã mở khóa thành công',
      message: `Giáo viên ${teacherName} đã hướng dẫn bé trực tiếp và mở khóa hành trình đọc sách cho bé.`,
    });

    authService.authenticatedFetch(`${API_BASE_URL}/Intervention/${caseId}/unlock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillGapNotes, teacherUserId }),
    }).catch(() => {});

    return true;
  }

  // ==========================================
  // 6. CONTENT REPORT (BÁO CÁO NỘI DUNG 4.6)
  // ==========================================

  getContentReports(): ContentReportItem[] {
    return this.getStorage<ContentReportItem[]>(STORAGE_KEYS.CONTENT_REPORTS, SEED_REPORTS);
  }

  async fetchContentReportsFromApi(): Promise<ContentReportItem[]> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/ContentReport`, {
        method: 'GET',
      });
      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json?.data) && json.data.length > 0) {
          this.setStorage(STORAGE_KEYS.CONTENT_REPORTS, json.data);
          return json.data;
        }
      }
    } catch {}
    return this.getContentReports();
  }

  createContentReport(params: {
    storyId: number;
    storyTitle: string;
    reporterUserId: number;
    reporterName: string;
    reason: ContentReportReason;
    description?: string;
  }): ContentReportItem {
    const list = this.getContentReports();
    const newReport: ContentReportItem = {
      id: Date.now(),
      storyId: params.storyId,
      storyTitle: params.storyTitle,
      reporterUserId: params.reporterUserId,
      reporterName: params.reporterName,
      reason: params.reason,
      description: params.description,
      status: ContentReportStatus.Pending,
      createdAt: new Date().toISOString(),
    };

    list.unshift(newReport);
    this.setStorage(STORAGE_KEYS.CONTENT_REPORTS, list);

    this.addNotification({
      type: Flow4NotificationType.ContentReported,
      title: 'Đã tiếp nhận báo cáo nội dung',
      message: `Báo cáo về truyện "${params.storyTitle}" đã được gửi tới hội đồng an toàn. Hệ thống sẽ phản hồi trong 48h.`,
    });

    authService.authenticatedFetch(`${API_BASE_URL}/ContentReport`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }).catch(() => {});

    return newReport;
  }
}

export const flow4Service = new Flow4Service();
