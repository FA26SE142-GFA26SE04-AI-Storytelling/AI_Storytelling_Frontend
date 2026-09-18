'use client';

import React from 'react';
import {
  User,
  Edit3,
  Trash2,
  Save,
  X,
  RefreshCw,
  Building2,
  GraduationCap,
  Globe,
  Calendar,
  AlertTriangle,
  CheckCheck,
} from 'lucide-react';
import { ChildProfile, OrganizationSummary, ClassGroupSummary } from '../../../types/childProfile';
import { DashboardStatusBadge } from '../common/DashboardStatusBadge';

export interface ChildProfileDetailCardProps {
  selectedChild: ChildProfile;
  isEditingChild: boolean;
  setIsEditingChild: (val: boolean) => void;
  editNickname: string;
  setEditNickname: (val: string) => void;
  editAgeBand: string;
  setEditAgeBand: (val: string) => void;
  editLanguage: string;
  setEditLanguage: (val: string) => void;
  isSavingEdit: boolean;
  handleSaveEditChild: () => void;
  editSuccessMsg: string | null;
  isConfirmingDelete: boolean;
  setIsConfirmingDelete: (val: boolean) => void;
  isDeletingChild: boolean;
  handleDeleteChild: () => void;
  deleteError: string | null;
  onOpenLinkClassModal?: () => void;
  availableOrgs: OrganizationSummary[];
  availableClasses: ClassGroupSummary[];
}

export const ChildProfileDetailCard: React.FC<ChildProfileDetailCardProps> = ({
  selectedChild,
  isEditingChild,
  setIsEditingChild,
  editNickname,
  setEditNickname,
  editAgeBand,
  setEditAgeBand,
  editLanguage,
  setEditLanguage,
  isSavingEdit,
  handleSaveEditChild,
  editSuccessMsg,
  isConfirmingDelete,
  setIsConfirmingDelete,
  isDeletingChild,
  handleDeleteChild,
  deleteError,
  onOpenLinkClassModal,
  availableOrgs,
  availableClasses,
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

  const orgName = availableOrgs.find((o) => o.id === selectedChild.organizationId)?.name;
  const className = availableClasses.find((c) => c.id === selectedChild.classGroupId)?.name;

  return (
    <div className="laptop-tab-content-row p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-3">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-sky-500/20">
            {selectedChild.nickname ? selectedChild.nickname.charAt(0).toUpperCase() : 'B'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black text-white">{selectedChild.nickname}</h2>
              <DashboardStatusBadge status={selectedChild.status} />
            </div>
            <span className="text-[10px] text-zinc-400">ID Hồ Sơ: #{selectedChild.id}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {!isEditingChild ? (
            <button
              type="button"
              onClick={() => {
                setEditNickname(selectedChild.nickname);
                setEditAgeBand(selectedChild.ageBand);
                setEditLanguage(selectedChild.language || 'vi');
                setIsEditingChild(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEditChild}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Lưu</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingChild(false)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!isConfirmingDelete ? (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              title="Xóa hồ sơ bé"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/60 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-rose-950/40 border border-rose-500/40 p-1 rounded-lg">
              <button
                type="button"
                disabled={isDeletingChild}
                onClick={handleDeleteChild}
                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer hover:bg-rose-500"
              >
                {isDeletingChild ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="p-0.5 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline Edit or Info Display */}
      {isEditingChild ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-1">Biệt danh của bé</label>
            <input
              type="text"
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              className="dashboard-input"
              placeholder="VD: Bé Bông..."
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-1">Nhóm tuổi</label>
            <select
              value={editAgeBand}
              onChange={(e) => setEditAgeBand(e.target.value)}
              className="dashboard-input cursor-pointer"
            >
              <option value="Age_3_5">3 - 5 tuổi (Mầm non)</option>
              <option value="Age_6_8">6 - 8 tuổi (Tiểu học cơ bản)</option>
              <option value="Age_9_12">9 - 12 tuổi (Tiểu học nâng cao)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-1">Ngôn ngữ chính</label>
            <select
              value={editLanguage}
              onChange={(e) => setEditLanguage(e.target.value)}
              className="dashboard-input cursor-pointer"
            >
              <option value="vi">Tiếng Việt (Mặc định)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Nhóm tuổi nhận thức
            </span>
            <span className="font-bold text-zinc-200">{formatAgeBand(selectedChild.ageBand)}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Ngôn ngữ học tập
            </span>
            <span className="font-bold text-zinc-200">
              {selectedChild.language === 'en' ? 'Tiếng Anh (English)' : 'Tiếng Việt (Mặc định)'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              Phạm vi quản lý (Scope)
            </span>
            <span className="font-bold text-zinc-200">
              {selectedChild.scope === 'Organization' ? 'Trường học / Tổ chức' : 'Gia đình / Cá nhân'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              Trường & Lớp học
            </span>
            {selectedChild.scope === 'Organization' ? (
              <span className="font-bold text-indigo-300 truncate">
                {orgName || 'Trường học'} • {className || 'Lớp học'}
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenLinkClassModal}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-bold text-left cursor-pointer hover:underline"
              >
                + Liên kết Lớp học
              </button>
            )}
          </div>
        </div>
      )}

      {/* Feedback Alerts */}
      {editSuccessMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{editSuccessMsg}</span>
        </div>
      )}

      {deleteError && (
        <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{deleteError}</span>
        </div>
      )}
    </div>
  );
};
