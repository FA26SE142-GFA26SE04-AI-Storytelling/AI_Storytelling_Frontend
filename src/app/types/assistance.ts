/**
 * AI hỗ trợ khi soạn (Creative Suggestion Engine), dùng chung cho Content Creator và phụ huynh.
 * Theo docs backend CREATOR_ASSISTANCE_API_FRONTEND_GUIDE.md. Offset tính theo UTF-16 (đúng như chỉ số chuỗi JS).
 */

export type AssistanceEntryPoint = 'ContinueWriting' | 'SupportSelection' | 'ReviewDraft';
export interface AssistanceTarget { kind: 'cursor' | 'selection' | 'wholeDraft'; start: number; length: number }
export interface AssistanceConstraints { keep: string[]; avoid: string[] }
export interface EditorSnapshot { title: string; content: string }

export interface AssistanceOption { id: string; summary: string; direction: string }
export interface AssistanceQuestion { id: string; text: string; choices: { id: string; text: string }[] }
export interface AssistanceFinding { id: string; start: number; length: number; quote: string; comment: string; suggestedGoal: string }
/** insert / replace tại [start, start+length) của snapshot nguồn. */
export interface AssistancePatch { kind: string; start: number; length: number; text: string; quote: string }

export interface AssistanceAiResult {
  /** Options, Clarification, ReviewFindings, Trial. */
  resultType: string;
  question: AssistanceQuestion | null;
  options: AssistanceOption[];
  findings: AssistanceFinding[];
  patch: AssistancePatch | null;
  checksPerformed: string[];
  warnings: string[];
  assumptions: string[];
  coverage: string | null;
}

export interface AssistanceStep {
  stepId: number;
  sequence: number;
  operationId: string;
  /** Suggestions, Answer, Direction, Trial, Cancel, Close… */
  kind: string;
  /** Running, Succeeded, Failed, Cancelled, Interrupted. */
  status: string;
  resultingTaskRevision: number;
  errorCode: string | null;
  result: AssistanceAiResult | null;
  direction: { confirmedDirectionText: string; constraints: AssistanceConstraints } | null;
  directionStepId: number | null;
  answer: string | null;
  createdAt: string;
}

export interface AssistanceTask {
  taskId: number;
  storyId: number;
  entryPoint: AssistanceEntryPoint | string;
  /** Open, OptionsReady, ClarificationNeeded, DirectionConfirmed, TrialReady, ReviewReady, Closed… */
  status: string;
  taskRevision: number;
  snapshotHash: string;
  snapshot: EditorSnapshot;
  target: AssistanceTarget;
  storyContextStale: boolean;
  audienceContextStale: boolean;
  activeOperation: { operationId: string; stepId: number; status: string; leaseExpiresAt: string | null } | null;
  activeClarificationStepId: number | null;
  activeOptionsStepId: number | null;
  activeReviewStepId: number | null;
  activeDirectionStepId: number | null;
  activeTrialStepId: number | null;
  activeDirection: AssistanceStep | null;
  activeTrial: AssistanceStep | null;
  activeResult: AssistanceAiResult | null;
  goal: string | null;
}

export interface AssistanceCommandResult {
  taskId: number;
  stepId: number;
  taskRevision: number;
  status: string;
  /** true (HTTP 202): lượt AI còn chạy; GET task để theo dõi. */
  isRunning: boolean;
  step: AssistanceStep;
  pollUrl: string | null;
  snapshotHash: string | null;
}

export interface CreateAssistanceInput {
  entryPoint: AssistanceEntryPoint;
  editorSnapshot: EditorSnapshot;
  target: AssistanceTarget;
  goal: string;
  constraints: AssistanceConstraints;
  parentTaskId?: number;
  sourceReviewStepId?: number;
  findingId?: string;
}

/** Khai khi lưu phiên bản: đã dùng hướng / đoạn thử nào của AI. */
export interface AssistanceReference { taskId: number; stepId: number; usage: 'DirectionUsed' | 'TrialUsed' }

export interface AuthoringGuide {
  id: string;
  purposes: string[];
  /** starting_point, opening, events, emotion, dialogue, transition, ending. */
  supportGroup: string;
  /** question (câu gợi nghĩ) hoặc template (mẫu câu có chỗ điền). */
  itemType: string;
  title: string;
  instruction: string;
  example: string | null;
  templateText: string | null;
  placeholderDefinitions: string[];
  order: number;
}
