'use client';

import React from 'react';
import {
  Users,
  Plus,
  RefreshCw,
  User,
  Zap,
  Building2,
  GraduationCap,
  QrCode,
} from 'lucide-react';
import { ChildProfile } from '../../../types/childProfile';
import { DashboardStatusBadge } from '../common/DashboardStatusBadge';

export interface ChildProfilesSidebarProps {
  childProfiles: ChildProfile[];
  selectedChildId: number | null;
  onSelectChild: (id: number) => void;
  isLoadingChildren: boolean;
  onOpenAddChildModal: () => void;
  onOpenAcceptInviteModal?: () => void;
  onActivateChild: (childId: number, nickname: string, ageBand: string) => void;
  activatingChildId: number | null;
  onRefresh: () => void;
}

export const ChildProfilesSidebar: React.FC<ChildProfilesSidebarProps> = ({
  childProfiles,
  selectedChildId,
  onSelectChild,
  isLoadingChildren,
  onOpenAddChildModal,
  onOpenAcceptInviteModal,
  onActivateChild,
  activatingChildId,
  onRefresh,
}) => {
  const formatAgeBand = (ageBand: string) => {
    switch (ageBand) {
      case 'Age_6_8':
      case 'Age6To8':
        return '6 - 8 tuổi';
      case 'Age_9_12':
      case 'Age9To12':
        return '9 - 12 tuổi';
      case 'Age_3_5':
      case 'Age3To5':
        return '3 - 5 tuổi';
      default:
        return ageBand || 'Chưa đặt tuổi';
    }
  };

  return (
    <div className="w-full h-full p-4 flex flex-col gap-3.5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-white whitespace-nowrap truncate">Hồ Sơ Các Bé</h2>
            <span className="text-[10px] text-zinc-300 font-medium whitespace-nowrap">({childProfiles.length} tài khoản bé)</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            title="Tải lại danh sách bé"
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingChildren ? 'animate-spin text-sky-400' : ''}`} />
          </button>
          {onOpenAcceptInviteModal && (
            <button
              type="button"
              onClick={onOpenAcceptInviteModal}
              title="Nhập mã mời hoặc quét QR để nhận giám sát"
              className="px-2 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 hover:bg-emerald-900 text-emerald-300 font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Nhập Mã</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAddChildModal}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Bé</span>
          </button>
        </div>
      </div>

      {/* Profiles List */}
      <div className="flex-1 overflow-y-auto dashboard-scrollbar space-y-2 pr-1">
        {isLoadingChildren ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
            <span>Đang tải danh sách hồ sơ bé...</span>
          </div>
        ) : childProfiles.length === 0 ? (
          <div className="py-10 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-center flex flex-col items-center gap-2 text-zinc-300 text-xs">
            <User className="w-8 h-8 text-zinc-500" />
            <span className="font-semibold text-white">Chưa có hồ sơ bé nào</span>
            <p className="text-[11px] text-zinc-400">
              Hãy tạo hồ sơ bé đầu tiên để cá nhân hóa lộ trình học tập và an toàn AI.
            </p>
            <button
              type="button"
              onClick={onOpenAddChildModal}
              className="mt-2 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-500/20 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo hồ sơ bé ngay</span>
            </button>
          </div>
        ) : (
          childProfiles.map((child) => {
            const isSelected = selectedChildId === child.id;
            const isActivating = activatingChildId === child.id;

            return (
              <div
                key={child.id}
                onClick={() => onSelectChild(child.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                  isSelected
                    ? 'bg-sky-950/50 border-sky-400/80 shadow-lg shadow-sky-500/15 ring-1 ring-sky-500/30'
                    : 'bg-zinc-900/70 border-zinc-800/90 hover:bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                {/* Top Row: Avatar, Nickname, Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        isSelected
                          ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30'
                          : 'bg-zinc-800 text-zinc-200'
                      }`}
                    >
                      {child.nickname ? child.nickname.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white truncate max-w-[130px]">
                        {child.nickname}
                      </h3>
                      <span className="text-[11px] text-zinc-300 font-medium">
                        {formatAgeBand(child.ageBand)}
                      </span>
                    </div>
                  </div>

                  <DashboardStatusBadge status={child.status} />
                </div>

                {/* Scope & Class Tag */}
                <div className="flex items-center gap-1.5 text-[10px]">
                  {child.scope === 'Organization' ? (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-semibold flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>Trường học</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 font-semibold flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      <span>Cá nhân</span>
                    </span>
                  )}

                  {child.status === 'Draft' && (
                    <button
                      type="button"
                      disabled={isActivating}
                      onClick={(e) => {
                        e.stopPropagation();
                        onActivateChild(child.id, child.nickname, child.ageBand);
                      }}
                      className="ml-auto px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isActivating ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>Kích hoạt</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
