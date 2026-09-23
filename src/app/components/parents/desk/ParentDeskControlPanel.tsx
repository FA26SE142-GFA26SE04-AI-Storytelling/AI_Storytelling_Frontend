import React from 'react';
import { ShieldCheck, Clock, Moon, Lock, CheckCircle2, Save } from 'lucide-react';

export interface ParentDeskControlPanelProps {
  selectedScreenTime: number;
  setSelectedScreenTime: (val: number) => void;
  isBedtimeEnabled: boolean;
  setIsBedtimeEnabled: (val: boolean) => void;
  isPinProtected: boolean;
  setIsPinProtected: (val: boolean) => void;
  handleSaveChanges: () => void;
  isSavedChanges: boolean;
}

export const ParentDeskControlPanel: React.FC<ParentDeskControlPanelProps> = ({
  selectedScreenTime,
  setSelectedScreenTime,
  isBedtimeEnabled,
  setIsBedtimeEnabled,
  isPinProtected,
  setIsPinProtected,
  handleSaveChanges,
  isSavedChanges,
}) => {
  return (
    <div className="desk-right-drawer pointer-events-auto w-full lg:w-[380px] rounded-3xl bg-tod-surface backdrop-blur-xl border border-tod-border shadow-[0_15px_40px_rgba(0,0,0,0.4)] text-tod-text p-4 sm:p-5 flex flex-col gap-4 transition-colors duration-500">
      <div className="flex items-center gap-2 pb-2 border-b border-tod-border">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-extrabold text-sm text-tod-text">Cấu Hình Quyền Phụ Huynh</h2>
          <p className="text-[10px] text-tod-text-muted">Thiết lập giới hạn thời gian & mã bảo vệ</p>
        </div>
      </div>

      {/* Screen Time Slider */}
      <div className="p-3.5 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-tod-text flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-500" />
            Giới Hạn Thời Gian Đọc Mỗi Ngày
          </span>
          <strong className="text-xs font-black text-sky-500">{selectedScreenTime} phút</strong>
        </div>

        <input
          type="range"
          min="15"
          max="60"
          step="15"
          value={selectedScreenTime}
          onChange={(e) => setSelectedScreenTime(Number(e.target.value))}
          className="w-full h-2 bg-tod-surface rounded-lg appearance-none cursor-pointer accent-sky-500"
        />

        <div className="flex justify-between text-[10px] text-tod-text-muted font-bold px-1">
          <span>15 phút</span>
          <span>30 phút</span>
          <span>45 phút</span>
          <span>60 phút</span>
        </div>
      </div>

      {/* Toggles: Bedtime & PIN Lock */}
      <div className="flex flex-col gap-2">
        {/* Bedtime Lock Toggle */}
        <div className="p-3 rounded-2xl bg-tod-card border border-tod-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            <div>
              <span className="text-xs font-bold text-tod-text block">Giờ Đi Ngủ Tự Động</span>
              <span className="text-[10px] text-tod-text-muted">Khóa ứng dụng sau 21:00</span>
            </div>
          </div>

          <button
            onClick={() => setIsBedtimeEnabled(!isBedtimeEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              isBedtimeEnabled ? 'bg-indigo-500' : 'bg-zinc-400 dark:bg-zinc-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow ${
                isBedtimeEnabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* PIN Protection Toggle */}
        <div className="p-3 rounded-2xl bg-tod-card border border-tod-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-xs font-bold text-tod-text block">Khóa Mã PIN Phụ Huynh</span>
              <span className="text-[10px] text-tod-text-muted">Bảo vệ mục Cài đặt cha mẹ</span>
            </div>
          </div>

          <button
            onClick={() => setIsPinProtected(!isPinProtected)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              isPinProtected ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow ${
                isPinProtected ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save Changes Button */}
      <button
        onClick={handleSaveChanges}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 hover:from-sky-400 hover:to-purple-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
      >
        {isSavedChanges ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Đã Lưu Cấu Hình Thành Công!</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            <span>Lưu Thay Đổi Cấu Hình</span>
          </>
        )}
      </button>
    </div>
  );
};
