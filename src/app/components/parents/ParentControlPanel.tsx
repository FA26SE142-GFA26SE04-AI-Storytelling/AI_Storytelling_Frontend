'use client';

import React from 'react';
import { Lock, Clock, Moon, ShieldCheck, Check } from 'lucide-react';

interface ParentControlPanelProps {
  isPinProtected: boolean;
  setIsPinProtected: (val: boolean) => void;
  selectedScreenTime: number;
  setSelectedScreenTime: (mins: number) => void;
  isBedtimeEnabled: boolean;
  setIsBedtimeEnabled: (val: boolean) => void;
  handleSaveChanges: () => void;
  isSavedChanges: boolean;
}

export const ParentControlPanel: React.FC<ParentControlPanelProps> = ({
  isPinProtected,
  setIsPinProtected,
  selectedScreenTime,
  setSelectedScreenTime,
  isBedtimeEnabled,
  setIsBedtimeEnabled,
  handleSaveChanges,
  isSavedChanges,
}) => {
  return (
    <div className="relative group">
      {/* Glowing Blur Backdrop Layer */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-rose-500/25 via-amber-500/20 to-emerald-500/25 blur-2xl opacity-75 group-hover:opacity-95 transition-opacity pointer-events-none" />

      <section className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-6 border border-outline-variant/40 shadow-xs space-y-6 overflow-hidden">
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 block">
              BẢO VỆ & THÓI QUEN LÀNH MẠNH
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-on-surface flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-500" />
              <span>Bảng Điều Khiển Kiểm Soát Phụ Huynh</span>
            </h2>
          </div>
          
          <button
            onClick={() => setIsPinProtected(!isPinProtected)}
            className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface font-extrabold text-xs flex items-center gap-1.5 border border-outline-variant/40 hover:bg-surface-container-high transition-all cursor-pointer self-start sm:self-auto"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Mã PIN bảo vệ ({isPinProtected ? 'Đang kích hoạt' : 'Tắt'})</span>
          </button>
        </div>

        {/* 3 Control Cards Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Control Card 1 */}
          <div className="p-4 rounded-2xl bg-surface-container-low/40 dark:bg-[#181B25] border border-outline-variant/30 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-on-surface flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-500" />
                  Giới hạn nghe đọc
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                  {selectedScreenTime} phút/ngày
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant opacity-80 leading-relaxed">
                Tự động tạm dừng ứng dụng khi hết thời gian quy định để bảo vệ mắt và tai con.
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold text-on-surface-variant opacity-75 block">Chọn thời lượng mỗi ngày:</span>
              <div className="grid grid-cols-3 gap-2">
                {[30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setSelectedScreenTime(mins)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      selectedScreenTime === mins
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {mins} phút
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Control Card 2 */}
          <div className="p-4 rounded-2xl bg-surface-container-low/40 dark:bg-[#181B25] border border-outline-variant/30 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-on-surface flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-amber-500" />
                  Chế độ Ru Ngủ Dịu Êm
                </span>
                <button
                  onClick={() => setIsBedtimeEnabled(!isBedtimeEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer p-0.5 ${
                    isBedtimeEnabled ? 'bg-tertiary-container' : 'bg-outline-variant/60'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      isBedtimeEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-on-surface-variant opacity-80 leading-relaxed">
                Tự động giảm ánh sáng màn hình và giảm âm lượng dần trong 10 phút cuối trước khi ngủ.
              </p>
            </div>

            <div className="pt-2">
              <div className="p-2 rounded-xl bg-surface-container/60 dark:bg-[#0F1626] text-[11px] font-bold text-on-surface flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Hẹn giờ tắt ứng dụng: 21:30 hàng tối</span>
              </div>
            </div>
          </div>

          {/* Control Card 3 */}
          <div className="p-4 rounded-2xl bg-surface-container-low/40 dark:bg-[#181B25] border border-outline-variant/30 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-on-surface flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Bộ lọc an toàn AI
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Mức cao (3/3)
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant opacity-80 leading-relaxed">
                Khóa tuyệt đối nội dung giật gân, quét từ vựng nhạy cảm và những thoại gây tâm lý lo âu.
              </p>
            </div>

            <div className="space-y-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold pt-1">
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Giọng đọc người thật chuẩn phát âm</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Kiểm duyệt kịch bản lời thoại chuyên gia nhi khoa</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Action Footer */}
        <div className="relative z-10 pt-4 border-t border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-xs text-on-surface-variant opacity-80 flex items-center gap-1.5">
            <span>✉️ Thông báo nhật ký phụ huynh hàng tuần gửi qua email:</span>
            <strong className="text-on-surface">me****17@gmail.com</strong>
          </span>

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-full border border-outline-variant/60 bg-surface-container text-on-surface font-extrabold text-xs hover:bg-surface-container-high transition-all cursor-pointer whitespace-nowrap">
              Cài đặt nâng cao
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-5 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              {isSavedChanges ? 'Đã lưu thay đổi!' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>

      </section>
    </div>
  );
};
