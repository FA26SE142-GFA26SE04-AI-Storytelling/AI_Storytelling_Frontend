import type { ApiResponse, ChangePasswordRequest, DeleteAccountPreview, UpdateProfileRequest, UserProfile } from '@/app/types/auth';
import type { LoginSession } from '@/app/types/supervision';
import { apiRequest } from './apiClient';
import { authService } from './authService';

/** Luồng 1 Bước 1.1, 1.1b: xác thực email, thông tin cá nhân, đổi email, đổi mật khẩu, phiên đăng nhập, xoá tài khoản. */
export const accountService = {
  verifyEmail(email: string, otp: string): Promise<ApiResponse<null>> {
    return apiRequest('/Auth/verify-email', 'Mã xác thực không đúng hoặc đã hết hạn.', { method: 'POST', body: { email, otp }, anonymous: true });
  },

  /** Luồng 5 Bước 5.1b — người được mời làm Moderator đặt mật khẩu bằng mã mời trong email. */
  activateStaff(data: { email: string; inviteToken: string; newPassword: string; confirmPassword: string; commitmentAccepted: boolean }): Promise<ApiResponse<null>> {
    return apiRequest('/Auth/staff-activation', 'Mã mời không đúng hoặc đã hết hạn.', { method: 'POST', body: data, anonymous: true });
  },

  resendVerificationEmail(email: string): Promise<ApiResponse<null>> {
    return apiRequest('/Auth/resend-verification-email', 'Không gửi lại được mã xác thực.', { method: 'POST', body: { email }, anonymous: true });
  },

  /** Thành công thì backend thu hồi mọi phiên khác, giữ phiên đang dùng. */
  changePassword(data: ChangePasswordRequest): Promise<ApiResponse<null>> {
    const currentRefreshToken = authService.getStoredRefreshToken();
    return apiRequest('/Auth/change-password', 'Không đổi được mật khẩu.', { method: 'POST', body: { ...data, currentRefreshToken } });
  },

  updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    return apiRequest('/Auth/me', 'Không lưu được thông tin.', { method: 'PUT', body: { fullName: data.fullName.trim(), avatarUrl: data.avatarUrl?.trim() || null } });
  },

  /** Bước 1.1b — gửi OTP tới email mới; email chỉ đổi sau khi xác nhận OTP. */
  requestEmailChange(currentPassword: string, newEmail: string): Promise<ApiResponse<null>> {
    return apiRequest('/Auth/change-email', 'Không gửi được mã xác thực tới email mới.', { method: 'POST', body: { currentPassword, newEmail: newEmail.trim() } });
  },

  confirmEmailChange(otp: string): Promise<ApiResponse<null>> {
    return apiRequest('/Auth/change-email/confirm', 'Mã xác thực không đúng hoặc đã hết hạn.', { method: 'POST', body: { otp: otp.trim() } });
  },

  getDeleteAccountPreview(): Promise<ApiResponse<DeleteAccountPreview>> {
    return apiRequest('/Auth/me/delete-preview', 'Không kiểm tra được tài khoản.');
  },

  deleteAccount(currentPassword: string, deleteDraftProfiles: boolean): Promise<ApiResponse<null>> {
    return apiRequest('/Auth/me', 'Không xoá được tài khoản.', { method: 'DELETE', body: { currentPassword, deleteDraftProfiles } });
  },

  listSessions(): Promise<ApiResponse<LoginSession[]>> {
    return apiRequest('/Auth/sessions', 'Không tải được danh sách phiên đăng nhập.');
  },

  revokeSession(sessionId: number): Promise<ApiResponse<null>> {
    return apiRequest(`/Auth/sessions/${sessionId}`, 'Không đăng xuất được phiên này.', { method: 'DELETE' });
  },

  logoutAllDevices(): Promise<ApiResponse<null>> {
    return apiRequest('/Auth/logout-all-devices', 'Không đăng xuất được khỏi mọi thiết bị.', { method: 'POST' });
  },
};
