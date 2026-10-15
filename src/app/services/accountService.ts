import { USE_MOCK } from '@/app/mocks/config';
import { accountMockOverrides } from '@/app/mocks/mockSupervision';
import type { ApiResponse, ChangePasswordRequest } from '@/app/types/auth';
import type { LoginSession } from '@/app/types/supervision';
import { apiRequest } from './apiClient';

/** Luồng 1 Bước 1.1, 1.1b: xác thực email, đổi mật khẩu, quản lý phiên đăng nhập. */
export const accountService = {
  verifyEmail(email: string, token: string): Promise<ApiResponse<null>> {
    return apiRequest('/Auth/verify-email', 'Mã xác thực không đúng hoặc đã hết hạn.', { method: 'POST', body: { email, token }, anonymous: true });
  },

  resendVerificationEmail(email: string): Promise<ApiResponse<null>> {
    return apiRequest('/Auth/resend-verification-email', 'Không gửi lại được mã xác thực.', { method: 'POST', body: { email }, anonymous: true });
  },

  /** Thành công thì backend thu hồi mọi phiên khác, giữ phiên đang dùng. */
  changePassword(data: ChangePasswordRequest): Promise<ApiResponse<null>> {
    return apiRequest('/Auth/change-password', 'Không đổi được mật khẩu.', { method: 'POST', body: data });
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

if (USE_MOCK) Object.assign(accountService, accountMockOverrides);
