import type { ApiResponse } from '@/app/types/auth';
import type {
  ActivityEvent, CommunitySubmission, ContentReport, Dashboard, InterventionCase, ProgressReport, ReadCompletion,
  ReportReason, RoadmapAddResult, RoadmapItem, RoadmapPosition, RoadmapStoryInput, RoadmapTemplate,
} from '@/app/types/progress';
import type { StoryWish } from '@/app/types/reading';
import { BADGES, vnDate } from '@/app/lib/readingRules';
import { WISH_CARDS, activeHold, advanceRoadmap, loadChild, retakesLast24h, saveChild, type HoldRecord, type State } from './readingLocal';
import { pushNotification } from './notificationLocal';

/**
 * Bộ máy cục bộ phía phụ huynh cho Luồng 4 — dùng chung dữ liệu với bộ máy đọc của bé.
 * Chỉ dùng cho dữ liệu mẫu / dự phòng khi backend chưa có API (xem guardianService).
 */

export type ChildRef = { id: number; nickname: string; status: string; ageBand: string; maxStoryLength: number };

const ok = <T>(data: T, message = ''): ApiResponse<T> => ({ success: true, message, data });
const fail = <T>(message: string): ApiResponse<T> => ({ success: false, message, data: null });
const DAY = 86_400_000;
const live = (s: State) => s.roadmap.filter((i) => i.status === 'open' || i.status === 'queued');

/** Đánh lại thứ tự: truyện đang mở luôn đứng đầu, sau đó các truyện đang chờ. */
function renumber(s: State, order: RoadmapItem[]) { order.forEach((i, k) => { i.position = k + 1; }); s.roadmap.sort((a, b) => a.position - b.position); }
function liveOrdered(s: State) { return live(s).sort((a, b) => (a.status === 'open' ? -1 : b.status === 'open' ? 1 : a.position - b.position)); }

function caseView(h: HoldRecord, childId: number): InterventionCase {
  const tooLong = Date.now() - Date.parse(h.heldAt) > 7 * DAY;
  return {
    id: h.id, childProfileId: childId, triggerType: 'auto_below_threshold', status: h.status, heldAt: h.heldAt,
    triggeringStoryId: h.triggeringStoryId, triggeringStoryTitle: h.triggeringStoryTitle, retakesInLast24h: retakesLast24h(h),
    resolutionType: h.resolutionType, resolvedAt: h.resolvedAt, skillGapNotes: h.skillGapNotes,
    needsAttention: h.status === 'hold_mode' && (h.retakes.length >= 3 || tooLong),
  };
}

const startOfWeek = (d = new Date()) => {
  const vn = new Date(d.getTime() + 7 * 3_600_000);
  const day = (vn.getUTCDay() + 6) % 7; // thứ Hai = 0
  return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() - day) - 7 * 3_600_000);
};
const wishLabel = (w: StoryWish) => [w.characterCardId, w.placeCardId, w.challengeCardId, w.lessonCardId].map((id) => WISH_CARDS.find((c) => c.id === id)?.label).filter(Boolean).join(' · ');

/** Bộ truyện mẫu (Roadmap Template) — do Content Creator tạo, Moderator duyệt (Luồng 5 Bước 5.9). */
export const SAMPLE_TEMPLATES: RoadmapTemplate[] = [
  { id: 1, title: 'Làm quen với đọc truyện', description: 'Ba truyện ngắn, câu đơn giản, nhiều tranh — hợp với bé mới tập đọc.', targetAgeBand: 'Age_6_8', readingLevelMin: 1, readingLevelMax: 2, topic: 'Tình bạn', defaultDaysPerStep: 3,
    stories: [{ storyId: 2, title: 'Chú gấu và tổ ong ngọt', ageBand: 'Age_6_8', length: 180 }, { storyId: 3, title: 'Con đường lên đỉnh mây', ageBand: 'Age_6_8', length: 180 }] },
  { id: 2, title: 'Nhà khoa học nhí', description: 'Truyện khoa học vui cho bé thích tìm hiểu vũ trụ.', targetAgeBand: 'Age_9_12', readingLevelMin: 2, readingLevelMax: 4, topic: 'Khoa học', defaultDaysPerStep: 4,
    stories: [{ storyId: 5, title: 'Hệ Mặt Trời có mấy anh em', ageBand: 'Age_9_12', length: 180 }] },
];

// Report và nộp thư viện cộng đồng là dữ liệu chung, không theo từng bé.
const SHARED_KEY = 'taletale-guardian-shared:v1';
type Shared = { nextId: number; reports: ContentReport[]; submissions: CommunitySubmission[] };
let shared: Shared | null = null;
function sharedState(): Shared {
  if (shared) return shared;
  try { shared = JSON.parse(sessionStorage.getItem(SHARED_KEY) ?? 'null'); } catch { shared = null; }
  shared ??= { nextId: 1, reports: [], submissions: [] };
  return shared;
}
const saveShared = () => { try { sessionStorage.setItem(SHARED_KEY, JSON.stringify(shared)); } catch { /* bỏ qua */ } };

/** Cho hàng đợi kiểm duyệt (Luồng 5) đọc và cập nhật báo cáo / bài nộp cộng đồng. */
export const moderationShared = { state: () => sharedState(), save: () => saveShared() };

export const guardianLocal = {
  // ---------- Lộ trình của con (Bước 4.1–4.1d) ----------
  roadmap(childId: number): ApiResponse<RoadmapItem[]> {
    const s = loadChild(childId);
    advanceRoadmap(s);
    saveChild(childId);
    return ok(s.roadmap.slice().sort((a, b) => (a.status === 'open' ? -1 : b.status === 'open' ? 1 : a.position - b.position)));
  },

  /**
   * Thêm truyện cho một hoặc nhiều con. Kiểm tra từng trẻ (BR-4.A1): hồ sơ đang hoạt động, nhóm tuổi,
   * độ dài tối đa; trẻ không đạt bị bỏ qua kèm lý do. Không thêm trùng truyện chưa đọc xong (BR-4.R9).
   */
  addToRoadmap(children: ChildRef[], story: RoadmapStoryInput, position: RoadmapPosition, opts: { dueDays?: number | null; note?: string | null; source?: RoadmapItem['source']; templateId?: number | null } = {}): ApiResponse<RoadmapAddResult> {
    const result: RoadmapAddResult = { added: [], skipped: [] };
    for (const c of children) {
      if (c.status !== 'Active') { result.skipped.push({ childProfileId: c.id, nickname: c.nickname, reason: 'Hồ sơ chưa được kích hoạt' }); continue; }
      if (story.ageBand === 'Age_9_12' && c.ageBand === 'Age_6_8') { result.skipped.push({ childProfileId: c.id, nickname: c.nickname, reason: 'Truyện dành cho bé lớn hơn' }); continue; }
      if (story.length > c.maxStoryLength) { result.skipped.push({ childProfileId: c.id, nickname: c.nickname, reason: `Truyện dài hơn giới hạn ${c.maxStoryLength} tiếng của bé` }); continue; }
      const s = loadChild(c.id);
      const order = liveOrdered(s);
      const dup = order.find((i) => i.storyId === story.storyId);
      if (dup) {
        if (position === 'end' || dup.status === 'open') { result.skipped.push({ childProfileId: c.id, nickname: c.nickname, reason: 'Truyện đã có trong lộ trình của con' }); continue; }
        // "Đọc tiếp theo" với truyện đã có: chuyển truyện đó lên ngay sau truyện đang mở.
        const rest = order.filter((i) => i.id !== dup.id);
        const at = rest[0]?.status === 'open' ? 1 : 0;
        rest.splice(at, 0, dup);
        renumber(s, rest);
        advanceRoadmap(s);
        saveChild(c.id);
        result.added.push({ childProfileId: c.id, itemId: dup.id, moved: true });
        continue;
      }
      const item: RoadmapItem = {
        id: s.nextId++, childProfileId: c.id, storyId: story.storyId, title: story.title, position: 0, status: 'queued',
        source: opts.source ?? 'parent', sourceTemplateId: opts.templateId ?? null, note: opts.note?.trim() || null,
        dueDays: opts.dueDays ?? null, dueAt: null, openedAt: null, completedAt: null, skipReason: null, createdAt: new Date().toISOString(),
      };
      s.roadmap.push(item);
      const at = position === 'next' ? (order[0]?.status === 'open' ? 1 : 0) : order.length;
      order.splice(at, 0, item);
      renumber(s, order);
      advanceRoadmap(s);
      saveChild(c.id);
      result.added.push({ childProfileId: c.id, itemId: item.id, moved: false });
      pushNotification('roadmap_story_added', { childProfileId: c.id, storyId: story.storyId });
    }
    return ok(result);
  },

  removeFromRoadmap(childId: number, itemId: number): ApiResponse<null> {
    const s = loadChild(childId);
    const item = s.roadmap.find((i) => i.id === itemId);
    if (!item || (item.status !== 'queued' && item.status !== 'open')) return fail('Chỉ gỡ được truyện chưa đọc xong.');
    item.status = 'removed';
    advanceRoadmap(s);
    saveChild(childId);
    pushNotification('roadmap_story_removed', { childProfileId: childId, storyId: item.storyId });
    return ok(null, 'Đã gỡ truyện khỏi lộ trình.');
  },

  /** Sắp xếp các truyện đang chờ; truyện đang mở giữ nguyên ở đầu. */
  reorderRoadmap(childId: number, queuedIds: number[]): ApiResponse<null> {
    const s = loadChild(childId);
    const open = s.roadmap.find((i) => i.status === 'open');
    const queued = queuedIds.map((id) => s.roadmap.find((i) => i.id === id && i.status === 'queued')).filter(Boolean) as RoadmapItem[];
    renumber(s, [...(open ? [open] : []), ...queued]);
    saveChild(childId);
    return ok(null);
  },

  clearRoadmap(childId: number): ApiResponse<null> {
    const s = loadChild(childId);
    for (const i of live(s)) i.status = 'removed';
    saveChild(childId);
    return ok(null, 'Đã làm trống lộ trình.');
  },

  templates(): ApiResponse<RoadmapTemplate[]> { return ok(SAMPLE_TEMPLATES); },

  /** Bước 4.1c — chép bộ truyện mẫu thành các bước trong lộ trình (bản chép độc lập, BR-4.R6). */
  applyTemplate(children: ChildRef[], template: RoadmapTemplate, position: RoadmapPosition, daysPerStep: number | null): ApiResponse<RoadmapAddResult> {
    const merged: RoadmapAddResult = { added: [], skipped: [] };
    const stories = position === 'next' ? template.stories.slice().reverse() : template.stories;
    for (const st of stories) {
      const r = guardianLocal.addToRoadmap(children, st, position, { dueDays: daysPerStep, source: 'template', templateId: template.id }).data!;
      merged.added.push(...r.added);
      for (const sk of r.skipped) merged.skipped.push({ ...sk, reason: `${st.title}: ${sk.reason}` });
    }
    return ok(merged);
  },

  // ---------- Hold Mode (Bước 4.5) ----------
  holdCase(childId: number): ApiResponse<InterventionCase | null> {
    const s = loadChild(childId);
    const h = activeHold(s) ?? s.holds[s.holds.length - 1];
    return ok(h ? caseView(h, childId) : null);
  },

  /** Bước 4.5.3c — mở khoá thủ công, ghi chú của bố mẹ là tuỳ chọn. */
  unlockHold(childId: number, notes: string): ApiResponse<null> {
    const s = loadChild(childId);
    const h = activeHold(s);
    if (!h) return fail('Bé không ở chế độ tạm dừng.');
    h.status = 'unlocked';
    h.resolutionType = 'manual_unlock';
    h.resolvedAt = new Date().toISOString();
    if (notes.trim()) h.skillGapNotes = notes.trim();
    // BR-4.R7 — ngày mong đọc xong tính lại từ lúc mở khoá.
    const open = s.roadmap.find((i) => i.status === 'open');
    if (open?.dueDays) open.dueAt = new Date(Date.now() + open.dueDays * DAY).toISOString();
    advanceRoadmap(s);
    saveChild(childId);
    pushNotification('hold_mode_unlocked', { childProfileId: childId, resolutionType: 'manual_unlock' });
    return ok(null, 'Đã mở khoá thư viện cho bé.');
  },

  addHoldNotes(childId: number, notes: string): ApiResponse<null> {
    const s = loadChild(childId);
    const h = s.holds[s.holds.length - 1];
    if (!h) return fail('Chưa có lần tạm dừng nào.');
    h.skillGapNotes = notes.trim() || null;
    saveChild(childId);
    return ok(null, 'Đã lưu ghi chú.');
  },

  // ---------- Dashboard (Bước 4.3c) ----------
  dashboard(childId: number): ApiResponse<Dashboard> {
    const s = loadChild(childId);
    advanceRoadmap(s);
    const days = Array.from({ length: 7 }, (_, i) => vnDate(new Date(Date.now() - (6 - i) * DAY)));
    const weekStart = startOfWeek().getTime();
    const items = s.roadmap.filter((i) => i.status !== 'removed');
    const open = items.find((i) => i.status === 'open') ?? null;
    const genres = new Map<string, number>();
    for (const r of s.readLog) if (r.genre && !r.fromSupervisor) genres.set(r.genre, (genres.get(r.genre) ?? 0) + 1);
    const activity: ActivityEvent[] = [
      ...s.readLog.map((r): ActivityEvent => ({ at: r.at, kind: 'completed', text: `Đọc xong “${r.title}”` })),
      ...s.achievements.badges.map((b): ActivityEvent => ({ at: b.earnedAt, kind: 'badge', text: `Đạt huy hiệu ${BADGES[b.badgeCode]?.emoji ?? ''} ${BADGES[b.badgeCode]?.label ?? b.badgeCode}` })),
      ...s.wishes.map((w): ActivityEvent => ({ at: w.createdAt, kind: 'wish', text: `Gửi điều ước: ${wishLabel(w)}` })),
      ...s.roadmap.filter((i) => i.completedAt).map((i): ActivityEvent => ({ at: i.completedAt!, kind: 'roadmap', text: `Đọc xong truyện bố mẹ chọn “${i.title}”` })),
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);
    const h = activeHold(s) ?? null;
    return ok({
      childProfileId: childId,
      minutesByDay: days.map((d) => ({ date: d, minutes: s.readLog.filter((r) => vnDate(new Date(r.at)) === d).reduce((n, r) => n + r.minutes, 0) })),
      storiesThisWeek: s.readLog.filter((r) => Date.parse(r.at) >= weekStart).length,
      activitiesCompleted: s.achievements.activitiesCompleted,
      streakDays: s.achievements.streakDays,
      newBadges: s.achievements.badges.filter((b) => Date.now() - Date.parse(b.earnedAt) < 7 * DAY),
      roadmap: { open, done: items.filter((i) => i.status === 'completed').length, total: items.filter((i) => i.status !== 'skipped').length, overdue: !!open?.dueAt && Date.parse(open.dueAt) < Date.now(), empty: !items.some((i) => i.status === 'open' || i.status === 'queued') },
      holdCase: h ? caseView(h, childId) : null,
      quizTrend: s.quizLog.filter((q) => !q.isRetake).slice(-5).map((q) => ({ title: q.title, percent: q.percent, at: q.at })),
      wordsCollected: s.notebook.length,
      topGenres: [...genres.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([genre, count]) => ({ genre, count })),
      recentWishes: s.wishes.slice(0, 3).map((w) => ({ id: w.id, label: wishLabel(w), status: w.status, createdAt: w.createdAt })),
      pendingWishes: s.wishes.filter((w) => w.status === 'pending').length,
      activity,
      completions: s.completions.slice(0, 5),
    });
  },

  completions(childId: number): ApiResponse<ReadCompletion[]> { return ok(loadChild(childId).completions); },
  markCompletionSeen(childId: number, id: number): ApiResponse<null> {
    const s = loadChild(childId);
    const c = s.completions.find((x) => x.id === id);
    if (c) { c.seen = true; saveChild(childId); }
    return ok(null);
  },

  /** Bước 4.5.4 — báo cáo tuần (tổng hợp, không có dữ liệu thô). */
  reports(childId: number): ApiResponse<ProgressReport[]> {
    const s = loadChild(childId);
    const out: ProgressReport[] = [];
    let end = startOfWeek().getTime() + 7 * DAY;
    for (let k = 0; k < 4; k++) {
      const start = end - 7 * DAY;
      const reads = s.readLog.filter((r) => { const t = Date.parse(r.at); return t >= start && t < end; });
      const quizzes = s.quizLog.filter((q) => { const t = Date.parse(q.at); return !q.isRetake && t >= start && t < end; });
      if (reads.length || k === 0) {
        const fav = s.completions.find((c) => c.reaction === 'love' && Date.parse(c.completedAt) >= start && Date.parse(c.completedAt) < end);
        const genres = [...new Set(reads.map((r) => r.genre).filter(Boolean))] as string[];
        out.push({
          id: k + 1, childProfileId: childId, periodStart: new Date(start).toISOString(), periodEnd: new Date(end - 1).toISOString(),
          storiesRead: reads.length, minutesRead: reads.reduce((n, r) => n + r.minutes, 0),
          quizAverage: quizzes.length ? Math.round(quizzes.reduce((n, q) => n + q.percent, 0) / quizzes.length) : null,
          favoriteTopics: genres.slice(0, 3), streakDays: s.achievements.streakDays,
          newBadges: s.achievements.badges.filter((b) => { const t = Date.parse(b.earnedAt); return t >= start && t < end; }).map((b) => BADGES[b.badgeCode]?.label ?? b.badgeCode),
          holdMode: s.holds.some((h) => Date.parse(h.heldAt) < end && (!h.resolvedAt || Date.parse(h.resolvedAt) >= start)),
          favoriteStory: fav?.title ?? null,
          wishesSubmitted: s.wishes.filter((w) => { const t = Date.parse(w.createdAt); return t >= start && t < end; }).length,
          wishesFulfilled: s.wishes.filter((w) => w.status === 'fulfilled').length,
          unseenDiscussions: s.completions.filter((c) => !c.seen).length,
        });
      }
      end = start;
    }
    return ok(out);
  },

  // ---------- Điều ước của bé — phía phụ huynh (Luồng 2 mục 3.5) ----------
  wishes(childId: number): ApiResponse<(StoryWish & { label: string })[]> {
    return ok(loadChild(childId).wishes.map((w) => ({ ...w, label: wishLabel(w) })));
  },

  /** "Dùng truyện có sẵn": thêm vào lộ trình ở vị trí Đọc tiếp theo, ghi chú "Từ điều ước của em" (BR-2.40). */
  fulfillWishWithStory(child: ChildRef, wishId: number, story: RoadmapStoryInput): ApiResponse<null> {
    const s = loadChild(child.id);
    const w = s.wishes.find((x) => x.id === wishId);
    if (!w || w.status !== 'pending') return fail('Điều ước không còn chờ xử lý.');
    const r = guardianLocal.addToRoadmap([child], story, 'next', { note: 'Từ điều ước của em', source: 'wish' }).data!;
    if (!r.added.length) return fail(r.skipped[0]?.reason ?? 'Không thêm được truyện.');
    const s2 = loadChild(child.id);
    const w2 = s2.wishes.find((x) => x.id === wishId)!;
    Object.assign(w2, { status: 'fulfilled', fulfillmentType: 'existing_story', storyId: story.storyId });
    saveChild(child.id);
    return ok(null, 'Đã gửi truyện cho bé.');
  },

  decideWish(childId: number, wishId: number, decision: 'accepted' | 'declined'): ApiResponse<null> {
    const s = loadChild(childId);
    const w = s.wishes.find((x) => x.id === wishId);
    if (!w || (w.status !== 'pending' && w.status !== 'accepted')) return fail('Điều ước không còn chờ xử lý.');
    w.status = decision;
    saveChild(childId);
    return ok(null);
  },

  // ---------- Report (Bước 4.6) và Community Story Library (Bước 4.7) ----------
  reportStory(storyId: number, reason: ReportReason, description: string): ApiResponse<ContentReport> {
    const sh = sharedState();
    const r: ContentReport = { id: sh.nextId++, storyId, reason, description: description.trim() || null, status: 'pending', createdAt: new Date().toISOString() };
    sh.reports.push(r);
    saveShared();
    pushNotification('content_reported', { storyId, reason });
    return ok(r, 'Đã gửi báo cáo. Kiểm duyệt viên sẽ xem xét.');
  },

  storyModeration(storyId: number): ApiResponse<{ reports: ContentReport[]; submission: CommunitySubmission | null }> {
    const sh = sharedState();
    const subs = sh.submissions.filter((x) => x.storyId === storyId);
    return ok({ reports: sh.reports.filter((x) => x.storyId === storyId), submission: subs[subs.length - 1] ?? null });
  },

  submitCommunity(storyId: number): ApiResponse<CommunitySubmission> {
    const sh = sharedState();
    if (sh.reports.some((r) => r.storyId === storyId && r.status === 'pending')) return fail('Truyện đang có báo cáo chờ xử lý, chưa nộp được.');
    if (sh.submissions.some((x) => x.storyId === storyId && (x.status === 'pending' || x.status === 'approved'))) return fail('Truyện đã được nộp rồi.');
    const sub: CommunitySubmission = { id: sh.nextId++, storyId, status: 'pending', createdAt: new Date().toISOString() };
    sh.submissions.push(sub);
    saveShared();
    return ok(sub, 'Đã nộp. Kiểm duyệt viên sẽ duyệt trước khi truyện xuất hiện trong thư viện cộng đồng.');
  },

  withdrawCommunity(submissionId: number): ApiResponse<null> {
    const sub = sharedState().submissions.find((x) => x.id === submissionId);
    if (!sub || (sub.status !== 'pending' && sub.status !== 'approved')) return fail('Không rút được.');
    sub.status = sub.status === 'pending' ? 'withdrawn' : 'removed';
    saveShared();
    return ok(null, sub.status === 'withdrawn' ? 'Đã rút yêu cầu.' : 'Đã gỡ truyện khỏi thư viện cộng đồng.');
  },
};
