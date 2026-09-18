'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, Archive } from 'lucide-react';

export interface DashboardStatusBadgeProps {
  status: string;
  className?: string;
}

export const DashboardStatusBadge: React.FC<DashboardStatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'Active':
      return (
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 bg-emerald-950/70 border-emerald-500/40 text-emerald-300 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Đang hoạt động</span>
        </span>
      );
    case 'Draft':
      return (
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 bg-amber-950/70 border-amber-500/40 text-amber-300 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Bản nháp</span>
        </span>
      );
    case 'PendingParentConsent':
      return (
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 bg-amber-950/70 border-amber-500/40 text-amber-300 ${className}`}
        >
          <Clock className="w-3 h-3 text-amber-400" />
          <span>Chờ đồng ý</span>
        </span>
      );
    case 'Archived':
      return (
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 bg-zinc-900 border-zinc-700 text-zinc-400 ${className}`}
        >
          <Archive className="w-3 h-3 text-zinc-500" />
          <span>Đã lưu trữ</span>
        </span>
      );
    case 'SafetyConfigured':
      return (
        <span
          className={`px-2.5 py-0.5 rounded-full border text-[11px] font-black tracking-wide uppercase flex items-center gap-1.5 bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-500/20 ${className}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Safety Configured</span>
        </span>
      );
    default:
      return (
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 bg-zinc-800 border-zinc-700 text-zinc-300 ${className}`}
        >
          <span>{status}</span>
        </span>
      );
  }
};
