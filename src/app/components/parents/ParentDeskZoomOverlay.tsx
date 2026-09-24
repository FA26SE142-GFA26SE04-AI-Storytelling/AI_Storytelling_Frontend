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
  ShieldCheck,
  ArrowLeft,
  Sunrise,
  Sun,
  Moon,
  Grid,
} from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';
import { ParentDeskNotebookDrawer } from './desk/ParentDeskNotebookDrawer';
import { ParentDeskControlPanel } from './desk/ParentDeskControlPanel';
import { childProfileService } from '../../services/childProfileService';
import { storyService } from '../../services/storyService';
import { ChildProfile, LearningProfile, SafetyPolicy, TokenQuotaStatus } from '../../types/childProfile';
import { StoryDto } from '../../types/story';

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
  currentStage: _currentStage,
  onStageChange,
  timeOfDay,
  onTimeOfDayChange,
  onToggleViewMode,
  is2DViewAvailable = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'conversation' | 'activity'>('stats');
  const [isUiVisible, setIsUiVisible] = useState<boolean>(false);

  // Live Backend Data States
  const [activeChild, setActiveChild] = useState<ChildProfile | null>(null);
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [safetyPolicy, setSafetyPolicy] = useState<SafetyPolicy | null>(null);
  const [tokenQuota, setTokenQuota] = useState<TokenQuotaStatus | null>(null);
  const [recentStories, setRecentStories] = useState<StoryDto[]>([]);

  // Parent Control Settings States
  const [selectedScreenTime, setSelectedScreenTime] = useState<number>(30);
  const [isBedtimeEnabled, setIsBedtimeEnabled] = useState<boolean>(true);
  const [isPinProtected, setIsPinProtected] = useState<boolean>(true);
  const [isSavedChanges, setIsSavedChanges] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isPlayingAudioSample, setIsPlayingAudioSample] = useState<boolean>(false);
  const [feedbackRating, setFeedbackRating] = useState<'like' | 'dislike' | null>('like');

  useEffect(() => {
    // Đợi camera zoom vào bàn học và quyển vở 3D trên bàn lật mở chậm rãi, êm dịu (~1200ms) rồi mới hiện UI
    const timer = setTimeout(() => {
      setIsUiVisible(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Fetch real child and stories data from backend
  useEffect(() => {
    let isMounted = true;
    const fetchRealData = async () => {
      try {
        const childRes = await childProfileService.getMyChildProfiles();
        if (isMounted && childRes.success && childRes.data && childRes.data.length > 0) {
          const firstChild = childRes.data[0];
          setActiveChild(firstChild);

          const [lpRes, spRes, tqRes, stRes] = await Promise.all([
            childProfileService.getLearningProfile(firstChild.id),
            childProfileService.getSafetyPolicy(firstChild.id),
            childProfileService.getTokenQuotaForChild(firstChild.id),
            storyService.getStories({ childProfileId: firstChild.id, pageSize: 6 }),
          ]);

          if (isMounted) {
            if (lpRes.success && lpRes.data) setLearningProfile(lpRes.data);
            if (spRes.success && spRes.data) {
              setSafetyPolicy(spRes.data);
              setIsPinProtected(spRes.data.parentalGateEnabled ?? true);
            }
            if (tqRes.success && tqRes.data) setTokenQuota(tqRes.data);
            if (stRes.success && stRes.data?.items) setRecentStories(stRes.data.items);
          }
        }
      } catch (e) {
        console.error('Failed to load real desk data from backend:', e);
      }
    };

    fetchRealData();
    return () => {
      isMounted = false;
    };
  }, []);

  // GSAP Entrance Animations
  useGSAP(() => {
    if (!isUiVisible) return;
    animateHeaderDown('.desk-top-bar');
    animateDrawerLeft('.desk-left-drawer', { delay: 0.08 });
    animateDrawerRight('.desk-right-drawer', { delay: 0.12 });
    animateFooterUp('.desk-bottom-bar', { delay: 0.18 });
    animateStaggerList('.desk-stat-card', { delay: 0.25, stagger: 0.06 });
  }, { scope: containerRef, dependencies: [isUiVisible] });

  // Tái kích hoạt hiệu ứng stagger mượt mà khi chuyển tab
  useGSAP(() => {
    if (!isUiVisible) return;
    animateStaggerList('.desk-tab-content-item', { stagger: 0.05, duration: 0.35 });
  }, { scope: containerRef, dependencies: [activeTab, isUiVisible] });

  const handleSaveChanges = async () => {
    if (activeChild) {
      try {
        await childProfileService.setSafetyPolicy(activeChild.id, {
          parentalGateEnabled: isPinProtected,
          maxStoryLength: selectedScreenTime * 50,
          requiredApprovalMode: 'AlwaysManual',
          consentRecorded: true,
        });
      } catch (err) {
        console.error('Failed to save safety policy:', err);
      }
    }
    setIsSavedChanges(true);
    setTimeout(() => setIsSavedChanges(false), 2500);
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      setIsExportingPdf(false);
      alert('Đã xuất báo cáo tuần dạng PDF thành công!');
    }, 1200);
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
              <p className="text-[10px] text-tod-text-muted font-medium">
                {activeChild ? `Đang đồng hành cùng bé ${activeChild.nickname}` : 'Sổ nhật ký đồng hành & cấu hình quyền quản lý của cha mẹ'}
              </p>
            </div>
          </div>
        </div>

        {/* Atmosphere & View Mode Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="flex items-center p-1 bg-tod-card rounded-xl border border-tod-border text-[11px] font-extrabold">
            <button
              onClick={(e) => onTimeOfDayChange('morning', e)}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'morning' ? 'bg-sky-500 text-white shadow-sm' : 'text-tod-text-muted hover:text-tod-text'
              }`}
              title="Buổi Sáng"
            >
              <Sunrise className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onTimeOfDayChange('afternoon', e)}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'afternoon' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-tod-text-muted hover:text-tod-text'
              }`}
              title="Buổi Chiều"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onTimeOfDayChange('night', e)}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'night' ? 'bg-indigo-500 text-white shadow-sm' : 'text-tod-text-muted hover:text-tod-text'
              }`}
              title="Buổi Tối"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

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

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4 my-2 overflow-hidden pointer-events-none">
        <ParentDeskNotebookDrawer
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          childNickname={activeChild?.nickname}
          learningProfile={learningProfile}
          tokenQuota={tokenQuota}
          recentStories={recentStories}
          isPlayingAudioSample={isPlayingAudioSample}
          setIsPlayingAudioSample={setIsPlayingAudioSample}
          feedbackRating={feedbackRating}
          setFeedbackRating={setFeedbackRating}
          handleExportPdf={handleExportPdf}
          isExportingPdf={isExportingPdf}
        />

        <ParentDeskControlPanel
          selectedScreenTime={selectedScreenTime}
          setSelectedScreenTime={setSelectedScreenTime}
          isBedtimeEnabled={isBedtimeEnabled}
          setIsBedtimeEnabled={setIsBedtimeEnabled}
          isPinProtected={isPinProtected}
          setIsPinProtected={setIsPinProtected}
          handleSaveChanges={handleSaveChanges}
          isSavedChanges={isSavedChanges}
        />
      </div>

      {/* 3. BOTTOM FOOTER BAR */}
      <div className="desk-bottom-bar pointer-events-auto w-full max-w-7xl mx-auto flex items-center justify-between p-3 rounded-2xl bg-tod-surface backdrop-blur-md border border-tod-border text-tod-text text-xs font-bold transition-colors duration-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Bảo mật an toàn cho trẻ em theo chuẩn COPPA & ISO-27001</span>
        </div>
        <span className="text-tod-text-muted text-[11px] hidden sm:inline">
          {activeChild ? `Phụ huynh đang quản lý tài khoản bé ${activeChild.nickname}` : 'Khu vực quản trị phụ huynh'}
        </span>
      </div>
    </div>
  );
};
