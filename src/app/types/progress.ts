/**
 * Kiểu dữ liệu Luồng 4 — lộ trình của con, theo dõi tiến độ, Hold Mode, báo cáo, report, thư viện cộng đồng.
 * Tên trường bám theo đặc tả Luồng 4 Mục 6 (backend chưa có API — xem guardianService).
 */

export type RoadmapStatus = 'queued' | 'open' | 'completed' | 'skipped' | 'removed';
export type SkipReason = 'blocked_category' | 'age_band_mismatch' | 'story_unavailable' | 'source_deleted' | 'data_deletion';

export interface RoadmapItem {
  id: number;
  childProfileId: number;
  storyId: number;
  title: string;
  position: number;
  status: RoadmapStatus;
  source: 'parent' | 'template' | 'wish';
  sourceTemplateId: number | null;
  note: string | null;
  dueDays: number | null;
  dueAt: string | null;
  openedAt: string | null;
  completedAt: string | null;
  skipReason: SkipReason | null;
  createdAt: string;
}

export type RoadmapPosition = 'next' | 'end';

export interface RoadmapStoryInput {
  storyId: number;
  title: string;
  ageBand: string;
  /** Số tiếng của truyện — dùng kiểm tra max_story_length của từng trẻ. */
  length: number;
}

export interface RoadmapAddResult {
  added: { childProfileId: number; itemId: number; moved: boolean }[];
  skipped: { childProfileId: number; nickname: string; reason: string }[];
}

export interface RoadmapTemplate {
  id: number;
  title: string;
  description: string;
  targetAgeBand: string;
  readingLevelMin: number;
  readingLevelMax: number;
  topic: string;
  defaultDaysPerStep: number | null;
  stories: { storyId: number; title: string; ageBand: string; length: number }[];
}

export interface InterventionCase {
  id: number;
  childProfileId: number;
  triggerType: 'auto_below_threshold' | 'recommended_by_ai';
  status: 'hold_mode' | 'unlocked' | 'closed';
  heldAt: string;
  triggeringStoryId: number | null;
  triggeringStoryTitle: string | null;
  retakesInLast24h: number;
  resolutionType: 'auto_retake_pass' | 'manual_unlock' | null;
  resolvedAt: string | null;
  skillGapNotes: string | null;
  needsAttention: boolean;
}

/** Thẻ "Con vừa đọc xong" (Bước 4.3b). */
export interface ReadCompletion {
  id: number;
  storyId: number;
  title: string;
  completedAt: string;
  reaction: 'love' | 'like' | 'neutral' | 'dislike' | null;
  quizCorrect: number | null;
  quizTotal: number | null;
  seen: boolean;
}

export interface ActivityEvent { at: string; kind: 'completed' | 'badge' | 'wish' | 'roadmap'; text: string }

export interface Dashboard {
  childProfileId: number;
  minutesByDay: { date: string; minutes: number }[];
  storiesThisWeek: number;
  activitiesCompleted: number;
  streakDays: number;
  newBadges: { badgeCode: string; earnedAt: string }[];
  roadmap: { open: RoadmapItem | null; done: number; total: number; overdue: boolean; empty: boolean };
  holdCase: InterventionCase | null;
  quizTrend: { title: string; percent: number; at: string }[];
  wordsCollected: number;
  topGenres: { genre: string; count: number }[];
  recentWishes: { id: number; label: string; status: string; createdAt: string }[];
  pendingWishes: number;
  activity: ActivityEvent[];
  completions: ReadCompletion[];
}

export interface ProgressReport {
  id: number;
  childProfileId: number;
  periodStart: string;
  periodEnd: string;
  storiesRead: number;
  minutesRead: number;
  quizAverage: number | null;
  favoriteTopics: string[];
  streakDays: number;
  newBadges: string[];
  holdMode: boolean;
  favoriteStory: string | null;
  wishesSubmitted: number;
  wishesFulfilled: number;
  unseenDiscussions: number;
}

export type ReportReason = 'safety_concern' | 'inappropriate' | 'wrong_age_band' | 'copyright' | 'cultural' | 'other';

export interface ContentReport {
  id: number;
  storyId: number;
  reason: ReportReason;
  description: string | null;
  status: 'pending' | 'escalated' | 'reviewed_dismissed' | 'reviewed_archived' | 'closed';
  createdAt: string;
}

export interface CommunitySubmission {
  id: number;
  storyId: number;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'removed';
  createdAt: string;
}

export interface AppNotification {
  id: number;
  /** Có ở thông báo từ backend; thông báo của bộ máy cục bộ không có. */
  childProfileId?: number | null;
  type: string;
  /** Nhóm của backend: stories / children / supervisors / account / moderation. */
  group?: string;
  payload: string | null;
  status: string;
  readAt: string | null;
  createdAt: string;
}
