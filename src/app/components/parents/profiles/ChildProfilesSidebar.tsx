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
} from 'lucide-react';
import { ChildProfile } from '../../../types/childProfile';
import { DashboardStatusBadge } from '../common/DashboardStatusBadge';

export interface ChildProfilesSidebarProps {
  childProfiles: ChildProfile[];
  selectedChildId: number | null;
  onSelectChild: (id: number) => void;
  isLoadingChildren: boolean;
  onOpenAddChildModal: () => void;
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
    <div className="laptop-right-card w-full lg:w-[380px] shrink-0 p-4 rounded-3xl bg-zinc-950/90 backdrop-blur-2xl border border-sky-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-white flex flex-col gap-3.5 max-h-[75vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white">Hồ Sơ Các Bé</h2>
            <span className="text-[10px] text-zinc-400">({childProfiles.length} tài khoản bé)</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            title="Tải lại danh sách bé"
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingChildren ? 'animate-spin text-sky-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onOpenAddChildModal}
            className="px-2 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Bé</span>
          </button>
        </div>
      </div>

      {/* Profiles List */}
      <div className="flex-1 overflow-y-auto dashboard-scrollbar space-y-2 max-h-[calc(100vh-280px)] pr-1">
        {isLoadingChildren ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
            <span>Đang tải danh sách hồ sơ bé...</span>
          </div>
        ) : childProfiles.length === 0 ? (
          <div className="py-10 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-center flex flex-col items-center gap-2 text-zinc-400 text-xs">
            <User className="w-8 h-8 text-zinc-600" />
            <span className="font-semibold text-zinc-300">Chưa có hồ sơ bé nào</span>
            <p className="text-[11px] text-zinc-500">
              Hãy tạo hồ sơ bé đầu tiên để cá nhân hóa lộ trình học tập và an toàn AI.
            </p>
            <button
              type="button"
              onClick={onOpenAddChildModal}
              className="mt-2 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-500/20"
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
                    ? 'bg-sky-950/40 border-sky-500/60 shadow-lg shadow-sky-500/10'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                {/* Top Row: Avatar, Nickname, Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        isSelected
                          ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {child.nickname ? child.nickname.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white truncate max-w-[120px]">
                        {child.nickname}
                      </h3>
                      <span className="text-[10px] text-zinc-400 font-medium">
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
