export interface AIStoryInputContextDto {
  childProfileId: number;
  nickname: string;
  ageBand: string;
  language: string;
  readingLevel: number;
  comprehensionGoal?: string;
  favoriteTopics: string[];
  restrictedTopics: string[];
  maxStoryLength: number;
  tokenBalance: number;
  canCreateStory: boolean;
}

export interface SubmitAIStoryInputRequest {
  childProfileId: number;
  prompt: string;
  genre?: string;
  targetLesson?: string;
  customCharacters?: string[];
  language?: string;
  idempotencyKey?: string;
}

export interface AIStoryInputProgressDto {
  requestId: number;
  storyId: number;
  inputStatus: 'checking_input' | 'input_accepted' | 'input_blocked' | 'input_check_failed';
  safetyScore?: number;
  reasonCode?: string;
  fallbackMessage?: string;
  createdAt: string;
}

export interface RetryAIStoryInputRequestDto {
  newPrompt: string;
}

export interface OutlineNodeDto {
  chapterNumber: number;
  title: string;
  summary: string;
  keyAction: string;
  moralLesson?: string;
}

export interface OutlineVersionDto {
  versionNumber: number;
  title: string;
  synopsis: string;
  nodes: OutlineNodeDto[];
  status: string; // 'Draft' | 'Approved' | 'Rejected'
  feedback?: string;
  createdAt: string;
}

export interface OutlineProgressDto {
  storyId: number;
  currentVersion?: OutlineVersionDto;
  status: string;
  message?: string;
}

export interface EditOutlineRequestDto {
  title: string;
  synopsis: string;
  nodes: OutlineNodeDto[];
}

export interface RegenerateOutlineRequestDto {
  instructions: string;
}

export interface RetryOutlineRequestDto {
  instructions: string;
}

export interface ApproveOutlineRequestDto {
  notes?: string;
}

export interface RejectOutlineRequestDto {
  reason: string;
}

export interface ContentGenerationProgressDto {
  storyId: number;
  status: 'NotStarted' | 'GeneratingContent' | 'Completed' | 'Failed';
  progressPercentage: number;
  currentStep?: string;
  error?: string;
}

export interface StoryReviewDto {
  storyId: number;
  title: string;
  content: string;
  readingLevel: number;
  moralLesson?: string;
  status: string;
}

export interface VocabularyItemDto {
  id?: number;
  word: string;
  phonetic?: string;
  definition: string;
  exampleSentence?: string;
  contextSentence?: string;
}

export interface VocabularyReviewDto {
  storyId: number;
  items: VocabularyItemDto[];
  status: string;
}

export interface QuizQuestionDto {
  id?: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface QuizReviewDto {
  storyId: number;
  questions: QuizQuestionDto[];
  status: string;
}

export interface DiscussionPromptDto {
  id?: number;
  promptText: string;
  guidingNotes?: string;
  ageAppropriateTopic?: string;
}

export interface DiscussionReviewDto {
  storyId: number;
  prompts: DiscussionPromptDto[];
  status: string;
}

export interface ReviewPackageDto {
  storyId: number;
  title: string;
  story: StoryReviewDto;
  vocabulary: VocabularyReviewDto;
  quiz: QuizReviewDto;
  discussion: DiscussionReviewDto;
  isReadyForApproval: boolean;
  autoPublishEligible: boolean;
}

export interface ValidationResultDto {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AIProposalDto {
  proposalId: string;
  storyId: number;
  section: 'Story' | 'Vocabulary' | 'Quiz' | 'Discussion';
  originalContent: string;
  proposedContent: string;
  summaryOfChanges: string;
  createdAt: string;
}

export interface PartialEditRequestDto {
  targetSection: string;
  prompt: string;
}

export interface UpdateStoryReviewRequestDto {
  title: string;
  content: string;
}

export interface UpdateVocabularyRequestDto {
  items: VocabularyItemDto[];
}

export interface UpdateQuizRequestDto {
  questions: QuizQuestionDto[];
}

export interface UpdateDiscussionRequestDto {
  prompts: DiscussionPromptDto[];
}

export interface GenerateArtifactsRequestDto {
  targetArtifacts?: string[];
}

export interface ArtifactGenerationResultDto {
  storyId: number;
  vocabularyCount: number;
  quizCount: number;
  discussionCount: number;
  status: string;
}

export interface ApproveResponseDto {
  storyId: number;
  status: string;
  isPublished: boolean;
  message: string;
}

export interface ArchiveRequestDto {
  reason: string;
}

export interface ArchiveResponseDto {
  storyId: number;
  status: string;
  archivedAt: string;
}
