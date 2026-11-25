export type EventStatus =
  | "Draft"
  | "PendingApproval"
  | "Approved"
  | "Published"
  | "Paused"
  | "Closed"
  | "Archived";

export type EventConfigVersion = "LegacyRoleBased" | "ActivityBased";
export type EventActivityType = "Submission" | "ReadingMissions" | "Voting";
export type EventAudience = "Creator" | "Parent" | "Both";
export type EventReadingStorySource = "CuratedOnly" | "ApprovedSubmissionsOnly" | "Both";
export type EventAwardResultSource = "SubmissionScore" | "VotingAverage" | "MissionCompletion";

export type EventFormat = "Standard" | "SharedCreatorParent";
export type EventScoringMode = "Rubric" | "ParentVoteAverage" | "MissionCompletion" | "CreatorVoteAverage" | "CrossRoleVoteAverage";
export const parentCanVote = (mode?: EventScoringMode) => mode === "ParentVoteAverage" || mode === "CrossRoleVoteAverage";
export const creatorCanVote = (mode?: EventScoringMode) => mode === "CreatorVoteAverage" || mode === "CrossRoleVoteAverage";

export interface EventVotingSchedule {
  submissionCutoffAt: string;
  reviewCutoffAt: string;
  votingStartAt: string;
  votingEndAt: string;
}
export type EventTrackType = "Creator" | "Parent";

export type TrackCompletionMode =
  | "AllMandatory"
  | "MinimumTasksCount"
  | "MinimumPointsThreshold";

export type TaskVerifierType =
  | "ReadEventStories"
  | "CompleteStoryQuiz"
  | "SaveStoryVocabulary"
  | "AnswerChildQuestion"
  | "GuidedDiscussionCheckin"
  | "RealLifePracticeCheckin"
  | "RateAndReviewStory"
  | "ActiveDaysCount"
  | "SubmitApprovedStory"
  | "VoteEventStories";

export type EventParticipationStatus =
  | "Registered"
  | "MissionCompleted"
  | "PendingVerification"
  | "Verified"
  | "VerificationFailed"
  | "ManualReview"
  | "Disqualified";

export type EventAppealStatus = "Open" | "UnderReview" | "Accepted" | "Rejected" | "Escalated";
export type EventRewardType = "PhysicalGift" | "PlatformCredits" | "CashTransfer" | "CreatorPackage";
export type EventAwardStatus =
  | "AwardProposed"
  | "AwardApproved"
  | "AwaitingClaim"
  | "Claimed"
  | "FulfillmentProcessing"
  | "Fulfilled"
  | "Expired"
  | "UnclaimedBudgetReturned"
  | "Failed";

export interface EventSummaryDto {
  opensAt?: string | null;
  closesAt?: string | null;
  id: number;
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string | null;
  mainCategoryId: number;
  mainCategoryName?: string | null;
  targetAgeBands: string;
  status: EventStatus;
  configVersion?: EventConfigVersion;
  format?: EventFormat;
  scoringMode?: EventScoringMode;
  minVotesPerSubmission?: number;
  maxParentRegistrations?: number | null;
  submissionCutoffAt?: string | null;
  reviewCutoffAt?: string | null;
  votingStartAt?: string | null;
  votingEndAt?: string | null;
  creatorVotingSchedule?: EventVotingSchedule | null;
  resultsFinalizedAt?: string | null;
  budgetVnd: number;
  createdAt?: string;
  publishedAt?: string | null;
  closedAt?: string | null;
}

export interface EventTrackDto {
  id: number;
  trackType: EventTrackType;
  registrationStartAt: string;
  registrationEndAt: string;
  executionStartAt: string;
  executionEndAt: string;
  maxSubmissionsPerUser: number;
  grantAiCredits: number;
  grantSubmitCredits: number;
  waiveWeeklyLibraryLimit: boolean;
  claimWindowHours: number;
  maxReallocationRounds: number;
  awardAllMissionCompleters?: boolean;
}

export interface EventTaskDefinitionDto {
  id: number;
  taskCode: string;
  targetTrackType?: EventTrackType | null;
  title: string;
  description: string;
  sortOrder: number;
  verifierType: TaskVerifierType;
  targetValue: number;
  configJson?: string | null;
  isMandatory: boolean;
  points: number;
  allowMultiplePerStory: boolean;
}

export interface EventRuleVersionDto {
  id: number;
  versionNo: number;
  contentHash: string;
  rulesText: string;
  rewardEligibilityText?: string | null;
  tieBreakerPolicyText?: string | null;
  insufficientVotesPolicyText?: string | null;
  creatorRubricJson?: string | null;
  completionMode: TrackCompletionMode;
  requiredTaskCount?: number | null;
  requiredPoints?: number | null;
  isActive: boolean;
  tasks: EventTaskDefinitionDto[];
}

export interface EventActivityDto {
  id: number;
  activityType: EventActivityType;
  allowedAudience: EventAudience;
  registrationStartAt: string;
  registrationEndAt: string;
  startAt: string;
  endAt: string;
  reviewCutoffAt?: string | null;
  grantAiCredits: number;
  maxSubmissionsPerUser?: number | null;
  maxRegistrations?: number | null;
  waiveWeeklyLibraryLimit: boolean;
  storySource: EventReadingStorySource;
  minVotesPerSubmission: number;
  claimWindowHours: number;
  maxReallocationRounds: number;
  awardAllMissionCompleters: boolean;
  configJson?: string | null;
}

export interface UpsertEventActivityDto {
  activityType: EventActivityType;
  allowedAudience: EventAudience;
  registrationStartAt: string;
  registrationEndAt: string;
  startAt: string;
  endAt: string;
  reviewCutoffAt?: string | null;
  grantAiCredits: number;
  maxSubmissionsPerUser?: number | null;
  maxRegistrations?: number | null;
  waiveWeeklyLibraryLimit: boolean;
  storySource: EventReadingStorySource;
  minVotesPerSubmission: number;
  claimWindowHours: number;
  maxReallocationRounds: number;
  awardAllMissionCompleters: boolean;
  configJson?: string | null;
}

export interface EventActivityUserStateDto {
  activityId: number;
  activityType: EventActivityType;
  allowedAudience: EventAudience;
  lifecycleStatus: "NotOpen" | "Open" | "Ended";
  isEligible: boolean;
  isRegistered: boolean;
  participationId?: number | null;
  participationStatus?: EventParticipationStatus | null;
  appealDeadlineAt?: string | null;
  canRegister: boolean;
  canSubmit: boolean;
  canDoMissions: boolean;
  canVote: boolean;
  submissionsCount: number;
  maxSubmissionsPerUser?: number | null;
}

export interface CloneLegacyDraftResultDto {
  draft: EventDetailDto;
  unmappedWarnings: string[];
}

export interface EventAwardSlotDto {
  id: number;
  trackId?: number | null;
  eventActivityId?: number | null;
  activityType?: EventActivityType | null;
  resultSource?: EventAwardResultSource | null;
  targetAudience?: EventAudience | null;
  rankOrTier: string;
  slotIndex: number;
  rewardType: EventRewardType;
  rewardName: string;
  unitValueVnd: number;
  creditGrantAmount: number;
  submitCreditGrantAmount?: number;
  participationId?: number | null;
  status: EventAwardStatus;
  claimDeadlineAt?: string | null;
  notificationFailed?: boolean;
}

export interface EventRewardRecipientDto {
  awardId: number;
  rewardType: EventRewardType;
  recipientName?: string | null;
  phoneNumber?: string | null;
  shippingAddress?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  legacyBankAccountText?: string | null;
  isLegacyPlaintext: boolean;
}

export interface EventAwardNotificationResultDto {
  sentCount: number;
  failedAwardIds: number[];
}

export interface EventDetailDto extends EventSummaryDto {
  canManageEvent?: boolean | null;
  leadModeratorId?: number | null;
  assistantModeratorIds?: number[] | null;
  canOperateEvent?: boolean | null;
  tracks: EventTrackDto[];
  activities?: EventActivityDto[];
  myActivityStates?: EventActivityUserStateDto[];
  activeRule?: EventRuleVersionDto | null;
  awards: EventAwardSlotDto[];
  eventStoriesCount: number;
}

export interface EventParticipationDto {
  id: number;
  eventId: number;
  trackId?: number | null;
  trackType: EventTrackType;
  eventActivityId?: number | null;
  activityType?: EventActivityType | null;
  userId: number;
  acceptedRuleVersionId: number;
  status: EventParticipationStatus;
  missionCompletedAt?: string | null;
  verifiedAt?: string | null;
  appealDeadlineAt?: string | null;
  verificationNotesJson?: string | null;
  safetyWarning?: string | null;
}

export interface EventSubmissionDto {
  submittedTitle?: string | null;
  submittedText?: string | null;
  id: number;
  eventId: number;
  eventActivityId?: number | null;
  authorUserId?: number;
  storyId: number;
  currentStoryVersionId: number;
  lockedStoryVersionId?: number | null;
  similarityScore?: number | null;
  similarityReferenceStoryId?: number | null;
  status: string;
  submittedAt?: string | null;
  averageScore?: number | null;
  evaluationCount?: number;
  validVoteCount?: number;
  averageStars?: number | null;
}

export interface EventTaskProgressItemDto {
  taskDefinitionId: number;
  taskCode: string;
  title: string;
  description: string;
  verifierType: TaskVerifierType;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  isMandatory: boolean;
  points: number;
}

export interface EventStoryLibraryItemDto {
  votingText?: string | null;
  storyId: number;
  storyVersionId?: number;
  title: string;
  description: string;
  ageBand: string;
  genre: string;
  source: string;
  hasFamilyRead?: boolean;
  myVoteStars?: number | null;
  myVoteComment?: string | null;
}

export interface EventMissionDashboardDto {
  participation: EventParticipationDto;
  completionMode: TrackCompletionMode;
  requiredTaskCount?: number | null;
  requiredPoints?: number | null;
  completedTasksCount: number;
  earnedPoints: number;
  allRequirementsMet: boolean;
  tasks: EventTaskProgressItemDto[];
  stories: EventStoryLibraryItemDto[];
  votingStories?: EventStoryLibraryItemDto[];
}

export interface EventAppealDto {
  id: number;
  eventId: number;
  participationId: number;
  appellantUserId: number;
  reasonText: string;
  status: EventAppealStatus;
  resolutionNote?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface EventReportSummaryDto {
  eventId: number;
  status: EventStatus;
  creatorRegistrations: number;
  creatorSubmissions: number;
  parentSubmissions?: number;
  publishedEventStories: number;
  parentRegistrations: number;
  parentVerifiedCount: number;
  awardsProposedOrApproved: number;
  awardsFulfilled: number;
  approvedBudgetVnd: number;
  fulfilledValueVnd: number;
  retention7DayActiveUsers: number;
  retention30DayActiveUsers: number;
  familiesCompletedFirstRead?: number;
  secondStoryReturnRate?: number;
  submissionsMeetingVoteThresholdRate?: number;
}

export interface UpsertEventTaskDto {
  taskCode?: string;
  targetTrackType?: EventTrackType | null;
  title: string;
  description: string;
  sortOrder: number;
  verifierType: TaskVerifierType;
  targetValue: number;
  configJson?: string | null;
  isMandatory: boolean;
  points: number;
  allowMultiplePerStory: boolean;
}

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  Draft: "Bản nháp",
  PendingApproval: "Chờ Admin duyệt",
  Approved: "Đã duyệt ngân sách",
  Published: "Đang mở",
  Paused: "Tạm dừng",
  Closed: "Đã kết thúc",
  Archived: "Lưu trữ",
};

export const VERIFIER_TYPE_LABEL: Record<TaskVerifierType, string> = {
  ReadEventStories: "Đọc truyện trong sự kiện",
  CompleteStoryQuiz: "Hoàn thành câu đố cuối truyện",
  SaveStoryVocabulary: "Lưu từ vựng mới",
  AnswerChildQuestion: "Giải đáp thắc mắc của bé",
  GuidedDiscussionCheckin: "Thảo luận câu chuyện cùng con",
  RealLifePracticeCheckin: "Thực hành bài học thực tế",
  RateAndReviewStory: "Đánh giá & nhận xét truyện",
  ActiveDaysCount: "Số ngày tham gia hợp lệ",
  SubmitApprovedStory: "Nộp truyện được duyệt",
  VoteEventStories: "Đọc & bình chọn truyện",
};

export const COMPLETION_MODE_LABEL: Record<TrackCompletionMode, string> = {
  AllMandatory: "Hoàn thành tất cả nhiệm vụ bắt buộc",
  MinimumTasksCount: "Hoàn thành tối thiểu N nhiệm vụ",
  MinimumPointsThreshold: "Đạt ngưỡng điểm tích lũy",
};

export const EVENT_ACTIVITY_LABEL: Record<EventActivityType, string> = {
  Submission: "Sáng tác / Nộp bài",
  ReadingMissions: "Đọc truyện & Làm nhiệm vụ",
  Voting: "Bình chọn truyện",
};

export const EVENT_AUDIENCE_LABEL: Record<EventAudience, string> = {
  Creator: "Creator",
  Parent: "Parent",
  Both: "Cả Creator và Parent",
};

export const EVENT_STORY_SOURCE_LABEL: Record<EventReadingStorySource, string> = {
  CuratedOnly: "Chỉ truyện có sẵn (Moderator chọn)",
  ApprovedSubmissionsOnly: "Chỉ bài dự thi đã duyệt",
  Both: "Cả truyện có sẵn và bài dự thi đã duyệt",
};

export const EVENT_RESULT_SOURCE_LABEL: Record<EventAwardResultSource, string> = {
  SubmissionScore: "Điểm chấm bài dự thi",
  VotingAverage: "Điểm sao bình chọn",
  MissionCompletion: "Hoàn thành nhiệm vụ đọc",
};

export const EVENT_FORMAT_LABEL: Record<EventFormat, string> = {
  Standard: "Sự kiện chuẩn (2 pha)",
  SharedCreatorParent: "Sự kiện chung Creator & Parent",
};

export const REWARD_TYPE_LABEL: Record<EventRewardType, string> = {
  PhysicalGift: "Quà hiện vật",
  PlatformCredits: "Lượt tạo truyện AI",
  CashTransfer: "Tiền thưởng chuyển khoản",
  CreatorPackage: "Gói Creator (AI + Gửi duyệt)",
};

export interface EventVoteDto {
  id: number;
  eventId: number;
  eventSubmissionId?: number | null;
  storyId: number;
  storyVersionId: number;
  parentUserId: number;
  voterTrackType?: EventTrackType;
  stars: number;
  comment?: string | null;
  readingSessionId: number | null;
  isDisqualified: boolean;
  disqualifiedReason?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface EventLeaderboardEntryDto {
  authorTrackType?: EventTrackType;
  rank: number;
  submissionId: number;
  participationId: number;
  creatorUserId: number;
  storyId: number;
  storyTitle: string;
  validVoteCount: number;
  averageStars: number;
  meetsThreshold: boolean;
  firstSubmittedAt: string;
}

export interface EventLeaderboardDto {
  eventId: number;
  hidden: boolean;
  resultsFinalized: boolean;
  finalizedAt?: string | null;
  scoringMode: EventScoringMode;
  minVotesPerSubmission: number;
  entries: EventLeaderboardEntryDto[];
}

export const AWARD_STATUS_LABEL: Record<EventAwardStatus, string> = {
  AwardProposed: "Chờ đề xuất / duyệt giải",
  AwardApproved: "Đã duyệt giải",
  AwaitingClaim: "Chờ người thắng nhận",
  Claimed: "Đã xác nhận nhận",
  FulfillmentProcessing: "Đang giao / chuyển thưởng",
  Fulfilled: "Đã trao xong",
  Expired: "Quá hạn nhận",
  UnclaimedBudgetReturned: "Đã hoàn ngân sách",
  Failed: "Trao thưởng thất bại",
};

export const PARTICIPATION_STATUS_LABEL: Record<EventParticipationStatus, string> = {
  Registered: "Đã đăng ký",
  MissionCompleted: "Đã hoàn thành nhiệm vụ",
  PendingVerification: "Đang xác minh",
  Verified: "Đã xác minh đạt",
  VerificationFailed: "Chưa đạt điều kiện",
  ManualReview: "Đang rà soát thủ công",
  Disqualified: "Bị loại",
};

export const SUBMISSION_STATUS_LABEL: Record<string, string> = {
  Draft: "Bản nháp",
  PendingReview: "Chờ duyệt",
  ChangesRequested: "Cần chỉnh sửa",
  Approved: "Đã duyệt hợp lệ",
  Rejected: "Từ chối",
  ReviewExpired: "Quá hạn duyệt",
  Disqualified: "Bị loại",
};

export const APPEAL_STATUS_LABEL: Record<EventAppealStatus, string> = {
  Open: "Đang chờ xử lý",
  UnderReview: "Đang xem xét",
  Accepted: "Đã chấp nhận",
  Rejected: "Đã từ chối",
  Escalated: "Đã chuyển cấp cao",
};

/** Khoảng thời gian (7 ngày) để đánh dấu sự kiện vừa tạo / vừa công bố là "Mới". */
export const NEW_EVENT_WINDOW_MS = 7 * 86_400_000;

export function isNewEvent(
  event: Pick<EventSummaryDto, "status" | "createdAt" | "publishedAt">,
  now = Date.now(),
): boolean {
  if (event.status === "Closed" || event.status === "Archived") return false;
  const raw =
    event.status === "Published" || event.status === "Paused"
      ? event.publishedAt || event.createdAt
      : event.createdAt;
  if (!raw) return false;
  const ts = Date.parse(raw);
  return Number.isFinite(ts) && ts <= now + 5 * 60_000 && now - ts < NEW_EVENT_WINDOW_MS;
}
