'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { animateStaggerList } from '../../utils/gsapAnimations';

gsap.registerPlugin(useGSAP);

import { TimeOfDay, STAGES } from './RoomCanvas';
import { useAuth } from '../../context/AuthContext';
import { useChildSession } from '../../context/ChildSessionContext';
import {
  BookOpen,
  Layers,
  Clock,
  DoorOpen,
  ShieldCheck,
  Sunrise,
  Sun,
  Moon,
  Briefcase,
  RefreshCw,
  Laptop,
  LogOut,
  Sparkles,
} from 'lucide-react';

export interface RoomHeaderProps {
  currentStage: number;
  onStageChange: (index: number) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay) => void;
  isVisible?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onOpenChildLogin?: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  currentStage,
  onStageChange,
  timeOfDay,
  onTimeOfDayChange,
  isVisible = true,
  onMouseEnter,
  onMouseLeave,
  onOpenChildLogin,
}) => {
  const { user, isLoggedIn, backendOnline, backendStatusMessage, pingBackend } = useAuth();
  const { currentSession, isChildModeActive, requestExitWithGate } = useChildSession();
  const stationIcons = [Layers, Clock, BookOpen, DoorOpen, ShieldCheck, Briefcase, Laptop];
  const headerRef = useRef<HTMLElement>(null);

  // GSAP: Hiệu ứng xuất hiện so le khi Header hiển thị
  useGSAP(() => {
    if (isVisible) {
      gsap.fromTo(
        '.header-brand',
        { x: -25, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
      animateStaggerList('.header-stage-btn', { delay: 0.08, stagger: 0.04 });
      gsap.fromTo(
        '.header-action-group',
        { x: 25, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, delay: 0.12, ease: 'power2.out' }
      );
    }
  }, { scope: headerRef, dependencies: [isVisible] });

  return (
    <header
      ref={headerRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`fixed top-0 left-0 right-0 w-full z-40 transition-all duration-300 ease-in-out transform-gpu ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-full bg-tod-surface/95 backdrop-blur-2xl border-b border-tod-border shadow-md px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 text-tod-text select-none transition-colors duration-500 overflow-x-auto scrollbar-none">
        
        {/* 1. Brand Logo & Title */}
        <div className="header-brand flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 group p-1 rounded-xl hover:bg-tod-card/50 transition-all"
            title="Trang Chủ MagicTales 3D Studio"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 fill-white/20" />
            </div>
            <div className="hidden xl:flex flex-col">
              <span className="font-black text-xs sm:text-sm tracking-tight bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 bg-clip-text text-transparent">
                MagicTales 3D
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-tod-text-muted uppercase tracking-widest -mt-0.5">
                Studio Phòng 3D
              </span>
            </div>
          </Link>
        </div>

        {/* 2. Center 3D Station Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-tod-card border border-tod-border rounded-2xl shrink transition-colors duration-500">
          {STAGES.map((stg, idx) => {
            const Icon = stationIcons[idx] || Layers;
            const isActive = currentStage === idx;
            const stationShortNames = [
              '1. Toàn Cảnh',
              '2. Bàn Học',
              '3. Tủ Sách',
              '4. Tủ Trượt',
              '5. Cửa Sổ',
              '6. Cặp Sách',
              '7. Laptop',
            ];
            const label = stationShortNames[idx] || stg.name.split(' (')[0];
            return (
              <button
                key={stg.id}
                onClick={() => onStageChange(idx)}
                title={stg.name.split(' (')[0]}
                className={`header-stage-btn flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-amber-500'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* 3. Right Atmosphere & User Account Action Bar */}
        <div className="header-action-group flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Live Connection Status Dot */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-tod-card border border-tod-border text-xs transition-colors duration-500"
            title={backendStatusMessage}
          >
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-400' : backendOnline === false ? 'bg-rose-500' : 'bg-amber-400'}`} />
            <span className="font-extrabold text-[11px] text-tod-text">
              {backendOnline ? 'Online' : backendOnline === false ? 'Offline' : '...'}
            </span>
            <button
              onClick={pingBackend}
              className="p-0.5 text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer ml-0.5"
              title="Làm mới kiểm tra kết nối Backend"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Time of Day Switcher Pills */}
          <div className="flex items-center p-1 bg-tod-card border border-tod-border rounded-xl text-[11px] font-extrabold transition-colors duration-500">
            <button
              onClick={() => onTimeOfDayChange('morning')}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'morning'
                  ? 'bg-sky-500 text-white font-black shadow-sm'
                  : 'text-tod-text-muted hover:text-tod-text'
              }`}
              title="Buổi Sáng"
            >
              <Sunrise className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sáng</span>
            </button>

            <button
              onClick={() => onTimeOfDayChange('afternoon')}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'afternoon'
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                  : 'text-tod-text-muted hover:text-tod-text'
              }`}
              title="Buổi Chiều"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chiều</span>
            </button>

            <button
              onClick={() => onTimeOfDayChange('night')}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'night'
                  ? 'bg-indigo-600 text-white font-black shadow-sm'
                  : 'text-tod-text-muted hover:text-tod-text'
              }`}
              title="Buổi Tối"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tối</span>
            </button>
          </div>

          {/* Child Mode Active Pill or Child Login Button */}
          {isChildModeActive && currentSession ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 shadow-sm">
              <span className="text-sm filter drop-shadow">{currentSession.avatarEmoji}</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-amber-500 leading-tight">
                  Bé {currentSession.nickname}
                </span>
                <span className="text-[8px] text-tod-text-muted">Phiên đọc</span>
              </div>
              <button
                type="button"
                onClick={requestExitWithGate}
                className="ml-1 p-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-rose-500/30 text-tod-text-muted hover:text-rose-500 transition-colors cursor-pointer"
                title="Thoát phiên đọc của bé (Cần giải câu đố phụ huynh)"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            onOpenChildLogin && (
              <button
                type="button"
                onClick={onOpenChildLogin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                title="Dành cho bé: Chọn hình đại diện và nhập mã PIN để đọc truyện"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-950 fill-zinc-950" />
                <span className="hidden xs:inline">Bé Đăng Nhập</span>
              </button>
            )
          )}

          {/* User Account / Login Button */}
          {isLoggedIn && user ? (
            <button
              onClick={() => onStageChange(5)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentStage === 5
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.03] ring-2 ring-emerald-400/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
              title="Bấm để Zoom vào Cặp Sách 3D xem tài khoản"
            >
              <div className="w-5 h-5 rounded-lg bg-white/25 flex items-center justify-center font-black text-[10px] text-white">
                {(user.fullName || user.username).charAt(0).toUpperCase()}
              </div>
              <span className="font-extrabold text-xs truncate max-w-[100px] sm:max-w-[130px]">
                {user.fullName || user.username}
              </span>
            </button>
          ) : (
            <button
              onClick={() => onStageChange(5)}
              className={`flex items-center px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentStage === 5
                  ? 'bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 text-white shadow-lg shadow-sky-500/30 scale-[1.03] ring-2 ring-sky-400/50'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sm hover:scale-[1.02]'
              }`}
              title="Bấm để Zoom vào Cặp Sách (Đăng Nhập / Đăng Ký)"
            >
              <span>Đăng Nhập</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
