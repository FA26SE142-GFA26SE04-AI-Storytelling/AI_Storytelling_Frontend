import type { StoryOutputMode } from './story';

/** Luồng 2 mục 3.2, 5.2–5.5 — nhập truyện có sẵn và đánh giá mức phù hợp với hồ sơ bé. */

export interface ImportStoryRequest {
  /** Backend nhận 'paste' | 'txt' | 'docx'; truyện phụ huynh tự soạn gửi như 'paste'. */
  inputMethod: 'paste' | 'txt' | 'docx';
  content: string;
  title?: string;
  childProfileId: number;
  language?: string;
  outputMode?: StoryOutputMode;
  idempotencyKey: string;
}

export interface ImportStoryResponse {
  storyId: number;
  storyVersionId: number;
  storyStatus: string;
  editType: string;
  contentLength: number | null;
  inputStatus: string;
  reasonCode: string | null;
  fallbackMessage: string | null;
  canProceed: boolean;
  warnings: string[];
}

export type ExistingDecision = 'Suitable' | 'AdaptRecommended' | 'Blocked';

export interface EvaluationIssue { code: string; message: string }

export interface ExistingStoryEvaluation {
  storyId: number;
  storyVersionId: number;
  decisionText: ExistingDecision | string;
  hardSafetyIssues: EvaluationIssue[];
  profileFitIssues: EvaluationIssue[];
  readabilityFkgl: number | null;
  readabilityFre: number | null;
  safetyScore: number | null;
  wordCount: number | null;
  canKeepOriginal: boolean;
}

export interface VersionMutationResponse {
  storyId: number;
  storyVersionId: number;
  storyStatus: string;
  editType: string;
  decision: ExistingDecision | string | null;
}
