'use client';

import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { RoomCanvas, TimeOfDay } from '../../components/three/RoomCanvas';
import { getVietnamTimeOfDay } from '../../components/three/room/stages';
import { ParentDeskZoomOverlay } from '../../components/parents/ParentDeskZoomOverlay';

// Import sub-components from src/app/components/parents
import { ParentHeaderBanner } from '../../components/parents/ParentHeaderBanner';
import { ParentWeeklyStats } from '../../components/parents/ParentWeeklyStats';
import { CompetencyReportSection } from '../../components/parents/CompetencyReportSection';
import { ConversationTopicSection } from '../../components/parents/ConversationTopicSection';
import { ParentControlPanel } from '../../components/parents/ParentControlPanel';
import { RecentReadingActivity } from '../../components/parents/RecentReadingActivity';
import { Box, Sparkles, Users } from 'lucide-react';

export const ParentsView: React.FC = () => {
  const { t } = useTranslation();

  // Mode View State: 3D Desk Zoom View vs 2D Detailed Dashboard
  const [viewMode, setViewMode] = useState<'3d-desk' | '2d-grid'>('3d-desk');
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(1); // Default Stage 1 = Desk Stage
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getVietnamTimeOfDay);

  // State controls for Parent Settings
  const [selectedScreenTime, setSelectedScreenTime] = useState<number>(30);
  const [isBedtimeEnabled, setIsBedtimeEnabled] = useState<boolean>(true);
  const [isPinProtected, setIsPinProtected] = useState<boolean>(true);
  const [feedbackRating, setFeedbackRating] = useState<string | null>('like');
  const [isSavedChanges, setIsSavedChanges] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isPlayingAudioSample, setIsPlayingAudioSample] = useState<boolean>(false);

  // Handle Save Changes
  const handleSaveChanges = () => {
    setIsSavedChanges(true);
    setTimeout(() => setIsSavedChanges(false), 3000);
  };

  // Handle PDF export simulation
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      setIsExportingPdf(false);
      alert('Đã xuất báo cáo tuần dạng PDF thành công!');
    }, 1500);
  };

  // IF 3D DESK ZOOM VIEW MODE IS ACTIVE:
  if (viewMode === '3d-desk') {
    return (
      <div className="relative w-screen h-screen overflow-hidden select-none bg-zinc-950">
        {/* Fullscreen 3D Room Canvas Focused on Desk (Stage 1) */}
        <RoomCanvas
          currentStageIndex={currentStageIndex}
          onStageChange={(idx) => {
            setCurrentStageIndex(idx);
          }}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
        />

        {/* Floating Glassmorphic Parent Desk Zoom Overlay */}
        <ParentDeskZoomOverlay
          currentStage={currentStageIndex}
          onStageChange={setCurrentStageIndex}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
          onToggleViewMode={() => setViewMode('2d-grid')}
          is2DViewAvailable={true}
        />
      </div>
    );
  }

  // IF 2D DETAILED DASHBOARD VIEW MODE IS ACTIVE:
  return (
    <div className="min-h-screen bg-background text-on-background py-6 px-3 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* 3D DESK PROMOTIONAL BANNER CTA */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-black shadow-md shrink-0">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-on-surface flex items-center justify-center sm:justify-start gap-2">
                <span>Trải Nghiệm Góc Quản Lý 3D Bàn Học</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 text-[10px] font-black uppercase">
                  Góc Nhìn Zoom 3D
                </span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Tương tác trực tiếp với cuốn sổ nhật ký phụ huynh trên bàn học 3D, cài đặt thời gian & gợi ý câu hỏi trò chuyện AI.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setCurrentStageIndex(1);
              setViewMode('3d-desk');
            }}
            className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 hover:from-sky-400 hover:to-purple-400 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-sky-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Zoom Vào Bàn Học 3D</span>
          </button>
        </div>

        {/* 1. TOP PROFILE & COMPLIANCE BANNER */}
        <ParentHeaderBanner />

        {/* 2. SECTION 1: WEEKLY STATS */}
        <ParentWeeklyStats />

        {/* 3. SECTION 2: COMPETENCY REPORT & CONVERSATION TOPICS */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <CompetencyReportSection />
          </div>
          <div className="lg:col-span-5">
            <ConversationTopicSection
              isPlayingAudioSample={isPlayingAudioSample}
              setIsPlayingAudioSample={setIsPlayingAudioSample}
              feedbackRating={feedbackRating}
              setFeedbackRating={setFeedbackRating}
            />
          </div>
        </section>

        {/* 4. SECTION 3: PARENT CONTROL PANEL */}
        <ParentControlPanel
          isPinProtected={isPinProtected}
          setIsPinProtected={setIsPinProtected}
          selectedScreenTime={selectedScreenTime}
          setSelectedScreenTime={setSelectedScreenTime}
          isBedtimeEnabled={isBedtimeEnabled}
          setIsBedtimeEnabled={setIsBedtimeEnabled}
          handleSaveChanges={handleSaveChanges}
          isSavedChanges={isSavedChanges}
        />

        {/* 5. SECTION 4: RECENT READING ACTIVITY */}
        <RecentReadingActivity
          handleExportPdf={handleExportPdf}
          isExportingPdf={isExportingPdf}
        />

      </div>
    </div>
  );
};
