'use client';

import React, { useState } from 'react';
import {
  Users,
  Clock,
  ShieldCheck,
  Lock,
  Sparkles,
  BarChart3,
  MessageCircle,
  FileText,
  Download,
  CheckCircle2,
  Volume2,
  Play,
  Pause,
  ArrowLeft,
  Sunrise,
  Sun,
  Moon,
  Grid,
  Heart,
  Save,
  Brain,
  BookOpen,
  Award,
  ChevronRight,
  X
} from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';

export interface ParentDeskZoomOverlayProps {
  currentStage: number;
  onStageChange: (stageIndex: number) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay) => void;
  onToggleViewMode?: () => void;
  is2DViewAvailable?: boolean;
}

export const ParentDeskZoomOverlay: React.FC<ParentDeskZoomOverlayProps> = ({
  currentStage,
  onStageChange,
  timeOfDay,
  onTimeOfDayChange,
  onToggleViewMode,
  is2DViewAvailable = true,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'conversation' | 'activity'>('stats');
  
  // Parent Control Settings States
  const [selectedScreenTime, setSelectedScreenTime] = useState<number>(30);
  const [isBedtimeEnabled, setIsBedtimeEnabled] = useState<boolean>(true);
  const [isPinProtected, setIsPinProtected] = useState<boolean>(true);
  const [isSavedChanges, setIsSavedChanges] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isPlayingAudioSample, setIsPlayingAudioSample] = useState<boolean>(false);
  const [feedbackRating, setFeedbackRating] = useState<'like' | 'dislike' | null>('like');

  const handleSaveChanges = () => {
    setIsSavedChanges(true);
    setTimeout(() => setIsSavedChanges(false), 2500);
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      setIsExportingPdf(false);
      alert('Đã xuất báo cáo tuần dạng PDF thành công!');
    }, 1500);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 overflow-hidden z-20 font-sans">
      
      {/* 1. TOP HEADER FLOATING GLASSBAR */}
      <div className="pointer-events-auto w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:px-5 sm:py-3.5 rounded-3xl bg-zinc-900/85 dark:bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-white animate-in fade-in-0 slide-in-from-top-4 duration-300">
        
        {/* Brand & Stage Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <button
            onClick={() => onStageChange(0)}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
            title="Quay lại góc nhìn toàn cảnh phòng 3D"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Toàn Cảnh</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Users className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base tracking-tight bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent flex items-center gap-2">
                <span>Góc Quản Lý Của Cha Mẹ</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-[10px] font-extrabold text-sky-300 uppercase tracking-wider hidden sm:inline-block">
                  Góc Nhìn 3D Bàn Học
                </span>
              </h1>
              <p className="text-[10px] text-zinc-400 font-medium">Sổ nhật ký đồng hành & cấu hình quyền quản lý của cha mẹ</p>
            </div>
          </div>
        </div>

        {/* Atmosphere & View Mode Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Time of Day Switcher */}
          <div className="flex items-center p-1 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-[11px] font-extrabold">
            <button
              onClick={() => onTimeOfDayChange('morning')}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'morning' ? 'bg-sky-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Buổi Sáng"
            >
              <Sunrise className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('afternoon')}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'afternoon' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Buổi Chiều"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('night')}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'night' ? 'bg-indigo-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Buổi Tối"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle View Mode (3D vs 2D) */}
          {is2DViewAvailable && onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
              title="Chuyển sang giao diện 2D chi tiết"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bảng 2D</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA (LEFT NOTEBOOK DRAWER & RIGHT CONTROL PANEL) */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4 my-2 overflow-hidden pointer-events-none">
        
        {/* LEFT DRAWER: PARENT NOTEBOOK & ANALYTICS */}
        <div className="pointer-events-auto w-full lg:w-[460px] max-h-[50vh] lg:max-h-[75vh] flex flex-col rounded-3xl bg-zinc-900/90 dark:bg-zinc-950/95 backdrop-blur-xl border border-sky-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.6)] text-white overflow-hidden animate-in fade-in-0 slide-in-from-left-6 duration-400">
          
          {/* Notebook Header Tabs */}
          <div className="p-3 bg-zinc-950/90 border-b border-zinc-800/80 flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'stats'
                  ? 'bg-sky-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Thống Kê Đọc Tuần</span>
            </button>
            <button
              onClick={() => setActiveTab('conversation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'conversation'
                  ? 'bg-purple-500 text-white shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gợi Ý Trò Chuyện AI</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Nhật Ký & Báo Cáo</span>
            </button>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            
            {/* TAB 1: WEEKLY STATS */}
            {activeTab === 'stats' && (
              <div className="flex flex-col gap-3.5">
                {/* 4 Quick Stat Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-sky-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Thời gian đọc tuần
                    </span>
                    <strong className="text-lg font-black text-white">145 Phút</strong>
                    <span className="text-[9px] text-emerald-400 font-bold">+18% so với tuần trước</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> Truyện đã đọc
                    </span>
                    <strong className="text-lg font-black text-white">12 Câu Truyện</strong>
                    <span className="text-[9px] text-purple-300 font-bold">5 truyện tự tạo AI</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5" /> Chỉ số EQ & Nhân ái
                    </span>
                    <strong className="text-lg font-black text-white">94 / 100</strong>
                    <span className="text-[9px] text-emerald-300 font-bold">Xuất sắc bài học chia sẻ</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Từ vựng học được
                    </span>
                    <strong className="text-lg font-black text-white">28 Từ Mới</strong>
                    <span className="text-[9px] text-amber-300 font-bold">Tiếng Việt & Tiếng Anh</span>
                  </div>
                </div>

                {/* EQ & Competency Progress Bar */}
                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-zinc-300">Tiến trình rèn luyện cảm xúc tuần này</span>
                    <span className="text-sky-400">85% Hoàn thành</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 w-[85%] rounded-full" />
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">
                    Bé Bo đã thể hiện sự thấu hiểu tuyệt vời thông qua các lựa chọn ứng xử trong truyện "Chiếc Bánh Quy Biết Bay".
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: AI CONVERSATION STARTERS */}
            {activeTab === 'conversation' && (
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/50 via-zinc-950 to-zinc-950 border border-purple-500/30 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-white">Chủ Đề Trò Chuyện Tối Nay</h3>
                      <p className="text-[10px] text-purple-300 font-medium">Gợi ý câu hỏi AI dựa trên truyện hôm nay</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 leading-relaxed font-medium">
                    "Hôm nay khi chú thỏ Bông nướng bánh quy và chia sẻ cho cả xóm làng, con cảm thấy hành động đó như thế nào? Nếu là con, con sẽ chia sẻ món quà nào cho bạn bè?"
                  </div>

                  {/* Audio voice sample player */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setIsPlayingAudioSample(!isPlayingAudioSample)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isPlayingAudioSample ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isPlayingAudioSample ? 'Tạm dừng giọng đọc' : 'Nghe gợi ý giọng nói'}</span>
                    </button>

                    <div className="flex items-center gap-1 text-xs">
                      <button
                        onClick={() => setFeedbackRating('like')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          feedbackRating === 'like' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        👍
                      </button>
                      <button
                        onClick={() => setFeedbackRating('dislike')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          feedbackRating === 'dislike' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        👎
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: READING ACTIVITY LOG & PDF REPORT */}
            {activeTab === 'activity' && (
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300">Nhật Ký Đọc Gần Đây</span>
                    <button
                      onClick={handleExportPdf}
                      disabled={isExportingPdf}
                      className="py-1 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isExportingPdf ? 'Đang Xuất...' : 'Xuất PDF Tuần'}</span>
                    </button>
                  </div>

                  {/* Activity Rows */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <strong className="text-white block text-[11px]">Chiếc Bánh Quy Biết Bay Của Thỏ Bông</strong>
                        <span className="text-[10px] text-zinc-400">12/03 • 8 phút • Bé An đồng tác giả AI</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">100%</span>
                    </div>

                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <strong className="text-white block text-[11px]">Khủng Long Dino Đi Tìm Mẹ Thần Tiên</strong>
                        <span className="text-[10px] text-zinc-400">09/03 • 12 phút • Nghe trước ngủ</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">100%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT DRAWER: PARENT CONTROL & SCREEN TIME CONFIGURATION */}
        <div className="pointer-events-auto w-full lg:w-[380px] rounded-3xl bg-zinc-900/90 dark:bg-zinc-950/95 backdrop-blur-xl border border-purple-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.6)] text-white p-4 sm:p-5 flex flex-col gap-4 animate-in fade-in-0 slide-in-from-right-6 duration-400">
          
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white">Cấu Hình Quyền Phụ Huynh</h2>
              <p className="text-[10px] text-zinc-400">Thiết lập giới hạn thời gian & mã bảo vệ</p>
            </div>
          </div>

          {/* Screen Time Slider */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                Giới Hạn Thời Gian Đọc Mỗi Ngày
              </span>
              <strong className="text-xs font-black text-sky-400">{selectedScreenTime} phút</strong>
            </div>

            <input
              type="range"
              min="15"
              max="60"
              step="15"
              value={selectedScreenTime}
              onChange={(e) => setSelectedScreenTime(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />

            <div className="flex justify-between text-[10px] text-zinc-500 font-bold px-1">
              <span>15 phút</span>
              <span>30 phút</span>
              <span>45 phút</span>
              <span>60 phút</span>
            </div>
          </div>

          {/* Toggles: Bedtime & PIN Lock */}
          <div className="flex flex-col gap-2">
            {/* Bedtime Lock Toggle */}
            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">Giờ Đi Ngủ Tự Động</span>
                  <span className="text-[10px] text-zinc-400">Khóa ứng dụng sau 21:00</span>
                </div>
              </div>

              <button
                onClick={() => setIsBedtimeEnabled(!isBedtimeEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isBedtimeEnabled ? 'bg-indigo-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    isBedtimeEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* PIN Protection Toggle */}
            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">Khóa Mã PIN Phụ Huynh</span>
                  <span className="text-[10px] text-zinc-400">Bảo vệ mục Cài đặt cha mẹ</span>
                </div>
              </div>

              <button
                onClick={() => setIsPinProtected(!isPinProtected)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isPinProtected ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
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

      </div>

      {/* 3. BOTTOM FOOTER BAR */}
      <div className="pointer-events-auto w-full max-w-7xl mx-auto flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 dark:bg-zinc-950/85 backdrop-blur-md border border-white/10 text-white animate-in fade-in-0 slide-in-from-bottom-4 duration-300 text-xs font-bold">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Bảo mật an toàn cho trẻ em theo chuẩn COPPA & ISO-27001</span>
        </div>
        <span className="text-zinc-400 text-[11px] hidden sm:inline">Phụ huynh đang quản lý tài khoản Bé Bo</span>
      </div>

    </div>
  );
};
