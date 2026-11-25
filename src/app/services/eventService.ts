import type { ApiResponse } from "@/app/types/auth";
import type {
  CloneLegacyDraftResultDto,
  EventActivityType,
  EventAppealDto,
  EventAppealStatus,
  EventAudience,
  EventAwardResultSource,
  EventAwardSlotDto,
  EventAwardNotificationResultDto,
  EventRewardRecipientDto,
  EventConfigVersion,
  EventDetailDto,
  EventFormat,
  EventLeaderboardDto,
  EventMissionDashboardDto,
  EventParticipationDto,
  EventReportSummaryDto,
  EventRewardType,
  EventRuleVersionDto,
  EventScoringMode,
  EventSubmissionDto,
  EventSummaryDto,
  EventTrackType,
  EventVoteDto,
  EventVotingSchedule,
  TrackCompletionMode,
  UpsertEventActivityDto,
  UpsertEventTaskDto,
} from "@/app/types/event";
import { apiRequest } from "./apiClient";

export type EventRewardPlanDto = {
  id: number;
  name: string;
  aiCredits: number;
  submitCredits: number;
};

export type EventTaskStoryOption = {
  id: number;
  title: string;
  source: "CreatorSubmission" | "ModeratorSeed";
  canUseForReading: boolean;
  hasLearningContent: boolean;
};

export type CreateEventPayload = {
  opensAt?: string;
  closesAt?: string;
  title: string;
  description: string;
  bannerUrl?: string | null;
  mainCategoryId: number;
  targetAgeBands: string;
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
  budgetVnd: number;
  tracks: {
    trackType: EventTrackType;
    awardAllMissionCompleters?: boolean;
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
  }[];
  activities?: UpsertEventActivityDto[];
  awardSlots: {
    trackType?: EventTrackType;
    activityType?: EventActivityType;
    eventActivityId?: number;
    resultSource?: EventAwardResultSource;
    targetAudience?: EventAudience;
    rankOrTier: string;
    slotCount: number;
    rewardType: EventRewardType;
    rewardName: string;
    unitValueVnd: number;
    creditGrantAmount: number;
    submitCreditGrantAmount?: number;
  }[];
};

export const eventService = {
  taskFilterStories(eventId: number, signal?: AbortSignal): Promise<ApiResponse<EventTaskStoryOption[]>> {
    return apiRequest(`/events/${eventId}/task-filter-stories`, "Không tải được truyện của sự kiện.", { signal });
  },

  rewardPlans(signal?: AbortSignal): Promise<ApiResponse<EventRewardPlanDto[]>> {
    return apiRequest("/events/reward-plans", "Không tải được danh mục gói thưởng.", { signal });
  },

  list(includeDrafts = false): Promise<ApiResponse<EventSummaryDto[]>> {
    return apiRequest(`/events?includeDrafts=${includeDrafts}`, "Không tải được danh sách sự kiện.");
  },

  detail(eventId: number): Promise<ApiResponse<EventDetailDto>> {
    return apiRequest(`/events/${eventId}`, "Không tải được chi tiết sự kiện.");
  },

  updateLeadModerator(eventId: number, moderatorId: number, assistantModeratorIds: number[]): Promise<ApiResponse<EventDetailDto>> {
    return apiRequest(`/events/${eventId}/lead-moderator`, "Không lưu được phân công Moderator.", {
      method: "PUT", body: { moderatorId, assistantModeratorIds },
    });
  },

  create(payload: CreateEventPayload): Promise<ApiResponse<EventDetailDto>> {
    return apiRequest("/events", "Không tạo được sự kiện.", {
      method: "POST",
      body: payload,
    });
  },

  update(eventId: number, payload: CreateEventPayload): Promise<ApiResponse<EventDetailDto>> {
    return apiRequest(`/events/${eventId}`, "Không cập nhật được sự kiện.", {
      method: "PUT",
      body: payload,
    });
  },

  deleteDraft(eventId: number): Promise<ApiResponse<boolean>> {
    return apiRequest(`/events/${eventId}`, "Không xóa được bản nháp sự kiện.", { method: "DELETE" });
  },

  cloneToActivityDraft(eventId: number): Promise<ApiResponse<CloneLegacyDraftResultDto>> {
    return apiRequest(`/events/${eventId}/clone-to-activity-draft`, "Không sao chép được bản nháp sang mô hình hoạt động.", {
      method: "POST",
    });
  },

  updateRulesSection(
    eventId: number,
    payload: {
      rulesText: string;
      rewardEligibilityText?: string | null;
      tieBreakerPolicyText?: string | null;
      insufficientVotesPolicyText?: string | null;
      scoringMode: EventScoringMode;
      minVotesPerSubmission: number;
      creatorRubricJson?: string | null;
    },
  ): Promise<ApiResponse<EventRuleVersionDto>> {
    return apiRequest(`/events/${eventId}/rules-section`, "Không lưu được mục thể lệ.", {
      method: "PUT",
      body: payload,
    });
  },

  updateScheduleSection(
    eventId: number,
    payload: {
      format: EventFormat;
      targetAgeBands: string;
      maxParentRegistrations?: number | null;
      submissionCutoffAt?: string | null;
      reviewCutoffAt?: string | null;
      votingStartAt?: string | null;
      votingEndAt?: string | null;
      tracks: CreateEventPayload["tracks"];
    },
  ): Promise<ApiResponse<EventDetailDto>> {
    return apiRequest(`/events/${eventId}/schedule-section`, "Không lưu được mục điều kiện và lịch.", {
      method: "PUT",
      body: payload,
    });
  },

  updateTasksSection(
    eventId: number,
    payload: {
      completionMode: TrackCompletionMode;
      requiredTaskCount?: number | null;
      requiredPoints?: number | null;
      tasks: UpsertEventTaskDto[];
    },
  ): Promise<ApiResponse<EventRuleVersionDto>> {
    return apiRequest(`/events/${eventId}/tasks-section`, "Không lưu được mục nhiệm vụ.", {
      method: "PUT",
      body: payload,
    });
  },

  updateAwardsSection(
    eventId: number,
    payload: {
      budgetVnd: number;
      awardAllParentMissionCompleters: boolean;
      awardSlots: Array<CreateEventPayload["awardSlots"][number] & { submitCreditGrantAmount?: number }>;
    },
  ): Promise<ApiResponse<EventDetailDto>> {
    return apiRequest(`/events/${eventId}/awards-section`, "Không lưu được mục phần thưởng.", {
      method: "PUT",
      body: payload,
    });
  },

  upsertRules(
    eventId: number,
    payload: {
      rulesText: string;
      creatorRubricJson?: string | null;
      completionMode: TrackCompletionMode;
      requiredTaskCount?: number | null;
      requiredPoints?: number | null;
      tasks: UpsertEventTaskDto[];
    },
  ): Promise<ApiResponse<EventRuleVersionDto>> {
    return apiRequest(`/events/${eventId}/rules`, "Không lưu được thể lệ và nhiệm vụ.", {
      method: "POST",
      body: payload,
    });
  },

  submitApproval(eventId: number): Promise<ApiResponse<EventSummaryDto>> {
    return apiRequest(`/events/${eventId}/submit-approval`, "Không gửi duyệt được sự kiện.", { method: "POST" });
  },

  approve(eventId: number, approved: boolean, note?: string): Promise<ApiResponse<EventSummaryDto>> {
    return apiRequest(`/events/${eventId}/approve`, "Không duyệt được sự kiện.", {
      method: "POST",
      body: { approved, note },
    });
  },

  publish(eventId: number): Promise<ApiResponse<EventSummaryDto>> {
    return apiRequest(`/events/${eventId}/publish`, "Không phát hành được sự kiện.", { method: "POST" });
  },

  seedStories(eventId: number, storyIds: number[]): Promise<ApiResponse<number>> {
    return apiRequest(`/events/${eventId}/seed-stories`, "Không bổ sung được truyện dự phòng.", {
      method: "POST",
      body: { storyIds },
    });
  },

  summary(eventId: number): Promise<ApiResponse<EventReportSummaryDto>> {
    return apiRequest(`/events/${eventId}/summary`, "Không tải được báo cáo sự kiện.");
  },

  close(eventId: number): Promise<ApiResponse<EventSummaryDto>> {
    return apiRequest(`/events/${eventId}/close`, "Không đóng được sự kiện.", { method: "POST" });
  },

  register(
    eventId: number,
    target: EventTrackType | { trackType?: EventTrackType; activityType?: EventActivityType; eventActivityId?: number },
  ): Promise<ApiResponse<EventParticipationDto>> {
    const body = typeof target === "string"
      ? { trackType: target, acceptRules: true }
      : { ...target, acceptRules: true };
    return apiRequest(`/events/${eventId}/register`, "Không đăng ký tham gia được.", {
      method: "POST",
      body,
    });
  },

  submitActivityStory(
    eventId: number,
    storyId: number,
    consentToEventSharing = true,
  ): Promise<ApiResponse<EventSubmissionDto>> {
    return apiRequest(`/events/${eventId}/activities/submission/submit`, "Không nộp được bài dự thi.", {
      method: "POST",
      body: { storyId, consentToEventSharing },
    });
  },

  mySubmissions(eventId: number): Promise<ApiResponse<EventSubmissionDto[]>> {
    return apiRequest(`/events/${eventId}/my-submissions`, "Không tải được danh sách bài đã nộp.");
  },

  parentSubmit(eventId: number, storyId: number): Promise<ApiResponse<EventSubmissionDto>> {
    return apiRequest(`/events/${eventId}/parent-submit`, "Không nộp được truyện.", {
      method: "POST", body: { storyId, consentToEventSharing: true },
    });
  },

  reviewParentSubmission(eventId: number, submissionId: number, storyVersionId: number, submittedAt: string | null, approved: boolean): Promise<ApiResponse<EventSubmissionDto>> {
    return apiRequest(`/events/${eventId}/submissions/${submissionId}/review-parent`, "Không duyệt được bài dự thi.", {
      method: "POST", body: { storyVersionId, submittedAt, approved },
    });
  },

  creatorSubmit(eventId: number, storyId: number): Promise<ApiResponse<EventSubmissionDto>> {
    return apiRequest(`/events/${eventId}/creator-submit`, "Không nộp được truyện dự thi.", {
      method: "POST",
      body: { storyId },
    });
  },

  listSubmissions(eventId: number): Promise<ApiResponse<EventSubmissionDto[]>> {
    return apiRequest(`/events/${eventId}/submissions`, "Không tải được danh sách bài dự thi.");
  },

  mySubmission(eventId: number): Promise<ApiResponse<EventSubmissionDto | null>> {
    return apiRequest(`/events/${eventId}/my-submission`, "Không tải được bài dự thi của bạn.");
  },

  myParticipation(eventId: number, trackType: EventTrackType = "Creator"): Promise<ApiResponse<EventParticipationDto | null>> {
    return apiRequest(`/events/${eventId}/my-participation?trackType=${trackType}`, "Không tải được trạng thái tham gia.");
  },

  myParticipations(): Promise<ApiResponse<EventParticipationDto[]>> {
    return apiRequest("/events/my-participations", "Không tải được danh sách sự kiện đã tham gia.");
  },

  missionDashboard(eventId: number): Promise<ApiResponse<EventMissionDashboardDto>> {
    return apiRequest(`/events/${eventId}/mission-dashboard`, "Không tải được bảng nhiệm vụ.");
  },

  castVote(
    eventId: number,
    payload: { storyId: number; stars: number; comment?: string; childProfileId?: number },
  ): Promise<ApiResponse<EventVoteDto>> {
    return apiRequest(`/events/${eventId}/votes`, "Không ghi nhận được phiếu bình chọn.", {
      method: "POST",
      body: payload,
    });
  },

  listVotes(eventId: number): Promise<ApiResponse<EventVoteDto[]>> {
    return apiRequest(`/events/${eventId}/votes`, "Không tải được danh sách phiếu bình chọn.");
  },

  disqualifyVote(voteId: number, reason: string): Promise<ApiResponse<EventVoteDto>> {
    return apiRequest(`/events/votes/${voteId}/disqualify`, "Không loại được phiếu bình chọn.", {
      method: "POST",
      body: { reason },
    });
  },

  leaderboard(eventId: number): Promise<ApiResponse<EventLeaderboardDto>> {
    return apiRequest(`/events/${eventId}/leaderboard`, "Không tải được bảng xếp hạng.");
  },

  completeTask(
    eventId: number,
    taskDefinitionId: number,
    payload: { childProfileId?: number; storyId?: number; selfDeclaredPayloadJson?: string },
  ): Promise<ApiResponse<EventMissionDashboardDto>> {
    return apiRequest(`/events/${eventId}/tasks/${taskDefinitionId}/complete`, "Không ghi nhận được tiến độ nhiệm vụ.", {
      method: "POST",
      body: payload,
    });
  },

  verify(eventId: number): Promise<ApiResponse<number>> {
    return apiRequest(`/events/${eventId}/verify`, "Không chạy xác minh được.", { method: "POST" });
  },

  createAppeal(eventId: number, participationId: number, reasonText: string): Promise<ApiResponse<EventAppealDto>> {
    return apiRequest(`/events/${eventId}/appeals`, "Không gửi được đơn khiếu nại.", {
      method: "POST",
      body: { participationId, reasonText },
    });
  },

  listAppeals(eventId: number): Promise<ApiResponse<EventAppealDto[]>> {
    return apiRequest(`/events/${eventId}/appeals`, "Không tải được danh sách khiếu nại.");
  },

  decideAppeal(appealId: number, decision: EventAppealStatus, resolutionNote: string): Promise<ApiResponse<EventAppealDto>> {
    return apiRequest(`/events/appeals/${appealId}/decide`, "Không xử lý được khiếu nại.", {
      method: "POST",
      body: { decision, resolutionNote },
    });
  },

  evaluateSubmission(
    submissionId: number,
    payload: { criteriaScoresJson: string; comment?: string },
  ): Promise<ApiResponse<{ evaluated: boolean }>> {
    return apiRequest(`/events/submissions/${submissionId}/evaluate`, "Không lưu được điểm chấm bài dự thi.", {
      method: "POST",
      body: payload,
    });
  },

  proposeAwards(eventId: number): Promise<ApiResponse<EventAwardSlotDto[]>> {
    return apiRequest(`/events/${eventId}/awards/propose`, "Không đề xuất được danh sách giải.", { method: "POST" });
  },

  approveAwards(eventId: number): Promise<ApiResponse<EventAwardSlotDto[]>> {
    return apiRequest(`/events/${eventId}/awards/approve`, "Không phê duyệt được giải.", { method: "POST" });
  },

  myRewards(): Promise<ApiResponse<EventAwardSlotDto[]>> {
    return apiRequest("/events/my-rewards", "Không tải được danh sách phần thưởng.");
  },

  claimReward(
    awardId: number,
    payload: {
      recipientName?: string; phoneNumber?: string; shippingAddress?: string;
      bankName?: string; bankAccountNumber?: string; bankAccountHolder?: string;
    },
  ): Promise<ApiResponse<EventAwardSlotDto>> {
    return apiRequest(`/events/awards/${awardId}/claim`, "Không xác nhận nhận thưởng được.", {
      method: "POST",
      body: payload,
    });
  },

  processExpired(eventId: number): Promise<ApiResponse<number>> {
    return apiRequest(`/events/${eventId}/awards/process-expired`, "Không xử lý được suất thưởng quá hạn.", { method: "POST" });
  },

  rewardRecipient(awardId: number, signal?: AbortSignal): Promise<ApiResponse<EventRewardRecipientDto>> {
    return apiRequest(`/events/awards/${awardId}/recipient`, "Không tải được thông tin nhận giải.", { signal, cache: "no-store" });
  },

  resendAwardNotifications(eventId: number): Promise<ApiResponse<EventAwardNotificationResultDto>> {
    return apiRequest(`/events/${eventId}/awards/notify`, "Không gửi lại được thông báo trúng giải.", { method: "POST" });
  },

  fulfillReward(
    awardId: number,
    payload: { delivered: boolean; trackingOrBankTxCode?: string; failureReason?: string },
  ): Promise<ApiResponse<EventAwardSlotDto>> {
    return apiRequest(`/events/awards/${awardId}/fulfill`, "Không cập nhật được trạng thái trao thưởng.", {
      method: "POST",
      body: payload,
    });
  },
};
