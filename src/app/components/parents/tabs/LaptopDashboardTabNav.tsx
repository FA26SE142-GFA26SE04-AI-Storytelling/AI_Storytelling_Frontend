'use client';

import React from 'react';
import {
  User,
  ShieldCheck,
  Users,
  Sparkles,
  BookOpen,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import { LaptopDashboardTab } from '../common/DashboardTopNav';

interface LaptopDashboardTabNavProps {
  activeTab: LaptopDashboardTab;
  setActiveTab: (tab: LaptopDashboardTab) => void;
}

const TABS = [
  {
    id: 'analytics' as const,
    label: 'Hồ Sơ',
    fullLabel: 'Hồ Sơ Bé & Học Tập',
    icon: User,
    activeColor: 'text-sky-400',
    activeBg: 'bg-sky-500/25 border-sky-400/50 text-sky-200 shadow-sky-500/10',
  },
  {
    id: 'assignments' as const,
    label: 'Giao Bài',
    fullLabel: 'Kế Hoạch & Giao Bài',
    icon: BookOpen,
    activeColor: 'text-indigo-400',
    activeBg: 'bg-indigo-500/25 border-indigo-400/50 text-indigo-200 shadow-indigo-500/10',
  },
  {
    id: 'community' as const,
    label: 'Lớp Học',
    fullLabel: 'Lớp Học & Chia Sẻ',
    icon: Share2,
    activeColor: 'text-purple-400',
    activeBg: 'bg-purple-500/25 border-purple-400/50 text-purple-200 shadow-purple-500/10',
  },
  {
    id: 'interventions' as const,
    label: 'Hỗ Trợ',
    fullLabel: 'Can Thiệp & Hỗ Trợ Sư Phạm',
    icon: AlertTriangle,
    activeColor: 'text-amber-400',
    activeBg: 'bg-amber-500/25 border-amber-400/50 text-amber-200 shadow-amber-500/10',
  },
  {
    id: 'controls' as const,
    label: 'An Toàn',
    fullLabel: 'Kiểm Soát An Toàn',
    icon: ShieldCheck,
    activeColor: 'text-teal-400',
    activeBg: 'bg-teal-500/25 border-teal-400/50 text-teal-200 shadow-teal-500/10',
  },
  {
    id: 'supervision' as const,
    label: 'Giám Sát',
    fullLabel: 'Quản Lý Người Giám Sát',
    icon: Users,
    activeColor: 'text-emerald-400',
    activeBg: 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200 shadow-emerald-500/10',
  },
  {
    id: 'prompts' as const,
    label: 'Gợi Ý',
    fullLabel: 'Gợi Ý Trò Chuyện & Sáng Tạo',
    icon: Sparkles,
    activeColor: 'text-rose-400',
    activeBg: 'bg-rose-500/25 border-rose-400/50 text-rose-200 shadow-rose-500/10',
  },
];

export const LaptopDashboardTabNav: React.FC<LaptopDashboardTabNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="w-full p-1.5 sm:p-2 bg-tod-card/90 border-b border-tod-border flex items-center justify-between gap-1 sm:gap-1.5 shrink-0 transition-colors duration-500 overflow-hidden">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            title={tab.fullLabel}
            className={`flex-1 min-w-0 py-2 px-1 sm:px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 border ${
              isActive
                ? `${tab.activeBg} font-black shadow-md scale-[1.02]`
                : 'border-transparent text-tod-text-muted hover:text-tod-text hover:bg-tod-surface/70 hover:border-tod-border/40'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? tab.activeColor : 'opacity-80'}`} />
            <span className="truncate text-[11px] sm:text-xs tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
