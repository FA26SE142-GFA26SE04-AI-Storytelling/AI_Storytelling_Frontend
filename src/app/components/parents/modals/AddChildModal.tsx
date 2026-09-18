'use client';

import React from 'react';
import {
  UserPlus,
  X,
  User,
  Brain,
  Globe,
  Tag,
  Building2,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Check,
} from 'lucide-react';
import { OrganizationSummary, ClassGroupSummary } from '../../../types/childProfile';

export interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  newChildNickname: string;
  setNewChildNickname: (val: string) => void;
  newChildAgeBand: 'Age_6_8' | 'Age_9_12';
  setNewChildAgeBand: (val: 'Age_6_8' | 'Age_9_12') => void;
  newChildLanguage: string;
  setNewChildLanguage: (val: string) => void;
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
  isCreatingChild: boolean;
  createChildModalError: string | null;
  handleCreateChildSubmit: (e: React.FormEvent) => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  isOpen,
  onClose,
  newChildNickname,
  setNewChildNickname,
  newChildAgeBand,
  setNewChildAgeBand,
  newChildLanguage,
  setNewChildLanguage,
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
  isCreatingChild,
  createChildModalError,
  handleCreateChildSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90vh] rounded-3xl bg-tod-card border border-tod-border shadow-2xl flex flex-col overflow-hidden text-tod-text animate-in zoom-in-95 duration-150 pointer-events-auto"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-tod-border bg-tod-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shadow-md">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-tod-text">
                Tạo Hồ Sơ Trẻ Mới
              </h3>
              <p className="text-[11px] text-tod-text-muted">
                Khởi tạo hồ sơ cho bé để cá nhân hóa câu chuyện và trải nghiệm học tập
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleCreateChildSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 dashboard-scrollbar">
          {/* 1. Tên/Biệt danh của bé */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-tod-text flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tên hoặc Biệt danh của bé *</span>
            </label>
            <input
              type="text"
              required
              maxLength={150}
              value={newChildNickname}
              onChange={(e) => setNewChildNickname(e.target.value)}
              placeholder="Ví dụ: Bé Bắp, Sam, Tí Hon..."
              className="dashboard-input text-xs"
            />
            <span className="text-[10px] text-tod-text-muted">
              Tên gọi thân mật của bé trên ứng dụng. Tránh dùng họ tên đầy đủ để bảo vệ danh tính của trẻ.
            </span>
          </div>

          {/* 2. Nhóm tuổi nhận thức */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-tod-text flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-emerald-500" />
              <span>Nhóm tuổi nhận thức (Cognitive Age Band) *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setNewChildAgeBand('Age_6_8')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  newChildAgeBand === 'Age_6_8'
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-tod-surface hover:bg-tod-card border-tod-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-tod-text">6 - 8 tuổi</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      newChildAgeBand === 'Age_6_8'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                        : 'text-tod-text-muted'
                    }`}
                  >
                    Tiểu học cơ bản
                  </span>
                </div>
                <p className="text-[10px] text-tod-text-muted leading-relaxed">
                  Phát triển từ vựng, hình ảnh minh họa sinh động, cốt truyện trực quan và bài học đạo đức gần gũi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setNewChildAgeBand('Age_9_12')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  newChildAgeBand === 'Age_9_12'
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-tod-surface hover:bg-tod-card border-tod-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-tod-text">9 - 12 tuổi</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      newChildAgeBand === 'Age_9_12'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                        : 'text-tod-text-muted'
                    }`}
                  >
                    Khám phá & Nâng cao
                  </span>
                </div>
                <p className="text-[10px] text-tod-text-muted leading-relaxed">
                  Phát triển tư duy phản biện, thế giới quan khoa học & phiêu lưu, cốt truyện nhiều tình tiết và thử thách.
                </p>
              </button>
            </div>
          </div>

          {/* 3. Ngôn ngữ học tập */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-tod-text flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ngôn ngữ kể chuyện & học tập</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setNewChildLanguage('vi')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  newChildLanguage === 'vi'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-300 shadow-sm'
                    : 'bg-tod-surface border-tod-border text-tod-text-muted hover:text-tod-text'
                }`}
              >
                <span>🇻🇳 Tiếng Việt (Mặc định)</span>
              </button>

              <button
                type="button"
                onClick={() => setNewChildLanguage('en')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  newChildLanguage === 'en'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-300 shadow-sm'
                    : 'bg-tod-surface border-tod-border text-tod-text-muted hover:text-tod-text'
                }`}
              >
                <span>🇬🇧 English (Tiếng Anh)</span>
              </button>
            </div>
          </div>

          {/* 4. Lựa chọn Phạm vi (Scope) */}
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
          </div>

          {/* 5. Khối chọn Organization và Class Group (BẮT BUỘC KHI SCOPE = ORGANIZATION) */}
          {newChildScope === 'Organization' && (
            <div className="p-3.5 rounded-2xl bg-tod-surface border border-purple-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-500" />
                  <span>Thông tin Trường học & Lớp học *</span>
                </span>
                <button
                  type="button"
                  onClick={loadOrgsAndClasses}
                  disabled={isLoadingOrgsAndClasses}
                  className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingOrgsAndClasses ? 'animate-spin' : ''}`} />
                  <span>Tải lại</span>
                </button>
              </div>

              {/* Dropdown Organization */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-tod-text flex items-center justify-between">
                  <span>1. Chọn Trường học / Tổ chức *</span>
                </label>

                {isLoadingOrgsAndClasses ? (
                  <div className="py-2 text-xs text-tod-text-muted flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin text-purple-500" />
                    <span>Đang tải danh sách tổ chức...</span>
                  </div>
                ) : availableOrgs.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] flex flex-col gap-1">
                    <span>
                      ⚠️ Bạn chưa tham gia Tổ chức nào (hoặc tài khoản hiện tại không có quyền giáo viên/quản trị trường).
                    </span>
                    <span className="text-[10px] text-tod-text-muted">
                      Nếu bạn là phụ huynh, vui lòng chuyển sang "Cá nhân / Gia đình".
                    </span>
                  </div>
                ) : (
                  <select
                    value={newChildOrgId ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setNewChildOrgId(val);
                      setNewChildClassGroupId(null);
                    }}
                    className="dashboard-input cursor-pointer"
                  >
                    <option value="">-- Chọn một tổ chức trường học --</option>
                    {availableOrgs.map((org) => {
                      const isActive = org.verificationStatus === 'Active';
                      return (
                        <option
                          key={org.id}
                          value={org.id}
                          disabled={!isActive}
                          className={!isActive ? 'text-tod-text-muted bg-tod-surface' : 'text-tod-text bg-tod-card'}
                        >
                          {org.name} {isActive ? '✓ (Hoạt động)' : `— (${org.verificationStatus || 'Chờ duyệt'})`}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Dropdown Class Group */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-tod-text flex items-center justify-between">
                  <span>2. Chọn Lớp học *</span>
                </label>

                {!newChildOrgId ? (
                  <div className="px-3 py-2 rounded-xl bg-tod-card border border-tod-border text-tod-text-muted text-xs italic">
                    Vui lòng chọn Trường học / Tổ chức ở trên trước
                  </div>
                ) : (
                  (() => {
                    const orgClasses = availableClasses.filter(
                      (c) => c.organizationId === newChildOrgId && c.status === 'Active'
                    );
                    if (orgClasses.length === 0) {
                      return (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px]">
                          Không tìm thấy Lớp học nào đang hoạt động trong tổ chức này. Vui lòng tạo lớp học trước trong mục Quản lý lớp.
                        </div>
                      );
                    }
                    return (
                      <select
                        value={newChildClassGroupId ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null;
                          setNewChildClassGroupId(val);
                        }}
                        className="dashboard-input cursor-pointer"
                      >
                        <option value="">-- Chọn lớp học --</option>
                        {orgClasses.map((cls) => (
                          <option key={cls.id} value={cls.id} className="text-tod-text bg-tod-card">
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {/* 6. Dữ liệu cá nhân hóa tối thiểu & Nguyên tắc bảo vệ trẻ em */}
          <div className="p-3 rounded-2xl bg-tod-surface border border-emerald-500/20 text-tod-text text-[11px] flex items-start gap-2.5 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-600 dark:text-emerald-300">Bảo mật thông tin của trẻ:</strong> Hệ thống chỉ sử dụng biệt danh và độ tuổi nhận thức để lựa chọn nội dung phù hợp. Chúng tôi luôn cam kết bảo vệ thông tin và quyền riêng tư của bé.
            </div>
          </div>

          {/* Modal Error */}
          {createChildModalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-semibold">{createChildModalError}</span>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-tod-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreatingChild}
              className="px-4 py-2 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text text-xs font-semibold cursor-pointer transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={
                isCreatingChild ||
                !newChildNickname.trim() ||
                (newChildScope === 'Organization' && (!newChildOrgId || !newChildClassGroupId))
              }
              className="btn-dashboard-primary text-xs"
            >
              {isCreatingChild ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tạo hồ sơ...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tạo Hồ Sơ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
