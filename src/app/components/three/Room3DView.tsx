'use client';

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { animateModalPop, animateStaggerList, animatePopItem } from '../../utils/gsapAnimations';

gsap.registerPlugin(useGSAP);

import { RoomCanvas, STAGES, TimeOfDay } from './RoomCanvas';
import { getVietnamTimeOfDay } from './room/stages';
import { RoomHeader } from './RoomHeader';
import { LibraryBookshelfZoomOverlay } from '../library/LibraryBookshelfZoomOverlay';
import { ParentDeskZoomOverlay } from '../parents/ParentDeskZoomOverlay';
import { ParentLaptopDashboardOverlay } from '../parents/ParentLaptopDashboardOverlay';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import {
  X,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Key,
  Zap,
  Phone,
  Copy,
  Check,
  Laptop,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

export default function Room3DView() {
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getVietnamTimeOfDay);
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'verify' | 'forgot' | 'reset'>('signin');
  const [isTopHovered, setIsTopHovered] = useState<boolean>(false);

  const isHeaderVisible = currentStage === 0 || isTopHovered;

  // Auth Context Hooks
  const {
    user,
    accessToken,
    isLoggedIn,
    isLoading: isAuthLoading,
    login,
    register,
    changePassword,
    forgotPassword,
    resetPassword,
    logout,
    refreshProfile,
    refreshToken,
  } = useAuth();

  // Local Login Form States
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Email Verification Form States
  const [verifyEmailInput, setVerifyEmailInput] = useState<string>('');
  const [verifyTokenInput, setVerifyTokenInput] = useState<string>('');

  // Forgot / Reset Password Form States
  const [forgotEmailInput, setForgotEmailInput] = useState<string>('');
  const [resetEmailInput, setResetEmailInput] = useState<string>('');
  const [resetTokenInput, setResetTokenInput] = useState<string>('');
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState<string>('');
  const [showResetPassword, setShowResetPassword] = useState<boolean>(false);

  // Registration Form States
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regFullName, setRegFullName] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regPhoneNumber, setRegPhoneNumber] = useState<string>('');
  const [regRole, setRegRole] = useState<number>(1); // 1 = Parent
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Profile View States
  const [showTokenDetails, setShowTokenDetails] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

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

  // Api Test State
  const [apiFeedback, setApiFeedback] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
    errors?: string[];
  }>({ type: null, message: '' });

  const [testProfileResult, setTestProfileResult] = useState<string | null>(null);

  // Tự động làm mới hồ sơ người dùng khi mở góc nhìn Cặp Sách (Stage 5)
  useEffect(() => {
    if (currentStage === 5 && isLoggedIn && refreshProfile) {
      refreshProfile();
    }
  }, [currentStage, isLoggedIn, refreshProfile]);

  // Wheel scroll handler to change camera stages smoothly
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleWheel = (e: WheelEvent) => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        if (e.deltaY > 30) {
          setCurrentStage((prev) => Math.min(prev + 1, STAGES.length - 1));
        } else if (e.deltaY < -30) {
          setCurrentStage((prev) => Math.max(prev - 1, 0));
        }
      }, 250);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const roomViewRef = useRef<HTMLDivElement>(null);

  // GSAP: Hiệu ứng Pop-in khi mở Hộp thoại Đăng Nhập / Cặp sách (Stage 5)
  useGSAP(() => {
    if (currentStage === 5) {
      animateModalPop('.auth-modal-card');
      animateStaggerList('.auth-form-field', { delay: 0.12, stagger: 0.04 });
    }
  }, { scope: roomViewRef, dependencies: [currentStage] });

  // GSAP: Tái kích hoạt hiệu ứng stagger khi chuyển tab Đăng nhập / Đăng ký / Xác thực
  useGSAP(() => {
    if (currentStage === 5) {
      animateStaggerList('.auth-form-field', { stagger: 0.035, duration: 0.3 });
    }
  }, { scope: roomViewRef, dependencies: [authTab] });

  // GSAP: Hiệu ứng nút quay lại toàn cảnh khi Zoom vào Stage 3 hoặc 4
  useGSAP(() => {
    if (currentStage === 3 || currentStage === 4) {
      animatePopItem('.room-back-btn');
    }
  }, { scope: roomViewRef, dependencies: [currentStage] });


  // Form submit for Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setApiFeedback({
        type: 'error',
        message: 'Vui lòng điền đầy đủ Email/Tên đăng nhập và Mật khẩu.',
      });
      return;
    }

    setIsSubmitting(true);
    setApiFeedback({ type: 'info', message: 'Đang gửi yêu cầu đăng nhập tới Backend API...' });

    try {
      const response = await login({ identifier, password });

      if (response.success && response.data) {
        setApiFeedback({
          type: 'success',
          message: response.message || 'Đăng nhập thành công! Đã nhận JWT Access Token.',
        });
      } else {
        setApiFeedback({
          type: 'error',
          message: response.message || 'Đăng nhập không thành công.',
          errors: response.errors || [],
        });
      }
    } catch (err) {
      setApiFeedback({
        type: 'error',
        message: 'Lỗi không xác định khi đăng nhập.',
        errors: [(err as Error).message],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form submit for Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regFullName.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      setApiFeedback({
        type: 'error',
        message: 'Vui lòng điền đầy đủ các trường thông tin bắt buộc.',
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setApiFeedback({
        type: 'error',
        message: 'Mật khẩu xác nhận không trùng khớp.',
      });
      return;
    }

    setIsSubmitting(true);
    setApiFeedback({ type: 'info', message: 'Đang gửi yêu cầu đăng ký tài khoản tới Backend API...' });

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
        setApiFeedback({
          type: 'success',
          message: 'Đăng ký thành công! Mã xác thực đã được gửi tới Gmail. Vui lòng dán Token bên dưới để xác thực.',
        });
        setVerifyEmailInput(regEmail.trim());
        setIdentifier(regUsername.trim() || regEmail.trim());
        setAuthTab('verify');
      } else {
        setApiFeedback({
          type: 'error',
          message: response.message || 'Đăng ký không thành công.',
          errors: response.errors || [],
        });
      }
    } catch (err) {
      setApiFeedback({
        type: 'error',
        message: 'Lỗi không xác định khi đăng ký.',
        errors: [(err as Error).message],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form submit for Email Verification
  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyEmailInput.trim() || !verifyTokenInput.trim()) {
      setApiFeedback({
        type: 'error',
        message: 'Vui lòng nhập đầy đủ Email và Mã xác thực (Token).',
      });
      return;
    }

    setIsSubmitting(true);
    setApiFeedback({ type: 'info', message: 'Đang gửi yêu cầu xác thực email tới Backend API...' });

    try {
      const response = await authService.verifyEmail({
        email: verifyEmailInput.trim(),
        token: verifyTokenInput.trim(),
      });

      if (response.success) {
        setApiFeedback({
          type: 'success',
          message: response.message || 'Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.',
        });
        setIdentifier(verifyEmailInput.trim());
        setVerifyTokenInput('');
        setTimeout(() => {
          setAuthTab('signin');
        }, 1500);
      } else {
        setApiFeedback({
          type: 'error',
          message: response.message || 'Xác thực email thất bại. Vui lòng kiểm tra lại mã Token.',
          errors: response.errors || [],
        });
      }
    } catch (err) {
      setApiFeedback({
        type: 'error',
        message: 'Lỗi không xác định khi xác thực email.',
        errors: [(err as Error).message],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form submit for Forgot Password (Request reset code)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmailInput.trim()) {
      setApiFeedback({
        type: 'error',
        message: 'Vui lòng nhập địa chỉ email.',
      });
      return;
    }

    setIsSubmitting(true);
    setApiFeedback({ type: 'info', message: 'Đang gửi yêu cầu đặt lại mật khẩu...' });

    try {
      const response = await forgotPassword({
        email: forgotEmailInput.trim(),
      });

      if (response.success) {
        setApiFeedback({
          type: 'success',
          message: response.message || 'Mã xác nhận đặt lại mật khẩu đã được gửi qua email của bạn.',
        });
        setResetEmailInput(forgotEmailInput.trim());
        // Tự động chuyển sang bước 2 để dán mã
        setTimeout(() => {
          setAuthTab('reset');
        }, 1200);
      } else {
        setApiFeedback({
          type: 'error',
          message: response.message || 'Yêu cầu không thành công.',
          errors: response.errors || [],
        });
      }
    } catch (err) {
      setApiFeedback({
        type: 'error',
        message: 'Lỗi khi gửi yêu cầu đặt lại mật khẩu.',
        errors: [(err as Error).message],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form submit for Reset Password (Set new password with code)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmailInput.trim() || !resetTokenInput.trim() || !resetNewPassword || !resetConfirmPassword) {
      setApiFeedback({
        type: 'error',
        message: 'Vui lòng điền đầy đủ tất cả các trường.',
      });
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setApiFeedback({
        type: 'error',
        message: 'Mật khẩu xác nhận không khớp với mật khẩu mới.',
      });
      return;
    }

    if (resetNewPassword.length < 6) {
      setApiFeedback({
        type: 'error',
        message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.',
      });
      return;
    }

    setIsSubmitting(true);
    setApiFeedback({ type: 'info', message: 'Đang đặt lại mật khẩu mới...' });

    try {
      const response = await resetPassword({
        email: resetEmailInput.trim(),
        resetToken: resetTokenInput.trim(),
        newPassword: resetNewPassword,
        confirmPassword: resetConfirmPassword,
      });

      if (response.success) {
        setApiFeedback({
          type: 'success',
          message: response.message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.',
        });
        setIdentifier(resetEmailInput.trim());
        setResetTokenInput('');
        setResetNewPassword('');
        setResetConfirmPassword('');
        setTimeout(() => {
          setAuthTab('signin');
        }, 2000);
      } else {
        setApiFeedback({
          type: 'error',
          message: response.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã Token.',
          errors: response.errors || [],
        });
      }
    } catch (err) {
      setApiFeedback({
        type: 'error',
        message: 'Lỗi không xác định khi đặt lại mật khẩu.',
        errors: [(err as Error).message],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        // Tự động đăng xuất sau 2.5s để người dùng đăng nhập lại với mật khẩu mới
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
    <div ref={roomViewRef} className="relative w-screen h-screen overflow-hidden select-none bg-zinc-950 font-sans">
      {/* Invisible Top Edge Hover Detector (di chuột vào mép trên màn hình để hiện Header khi đang Zoom) */}
      {currentStage !== 0 && (
        <div
          onMouseEnter={() => setIsTopHovered(true)}
          className="fixed top-0 left-0 right-0 h-8 z-30 pointer-events-auto"
        />
      )}

      {/* 3D Header Navigation (Luôn hiện ở Góc 1, trượt xuống khi di chuột mép trên) */}
      <RoomHeader
        currentStage={currentStage}
        onStageChange={setCurrentStage}
        timeOfDay={timeOfDay}
        onTimeOfDayChange={setTimeOfDay}
        isVisible={isHeaderVisible}
        onMouseEnter={() => setIsTopHovered(true)}
        onMouseLeave={() => setIsTopHovered(false)}
      />

      {/* Nút Quay lại Toàn Cảnh khi Zoom vào các góc đồ vật (Stage 3: Tủ trượt, Stage 4: Cửa sổ) */}
      {(currentStage === 3 || currentStage === 4) && (
        <div className="fixed top-4 left-4 z-30 pointer-events-auto">
          <button
            onClick={() => setCurrentStage(0)}
            className="room-back-btn px-4 py-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-900 text-white font-extrabold text-xs flex items-center gap-2 border border-white/20 shadow-xl backdrop-blur-xl transition-all hover:scale-105 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Quay lại Toàn Cảnh (Góc 1)</span>
          </button>
        </div>
      )}

      {/* Fullscreen 3D Room Canvas */}
      <RoomCanvas
        currentStageIndex={currentStage}
        onStageChange={setCurrentStage}
        timeOfDay={timeOfDay}
        onTimeOfDayChange={setTimeOfDay}
      />

      {/* Interactive Floating Parent Desk Overlay when zoomed into Desk (Stage 1) */}
      {currentStage === 1 && (
        <ParentDeskZoomOverlay
          currentStage={currentStage}
          onStageChange={setCurrentStage}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
          is2DViewAvailable={false}
        />
      )}

      {/* Interactive Floating Bookshelf Overlay when zoomed into Bookshelf (Stage 2) */}
      {currentStage === 2 && (
        <LibraryBookshelfZoomOverlay
          currentStage={currentStage}
          onStageChange={setCurrentStage}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
          is2DViewAvailable={false}
        />
      )}

      {/* Interactive Sign In Floating Card when zoomed into Backpack (Stage 5) */}
      {currentStage === 5 && (
        <div className="fixed inset-y-0 left-4 sm:left-10 z-30 flex items-center pointer-events-none">
          <div className="auth-modal-card pointer-events-auto w-[92vw] sm:w-[440px] max-h-[88vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-zinc-900/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-sky-500/40 shadow-[0_0_60px_rgba(56,189,248,0.25)] text-white scrollbar-thin scrollbar-thumb-zinc-700">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                {isLoggedIn ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : authTab === 'signin' ? (
                  <LogIn className="w-4 h-4" />
                ) : authTab === 'verify' ? (
                  <Key className="w-4 h-4 text-amber-300" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </div>
              <div>
                <h2 className="font-black text-base tracking-tight text-white flex items-center gap-2">
                  <span className="text-white drop-shadow-sm font-black">
                    {isLoggedIn
                      ? 'Hồ Sơ & Thông Tin Tài Khoản'
                      : authTab === 'signin'
                      ? 'Đăng Nhập MagicTales'
                      : authTab === 'verify'
                      ? 'Xác Thực Email'
                      : 'Đăng Ký Tài Khoản'}
                  </span>
                </h2>
                <p className="text-[10px] text-zinc-300 font-medium">
                  {isLoggedIn ? 'Thông tin cá nhân & Quản lý gia đình MagicTales' : 'Cặp Sách Nobita 3D Auth'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentStage(0)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Quay lại góc nhìn toàn cảnh"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* IF USER IS LOGGED IN: DISPLAY ALL USER PROFILE INFORMATION */}
          {isLoggedIn && user ? (
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
                    onClick={() => setCurrentStage(6)}
                    className="w-full p-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-sky-400" />
                      <span>Mở Bảng Phụ Huynh (Laptop 3D)</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setCurrentStage(1)}
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
                        className="flex-1 min-w-[100px] py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Test API /me</span>
                      </button>

                      <button
                        onClick={handleTestRefreshToken}
                        className="flex-1 min-w-[100px] py-1.5 px-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-[11px] font-bold text-sky-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                        <span>Test Refresh</span>
                      </button>
                    </div>

                    {testProfileResult && (
                      <pre className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-32">
                        {testProfileResult}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Change Password Card / Accordion Form */}
              <div className="auth-form-field rounded-2xl bg-zinc-950/90 border border-zinc-800 text-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(!showChangePassword);
                    setChangePasswordFeedback({ type: null, message: '' });
                  }}
                  className="w-full p-3 flex items-center justify-between text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-bold text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-rose-400" /> Đổi Mật Khẩu Tài Khoản (Change Password)
                  </span>
                  {showChangePassword ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showChangePassword && (
                  <form onSubmit={handleChangePasswordSubmit} className="p-3.5 pt-0 flex flex-col gap-2.5 border-t border-zinc-800/80">
                    <p className="text-[10px] text-zinc-400 pt-2 leading-relaxed">
                      Nhập mật khẩu hiện tại và thiết lập mật khẩu mới (tối thiểu 6 ký tự) để bảo vệ tài khoản của bạn.
                    </p>

                    {/* Feedback Alert */}
                    {changePasswordFeedback.type && (
                      <div
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                          changePasswordFeedback.type === 'success'
                            ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                        }`}
                      >
                        {changePasswordFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        )}
                        <span className="text-[11px] font-medium leading-snug">{changePasswordFeedback.message}</span>
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
                          className="w-full pl-8 pr-2 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-400 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmNewPassword('');
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
          ) : (
            /* IF NOT LOGGED IN: DISPLAY LOGIN, REGISTER OR VERIFY MAIL FORM */
            <div>
              {/* Tab Selector */}
              {authTab === 'forgot' || authTab === 'reset' ? (
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('signin');
                      setApiFeedback({ type: null, message: '' });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Đăng Nhập</span>
                  </button>
                  <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('forgot');
                        setApiFeedback({ type: null, message: '' });
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        authTab === 'forgot'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      1. Gửi Mã
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('reset');
                        setApiFeedback({ type: null, message: '' });
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        authTab === 'reset'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      2. Đặt Lại MK
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center p-1 mb-4 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-[11px] font-bold">
                  <button
                    onClick={() => {
                      setAuthTab('signin');
                      setApiFeedback({ type: null, message: '' });
                    }}
                    className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
                      authTab === 'signin'
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Đăng Nhập
                  </button>
                  <button
                    onClick={() => {
                      setAuthTab('signup');
                      setApiFeedback({ type: null, message: '' });
                    }}
                    className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
                      authTab === 'signup'
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Đăng Ký
                  </button>
                  <button
                    onClick={() => {
                      setAuthTab('verify');
                      setApiFeedback({ type: null, message: '' });
                    }}
                    className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
                      authTab === 'verify'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Xác Thực Mail
                  </button>
                </div>
              )}

              {/* API Feedback Alerts */}
              {apiFeedback.type && (
                <div
                  className={`p-3 mb-4 rounded-xl border text-xs flex flex-col gap-1 ${
                    apiFeedback.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : apiFeedback.type === 'error'
                      ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                      : 'bg-sky-950/60 border-sky-500/50 text-sky-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {apiFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : apiFeedback.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    ) : (
                      <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-sky-400" />
                    )}
                    <span>{apiFeedback.message}</span>
                  </div>
                  {apiFeedback.errors && apiFeedback.errors.length > 0 && (
                    <ul className="pl-6 list-disc text-[11px] opacity-90">
                      {apiFeedback.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* FORM TAB 1: LOGIN FORM */}
              {authTab === 'signin' && (
                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
                  <div className="auth-form-field flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-zinc-300">Email hoặc Tên đăng nhập</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Nhập email hoặc tên tài khoản"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="auth-form-field flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-300">Mật khẩu</label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('forgot');
                          setApiFeedback({ type: null, message: '' });
                          if (identifier.includes('@')) {
                            setForgotEmailInput(identifier.trim());
                            setResetEmailInput(identifier.trim());
                          }
                        }}
                        className="text-[10px] text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 w-4 h-4 text-zinc-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 p-1 text-zinc-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isAuthLoading}
                    className="auth-form-field w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 hover:from-sky-400 hover:to-purple-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang Xác Thực API...</span>
                      </>
                    ) : (
                      <>
                        <span>Đăng Nhập Ngay</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* FORM TAB 2: REGISTER FORM */}
              {authTab === 'signup' && (
                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
                  <div className="auth-form-field flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-zinc-300">Địa chỉ Email xác nhận *</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="Ví dụ: khanhdn.business@gmail.com"
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="auth-form-field flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-zinc-300">Tên đăng nhập (Username) *</label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="Ví dụ: parent_demo1"
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="auth-form-field flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-zinc-300">Họ và Tên *</label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Ví dụ: Trần Thị Hoa"
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="auth-form-field grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-300">Số Điện Thoại</label>
                      <div className="relative flex items-center">
                        <Phone className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type="tel"
                          value={regPhoneNumber}
                          onChange={(e) => setRegPhoneNumber(e.target.value)}
                          placeholder="0900000000"
                          className="w-full pl-8 pr-2 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-300">Vai Trò (Role)</label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                      >
                        <option value={1}>Phụ huynh (Parent)</option>
                        <option value={0}>Quản trị viên (Admin)</option>
                      </select>
                    </div>
                  </div>

                  <div className="auth-form-field grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-300">Mật khẩu *</label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-8 pr-7 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-300">Xác nhận MK *</label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-8 pr-2 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isAuthLoading}
                    className="auth-form-field w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang Gửi Đăng Ký API...</span>
                      </>
                    ) : (
                      <>
                        <span>Hoàn Tất Đăng Ký Tài Khoản</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* FORM TAB 3: EMAIL VERIFICATION FORM */}
              {authTab === 'verify' && (
                <form onSubmit={handleVerifyEmailSubmit} className="flex flex-col gap-3.5">
                  <div className="auth-form-field p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs flex flex-col gap-1">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-emerald-400" />
                      Xác thực Email tài khoản
                    </span>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Nhập Email đăng ký và dán mã <strong>Verification Token</strong> từ Gmail để kích hoạt tài khoản.
                    </p>
                  </div>

                  <div className="auth-form-field flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-zinc-300">Địa chỉ Email *</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="email"
                        required
                        value={verifyEmailInput}
                        onChange={(e) => setVerifyEmailInput(e.target.value)}
                        placeholder="Ví dụ: khanhdn.business@gmail.com"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="auth-form-field flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-zinc-300">Mã xác thực (Token từ Email) *</label>
                    <div className="relative flex items-center">
                      <Key className="absolute left-3 w-4 h-4 text-emerald-400" />
                      <input
                        type="text"
                        required
                        value={verifyTokenInput}
                        onChange={(e) => setVerifyTokenInput(e.target.value)}
                        placeholder="Dán mã Token từ Gmail tại đây..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Mã token được gửi tự động qua Gmail của bạn.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="auth-form-field w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang Xác Thực...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Xác Thực Email Ngay</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* FORM TAB 4: FORGOT PASSWORD (STEP 1: REQUEST CODE) */}
              {authTab === 'forgot' && (
                <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-3.5">
                  <div className="auth-form-field p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs flex flex-col gap-1">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-400" />
                      Bước 1: Yêu cầu đặt lại mật khẩu
                    </span>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Nhập địa chỉ Email đã đăng ký tài khoản. Hệ thống sẽ gửi <strong>Mã đặt lại mật khẩu</strong> (Reset Token) qua Gmail của bạn.
                    </p>
                  </div>

                  <div className="auth-form-field flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-zinc-300">Địa chỉ Email *</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="email"
                        required
                        value={forgotEmailInput}
                        onChange={(e) => setForgotEmailInput(e.target.value)}
                        placeholder="Ví dụ: parent@example.com"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="auth-form-field w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang Gửi Yêu Cầu...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Gửi Mã Đặt Lại Mật Khẩu</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('signin');
                        setApiFeedback({ type: null, message: '' });
                      }}
                      className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Quay lại Đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('reset');
                        setApiFeedback({ type: null, message: '' });
                        if (forgotEmailInput) setResetEmailInput(forgotEmailInput);
                      }}
                      className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer transition-colors"
                    >
                      Đã có mã? Đặt lại MK →
                    </button>
                  </div>
                </form>
              )}

              {/* FORM TAB 5: RESET PASSWORD (STEP 2: CONFIRM TOKEN & NEW PASSWORD) */}
              {authTab === 'reset' && (
                <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-3">
                  <div className="auth-form-field p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs flex flex-col gap-1">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Bước 2: Thiết lập mật khẩu mới
                    </span>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Dán <strong>Reset Token</strong> nhận được trong Email và nhập mật khẩu mới của bạn.
                    </p>
                  </div>

                  <div className="auth-form-field flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-zinc-300">Địa chỉ Email *</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="email"
                        required
                        value={resetEmailInput}
                        onChange={(e) => setResetEmailInput(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="auth-form-field flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-zinc-300">Mã đặt lại mật khẩu (Token từ Gmail) *</label>
                    <div className="relative flex items-center">
                      <Key className="absolute left-3 w-4 h-4 text-amber-400" />
                      <input
                        type="text"
                        required
                        value={resetTokenInput}
                        onChange={(e) => setResetTokenInput(e.target.value)}
                        placeholder="Dán mã Token từ email tại đây..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="auth-form-field grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-300">Mật khẩu mới *</label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          required
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          className="w-full pl-8 pr-7 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute right-2 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          {showResetPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-300">Xác nhận MK *</label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          required
                          value={resetConfirmPassword}
                          onChange={(e) => setResetConfirmPassword(e.target.value)}
                          placeholder="Nhập lại MK"
                          className="w-full pl-8 pr-2 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="auth-form-field w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang Cập Nhật Mật Khẩu...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Xác Nhận Đặt Lại Mật Khẩu</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('forgot');
                        setApiFeedback({ type: null, message: '' });
                      }}
                      className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Gửi lại mã mới
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('signin');
                        setApiFeedback({ type: null, message: '' });
                      }}
                      className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer transition-colors"
                    >
                      Quay lại Đăng nhập →
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Interactive Parent Dashboard Overlay when zoomed into Laptop (Stage 6) */}
      {currentStage === 6 && (
        <ParentLaptopDashboardOverlay
          currentStage={currentStage}
          onStageChange={setCurrentStage}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
          is2DViewAvailable={false}
        />
      )}
    </div>
  );
}
