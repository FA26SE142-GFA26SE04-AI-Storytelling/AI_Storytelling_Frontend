'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, LoginRequest, RegisterRequest, ChangePasswordRequest, AuthResponseData, ApiResponse } from '../types/auth';
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
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
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
  }, []);

  // Khởi tạo trạng thái phiên đăng nhập từ localStorage khi tải trang
  useEffect(() => {
    const token = authService.getStoredAccessToken();
    const storedUser = authService.getStoredUser();

    if (token) {
      setAccessToken(token);
      if (storedUser) {
        setUser(storedUser);
      }
      // Xác minh lại token với Backend
      authService.getProfile(token).then((res) => {
        if (res.success && res.data) {
          setUser(res.data);
        }
      });
    }

    pingBackend();
    setIsLoading(false);
  }, [pingBackend]);

  const login = async (credentials: LoginRequest): Promise<ApiResponse<AuthResponseData>> => {
    setIsLoading(true);
    const result = await authService.login(credentials);
    setIsLoading(false);

    if (result.success && result.data) {
      setAccessToken(result.data.accessToken);
      setUser(result.data.user);
      setBackendOnline(true);
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

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    await authService.logout();
    setAccessToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (!accessToken) return null;
    const res = await authService.getProfile(accessToken);
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
        logout,
        refreshProfile,
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
