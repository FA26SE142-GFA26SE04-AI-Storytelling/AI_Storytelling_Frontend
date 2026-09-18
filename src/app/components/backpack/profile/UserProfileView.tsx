'use client';

import React, { useState } from 'react';
import { UserProfile, ChangePasswordRequest, ApiResponse } from '../../../types/auth';
import { authService } from '../../../services/authService';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Laptop,
  BookOpen,
  ArrowRight,
  Key,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut,
} from 'lucide-react';

export interface UserProfileViewProps {
  user: UserProfile;
  accessToken: string | null;
  onStageChange: (stageIndex: number) => void;
  logout: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<ApiResponse<object | null>>;
  refreshToken: () => Promise<any>;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  accessToken,
  onStageChange,
  logout,
  changePassword,
  refreshToken,
}) => {
  const [showTokenDetails, setShowTokenDetails] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [testProfileResult, setTestProfileResult] = useState<string | null>(null);

  // Change Password States
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [changePasswordFeedback, setChangePasswordFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleTestGetProfile = async () => {
    if (!accessToken) return;
    setTestProfileResult('Đang gọi API GET /api/v1/Auth/me (tự động refresh nếu hết hạn) ...');
    const res = await authService.getProfile();
    setTestProfileResult(JSON.stringify(res, null, 2));
  };

  const handleTestRefreshToken = async () => {
    setTestProfileResult('Đang gọi API POST /api/v1/Auth/refresh-token ...');
    const res = await refreshToken();
    setTestProfileResult(JSON.stringify(res, null, 2));
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordFeedback({ type: null, message: '' });

    if (newPassword !== confirmNewPassword) {
      setChangePasswordFeedback({
        type: 'error',
        message: 'Mật khẩu xác nhận không khớp với mật khẩu mới.',
      });
      return;
    }

    if (newPassword.length < 6) {
      setChangePasswordFeedback({
        type: 'error',
        message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      });

      if (res.success) {
        setChangePasswordFeedback({
          type: 'success',
          message: res.message || 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(async () => {
          await logout();
        }, 2500);
      } else {
        setChangePasswordFeedback({
          type: 'error',
          message: res.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.',
        });
      }
    } catch (err) {
      setChangePasswordFeedback({
        type: 'error',
        message: (err as Error)?.message || 'Có lỗi xảy ra khi đổi mật khẩu.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* 1. Profile Hero Card */}
      <div className="auth-form-field p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-zinc-900 to-zinc-950 border border-emerald-500/35 shadow-xl flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-sky-500 flex items-center justify-center font-black text-xl text-zinc-950 shadow-md shadow-emerald-500/20 shrink-0">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-base text-white truncate drop-shadow-sm">
                {user.fullName || user.username}
              </h3>
              <span className="text-emerald-400 shrink-0" title="Tài khoản đã xác thực">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-emerald-300 font-medium truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">
                {user.role === 'Parent' || user.role === '1' ? '🛡️ Phụ Huynh' : user.role || 'Thành viên'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 border border-sky-500/40 text-[10px] font-extrabold text-sky-300">
                ✨ VIP Family
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Comprehensive Details Grid */}
      <div className="auth-form-field p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs flex flex-col gap-2.5">
        <span className="text-[11px] font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-sky-400" /> Tất Cả Thông Tin Cá Nhân
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col">
            <span className="text-[10px] text-zinc-400">ID Người Dùng</span>
            <strong className="text-white font-mono text-xs">#{user.id}</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col">
            <span className="text-[10px] text-zinc-400">Tên Đăng Nhập</span>
            <strong className="text-sky-300 text-xs font-mono">@{user.username}</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col">
            <span className="text-[10px] text-zinc-400">Họ và Tên Đầy Đủ</span>
            <strong className="text-white text-xs">{user.fullName || 'Chưa cập nhật'}</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col">
            <span className="text-[10px] text-zinc-400">Số Điện Thoại</span>
            <strong className="text-zinc-200 text-xs font-mono">{user.phoneNumber || 'Chưa liên kết'}</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col sm:col-span-2">
            <span className="text-[10px] text-zinc-400">Địa Chỉ Email Xác Thực</span>
            <strong className="text-emerald-300 text-xs truncate">{user.email}</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex items-center justify-between sm:col-span-2">
            <div>
              <span className="text-[10px] text-zinc-400 block">Vai Trò & Quyền Hạn</span>
              <strong className="text-zinc-200 text-xs">
                {user.role === 'Parent' || user.role === '1' ? 'Phụ Huynh (Quản Lý Gia Đình)' : user.role || 'Người Dùng'}
              </strong>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {user.status || 'Active (Đang Trực Tuyến)'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Connected Child & Fast 3D Shortcuts */}
      <div className="auth-form-field p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-zinc-950/80 to-zinc-950/80 border border-indigo-500/30 text-xs flex flex-col gap-2.5">
        <span className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Quản Lý & Chuyển Nhanh Góc Phòng
        </span>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => onStageChange(6)}
            className="w-full p-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-sky-400" />
              <span>Mở Bảng Phụ Huynh (Laptop 3D)</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onStageChange(1)}
            className="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Xem Góc Bàn Học Của Bé</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Technical / JWT Token Details (Collapsible) */}
      <div className="auth-form-field rounded-2xl bg-zinc-950/90 border border-zinc-800 text-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTokenDetails(!showTokenDetails)}
          className="w-full p-3 flex items-center justify-between text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-bold text-[11px]">
            <Key className="w-3.5 h-3.5 text-amber-400" /> Chi Tiết Kỹ Thuật & Access Token
          </span>
          {showTokenDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTokenDetails && (
          <div className="p-3 pt-0 flex flex-col gap-2 border-t border-zinc-800/80">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 break-all max-h-20 overflow-y-auto">
              {accessToken}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (accessToken) {
                    navigator.clipboard.writeText(accessToken);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                  }
                }}
                className="flex-1 min-w-[100px] py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-bold text-zinc-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? 'Đã sao chép!' : 'Sao chép Token'}</span>
              </button>

              <button
                onClick={handleTestGetProfile}
                className="py-1.5 px-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-[11px] font-bold text-sky-300 transition-all cursor-pointer"
              >
                Test GET /Auth/me
              </button>

              <button
                onClick={handleTestRefreshToken}
                className="py-1.5 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-[11px] font-bold text-purple-300 transition-all cursor-pointer"
              >
                Refresh Token
              </button>
            </div>

            {testProfileResult && (
              <pre className="p-2 rounded-xl bg-black/60 border border-zinc-800 text-[9px] font-mono text-emerald-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
                {testProfileResult}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* 5. Change Password Card */}
      <div className="auth-form-field rounded-2xl bg-zinc-950/90 border border-zinc-800 text-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowChangePassword(!showChangePassword)}
          className="w-full p-3 flex items-center justify-between text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-bold text-[11px]">
            <Lock className="w-3.5 h-3.5 text-rose-400" /> Đổi Mật Khẩu Tài Khoản
          </span>
          {showChangePassword ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showChangePassword && (
          <form onSubmit={handleChangePasswordSubmit} className="p-3 pt-0 flex flex-col gap-2.5 border-t border-zinc-800/80">
            {changePasswordFeedback.type && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  changePasswordFeedback.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
                }`}
              >
                {changePasswordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{changePasswordFeedback.message}</span>
              </div>
            )}

            {/* Current Password Field */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-zinc-300">Mật khẩu hiện tại *</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-zinc-300">Mật khẩu mới (tối thiểu 6 ký tự) *</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-zinc-300">Xác nhận mật khẩu mới *</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-400 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setChangePasswordFeedback({ type: null, message: '' });
                }}
                className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer transition-all"
              >
                {isChangingPassword ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Cập Nhật...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Xác Nhận Đổi Mật Khẩu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 6. Logout Button */}
      <button
        onClick={logout}
        className="auth-form-field w-full py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
      >
        <LogOut className="w-4 h-4" />
        <span>Đăng Xuất Khỏi Thiết Bị Này</span>
      </button>
    </div>
  );
};
