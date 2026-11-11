import type * as B from '@/app/types/backendContracts';
import type { ApiResponse } from '@/app/types/auth';
import { apiRequest } from './apiClient';
import { API_BASE_URL } from './apiConfig';
import { authService } from './authService';

/** Thành phần của gói cho một bé; tất cả false là gói chỉ đọc. */
export interface PackageComponents { vocabulary: boolean; quiz: boolean; listening: boolean; images: boolean; narration: boolean }
export type PackageStatus = 'PendingCheck' | 'Checking' | 'Generating' | 'Review' | 'Confirmed' | 'Failed' | 'Blocked' | 'Stale' | 'Cancelled';
export interface PackageCheck { passed: boolean; errors: string[]; safetyScore: number | null; evidence?: string[] | null; reasonCode?: string | null; violations?: string[] | null }
export interface ParentPackage {
  packageId: number; storyId: number; storyVersionId: number; childProfileId: number; revision: number;
  /** Đổi theo mỗi lần worker / thao tác cập nhật gói: luôn lấy bản mới nhất từ GET trước khi gửi lệnh. */
  packageToken: string; status: PackageStatus | string; components: PackageComponents; check: PackageCheck | null;
  lastErrorCode: string | null; confirmedAt: string | null;
  /** Khoá: check, vocabulary, quiz, listening, media. Giá trị: NotRequested, NotStarted, Pending, Processing, Completed, Failed, Cancelled. */
  componentStatus: Record<string, string>;
  vocabularyCount: number; quizCount: number; listeningCount: number;
}
export interface PackagePreviewMedia { assetId: number; previewUrl: string }
export interface PackagePreviewWord { id: number; term: string; definition: string | null; example: string | null }
/** Bản xem trước của phụ huynh có đáp án; không đưa sang màn của bé. `choices` có thể là mảng hoặc chuỗi JSON. */
export interface PackagePreviewQuiz { id: number; type: string; question: string; correctAnswer: string | null; choices: unknown; explanation: string | null }
export interface PackagePreviewListening { id: number; type: string; prompt: string | null; options: { id: number; text: string | null; isMatch: boolean }[] }
export interface ParentPackagePreview {
  package: ParentPackage; title: string; content: string;
  manifest: { vocabularyIds: number[]; quizIds: number[]; listeningIds: number[]; sceneIds: number[]; segmentIds: number[]; mediaAssetIds: number[] };
  /** Phần không yêu cầu có thể vắng hẳn trong response. */
  vocabulary?: PackagePreviewWord[]; quiz?: PackagePreviewQuiz[]; listening?: PackagePreviewListening[]; media?: PackagePreviewMedia[];
}
export interface FinalizeResult { storyId: number; storyVersionId: number; contentHash: string; isFinalized: boolean }
export interface PackageGrant { confirmationId: number; storyId: number; storyVersionId: number; childProfileId: number; preparationId: number | null; confirmedAt: string; parentStoryPackageId: number }

const root = (id: number) => `/parent/stories/${id}`;
const op = () => crypto.randomUUID();

/** Luồng 3b mới: một truyện tự viết, gói học liệu / media riêng cho từng bé, giao nhiều bé trong một lần. */
export const parentPackageService = {
  finalize: (id: number, cmd: B.CreatorVersionCommand) => apiRequest<FinalizeResult>(`${root(id)}/content/finalize`, 'Chưa chốt được nội dung.', { method: 'POST', body: cmd }),
  reopen: (id: number, cmd: B.CreatorVersionCommand) => apiRequest<FinalizeResult>(`${root(id)}/content/reopen`, 'Chưa mở lại được nội dung.', { method: 'POST', body: cmd }),
  create: (id: number, cmd: B.CreatorVersionCommand, recipients: { childProfileId: number; components: PackageComponents }[]) =>
    apiRequest<ParentPackage[]>(`${root(id)}/packages`, 'Chưa tạo được gói cho các bé.', { method: 'POST', body: { ...cmd, recipients } }),
  list: (id: number, signal?: AbortSignal) => apiRequest<ParentPackage[]>(`${root(id)}/packages`, 'Chưa tải được các gói.', { signal }),
  get: (id: number, packageId: number) => apiRequest<ParentPackage>(`${root(id)}/packages/${packageId}`, 'Chưa tải được gói.'),
  generate: (id: number, p: ParentPackage) => apiRequest<ParentPackage>(`${root(id)}/packages/${p.packageId}/generate`, 'Chưa bắt đầu tạo học liệu được.', { method: 'POST', body: { operationId: op(), packageToken: p.packageToken } }),
  /** `components` rỗng: thử lại các phần đang lỗi. */
  retry: (id: number, p: ParentPackage, components: string[] = []) => apiRequest<ParentPackage>(`${root(id)}/packages/${p.packageId}/retry`, 'Chưa thử lại được.', { method: 'POST', body: { operationId: op(), packageToken: p.packageToken, components } }),
  /** Tạo bản gói mới (revision) với cấu hình đầy đủ; gói cũ giữ nguyên để tra lại. */
  revise: (id: number, p: ParentPackage, components: PackageComponents, regenerate: string[] = []) => apiRequest<ParentPackage>(`${root(id)}/packages/${p.packageId}/revise`, 'Chưa tạo được bản gói mới.', { method: 'POST', body: { operationId: op(), packageToken: p.packageToken, components, regenerate } }),
  preview: (id: number, packageId: number) => apiRequest<ParentPackagePreview>(`${root(id)}/packages/${packageId}/preview`, 'Chưa xem trước được gói.'),
  confirm: (id: number, p: ParentPackage) => apiRequest<ParentPackage>(`${root(id)}/packages/${p.packageId}/confirm`, 'Chưa chốt được gói.', { method: 'POST', body: { operationId: op(), packageToken: p.packageToken } }),
  /** Giao cùng lúc: một gói lỗi thì không bé nào được giao (Backend rollback cả lô). */
  deliver: (id: number, packages: ParentPackage[]) => apiRequest<PackageGrant[]>(`${root(id)}/family-confirmations/batch`, 'Chưa giao được truyện.', { method: 'POST', body: { operationId: op(), packages: packages.map((p) => ({ packageId: p.packageId, packageToken: p.packageToken })) } }),
  /** Ảnh / âm thanh xem trước cần Bearer token: tải về thành blob rồi tạo object URL (nhớ revoke khi bỏ). */
  mediaBlob: (previewUrl: string, signal?: AbortSignal) => blobOf(previewUrl, signal),
  /**
   * GET /parent/stories/{id}/packages/{packageId}/assets/{assetId} (role User, Bearer): trả thẳng tệp (stream, có Range),
   * chỉ cho tài sản nằm trong manifest của gói. Thẻ img/audio không gửi được token nên tải về thành blob URL (nhớ revoke).
   */
  asset: (id: number, packageId: number, assetId: number, signal?: AbortSignal) => blobOf(`/api/v1${root(id)}/packages/${packageId}/assets/${assetId}`, signal),
};

async function blobOf(path: string, signal?: AbortSignal): Promise<ApiResponse<{ url: string; type: string }>> {
  try {
    const origin = new URL(API_BASE_URL).origin;
    const res = await authService.authenticatedFetch(new URL(path, origin).toString(), { signal, cache: 'no-store' });
    if (!res.ok) return { success: false, status: res.status, message: 'Chưa tải được tệp xem trước.', data: null };
    const blob = await res.blob();
    return { success: true, message: '', data: { url: URL.createObjectURL(blob), type: blob.type } };
  } catch { return { success: false, status: 0, message: 'Chưa tải được tệp xem trước.', data: null }; }
}
