import type { PagedResult } from '@/app/types/story';
import type {
  ContentSaved, CreateDraftInput, CreatorDraft, CreatorPublication, CreatorPublicationResult, CreatorResult, CreatorVersion, ImportPreview, SaveVersionInput,
} from '@/app/types/creator';
import type { AssistanceReference } from '@/app/types/assistance';
import { API_BASE_URL } from './apiConfig';
import { authService } from './authService';

/**
 * Luồng 5 Bước 5.8 — Content Creator soạn truyện thủ công (`/creator/stories`).
 * Mỗi lệnh ghi có `operationId` riêng: khi mất mạng / timeout, thử lại với **cùng** operationId và payload (server có thể đã ghi).
 * Phát hành: gửi duyệt / rút (`/PublicStorySubmission`), xem trạng thái, xin gỡ, tạo bản sửa (`/creator/stories/{id}/publication|removal-requests|revisions`).
 * Backend chưa có xoá truyện Creator.
 */

/** Mã lỗi backend trả trong `message` → câu cho người dùng. */
const CODE_TEXT: Record<string, string> = {
  CREATOR_PUBLICATION_LOCKED: 'Phiên bản này đã gửi duyệt nên không sửa được. Hãy tạo bản sửa mới.',
  SUBMITTED_VERSION_IMMUTABLE_CREATE_REVISION: 'Phiên bản đã gửi duyệt không sửa được. Hãy tạo bản sửa mới.',
  OPEN_MODERATION_REQUEST: 'Truyện đang có yêu cầu duyệt hoặc gỡ chưa xong.',
  MODERATOR_REMOVAL_REQUIRED: 'Truyện đang công khai. Cần Moderator đồng ý gỡ trước khi tạo bản sửa.',
  REVISION_NOT_REQUIRED: 'Phiên bản hiện tại vẫn sửa được, chưa cần tạo bản sửa.',
  STALE_STORY_VERSION: 'Truyện vừa thay đổi. Tải lại rồi thử lại.',
  STORY_NOT_PUBLISHED: 'Truyện chưa công khai nên không cần xin gỡ.',
  PUBLISHED_VERSION_REQUIRED: 'Phiên bản hiện tại chưa phải bản đã duyệt.',
  CURRENT_UNPUBLISHED_VERSION_REQUIRED: 'Chỉ gửi duyệt được phiên bản mới nhất của truyện chưa công khai.',
  GENERATION_JOB_ACTIVE: 'Truyện đang được AI xử lý, chờ xong rồi gửi duyệt.',
  REMOVAL_REQUEST_PENDING: 'Truyện đang có yêu cầu gỡ chưa xong.',
};
export async function send<T>(path: string, fallback: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<CreatorResult<T>> {
  try {
    const res = await authService.authenticatedFetch(`${API_BASE_URL}${path}`, {
      method: init.method ?? 'GET',
      body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
    });
    const text = await res.text();
    let parsed: { success?: boolean; message?: string; data?: T; errors?: string[] | null } | null = null;
    try { parsed = text.trim() ? JSON.parse(text) : null; } catch { parsed = null; }
    const ok = res.ok && parsed?.success !== false;
    const message = parsed?.errors?.length ? `${parsed.message ?? fallback} ${parsed.errors.join(' ')}`.trim() : parsed?.message || (ok ? '' : fallback);
    const code = parsed?.errors?.[0] ?? (/^[A-Z][A-Z0-9_:]+$/.test((parsed?.message ?? '').trim()) ? parsed!.message!.trim() : undefined);
    return { ok, status: res.status, code, message: res.status === 413 ? 'Tệp hoặc nội dung quá lớn.' : CODE_TEXT[message.trim()] ?? message, data: (parsed?.data ?? null) as T | null };
  } catch {
    return { ok: false, status: 0, message: 'Không kết nối được máy chủ. Nội dung đang sửa vẫn còn; bấm thử lại.', data: null };
  }
}

/**
 * Phần soạn dùng chung giữa Content Creator (`/creator/stories`) và phụ huynh (`/parent/stories`):
 * lưu phiên bản, lịch sử, khôi phục, nhập văn bản / tệp. Backend dùng chung một engine cho hai đường dẫn.
 */
export function authoringApi(root: '/creator/stories' | '/parent/stories') {
  const base = (id: number) => `${root}/${id}`;
  return {
  /** Lưu một phiên bản mới (V+1). Không trim nội dung để giữ nguyên xuống dòng. */
  save: (storyId: number, operationId: string, revisionToken: string, baseVersionId: number | null, input: SaveVersionInput,
    assistanceReferences: AssistanceReference[] = []): Promise<CreatorResult<ContentSaved>> =>
    send(`${base(storyId)}/manual/versions`, 'Không lưu được phiên bản.', {
      method: 'POST', body: { operationId, revisionToken, baseVersionId, ...input, ...(assistanceReferences.length ? { assistanceReferences } : {}) },
    }),

  versions: (storyId: number): Promise<CreatorResult<CreatorVersion[]>> => send(`${base(storyId)}/content/versions`, 'Không tải được lịch sử phiên bản.'),

  version: (storyId: number, versionId: number): Promise<CreatorResult<CreatorVersion>> =>
    send(`${base(storyId)}/content/versions/${versionId}`, 'Không tải được phiên bản.'),

  /** Khôi phục: tạo phiên bản mới chép nội dung từ `sourceVersionId`. */
  restore: (storyId: number, operationId: string, revisionToken: string, baseVersionId: number | null, sourceVersionId: number): Promise<CreatorResult<ContentSaved>> =>
    send(`${base(storyId)}/content/restore`, 'Không khôi phục được phiên bản.', { method: 'POST', body: { operationId, revisionToken, baseVersionId, sourceVersionId } }),

  /** Xem trước nội dung nhập (không tạo phiên bản). */
  previewText: (storyId: number, operationId: string, revisionToken: string, content: string): Promise<CreatorResult<ImportPreview>> =>
    send(`${base(storyId)}/imports/preview`, 'Không xem trước được nội dung.', { method: 'POST', body: { operationId, revisionToken, content } }),

  previewFile: (storyId: number, operationId: string, revisionToken: string, file: File): Promise<CreatorResult<ImportPreview>> => {
    const form = new FormData();
    form.append('File', file);
    form.append('RevisionToken', revisionToken);
    form.append('OperationId', operationId);
    return send(`${base(storyId)}/imports/preview-file`, 'Không đọc được tệp.', { method: 'POST', form });
  },

  /** Xác nhận nhập: gửi đúng `content` và `previewToken` của bản xem trước, cùng revision / base đã chụp lúc xem trước. */
  confirmImport: (storyId: number, operationId: string, revisionToken: string, baseVersionId: number | null, preview: ImportPreview, input: Omit<SaveVersionInput, 'content'>): Promise<CreatorResult<ContentSaved>> =>
    send(`${base(storyId)}/imports/confirm`, 'Không nhập được nội dung.', {
      method: 'POST',
      body: { operationId, revisionToken, baseVersionId, previewToken: preview.previewToken, content: preview.content, ...input },
    }),
  };
}

/** Bộ API mà trình soạn cần: phần dùng chung + cách lấy bản nháp (khác nhau giữa Creator và phụ huynh). */
export type AuthoringApi = ReturnType<typeof authoringApi> & { get: (storyId: number) => Promise<CreatorResult<CreatorDraft>> };

const base = (id: number) => `/creator/stories/${id}`;

export const creatorService = {
  ...authoringApi('/creator/stories'),

  list: (pageIndex = 1, pageSize = 50): Promise<CreatorResult<PagedResult<CreatorDraft>>> =>
    send(`/creator/stories?pageIndex=${pageIndex}&pageSize=${pageSize}`, 'Không tải được danh sách truyện.'),

  get: (storyId: number): Promise<CreatorResult<CreatorDraft>> => send(base(storyId), 'Không mở được truyện.'),

  create: (operationId: string, input: CreateDraftInput): Promise<CreatorResult<CreatorDraft>> =>
    send('/creator/stories/manual', 'Không tạo được truyện.', { method: 'POST', body: { operationId, language: 'vi', ...input } }),

  // ---------- Phát hành lên Thư viện chung ----------
  /** Trạng thái phát hành của phiên bản hiện tại và mục duyệt / gỡ đang mở (nếu có). */
  publication: (storyId: number): Promise<CreatorResult<CreatorPublication>> => send(`${base(storyId)}/publication`, 'Không tải được trạng thái phát hành.'),

  /** Gửi phiên bản hiện tại cho Moderator duyệt. Từ lúc này phiên bản bị khoá; muốn sửa phải tạo bản sửa mới. */
  submit: (storyId: number, storyVersionId: number): Promise<CreatorResult<{ itemId: number; status: string; isResubmission: boolean }>> =>
    send('/PublicStorySubmission/submit', 'Chưa gửi duyệt được.', { method: 'POST', body: { storyId, storyVersionId } }),

  /** Rút yêu cầu duyệt khi chưa Moderator nào nhận. */
  withdraw: (itemId: number): Promise<CreatorResult<unknown>> =>
    send(`/PublicStorySubmission/${itemId}/withdraw`, 'Chưa rút được yêu cầu.', { method: 'POST' }),

  /** Xin gỡ truyện đang công khai; Moderator quyết định. Lý do 1–2000 ký tự. */
  requestRemoval: (storyId: number, reason: string): Promise<CreatorResult<CreatorPublicationResult>> =>
    send(`${base(storyId)}/removal-requests`, 'Chưa gửi được yêu cầu gỡ.', { method: 'POST', body: { reason } }),

  /** Tạo bản sửa mới từ phiên bản hiện tại (sau khi rút, bị trả về, bị từ chối hoặc đã được gỡ). */
  createRevision: (storyId: number, sourceVersionId: number): Promise<CreatorResult<CreatorPublicationResult>> =>
    send(`${base(storyId)}/revisions`, 'Chưa tạo được bản sửa.', { method: 'POST', body: { sourceVersionId } }),
};

export const newOperationId = (kind: string) => `${kind}-${crypto.randomUUID()}`;
