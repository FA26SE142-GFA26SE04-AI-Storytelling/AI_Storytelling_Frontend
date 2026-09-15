'use client';

import React from 'react';
import Link from 'next/link';
import { TimeOfDay, STAGES } from './RoomCanvas';
import { useAuth } from '../../context/AuthContext';
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
} from 'lucide-react';

export interface RoomHeaderProps {
  currentStage: number;
  onStageChange: (index: number) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay) => void;
  isVisible?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  currentStage,
  onStageChange,
  timeOfDay,
  onTimeOfDayChange,
  isVisible = true,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { user, isLoggedIn, backendOnline, backendStatusMessage, pingBackend } = useAuth();
  const stationIcons = [Layers, Clock, BookOpen, DoorOpen, ShieldCheck, Briefcase];

  return (
    <header
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`fixed top-0 left-0 right-0 w-full z-40 transition-all duration-300 ease-in-out transform-gpu ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-full bg-zinc-900/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-b border-white/10 dark:border-zinc-800/80 shadow-lg px-4 sm:px-8 py-3 flex items-center justify-between gap-4 text-white select-none">
        
        {/* 1. Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 group p-1 rounded-xl hover:bg-white/10 transition-all"
            title="Trang Chủ MagicTales 3D Studio"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 fill-white/20" />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="font-black text-sm tracking-tight bg-gradient-to-r from-amber-300 via-rose-400 to-indigo-300 bg-clip-text text-transparent">
                MagicTales 3D
              </span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest -mt-0.5">
                Studio Phòng 3D
              </span>
            </div>
          </Link>
        </div>

        {/* 2. Center 3D Station Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 overflow-x-auto max-w-2xl">
          {STAGES.map((stg, idx) => {
            const Icon = stationIcons[idx] || Layers;
            const isActive = currentStage === idx;
            return (
              <button
                key={stg.id}
                onClick={() => onStageChange(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-amber-400'}`} />
                <span>{stg.name.split(' (')[0]}</span>
              </button>
            );
          })}
        </nav>

        {/* 3. Right Atmosphere & User Account Action Bar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Connection Status Dot */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-950/90 border border-zinc-800/90 text-xs"
            title={backendStatusMessage}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : backendOnline === false ? 'bg-rose-500' : 'bg-amber-400'}`} />
            <span className="font-extrabold text-[11px] text-zinc-200">
              {backendOnline ? 'Online' : backendOnline === false ? 'Offline' : '...'}
            </span>
            <button
              onClick={pingBackend}
              className="p-0.5 text-zinc-400 hover:text-white transition-colors cursor-pointer ml-0.5"
              title="Làm mới kiểm tra kết nối Backend"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Time of Day Switcher Pills */}
          <div className="hidden sm:flex items-center p-1 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-[11px] font-extrabold">
            <button
              onClick={() => onTimeOfDayChange('morning')}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'morning'
                  ? 'bg-sky-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Buổi Sáng"
            >
              <Sunrise className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sáng</span>
            </button>

            <button
              onClick={() => onTimeOfDayChange('afternoon')}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'afternoon'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Buổi Chiều"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chiều</span>
            </button>

            <button
              onClick={() => onTimeOfDayChange('night')}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'night'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Buổi Tối"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tối</span>
            </button>
          </div>

          {/* User Account / Login Button */}
          {isLoggedIn && user ? (
            <button
              onClick={() => onStageChange(5)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                currentStage === 5
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.03] ring-2 ring-emerald-400/50'
                  : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/50 shadow-md'
              }`}
              title="Bấm để Zoom vào Cặp Sách 3D xem tài khoản"
            >
              <div className="w-5 h-5 rounded-lg bg-emerald-400/30 flex items-center justify-center font-black text-[10px] text-emerald-200">
                {(user.fullName || user.username).charAt(0).toUpperCase()}
              </div>
              <span className="font-extrabold text-xs truncate max-w-[150px]">
                {user.fullName || user.username}
              </span>
            </button>
          ) : (
            <button
              onClick={() => onStageChange(5)}
              className={`flex items-center px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                currentStage === 5
                  ? 'bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 text-white shadow-lg shadow-sky-500/30 scale-[1.03] ring-2 ring-sky-400/50'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md hover:scale-[1.02]'
              }`}
              title="Bấm để Zoom vào Cặp Sách (Đăng Nhập / Đăng Ký)"
            >
              <span>Đăng Nhập / Đăng Ký</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
