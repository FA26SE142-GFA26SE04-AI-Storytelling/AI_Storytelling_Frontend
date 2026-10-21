/** Luồng 5 Bước 5.8 — truyện Content Creator soạn thủ công (`/creator/stories`), theo docs backend CONTENT_CREATOR_MANUAL_API_FRONTEND_GUIDE.md. */

/** Chuỗi của API Creator (không dùng `Age_6_8` / `Age_9_10` của hồ sơ bé). */
export type CreatorAgeBand = '6-8' | '9-10';
export type ExperienceMode = 'reading' | 'listening' | 'combined';

export interface CreatorDraft {
  storyId: number;
  authorUserId: number;
  title: string;
  description: string;
  language: string;
  ageBand: CreatorAgeBand | string;
  genre: string;
  experienceMode: ExperienceMode | string;
  audienceRevision: number;
  /** Nhận diện trạng thái chỉnh sửa; gửi kèm mọi lệnh ghi, backend trả 409 nếu đã cũ. */
  revisionToken: string;
  /** ID phiên bản hiện tại (null khi chưa lưu lần nào); gửi làm `baseVersionId`. */
  selectedVersionId: number | null;
  lastVersionNo: number;
  createdAt: string;
  updatedAt: string | null;
  /** "Manual" hoặc "Ai". */
  source?: string;
  /** Trạng thái truyện của backend: Draft, ContentReview, MediaProcessing, Ready, Archived… */
  status?: string;
}

/** `GET /creator/stories/{id}/publication`. `reviewStatus`: None, Pending, Approved, ChangesRequested, Rejected. */
export interface CreatorPublication {
  storyId: number;
  versionId: number;
  isPublished: boolean;
  reviewStatus: string;
  openItemId: number | null;
  /** PublicStoryReview (duyệt phát hành) hoặc PublicStoryRemoval (yêu cầu gỡ). */
  openItemType: string | null;
  /** Pending hoặc Claimed. */
  openItemStatus: string | null;
}

export interface CreatorPublicationResult { storyId: number; versionId: number; itemId: number | null; status: string; revisionToken: string }

export interface CreatorVersion {
  versionId: number;
  storyId: number;
  versionNo: number;
  baseVersionId: number | null;
  restoredFromVersionId: number | null;
  editorUserId: number;
  title: string;
  content: string;
  origin: 'Write' | 'Import' | 'Restore' | string;
  sourceDeclaration: string;
  rightsDeclaration: string;
  importFileName: string | null;
  importSourceHash: string | null;
  audienceRevision: number;
  createdAt: string;
}

export interface ContentSaved { story: CreatorDraft; version: CreatorVersion }

export interface ImportPreview {
  previewToken: string;
  storyId: number;
  content: string;
  inputMethod: 'paste' | 'txt' | 'docx' | string;
  fileName: string | null;
  sourceHash: string;
  expiresAt: string;
}

export interface CreateDraftInput { title: string; description: string; ageBand: CreatorAgeBand; genre: string; experienceMode: ExperienceMode; language?: 'vi' | 'en' }

export interface SaveVersionInput { title: string; content: string; sourceDeclaration: string; rightsDeclaration: string }

/** Kết quả một lệnh gọi: `status` 0 = không kết nối được (server có thể đã ghi — thử lại với cùng operationId). */
export interface CreatorResult<T> { ok: boolean; status: number; message: string; data: T | null }
