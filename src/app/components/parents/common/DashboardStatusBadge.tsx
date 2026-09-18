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
          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Đang hoạt động</span>
        </span>
      );
    case 'Draft':
      return (
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
          <span>Bản nháp</span>
        </span>
      );
    case 'PendingParentConsent':
    case 'Pending Parent Consent':
    case 'pending_parent_consent':
    case 'PendingParentApproval':
      return (
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300 ${className}`}
        >
          <Clock className="w-3 h-3 text-amber-500 shrink-0" />
          <span>Chờ phụ huynh</span>
        </span>
      );
    case 'Archived':
      return (
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 bg-tod-surface border-tod-border text-tod-text-muted ${className}`}
        >
          <Archive className="w-3 h-3 text-tod-text-muted shrink-0" />
          <span>Đã lưu trữ</span>
        </span>
      );
    case 'SafetyConfigured':
      return (
        <span
          className={`px-2.5 py-0.5 rounded-full border text-[11px] font-black tracking-wide uppercase flex items-center gap-1.5 bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 shadow-sm shadow-emerald-500/10 ${className}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Safety Configured</span>
        </span>
      );
    default:
      return (
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 bg-tod-surface border-tod-border text-tod-text ${className}`}
        >
          <span>{status}</span>
        </span>
      );
  }
};
