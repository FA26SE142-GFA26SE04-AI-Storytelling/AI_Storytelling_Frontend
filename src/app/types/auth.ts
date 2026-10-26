export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  role: string;
  status: string;
}

export interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserProfile;
  /** Tài khoản vận hành đã bật TOTP: cần nhập mã trước khi có token (Luồng 5 Bước 5.1). */
  mfaRequired?: boolean;
  /** Lần đăng nhập đầu: phải thiết lập TOTP bằng mã QR. */
  mfaSetupRequired?: boolean;
  mfaChallengeToken?: string | null;
  mfaProvisioningUri?: string | null;
}

/** Vai trò vận hành (Luồng 5) — tách khỏi Parent. */
export const STAFF_ROLES = ['Administrator', 'Moderator', 'ContentCreator'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export const isStaffRole = (role?: string | null): role is StaffRole => !!role && (STAFF_ROLES as readonly string[]).includes(role);

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[] | null;
  /** Mã HTTP do `apiRequest` gắn thêm (0 = lỗi mạng). Không có trong body backend trả về. */
  status?: number;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  role?: number;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  /** Giữ lại phiên đang dùng; backend thu hồi mọi phiên khác. */
  currentRefreshToken?: string | null;
}

/** Luồng 1 Bước 1.1b — sửa họ tên, ảnh đại diện. */
export interface UpdateProfileRequest {
  fullName: string;
  avatarUrl?: string | null;
}

export interface OwnedChildProfileSummary {
  id: number;
  nickname: string;
  status: string;
}

/** Trước khi xoá tài khoản: hồ sơ bé đang chặn việc xoá và hồ sơ nháp sẽ bị xoá cùng. */
export interface DeleteAccountPreview {
  blockingProfiles: OwnedChildProfileSummary[];
  draftProfiles: OwnedChildProfileSummary[];
  canDelete: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

/** Một dòng nhật ký hoạt động (`/Auth/me/audit-log`, `/ChildProfile/{id}/audit-log`). */
export interface AuditLogEntry { id: number; actorUserId: number | null; action: string; entityType: string; entityId: number; occurredAt: string }

/** Gói dịch vụ đang bán (`/Payment/plans`). */
export interface SubscriptionPlan { id: number; name: string; priceVnd: number; quotaAmount: number }
