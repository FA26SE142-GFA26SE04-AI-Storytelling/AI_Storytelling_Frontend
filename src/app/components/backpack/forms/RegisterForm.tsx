'use client';

import React, { useState } from 'react';
import { UserPlus, Lock, Mail, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export interface RegisterFormProps {
  onSuccess: (email: string) => void;
  setFeedback: (feedback: { type: 'success' | 'error' | 'info' | null; message: string; errors?: string[] }) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  setFeedback,
}) => {
  const { register } = useAuth();
  const [regUsername, setRegUsername] = useState<string>('');
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhoneNumber, setRegPhoneNumber] = useState<string>('');
  const [regRole, setRegRole] = useState<number>(1); // 1 = Parent
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regFullName.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      setFeedback({
        type: 'error',
        message: 'Vui lòng điền đầy đủ các trường thông tin bắt buộc.',
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setFeedback({
        type: 'error',
        message: 'Mật khẩu xác nhận không trùng khớp.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: 'info', message: 'Đang gửi yêu cầu đăng ký tài khoản tới Backend API...' });

    try {
      const response = await register({
        username: regUsername.trim(),
        email: regEmail.trim(),
        fullName: regFullName.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
        phoneNumber: regPhoneNumber.trim() || undefined,
        role: Number(regRole),
      });

      if (response.success) {
        setFeedback({
          type: 'success',
          message: 'Đăng ký thành công! Mã xác thực đã được gửi tới Gmail. Vui lòng dán Token bên dưới để xác thực.',
        });
        onSuccess(regEmail.trim());
      } else {
        setFeedback({
          type: 'error',
          message: response.message || 'Đăng ký không thành công.',
          errors: response.errors || [],
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Lỗi không xác định khi đăng ký.',
        errors: [(err as Error).message],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <div className="auth-form-field grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-tod-text">Tên đăng nhập *</label>
          <input
            type="text"
            required
            value={regUsername}
            onChange={(e) => setRegUsername(e.target.value)}
            placeholder="vd: parent_nguyen"
            className="w-full px-3 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder-tod-text-muted focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-tod-text">Họ và Tên đầy đủ *</label>
          <input
            type="text"
            required
            value={regFullName}
            onChange={(e) => setRegFullName(e.target.value)}
            placeholder="vd: Nguyễn Văn A"
            className="w-full px-3 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder-tod-text-muted focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      <div className="auth-form-field flex flex-col gap-1">
        <label className="text-[11px] font-bold text-tod-text">Địa chỉ Email nhận mã xác thực *</label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3 w-4 h-4 text-tod-text-muted" />
          <input
            type="email"
            required
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder-tod-text-muted focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      <div className="auth-form-field grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-tod-text">Số Điện Thoại</label>
          <input
            type="tel"
            value={regPhoneNumber}
            onChange={(e) => setRegPhoneNumber(e.target.value)}
            placeholder="0912345678"
            className="w-full px-3 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder-tod-text-muted focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-tod-text">Vai Trò Hệ Thống</label>
          <select
            value={regRole}
            onChange={(e) => setRegRole(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
          >
            <option value={1}>Phụ huynh (Parent)</option>
            <option value={0}>Quản trị viên (Admin)</option>
          </select>
        </div>
      </div>

      <div className="auth-form-field grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-tod-text">Mật khẩu *</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-2.5 w-3.5 h-3.5 text-tod-text-muted" />
            <input
              type={showRegPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full pl-8 pr-7 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder-tod-text-muted focus:outline-none focus:border-sky-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowRegPassword(!showRegPassword)}
              className="absolute right-2 text-tod-text-muted hover:text-tod-text cursor-pointer"
            >
              {showRegPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-tod-text">Xác nhận MK *</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-2.5 w-3.5 h-3.5 text-tod-text-muted" />
            <input
              type={showRegPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder-tod-text-muted focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="auth-form-field w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Đang Đăng Ký...</span>
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            <span>Tạo Tài Khoản Mới</span>
          </>
        )}
      </button>
    </form>
  );
};
