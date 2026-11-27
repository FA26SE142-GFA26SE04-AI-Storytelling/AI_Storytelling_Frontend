import type { PagedResult } from '@/app/types/story';
import { apiQuery, apiRequest } from './apiClient';

/** Luồng 5 (M5) — Administrator duyệt đơn đăng ký và quản lý tài khoản Content Creator. */

export type CreatorApplicationStatus = 'Pending' | 'Approved' | 'Rejected';
/** AccountStatus của Creator: Registered = chưa xác thực email, AwaitingApproval = chờ duyệt đơn. */
export type CreatorAccountStatus = 'Registered' | 'AwaitingApproval' | 'Active' | 'Suspended';

/** `CreatorApplicationDto` phía Admin (có `reviewedByName`). */
export type AdminCreatorApplication = {
  id: number;
  applicantUserId: number;
  applicantUsername: string;
  applicantFullName: string;
  applicantEmail: string;
  applicantStatus: string;
  introduction: string;
  portfolioUrl: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  rejectionReason: string | null;
};

export type CreatorAccount = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  status: string;
  /** Đơn đăng ký mới nhất: Pending | Approved | Rejected; null khi tài khoản không có đơn (seed, Admin cấp). */
  latestApplicationStatus?: string | null;
  publishedStoryCount: number;
  createdAt: string;
  lastLoginAt: string | null;
};

/** Trạng thái hiển thị của tài khoản: đơn bị từ chối vẫn giữ AwaitingApproval, tách riêng để Admin không nhầm là đang chờ duyệt. */
export const creatorAccountDisplayStatus = (c: Pick<CreatorAccount, "status" | "latestApplicationStatus">) =>
  c.status === "AwaitingApproval" && c.latestApplicationStatus === "Rejected" ? "AwaitingResubmit" : c.status;

export type DeactivateCreatorResult = { creator: CreatorAccount; withdrawnSubmissions: number; closedSubmissions: number };

const APPS = '/admin/creator-applications';
const CREATORS = '/admin/creators';

export const adminCreatorService = {
  applications: (q: { status?: CreatorApplicationStatus; pageIndex?: number; pageSize?: number } = {}) =>
    apiRequest<PagedResult<AdminCreatorApplication>>(`${APPS}${apiQuery(q)}`, 'Không tải được danh sách đơn đăng ký.'),
  application: (id: number) => apiRequest<AdminCreatorApplication>(`${APPS}/${id}`, 'Không tải được đơn đăng ký.'),
  approve: (id: number) => apiRequest<AdminCreatorApplication>(`${APPS}/${id}/approve`, 'Không duyệt được đơn.', { method: 'POST' }),
  reject: (id: number, reason: string) =>
    apiRequest<AdminCreatorApplication>(`${APPS}/${id}/reject`, 'Không từ chối được đơn.', { method: 'POST', body: { reason } }),

  creators: (q: { status?: CreatorAccountStatus; search?: string; pageIndex?: number; pageSize?: number } = {}) =>
    apiRequest<PagedResult<CreatorAccount>>(`${CREATORS}${apiQuery(q)}`, 'Không tải được danh sách Content Creator.'),
  creator: (id: number) => apiRequest<CreatorAccount>(`${CREATORS}/${id}`, 'Không tải được thông tin Content Creator.'),
  deactivate: (id: number, reason: string) =>
    apiRequest<DeactivateCreatorResult>(`${CREATORS}/${id}/deactivate`, 'Không vô hiệu hoá được tài khoản.', { method: 'POST', body: { reason } }),
  reactivate: (id: number) => apiRequest<CreatorAccount>(`${CREATORS}/${id}/reactivate`, 'Không kích hoạt lại được tài khoản.', { method: 'POST' }),
};
