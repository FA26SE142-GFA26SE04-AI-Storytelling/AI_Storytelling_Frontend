import { USE_MOCK } from '@/app/mocks/config';
import { childAccessMockOverrides } from '@/app/mocks/mockSupervision';
import type { ApiResponse } from '@/app/types/auth';
import type { ChildAccessCredential, ChildSession, ChildSessionProfile, EasyLoginCode } from '@/app/types/supervision';
import { apiRequest } from './apiClient';
import { authService } from './authService';

const SESSION_KEY = 'taletale-child-session';

export type StoredChildSession = { childProfileId: number; accessToken: string; expiresAt: number; via: 'profile_switcher' | 'easy_login' };

/** Luồng 1 Bước 1.10, Luồng 3 Bước 3.0: thông tin truy cập của bé, Easy Login, phiên của bé, Parental Gate. */
export const childAccessService = {
  getCredential(childId: number): Promise<ApiResponse<ChildAccessCredential>> {
    return apiRequest(`/ChildAccessCredential/${childId}`, 'Chưa thiết lập truy cập cho bé.');
  },

  /** Đặt avatar và mã PIN 4 số cho bé. */
  setCredential(childId: number, avatarId: string, pin: string): Promise<ApiResponse<null>> {
    return apiRequest(`/ChildAccessCredential/${childId}`, 'Không lưu được thông tin truy cập.', { method: 'PUT', body: { avatarId, pin } });
  },

  revokeCredential(childId: number): Promise<ApiResponse<null>> {
    return apiRequest(`/ChildAccessCredential/${childId}`, 'Không thu hồi được.', { method: 'DELETE' });
  },

  /** Tạo mã Easy Login mới; mã cũ mất hiệu lực ngay. */
  generateEasyLogin(childId: number): Promise<ApiResponse<EasyLoginCode>> {
    return apiRequest(`/ChildAccessCredential/${childId}/easylogin`, 'Không tạo được mã đăng nhập.', { method: 'POST' });
  },

  /** "Cho bé đọc" — mở phiên riêng của bé, tách khỏi phiên phụ huynh. */
  startSupervisedSession(childId: number): Promise<ApiResponse<ChildSession>> {
    const supervisorRefreshToken = authService.getStoredRefreshToken() ?? '';
    return apiRequest(`/ChildAccessCredential/${childId}/handover`, 'Bé chưa vào đọc được lúc này.', { method: 'POST', body: { supervisorRefreshToken } });
  },

  loginWithEasyLogin(code: string): Promise<ApiResponse<ChildSession>> {
    return apiRequest('/ChildAccessCredential/easylogin/login', 'Mã không đúng hoặc đã hết hạn. Hãy nhờ bố mẹ tạo mã mới nhé!', { method: 'POST', body: { code }, anonymous: true });
  },

  getSessionProfile(childToken: string): Promise<ApiResponse<ChildSessionProfile>> {
    return apiRequest('/ChildAccessCredential/me', 'Phiên của bé đã hết hạn.', { token: childToken });
  },

  /** Parental Gate — nhập lại email + mật khẩu người lớn trước khi rời phiên của bé. */
  verifyParentalGate(email: string, password: string): Promise<ApiResponse<null>> {
    return apiRequest('/ParentalGate/verify', 'Mật khẩu chưa đúng.', { method: 'POST', body: { email, password }, anonymous: true });
  },

  saveSession(session: ChildSession, via: StoredChildSession['via']) {
    const stored: StoredChildSession = { childProfileId: session.childProfileId, accessToken: session.accessToken, expiresAt: Date.now() + session.expiresInSeconds * 1000, via };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored)); } catch { /* bỏ qua */ }
    return stored;
  },

  readSession(): StoredChildSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const s = raw ? (JSON.parse(raw) as StoredChildSession) : null;
      return s && s.expiresAt > Date.now() ? s : null;
    } catch { return null; }
  },

  clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* bỏ qua */ }
  },
};

if (USE_MOCK) Object.assign(childAccessService, childAccessMockOverrides);
