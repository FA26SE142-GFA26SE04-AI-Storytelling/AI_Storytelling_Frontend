'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  Sparkles,
} from 'lucide-react';

export interface BulkEnrollmentTabProps {
  onSwitchToSingle: () => void;
}

export const BulkEnrollmentTab: React.FC<BulkEnrollmentTabProps> = ({ onSwitchToSingle }) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  return (
    <div className="space-y-4 animate-in fade-in duration-200 text-tod-text">
      {/* Intro Banner */}
      <div className="p-5 rounded-2xl bg-tod-card border border-purple-500/30 text-xs space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-tod-text">
                  Ghi Danh Cả Lớp Học Hàng Loạt
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300">
                  Dành cho Trường học &amp; Lớp
                </span>
              </div>
              <p className="text-[11px] text-tod-text-muted">
                Tự động khởi tạo hồ sơ học sinh cho cả lớp và phát sinh mã mời riêng biệt cho từng phụ huynh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToSingle}
            className="px-3 py-1.5 rounded-xl bg-tod-surface border border-tod-border hover:border-indigo-400 text-tod-text text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
          >
            <span>Quay lại Mời đơn lẻ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-tod-surface border border-tod-border space-y-1">
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-300 font-bold text-[11px]">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Import Excel / CSV</span>
            </div>
            <p className="text-[10px] text-tod-text-muted">
              Tải lên danh sách học sinh từ file bảng tính có sẵn của trường nhanh chóng.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-tod-surface border border-tod-border space-y-1">
            <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-300 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mã Mời Riêng 1-1</span>
            </div>
            <p className="text-[10px] text-tod-text-muted">
              Hệ thống tự sinh 1 mã độc lập cho từng bé để tránh phụ huynh nhận nhầm con người khác.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-tod-surface border border-tod-border space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Theo Dõi Tiến Độ Claim</span>
            </div>
            <p className="text-[10px] text-tod-text-muted">
              Xem danh sách phụ huynh nào đã kết nối, phụ huynh nào chưa để kịp thời gửi lại mã.
            </p>
          </div>
        </div>
      </div>

      {/* Khu vực tải lên danh sách học sinh */}
      <div className="p-6 rounded-2xl bg-tod-card border border-dashed border-tod-border flex flex-col items-center justify-center text-center gap-3 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div className="space-y-1 max-w-md">
          <h4 className="font-bold text-tod-text text-sm">
            Khu Vực Ghi Danh Hàng Loạt Cho Lớp Học
          </h4>
          <p className="text-xs text-tod-text-muted">
            Kéo và thả file danh sách học sinh (.xlsx, .csv) vào đây hoặc chọn tải lên từ máy tính của bạn.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => alert('Mẫu file Excel đang được chuẩn bị và sẽ sớm được kích hoạt.')}
            className="px-3 py-1.5 rounded-xl bg-tod-surface border border-tod-border hover:border-tod-primary text-tod-text font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>Tải File Mẫu (.xlsx)</span>
          </button>

          <label className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-500/20">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Chọn File Danh Sách Học Sinh</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFileName(file.name);
                }
              }}
            />
          </label>
        </div>

        {selectedFileName && (
          <div className="mt-2 p-2 px-3 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-700 dark:text-purple-200 text-xs flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-purple-500" />
            <span>Đã chọn: <strong>{selectedFileName}</strong></span>
            <span className="text-[10px] text-tod-text-muted italic">(Đang chờ kích hoạt backend Luồng 7)</span>
          </div>
        )}

        <div className="pt-3 border-t border-tod-border w-full max-w-lg text-[11px] text-tod-text-muted flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span>Kiến trúc frontend đã sẵn sàng để gắn nối trực tiếp với API Bulk Enrollment khi triển khai.</span>
        </div>
      </div>
    </div>
  );
};
