import { LoginRequest, RegisterRequest, VerifyEmailRequest, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest, AuthResponseData, ApiResponse, UserProfile } from '../types/auth';
import { API_BASE_URL } from './apiConfig';

/**
 * Trợ giúp phân tích JSON an toàn tránh lỗi 'Unexpected end of JSON input'
 */
async function safeJsonParse<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export const TOKEN_STORAGE_KEY = 'magictales_access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'magictales_refresh_token';
export const USER_STORAGE_KEY = 'magictales_user_profile';

type AuthStateListener = (user: UserProfile | null, token: string | null) => void;
const authListeners: Set<AuthStateListener> = new Set();
let refreshPromise: Promise<ApiResponse<AuthResponseData>> | null = null;

export const authService = {
  /**
   * Đăng ký lắng nghe thay đổi trạng thái xác thực (khi token được làm mới hoặc khi hết hạn bị đăng xuất)
   */
  onAuthStateChange(listener: AuthStateListener): () => void {
    authListeners.add(listener);
    return () => {
      authListeners.delete(listener);
    };
  },

  /**
   * Thông báo trạng thái xác thực mới đến tất cả listeners
   */
  notifyAuthStateChange(user: UserProfile | null, token: string | null) {
    authListeners.forEach((listener) => {
      try {
        listener(user, token);
      } catch (e) {
        console.error('Error in auth state listener:', e);
      }
    });
  },

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

      const data = await safeJsonParse<ApiResponse<AuthResponseData>>(response);

      if (response.ok && data?.success && data.data) {
        this.setStoredAuth(data.data);
        this.notifyAuthStateChange(data.data.user, data.data.accessToken);
        return data;
      } else {
        // Đăng nhập thất bại -> xóa sạch auth lưu trữ và out tài khoản
        this.clearStoredAuth();
        this.notifyAuthStateChange(null, null);
        return data || {
          success: false,
          message: 'Tài khoản hoặc mật khẩu không chính xác.',
          data: null,
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      // Gặp lỗi kết nối / ngoại lệ -> xóa sạch auth lưu trữ và out tài khoản
      this.clearStoredAuth();
      this.notifyAuthStateChange(null, null);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại dịch vụ backend.',
        data: null,
        errors: [(error as Error).message || 'Network connection failed'],
      };
    }
  },

  /**
   * Làm mới Access Token bằng Refresh Token (/Auth/refresh-token)
   * Sử dụng Token Rotation: Nếu refresh token hết hạn hoặc không hợp lệ -> tự động clear auth và out tài khoản.
   * Sử dụng Promise deduplication để tránh gọi refresh nhiều lần đồng thời.
   */
  async refreshToken(token?: string): Promise<ApiResponse<AuthResponseData>> {
    const refreshTokenValue = token || this.getStoredRefreshToken();
    if (!refreshTokenValue) {
      this.clearStoredAuth();
      this.notifyAuthStateChange(null, null);
      return {
        success: false,
        message: 'Không tìm thấy refresh token. Vui lòng đăng nhập lại.',
        data: null,
      };
    }

    // Nếu đang có một tiến trình refresh chạy, tái sử dụng promise đó
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/Auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: refreshTokenValue }),
        });

        const data = await safeJsonParse<ApiResponse<AuthResponseData>>(response);

        if (response.ok && data?.success && data.data) {
          // Ghi đè cả access token và refresh token mới vào storage (Token Rotation)
          this.setStoredAuth(data.data);
          this.notifyAuthStateChange(data.data.user, data.data.accessToken);
          return data;
        } else {
          // Refresh token đã hết hạn hoặc bị thu hồi -> Tự động out tài khoản
          console.warn('Refresh token expired or invalid, logging out...', data?.message);
          this.clearStoredAuth();
          this.notifyAuthStateChange(null, null);
          return {
            success: false,
            message: data?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            data: null,
            errors: data?.errors,
          };
        }
      } catch (error) {
        console.error('Refresh token request error:', error);
        // Lỗi kết nối hoặc lỗi bất thường
        return {
          success: false,
          message: 'Không thể kết nối đến máy chủ để làm mới phiên đăng nhập.',
          data: null,
          errors: [(error as Error).message || 'Network connection failed'],
        };
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  /**
   * Helper fetch có đính kèm Bearer token và tự động xử lý refresh token khi gặp HTTP 401.
   * Nếu refresh token cũng hết hạn -> tự động xóa token và đăng xuất (out tài khoản).
   */
  async authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}, customToken?: string): Promise<Response> {
    let token = customToken || this.getStoredAccessToken();

    const headers = new Headers(init.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
      ...init,
      headers,
    };

    let response = await fetch(input, config);

    // Nếu gặp 401 (Access Token hết hạn hoặc không hợp lệ), thử dùng Refresh Token
    if (response.status === 401) {
      const storedRefreshToken = this.getStoredRefreshToken();
      if (storedRefreshToken) {
        const refreshResult = await this.refreshToken();
        if (refreshResult.success && refreshResult.data?.accessToken) {
          // Thử lại request ban đầu với accessToken mới
          const newHeaders = new Headers(init.headers || {});
          newHeaders.set('Authorization', `Bearer ${refreshResult.data.accessToken}`);
          if (!newHeaders.has('Content-Type') && !(init.body instanceof FormData)) {
            newHeaders.set('Content-Type', 'application/json');
          }

          response = await fetch(input, {
            ...init,
            headers: newHeaders,
          });
        }
      } else {
        // Không có refresh token -> Đăng xuất
        this.clearStoredAuth();
        this.notifyAuthStateChange(null, null);
      }
    }

    return response;
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
        message: 'Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại kết nối.',
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
        message: 'Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại kết nối.',
        data: null,
        errors: [(error as Error).message || 'Network connection failed'],
      };
    }
  },

  /**
   * Yêu cầu đặt lại mật khẩu - gửi mã xác nhận qua email (/Auth/forgot-password)
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<object | null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<object | null> = await response.json();
      return result;
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ Backend. Vui lòng thử lại.',
        data: null,
        errors: [(error as Error).message || 'Network connection failed'],
      };
    }
  },

  /**
   * Đặt lại mật khẩu bằng mã nhận được từ email (/Auth/reset-password)
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<object | null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<object | null> = await response.json();
      return result;
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ Backend. Vui lòng thử lại.',
        data: null,
        errors: [(error as Error).message || 'Network connection failed'],
      };
    }
  },

  /**
   * Lấy thông tin hồ sơ tài khoản hiện tại từ Backend (/Auth/me)
   * Tự động làm mới token nếu Access Token hết hạn.
   */
  async getProfile(token?: string): Promise<ApiResponse<UserProfile>> {
    const accessToken = token || this.getStoredAccessToken();
    const refreshToken = this.getStoredRefreshToken();
    if (!accessToken && !refreshToken) {
      return {
        success: false,
        message: 'Bạn chưa đăng nhập hoặc token đã hết hạn.',
        data: null,
      };
    }

    try {
      const response = await this.authenticatedFetch(
        `${API_BASE_URL}/Auth/me`,
        { method: 'GET' },
        token
      );

      const data = await safeJsonParse<ApiResponse<UserProfile>>(response);
      if (response.ok && data?.success && data.data) {
        this.setStoredUser(data.data);
        return data;
      }
      return data || {
        success: false,
        message: 'Không thể tải thông tin cá nhân từ Backend.',
        data: null,
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: 'Không thể tải thông tin cá nhân từ Backend.',
        data: null,
        errors: [(error as Error).message || 'Network connection failed'],
      };
    }
  },

  /**
   * Đổi mật khẩu cho tài khoản đang đăng nhập (/Auth/change-password)
   * Tự động làm mới token nếu Access Token hết hạn.
   */
  async changePassword(data: ChangePasswordRequest, token?: string): Promise<ApiResponse<object | null>> {
    const accessToken = token || this.getStoredAccessToken();
    const refreshToken = this.getStoredRefreshToken();
    if (!accessToken && !refreshToken) {
      return {
        success: false,
        message: 'Bạn chưa đăng nhập hoặc token đã hết hạn.',
        data: null,
      };
    }

    try {
      const response = await this.authenticatedFetch(
        `${API_BASE_URL}/Auth/change-password`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        token
      );

      const result: ApiResponse<object | null> = await response.json();
      return result;
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ Backend. Vui lòng thử lại.',
        data: null,
        errors: [(error as Error).message || 'Network connection failed'],
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
      this.notifyAuthStateChange(null, null);
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
      const swaggerUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/swagger/v1/swagger.json';
      const response = await fetch(swaggerUrl, {
        method: 'GET',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        return { isOnline: true, message: `Backend Swagger v1 Online (${swaggerUrl})` };
      }

      // Secondary check: OPTIONS call to auth login
      const optionsResponse = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'OPTIONS',
      }).catch(() => null);

      if (optionsResponse) {
        return { isOnline: true, message: 'Backend API Service Reachable' };
      }

      return { isOnline: false, message: `Backend chưa phản hồi tại ${API_BASE_URL}` };
    } catch {
      return { isOnline: false, message: 'Không kết nối được tới Backend (Offline)' };
    }
  },

  // Helpers quản lý LocalStorage & JWT Token
  parseJwt(token: string): Record<string, unknown> | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  },

  isTokenExpired(token: string | null, bufferSeconds: number = 10): boolean {
    if (!token) return true;
    const payload = this.parseJwt(token);
    if (!payload || typeof payload.exp !== 'number') return true;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowInSeconds + bufferSeconds;
  },

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
