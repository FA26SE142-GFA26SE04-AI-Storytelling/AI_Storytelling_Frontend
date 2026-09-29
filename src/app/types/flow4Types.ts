export enum AssignmentStatus {
  Assigned = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
}

export interface AssignmentRecipientItem {
  id: number;
  assignmentId: number;
  childProfileId: number;
  childName: string;
  status: AssignmentStatus;
  completedAt?: string | null;
  cancelledByUserId?: number | null;
  cancelledByName?: string | null;
  cancelledAt?: string | null;
  o2oAssessment?: O2OAssessmentItem | null;
}

export interface AssignmentItem {
  id: number;
  storyId: number;
  storyTitle: string;
  storyCoverUrl?: string;
  assignedByUserId: number;
  assignedByName: string;
  classGroupId?: number | null;
  classGroupName?: string | null;
  childProfileId?: number | null;
  childName?: string | null;
  status: AssignmentStatus;
  assignedAt: string;
  dueAt?: string | null;
  recipients: AssignmentRecipientItem[];
}

export interface O2OAssessmentItem {
  id: number;
  assignmentRecipientId: number;
  teacherUserId: number;
  teacherName: string;
  bonusPoints: number;
  notes?: string;
  assessedAt: string;
}

export enum ShareMode {
  Direct = 1,
  Broadcast = 2,
}

export enum TeacherShareStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3,
}

export enum RecipientStatus {
  Pending = 1,
  Accepted = 2,
  Rejected = 3,
}

export interface SharedStoryRecipientItem {
  id: number;
  sharedStoryId: number;
  recipientUserId: number;
  recipientName: string;
  childName: string;
  status: RecipientStatus;
  respondedAt?: string | null;
}

export interface SharedStoryItem {
  id: number;
  storyId: number;
  storyTitle: string;
  storyCoverUrl?: string;
  sharedByUserId: number;
  sharedByName: string;
  classGroupId: number;
  classGroupName: string;
  shareMode: ShareMode;
  teacherStatus: TeacherShareStatus;
  teacherNotes?: string;
  reviewedByUserId?: number | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  recipients: SharedStoryRecipientItem[];
}

export enum InterventionTrigger {
  AutoLowComprehension = 1,
  TeacherManual = 2,
  RecommendationSystem = 3,
}

export enum InterventionStatus {
  OpenHoldMode = 1,
  UnderReview = 2,
  ResolvedUnlocked = 3,
}

export interface InterventionCaseItem {
  id: number;
  childProfileId: number;
  childName: string;
  triggerType: InterventionTrigger;
  status: InterventionStatus;
  skillGapNotes?: string;
  openedAt: string;
  triggeringStoryId?: number | null;
  triggeringStoryTitle?: string | null;
  comprehensionRate: number; // e.g. 64%
  resolvedByUserId?: number | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
}

export enum ContentReportReason {
  SafetyConcern = 1,
  Inappropriate = 2,
  WrongAgeBand = 3,
  Other = 4,
}

export enum ContentReportStatus {
  Pending = 1,
  ReviewedDismissed = 2,
  ReviewedArchived = 3,
}

export interface ContentReportItem {
  id: number;
  storyId: number;
  storyTitle: string;
  reporterUserId: number;
  reporterName: string;
  reason: ContentReportReason;
  description?: string;
  status: ContentReportStatus;
  createdAt: string;
  reviewedByUserId?: number | null;
  reviewedAt?: string | null;
  resolutionNotes?: string;
}

export enum Flow4NotificationType {
  SupervisionInvite = 1,
  SupervisionRevokedCascade = 2,
  StoryShared = 3,
  HoldModeAlert = 4,
  TeacherInteractionScore = 5,
  AssignmentCancelled = 6,
  RecommendationAwaitingReview = 7,
  ContentReported = 13,
  ContentReportSlaWarning = 21,
  ContentReportResolved = 22,
}

export interface Flow4NotificationItem {
  id: number;
  userId: number;
  type: Flow4NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface DiscussionQuestionItem {
  id: number;
  storyVersionId: number;
  question: string;
  isMoralLesson: boolean;
}
