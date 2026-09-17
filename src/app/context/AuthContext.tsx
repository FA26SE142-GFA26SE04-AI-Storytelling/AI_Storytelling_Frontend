'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, LoginRequest, RegisterRequest, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest, AuthResponseData, ApiResponse } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  backendOnline: boolean | null;
  backendStatusMessage: string;
  login: (credentials: LoginRequest) => Promise<ApiResponse<AuthResponseData>>;
  register: (data: RegisterRequest) => Promise<ApiResponse<object | null>>;
  changePassword: (data: ChangePasswordRequest) => Promise<ApiResponse<object | null>>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<ApiResponse<object | null>>;
  resetPassword: (data: ResetPasswordRequest) => Promise<ApiResponse<object | null>>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  refreshToken: () => Promise<ApiResponse<AuthResponseData>>;
  pingBackend: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [backendStatusMessage, setBackendStatusMessage] = useState<string>('Đang kiểm tra máy chủ...');

  // Ping kiểm tra kết nối Backend API
  const pingBackend = useCallback(async () => {
    const health = await authService.checkBackendHealth();
    setBackendOnline(health.isOnline);
    setBackendStatusMessage(health.message);

    // Nếu Backend Offline -> xóa sạch session và out tài khoản
    if (!health.isOnline) {
      authService.clearStoredAuth();
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  // Đăng ký listener và khởi tạo trạng thái phiên đăng nhập khi tải trang
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((newUser, newToken) => {
      setUser(newUser);
      setAccessToken(newToken);
    });

    const initializeAuth = async () => {
      setIsLoading(true);

      // 1. Kiểm tra kết nối tới Server Backend trước
      const health = await authService.checkBackendHealth();
      setBackendOnline(health.isOnline);
      setBackendStatusMessage(health.message);

      // Nếu Server Backend đang Offline: Xóa toàn bộ dữ liệu lưu trữ và out tài khoản
      if (!health.isOnline) {
        authService.clearStoredAuth();
        setUser(null);
        setAccessToken(null);
        setIsLoading(false);
        return;
      }

      // 2. Server Online: Đọc Token & User từ LocalStorage
      const token = authService.getStoredAccessToken();
      const storedRefreshToken = authService.getStoredRefreshToken();
      const storedUser = authService.getStoredUser();

      if (!token && !storedRefreshToken) {
        setUser(null);
        setAccessToken(null);
        setIsLoading(false);
        return;
      }

      // 3. Kiểm tra hạn JWT Client-side
      const tokenExpired = authService.isTokenExpired(token);
      if (!tokenExpired && token) {
        // Token còn hạn -> set state tạm thời
        setAccessToken(token);
        if (storedUser) setUser(storedUser);
      }

      // 4. Xác minh lại phiên đăng nhập với Backend (/Auth/me)
      // Nếu accessToken hết hạn, authenticatedFetch sẽ tự động thử Refresh Token
      // Nếu refreshToken cũng hết hạn hoặc không hợp lệ -> authService sẽ xóa auth và out tài khoản
      const profileRes = await authService.getProfile();
      if (profileRes.success && profileRes.data) {
        setUser(profileRes.data);
        setAccessToken(authService.getStoredAccessToken());
      } else {
        // Xác minh thất bại -> Xóa sạch và out tài khoản
        authService.clearStoredAuth();
        setUser(null);
        setAccessToken(null);
      }

      setIsLoading(false);
    };

    initializeAuth();

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginRequest): Promise<ApiResponse<AuthResponseData>> => {
    setIsLoading(true);
    const result = await authService.login(credentials);
    setIsLoading(false);

    if (result.success && result.data) {
      setAccessToken(result.data.accessToken);
      setUser(result.data.user);
      setBackendOnline(true);
    } else {
      setAccessToken(null);
      setUser(null);
      authService.clearStoredAuth();
    }
    return result;
  };

  const register = async (data: RegisterRequest): Promise<ApiResponse<object | null>> => {
    setIsLoading(true);
    const result = await authService.register(data);
    setIsLoading(false);
    return result;
  };

  const changePassword = async (data: ChangePasswordRequest): Promise<ApiResponse<object | null>> => {
    setIsLoading(true);
    const result = await authService.changePassword(data, accessToken || undefined);
    setIsLoading(false);
    return result;
  };

  const forgotPassword = async (data: ForgotPasswordRequest): Promise<ApiResponse<object | null>> => {
    setIsLoading(true);
    const result = await authService.forgotPassword(data);
    setIsLoading(false);
    return result;
  };

  const resetPassword = async (data: ResetPasswordRequest): Promise<ApiResponse<object | null>> => {
    setIsLoading(true);
    const result = await authService.resetPassword(data);
    setIsLoading(false);
    return result;
  };

  const refreshToken = async (): Promise<ApiResponse<AuthResponseData>> => {
    const result = await authService.refreshToken();
    if (result.success && result.data) {
      setAccessToken(result.data.accessToken);
      setUser(result.data.user);
    } else {
      setAccessToken(null);
      setUser(null);
    }
    return result;
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    await authService.logout();
    setAccessToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    const res = await authService.getProfile();
    if (res.success && res.data) {
      setUser(res.data);
      return res.data;
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoggedIn: !!user && !!accessToken,
        isLoading,
        backendOnline,
        backendStatusMessage,
        login,
        register,
        changePassword,
        forgotPassword,
        resetPassword,
        logout,
        refreshProfile,
        refreshToken,
        pingBackend,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
