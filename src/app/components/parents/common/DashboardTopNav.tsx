'use client';

import React from 'react';
import {
  ArrowLeft,
  Sunrise,
  Sun,
  Moon,
  Laptop,
  Users,
  Sliders,
  Sparkles,
  ShieldCheck,
  UserPlus,
  Grid,
} from 'lucide-react';
import { TimeOfDay } from '../../three/RoomCanvas';

export interface DashboardTopNavProps {
  onStageChange?: (stageIndex: number) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay) => void;
  onToggleViewMode?: () => void;
  is2DViewAvailable?: boolean;
  activeTab?: 'analytics' | 'controls' | 'supervision' | 'prompts';
  setActiveTab?: (tab: 'analytics' | 'controls' | 'supervision' | 'prompts') => void;
  onOpenAcceptInviteModal?: () => void;
  user?: {
    fullName?: string;
    username?: string;
    role?: string;
    email?: string;
  } | null;
}

export const DashboardTopNav: React.FC<DashboardTopNavProps> = ({
  onStageChange,
  timeOfDay,
  onTimeOfDayChange,
  onToggleViewMode,
  is2DViewAvailable = false,
  activeTab,
  setActiveTab,
  onOpenAcceptInviteModal,
  user,
}) => {
  return (
    <header className="laptop-top-bar pointer-events-auto w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:px-5 sm:py-3 rounded-2xl bg-zinc-950/85 backdrop-blur-xl border border-sky-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.6)] text-white shrink-0">
      {/* Brand & Return */}
      <div className="flex items-center gap-3">
        {onStageChange && (
          <button
            type="button"
            onClick={() => onStageChange(0)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
            title="Quay lại góc nhìn toàn cảnh phòng 3D"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span className="hidden xs:inline">Toàn Cảnh</span>
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-sky-500/30 shrink-0">
            <Laptop className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm sm:text-base tracking-tight bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                Bảng Điều Khiển Của Phụ Huynh
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-extrabold text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Trực Tuyến
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">
              Theo dõi tiến trình đọc, cảm xúc EQ và thiết lập bảo vệ bé thời gian thực
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs">
        <button
          type="button"
          data-tab="analytics"
          onClick={() => setActiveTab?.('analytics')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Hồ Sơ & Học Tập</span>
        </button>

        <button
          type="button"
          data-tab="controls"
          onClick={() => setActiveTab?.('controls')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'controls'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Quy Tắc An Toàn</span>
        </button>

        <button
          type="button"
          data-tab="supervision"
          onClick={() => setActiveTab?.('supervision')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'supervision'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Giám Sát & Lời Mời</span>
        </button>

        <button
          type="button"
          data-tab="prompts"
          onClick={() => setActiveTab?.('prompts')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'prompts'
              ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cài Đặt AI</span>
        </button>
      </div>

      {/* Right Controls: User Profile Pill, TimeOfDay, 2D View Switcher */}
      <div className="flex items-center gap-2 shrink-0">
        {user && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center font-black text-[11px] text-zinc-950">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username ? user.username.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="text-left">
              <span className="text-[11px] font-bold text-white block leading-tight">
                {user.fullName || user.username || 'Phụ Huynh'}
              </span>
              <span className="text-[9px] text-emerald-400 block leading-tight font-medium">
                {user.role || 'Phụ Huynh'}
              </span>
            </div>
          </div>
        )}

        {/* Time of Day Switcher */}
        <div className="flex items-center p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 text-[11px] font-extrabold">
          <button
            type="button"
            onClick={() => onTimeOfDayChange('morning')}
            className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              timeOfDay === 'morning' ? 'bg-sky-500 text-zinc-950 font-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
            title="Buổi Sáng"
          >
            <Sunrise className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onTimeOfDayChange('afternoon')}
            className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              timeOfDay === 'afternoon' ? 'bg-amber-500 text-zinc-950 font-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
            title="Buổi Chiều"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onTimeOfDayChange('night')}
            className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              timeOfDay === 'night' ? 'bg-indigo-500 text-white font-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
            title="Buổi Tối"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Optional 2D View Switcher */}
        {is2DViewAvailable && onToggleViewMode && (
          <button
            type="button"
            onClick={onToggleViewMode}
            className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bảng 2D</span>
          </button>
        )}
      </div>
    </header>
  );
};
