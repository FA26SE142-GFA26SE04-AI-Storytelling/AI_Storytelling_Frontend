/**
 * Phụ huynh tự viết truyện cho con (`/parent/stories`) và bé đọc truyện đã được giao (`/child/manual-stories`).
 * Theo docs backend PARENT_MANUAL_API_GUIDE.md: lưu → kiểm tra → xác nhận nội dung → chuẩn bị → xem trước → giao cho con.
 */
import type { CreatorDraft } from './creator';

export type WritingPurpose = 'free' | 'family_memory' | 'understanding' | 'message';

export interface ParentDraft {
  story: CreatorDraft;
  childProfileId: number;
  purpose: WritingPurpose | string;
  /** Đã giao cho con hoặc mất quyền: chỉ xem. */
  isReadOnly: boolean;
  readOnlyReason: string | null;
  canUseAiAssistance: boolean;
  aiUnavailableReason: string | null;
}

export interface CreateParentDraftInput {
  childProfileId: number;
  title: string;
  purpose: WritingPurpose;
  experienceMode: 'reading' | 'listening' | 'combined';
  language?: string;
}

export interface ParentCheck {
  checkId: number;
  storyVersionId: number;
  contextFingerprint: string;
  canPrepare: boolean;
  /** Mã lỗi, ví dụ STORY_TOO_LONG, BLOCKED_CATEGORY:violence. */
  errors: string[];
  warnings: string[];
  coverage: string;
}

export interface ParentChecklist { intendedMeaning: boolean; suitableForChild: boolean; privacyChecked: boolean; endingChecked: boolean }

export interface ParentContentConfirmation { confirmationId: number; storyVersionId: number; checkId: number; checklist: ParentChecklist }

export interface ParentSegment { order: number; startOffset: number; endOffset: number; text: string }

/** Gói đọc đã chuẩn bị (cũng là gói bé nhận được khi đọc). */
export interface ParentPreparation {
  preparationId: number;
  storyId: number;
  storyVersionId: number;
  childProfileId: number;
  audienceRevision: number;
  contextFingerprint: string;
  title: string;
  language: string;
  experienceMode: string;
  segments: ParentSegment[];
  isReady: boolean;
  missingRequirements: string[];
}

export interface ParentFamilyConfirmation {
  confirmationId: number;
  storyId: number;
  storyVersionId: number;
  childProfileId: number;
  preparationId: number;
  confirmedAt: string;
}

/** Một bước đã làm (kiểm tra, xác nhận, chuẩn bị, giao, thu hồi) để phục hồi tiến trình sau khi tải lại. */
export interface ParentOperation {
  id: number;
  /** Setup, Check, ContentConfirmation, Preparation, FamilyConfirmation, FamilyRevocation. */
  kind: string;
  storyVersionId: number | null;
  sourceIsCurrent: boolean;
  revokedAt: string | null;
  result: Record<string, unknown>;
}
