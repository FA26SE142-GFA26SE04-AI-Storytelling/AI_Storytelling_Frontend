import { LoginRequest, RegisterRequest, VerifyEmailRequest, AuthResponseData, ApiResponse, UserProfile } from '../types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5259/api/v1';

export const TOKEN_STORAGE_KEY = 'magictales_access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'magictales_refresh_token';
export const USER_STORAGE_KEY = 'magictales_user_profile';

export const authService = {
  /**
   * Đăng nhập người dùng bằng email hoặc username
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponseData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data: ApiResponse<AuthResponseData> = await response.json();

      if (response.ok && data.success && data.data) {
        this.setStoredAuth(data.data);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ Backend (http://localhost:5259). Vui lòng kiểm tra lại dịch vụ backend.',
        data: null,
        errors: [(error as Error).message || 'Network connection failed'],
      };
    }
  },

  /**
   * Đăng ký tài khoản người dùng mới (/Auth/register)
   */
  async register(registerData: RegisterRequest): Promise<ApiResponse<object | null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data: ApiResponse<object | null> = await response.json();
      return data;
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ Backend (http://localhost:5259). Vui lòng kiểm tra lại kết nối.',
        data: null,
        errors: [(error as Error).message || 'Network connection failed'],
      };
    }
  },

  /**
   * Xác thực email bằng token nhận được từ email (/Auth/verify-email)
   */
  async verifyEmail(verifyData: VerifyEmailRequest): Promise<ApiResponse<object | null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verifyData),
      });

      const data: ApiResponse<object | null> = await response.json();
      return data;
    } catch (error) {
      console.error('Verify email error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ Backend (http://localhost:5259). Vui lòng kiểm tra lại kết nối.',
        data: null,
        errors: [(error as Error).message || 'Network connection failed'],
      };
    }
  },

  /**
   * Lấy thông tin hồ sơ tài khoản hiện tại từ Backend (/Auth/me)
   */
  async getProfile(token?: string): Promise<ApiResponse<UserProfile>> {
    const accessToken = token || this.getStoredAccessToken();
    if (!accessToken) {
      return {
        success: false,
        message: 'Bạn chưa đăng nhập hoặc token đã hết hạn.',
        data: null,
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data: ApiResponse<UserProfile> = await response.json();
      if (response.ok && data.success && data.data) {
        this.setStoredUser(data.data);
      }
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: 'Không thể tải thông tin cá nhân từ Backend.',
        data: null,
        errors: [(error as Error).message],
      };
    }
  },

  /**
   * Đăng xuất khỏi hệ thống
   */
  async logout(): Promise<ApiResponse<object | null>> {
    const refreshToken = this.getStoredRefreshToken();
    const accessToken = this.getStoredAccessToken();

    try {
      if (refreshToken && accessToken) {
        await fetch(`${API_BASE_URL}/Auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.warn('Logout API warning:', error);
    } finally {
      this.clearStoredAuth();
    }

    return {
      success: true,
      message: 'Đã đăng xuất thành công.',
      data: null,
    };
  },

  /**
   * Kiểm tra kết nối tới Backend API server
   */
  async checkBackendHealth(): Promise<{ isOnline: boolean; message: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Thử ping qua route root hoặc swagger/swagger.json
      const response = await fetch('http://localhost:5259/swagger/v1/swagger.json', {
        method: 'GET',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        return { isOnline: true, message: 'Backend Swagger v1 Online (http://localhost:5259)' };
      }

      // Secondary check: OPTIONS call to auth login
      const optionsResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'OPTIONS',
      }).catch(() => null);

      if (optionsResponse) {
        return { isOnline: true, message: 'Backend API Service Reachable' };
      }

      return { isOnline: false, message: 'Backend chưa chạy tại http://localhost:5259' };
    } catch {
      return { isOnline: false, message: 'Không kết nối được tới Backend (Offline)' };
    }
  },

  // Helpers quản lý LocalStorage
  getStoredAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  getStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  },

  getStoredUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setStoredAuth(data: AuthResponseData) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
  },

  setStoredUser(user: UserProfile) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },

  clearStoredAuth() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  },
};
