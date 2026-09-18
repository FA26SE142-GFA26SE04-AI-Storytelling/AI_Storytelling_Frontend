'use client';

import React from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { SafetyPolicy, ContentCategory } from '../../../types/childProfile';

export interface SafetySummaryCardProps {
  safetyPolicy: SafetyPolicy | null;
  contentCategories: ContentCategory[];
  isLoadingDetail: boolean;
  onNavigateToControls: () => void;
  onRefresh: () => void;
}

export const SafetySummaryCard: React.FC<SafetySummaryCardProps> = ({
  safetyPolicy,
  contentCategories,
  isLoadingDetail,
  onNavigateToControls,
  onRefresh,
}) => {
  return (
    <div className="laptop-tab-content-row p-4 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-3 text-tod-text transition-colors duration-500 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-tod-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-bold text-tod-text">
            Quy Tắc An Toàn (Safety Policy)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Bảo vệ an toàn
          </span>
          <button
            type="button"
            onClick={onRefresh}
            title="Làm mới Safety Policy"
            className="p-1 rounded-lg bg-tod-surface hover:bg-tod-card text-tod-text-muted hover:text-tod-text border border-tod-border transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingDetail ? 'animate-spin text-sky-500' : ''}`} />
          </button>
        </div>
      </div>

      {isLoadingDetail ? (
        <div className="py-4 flex items-center justify-center gap-2 text-tod-text-muted text-xs">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
          <span>Đang nạp dữ liệu Safety Policy từ máy chủ...</span>
        </div>
      ) : safetyPolicy ? (
        <div className="space-y-3 text-xs">
          {/* Top Status & Link to Controls */}
          <div className="p-3 rounded-xl bg-tod-surface border border-tod-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-tod-text-muted">Trạng thái an toàn:</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black border tracking-wide uppercase bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Safety Configured
              </span>
            </div>
            <button
              type="button"
              onClick={onNavigateToControls}
              className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Chỉnh sửa quy tắc</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. maxStoryLength */}
            <div className="p-3 rounded-xl bg-tod-surface border border-tod-border flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-tod-text-muted">
                Giới hạn độ dài truyện
              </span>
              <span className="font-bold text-tod-text text-sm">
                {safetyPolicy.maxStoryLength.toLocaleString()} ký tự
              </span>
            </div>

            {/* 2. requiredApprovalMode */}
            <div className="p-3 rounded-xl bg-tod-surface border border-tod-border flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-tod-text-muted">
                Chế độ phê duyệt
              </span>
              <span className="font-bold text-sky-600 dark:text-sky-300 text-xs">
                {safetyPolicy.requiredApprovalMode === 'AutoPublishOnThreshold'
                  ? '⚡ Tự động khi đạt an toàn (Auto-Publish)'
                  : '🛡️ Phụ huynh duyệt thủ công (Always Manual)'}
              </span>
            </div>

            {/* 3. parentalGateEnabled */}
            <div className="p-3 rounded-xl bg-tod-surface border border-tod-border flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-tod-text-muted">
                Cổng an toàn (Parental Gate)
              </span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span
                  className={`px-2 py-0.5 rounded-full border text-[11px] font-bold flex items-center gap-1.5 ${
                    safetyPolicy.parentalGateEnabled
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300'
                      : 'bg-tod-card border-tod-border text-tod-text-muted'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>{safetyPolicy.parentalGateEnabled ? 'Đang bật bảo vệ' : 'Đang tắt'}</span>
                </span>
              </div>
            </div>

            {/* 4. consentRecorded */}
            <div className="p-3 rounded-xl bg-tod-surface border border-tod-border flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-tod-text-muted">
                Đồng thuận & Bảo vệ dữ liệu
              </span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span
                  className={`px-2 py-0.5 rounded-full border text-[11px] font-bold flex items-center gap-1.5 ${
                    safetyPolicy.consentRecorded
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{safetyPolicy.consentRecorded ? 'Đã ghi nhận đồng thuận' : 'Chưa ghi nhận'}</span>
                </span>
              </div>
            </div>

            {/* 5. categories */}
            <div className="sm:col-span-2 p-3 rounded-xl bg-tod-surface border border-tod-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-tod-text-muted">
                  Quy tắc danh mục nội dung ({safetyPolicy.categories?.length ?? 0} danh mục)
                </span>
                <span className="text-[10px] text-tod-text-muted">
                  Nội dung cấm sẽ override sáng tạo
                </span>
              </div>

              {safetyPolicy.categories && safetyPolicy.categories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {safetyPolicy.categories.map((cat, idx) => {
                    const catInfo = contentCategories.find((c) => c.id === cat.contentCategoryId);
                    const name = catInfo?.displayName || `Danh mục #${cat.contentCategoryId}`;
                    const isBlocked = cat.rule === 'Blocked';
                    const isRestricted = cat.rule === 'Restricted';

                    return (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-tod-card border border-tod-border flex items-center justify-between text-xs"
                      >
                        <span className="text-tod-text font-medium truncate max-w-[160px]">
                          {name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isBlocked
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
                              : isRestricted
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {isBlocked ? 'Chặn hoàn toàn' : isRestricted ? 'Giới hạn' : 'Cho phép'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text-muted flex items-center gap-2">
                  <span className="text-[11px]">Không có danh mục hạn chế nào.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-3 px-3.5 rounded-xl bg-tod-surface border border-tod-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-tod-text">
              Chưa thiết lập Safety Policy
            </span>
            <span className="text-[10px] text-tod-text-muted">
              Cần thiết lập quy tắc an toàn trước khi kích hoạt Active.
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToControls}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Khởi tạo Safety Policy</span>
          </button>
        </div>
      )}
    </div>
  );
};
