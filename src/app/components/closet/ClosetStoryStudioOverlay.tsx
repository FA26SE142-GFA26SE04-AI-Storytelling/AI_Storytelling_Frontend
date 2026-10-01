'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ArrowLeft,
  Sparkles,
  Bot,
  Layers,
  Wand2,
  BookOpen,
  CheckCircle2,
  Palette,
} from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';
import { TimeOfDaySwitcher } from '../common/TimeOfDaySwitcher';
import { childProfileService } from '../../services/childProfileService';
import { ChildProfile } from '../../types/childProfile';
import { useAuth } from '../../context/AuthContext';
import { aiStoryCreationService } from '../../services/aiStoryCreationService';
import { contentDestination, normalizeStoryStatus } from './hooks/storyGenerationFlow';
import { readStorySession, writeStorySession, removeStorySession, StoryStudioSnapshot } from './hooks/storyStudioSession';
import { AIStoryOutlineHistory } from './subcomponents/AIStoryOutlineHistory';

// Steps
import { Step1_ChooseCreationMethod } from './steps/Step1_ChooseCreationMethod';
import { Step2A_AiPromptAndOutline } from './steps/Step2A_AiPromptAndOutline';
import { Step2B_ExistingStoryImport } from './steps/Step2B_ExistingStoryImport';
import { Step3_MaterialGenProgress } from './steps/Step3_MaterialGenProgress';
import { Step4_ReviewAndFineTune } from './steps/Step4_ReviewAndFineTune';
import { Step5_MediaProductionProgress } from './steps/Step5_MediaProductionProgress';

gsap.registerPlugin(useGSAP);

export interface ClosetStoryStudioOverlayProps {
  currentStage: number;
  onStageChange: (stageIndex: number) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay, e?: React.MouseEvent) => void;
  onSelectBookToRead?: (storyId: string) => void;
}

export const ClosetStoryStudioOverlay: React.FC<ClosetStoryStudioOverlayProps> = ({
  onStageChange,
  timeOfDay,
  onTimeOfDayChange,
  onSelectBookToRead,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUiVisible, setIsUiVisible] = useState<boolean>(false);

  // Stepper state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [creationMethod, setCreationMethod] = useState<'ai_prompt' | 'existing_import' | null>(null);
  const [activeStoryId, setActiveStoryId] = useState<number | null>(null);

  // Child profiles state
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const { user } = useAuth();
  const userId = user?.id;
  const [restored, setRestored] = useState<StoryStudioSnapshot | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreRun, setRestoreRun] = useState(0);
  const [childError, setChildError] = useState<string | null>(null);
  const childId = selectedChild?.id;

  useEffect(() => {
    setCurrentStep(1); setActiveStoryId(null); setRestored(null); setCreationMethod(null); setRestoreError(null);
    setRestoring(false);
    if (!userId || !childId) return;
    const snapshot = readStorySession(userId, childId);
    if (!snapshot) { setRestoring(false); return; }
    const c = new AbortController(); setRestoring(true);
    void aiStoryCreationService.getGenerationProgress(snapshot.storyId, c.signal).then(async result => {
      if (c.signal.aborted) return;
      if (!result.success || !result.data) { setRestoreError(result.message); return; }
      const destination = contentDestination(result.data);
      if (destination === 'stopped') { setRestoreError('Câu chuyện đã dừng hoặc được lưu trữ.'); return; }
      let step: 2 | 3 | 4 | 5 = destination === 'media' ? 5 : destination === 'review' ? 4 : 3;
      if (!result.data.stableStoryVersionId && result.data.currentStep === 'not_started') {
        const outline = await aiStoryCreationService.getOutline(snapshot.storyId, c.signal);
        if (c.signal.aborted) return;
        if (!outline.success || !outline.data) { setRestoreError(outline.message); return; }
        step = outline.data.currentVersion?.outlineApprovedAt ? 3 : 2;
        if (['archived', 'rejected'].includes(normalizeStoryStatus(outline.data.storyStatus))) { setRestoreError('Câu chuyện đã dừng.'); return; }
      }
      setRestored(snapshot); setActiveStoryId(snapshot.storyId); setCreationMethod('ai_prompt'); setCurrentStep(step);
    }).finally(() => { if (!c.signal.aborted) setRestoring(false); });
    return () => c.abort();
  }, [userId, childId, restoreRun]);

  const recordInput = useCallback((storyId: number, requestId: number) => {
    if (userId && childId) writeStorySession(userId, childId, { storyId, requestId });
  }, [userId, childId]);

  // Chờ camera zoom vào Tủ Trượt và cửa mở ~850ms rồi hiện UI nổi
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsUiVisible(true);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  // Fetch children list
  useEffect(() => {
    let alive = true;
    setChildrenList([]); setSelectedChild(null); setChildError(null);
    if (!userId) return;
    childProfileService.getMyChildProfiles().then((res) => {
      if (!alive) return;
      if (res.success && res.data && res.data.length > 0) {
        setChildrenList(res.data);
        setSelectedChild(res.data[0]);
      } else {
        setChildError(res.message || 'Chưa có hồ sơ bé để sáng tác.');
      }
    });
    return () => { alive = false; };
  }, [userId]);

  // GSAP Entrance
  useGSAP(() => {
    if (!isUiVisible) return;
    gsap.fromTo(
      '.closet-studio-card',
      { opacity: 0, scale: 0.96, y: 15 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    );
  }, { scope: containerRef, dependencies: [isUiVisible] });

  // Handle switching to convergence step 3
  const handleProceedToConvergence = (storyId: number) => {
    setActiveStoryId(storyId);
    setCurrentStep(3);
  };

  // Handle switching to review step 4
  const handleProceedToReview = () => {
    setCurrentStep(4);
  };

  // Handle switching to media step 5
  const handleProceedToMedia = (storyId: number) => {
    setActiveStoryId(storyId);
    setCurrentStep(5);
  };

  // Handle ready to read -> navigate to Stage 1 (Desk reading)
  const handleReadStory = (storyId: number) => {
    if (onSelectBookToRead) {
      onSelectBookToRead(`story-${storyId}`);
    }
    onStageChange(1); // Zoom vào Bàn học đọc sách
  };

  if (!isUiVisible) return null;

  return (
    <div
      ref={containerRef}
      data-time-of-day={timeOfDay}
      className={`fixed inset-0 z-30 pointer-events-auto flex flex-col justify-between p-3 sm:p-6 font-sans theme-${timeOfDay} transition-colors duration-500`}
    >
      {/* 1. TOP BAR NAVIGATION */}
      <div className="flex items-center justify-between gap-3 w-full">
        <button
          type="button"
          onClick={() => onStageChange(0)}
          className="px-4 py-2.5 rounded-2xl bg-tod-surface hover:bg-tod-card text-tod-text font-extrabold text-xs flex items-center gap-2 border border-tod-border shadow-xl backdrop-blur-xl transition-all hover:scale-105 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>Quay lại phòng 3D</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Friendly Robot Greeting Badge */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-tod-card border border-tod-border text-tod-text text-xs font-bold backdrop-blur-md shadow-md">
            <Bot className="w-4 h-4 text-sky-500 animate-bounce" />
            <span>Robot Trợ Lý Sáng Tác</span>
          </div>

          <TimeOfDaySwitcher
            timeOfDay={timeOfDay}
            onTimeOfDayChange={onTimeOfDayChange}
            className="shadow-xl"
          />
        </div>
      </div>

      {/* 2. MAIN STUDIO GLASS PANEL CONTAINER (PUSHED TO THE RIGHT & ENLARGED) */}
      <div className="w-full lg:w-[68%] xl:w-[64%] 2xl:w-[60%] ml-auto my-auto py-1 pr-0 lg:pr-4">
        <div className="closet-studio-card p-5 sm:p-7 rounded-3xl bg-tod-surface border border-tod-border shadow-2xl backdrop-blur-3xl text-tod-text flex flex-col max-h-[88vh] overflow-y-auto dashboard-scrollbar transition-colors duration-500">
          {/* STEPPER HEADER (5 BƯỚC) */}
          <div className="pb-4 mb-4 border-b border-tod-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-tod-text tracking-tight">
                  Xưởng Sáng Tác Truyện Thần Kỳ
                </h2>
                <p className="text-xs text-tod-text-muted mt-0.5">
                  Cùng chú Robot trên đệm tạo nên những câu chuyện kỳ thú cho bé
                </p>
              </div>
            </div>

            {/* Stepper Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[
                { step: 1, label: 'Khởi nguồn', icon: Layers },
                { step: 2, label: 'Cốt truyện', icon: Wand2 },
                { step: 3, label: 'Truyện & học liệu', icon: BookOpen },
                { step: 4, label: 'Tinh chỉnh', icon: CheckCircle2 },
                { step: 5, label: 'Xuất bản', icon: Palette },
              ].map((s) => {
                const isPassed = currentStep > s.step;
                const isCurrent = currentStep === s.step;
                const IconComp = s.icon;
                return (
                  <div
                    key={s.step}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                      isCurrent
                        ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-400/80 shadow-md scale-105'
                        : isPassed
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'text-tod-text-muted/60 border border-tod-border'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP CONTENT BODY */}
          <div className="flex-1">
            {childError && <p role="alert" className="text-sm text-rose-500">{childError}</p>}
            {userId && childId && (activeStoryId || restored || restoreError) && <button type="button" className="dashboard-card px-4 py-2 mb-3" onClick={() => {
              if (!window.confirm('Bắt đầu câu chuyện khác? Câu chuyện đang xử lý trên máy chủ sẽ không bị hủy.')) return;
              removeStorySession(userId, childId); setRestoreRun(value => value + 1);
            }}>Bắt đầu câu chuyện khác</button>}
            {/* BƯỚC 1: CHỌN HÌNH THỨC SÁNG TÁC */}
            {(restoring || restoreError) && <div className="space-y-3"><p role={restoreError ? 'alert' : undefined}>{restoreError || 'Đang khôi phục tiến trình sáng tác...'}</p>{restoreError && <button type="button" onClick={() => setRestoreRun(value => value + 1)}>Kiểm tra lại trạng thái</button>}</div>}
            {!restoring && !restoreError && currentStep >= 3 && activeStoryId && creationMethod === 'ai_prompt' && <div className="mb-4">
              <AIStoryOutlineHistory key={activeStoryId} storyId={activeStoryId} />
            </div>}
            {!restoring && !restoreError && currentStep === 1 && (
              <Step1_ChooseCreationMethod
                childrenList={childrenList}
                selectedChild={selectedChild}
                onSelectChild={(c) => setSelectedChild(c)}
                onSelectMethod={(method) => {
                  setCreationMethod(method);
                  setCurrentStep(2);
                }}
              />
            )}

            {/* BƯỚC 2A: BÚT THẦN AI SÁNG TÁC */}
            {!restoring && !restoreError && currentStep === 2 && creationMethod === 'ai_prompt' && (
              <Step2A_AiPromptAndOutline
                key={`${user?.id}:${childId}`}
                selectedChild={selectedChild}
                resumedStoryId={restored?.storyId}
                resumedRequestId={restored?.requestId}
                onInputProgress={recordInput}
                onProceedToConvergence={handleProceedToConvergence}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {/* BƯỚC 2B: GỬI GẮM TRUYỆN CÓ SẴN / TẢI TỆP */}
            {!restoring && !restoreError && currentStep === 2 && creationMethod === 'existing_import' && (
              <Step2B_ExistingStoryImport
                selectedChild={selectedChild}
                onProceedToConvergence={handleProceedToConvergence}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {/* BƯỚC 3: PHÒNG THÍ NGHIỆM HỌC LIỆU NGẦM */}
            {!restoring && !restoreError && currentStep === 3 && activeStoryId && (
              <Step3_MaterialGenProgress
                storyId={activeStoryId}
                onProceedToReview={handleProceedToReview}
                onProceedToMedia={handleProceedToMedia}
              />
            )}

            {/* BƯỚC 4: XEM & TINH CHỈNH GÓI HỌC LIỆU */}
            {!restoring && !restoreError && currentStep === 4 && activeStoryId && (
              <Step4_ReviewAndFineTune
                storyId={activeStoryId}
                onProceedToMedia={handleProceedToMedia}
                onBack={() => onStageChange(0)}
              />
            )}

            {/* BƯỚC 5: XƯỞNG TRANH & LỒNG TIẾNG TTS */}
            {!restoring && !restoreError && currentStep === 5 && activeStoryId && (
              <Step5_MediaProductionProgress
                storyId={activeStoryId}
                onReadStory={handleReadStory}
                onReturnToRoom={() => onStageChange(0)}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM HINT */}
      <div className="text-right pr-2 lg:pr-8 text-[11px] text-tod-text-muted font-medium">
        🤖 Bạn Robot bên trái đang quan sát và hỗ trợ bạn tạo truyện!
      </div>
    </div>
  );
};
