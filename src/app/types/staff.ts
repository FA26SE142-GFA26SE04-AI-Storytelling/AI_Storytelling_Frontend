/** Kiểu dữ liệu Luồng 5 — Admin Portal, Content Workspace (Creator / Moderator). */

export type StaffRoleName = 'Administrator' | 'Moderator' | 'ContentCreator';
export type StaffStatus = 'invited' | 'active' | 'deactivated' | 'pending_approval' | 'rejected';

export interface StaffAccount {
  userId: number;
  email: string;
  fullName: string;
  role: StaffRoleName;
  status: StaffStatus;
  expertise: string | null;
  createdAt: string;
}

export interface CreatorApplicationInput {
  fullName: string;
  email: string;
  password: string;
  expertise: string;
  yearsExperience: number;
  experienceNote: string;
  portfolioUrl: string;
}

export interface CreatorApplication {
  id: number;
  fullName: string;
  email: string;
  expertise: string;
  yearsExperience: number;
  experienceNote: string;
  portfolioUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string | null;
  rejectReason: string | null;
  createdAt: string;
}

export interface ParentAccount {
  userId: number;
  fullName: string;
  email: string;
  status: 'active' | 'locked' | 'suspended' | 'unverified';
  createdAt: string;
  lastLoginAt: string | null;
  childCount: number;
  quotaUsed: number;
  reportsSent: number;
  reportsAgainst: number;
  suspendedReason: string | null;
}

export type ModerationItemType = 'public_story_review' | 'roadmap_template_review' | 'gray_zone_story' | 'content_report' | 'community_submission';
export type ModerationDecision = 'approved' | 'changes_requested' | 'rejected' | 'cleared' | 'blocked' | 'archived' | 'dismissed' | 'escalated';

export interface ModerationItem {
  id: number;
  itemType: ModerationItemType;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_review' | 'escalated' | 'resolved' | 'withdrawn' | 'closed';
  submittedAt: string;
  dueAt: string;
  claimedByUserId: number | null;
  claimedAt: string | null;
  decision: ModerationDecision | null;
  decisionReason: string | null;
  /** Nội dung cần xem — thông tin cá nhân đã được che (BR-5.M3). */
  subject: {
    title: string;
    content: string;
    targetAgeBand: string | null;
    readingLevel: number | null;
    tags: string[];
    wishCardIds: number[];
    reportReason?: string | null;
    reportDescription?: string | null;
    modelRiskScore?: number | null;
    storyIds?: number[];
  };
  refId: number;
}

export interface PublicStory {
  id: number;
  title: string;
  targetAgeBand: string;
  readingLevel: number;
  genre: string;
  topic: string;
  moralLesson: string;
  content: string;
  status: 'draft' | 'pending_moderation' | 'changes_requested' | 'ready' | 'rejected' | 'archived';
  feedback: string | null;
  versionNo: number;
  updatedAt: string;
}

export interface TemplateDraft {
  id: number;
  title: string;
  description: string;
  targetAgeBand: string;
  readingLevelMin: number;
  readingLevelMax: number;
  topic: string;
  storyIds: number[];
  defaultDaysPerStep: number | null;
  status: 'draft' | 'pending_moderation' | 'published' | 'archived';
  needsRevision: boolean;
  feedback: string | null;
}

// ---------- Bộ truyện mẫu qua API (`/RoadmapTemplate`). Độ tuổi dạng "6-8" / "9-10". ----------

export type RoadmapTemplateGroup = 'Drafts' | 'Pending' | 'Published' | 'Archived' | 'Orphaned';
export interface RoadmapCategoryRef { id: number; code: string; displayName: string }

export interface RoadmapTemplateListItem {
  id: number; name: string; ageBand: string; mainCategory: RoadmapCategoryRef | null; storyCount: number; status: string;
  createdByName: string | null; isMine: boolean; submittedAt: string | null; publishedAt: string | null;
  openCloneId: number | null; needsUpdate: boolean; retiredStoryCount: number;
}

export interface RoadmapTemplateDetail {
  id: number; name: string; description: string | null; ageBand: string; mainCategory: RoadmapCategoryRef | null;
  readingLevelMin: number; readingLevelMax: number; defaultDaysPerStory: number; status: string;
  createdByName: string | null; isMine: boolean; clonedFromId: number | null;
  stories: { storyId: number; position: number; days: number | null; title: string | null; ageBand: string; readingLevel: number | null; isEligible: boolean }[];
  checks: { code: string; passed: boolean; message: string }[];
  canSubmit: boolean;
  lastReview: { decision: string; reviewerName: string | null; generalNote: string | null; reason: string | null; parts: { partType: string; storyId: number | null; action: string | null; note: string }[]; decidedAt: string | null } | null;
  needsUpdate: boolean;
  retiredStoryIds: number[];
}

export interface RoadmapTemplateInput {
  name: string; description: string | null; ageBand: '6-8' | '9-10'; mainCategoryId: number;
  readingLevelMin: number; readingLevelMax: number; defaultDaysPerStory: number;
}

export interface RoadmapCandidateStory { storyId: number; title: string | null; ageBand: string; readingLevel: number | null; labels: RoadmapCategoryRef[] }

export interface AiMetrics {
  period: string;
  generationSuccessRate: number;
  ruleBlockRate: number;
  modelFlagRate: number;
  grayZoneClearRate: number;
  regenerationRate: number;
  adaptationRate: number;
  approvalRate: number;
  rejectionRate: number;
  tagCorrectionRate: number;
  fidelityFailRate: Record<'F1' | 'F2' | 'F3' | 'F4' | 'F5', number>;
  revisionRateByIntent: Record<string, number>;
  avgTokensPerStory: number;
  avgLatencyMs: number;
  wishAcceptanceRate: number;
  avgModerationHours: number;
  overdueModeration: number;
}

export interface GenerationJobLog {
  jobId: number;
  at: string;
  source: 'parent' | 'content_creator' | 'evaluation';
  storyType: 'linear' | 'interactive';
  stage: string;
  refineCount: number;
  moderationZone: 'safe' | 'gray' | 'blocked';
  totalTokens: number;
  durationMs: number;
  result: 'success' | 'failed' | 'blocked';
  promptVersion: string;
  calls: { callType: string; model: string; tokens: number; latencyMs: number; status: string }[];
}

export interface PromptCatalogVersion {
  id: number;
  version: string;
  status: 'draft' | 'published' | 'deprecated' | 'rolled_back';
  effectiveDate: string;
  modelFlagThreshold: number;
  modelBlockThreshold: number;
  note: string;
  createdAt: string;
}

export type CatalogKind = 'wish_card' | 'moral_lesson' | 'sample_character';
export interface CatalogEntry { id: number; kind: CatalogKind; label: string; emoji: string | null; group: string | null; ageBands: string[]; isActive: boolean }

export interface EvaluationPrompt {
  id: number;
  caseType: 'normal' | 'edge' | 'adversarial';
  params: { ageBand: string; readingLevel: number; genre: string; topic: string; lesson: string };
  expectedOutcome: 'pass' | 'hard_block' | 'gray_or_block';
  status: 'draft' | 'active' | 'retired';
  createdBy: string;
}

export interface EvaluationRun {
  id: number;
  catalogVersion: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: string;
  results: { promptId: number; actualOutcome: string; matched: boolean; readabilityPass: boolean; lengthPass: boolean; tokens: number; latencyMs: number; rating: { safety: number; ageFit: number; educational: number; coherence: number } | null }[];
}

// ---------- API backend đã có ----------
export interface DataRequest { id: number; childProfileId: number; requestType: string; status: string; rejectionReason?: string | null; createdAt: string; resolvedAt: string | null; resolvedByUserId: number | null }

/** `GET /ModeratorAccount` — `status` là AccountStatus của backend (Active / Suspended / PasswordResetPending…). */
export interface ModeratorAccountDto {
  userId: number;
  email: string;
  fullName: string;
  expertise: string | null;
  status: string;
  isActivated: boolean;
  activatedAt: string | null;
  lastLoginAt: string | null;
  inviteExpiresAt: string | null;
}

/** Loại mục và trạng thái trong hàng đợi kiểm duyệt của backend (`ModerationQueue`). */
export type QueueItemType = 'PublicStoryReview' | 'GrayZoneStory' | 'ContentReport' | 'RoadmapTemplateReview' | 'CommunitySubmission' | 'PublicStoryRemoval';
export type QueueItemStatus = 'Pending' | 'Claimed' | 'Approved' | 'ChangesRequested' | 'Rejected' | 'Cleared' | 'Blocked' | 'Dismissed' | 'Archived' | 'Escalated' | 'Withdrawn';

export interface QueueItem {
  id: number;
  itemType: QueueItemType | string;
  status: QueueItemStatus | string;
  priority: 'High' | 'Medium' | 'Low' | string;
  storyId: number | null;
  storyVersionId: number | null;
  contentReportId: number | null;
  readingRoadmapId: number | null;
  isResubmission: boolean;
  slaDueAt: string | null;
  isOverdue: boolean;
  claimedByUserId: number | null;
  claimedAt: string | null;
  claimExpiresAt: string | null;
  createdAt: string;
}

/** Mục đang nhận: thêm cờ, checklist, tiến độ rà (chuỗi JSON). Nội dung truyện lấy riêng theo `storyId`. */
export interface QueueItemDetail extends QueueItem {
  flags: string | null;
  checklist: string | null;
  reviewProgress: string | null;
  /** Dùng khi quyết định yêu cầu gỡ truyện (chống ghi đè đồng thời). */
  rowVersion?: number;
}

// ---------- Gói duyệt theo từng loại mục (Luồng 5 — Moderator ra quyết định) ----------

export interface ReviewBlocker { code: string; message: string }
export interface ReviewLabel { id?: number; contentCategoryId?: number; code: string; displayName: string }
export interface ReviewScene { sceneId?: number; sceneIndex: number; sceneText?: string; text?: string; viewed?: boolean; imageUrls?: string[]; audioUrls?: string[];
  illustrations?: { beatOrder: number; url: string | null }[];
  segments?: { segmentId: number; text: string; audioUrl: string | null; hasPronunciationWarning: boolean; heard: boolean }[] }
export interface ReviewStory { storyId?: number; title: string | null; description: string | null; ageBand: string; readingLevel: number | null; moralLesson?: string | null; labels: ReviewLabel[] }
export interface ReviewVersion { title: string; content: string | null; lesson: string | null }
interface ReviewExtras {
  vocabulary: { id?: number; term: string; definition: string }[];
  quizzes: { id?: number; type: string; question: string; correctAnswer: string | null; choices: string | null }[];
  discussionQuestions: { id?: number; question: string; isMoralLesson: boolean }[];
}

export interface PublicReviewChecklist { safety: boolean | null; ageFit: boolean | null; education: boolean | null; language: boolean | null; copyright: boolean | null; image: boolean | null; audio: boolean | null; interaction: boolean | null }
export interface PublicReviewPackage extends ReviewExtras {
  itemId: number; storyId: number; versionNo: number; isResubmission: boolean;
  story: ReviewStory; version: ReviewVersion; scenes: ReviewScene[];
  flags: { flagId: string; kind: string; name: string; reason: string | null; resolved: boolean }[];
  progress: { totalScenes: number; missingSceneIds: number[]; audioHeardCount: number; missingWarningSegmentIds: number[]; needsAtLeastOneAudio: boolean; requiredViewsComplete: boolean };
  checklist: PublicReviewChecklist; approveBlockers: ReviewBlocker[]; canApprove: boolean;
  reviewHistory: { itemId: number; versionNo: number | null; decision: string; decidedByName: string | null; decidedAt: string | null; reason: string | null; feedback: string | null }[];
}

export interface ChecklistEntry { code: string; label: string; passed: boolean; note: string | null }
export interface CommunityReviewPackage extends ReviewExtras {
  itemId: number; story: ReviewStory; version: ReviewVersion; scenes: ReviewScene[]; labels: ReviewLabel[];
  copyrightDeclaration: string | null; piiRescan: { kind: string; location: string }[]; isResubmission: boolean;
  checklist: ChecklistEntry[]; blockers: ReviewBlocker[]; canApprove: boolean;
}

export interface RoadmapReviewPackage {
  itemId: number;
  roadmap: { id: number; name: string; description: string | null; ageBand: string; mainCategory: { displayName: string } | null; readingLevelMin: number; readingLevelMax: number; defaultDaysPerStory: number; createdByName: string | null };
  stories: { storyId: number; position: number; days: number | null; title: string | null; ageBand: string; isEligible: boolean }[];
  checks: { code: string; passed: boolean; message: string }[];
  checklist: ChecklistEntry[]; blockers: ReviewBlocker[]; canApprove: boolean;
}

export interface ReportReviewPackage extends ReviewExtras {
  itemId: number; reportId: number; reason: string; description: string | null; attachmentUrl: string | null;
  itemStatus: string; escalationReason: string | null; createdAt: string;
  story: ReviewStory & { isArchived: boolean }; version: ReviewVersion | null; scenes: ReviewScene[];
}

/** Một phần cần sửa khi Moderator yêu cầu sửa. Truyện: partId là id cảnh / câu đố / từ; bộ truyện mẫu: storyId + action. */
export interface ChangePart { partType: string; partId?: number | null; storyId?: number | null; action?: string | null; note: string }

/** Lý do gỡ truyện khi xử lý báo cáo (enum ArchivedReason của backend). */
export type ReportArchiveReason = 'SafetyConcern' | 'Copyright' | 'Inappropriate';

export interface QueueQuery { itemType?: QueueItemType; status?: QueueItemStatus; priority?: 'High' | 'Medium' | 'Low'; onlyOverdue?: boolean; pageIndex?: number; pageSize?: number }
export interface BusinessReport { id: number; periodStart: string; periodEnd: string; storiesGenerated: number; storiesApproved: number; storiesRejected: number; readingSessionsCompleted: number; status: string; publishedAt: string | null }
export interface TokenQuotaConfig { id: number; scope: string; organizationId: number | null; childProfileId: number | null; userId: number | null; quotaLimit: number; quotaUsed: number; periodStart: string; periodEnd: string }
export interface PaymentTransaction { id: number; planId: number; planName: string; amount: number; transactionCode: string; qrCodeUrl: string | null; status: string; expiresAt: string; paidAt: string | null; sepayTransactionId: string | null }
export interface AdministratorAccount { userId: number; email: string; fullName: string; role: string; roleBeforeAdmin: string | null }

// ---------- Rà soát nội dung đã công khai (`/PublishedContentReview`) ----------

export type PublishedSource = 'PublicLibrary' | 'RoadmapTemplate';
export interface PublishedContentItem { source: string; id: number; title: string; ageBand: string; labels: ReviewLabel[]; publishedAt: string | null; storyCount: number | null; needsUpdate: boolean }
export interface PublishedStoryContent {
  story: ReviewStory & { isArchived: boolean }; version: ReviewVersion | null; scenes: ReviewScene[];
  vocabulary: { term: string; definition: string }[]; quizzes: { type: string; question: string; correctAnswer: string | null; choices: string | null }[];
  discussionQuestions: { question: string; isMoralLesson: boolean }[];
}
export interface PublishedRoadmap {
  roadmapId: number; name: string; description: string | null; ageBand: string; mainCategory: ReviewLabel | null;
  readingLevelMin: number; readingLevelMax: number; defaultDaysPerStory: number; publishedAt: string | null; needsUpdate: boolean;
  stories: { storyId: number; position: number; days: number | null; title: string | null; ageBand: string; isArchived: boolean }[];
}

/** So sánh phiên bản khi duyệt truyện gửi lại (`/PublicStoryReview/{id}/compare`). */
export interface VersionComparison {
  against: string; baseVersionNo: number; currentVersionNo: number; isIdentical: boolean;
  textDiff: { type: string; before: string | null; after: string | null }[];
  baseMetrics: { wordCount: number; sentenceCount: number }; currentMetrics: { wordCount: number; sentenceCount: number };
  changedFields: string[];
  sceneChanges: { sceneIndex: number; change: string; textChanged: boolean; imageChanged: boolean; audioChanged: boolean }[];
  artifactChanges: { kind: string; change: string; key: string }[];
}
