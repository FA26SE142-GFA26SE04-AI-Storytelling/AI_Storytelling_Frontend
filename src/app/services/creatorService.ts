import type { PagedResult } from '@/app/types/story';
import type {
  ContentSaved, CreateDraftInput, CreatorDraft, CreatorResult, CreatorVersion, ImportPreview, SaveVersionInput,
} from '@/app/types/creator';
import { API_BASE_URL } from './apiConfig';
import { authService } from './authService';

/**
 * Luồng 5 Bước 5.8 — Content Creator soạn truyện thủ công (`/creator/stories`).
 * Mỗi lệnh ghi có `operationId` riêng: khi mất mạng / timeout, thử lại với **cùng** operationId và payload (server có thể đã ghi).
 * Backend chưa có gửi duyệt, rút, gỡ, xuất bản hay xoá truyện Creator.
 */
async function send<T>(path: string, fallback: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<CreatorResult<T>> {
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
    return { ok, status: res.status, message: res.status === 413 ? 'Tệp hoặc nội dung quá lớn.' : message, data: (parsed?.data ?? null) as T | null };
  } catch {
    return { ok: false, status: 0, message: 'Không kết nối được máy chủ. Nội dung đang sửa vẫn còn; bấm thử lại.', data: null };
  }
}

const base = (id: number) => `/creator/stories/${id}`;

export const creatorService = {
  list: (pageIndex = 1, pageSize = 50): Promise<CreatorResult<PagedResult<CreatorDraft>>> =>
    send(`/creator/stories?pageIndex=${pageIndex}&pageSize=${pageSize}`, 'Không tải được danh sách truyện.'),

  get: (storyId: number): Promise<CreatorResult<CreatorDraft>> => send(base(storyId), 'Không mở được truyện.'),

  create: (operationId: string, input: CreateDraftInput): Promise<CreatorResult<CreatorDraft>> =>
    send('/creator/stories/manual', 'Không tạo được truyện.', { method: 'POST', body: { operationId, language: 'vi', ...input } }),

  /** Lưu một phiên bản mới (V+1). Không trim nội dung để giữ nguyên xuống dòng. */
  save: (storyId: number, operationId: string, revisionToken: string, baseVersionId: number | null, input: SaveVersionInput): Promise<CreatorResult<ContentSaved>> =>
    send(`${base(storyId)}/manual/versions`, 'Không lưu được phiên bản.', { method: 'POST', body: { operationId, revisionToken, baseVersionId, ...input } }),

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

export const newOperationId = (kind: string) => `${kind}-${crypto.randomUUID()}`;
