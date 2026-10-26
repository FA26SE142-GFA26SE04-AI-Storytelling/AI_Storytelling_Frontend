/** DTO snapshot, updated against Core controllers and media models on 2026-10-22. */
import type { MediaPackageState } from '@/app/types/aiStory';
export interface AIProposalDto {
  'proposalId': string;
  'requestedByUserId': number;
  'storyId': number;
  'storyVersionId': number;
  'artifactType': string;
  'operationType': string;
  'originalContent': unknown | null;
  'suggestedContent': unknown | null;
  'status': string;
  'createdAt': string;
  'expiresAt': string;
}

export interface AIStoryCreativeInputDto {
  'topic': string;
  'genre': string | null;
  'characterMode': string;
  'characters': (string)[];
  'settingMode': string;
  'setting': string | null;
  'lesson': string;
  'vocabularyLevel': string;
  'language': string | null;
  'targetLength': number;
}

export interface AIStoryInputContextDto {
  'childProfileId': number;
  'childNickname': string;
  'ageBand': string;
  'readingLevel': number;
  'defaultVocabularyLevel': string;
  'availableVocabularyLevels': (string)[];
  'defaultLanguage': string;
  'availableLanguages': (string)[];
  'availableOutputModes': (string)[];
  'maximumLength': number;
  'requiredApprovalMode': string;
  'parentalGateEnabled': boolean;
  'safetyScoreThreshold': number | null;
  'readabilityScoreThreshold': number | null;
  'comprehensionGoal': string | null;
  'comprehensionThresholdPercent': number | null;
  'comprehensionWindowSize': number;
  'interests': (string)[];
  'allowedCategoryCodes': (string)[];
  'restrictedCategoryCodes': (string)[];
  'blockedCategoryCodes': (string)[];
  'characterModes': (string)[];
  'settingModes': (string)[];
}

export interface AIStoryInputProgressDto {
  'storyId': number;
  'outputMode': string;
  'requestId': number;
  'inputStatus': string;
  'handoffStatus': string;
  'handoffJobId': number | null;
  'attemptCount': number;
  'maxAttempts': number;
  'reasonCode': string | null;
  'fallbackMessage': string | null;
  'canRetry': boolean;
  'createdAt': string;
  'updatedAt': string | null;
  'guardrailCheckedAt': string | null;
  'handoffCreatedAt': string | null;
}

export interface AcceptInvitationRequestDto {
  'invitationCode': string;
}

export interface AdaptExistingStoryRequestDto {
  'storyId': number;
  'baseStoryVersionId': number;
  'guideline': string | null;
}

export interface AdministratorAccountDto {
  'userId': number;
  'email': string;
  'fullName': string;
  'role': string;
  'roleBeforeAdmin': string | null;
}

export type AgeBand = 1 | 2;
export type AgeBandName = 'Age_6_8' | 'Age_9_10';
export interface AgePresetDto {
  'ageBand': string;
  'blockedCategoryIds': (number)[];
}

export interface AnswerAssistanceRequest {
  'operationId': string;
  'expectedTaskRevision': number;
  'clarificationStepId': number;
  'questionId': string;
  'choiceId': string | null;
  'customAnswer': string | null;
  'letAiPropose': boolean;
}

export interface ApiResponse<T = unknown> {
  'success': boolean;
  'message': string;
  'data': T | null;
  'errors': (string)[] | null;
}

export interface ApplyDiscardResponseDto {
  'success': boolean;
  'message': string;
}

export type ApprovalMode = 1 | 2;
export type ApprovalModeName = 'AlwaysManual' | 'AutoPublishOnThreshold';
export interface ApproveBlockerDto {
  'code': string;
  'message': string;
}

export interface ApproveOutlineRequestDto {
  'approvalKey': string;
}

export interface ConfirmCreatorContentRequestDto {
  'versionId': number;
}

export interface ConfirmCreatorContentResponseDto {
  'storyId': number;
  'versionId': number;
  'status': string;
  'confirmedAt': string;
}

export interface ApproveResponseDto {
  'success': boolean;
  'storyId': number;
  'status': string;
  'approvedAt': string;
}

export interface ArchiveExistingStoryRequestDto {
  'storyId': number;
  'reason': string;
}

export interface ArchiveReportRequestDto {
  'archiveReason': ArchivedReasonName;
  'reason': string;
}

export interface ArchiveRequestDto {
  'reason': string | null;
}

export interface ArchiveResponseDto {
  'success': boolean;
  'storyId': number;
  'status': string;
}

export type ArchivedReason = 1 | 2 | 3 | 4;
export type ArchivedReasonName = 'SupervisorPreference' | 'SafetyConcern' | 'Copyright' | 'Inappropriate';
export interface ArtifactChangeDto {
  'kind': string;
  'change': string;
  'key': string;
}

export interface ArtifactGenerationResultDto {
  'storyId': number;
  'storyVersionId': number;
  'vocabularyCount': number;
  'quizCount': number;
  'discussionCount': number;
  'success': boolean;
  'message': string;
}

export interface ArtifactStatusDto {
  'state': string;
  'itemCount': number;
}

export interface AssistanceActiveOperation {
  'operationId': string;
  'stepId': number;
  'status': string;
  'leaseExpiresAt': string | null;
}

export interface AssistanceAiResult {
  'resultType': string;
  'question': AssistanceQuestion | null;
  'options': (AssistanceOption)[];
  'findings': (AssistanceFinding)[];
  'patch': AssistancePatch | null;
  'checksPerformed': (string)[];
  'warnings': (string)[];
  'assumptions': (string)[];
  'coverage': string | null;
  'provider': string | null;
  'model': string | null;
  'promptVersion': string | null;
}

export interface AssistanceChoice {
  'id': string;
  'text': string;
}

export interface AssistanceCommand {
  'operationId': string;
  'expectedTaskRevision': number;
}

export interface AssistanceCommandResult {
  'taskId': number;
  'stepId': number;
  'taskRevision': number;
  'status': string;
  'isRunning': boolean;
  'step': AssistanceStepDto;
  'pollUrl': string | null;
  'snapshotHash': string | null;
}

export interface AssistanceConstraints {
  'keep': (string)[];
  'avoid': (string)[];
}

export interface AssistanceDirection {
  'confirmedDirectionText': string;
  'constraints': AssistanceConstraints;
}

export interface AssistanceFinding {
  'id': string;
  'start': number;
  'length': number;
  'quote': string;
  'comment': string;
  'suggestedGoal': string;
}

export interface AssistanceOption {
  'id': string;
  'summary': string;
  'direction': string;
}

export interface AssistancePatch {
  'kind': string;
  'start': number;
  'length': number;
  'text': string;
  'quote': string;
}

export interface AssistanceProvenance {
  'schemaVersion': number;
  'newReferences': (AssistanceProvenanceReference)[];
  'baseVersionId': number | null;
  'restoredFromVersionId': number | null;
  'restoredSourceSummary': string | null;
}

export interface AssistanceProvenanceReference {
  'taskId': number;
  'stepId': number;
  'usage': string;
  'snapshotHash': string;
  'resultHash': string | null;
  'provider': string | null;
  'model': string | null;
  'promptVersion': string | null;
}

export interface AssistanceQuestion {
  'id': string;
  'text': string;
  'choices': (AssistanceChoice)[];
}

export interface AssistanceReference {
  'taskId': number;
  'stepId': number;
  'usage': string;
}

export interface AssistanceStepDto {
  'stepId': number;
  'sequence': number;
  'operationId': string;
  'kind': string;
  'status': string;
  'resultingTaskRevision': number;
  'errorCode': string | null;
  'result': AssistanceAiResult | null;
  'direction': AssistanceDirection | null;
  'createdAt': string;
  'directionStepId': number | null;
  'answer': string | null;
}

export interface AssistanceTarget {
  'kind': string;
  'start': number;
  'length': number;
}

export interface AssistanceTaskDto {
  'taskId': number;
  'storyId': number;
  'entryPoint': string;
  'status': string;
  'taskRevision': number;
  'sourceVersionId': number | null;
  'sourceRevisionToken': string;
  'audienceRevision': number;
  'snapshotHash': string;
  'snapshot': EditorSnapshot;
  'target': AssistanceTarget;
  'storyContextStale': boolean;
  'audienceContextStale': boolean;
  'currentStoryRevisionToken': string;
  'currentAudienceRevision': number;
  'activeOperation': AssistanceActiveOperation | null;
  'activeClarificationStepId': number | null;
  'acceptedAnswerStepId': number | null;
  'activeOptionsStepId': number | null;
  'activeReviewStepId': number | null;
  'activeDirectionStepId': number | null;
  'activeTrialStepId': number | null;
  'activeDirection': AssistanceStepDto | null;
  'activeTrial': AssistanceStepDto | null;
  'parentTaskId': number | null;
  'sourceReviewStepId': number | null;
  'findingId': string | null;
  'activeResult': AssistanceAiResult | null;
  'acceptedAnswer': string | null;
  'goal': string | null;
  'constraints': AssistanceConstraints | null;
  'language': string | null;
  'ageBand': string | null;
}

export interface AssistanceTaskSummary {
  'taskId': number;
  'entryPoint': string;
  'status': string;
  'taskRevision': number;
  'createdAt': string;
}

export interface AuditLogDto {
  'id': number;
  'actorUserId': number | null;
  'action': string;
  'entityType': string;
  'entityId': number;
  'occurredAt': string;
}

export interface AuthResponseDto {
  'accessToken': string;
  'refreshToken': string;
  'tokenType': string;
  'expiresInSeconds': number;
  'user': UserProfileDto;
  'mfaRequired': boolean;
  'mfaSetupRequired': boolean;
  'mfaChallengeToken': string | null;
  'mfaProvisioningUri': string | null;
}

export interface AuthoringGuide {
  'id': string;
  'audienceRole': string;
  'purposes': (string)[];
  'supportGroup': string;
  'itemType': string;
  'title': string;
  'instruction': string;
  'example': string | null;
  'templateText': string | null;
  'placeholderDefinitions': (string)[];
  'order': number;
}

export interface BusinessReportDto {
  'id': number;
  'periodStart': string;
  'periodEnd': string;
  'storiesGenerated': number;
  'storiesApproved': number;
  'storiesRejected': number;
  'readingSessionsCompleted': number;
  'status': string;
  'publishedAt': string | null;
}

export interface CancelAssistanceRequest {
  'operationId': string;
  'expectedTaskRevision': number;
  'targetOperationId': string;
}

export interface ChangePasswordRequestDto {
  'currentPassword': string;
  'newPassword': string;
  'confirmPassword': string;
  'currentRefreshToken': string | null;
}

export interface ChangeRequestPartDto {
  'partType': string;
  'partId': number | null;
  'note': string;
}

export interface ChildAccessCredentialDto {
  'childProfileId': number;
  'hasEasyLogin': boolean;
  'easyLoginCreatedAt': string | null;
}

export type ChildCreationMode = 1 | 2;
export type ChildCreationModeName = 'ReviewFirst' | 'ListenNow';
export interface ChildProfileDto {
  'id': number;
  'ownerUserId': number;
  'nickname': string;
  'avatarId': string;
  'ageBand': string;
  'language': string;
  'status': string;
  'createdAt': string;
  'shouldReapplyBlockedPreset': boolean;
  'suggestedReadingMode': string | null;
}

export interface ChildSessionDto {
  'childProfileId': number;
  'avatarId': string;
  'accessToken': string;
  'expiresInSeconds': number;
}

export interface ChildSessionProfileDto {
  'childProfileId': number;
  'nickname': string;
  'ageBand': string;
}

export interface ClaimInvitationRequestDto {
  'invitationCode': string;
}

export interface ClaimInvitationResultDto {
  'maskedEmail': string;
  'otpExpiresAt': string;
}

export interface ConfirmAssistanceDirectionRequest {
  'operationId': string;
  'expectedTaskRevision': number;
  'optionsStepId': number;
  'optionId': string | null;
  'directionText': string | null;
  'confirmedConstraints': AssistanceConstraints;
}

export interface ConfirmCreatorImportRequest {
  'operationId': string;
  'revisionToken': string;
  'baseVersionId': number | null;
  'previewToken': string;
  'content': string;
  'title': string;
  'sourceDeclaration': string;
  'rightsDeclaration': string;
}

export interface ConfirmEmailChangeRequestDto {
  'otp': string;
}

export interface ContentCategoryDto {
  'id': number;
  'code': string;
  'displayName': string;
  'isActive': boolean;
  'defaultBlockedAgeBands': (string)[];
}

export interface ContentGenerationProgressDto {
  'storyId': number;
  'outputMode': string;
  'storyStatus': string;
  'currentStep': string;
  'content': string;
  'vocabulary': string;
  'quiz': string;
  'discussion': string;
  'isComplete': boolean;
  'waitingForModeration': boolean;
  'lastErrorCode': string | null;
  'qualityFailure': ContentQualityFailureDto | null;
  'stableStoryVersionId': number | null;
}

export interface ContentQualityFailureDto {
  'refinementAttempts': number;
  'safetyScore': number | null;
  'failedGates': (ContentQualityGateFailureDto)[];
}

export interface ContentQualityGateFailureDto {
  'gate': string;
  'reasonCode': string;
  'violations': (string)[];
}

export interface ContentReportDecisionResultDto {
  'itemId': number;
  'reportId': number;
  'storyId': number;
  'decision': string;
  'storyArchived': boolean;
  'decidedAt': string;
}

export interface ContentReportDetailDto {
  'itemId': number;
  'reportId': number;
  'reason': string;
  'description': string | null;
  'attachmentUrl': string | null;
  'isReviewItem': boolean;
  'itemStatus': string;
  'escalationReason': string | null;
  'escalatedAt': string | null;
  'createdAt': string;
  'story': ReportedStoryDto;
  'version': ReportedVersionDto | null;
  'scenes': (ReportedSceneDto)[];
  'vocabulary': (ReportedVocabularyDto)[];
  'quizzes': (ReportedQuizDto)[];
  'discussionQuestions': (ReportedDiscussionDto)[];
}

export type ContentReportReason = 1 | 2 | 3 | 4 | 5 | 6;
export type ContentReportReasonName = 'SafetyConcern' | 'Inappropriate' | 'WrongAgeBand' | 'Other' | 'Copyright' | 'Cultural';
export interface ContentReportResultDto {
  'reportId': number;
  'storyId': number;
  'reason': string;
  'status': string;
  'createdAt': string;
}

export interface CreateAssistanceTaskRequest {
  'operationId': string;
  'entryPoint': string;
  'baseVersionId': number | null;
  'revisionToken': string;
  'editorSnapshot': EditorSnapshot;
  'target': AssistanceTarget;
  'goal': string;
  'constraints': AssistanceConstraints;
  'parentTaskId': number | null;
  'sourceReviewStepId': number | null;
  'findingId': string | null;
}

export interface CreateAssistanceTrialRequest {
  'operationId': string;
  'expectedTaskRevision': number;
  'directionStepId': number;
}

export interface CreateChildProfileRequestDto {
  'nickname': string;
  'ageBand': AgeBandName;
  'language': string;
}

export interface CreateContentCategoryRequestDto {
  'code': string;
  'displayName': string;
  'isActive': boolean;
  'defaultBlockedAgeBands': (string)[] | null;
}

export interface CreateContentReportRequestDto {
  'storyId': number;
  'reason': ContentReportReasonName;
  'description': string | null;
  'attachmentUrl': string | null;
}

export interface CreateCreatorDraftRequest {
  'operationId': string;
  'title': string;
  'description': string;
  'language': string;
  'ageBand': string;
  'genre': string;
  'experienceMode': string;
}

export interface CreateDataRequestDto {
  'childProfileId': number;
  'requestType': string;
  'currentPassword': string | null;
  'confirmNickname': string | null;
}

export interface CreateInvitationRequestDto {
  'inviteeEmail': string | null;
  'expiresInDays': number;
}

export interface CreateParentDraftRequest {
  'operationId': string;
  'childProfileId': number;
  'title': string;
  'language': string | null;
  'purpose': string | null;
  'experienceMode': string;
}

export interface CreatePaymentTransactionRequestDto {
  'planId': number;
}

export interface CreatePermissionRequestRequestDto {
  'permissions': (Permission)[];
}

export interface CreateProposalResponseDto {
  'proposalId': string;
  'message': string;
}

export interface CreateStoryRequestDto {
  'title': string;
  'description': string | null;
  'content': string | null;
  'coverImageUrl': string | null;
  'genre': string | null;
  'moralLesson': string | null;
  'ageBand': string;
  'language': string;
  'isAiGenerated': boolean;
}

export interface CreatorAIStoryInputContextDto {
  'ageBand': string;
  'readingLevel': number;
  'defaultLanguage': string;
  'availableLanguages': (string)[];
  'availableVocabularyLevels': (string)[];
  'maximumLength': number;
  'requiredApprovalMode': string;
  'safetyScoreThreshold': number;
  'blockedCategoryCodes': (string)[];
  'availableOutputModes': (string)[];
}

export interface CreatorCommand {
  'operationId': string;
}

export interface CreatorContentSavedDto {
  'story': CreatorDraftDto;
  'version': CreatorVersionDto;
}

export interface CreatorDraftDto {
  'storyId': number;
  'authorUserId': number;
  'title': string;
  'description': string;
  'language': string;
  'ageBand': string;
  'genre': string;
  'experienceMode': string;
  'audienceRevision': number;
  'revisionToken': string;
  'selectedVersionId': number | null;
  'lastVersionNo': number;
  'createdAt': string;
  'updatedAt': string | null;
  'source': string;
  'status': string;
}

export interface CreatorImportFileForm {
  'file': File;
  'revisionToken': string;
  'operationId': string;
}

export interface CreatorImportPreviewDto {
  'previewToken': string;
  'storyId': number;
  'content': string;
  'inputMethod': string;
  'fileName': string | null;
  'sourceHash': string;
  'expiresAt': string;
}

export interface CreatorVersionCommand {
  'operationId': string;
  'revisionToken': string;
  'baseVersionId': number | null;
}

export interface CreatorVersionDto {
  'versionId': number;
  'storyId': number;
  'versionNo': number;
  'baseVersionId': number | null;
  'restoredFromVersionId': number | null;
  'editorUserId': number;
  'title': string;
  'content': string;
  'origin': string;
  'sourceDeclaration': string;
  'rightsDeclaration': string;
  'importFileName': string | null;
  'importSourceHash': string | null;
  'audienceRevision': number;
  'createdAt': string;
  'assistance': unknown | null;
}

export interface DataRequestDto {
  'id': number;
  'childProfileId': number;
  'requestType': string;
  'status': string;
  'rejectionReason': string | null;
  'createdAt': string;
  'resolvedAt': string | null;
  'resolvedByUserId': number | null;
}

export interface DeleteAccountPreviewDto {
  'blockingProfiles': (OwnedChildProfileSummaryDto)[];
  'draftProfiles': (OwnedChildProfileSummaryDto)[];
  'canDelete': boolean;
}

export interface DeleteAccountRequestDto {
  'currentPassword': string;
  'deleteDraftProfiles': boolean;
}

export interface DiscussionItemDto {
  'id': number | null;
  'question': string;
  'isMoralLesson': boolean;
}

export interface DiscussionReviewDto {
  'storyId': number;
  'versionId': number;
  'items': (DiscussionItemDto)[];
}

export interface DismissReportRequestDto {
  'reason': string;
}

export interface EasyLoginSecretDto {
  'secret': string;
  'createdAt': string;
}

export interface EditOutlineRequestDto {
  'title': string;
  'opening': string;
  'development': string;
  'ending': string;
}

export interface EditorSnapshot {
  'title': string;
  'content': string;
}

export interface EvaluateExistingStoryRequestDto {
  'storyVersionId': number;
}

export interface EvaluationIssueDto {
  'code': string;
  'message': string;
}

export type ExistingStoryDecision = 1 | 2 | 3;
export type ExistingStoryDecisionName = 'Suitable' | 'AdaptRecommended' | 'Blocked';
export interface ExistingStoryEvaluationDto {
  'storyId': number;
  'storyVersionId': number;
  'decision': ExistingStoryDecision;
  'hardSafetyIssues': (EvaluationIssueDto)[];
  'profileFitIssues': (EvaluationIssueDto)[];
  'recommendedAgeBand': number | null;
  'readabilityFkgl': number | null;
  'readabilityFre': number | null;
  'safetyScore': number | null;
  'wordCount': number | null;
  'canKeepOriginal': boolean;
  'decisionText': string;
}

export interface ForgotPasswordRequestDto {
  'email': string;
}

export interface GenerateArtifactsRequestDto {
  'storyVersionId': number | null;
  'includeVocabulary': boolean;
  'includeQuiz': boolean;
  'includeDiscussion': boolean;
}

export interface GenerateBusinessReportRequestDto {
  'periodStart': string;
  'periodEnd': string;
}

export interface GrantAdministratorRequestDto {
  'email': string;
}

export interface GrantReviewViewRequestDto {
  'sourceTab': string;
  'storyId': number | null;
  'storyVersionId': number | null;
  'readingRoadmapId': number | null;
}

export interface GuidePage {
  'catalogVersion': string;
  'locale': string;
  'pageIndex': number;
  'pageSize': number;
  'totalCount': number;
  'items': (AuthoringGuide)[];
}

export interface IllustrationBeatMediaItem {
  'beatId': number;
  'beatOrder': number;
  'startOffset': number;
  'endOffset': number;
  'visualFocus': string;
  'assetId': number | null;
  'status': string;
  'url': string | null;
}

export interface ImportExistingStoryFileForm {
  'file': File;
  'title': string | null;
  'childProfileId': number;
  'language': string;
  'outputMode': string;
  'idempotencyKey': string | null;
}

export interface ImportStoryRequestDto {
  'inputMethod': string;
  'content': string | null;
  'title': string | null;
  'childProfileId': number;
  'language': string;
  'outputMode': string;
  'idempotencyKey': string | null;
}

export interface ImportStoryResponseDto {
  'storyId': number;
  'outputMode': string;
  'storyVersionId': number;
  'storyStatus': string;
  'editType': string;
  'contentLength': number | null;
  'inputStatus': string;
  'reasonCode': string | null;
  'fallbackMessage': string | null;
  'canProceed': boolean;
  'warnings': (string)[];
}

export interface InvitationDto {
  'id': number;
  'childProfileId': number;
  'invitationCode': string;
  'status': string;
  'expiresAt': string | null;
}

export interface InvitationPreviewDto {
  'invitationId': number;
  'inviterName': string;
  'childNickname': string;
  'childAgeBand': string;
}

export interface InviteModeratorRequestDto {
  'fullName': string;
  'email': string;
  'expertise': string;
  'note': string | null;
}

export interface KeepOriginalRequestDto {
  'storyId': number;
  'storyVersionId': number;
  'overrideReason': string;
}

export interface LearningProfileDto {
  'id': number;
  'childProfileId': number;
  'readingLevel': number;
  'readingMode': string;
  'comprehensionGoal': string | null;
  'topics': (LearningProfileTopicDto)[];
}

export interface LearningProfileTopicDto {
  'topic': string;
  'relation': string;
}

export interface LoginRequestDto {
  'identifier': string;
  'password': string;
}

export interface LoginWithEasyLoginRequestDto {
  'secret': string;
}

export interface LogoutRequestDto {
  'refreshToken': string;
}

export interface ManualEditRequestDto {
  'storyId': number;
  'baseStoryVersionId': number;
  'title': string;
  'content': string;
  'lesson': string;
}

export interface MarkPartViewedRequestDto {
  'partType': string;
  'partId': number;
}

export interface MediaGenerationProgress extends MediaPackageState {
  'storyId': number;
  'approvedStoryVersionId': number | null;
  'storyStatus': string;
  'jobStatus': string;
  'sceneCount': number;
  'readyIllustrations': number;
  'readyAudio': number;
  'isReady': boolean;
  'errorCode': string | null;
  'requiredIllustrations': number;
  'missingIllustrationBeatIds': (number)[] | null;
  'missingAudioSegmentIds': (number)[] | null;
  'manualReviewAssetIds': (number)[] | null;
  'scenesWithoutValidBeats': (number)[] | null;
}

export interface ModerationItemDetailDto {
  'id': number;
  'itemType': string;
  'status': string;
  'priority': string;
  'storyId': number | null;
  'storyVersionId': number | null;
  'contentReportId': number | null;
  'readingRoadmapId': number | null;
  'isResubmission': boolean;
  'slaDueAt': string | null;
  'isOverdue': boolean;
  'claimedByUserId': number | null;
  'claimedAt': string | null;
  'claimExpiresAt': string | null;
  'createdAt': string;
  'rowVersion': number;
  'flags': string | null;
  'checklist': string | null;
  'reviewProgress': string | null;
}

export type ModerationItemStatus = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type ModerationItemStatusName = 'Pending' | 'Claimed' | 'Approved' | 'ChangesRequested' | 'Rejected' | 'Cleared' | 'Blocked' | 'Dismissed' | 'Archived' | 'Escalated' | 'Withdrawn' | 'Removed' | 'Closed';
export interface ModerationItemSummaryDto {
  'id': number;
  'itemType': string;
  'status': string;
  'priority': string;
  'storyId': number | null;
  'storyVersionId': number | null;
  'contentReportId': number | null;
  'readingRoadmapId': number | null;
  'isResubmission': boolean;
  'slaDueAt': string | null;
  'isOverdue': boolean;
  'claimedByUserId': number | null;
  'claimedAt': string | null;
  'claimExpiresAt': string | null;
  'createdAt': string;
}

export type ModerationItemType = 1 | 2 | 3 | 4 | 5 | 6;
export type ModerationItemTypeName = 'PublicStoryReview' | 'GrayZoneStory' | 'ContentReport' | 'RoadmapTemplateReview' | 'CommunitySubmission' | 'PublicStoryRemoval';
export type ModerationPriority = 1 | 2 | 3;
export type ModerationPriorityName = 'High' | 'Medium' | 'Low';
export interface ModerationQueueQueryDto {
  'itemType': ModerationItemType | null;
  'status': ModerationItemStatus | null;
  'priority': ModerationPriority | null;
  'onlyOverdue': boolean;
  'pageIndex': number;
  'pageSize': number;
}

export interface ModerationReviewViewDto {
  'id': number;
  'sourceTab': string;
  'storyId': number | null;
  'storyVersionId': number | null;
  'readingRoadmapId': number | null;
  'grantedAt': string;
  'expiresAt': string;
}

export interface ModeratorAccountDto {
  'userId': number;
  'email': string;
  'fullName': string;
  'expertise': string | null;
  'status': string;
  'isActivated': boolean;
  'activatedAt': string | null;
  'lastLoginAt': string | null;
  'inviteExpiresAt': string | null;
}

export interface NotificationDto {
  'id': number;
  'childProfileId': number | null;
  'type': string;
  'group': string;
  'payload': string | null;
  'status': string;
  'readAt': string | null;
  'createdAt': string;
}

export interface OutlineProgressDto {
  'storyId': number;
  'storyStatus': string;
  'currentVersion': OutlineVersionDto | null;
  'activeOperation': string | null;
  'activeJobStatus': string | null;
  'lastErrorCode': string | null;
}

export interface OutlineVersionDto {
  'id': number;
  'versionNo': number;
  'editType': string;
  'title': string;
  'opening': string;
  'development': string;
  'ending': string;
  'isCurrent': boolean;
  'editorUserId': number | null;
  'outlineApprovedByUserId': number | null;
  'outlineApprovedAt': string | null;
  'createdAt': string;
}

export interface OwnedChildProfileSummaryDto {
  'id': number;
  'nickname': string;
  'status': string;
}

export interface OwnershipTransferRequestDto {
  'id': number;
  'childProfileId': number;
  'currentOwnerUserId': number;
  'targetSupervisorUserId': number;
  'requesterUserId': number;
  'responderUserId': number;
  'status': string;
  'createdAt': string;
  'respondedAt': string | null;
}

export interface PageRequest {
  'pageIndex': number;
  'pageSize': number;
  'searchTerm': string | null;
  'orderBy': string | null;
  'isDescending': boolean;
}

export interface PagedResult<T = unknown> {
  'items': (T)[];
  'pageIndex': number;
  'pageSize': number;
  'totalCount': number;
  'totalPages': number;
  'hasPreviousPage': boolean;
  'hasNextPage': boolean;
}

export interface ParentCheckDto {
  'checkId': number;
  'storyVersionId': number;
  'contextFingerprint': string;
  'canPrepare': boolean;
  'errors': (string)[];
  'warnings': (string)[];
  'coverage': string;
}

export interface ParentCheckRequest {
  'operationId': string;
  'revisionToken': string;
  'baseVersionId': number | null;
}

export interface ParentChecklist {
  'intendedMeaning': boolean;
  'suitableForChild': boolean;
  'privacyChecked': boolean;
  'endingChecked': boolean;
}

export interface ParentContentConfirmRequest {
  'operationId': string;
  'revisionToken': string;
  'baseVersionId': number | null;
  'checkId': number;
  'checklist': ParentChecklist | null;
}

export interface ParentContentConfirmationDto {
  'confirmationId': number;
  'storyVersionId': number;
  'checkId': number;
  'checklist': ParentChecklist;
}

export interface ParentDraftDto {
  'story': CreatorDraftDto;
  'childProfileId': number;
  'purpose': string;
  'isReadOnly': boolean;
  'readOnlyReason': string | null;
  'canUseAiAssistance': boolean;
  'aiUnavailableReason': string | null;
}

export interface ParentFamilyConfirmRequest {
  'operationId': string;
  'revisionToken': string;
  'baseVersionId': number | null;
  'preparationId': number;
}

export interface ParentFamilyConfirmationDto {
  'confirmationId': number;
  'storyId': number;
  'storyVersionId': number;
  'childProfileId': number;
  'preparationId': number;
  'confirmedAt': string;
}

export interface ParentFamilyRevokeRequest {
  'operationId': string;
  'revisionToken': string;
  'baseVersionId': number | null;
  'confirmationId': number;
}

export interface ParentOperationDto {
  'id': number;
  'kind': string;
  'storyVersionId': number | null;
  'sourceIsCurrent': boolean;
  'revokedAt': string | null;
  'result': unknown;
}

export interface ParentPreparationDto {
  mediaPackageRevision?: number | null;
  media?: import('@/app/types/aiStory').StoryMediaPackage | null;
  'preparationId': number;
  'storyId': number;
  'storyVersionId': number;
  'childProfileId': number;
  'audienceRevision': number;
  'contextFingerprint': string;
  'title': string;
  'language': string;
  'experienceMode': string;
  'segments': (ParentSegmentDto)[];
  'isReady': boolean;
  'missingRequirements': (string)[];
}

export interface ParentPrepareRequest {
  'operationId': string;
  'revisionToken': string;
  'baseVersionId': number | null;
  'contentConfirmationId': number;
  'segmentEnds': (number)[] | null;
}

export interface ParentSegmentDto {
  'order': number;
  'startOffset': number;
  'endOffset': number;
  'text': string;
}

export interface ParentSetupRequest {
  'operationId': string;
  'revisionToken': string;
  'baseVersionId': number | null;
  'purpose': string | null;
  'language': string | null;
  'experienceMode': string | null;
}

export interface PartialEditRequestDto {
  'versionId': number;
  'selection': TextSelectionDto;
  'instruction': string;
}

export type PasswordPolicy = Record<string, never>;

export interface PaymentTransactionDto {
  'id': number;
  'planId': number;
  'planName': string;
  'amount': number;
  'transactionCode': string;
  'qrCodeUrl': string | null;
  'status': string;
  'expiresAt': string;
  'paidAt': string | null;
  'sepayTransactionId': string | null;
}

export type Permission = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type PermissionName = 'ViewProgress' | 'ViewResults' | 'AssignActivity' | 'ReceiveReport' | 'ApproveReadingLevel' | 'ApproveStory' | 'ManageSafetySettings' | 'GenerateStory';
export interface PermissionRequestDto {
  'id': number;
  'supervisionRelationshipId': number;
  'requesterUserId': number;
  'status': string;
  'permissions': (string)[];
  'createdAt': string;
  'respondedAt': string | null;
}

export type PolicyRule = 1 | 2 | 3;
export type PolicyRuleName = 'Allowed' | 'Restricted' | 'Blocked';
export interface PreviewCreatorImportRequest {
  'operationId': string;
  'revisionToken': string;
  'content': string;
}

export interface PublicReviewChecklistDto {
  'safety': boolean | null;
  'ageFit': boolean | null;
  'education': boolean | null;
  'language': boolean | null;
  'copyright': boolean | null;
  'image': boolean | null;
  'audio': boolean | null;
  'interaction': boolean | null;
  'allPassed': boolean;
}

export interface PublicReviewDecisionResultDto {
  'itemId': number;
  'decision': string;
  'storyId': number;
  'storyVersionId': number;
  'storyPublished': boolean;
  'decidedAt': string;
}

export interface PublicReviewDiscussionDto {
  'id': number;
  'question': string;
  'isMoralLesson': boolean;
}

export interface PublicReviewFlagDto {
  'startOffset': number | null;
  'endOffset': number | null;
  'criterionCode': string | null;
  'evidenceQuote': string | null;
  'contextNote': string | null;
  'flagId': string;
  'kind': string;
  'name': string;
  'reason': string | null;
  'resolved': boolean;
  'resolvedReason': string | null;
}

export interface PublicReviewFlagsResultDto {
  'flags': (PublicReviewFlagDto)[];
  'allFlagsResolved': boolean;
  'versionCleared': boolean;
}

export interface PublicReviewHistoryEntryDto {
  'itemId': number;
  'storyVersionId': number | null;
  'versionNo': number | null;
  'decision': string;
  'decidedByUserId': number | null;
  'decidedByName': string | null;
  'decidedAt': string | null;
  'reason': string | null;
  'feedback': string | null;
}

export interface PublicReviewIllustrationDto {
  'beatOrder': number;
  'visualFocus': string;
  'assetId': number | null;
  'url': string | null;
}

export interface PublicReviewLabelDto {
  'contentCategoryId': number;
  'code': string;
  'displayName': string;
  'source': string;
}

export interface PublicReviewPackageDto {
  'itemId': number;
  'storyId': number;
  'storyVersionId': number;
  'versionNo': number;
  'isResubmission': boolean;
  'story': PublicReviewStoryDto;
  'version': PublicReviewVersionDto;
  'scenes': (PublicReviewSceneDto)[];
  'vocabulary': (PublicReviewVocabularyDto)[];
  'quizzes': (PublicReviewQuizDto)[];
  'discussionQuestions': (PublicReviewDiscussionDto)[];
  'flags': (PublicReviewFlagDto)[];
  'allFlagsResolved': boolean;
  'progress': PublicReviewProgressDto;
  'checklist': PublicReviewChecklistDto;
  'approveBlockers': (ApproveBlockerDto)[];
  'canApprove': boolean;
  'previousModeratorName': string | null;
  'reviewHistory': (PublicReviewHistoryEntryDto)[];
}

export interface PublicReviewProgressDto {
  'totalScenes': number;
  'missingSceneIds': (number)[];
  'audioHeardCount': number;
  'missingWarningSegmentIds': (number)[];
  'needsAtLeastOneAudio': boolean;
  'requiredViewsComplete': boolean;
}

export interface PublicReviewQuizDto {
  'id': number;
  'type': string;
  'question': string;
  'correctAnswer': string | null;
  'choices': string | null;
}

export interface PublicReviewSceneDto {
  'sceneId': number;
  'sceneIndex': number;
  'sceneText': string;
  'visualDescription': string | null;
  'viewed': boolean;
  'illustrations': (PublicReviewIllustrationDto)[];
  'segments': (PublicReviewSegmentDto)[];
}

export interface PublicReviewSegmentDto {
  'segmentId': number;
  'segmentOrder': number;
  'text': string;
  'audioAssetId': number | null;
  'audioUrl': string | null;
  'hasPronunciationWarning': boolean;
  'heard': boolean;
}

export interface PublicReviewStoryDto {
  'title': string | null;
  'description': string | null;
  'genre': string | null;
  'ageBand': string;
  'readingLevel': number | null;
  'vocabularyLevel': string | null;
  'language': string;
  'moralLesson': string | null;
  'coverImageUrl': string | null;
  'labels': (PublicReviewLabelDto)[];
}

export interface PublicReviewVersionDto {
  'title': string;
  'outlineOpening': string | null;
  'outlineDevelopment': string | null;
  'outlineEnding': string | null;
  'content': string | null;
  'lesson': string | null;
}

export interface PublicReviewVocabularyDto {
  'id': number;
  'term': string;
  'definition': string;
}

export interface PublicStorySubmissionResultDto {
  'itemId': number;
  'storyId': number;
  'storyVersionId': number;
  'status': string;
  'isResubmission': boolean;
  'previousItemId': number | null;
}

export interface PublicVersionComparisonDto {
  'against': string;
  'baseVersionId': number;
  'baseVersionNo': number;
  'currentVersionId': number;
  'currentVersionNo': number;
  'isIdentical': boolean;
  'textDiff': (TextDiffEntryDto)[];
  'baseMetrics': PublicVersionMetricsDto;
  'currentMetrics': PublicVersionMetricsDto;
  'changedFields': (string)[];
  'sceneChanges': (SceneChangeDto)[];
  'artifactChanges': (ArtifactChangeDto)[];
}

export interface PublicVersionMetricsDto {
  'wordCount': number;
  'sentenceCount': number;
  'averageSentenceLength': number;
  'readabilityFkgl': number | null;
  'readabilityFre': number | null;
}

export interface QuizItemDto {
  'id': number | null;
  'type': string;
  'question': string;
  'correctAnswer': string | null;
  'choices': (string)[] | null;
}

export interface QuizReviewDto {
  'storyId': number;
  'versionId': number;
  'items': (QuizItemDto)[];
}

export type ReadingMode = 1 | 2;
export type ReadingModeName = 'ListenFirst' | 'ReadFirst';
export interface ReasonRequestDto {
  'reason': string;
}

export interface RefreshTokenRequestDto {
  'refreshToken': string;
}

export interface RegenerateOutlineRequestDto {
  'operationKey': string;
}

export interface RegisterRequestDto {
  'username': string;
  'email': string;
  'fullName': string;
  'password': string;
  'confirmPassword': string;
  'phoneNumber': string | null;
}

export interface RejectDataRequestDto {
  'reason': string;
}

export interface RejectInvitationRequestDto {
  'invitationCode': string;
}

export interface RejectOutlineRequestDto {
  'reason': string;
}

export interface RejectRequestDto {
  'reason': string;
}

export interface RenderGuideRequest {
  'values': Record<string, string> | null;
}

export interface RenderGuideResult {
  'catalogVersion': string;
  'guideId': string;
  'text': string;
  'isPlainText': boolean;
}

export interface ReportedDiscussionDto {
  'question': string;
  'isMoralLesson': boolean;
}

export interface ReportedLabelDto {
  'code': string;
  'displayName': string;
}

export interface ReportedQuizDto {
  'type': string;
  'question': string;
  'correctAnswer': string | null;
  'choices': string | null;
}

export interface ReportedSceneDto {
  'sceneIndex': number;
  'text': string;
  'imageUrls': (string)[];
  'audioUrls': (string)[];
}

export interface ReportedStoryDto {
  'storyId': number;
  'title': string | null;
  'description': string | null;
  'genre': string | null;
  'ageBand': string;
  'readingLevel': number | null;
  'language': string;
  'scope': string;
  'isArchived': boolean;
  'labels': (ReportedLabelDto)[];
}

export interface ReportedVersionDto {
  'versionId': number;
  'versionNo': number;
  'title': string;
  'content': string | null;
  'lesson': string | null;
}

export interface ReportedVocabularyDto {
  'term': string;
  'definition': string;
}

export interface RequestChangesDto {
  'generalNote': string;
  'parts': (ChangeRequestPartDto)[];
}

export interface RequestEmailChangeRequestDto {
  'currentPassword': string;
  'newEmail': string;
}

export interface ResendVerificationEmailRequestDto {
  'email': string;
}

export interface ResetPasswordRequestDto {
  'email': string;
  'resetToken': string;
  'newPassword': string;
  'confirmPassword': string;
}

export interface ResolveFlagRequestDto {
  'flagId': string;
  'reason': string;
}

export interface RestoreCreatorVersionRequest {
  'operationId': string;
  'revisionToken': string;
  'baseVersionId': number | null;
  'sourceVersionId': number;
}

export interface ResumeChildProfileRequestDto {
  'acceptCurrentConsent': boolean;
}

export interface RetryAIStoryInputRequestDto {
  'topic': string;
  'genre': string | null;
  'characterMode': string;
  'characters': (string)[];
  'settingMode': string;
  'setting': string | null;
  'lesson': string;
  'vocabularyLevel': string;
  'language': string | null;
  'targetLength': number;
  'retryKey': string;
}

export interface RetryContentGenerationRequestDto {
  'retryKey': string;
}

export interface RetryOutlineRequestDto {
  'operationKey': string;
}

export interface ReviewPackageDto {
  'storyId': number;
  'outputMode': string;
  'storyVersionId': number;
  'storyStatus': string;
  'title': string;
  'content': string;
  'lesson': string;
  'readabilityAlgorithm': string;
  'readabilityFkgl': number | null;
  'readabilityFre': number | null;
  'vocabulary': ArtifactStatusDto;
  'quiz': ArtifactStatusDto;
  'discussion': ArtifactStatusDto;
  'canEdit': boolean;
  'canApprove': boolean;
  'canConfirmContent': boolean;
  'canArchive': boolean;
}

export interface SafetyPolicyCategoryDto {
  'contentCategoryId': number;
  'rule': string;
}

export interface SafetyPolicyDto {
  'id': number;
  'childProfileId': number;
  'maxStoryLength': number;
  'requiredApprovalMode': string;
  'parentalGateEnabled': boolean;
  'consentRecorded': boolean;
  'consentRecordedAt': string | null;
  'consentPolicyVersion': number;
  'consentedByUserId': number | null;
  'safetyScoreThreshold': number | null;
  'readabilityScoreThreshold': number | null;
  'comprehensionThresholdPercent': number;
  'comprehensionWindowSize': number;
  'storyWishesEnabled': boolean;
  'allowInteractiveStories': boolean;
  'childCreationEnabled': boolean;
  'childCreationMode': string;
  'voiceAnswersEnabled': boolean;
  'voiceConsentAt': string | null;
  'voiceConsentRequired': boolean;
  'consentOutdated': boolean;
  'effectiveVoiceAnswersEnabled': boolean;
  'categories': (SafetyPolicyCategoryDto)[];
}

export interface SaveCreatorContentRequest {
  'operationId': string;
  'revisionToken': string;
  'baseVersionId': number | null;
  'assistanceReferences': (unknown)[] | null;
  'title': string;
  'content': string;
  'sourceDeclaration': string;
  'rightsDeclaration': string;
}

export interface SceneChangeDto {
  'sceneIndex': number;
  'change': string;
  'textChanged': boolean;
  'imageChanged': boolean;
  'audioChanged': boolean;
}

export interface SceneMediaItem {
  text: string;
  audio: NonNullable<import('@/app/types/aiStory').StoryMediaPackage['scenes'][number]['audio']>;
  'sceneId': number;
  'sceneIndex': number;
  'illustrations': (IllustrationBeatMediaItem)[];
}

export interface SePayWebhookPayloadDto {
  'content': string | null;
  'transferAmount': number;
  'referenceCode': string | null;
}

export interface SessionDto {
  'id': number;
  'issuedAt': string;
  'expiresAt': string;
}

export interface SetContentLabelsRequestDto {
  'contentCategoryIds': (number)[];
}

export interface SetLearningProfileRequestDto {
  'readingLevel': number;
  'readingMode': ReadingModeName | null;
  'comprehensionGoal': string | null;
  'topics': (SetLearningProfileTopicRequestDto)[];
}

export interface SetLearningProfileTopicRequestDto {
  'topic': string;
  'relation': TopicRelationName;
}

export interface SetSafetyPolicyCategoryRequestDto {
  'contentCategoryId': number;
  'rule': PolicyRuleName;
}

export interface SetSafetyPolicyRequestDto {
  'maxStoryLength': number;
  'requiredApprovalMode': ApprovalModeName;
  'parentalGateEnabled': boolean;
  'consentRecorded': boolean;
  'safetyScoreThreshold': number | null;
  'readabilityScoreThreshold': number | null;
  'comprehensionThresholdPercent': number;
  'comprehensionWindowSize': number;
  'storyWishesEnabled': boolean;
  'allowInteractiveStories': boolean;
  'childCreationEnabled': boolean;
  'childCreationMode': ChildCreationModeName;
  'voiceAnswersEnabled': boolean;
  'voiceConsentAccepted': boolean;
  'applyAgePreset': boolean | null;
  'categories': (SetSafetyPolicyCategoryRequestDto)[];
}

export interface SetTokenQuotaConfigRequestDto {
  'scope': string;
  'childProfileId': number | null;
  'userId': number | null;
  'quotaLimit': number;
  'periodStart': string;
  'periodEnd': string;
}

export interface StaffActivationRequestDto {
  'email': string;
  'inviteToken': string;
  'newPassword': string;
  'confirmPassword': string;
  'commitmentAccepted': boolean;
}

export interface StartSupervisedChildSessionRequestDto {
  'supervisorRefreshToken': string;
}

export interface Stories_UpdateStoryRequestDto {
  'title': string;
  'description': string | null;
  'content': string | null;
  'coverImageUrl': string | null;
  'genre': string | null;
  'moralLesson': string | null;
  'ageBand': string;
  'language': string;
}

export interface StoryDto {
  'id': number;
  'title': string;
  'description': string | null;
  'content': string | null;
  'coverImageUrl': string | null;
  'genre': string | null;
  'moralLesson': string | null;
  'ageBand': string;
  'language': string;
  'source': string;
  'outputMode': string;
  'status': string;
  'isPublished': boolean;
  'authorUserId': number;
  'authorName': string | null;
  'createdAt': string;
  'updatedAt': string | null;
}

export interface StoryFilterRequestDto {
  'pageIndex': number;
  'pageSize': number;
  'searchTerm': string | null;
  'orderBy': string | null;
  'isDescending': boolean;
  'genre': string | null;
  'ageBand': string | null;
  'status': string | null;
  'isPublished': boolean | null;
  'authorUserId': number | null;
}

export interface StoryMediaPackage extends MediaPackageState {
  isReady: boolean;
  'storyId': number;
  'storyVersionId': number;
  'scenes': (SceneMediaItem)[];
}

export interface StoryReview_UpdateStoryRequestDto {
  'versionId': number;
  'title': string;
  'content': string;
  'lesson': string;
}

export interface StoryReviewDto {
  'storyId': number;
  'outputMode': string;
  'versionId': number;
  'title': string;
  'content': string;
  'lesson': string;
  'readabilityAlgorithm': string;
  'readabilityFkgl': number | null;
  'readabilityFre': number | null;
}

export type StoryStatus = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type StoryStatusName = 'Draft' | 'OutlineReview' | 'ContentReview' | 'Approved' | 'MediaProcessing' | 'MediaReview' | 'Ready' | 'Rejected' | 'Archived';
export interface SubmitAIStoryInputRequestDto {
  'topic': string;
  'genre': string | null;
  'characterMode': string;
  'characters': (string)[];
  'settingMode': string;
  'setting': string | null;
  'lesson': string;
  'vocabularyLevel': string;
  'language': string | null;
  'targetLength': number;
  'outputMode': string;
  'childProfileId': number;
  'existingStoryId': number | null;
  'idempotencyKey': string;
}

export interface SubmitCreatorAIStoryInputRequestDto {
  'topic': string;
  'genre': string | null;
  'characterMode': string;
  'characters': (string)[];
  'settingMode': string;
  'setting': string | null;
  'lesson': string;
  'vocabularyLevel': string;
  'language': string | null;
  'targetLength': number;
  'ageBand': string;
  'readingLevel': number;
  'outputMode': string;
  'existingStoryId': number | null;
  'idempotencyKey': string;
}

export interface SubmitPublicStoryRequestDto {
  'storyId': number;
  'storyVersionId': number;
}

export interface SubscriptionPlanDto {
  'id': number;
  'name': string;
  'priceVnd': number;
  'quotaAmount': number;
}

export interface SuggestAssistanceRequest {
  'operationId': string;
  'expectedTaskRevision': number;
  'answerStepId': number | null;
}

export interface SupervisionRelationshipDto {
  'id': number;
  'childProfileId': number;
  'supervisorUserId': number;
  'supervisorRole': string;
}

export interface TextDiffEntryDto {
  'type': string;
  'before': string | null;
  'after': string | null;
}

export interface TextSelectionDto {
  'start': number;
  'endExclusive': number;
  'text': string;
}

export interface TokenQuotaConfigDto {
  'id': number;
  'scope': string;
  'childProfileId': number | null;
  'userId': number | null;
  'quotaLimit': number;
  'quotaUsed': number;
  'periodStart': string;
  'periodEnd': string;
}

export interface TokenQuotaStatusDto {
  'isUnlimited': boolean;
  'scope': string | null;
  'quotaLimit': number | null;
  'quotaUsed': number | null;
  'remaining': number | null;
  'periodStart': string | null;
  'periodEnd': string | null;
}

export type TopicRelation = 1 | 2;
export type TopicRelationName = 'FavoriteTopic' | 'PriorityFocusArea';
export interface TransferOwnershipRequestDto {
  'targetSupervisorUserId': number;
}

export interface UpdateChildProfileRequestDto {
  'nickname': string;
  'ageBand': AgeBandName;
  'language': string;
  'avatarId': string | null;
}

export interface UpdateContentCategoryRequestDto {
  'displayName': string;
  'isActive': boolean;
  'defaultBlockedAgeBands': (string)[] | null;
}

export interface UpdateDiscussionRequestDto {
  'versionId': number;
  'items': (DiscussionItemDto)[];
}

export interface UpdateProfileRequestDto {
  'fullName': string;
  'avatarUrl': string | null;
}

export interface UpdateQuizRequestDto {
  'versionId': number;
  'items': (QuizItemDto)[];
}

export interface UpdateVocabularyRequestDto {
  'versionId': number;
  'items': (VocabularyItemDto)[];
}

export interface UserProfileDto {
  'id': number;
  'username': string;
  'email': string;
  'fullName': string;
  'phoneNumber': string | null;
  'avatarUrl': string | null;
  'role': string;
  'status': string;
}

export type UserRole = 1 | 2 | 3 | 4;
export type UserRoleName = 'Parent' | 'Moderator' | 'Administrator' | 'ContentCreator';
export interface ValidationCheckDto {
  'name': string;
  'passed': boolean;
  'message': string | null;
}

export interface ValidationResultDto {
  'canApprove': boolean;
  'canConfirmContent': boolean;
  'checks': (ValidationCheckDto)[];
  'issues': (string)[];
}

export interface VerifyEmailRequestDto {
  'email': string;
  'otp': string;
}

export interface VerifyInvitationOtpRequestDto {
  'invitationCode': string;
  'otp': string;
}

export interface VerifyMfaRequestDto {
  'challengeToken': string;
  'code': string;
}

export interface VerifyParentalGateRequestDto {
  'email': string;
  'password': string;
}

export interface VersionMutationResponseDto {
  'storyId': number;
  'storyVersionId': number;
  'storyStatus': string;
  'editType': string;
  'decision': string | null;
}

export interface VocabularyItemDto {
  'id': number | null;
  'term': string;
  'definition': string;
}

export interface VocabularyReviewDto {
  'storyId': number;
  'versionId': number;
  'items': (VocabularyItemDto)[];
}

export interface AddRoadmapStoryRequestDto {
  'storyId': number;
  'childProfileIds': (number)[];
  'position': RoadmapInsertPositionName;
  'expectedDays': number | null;
  'note': string | null;
}

export interface AddRoadmapStoryResultDto {
  'results': (ChildAddResultDto)[];
}

export interface ArchiveRoadmapRequestDto {
  'reason': string;
}

export interface CandidateQueryDto {
  'ageBand': string | null;
  'readingLevelMin': number | null;
  'readingLevelMax': number | null;
  'contentCategoryId': number | null;
  'pageIndex': number;
  'pageSize': number;
}

export interface CandidateStoryDto {
  'storyId': number;
  'title': string | null;
  'ageBand': string;
  'readingLevel': number | null;
  'labels': (RoadmapCategoryDto)[];
  'publishedAt': string | null;
}

export interface CheckRequest {
  'versionId': number;
}

export interface ChildAddResultDto {
  'childProfileId': number;
  'outcome': string;
  'skipCode': string | null;
  'message': string | null;
  'itemId': number | null;
  'warnings': (string)[];
}

export interface ChildRoadmapDto {
  'childProfileId': number;
  'open': ChildRoadmapItemDto | null;
  'waiting': (ChildRoadmapItemDto)[];
  'history': (ChildRoadmapItemDto)[];
  'completedCount': number;
  'totalCount': number;
}

export interface ChildRoadmapItemDto {
  'id': number;
  'storyId': number;
  'title': string | null;
  'position': number;
  'status': string;
  'source': string;
  'skipReason': string | null;
  'note': string | null;
  'expectedDays': number | null;
  'expectedCompletionAt': string | null;
  'openedAt': string | null;
  'completedAt': string | null;
  'addedByUserId': number;
  'isStoryAvailable': boolean;
}

export interface CommunityBlockerDto {
  'code': string;
  'message': string;
}

export interface CommunityChecklistEntryDto {
  'code': string;
  'label': string;
  'passed': boolean;
  'note': string | null;
}

export interface CommunityEligibilityDto {
  'storyId': number;
  'canSubmit': boolean;
  'storyVersionId': number | null;
  'requiredDeclaration': string;
  'blockers': (CommunityBlockerDto)[];
  'piiFindings': (PiiFindingDto)[];
}

export interface CommunityLabelDto {
  'id': number;
  'code': string;
  'displayName': string;
}

export interface CommunityLibraryQueryDto {
  'pageIndex': number;
  'pageSize': number;
}

export interface CommunityPiiLocationDto {
  'kind': string;
  'location': string;
}

export interface CommunityReviewBlockerDto {
  'code': string;
  'message': string;
}

export interface CommunityReviewDecisionResultDto {
  'itemId': number;
  'decision': string;
  'storyId': number;
  'decidedAt': string;
}

export interface CommunityReviewPackageDto {
  'itemId': number;
  'story': ReportedStoryDto;
  'version': ReportedVersionDto;
  'scenes': (ReportedSceneDto)[];
  'vocabulary': (ReportedVocabularyDto)[];
  'quizzes': (ReportedQuizDto)[];
  'discussionQuestions': (ReportedDiscussionDto)[];
  'labels': (CommunityLabelDto)[];
  'copyrightDeclaration': string | null;
  'piiCheckSummary': string | null;
  'piiRescan': (CommunityPiiLocationDto)[];
  'isResubmission': boolean;
  'checklist': (CommunityChecklistEntryDto)[];
  'blockers': (CommunityReviewBlockerDto)[];
  'canApprove': boolean;
  'claimExpiresAt': string;
}

export interface CommunityStoryDto {
  'submissionId': number;
  'title': string;
  'description': string | null;
  'ageBand': string;
  'readingLevel': number | null;
  'labels': (CommunityLabelDto)[];
  'author': string;
  'approvedAt': string | null;
}

export interface CommunitySubmissionDto {
  'itemId': number;
  'storyId': number;
  'storyTitle': string | null;
  'status': string;
  'submittedAt': string;
  'decidedAt': string | null;
  'rejectReason': string | null;
  'canWithdraw': boolean;
  'canRemove': boolean;
}

export interface CommunitySubmitRequestDto {
  'storyId': number;
  'confirmNoPersonalInfo': boolean;
  'copyrightDeclaration': CopyrightDeclaration | null;
}

export interface CommunitySubmitResultDto {
  'itemId': number;
  'storyId': number;
  'storyVersionId': number;
  'status': string;
}

export type CopyrightDeclaration = 1 | 2 | 3;
export type CopyrightDeclarationName = 'AiGenerated' | 'OwnWork' | 'FamilyUse';
export interface CreateReviewItemRequestDto {
  'storyId': number;
  'readingRoadmapId': number | null;
  'reason': ContentReportReasonName;
  'description': string | null;
  'attachmentUrl': string | null;
}

export interface CreatorPublicationResult {
  'storyId': number;
  'versionId': number;
  'itemId': number | null;
  'status': string;
  'revisionToken': string;
}

export interface CreatorPublicationStatus {
  'storyId': number;
  'versionId': number;
  'isPublished': boolean;
  'reviewStatus': string;
  'openItemId': number | null;
  'openItemType': string | null;
  'openItemStatus': string | null;
}

export interface CreatorRemovalRequest {
  'reason': string;
}

export interface CreatorRevisionRequest {
  'sourceVersionId': number;
}

export interface EscalateReportRequestDto {
  'reason': string;
}

export interface GrayZoneContentCheckDto {
  'storyVersionId': number;
  'status': string;
  'waitingForModeration': boolean;
}

export interface GrayZoneCriterionScore {
  'code': string;
  'level': number;
}

export interface GrayZoneDecisionRequest {
  'decision': string;
  'reason': string;
  'rowVersion': number;
}

export interface GrayZoneFinding {
  'criterionCode': string;
  'kind': string;
  'name': string;
  'evidenceQuote': string;
  'reason': string;
  'contextNote': string;
}

export interface GrayZoneReviewDto {
  'itemId': number;
  'storyVersionId': number;
  'versionNo': number;
  'title': string;
  'content': string;
  'ageBand': string;
  'readingLevel': number | null;
  'flags': string | null;
  'rowVersion': number;
}

export interface MyRoadmapDoneDto {
  'storyId': number;
  'title': string | null;
  'coverImageUrl': string | null;
  'completedAt': string | null;
}

export interface MyRoadmapDto {
  'open': MyRoadmapOpenStoryDto | null;
  'upcoming': (MyRoadmapUpcomingDto)[];
  'done': (MyRoadmapDoneDto)[];
  'completedCount': number;
  'totalCount': number;
  'isFinished': boolean;
}

export interface MyRoadmapOpenStoryDto {
  'storyId': number;
  'title': string | null;
  'coverImageUrl': string | null;
  'note': string | null;
  'expectedBy': string | null;
  'isLocked': boolean;
}

export interface MyRoadmapUpcomingDto {
  'order': number;
  'storyId': number;
  'title': string | null;
  'coverImageUrl': string | null;
  'isLocked': boolean;
}

export interface PiiFindingDto {
  'kind': string;
  'location': string;
  'excerpt': string;
}

export interface PublishedContentItemDto {
  'source': string;
  'id': number;
  'title': string;
  'ageBand': string;
  'labels': (ReportedLabelDto)[];
  'publishedAt': string | null;
  'storyCount': number | null;
  'needsUpdate': boolean;
}

export interface PublishedContentQueryDto {
  'source': PublishedContentSourceName;
  'ageBand': string | null;
  'contentCategoryId': number | null;
  'publishedFrom': string | null;
  'publishedTo': string | null;
  'pageIndex': number;
  'pageSize': number;
}

export type PublishedContentSource = 1 | 2;
export type PublishedContentSourceName = 'PublicLibrary' | 'RoadmapTemplate';
export interface PublishedRoadmapDto {
  'roadmapId': number;
  'name': string;
  'description': string | null;
  'ageBand': string;
  'mainCategory': ReportedLabelDto | null;
  'readingLevelMin': number;
  'readingLevelMax': number;
  'defaultDaysPerStory': number;
  'publishedAt': string | null;
  'needsUpdate': boolean;
  'stories': (PublishedRoadmapStoryDto)[];
}

export interface PublishedRoadmapStoryDto {
  'storyId': number;
  'position': number;
  'days': number | null;
  'title': string | null;
  'ageBand': string;
  'isArchived': boolean;
}

export interface PublishedStoryContentDto {
  'story': ReportedStoryDto;
  'version': ReportedVersionDto | null;
  'scenes': (ReportedSceneDto)[];
  'vocabulary': (ReportedVocabularyDto)[];
  'quizzes': (ReportedQuizDto)[];
  'discussionQuestions': (ReportedDiscussionDto)[];
}

export interface RejectCommunityRequestDto {
  'reason': string;
}

export interface RejectRoadmapRequestDto {
  'reason': string;
}

export interface RemovalDecisionRequest {
  'approve': boolean;
  'reason': string;
  'rowVersion': number;
}

export interface ReorderRoadmapRequestDto {
  'itemIds': (number)[];
}

export interface RequestRoadmapChangesDto {
  'generalNote': string;
  'parts': (RoadmapChangePartDto)[];
}

export interface RoadmapCategoryDto {
  'id': number;
  'code': string;
  'displayName': string;
}

export interface RoadmapChangePartDto {
  'partType': string;
  'storyId': number | null;
  'action': string | null;
  'note': string;
}

export interface RoadmapCheckDto {
  'code': string;
  'passed': boolean;
  'message': string;
  'relatedRoadmapId': number | null;
}

export interface RoadmapChecklistEntryDto {
  'code': string;
  'label': string;
  'passed': boolean;
  'note': string | null;
}

export interface RoadmapChildPlanDto {
  'childProfileId': number;
  'outcome': string;
  'skipCode': string | null;
  'message': string | null;
  'steps': (RoadmapStepPlanDto)[];
  'warnings': (string)[];
}

export interface RoadmapCloneResultDto {
  'roadmapId': number;
  'sourceRoadmapId': number;
  'alreadyExisted': boolean;
}

export interface RoadmapCopyPlanDto {
  'roadmapId': number;
  'roadmapName': string;
  'children': (RoadmapChildPlanDto)[];
}

export interface RoadmapCopyRequestDto {
  'childProfileIds': (number)[];
  'position': RoadmapInsertPositionName;
  'daysPerStory': number | null;
}

export interface RoadmapDetailDto {
  'id': number;
  'name': string;
  'description': string | null;
  'ageBand': string;
  'mainCategory': RoadmapCategoryDto | null;
  'readingLevelMin': number;
  'readingLevelMax': number;
  'defaultDaysPerStory': number;
  'status': string;
  'createdByUserId': number;
  'createdByName': string | null;
  'isMine': boolean;
  'submittedAt': string | null;
  'publishedAt': string | null;
  'clonedFromId': number | null;
  'stories': (RoadmapStoryDto)[];
  'checks': (RoadmapCheckDto)[];
  'canSubmit': boolean;
  'lastReview': RoadmapLastReviewDto | null;
  'needsUpdate': boolean;
  'retiredStoryIds': (number)[];
}

export type RoadmapInsertPosition = 1 | 2;
export type RoadmapInsertPositionName = 'NextUp' | 'End';
export interface RoadmapItemInputDto {
  'storyId': number;
  'days': number | null;
}

export interface RoadmapLastReviewDto {
  'decision': string;
  'reviewerName': string | null;
  'generalNote': string | null;
  'reason': string | null;
  'parts': (RoadmapChangePartDto)[];
  'decidedAt': string | null;
}

export interface RoadmapLibraryDetailDto {
  'id': number;
  'name': string;
  'description': string | null;
  'ageBand': string;
  'mainCategory': RoadmapCategoryDto | null;
  'readingLevelMin': number;
  'readingLevelMax': number;
  'defaultDaysPerStory': number;
  'storyCount': number;
  'needsUpdate': boolean;
  'publishedAt': string | null;
  'stories': (RoadmapLibraryStoryDto)[];
}

export interface RoadmapLibraryItemDto {
  'id': number;
  'name': string;
  'description': string | null;
  'ageBand': string;
  'mainCategory': RoadmapCategoryDto | null;
  'readingLevelMin': number;
  'readingLevelMax': number;
  'defaultDaysPerStory': number;
  'storyCount': number;
  'needsUpdate': boolean;
  'publishedAt': string | null;
}

export interface RoadmapLibraryQueryDto {
  'ageBand': string | null;
  'readingLevel': number | null;
  'contentCategoryId': number | null;
  'pageIndex': number;
  'pageSize': number;
}

export interface RoadmapLibraryStoryDto {
  'storyId': number;
  'position': number;
  'days': number | null;
  'title': string | null;
  'ageBand': string;
  'readingLevel': number | null;
  'isAvailable': boolean;
}

export type RoadmapListGroup = 1 | 2 | 3 | 4 | 5;
export type RoadmapListGroupName = 'Drafts' | 'Pending' | 'Published' | 'Archived' | 'Orphaned';
export interface RoadmapListItemDto {
  'id': number;
  'name': string;
  'ageBand': string;
  'mainCategory': RoadmapCategoryDto | null;
  'storyCount': number;
  'status': string;
  'createdByUserId': number;
  'createdByName': string | null;
  'isMine': boolean;
  'submittedAt': string | null;
  'publishedAt': string | null;
  'openCloneId': number | null;
  'needsUpdate': boolean;
  'retiredStoryCount': number;
}

export interface RoadmapListQueryDto {
  'group': RoadmapListGroupName;
  'pageIndex': number;
  'pageSize': number;
}

export interface RoadmapReviewBlockerDto {
  'code': string;
  'message': string;
  'relatedRoadmapId': number | null;
}

export interface RoadmapReviewDecisionResultDto {
  'itemId': number;
  'decision': string;
  'roadmapId': number;
  'roadmapStatus': string;
  'replacedRoadmapId': number | null;
  'decidedAt': string;
}

export interface RoadmapReviewInfoDto {
  'id': number;
  'name': string;
  'description': string | null;
  'ageBand': string;
  'mainCategory': RoadmapCategoryDto | null;
  'readingLevelMin': number;
  'readingLevelMax': number;
  'defaultDaysPerStory': number;
  'createdByUserId': number;
  'createdByName': string | null;
  'submittedAt': string | null;
  'clonedFromId': number | null;
}

export interface RoadmapReviewPackageDto {
  'itemId': number;
  'roadmap': RoadmapReviewInfoDto;
  'stories': (RoadmapStoryDto)[];
  'checks': (RoadmapCheckDto)[];
  'checklist': (RoadmapChecklistEntryDto)[];
  'blockers': (RoadmapReviewBlockerDto)[];
  'canApprove': boolean;
  'claimExpiresAt': string;
}

export interface RoadmapStepPlanDto {
  'storyId': number;
  'title': string | null;
  'position': number;
  'days': number;
  'action': string;
  'skipCode': string | null;
  'message': string | null;
}

export interface RoadmapStoryDto {
  'storyId': number;
  'position': number;
  'days': number | null;
  'title': string | null;
  'ageBand': string;
  'readingLevel': number | null;
  'isEligible': boolean;
}

export interface RoadmapSubmitResultDto {
  'roadmapId': number;
  'status': string;
  'itemId': number | null;
}

export interface RubricCloneRequest {
  'versionNo': string;
  'name': string;
}

export interface RubricCriterion {
  'code': string;
  'name': string;
  'check': string;
  'context': string;
  'levels': Record<string, string>;
  'examples': (RubricExample)[];
}

export interface RubricDefinition {
  'purpose': string;
  'criteria': (RubricCriterion)[];
}

export interface RubricDto {
  'id': number;
  'versionNo': string;
  'name': string;
  'status': string;
  'revision': number;
  'schemaVersion': string;
  'contentHash': string;
  'definition': RubricDefinition;
  'createdByUserId': number;
  'createdAt': string;
  'activatedByUserId': number | null;
  'activatedAt': string | null;
  'retiredAt': string | null;
}

export interface RubricEvaluationRequest {
  'revision': number;
  'phase': string;
  'ageBand': string;
  'language': string;
  'title': string;
  'content': string;
}

export interface RubricExample {
  'text': string;
  'level': number;
  'reason': string;
}

export interface RubricRevisionRequest {
  'revision': number;
}

export interface RubricSnapshot {
  'id': number;
  'version': string;
  'schemaVersion': string;
  'contentHash': string;
  'definition': RubricDefinition;
}

export interface RubricWriteRequest {
  'versionNo': string;
  'name': string;
  'definition': RubricDefinition;
  'revision': number;
}

export interface SaveCommunityChecklistRequestDto {
  'entries': (CommunityChecklistEntryDto)[];
}

export interface SaveRoadmapChecklistRequestDto {
  'entries': (RoadmapChecklistEntryDto)[];
}

export interface SaveRoadmapRequestDto {
  'name': string;
  'description': string | null;
  'ageBand': string;
  'mainCategoryId': number;
  'readingLevelMin': number;
  'readingLevelMax': number;
  'defaultDaysPerStory': number;
}

export interface SetCommunityLabelsRequestDto {
  'contentCategoryIds': (number)[];
}

export interface SetRoadmapItemsRequestDto {
  'items': (RoadmapItemInputDto)[];
}


/** Creator Manual Phase 5 extension from the current local backend source. */
export interface ConfirmManualContentRequest { versionId: number; revisionToken: string }
export interface ConfirmManualContentResult { storyId: number; versionId: number; jobId: number; status: string; jobStatus: string; progressUrl: string; packageUrl: string }
