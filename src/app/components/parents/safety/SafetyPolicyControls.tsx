'use client';

import React from 'react';
import {
  FileText,
  ShieldCheck,
  Lock,
  Zap,
  Sliders,
  Check,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  CheckCheck,
  Save,
} from 'lucide-react';
import { SafetyPolicy, ContentCategory } from '../../../types/childProfile';

export interface SafetyPolicyControlsProps {
  selectedChildNickname: string;
  safetyPolicy: SafetyPolicy | null;
  safetyMaxStoryLength: number;
  setSafetyMaxStoryLength: (val: number) => void;
  safetyApprovalMode: 'AlwaysManual' | 'AutoPublishOnThreshold';
  setSafetyApprovalMode: (val: 'AlwaysManual' | 'AutoPublishOnThreshold') => void;
  safetyParentalGate: boolean;
  setSafetyParentalGate: (val: boolean) => void;
  safetyConsent: boolean;
  setSafetyConsent: (val: boolean) => void;
  contentCategories: ContentCategory[];
  safetyCategories: Array<{ contentCategoryId: number; rule: 'Allowed' | 'Restricted' | 'Blocked' }>;
  setSafetyCategories: React.Dispatch<
    React.SetStateAction<Array<{ contentCategoryId: number; rule: 'Allowed' | 'Restricted' | 'Blocked' }>>
  >;
  isLoadingCategories: boolean;
  isSavingSafety: boolean;
  isSavedChanges: boolean;
  handleSaveSafetyPolicy: () => void;
  safetyErrorMsg: string | null;
  safetySuccessMsg: string | null;
}

export const SafetyPolicyControls: React.FC<SafetyPolicyControlsProps> = ({
  selectedChildNickname,
  safetyPolicy,
  safetyMaxStoryLength,
  setSafetyMaxStoryLength,
  safetyApprovalMode,
  setSafetyApprovalMode,
  safetyParentalGate,
  setSafetyParentalGate,
  safetyConsent,
  setSafetyConsent,
  contentCategories,
  safetyCategories,
  setSafetyCategories,
  isLoadingCategories,
  isSavingSafety,
  isSavedChanges,
  handleSaveSafetyPolicy,
  safetyErrorMsg,
  safetySuccessMsg,
}) => {
  const isSafetyConfigured = Boolean(safetyPolicy && safetyPolicy.consentRecorded);

  return (
    <div className="space-y-3.5 text-tod-text">
      {/* Status Banner: Safety Configured Check */}
      <div
        className={`laptop-tab-content-row p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
          isSafetyConfigured
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isSafetyConfigured
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-500'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-tod-text">Trạng Thái Nghiệp Vụ:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border tracking-wide uppercase ${
                  isSafetyConfigured
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
                }`}
              >
                {isSafetyConfigured
                  ? 'Safety Configured (Đã Cấu Hình An Toàn)'
                  : 'Chưa Cấu Hình An Toàn'}
              </span>
            </div>
            <p className="text-[11px] text-tod-text-muted mt-0.5">
              {isSafetyConfigured
                ? 'Bộ quy tắc an toàn đã có hiệu lực, bảo vệ tối đa không gian đọc truyện của bé.'
                : 'Vui lòng thiết lập các quy tắc bên dưới và bấm Lưu để hoàn tất trạng thái an toàn cho bé.'}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Maximum Story Length */}
      <div className="laptop-tab-content-row p-3.5 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-tod-text flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-sky-500" />
            Giới Hạn Độ Dài Tối Đa Của Truyện (Max Story Length)
          </span>
          <span className="text-xs font-black text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-lg">
            {safetyMaxStoryLength.toLocaleString()} ký tự
          </span>
        </div>
        <p className="text-[11px] text-tod-text-muted">
          AI sẽ tự động điều chỉnh bố cục và từ vựng để câu chuyện không vượt quá giới hạn này.
        </p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { len: 1000, label: 'Ngắn gọn', desc: '~1,000 ký tự (3-5 tuổi)' },
            { len: 2000, label: 'Tiêu chuẩn', desc: '~2,000 ký tự (6-8 tuổi)' },
            { len: 3500, label: 'Chuyên sâu', desc: '~3,500 ký tự (9-12 tuổi)' },
          ].map((item) => (
            <button
              key={item.len}
              type="button"
              onClick={() => setSafetyMaxStoryLength(item.len)}
              className={`p-2.5 rounded-xl text-left font-bold transition-all cursor-pointer border flex flex-col gap-0.5 ${
                safetyMaxStoryLength === item.len
                  ? 'bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-300 shadow-md shadow-sky-500/10'
                  : 'bg-tod-surface border-tod-border text-tod-text-muted hover:text-tod-text hover:bg-tod-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px]">{item.label}</span>
                {safetyMaxStoryLength === item.len && <Check className="w-3.5 h-3.5 text-sky-500" />}
              </div>
              <span className="text-[9px] font-normal opacity-80">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Required Approval Mode */}
      <div className="laptop-tab-content-row p-3.5 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-2.5 shadow-sm">
        <span className="text-xs font-bold text-tod-text flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Chế Độ Phê Duyệt Bắt Buộc (Required Approval Mode)
        </span>
        <p className="text-[11px] text-tod-text-muted">
          Quyết định cơ chế xuất bản truyện trước khi bé có thể nhìn thấy và đọc trên ứng dụng.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSafetyApprovalMode('AlwaysManual')}
            className={`p-3 rounded-xl text-left flex flex-col gap-1 border cursor-pointer transition-all ${
              safetyApprovalMode === 'AlwaysManual'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md shadow-emerald-500/10'
                : 'bg-tod-surface border-tod-border text-tod-text-muted hover:text-tod-text hover:bg-tod-card'
            }`}
          >
            <div className="flex items-center justify-between">
              <strong className="text-[11px] font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                Luôn Cần Người Lớn Duyệt
              </strong>
              {safetyApprovalMode === 'AlwaysManual' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
            </div>
            <span className="text-[10px] opacity-80">
              (AlwaysManual) Mọi câu chuyện AI sinh ra bắt buộc phải có phụ huynh duyệt trước khi hiển thị cho bé.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSafetyApprovalMode('AutoPublishOnThreshold')}
            className={`p-3 rounded-xl text-left flex flex-col gap-1 border cursor-pointer transition-all ${
              safetyApprovalMode === 'AutoPublishOnThreshold'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md shadow-emerald-500/10'
                : 'bg-tod-surface border-tod-border text-tod-text-muted hover:text-tod-text hover:bg-tod-card'
            }`}
          >
            <div className="flex items-center justify-between">
              <strong className="text-[11px] font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-sky-500" />
                Tự Động Khi Đạt Điểm An Toàn
              </strong>
              {safetyApprovalMode === 'AutoPublishOnThreshold' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
            </div>
            <span className="text-[10px] opacity-80">
              (AutoPublishOnThreshold) Cho phép auto-publish nếu AI Guardrail chấm điểm Safety Score đạt ngưỡng an toàn tuyệt đối.
            </span>
          </button>
        </div>
      </div>

      {/* 3. Parental Gate Protection */}
      <div className="laptop-tab-content-row p-3.5 rounded-2xl bg-tod-card border border-tod-border flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-500">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-tod-text block">
              Cơ Chế Bảo Vệ Khu Vực Quản Trị (Parental Gate)
            </span>
            <span className="text-[10px] text-tod-text-muted block mt-0.5">
              Yêu cầu giải bài toán xác thực hoặc mã PIN của người lớn trước khi vào cài đặt, đổi hồ sơ hoặc thanh toán.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSafetyParentalGate(!safetyParentalGate)}
          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
            safetyParentalGate ? 'bg-purple-600 shadow-md shadow-purple-500/20' : 'bg-tod-surface border border-tod-border'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
              safetyParentalGate ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* 4. Allowed / Restricted / Blocked Categories */}
      <div className="laptop-tab-content-row p-3.5 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-tod-text flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-500" />
              Quy Tắc Danh Mục Nội Dung (Allowed / Restricted / Blocked)
            </span>
            <span className="text-[10px] text-tod-text-muted block mt-0.5">
              <strong className="text-rose-500 dark:text-rose-400">Quy tắc cốt lõi:</strong> Nội dung bị cấm (Blocked) sẽ tuyệt đối{' '}
              <strong className="text-amber-600 dark:text-amber-300">override mọi yêu cầu sáng tạo</strong> của câu chuyện.
            </span>
          </div>
          {isLoadingCategories && <RefreshCw className="w-3.5 h-3.5 text-tod-text-muted animate-spin" />}
        </div>

        <div className="space-y-2">
          {contentCategories.map((category) => {
            const currentRule =
              safetyCategories.find((c) => c.contentCategoryId === category.id)?.rule || 'Allowed';

            return (
              <div
                key={category.id}
                className="p-2.5 rounded-xl bg-tod-surface border border-tod-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-tod-text-muted" />
                  <span className="text-xs font-semibold text-tod-text">{category.displayName}</span>
                  <span className="text-[9px] font-mono text-tod-text-muted px-1.5 py-0.5 rounded bg-tod-card border border-tod-border">
                    {category.code}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold">
                  {/* Option 1: Allowed */}
                  <button
                    type="button"
                    onClick={() => {
                      setSafetyCategories((prev) => {
                        const exists = prev.some((c) => c.contentCategoryId === category.id);
                        if (exists) {
                          return prev.map((c) =>
                            c.contentCategoryId === category.id ? { ...c, rule: 'Allowed' } : c
                          );
                        }
                        return [...prev, { contentCategoryId: category.id, rule: 'Allowed' }];
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      currentRule === 'Allowed'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'bg-tod-card border-tod-border text-tod-text-muted hover:text-tod-text'
                    }`}
                  >
                    Cho phép
                  </button>

                  {/* Option 2: Restricted */}
                  <button
                    type="button"
                    onClick={() => {
                      setSafetyCategories((prev) => {
                        const exists = prev.some((c) => c.contentCategoryId === category.id);
                        if (exists) {
                          return prev.map((c) =>
                            c.contentCategoryId === category.id ? { ...c, rule: 'Restricted' } : c
                          );
                        }
                        return [...prev, { contentCategoryId: category.id, rule: 'Restricted' }];
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      currentRule === 'Restricted'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                        : 'bg-tod-card border-tod-border text-tod-text-muted hover:text-tod-text'
                    }`}
                  >
                    Giới hạn
                  </button>

                  {/* Option 3: Blocked */}
                  <button
                    type="button"
                    onClick={() => {
                      setSafetyCategories((prev) => {
                        const exists = prev.some((c) => c.contentCategoryId === category.id);
                        if (exists) {
                          return prev.map((c) =>
                            c.contentCategoryId === category.id ? { ...c, rule: 'Blocked' } : c
                          );
                        }
                        return [...prev, { contentCategoryId: category.id, rule: 'Blocked' }];
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      currentRule === 'Blocked'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold'
                        : 'bg-tod-card border-tod-border text-tod-text-muted hover:text-tod-text'
                    }`}
                  >
                    Chặn hoàn toàn
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Consent Record Checkbox */}
      <div className="laptop-tab-content-row p-3.5 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-2 shadow-sm">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={safetyConsent}
            onChange={(e) => setSafetyConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-tod-border bg-tod-surface text-indigo-500 focus:ring-indigo-400 accent-indigo-500 cursor-pointer"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-tod-text flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Xác Nhận Đồng Thuận Giám Sát & Bảo Vệ Dữ Liệu Trẻ Em (Consent Record)
            </span>
            <span className="text-[10px] text-tod-text-muted leading-relaxed">
              Tôi xác nhận đồng thuận áp dụng quy tắc an toàn này. Hệ thống tuân thủ nghiêm ngặt nguyên tắc
              giới hạn thu thập dữ liệu trẻ em, chỉ lưu trữ thông tin tối thiểu phục vụ học tập và ghi nhận thời
              điểm đồng thuận (ConsentRecordedAt).
            </span>
          </div>
        </label>
      </div>

      {/* Feedback Alerts */}
      {safetyErrorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{safetyErrorMsg}</span>
        </div>
      )}

      {safetySuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCheck className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{safetySuccessMsg}</span>
        </div>
      )}

      {/* Save Changes Button */}
      <button
        type="button"
        onClick={handleSaveSafetyPolicy}
        disabled={isSavingSafety}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
      >
        {isSavingSafety ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Đang Lưu Quy Tắc An Toàn Lên Máy Chủ...</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            <span>
              {isSavedChanges
                ? '✓ Đã Lưu Cấu Hình An Toàn!'
                : `Lưu Quy Tắc An Toàn (Safety Configured) Cho Bé ${selectedChildNickname}`}
            </span>
          </>
        )}
      </button>
    </div>
  );
};
