'use client';

import React from 'react';
import {
  UserPlus,
  X,
  User,
  Brain,
  Globe,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { OrganizationSummary, ClassGroupSummary } from '../../../types/childProfile';
import { AddChildScopeSelector } from './AddChildScopeSelector';

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
              placeholder="Ví dụ: Bé Bo, An Nhiên, Tony..."
              className="w-full px-4 py-2.5 rounded-2xl bg-tod-surface border border-tod-border text-tod-text placeholder:text-tod-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          {/* 2. Nhóm tuổi phát triển (AgeBand) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-tod-text flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-emerald-500" />
              <span>Nhóm tuổi phát triển & Nhận thức *</span>
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

          {/* 4. Lựa chọn Phạm vi (Scope) & Organization Selector */}
          <AddChildScopeSelector
            newChildScope={newChildScope}
            setNewChildScope={setNewChildScope}
            newChildOrgId={newChildOrgId}
            setNewChildOrgId={setNewChildOrgId}
            newChildClassGroupId={newChildClassGroupId}
            setNewChildClassGroupId={setNewChildClassGroupId}
            availableOrgs={availableOrgs}
            availableClasses={availableClasses}
            isLoadingOrgsAndClasses={isLoadingOrgsAndClasses}
            loadOrgsAndClasses={loadOrgsAndClasses}
          />

          {/* Business & COPPA Note */}
          <div className="p-3 rounded-2xl bg-tod-surface border border-tod-border flex items-start gap-2 text-tod-text-muted text-[11px] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Hồ sơ trẻ độc lập được bảo vệ hoàn toàn theo tiêu chuẩn COPPA.
            </span>
          </div>

          {/* Error display */}
          {createChildModalError && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-600 dark:text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{createChildModalError}</span>
            </div>
          )}

          {/* Modal Footer / Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text text-xs font-bold transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isCreatingChild || !newChildNickname.trim()}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isCreatingChild && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isCreatingChild ? 'Đang tạo hồ sơ...' : 'Tạo Hồ Sơ Bé'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
