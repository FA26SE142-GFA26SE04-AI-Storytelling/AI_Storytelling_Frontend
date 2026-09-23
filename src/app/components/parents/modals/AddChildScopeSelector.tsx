'use client';

import React from 'react';
import { Tag, User, Building2, GraduationCap, RefreshCw, AlertCircle } from 'lucide-react';
import { OrganizationSummary, ClassGroupSummary } from '../../../types/childProfile';

export interface AddChildScopeSelectorProps {
  newChildScope: 'Personal' | 'Organization';
  setNewChildScope: (val: 'Personal' | 'Organization') => void;
  newChildOrgId: number | null;
  setNewChildOrgId: (val: number | null) => void;
  newChildClassGroupId: number | null;
  setNewChildClassGroupId: (val: number | null) => void;
  availableOrgs: OrganizationSummary[];
  availableClasses: ClassGroupSummary[];
  isLoadingOrgsAndClasses: boolean;
  loadOrgsAndClasses: () => void;
}

export const AddChildScopeSelector: React.FC<AddChildScopeSelectorProps> = ({
  newChildScope,
  setNewChildScope,
  newChildOrgId,
  setNewChildOrgId,
  newChildClassGroupId,
  setNewChildClassGroupId,
  availableOrgs,
  availableClasses,
  isLoadingOrgsAndClasses,
  loadOrgsAndClasses,
}) => {
  const filteredClasses = availableClasses.filter(
    (c) => !newChildOrgId || c.organizationId === newChildOrgId
  );

  return (
    <div className="flex flex-col gap-2 pt-1 border-t border-tod-border">
      <label className="text-xs font-bold text-tod-text flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-emerald-500" />
          <span>Lựa chọn Phạm vi Quản lý *</span>
        </span>
        <span className="text-[10px] text-tod-text-muted font-normal">
          Chọn hình thức quản lý phù hợp
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Scope: Personal */}
        <button
          type="button"
          onClick={() => {
            setNewChildScope('Personal');
            setNewChildOrgId(null);
            setNewChildClassGroupId(null);
          }}
          className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
            newChildScope === 'Personal'
              ? 'bg-sky-500/10 border-sky-500/80 shadow-md shadow-sky-500/10 ring-1 ring-sky-500/30'
              : 'bg-tod-surface hover:bg-tod-card border-tod-border'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-bold text-xs text-tod-text flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-500" />
              <span>Cá nhân / Gia đình</span>
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
              Cá nhân
            </span>
          </div>
          <p className="text-[10px] text-tod-text-muted leading-relaxed">
            Dành cho phụ huynh tạo hồ sơ riêng cho con, tự do quản lý việc đọc truyện tại nhà.
          </p>
        </button>

        {/* Scope: Organization */}
        <button
          type="button"
          onClick={() => {
            setNewChildScope('Organization');
            loadOrgsAndClasses();
          }}
          className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
            newChildScope === 'Organization'
              ? 'bg-purple-500/10 border-purple-500/80 shadow-md shadow-purple-500/10 ring-1 ring-purple-500/30'
              : 'bg-tod-surface hover:bg-tod-card border-tod-border'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-bold text-xs text-tod-text flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-500" />
              <span>Trường học / Lớp học</span>
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
              Trường học
            </span>
          </div>
          <p className="text-[10px] text-tod-text-muted leading-relaxed">
            Dành cho giáo viên hoặc nhà trường để quản lý hồ sơ bé theo lớp học cụ thể.
          </p>
        </button>
      </div>

      {/* Select Organization & Class Group */}
      {newChildScope === 'Organization' && (
        <div className="p-3.5 rounded-2xl bg-tod-surface border border-purple-500/30 flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              <span>Thông tin Trường học & Lớp học *</span>
            </span>
            <button
              type="button"
              onClick={loadOrgsAndClasses}
              disabled={isLoadingOrgsAndClasses}
              className="text-[11px] text-purple-600 dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingOrgsAndClasses ? 'animate-spin' : ''}`} />
              <span>Tải lại</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Chọn Trường học */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-tod-text">Trường học / Tổ chức *</label>
              <select
                required={newChildScope === 'Organization'}
                value={newChildOrgId ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setNewChildOrgId(val);
                  setNewChildClassGroupId(null);
                }}
                disabled={isLoadingOrgsAndClasses}
                className="w-full px-3 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="">-- Chọn trường / tổ chức --</option>
                {availableOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.verificationStatus === 'Active' ? 'Hoạt động' : org.verificationStatus})
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Lớp học */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-tod-text">Lớp học đích *</label>
              <select
                required={newChildScope === 'Organization'}
                value={newChildClassGroupId ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setNewChildClassGroupId(val);
                }}
                disabled={isLoadingOrgsAndClasses || !newChildOrgId}
                className="w-full px-3 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
              >
                <option value="">-- Chọn lớp học --</option>
                {filteredClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.status === 'Active' ? 'Đang mở' : cls.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {availableOrgs.length === 0 && !isLoadingOrgsAndClasses && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-amber-700 dark:text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                Bạn chưa tham gia Tổ chức nào đang hoạt động. Vui lòng liên hệ Quản trị viên trường học để được thêm vào trước.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
