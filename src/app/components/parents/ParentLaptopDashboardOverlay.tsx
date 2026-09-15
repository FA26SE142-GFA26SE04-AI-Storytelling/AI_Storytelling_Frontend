'use client';

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
  Laptop,
  Sliders,
  Bell,
  Eye,
  Settings,
  Flame,
  Check,
  Zap,
} from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';
import { useAuth } from '../../context/AuthContext';

gsap.registerPlugin(useGSAP);

export interface ParentLaptopDashboardOverlayProps {
  currentStage: number;
  onStageChange: (stageIndex: number) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay) => void;
  onToggleViewMode?: () => void;
  is2DViewAvailable?: boolean;
}

export const ParentLaptopDashboardOverlay: React.FC<ParentLaptopDashboardOverlayProps> = ({
  currentStage,
  onStageChange,
  timeOfDay,
  onTimeOfDayChange,
  onToggleViewMode,
  is2DViewAvailable = false,
}) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'controls' | 'stories' | 'prompts'>('analytics');
  const [isUiVisible, setIsUiVisible] = useState<boolean>(false);

  // Parent Control Settings States
  const [selectedScreenTime, setSelectedScreenTime] = useState<number>(30);
  const [isBedtimeEnabled, setIsBedtimeEnabled] = useState<boolean>(true);
  const [isPinProtected, setIsPinProtected] = useState<boolean>(true);
  const [aiFilterLevel, setAiFilterLevel] = useState<'strict' | 'standard' | 'creative'>('standard');
  const [isSavedChanges, setIsSavedChanges] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [feedbackRating, setFeedbackRating] = useState<'like' | 'dislike' | null>('like');

  useEffect(() => {
    // Đợi camera di chuyển lướt tới laptop và nắp máy mở ra (~1000ms) rồi mới cho UI xuất hiện mượt mà
    const timer = setTimeout(() => {
      setIsUiVisible(true);
    }, 950);
    return () => clearTimeout(timer);
  }, []);

  // GSAP Entrance Animations
  useGSAP(() => {
    if (!isUiVisible) return;
    animateHeaderDown('.laptop-top-bar');
    animateDrawerLeft('.laptop-left-card', { delay: 0.08 });
    animateDrawerRight('.laptop-right-card', { delay: 0.12 });
    animateFooterUp('.laptop-bottom-bar', { delay: 0.16 });
    animateStaggerList('.laptop-metric-item', { delay: 0.22, stagger: 0.05 });
  }, { scope: containerRef, dependencies: [isUiVisible] });

  // Tái kích hoạt stagger khi chuyển tab
  useGSAP(() => {
    if (!isUiVisible) return;
    animateStaggerList('.laptop-tab-content-row', { stagger: 0.04, duration: 0.3 });
  }, { scope: containerRef, dependencies: [activeTab, isUiVisible] });

  const handleSaveChanges = () => {
    setIsSavedChanges(true);
    setTimeout(() => setIsSavedChanges(false), 2400);
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      setIsExportingPdf(false);
      alert('Đã xuất báo cáo tuần dạng PDF thành công cho Phụ Huynh!');
    }, 1200);
  };

  if (!isUiVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 overflow-hidden z-30 font-sans"
    >
      {/* 1. TOP HEADER FLOATING GLASSBAR */}
      <div className="laptop-top-bar pointer-events-auto w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:px-5 sm:py-3 rounded-2xl bg-zinc-950/85 backdrop-blur-xl border border-sky-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.6)] text-white">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onStageChange(0)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
            title="Quay lại góc nhìn toàn cảnh phòng 3D"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span className="hidden xs:inline">Toàn Cảnh</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
              <Laptop className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base tracking-tight bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  Bảng Điều Khiển Của Phụ Huynh
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-extrabold text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Laptop Trực Tuyến
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">
                Theo dõi tiến trình đọc, cảm xúc EQ và thiết lập bảo vệ bé thời gian thực
              </p>
            </div>
          </div>
        </div>

        {/* Right: Child Badge & Atmosphere & View Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
          {/* Active Profile */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center font-black text-[11px] text-zinc-950">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="text-left">
              <span className="text-[11px] font-bold text-white block leading-tight">
                {user?.fullName || user?.username || 'Bé An (6 tuổi)'}
              </span>
              <span className="text-[9px] text-emerald-400 block leading-tight font-medium">
                {user ? `${user.role || 'Phụ Huynh'} • ${user.email}` : 'Cấp độ: Thám hiểm sao'}
              </span>
            </div>
          </div>

          {/* Time of Day Switcher */}
          <div className="flex items-center p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 text-[11px] font-extrabold">
            <button
              onClick={() => onTimeOfDayChange('morning')}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'morning' ? 'bg-sky-500 text-zinc-950 font-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Buổi Sáng"
            >
              <Sunrise className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('afternoon')}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'afternoon' ? 'bg-amber-500 text-zinc-950 font-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Buổi Chiều"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('night')}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'night' ? 'bg-indigo-500 text-white font-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Buổi Tối"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Optional 2D View Switcher */}
          {is2DViewAvailable && onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bảng 2D</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4 my-2 overflow-hidden pointer-events-none">
        {/* LEFT CARD: MAIN INTERACTIVE DASHBOARD */}
        <div className="laptop-left-card pointer-events-auto w-full lg:w-[500px] max-h-[54vh] lg:max-h-[76vh] flex flex-col rounded-3xl bg-zinc-950/90 backdrop-blur-2xl border border-sky-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-white overflow-hidden">
          {/* Navigation Tabs */}
          <div className="p-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-sky-500 text-zinc-950 font-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Phân Tích & Học Tập</span>
            </button>
            <button
              onClick={() => setActiveTab('controls')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'controls'
                  ? 'bg-purple-500 text-white font-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Kiểm Soát An Toàn</span>
            </button>
            <button
              onClick={() => setActiveTab('stories')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'stories'
                  ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Nhật Ký Truyện AI</span>
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'prompts'
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gợi Ý Trò Chuyện</span>
            </button>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 space-y-3.5">
            {/* TAB 1: ANALYTICS & LEARNING */}
            {activeTab === 'analytics' && (
              <div className="space-y-3">
                {/* 4 Quick Stat Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="laptop-metric-item p-3 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-sky-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Thời gian đọc tuần
                    </span>
                    <strong className="text-lg font-black text-white">145 Phút</strong>
                    <span className="text-[9px] text-emerald-400 font-bold">+18% so với tuần trước</span>
                  </div>

                  <div className="laptop-metric-item p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> Truyện đã đọc
                    </span>
                    <strong className="text-lg font-black text-white">12 Câu Truyện</strong>
                    <span className="text-[9px] text-purple-300 font-bold">5 truyện tự tạo với AI</span>
                  </div>

                  <div className="laptop-metric-item p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5" /> Chỉ số EQ & Đồng cảm
                    </span>
                    <strong className="text-lg font-black text-white">94 / 100</strong>
                    <span className="text-[9px] text-emerald-300 font-bold">Tích cực bài học chia sẻ</span>
                  </div>

                  <div className="laptop-metric-item p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Từ vựng thu nạp
                    </span>
                    <strong className="text-lg font-black text-white">28 Từ Mới</strong>
                    <span className="text-[9px] text-amber-300 font-bold">Song ngữ Việt & Anh</span>
                  </div>
                </div>

                {/* EQ & Weekly Goal Progress */}
                <div className="laptop-tab-content-row p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-zinc-200 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      Mục tiêu đọc sách & cảm xúc tuần
                    </span>
                    <span className="text-sky-400 font-black">85% Hoàn Thành</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 w-[85%] rounded-full" />
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    💡 <strong>Gợi ý AI:</strong> Bé An phản hồi rất tốt với các tình huống giúp đỡ bạn bè trong truyện "Chiếc Bánh Quy Biết Bay".
                  </p>
                </div>

                {/* Mood & Emotion Breakdown */}
                <div className="laptop-tab-content-row p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-200">Phân Bổ Cảm Xúc Sau Khi Đọc</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-sky-950/30 border border-sky-500/20">
                      <span className="text-base block">😄</span>
                      <strong className="text-white text-xs font-black">65%</strong>
                      <span className="text-[9px] text-zinc-400 block">Hào hứng</span>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/20">
                      <span className="text-base block">🤔</span>
                      <strong className="text-white text-xs font-black">25%</strong>
                      <span className="text-[9px] text-zinc-400 block">Tò mò</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
                      <span className="text-base block">😌</span>
                      <strong className="text-white text-xs font-black">10%</strong>
                      <span className="text-[9px] text-zinc-400 block">Thư thái</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PARENTAL CONTROLS & SAFETY */}
            {activeTab === 'controls' && (
              <div className="space-y-3">
                {/* Screen Time Limit Slider */}
                <div className="laptop-tab-content-row p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
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

                {/* Automatic Bedtime Mode */}
                <div className="laptop-tab-content-row p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">Giờ Đi Ngủ Tự Động</span>
                      <span className="text-[10px] text-zinc-400">Tự động chuyển nhạc êm & khóa sau 21:00</span>
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

                {/* AI Content Filter Level */}
                <div className="laptop-tab-content-row p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Mức Độ Kiểm Duyệt Cốt Truyện AI
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {(['strict', 'standard', 'creative'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setAiFilterLevel(level)}
                        className={`p-2 rounded-xl text-center font-bold text-[11px] transition-all cursor-pointer border ${
                          aiFilterLevel === level
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {level === 'strict' ? 'Nghiêm Ngặt' : level === 'standard' ? 'Tiêu Chuẩn' : 'Mở Rộng'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PIN Lock Protection */}
                <div className="laptop-tab-content-row p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">Khóa Mã PIN Phụ Huynh</span>
                      <span className="text-[10px] text-zinc-400">Yêu cầu mã 4 số khi thay đổi cấu hình</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsPinProtected(!isPinProtected)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      isPinProtected ? 'bg-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        isPinProtected ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Save Changes Button */}
                <button
                  onClick={handleSaveChanges}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavedChanges ? '✓ Đã Lưu Cấu Hình An Toàn!' : 'Lưu Thay Đổi Cho Bé'}</span>
                </button>
              </div>
            )}

            {/* TAB 3: STORY LOGS & EXPORT */}
            {activeTab === 'stories' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">Nhật Ký Truyện Bé Đã Nghe</span>
                    <button
                      onClick={handleExportPdf}
                      disabled={isExportingPdf}
                      className="py-1 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isExportingPdf ? 'Đang Xuất...' : 'Xuất Báo Cáo PDF'}</span>
                    </button>
                  </div>

                  {/* Stories list */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <strong className="text-white block text-[11px]">Chiếc Bánh Quy Biết Bay Của Thỏ Bông</strong>
                        <span className="text-[10px] text-zinc-400">12/03 • 8 phút • Bé An đồng tác giả AI</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">100% Hoàn Thành</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <strong className="text-white block text-[11px]">Khủng Long Dino Đi Tìm Mẹ Thần Tiên</strong>
                        <span className="text-[10px] text-zinc-400">09/03 • 12 phút • Giọng ru ngủ ấm áp</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">100% Hoàn Thành</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <strong className="text-white block text-[11px]">Hành Tinh Kẹo Ngọt & Bí Ẩn Vệ Tinh</strong>
                        <span className="text-[10px] text-zinc-400">06/03 • 10 phút • Khám phá khoa học</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">85% Đã Nghe</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CONVERSATION STARTERS */}
            {activeTab === 'prompts' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-zinc-950 to-zinc-950 border border-purple-500/30 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-white">Chủ Đề Trò Chuyện Tối Nay Với Bé</h3>
                      <p className="text-[10px] text-purple-300 font-medium">Gợi ý từ AI dựa theo cốt truyện bé vừa đọc</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 leading-relaxed font-medium">
                    "Hôm nay khi chú thỏ Bông nướng bánh quy và chia sẻ cho cả xóm làng, con cảm thấy hành động đó như thế nào? Nếu là con, con sẽ chia sẻ món quà nào cho các bạn ở lớp?"
                  </div>

                  {/* Audio sample toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isPlayingAudio ? 'Tạm dừng giọng đọc' : 'Nghe gợi ý giọng nói'}</span>
                    </button>

                    <div className="flex items-center gap-1 text-xs">
                      <button
                        onClick={() => setFeedbackRating('like')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          feedbackRating === 'like'
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        👍 Thích
                      </button>
                      <button
                        onClick={() => setFeedbackRating('dislike')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          feedbackRating === 'dislike'
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        👎
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CARD: LIVE MONITOR & QUICK ACTIONS */}
        <div className="laptop-right-card pointer-events-auto w-full lg:w-[360px] rounded-3xl bg-zinc-950/90 backdrop-blur-2xl border border-sky-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-white p-4 sm:p-5 flex flex-col gap-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white">Trạng Thái MagicOS Bé</h2>
              <p className="text-[10px] text-zinc-400">Theo dõi kết nối thời gian thực</p>
            </div>
          </div>

          {/* Quick status card */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-300">Thời gian màn hình hôm nay</span>
              <span className="text-sky-400 font-black">22 / 30 phút</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 w-[73%] rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>Còn lại: 8 phút</span>
              <span className="text-emerald-400 font-bold">● Trạng thái an toàn</span>
            </div>
          </div>

          {/* AI Story Recommendation for Tonight */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-zinc-900/90 to-zinc-900/90 border border-indigo-500/30 flex flex-col gap-2">
            <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Gợi ý truyện tối nay
            </span>
            <strong className="text-xs font-black text-white">Chuyến Thám Hiểm Mặt Trăng Cùng Mèo Ú</strong>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Cốt truyện nuôi dưỡng lòng dũng cảm, bài học về tính kiên nhẫn khi gặp thử thách.
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={() => {
              setActiveTab('stories');
              alert('Đang mở thư viện quản lý truyện AI của bé!');
            }}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Mở Kho Truyện Của Bé</span>
          </button>
        </div>
      </div>

      {/* 3. BOTTOM BAR (OPTIONAL QUICK DOCK) */}
      <div className="laptop-bottom-bar pointer-events-auto w-full max-w-xl mx-auto flex items-center justify-between p-2 sm:px-4 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-white/10 text-white text-xs shadow-xl">
        <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Chế độ phụ huynh bảo mật cao
        </span>
        <button
          onClick={() => onStageChange(0)}
          className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-extrabold text-[11px] transition-all cursor-pointer"
        >
          Thu nhỏ & Thoát (Esc)
        </button>
      </div>
    </div>
  );
};
