'use client';

import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';

// Import sub-components from src/app/components/parents
import { ParentHeaderBanner } from '../../components/parents/ParentHeaderBanner';
import { ParentWeeklyStats } from '../../components/parents/ParentWeeklyStats';
import { CompetencyReportSection } from '../../components/parents/CompetencyReportSection';
import { ConversationTopicSection } from '../../components/parents/ConversationTopicSection';
import { ParentControlPanel } from '../../components/parents/ParentControlPanel';
import { RecentReadingActivity } from '../../components/parents/RecentReadingActivity';

export const ParentsView: React.FC = () => {
  const { t } = useTranslation();

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

  return (
    <div className="min-h-screen bg-background text-on-background py-6 px-3 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
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
