import { USE_MOCK } from '@/app/mocks/config';
import type { ApiResponse } from '@/app/types/auth';
import type {
  AppNotification, CommunityEligibility, CommunitySubmission, ContentReport, Dashboard, InterventionCase, ProgressReport, ReadCompletion, ReportReason,
  RoadmapAddResult, RoadmapCopyPreview, RoadmapItem, RoadmapPosition, RoadmapStatus, RoadmapStoryInput, RoadmapTemplate, SkipReason,
} from '@/app/types/progress';
import type { StoryWish } from '@/app/types/reading';
import { apiRequest, isMissingEndpoint } from './apiClient';
import { guardianLocal, type ChildRef } from './guardianLocal';
import { notificationLocal } from './notificationLocal';
import { staffLocal } from './staffLocal';

/**
 * Luồng 4 (và phần phụ huynh của Luồng 2 mục 3.5) — dịch vụ phía phụ huynh.
 *
 * API backend ĐÃ CÓ → luôn gọi thật (chỉ dùng dữ liệu cục bộ khi NEXT_PUBLIC_USE_MOCK bật):
 *   GET    /ChildRoadmap/{childId}                          → ChildRoadmapDto { open, waiting, history }
 *   POST   /ChildRoadmap/stories                            { storyId, childProfileIds, position: NextUp|End, expectedDays, note }
 *   DELETE /ChildRoadmap/{childId}/items/{itemId}  ·  DELETE /ChildRoadmap/{childId}/items (làm trống)
 *   PUT    /ChildRoadmap/{childId}/order                    { itemIds }
 *   GET    /RoadmapLibrary  ·  GET /RoadmapLibrary/{id}  ·  POST /RoadmapLibrary/{id}/copy { childProfileIds, position, daysPerStory }
 *   POST   /ContentReport                                   { storyId, reason, description }
 *   POST   /CommunitySubmission/check  ·  POST /CommunitySubmission  { storyId, confirmNoPersonalInfo, copyrightDeclaration }
 *   GET    /CommunitySubmission/mine  ·  POST /CommunitySubmission/{id}/withdraw  ·  POST /CommunitySubmission/{id}/remove
 *   GET /Notification, PUT /Notification/{id}/read, PUT /Notification/read-all.
 *
 * HỢP ĐỒNG ĐỀ XUẤT (backend chưa có — xem docs/FRONTEND_PROGRESS.md, "Luồng 4 — cần backend bổ sung"):
 *   GET    /children/{id}/dashboard                         → Dashboard (khối theo quyền LIVE)
 *   GET    /children/{id}/intervention                      → InterventionCase | null
 *   POST   /intervention-cases/{id}/unlock                  { skillGapNotes }
 *   PUT    /intervention-cases/{id}/notes                   { skillGapNotes }
 *   GET    /children/{id}/read-completions                  → ReadCompletion[];  PUT /read-completions/{id}/seen
 *   GET    /children/{id}/progress-reports                  → ProgressReport[]
 *   GET    /children/{id}/wishes                            → StoryWish[]
 *   POST   /wishes/{id}/fulfill-with-existing {storyId} · /accept · /decline   (Luồng 2 mục 11)
 */

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Mỗi nhóm API đề xuất tự quyết định có backend hay không: lần gọi đầu báo endpoint chưa có (404/405/501) thì nhóm đó dùng dữ liệu cục bộ,
 * các nhóm khác không bị kéo theo.
 */
type ProposedGroup = 'dashboard' | 'intervention' | 'completions' | 'reports' | 'wishes';
const backendReady = new Map<ProposedGroup, boolean | null>();

async function call<T>(group: ProposedGroup, path: string, fallback: () => ApiResponse<T>, opts: { method?: Method; body?: unknown } = {}): Promise<ApiResponse<T>> {
  const ready = USE_MOCK ? false : backendReady.get(group) ?? null;
  if (ready === false) return fallback();
  const r = await apiRequest<T>(path, 'Không kết nối được.', opts);
  if (r.success) { backendReady.set(group, true); return r; }
  // Chỉ dùng hẳn dữ liệu cục bộ khi backend chưa có API; lỗi mạng hay lỗi tạm thời thì báo lỗi, lần sau gọi lại.
  if (ready === null && isMissingEndpoint(r)) { backendReady.set(group, false); return fallback(); }
  return r;
}

/** API đã có ở backend: luôn gọi thật, `map` đổi DTO sang kiểu của giao diện. */
async function live<D, T>(path: string, fallbackMessage: string, map: (d: D) => T, opts: { method?: Method; body?: unknown } = {}): Promise<ApiResponse<T>> {
  const r = await apiRequest<D>(path, fallbackMessage, opts);
  return { ...r, data: r.success && r.data != null ? map(r.data) : null };
}

// ---------- Ánh xạ DTO backend ----------

interface RoadmapItemDto {
  id: number; storyId: number; title: string | null; position: number; status: string; source: string; skipReason: string | null;
  note: string | null; expectedDays: number | null; expectedCompletionAt: string | null; openedAt: string | null; completedAt: string | null;
}
interface ChildRoadmapDto { childProfileId: number; open: RoadmapItemDto | null; waiting: RoadmapItemDto[]; history: RoadmapItemDto[] }
interface AddResultDto { results: { childProfileId: number; outcome: string; skipCode: string | null; message: string | null; itemId: number | null }[] }
interface LibraryItemDto {
  id: number; name: string; description: string | null; ageBand: string; mainCategory: { displayName: string } | null;
  readingLevelMin: number; readingLevelMax: number; defaultDaysPerStory: number; storyCount: number;
}
interface LibraryDetailDto extends LibraryItemDto { stories: { storyId: number; title: string | null; ageBand: string; isAvailable: boolean }[] }
interface CopyPlanDto {
  children: { childProfileId: number; outcome: string; message: string | null; warnings: string[];
    steps: { storyId: number; title: string | null; action: string; message: string | null }[] }[];
}
interface ReportResultDto { reportId: number; storyId: number; reason: string; status: string; createdAt: string }
interface SubmissionDto { itemId: number; storyId: number; status: string; submittedAt: string; rejectReason: string | null }

const ITEM_STATUS: Record<string, RoadmapStatus> = { Waiting: 'queued', Open: 'open', Completed: 'completed', Skipped: 'skipped', Removed: 'removed' };
const ITEM_SOURCE: Record<string, RoadmapItem['source']> = { Manual: 'parent', TemplateCopy: 'template', Wish: 'wish' };
const SKIP: Record<string, SkipReason> = {
  BlockedTopic: 'blocked_category', WrongAge: 'age_band_mismatch', TooLong: 'too_long',
  StoryUnavailable: 'story_unavailable', SourceDeleted: 'source_deleted', DataDeleted: 'data_deletion',
};
/** 'safety_concern' ↔ 'SafetyConcern'. */
const toPascal = (s: string) => s.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join('');
const fromPascal = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
const POSITION: Record<RoadmapPosition, string> = { next: 'NextUp', end: 'End' };
/** Bộ truyện mẫu trả độ tuổi dạng "6-8" / "9-10"; hồ sơ bé dùng "Age_6_8" / "Age_9_10". */
const AGE_BAND: Record<string, string> = { '6-8': 'Age_6_8', '9-10': 'Age_9_10' };

const mapItem = (childProfileId: number) => (i: RoadmapItemDto): RoadmapItem => ({
  id: i.id, childProfileId, storyId: i.storyId, title: i.title ?? `Truyện #${i.storyId}`, position: i.position,
  status: ITEM_STATUS[i.status] ?? 'removed', source: ITEM_SOURCE[i.source] ?? 'parent', sourceTemplateId: null,
  note: i.note, dueDays: i.expectedDays, dueAt: i.expectedCompletionAt, openedAt: i.openedAt, completedAt: i.completedAt,
  skipReason: i.skipReason ? SKIP[i.skipReason] ?? null : null, createdAt: i.openedAt ?? '',
});

const mapRoadmap = (d: ChildRoadmapDto): RoadmapItem[] =>
  [...(d.open ? [d.open] : []), ...d.waiting, ...d.history].map(mapItem(d.childProfileId));

const nicknameOf = (children: ChildRef[], id: number) => children.find((c) => c.id === id)?.nickname ?? `#${id}`;

const mapAdd = (children: ChildRef[]) => (d: AddResultDto): RoadmapAddResult => ({
  added: d.results.filter((r) => r.outcome !== 'Skipped' && r.itemId != null)
    .map((r) => ({ childProfileId: r.childProfileId, itemId: r.itemId!, moved: r.outcome === 'MovedToNext' })),
  skipped: d.results.filter((r) => r.outcome === 'Skipped')
    .map((r) => ({ childProfileId: r.childProfileId, nickname: nicknameOf(children, r.childProfileId), reason: r.message ?? 'Không phù hợp' })),
});

const mapCopy = (children: ChildRef[]) => (d: CopyPlanDto): RoadmapAddResult => ({
  added: d.children.filter((c) => c.outcome !== 'Skipped').map((c) => ({ childProfileId: c.childProfileId, itemId: 0, moved: false })),
  skipped: d.children.filter((c) => c.outcome === 'Skipped')
    .map((c) => ({ childProfileId: c.childProfileId, nickname: nicknameOf(children, c.childProfileId), reason: c.message ?? 'Không phù hợp' })),
});

const mapTemplate = (t: LibraryItemDto): RoadmapTemplate => ({
  id: t.id, title: t.name, description: t.description ?? '', targetAgeBand: AGE_BAND[t.ageBand] ?? t.ageBand,
  readingLevelMin: t.readingLevelMin, readingLevelMax: t.readingLevelMax, topic: t.mainCategory?.displayName ?? '',
  defaultDaysPerStep: t.defaultDaysPerStory || null, storyCount: t.storyCount, stories: [],
});

const mapTemplateDetail = (t: LibraryDetailDto): RoadmapTemplate => ({
  ...mapTemplate(t),
  stories: t.stories.filter((s) => s.isAvailable).map((s) => ({ storyId: s.storyId, title: s.title ?? `Truyện #${s.storyId}`, ageBand: s.ageBand, length: 0 })),
});

const mapSubmission = (s: SubmissionDto): CommunitySubmission => ({
  id: s.itemId, storyId: s.storyId, status: s.status.toLowerCase() as CommunitySubmission['status'], createdAt: s.submittedAt, rejectReason: s.rejectReason,
});

/** Backend: CopyrightDeclaration.OwnWork = 2 (enum số). Truyện AI không cần khai. */
const OWN_WORK = 2;
const communityBody = (storyId: number, ownWork: boolean) => ({ storyId, confirmNoPersonalInfo: true, copyrightDeclaration: ownWork ? OWN_WORK : null });

export type { ChildRef };

export const guardianService = {
  /** `group` mặc định là bảng theo dõi tiến độ. */
  isLocal: (group: ProposedGroup = 'dashboard') => USE_MOCK || backendReady.get(group) === false,

  dashboard: (childId: number): Promise<ApiResponse<Dashboard>> => call('dashboard', `/children/${childId}/dashboard`, () => guardianLocal.dashboard(childId)),

  // ---------- Lộ trình của con (API đã có) ----------
  roadmap: async (childId: number): Promise<ApiResponse<RoadmapItem[]>> =>
    USE_MOCK ? guardianLocal.roadmap(childId) : live(`/ChildRoadmap/${childId}`, 'Không tải được lộ trình.', mapRoadmap),

  addToRoadmap: async (children: ChildRef[], story: RoadmapStoryInput, position: RoadmapPosition, dueDays: number | null, note: string | null): Promise<ApiResponse<RoadmapAddResult>> =>
    USE_MOCK ? guardianLocal.addToRoadmap(children, story, position, { dueDays, note })
      : live('/ChildRoadmap/stories', 'Chưa thêm được truyện vào lộ trình.', mapAdd(children),
        { method: 'POST', body: { storyId: story.storyId, childProfileIds: children.map((c) => c.id), position: POSITION[position], expectedDays: dueDays, note } }),

  removeFromRoadmap: async (childId: number, itemId: number): Promise<ApiResponse<null>> =>
    USE_MOCK ? guardianLocal.removeFromRoadmap(childId, itemId)
      : live(`/ChildRoadmap/${childId}/items/${itemId}`, 'Chưa gỡ được truyện.', () => null, { method: 'DELETE' }),

  reorderRoadmap: async (childId: number, queuedIds: number[]): Promise<ApiResponse<null>> =>
    USE_MOCK ? guardianLocal.reorderRoadmap(childId, queuedIds)
      : live(`/ChildRoadmap/${childId}/order`, 'Chưa đổi được thứ tự.', () => null, { method: 'PUT', body: { itemIds: queuedIds } }),

  clearRoadmap: async (childId: number): Promise<ApiResponse<null>> =>
    USE_MOCK ? guardianLocal.clearRoadmap(childId)
      : live(`/ChildRoadmap/${childId}/items`, 'Chưa làm trống được lộ trình.', () => null, { method: 'DELETE' }),

  /** Kho bộ truyện mẫu: danh sách chỉ có số truyện, gọi `template(id)` để lấy danh sách truyện trong bộ. */
  templates: async (): Promise<ApiResponse<RoadmapTemplate[]>> =>
    USE_MOCK ? { ...guardianLocal.templates(), data: [...staffLocal.publishedTemplates(), ...(guardianLocal.templates().data ?? [])] }
      : live('/RoadmapLibrary?pageIndex=1&pageSize=50', 'Không tải được kho bộ truyện mẫu.', (p: { items: LibraryItemDto[] }) => p.items.map(mapTemplate)),

  template: async (template: RoadmapTemplate): Promise<ApiResponse<RoadmapTemplate>> =>
    USE_MOCK ? { success: true, message: '', data: template } : live(`/RoadmapLibrary/${template.id}`, 'Không mở được bộ truyện mẫu.', mapTemplateDetail),

  /** Xem trước việc chép bộ: bé nào được chép, truyện nào bị bỏ qua và vì sao (không ghi dữ liệu). Chế độ mẫu trả null. */
  previewTemplate: async (children: ChildRef[], template: RoadmapTemplate, position: RoadmapPosition, daysPerStep: number | null): Promise<ApiResponse<RoadmapCopyPreview[] | null>> =>
    USE_MOCK ? { success: true, message: '', data: null }
      : live(`/RoadmapLibrary/${template.id}/preview`, 'Chưa xem trước được.', (d: CopyPlanDto) => d.children.map((c) => ({
        childProfileId: c.childProfileId, nickname: nicknameOf(children, c.childProfileId), willCopy: c.outcome !== 'Skipped', reason: c.message,
        warnings: c.warnings.map((w) => (w === 'reading_level_outside_range' ? 'Mức đọc của bé nằm ngoài khoảng của bộ' : w)),
        steps: c.steps.map((s) => ({ title: s.title ?? `Truyện #${s.storyId}`, copy: s.action === 'Copy', reason: s.message })),
      })), { method: 'POST', body: { childProfileIds: children.map((c) => c.id), position: POSITION[position], daysPerStory: daysPerStep } }),

  applyTemplate: async (children: ChildRef[], template: RoadmapTemplate, position: RoadmapPosition, daysPerStep: number | null): Promise<ApiResponse<RoadmapAddResult>> =>
    USE_MOCK ? guardianLocal.applyTemplate(children, template, position, daysPerStep)
      : live(`/RoadmapLibrary/${template.id}/copy`, 'Chưa chép được bộ truyện mẫu.', mapCopy(children),
        { method: 'POST', body: { childProfileIds: children.map((c) => c.id), position: POSITION[position], daysPerStory: daysPerStep } }),

  // ---------- Hold Mode, tiến độ, điều ước (API đề xuất) ----------
  holdCase: (childId: number): Promise<ApiResponse<InterventionCase | null>> => call('intervention', `/children/${childId}/intervention`, () => guardianLocal.holdCase(childId)),

  unlockHold: (childId: number, caseId: number, notes: string): Promise<ApiResponse<null>> =>
    call('intervention', `/intervention-cases/${caseId}/unlock`, () => guardianLocal.unlockHold(childId, notes), { method: 'POST', body: { skillGapNotes: notes || null } }),

  addHoldNotes: (childId: number, caseId: number, notes: string): Promise<ApiResponse<null>> =>
    call('intervention', `/intervention-cases/${caseId}/notes`, () => guardianLocal.addHoldNotes(childId, notes), { method: 'PUT', body: { skillGapNotes: notes } }),

  completions: (childId: number): Promise<ApiResponse<ReadCompletion[]>> => call('completions', `/children/${childId}/read-completions`, () => guardianLocal.completions(childId)),
  markCompletionSeen: (childId: number, id: number): Promise<ApiResponse<null>> =>
    call('completions', `/read-completions/${id}/seen`, () => guardianLocal.markCompletionSeen(childId, id), { method: 'PUT' }),

  reports: (childId: number): Promise<ApiResponse<ProgressReport[]>> => call('reports', `/children/${childId}/progress-reports`, () => guardianLocal.reports(childId)),

  wishes: (childId: number): Promise<ApiResponse<(StoryWish & { label: string })[]>> => call('wishes', `/children/${childId}/wishes`, () => guardianLocal.wishes(childId)),
  fulfillWishWithStory: (child: ChildRef, wishId: number, story: RoadmapStoryInput): Promise<ApiResponse<null>> =>
    call('wishes', `/wishes/${wishId}/fulfill-with-existing`, () => guardianLocal.fulfillWishWithStory(child, wishId, story), { method: 'POST', body: { storyId: story.storyId } }),
  acceptWish: (childId: number, wishId: number): Promise<ApiResponse<null>> =>
    call('wishes', `/wishes/${wishId}/accept`, () => guardianLocal.decideWish(childId, wishId, 'accepted'), { method: 'POST' }),
  declineWish: (childId: number, wishId: number, note: string): Promise<ApiResponse<null>> =>
    call('wishes', `/wishes/${wishId}/decline`, () => guardianLocal.decideWish(childId, wishId, 'declined'), { method: 'POST', body: { declineNote: note || null } }),

  // ---------- Báo cáo nội dung và thư viện cộng đồng (API đã có) ----------
  reportStory: async (storyId: number, reason: ReportReason, description: string): Promise<ApiResponse<ContentReport>> =>
    USE_MOCK ? guardianLocal.reportStory(storyId, reason, description)
      : live('/ContentReport', 'Chưa gửi được báo cáo.', (d: ReportResultDto): ContentReport => ({
        id: d.reportId, storyId: d.storyId, reason: fromPascal(d.reason) as ReportReason, description: description || null,
        status: d.status.toLowerCase() as ContentReport['status'], createdAt: d.createdAt,
      }), { method: 'POST', body: { storyId, reason: toPascal(reason), description: description.trim() || null } }),

  /**
   * Trạng thái kiểm duyệt của một truyện. Backend chưa có API liệt kê báo cáo của phụ huynh nên `reports` luôn rỗng;
   * việc chặn nộp khi còn báo cáo mở do `communityCheck` trả về (blocker `open_report`).
   */
  storyModeration: async (storyId: number): Promise<ApiResponse<{ reports: ContentReport[]; submission: CommunitySubmission | null }>> =>
    USE_MOCK ? guardianLocal.storyModeration(storyId)
      : live('/CommunitySubmission/mine', 'Không tải được trạng thái nộp cộng đồng.', (list: SubmissionDto[]) => {
        const mine = list.filter((s) => s.storyId === storyId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
        return { reports: [], submission: mine[0] ? mapSubmission(mine[0]) : null };
      }),

  /** Kiểm tra điều kiện nộp (không ghi dữ liệu). Chế độ mẫu trả null để giao diện tự kiểm tra. */
  communityCheck: async (storyId: number, ownWork: boolean): Promise<ApiResponse<CommunityEligibility | null>> =>
    USE_MOCK ? { success: true, message: '', data: null }
      : live('/CommunitySubmission/check', 'Chưa kiểm tra được điều kiện nộp.', (d: CommunityEligibility) => d,
        { method: 'POST', body: communityBody(storyId, ownWork) }),

  submitCommunity: async (storyId: number, ownWork: boolean): Promise<ApiResponse<CommunitySubmission>> =>
    USE_MOCK ? guardianLocal.submitCommunity(storyId)
      : live('/CommunitySubmission', 'Chưa nộp được truyện.', (d: SubmissionDto & { status: string }) => mapSubmission({ ...d, submittedAt: new Date().toISOString(), rejectReason: null }),
        { method: 'POST', body: communityBody(storyId, ownWork) }),

  /** Đang chờ duyệt thì rút; đã được duyệt thì gỡ khỏi thư viện. */
  withdrawCommunity: async (submission: CommunitySubmission): Promise<ApiResponse<null>> =>
    USE_MOCK ? guardianLocal.withdrawCommunity(submission.id)
      : live(`/CommunitySubmission/${submission.id}/${submission.status === 'approved' ? 'remove' : 'withdraw'}`, 'Chưa thực hiện được.', () => null, { method: 'POST' }),

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
  /** Số thông báo chưa đọc (backend + bộ máy cục bộ), dùng để hỏi định kỳ mà không tải cả danh sách. */
  async unreadNotificationCount(): Promise<number | null> {
    const local = notificationLocal.list().filter((n) => n.status !== 'read').length;
    if (USE_MOCK) return local;
    const r = await apiRequest<number>('/Notification/unread-count', '');
    return r.success && typeof r.data === 'number' ? r.data + local : null;
  },
  async deleteNotification(n: AppNotification): Promise<ApiResponse<null>> {
    if (USE_MOCK || notificationLocal.list().includes(n)) { notificationLocal.remove(n.id); return { success: true, message: '', data: null }; }
    return apiRequest(`/Notification/${n.id}`, 'Không xoá được thông báo.', { method: 'DELETE' });
  },
};
