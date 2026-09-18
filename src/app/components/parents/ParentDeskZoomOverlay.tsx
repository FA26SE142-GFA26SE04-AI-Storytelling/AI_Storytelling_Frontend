import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  animateHeaderDown,
  animateDrawerLeft,
  animateDrawerRight,
  animateFooterUp,
  animateStaggerList,
} from '../../utils/gsapAnimations';

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

gsap.registerPlugin(useGSAP);

export interface ParentDeskZoomOverlayProps {
  currentStage: number;
  onStageChange: (stageIndex: number) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay, e?: React.MouseEvent) => void;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'conversation' | 'activity'>('stats');
  const [isUiVisible, setIsUiVisible] = useState<boolean>(false);

  useEffect(() => {
    // Đợi camera zoom vào bàn học và quyển vở 3D trên bàn lật mở chậm rãi, êm dịu (~1200ms) rồi mới hiện UI
    const timer = setTimeout(() => {
      setIsUiVisible(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Parent Control Settings States
  const [selectedScreenTime, setSelectedScreenTime] = useState<number>(30);
  const [isBedtimeEnabled, setIsBedtimeEnabled] = useState<boolean>(true);
  const [isPinProtected, setIsPinProtected] = useState<boolean>(true);
  const [isSavedChanges, setIsSavedChanges] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isPlayingAudioSample, setIsPlayingAudioSample] = useState<boolean>(false);
  const [feedbackRating, setFeedbackRating] = useState<'like' | 'dislike' | null>('like');

  // GSAP Entrance Animations
  useGSAP(() => {
    if (!isUiVisible) return;
    animateHeaderDown('.desk-top-bar');
    animateDrawerLeft('.desk-left-drawer', { delay: 0.08 });
    animateDrawerRight('.desk-right-drawer', { delay: 0.12 });
    animateFooterUp('.desk-bottom-bar', { delay: 0.18 });
    animateStaggerList('.desk-stat-card', { delay: 0.25, stagger: 0.06 });
  }, { scope: containerRef, dependencies: [isUiVisible] });

  // Tái kích hoạt hiệu ứng stagger mượt mà khi chuyển tab thống kê / gợi ý / nhật ký
  useGSAP(() => {
    if (!isUiVisible) return;
    animateStaggerList('.desk-tab-content-item', { stagger: 0.05, duration: 0.35 });
  }, { scope: containerRef, dependencies: [activeTab, isUiVisible] });


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

  if (!isUiVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      data-time-of-day={timeOfDay}
      className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 overflow-hidden z-20 font-sans theme-${timeOfDay} transition-colors duration-500`}
    >

      {/* 1. TOP HEADER FLOATING GLASSBAR */}
      <div className="desk-top-bar pointer-events-auto w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:px-5 sm:py-3.5 rounded-3xl bg-tod-surface backdrop-blur-xl border border-tod-border shadow-[0_10px_30px_rgba(0,0,0,0.3)] text-tod-text transition-colors duration-500">

        {/* Brand & Stage Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <button
            onClick={() => onStageChange(0)}
            className="p-2 rounded-2xl bg-tod-card hover:bg-tod-surface border border-tod-border text-tod-text-muted hover:text-tod-text transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
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
              <h1 className="font-black text-sm sm:text-base tracking-tight text-tod-text flex items-center gap-2">
                <span>Góc Quản Lý Của Cha Mẹ</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-[10px] font-extrabold text-sky-600 dark:text-sky-300 uppercase tracking-wider hidden sm:inline-block">
                  Góc Nhìn 3D Bàn Học
                </span>
              </h1>
              <p className="text-[10px] text-tod-text-muted font-medium">Sổ nhật ký đồng hành & cấu hình quyền quản lý của cha mẹ</p>
            </div>
          </div>
        </div>

        {/* Atmosphere & View Mode Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Time of Day Switcher */}
          <div className="flex items-center p-1 bg-tod-card rounded-xl border border-tod-border text-[11px] font-extrabold">
            <button
              onClick={(e) => onTimeOfDayChange('morning', e)}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${timeOfDay === 'morning' ? 'bg-sky-500 text-white shadow-sm' : 'text-tod-text-muted hover:text-tod-text'
                }`}
              title="Buổi Sáng"
            >
              <Sunrise className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onTimeOfDayChange('afternoon', e)}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${timeOfDay === 'afternoon' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-tod-text-muted hover:text-tod-text'
                }`}
              title="Buổi Chiều"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onTimeOfDayChange('night', e)}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${timeOfDay === 'night' ? 'bg-indigo-500 text-white shadow-sm' : 'text-tod-text-muted hover:text-tod-text'
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
        <div className="desk-left-drawer pointer-events-auto w-full lg:w-[460px] max-h-[50vh] lg:max-h-[75vh] flex flex-col rounded-3xl bg-tod-surface backdrop-blur-xl border border-tod-border shadow-[0_15px_40px_rgba(0,0,0,0.4)] text-tod-text overflow-hidden transition-colors duration-500">

          {/* Notebook Header Tabs */}
          <div className="p-3 bg-tod-card border-b border-tod-border flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'stats'
                  ? 'bg-sky-500 text-white shadow-md font-extrabold'
                  : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
                }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Thống Kê Đọc Tuần</span>
            </button>
            <button
              onClick={() => setActiveTab('conversation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'conversation'
                  ? 'bg-purple-500 text-white shadow-md font-extrabold'
                  : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gợi Ý Trò Chuyện AI</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'activity'
                  ? 'bg-emerald-500 text-white shadow-md font-extrabold'
                  : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Nhật Ký & Báo Cáo</span>
            </button>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 p-4 overflow-y-auto dashboard-scrollbar">

            {/* TAB 1: WEEKLY STATS */}
            {activeTab === 'stats' && (
              <div className="flex flex-col gap-3.5">
                {/* 4 Quick Stat Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="desk-stat-card p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Thời gian đọc tuần
                    </span>
                    <strong className="text-lg font-black text-tod-text">145 Phút</strong>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">+18% so với tuần trước</span>
                  </div>

                  <div className="desk-stat-card p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> Truyện đã đọc
                    </span>
                    <strong className="text-lg font-black text-tod-text">12 Câu Truyện</strong>
                    <span className="text-[9px] text-purple-600 dark:text-purple-300 font-bold">5 truyện tự tạo AI</span>
                  </div>

                  <div className="desk-stat-card p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5" /> Chỉ số EQ & Nhân ái
                    </span>
                    <strong className="text-lg font-black text-tod-text">94 / 100</strong>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-300 font-bold">Xuất sắc bài học chia sẻ</span>
                  </div>

                  <div className="desk-stat-card p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Từ vựng học được
                    </span>
                    <strong className="text-lg font-black text-tod-text">28 Từ Mới</strong>
                    <span className="text-[9px] text-amber-600 dark:text-amber-300 font-bold">Tiếng Việt & Tiếng Anh</span>
                  </div>
                </div>

                {/* EQ & Competency Progress Bar */}
                <div className="desk-tab-content-item p-3.5 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-tod-text">Tiến trình rèn luyện cảm xúc tuần này</span>
                    <span className="text-sky-500 font-bold">85% Hoàn thành</span>
                  </div>
                  <div className="w-full h-2 bg-tod-surface border border-tod-border rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 w-[85%] rounded-full" />
                  </div>
                  <p className="text-[10px] text-tod-text-muted leading-normal mt-0.5">
                    Bé Bo đã thể hiện sự thấu hiểu tuyệt vời thông qua các lựa chọn ứng xử trong truyện "Chiếc Bánh Quy Biết Bay".
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: AI CONVERSATION STARTERS */}
            {activeTab === 'conversation' && (
              <div className="desk-tab-content-item flex flex-col gap-3">
                <div className="p-3.5 rounded-2xl bg-tod-card border border-purple-500/30 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-500 dark:text-purple-300">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-tod-text">Chủ Đề Trò Chuyện Tối Nay</h3>
                      <p className="text-[10px] text-purple-600 dark:text-purple-300 font-medium">Gợi ý câu hỏi AI dựa trên truyện hôm nay</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-tod-surface border border-tod-border text-xs text-tod-text leading-relaxed font-medium">
                    "Hôm nay khi chú thỏ Bông nướng bánh quy và chia sẻ cho cả xóm làng, con cảm thấy hành động đó như thế nào? Nếu là con, con sẽ chia sẻ món quà nào cho bạn bè?"
                  </div>

                  {/* Audio voice sample player */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setIsPlayingAudioSample(!isPlayingAudioSample)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-700 dark:text-purple-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isPlayingAudioSample ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isPlayingAudioSample ? 'Tạm dừng giọng đọc' : 'Nghe gợi ý giọng nói'}</span>
                    </button>

                    <div className="flex items-center gap-1 text-xs">
                      <button
                        onClick={() => setFeedbackRating('like')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${feedbackRating === 'like' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300' : 'bg-tod-surface border-tod-border text-tod-text-muted'
                          }`}
                      >
                        👍
                      </button>
                      <button
                        onClick={() => setFeedbackRating('dislike')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${feedbackRating === 'dislike' ? 'bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-300' : 'bg-tod-surface border-tod-border text-tod-text-muted'
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
              <div className="desk-tab-content-item flex flex-col gap-3">
                <div className="p-3 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-tod-text">Nhật Ký Đọc Gần Đây</span>
                    <button
                      onClick={handleExportPdf}
                      disabled={isExportingPdf}
                      className="py-1 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isExportingPdf ? 'Đang Xuất...' : 'Xuất PDF Tuần'}</span>
                    </button>
                  </div>

                  {/* Activity Rows */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-xl bg-tod-surface border border-tod-border flex items-center justify-between">
                      <div>
                        <strong className="text-tod-text block text-[11px]">Chiếc Bánh Quy Biết Bay Của Thỏ Bông</strong>
                        <span className="text-[10px] text-tod-text-muted">12/03 • 8 phút • Bé An đồng tác giả AI</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold">100%</span>
                    </div>

                    <div className="p-2 rounded-xl bg-tod-surface border border-tod-border flex items-center justify-between">
                      <div>
                        <strong className="text-tod-text block text-[11px]">Khủng Long Dino Đi Tìm Mẹ Thần Tiên</strong>
                        <span className="text-[10px] text-tod-text-muted">09/03 • 12 phút • Nghe trước ngủ</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold">100%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT DRAWER: PARENT CONTROL & SCREEN TIME CONFIGURATION */}
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
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${isBedtimeEnabled ? 'bg-indigo-500' : 'bg-zinc-400 dark:bg-zinc-700'
                  }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow ${isBedtimeEnabled ? 'left-6' : 'left-1'
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
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${isPinProtected ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-700'
                  }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow ${isPinProtected ? 'left-6' : 'left-1'
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
      <div className="desk-bottom-bar pointer-events-auto w-full max-w-7xl mx-auto flex items-center justify-between p-3 rounded-2xl bg-tod-surface backdrop-blur-md border border-tod-border text-tod-text text-xs font-bold transition-colors duration-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Bảo mật an toàn cho trẻ em theo chuẩn COPPA & ISO-27001</span>
        </div>
        <span className="text-tod-text-muted text-[11px] hidden sm:inline">Phụ huynh đang quản lý tài khoản Bé Bo</span>
      </div>

    </div>
  );
};
