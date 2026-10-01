export interface AIStoryInputContextDto {
  childProfileId: number;
  childNickname: string;
  ageBand: string;
  readingLevel: number;
  defaultVocabularyLevel: VocabularyLevel;
  availableVocabularyLevels: VocabularyLevel[];
  defaultLanguage: string;
  availableLanguages: string[];
  maximumLength: number;
  requiredApprovalMode: string;
  parentalGateEnabled: boolean;
  safetyScoreThreshold: number | null;
  readabilityScoreThreshold: number | null;
  comprehensionGoal: string | null;
  comprehensionThresholdPercent: number | null;
  comprehensionWindowSize: number;
  interests: string[];
  allowedCategoryCodes: string[];
  restrictedCategoryCodes: string[];
  blockedCategoryCodes: string[];
  characterModes: CharacterMode[];
  settingModes: SettingMode[];
}

export type VocabularyLevel = 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5';
export type CharacterMode = 'specified' | 'ai_suggested';
export type SettingMode = 'specified' | 'ai_suggested';

export interface AIStoryCreativeInputDto {
  topic: string;
  genre?: string;
  characterMode: CharacterMode;
  characters: string[];
  settingMode: SettingMode;
  setting?: string;
  lesson: string;
  vocabularyLevel: VocabularyLevel;
  language?: string;
  targetLength: number;
}

export interface SubmitAIStoryInputRequestDto extends AIStoryCreativeInputDto {
  childProfileId: number;
  existingStoryId?: number;
  idempotencyKey: string;
}

export type AIStoryInputStatus =
  | 'pending_input'
  | 'checking_input'
  | 'input_accepted'
  | 'input_blocked'
  | 'input_check_failed';

export interface AIStoryInputProgressDto {
  requestId: number;
  storyId: number;
  inputStatus: AIStoryInputStatus;
  handoffStatus: string;
  handoffJobId: number | null;
  attemptCount: number;
  maxAttempts: number;
  reasonCode: string | null;
  fallbackMessage: string | null;
  canRetry: boolean;
  createdAt: string;
  updatedAt: string | null;
  guardrailCheckedAt: string | null;
  handoffCreatedAt: string | null;
}

export interface RetryAIStoryInputRequestDto extends AIStoryCreativeInputDto {
  retryKey: string;
}

export interface OutlineVersionDto {
  id: number;
  versionNo: number;
  editType: string;
  title: string;
  opening: string;
  development: string;
  ending: string;
  isCurrent: boolean;
  editorUserId: number | null;
  outlineApprovedByUserId: number | null;
  outlineApprovedAt: string | null;
  createdAt: string;
}
export interface OutlineProgressDto {
  storyId: number;
  storyStatus: string;
  currentVersion: OutlineVersionDto | null;
  activeOperation: string | null;
  activeJobStatus: string | null;
  lastErrorCode: string | null;
}
export interface EditOutlineRequestDto { title: string; opening: string; development: string; ending: string }
export interface RegenerateOutlineRequestDto { operationKey: string }
export interface RetryOutlineRequestDto { operationKey: string }
export interface ApproveOutlineRequestDto { approvalKey: string }
export interface RejectOutlineRequestDto { reason: string }

export interface ContentQualityFailureDto {
  refinementAttempts: number;
  safetyScore: number | null;
  failedGates: { gate: string; reasonCode: string; violations: string[] }[];
}
export interface ContentGenerationProgressDto {
  storyId: number;
  storyStatus: string;
  currentStep: string;
  content: string;
  vocabulary: string;
  quiz: string;
  discussion: string;
  isComplete: boolean;
  lastErrorCode: string | null;
  qualityFailure: ContentQualityFailureDto | null;
  stableStoryVersionId: number | null;
}
export interface StoryReviewDto {
  storyId: number;
  versionId: number;
  title: string;
  content: string;
  lesson: string;
  readabilityAlgorithm: string;
  readabilityFkgl: number | null;
  readabilityFre: number | null;
}
export interface VocabularyItemDto { id?: number | null; term: string; definition: string }
export interface QuizQuestionDto { id?: number | null; type: string; question: string; correctAnswer?: string | null; choices?: string[] | null }
export interface DiscussionPromptDto { id?: number | null; question: string; isMoralLesson: boolean }
export interface VocabularyReviewDto { storyId: number; versionId: number; items: VocabularyItemDto[] }
export interface QuizReviewDto { storyId: number; versionId: number; items: QuizQuestionDto[] }
export interface DiscussionReviewDto { storyId: number; versionId: number; items: DiscussionPromptDto[] }
export interface ArtifactStatusDto { state: string; itemCount: number }
export interface ReviewPackageDto {
  storyId: number;
  storyVersionId: number;
  storyStatus: string;
  title: string;
  content: string;
  lesson: string;
  readabilityAlgorithm: string;
  readabilityFkgl: number | null;
  readabilityFre: number | null;
  vocabulary: ArtifactStatusDto;
  quiz: ArtifactStatusDto;
  discussion: ArtifactStatusDto;
  canEdit: boolean;
  canApprove: boolean;
  canArchive: boolean;
}
export interface ValidationResultDto {
  canApprove: boolean;
  checks: { name: string; passed: boolean; message?: string | null }[];
  issues: string[];
}
export interface AIProposalDto {
  proposalId: string;
  requestedByUserId: number;
  storyId: number;
  storyVersionId: number;
  artifactType: string;
  operationType: string;
  originalContent: unknown;
  suggestedContent: unknown;
  status: string;
  createdAt: string;
  expiresAt: string;
}
export interface PartialEditRequestDto {
  versionId: number;
  selection: { start: number; endExclusive: number; text: string };
  instruction: string;
}
export interface UpdateStoryReviewRequestDto { versionId: number; title: string; content: string; lesson: string }
export interface UpdateVocabularyRequestDto { versionId: number; items: VocabularyItemDto[] }
export interface UpdateQuizRequestDto { versionId: number; items: QuizQuestionDto[] }
export interface UpdateDiscussionRequestDto { versionId: number; items: DiscussionPromptDto[] }
export interface GenerateArtifactsRequestDto {
  storyVersionId?: number;
  includeVocabulary?: boolean;
  includeQuiz?: boolean;
  includeDiscussion?: boolean;
}
export interface ArtifactGenerationResultDto {
  storyId: number; storyVersionId: number; vocabularyCount: number; quizCount: number; discussionCount: number; success: boolean; message: string;
}
export interface ApproveResponseDto { success: boolean; storyId: number; status: string; approvedAt: string }
export interface ArchiveRequestDto { reason?: string }
export interface ArchiveResponseDto { success: boolean; storyId: number; status: string }
export interface MediaProgressDto {
  storyId: number;
  approvedStoryVersionId: number | null;
  storyStatus: string;
  jobStatus: string;
  sceneCount: number;
  readyIllustrations: number;
  readyAudio: number;
  isReady: boolean;
  errorCode: string | null;
  requiredIllustrations: number;
  missingIllustrationBeatIds: number[] | null;
  missingAudioSegmentIds: number[] | null;
  manualReviewAssetIds: number[] | null;
  scenesWithoutValidBeats: number[] | null;
}
export interface StoryMediaPackage {
  storyId: number;
  storyVersionId: number;
  scenes: {
    sceneId: number;
    sceneIndex: number;
    illustrations: {
      beatId: number; beatOrder: number; startOffset: number; endOffset: number;
      visualFocus: string; assetId: number | null; status: string; url: string | null;
    }[];
  }[];
}
export type ReviewArtifact = 'story' | 'vocabulary' | 'quiz' | 'discussion';
export interface CreateProposalResponseDto { proposalId: string; message: string }
export interface ApplyDiscardResponseDto { success: boolean; message: string }

