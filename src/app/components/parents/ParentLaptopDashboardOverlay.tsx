'use client';

import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  animateHeaderDown,
  animateModalPop,
  animateStaggerList,
} from '../../utils/gsapAnimations';

import { Users, LogIn } from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';
import { useAuth } from '../../context/AuthContext';
import { useChildSession } from '../../context/ChildSessionContext';
import { ChildProfile } from '../../types/childProfile';
import { flow4Service } from '../../services/flow4Service';
import { Flow4NotificationType } from '../../types/flow4Types';

// Navigation & Common Subcomponents
import { DashboardTopNav, LaptopDashboardTab } from './common/DashboardTopNav';
import { LaptopDashboardTabNav } from './tabs/LaptopDashboardTabNav';
import { ChildProfilesSidebar } from './profiles/ChildProfilesSidebar';
import { useParentLaptopData } from './hooks/useParentLaptopData';
import { LaptopModalsContainer } from './modals/LaptopModalsContainer';
import { NotificationDrawer } from './notifications/NotificationDrawer';

// Domain Subcomponents & Tabs
import { ParentAnalyticsTab } from './tabs/ParentAnalyticsTab';
import { SafetyPolicyControls } from './safety/SafetyPolicyControls';
import { SupervisionManager } from './supervision/SupervisionManager';
import { CreativeControlsTab } from './creative/CreativeControlsTab';
import { AssignmentManagerTab } from './assignments/AssignmentManagerTab';
import { CommunitySharingTab } from './community/CommunitySharingTab';
import { InterventionHoldModeSection } from './intervention/InterventionHoldModeSection';

gsap.registerPlugin(useGSAP);

export interface ParentLaptopDashboardOverlayProps {
  currentStage: number;
  onStageChange: (stageIndex: number) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay, e?: React.MouseEvent) => void;
  onToggleViewMode?: () => void;
  is2DViewAvailable?: boolean;
}

export const ParentLaptopDashboardOverlay: React.FC<ParentLaptopDashboardOverlayProps> = ({
  currentStage: _currentStage,
  onStageChange,
  timeOfDay,
  onTimeOfDayChange,
  onToggleViewMode,
  is2DViewAvailable = false,
}) => {
  const { user, isLoggedIn } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<LaptopDashboardTab>('analytics');
  const [isUiVisible, setIsUiVisible] = useState<boolean>(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const { startChildSession } = useChildSession();
  const laptopData = useParentLaptopData();

  const updateUnreadCount = () => {
    const list = flow4Service.getNotifications();
    setUnreadCount(list.filter((n) => !n.isRead).length);
  };

  useEffect(() => {
    updateUnreadCount();

    // Fetch live notifications from backend API on mount
    flow4Service.fetchNotificationsFromApi().then(() => {
      updateUnreadCount();
    });

    const handleNotificationsUpdated = () => {
      updateUnreadCount();
    };

    window.addEventListener('flow4:notifications-updated', handleNotificationsUpdated);

    const interval = setInterval(() => {
      flow4Service.fetchNotificationsFromApi().then(() => {
        updateUnreadCount();
      });
    }, 15000);

    return () => {
      window.removeEventListener('flow4:notifications-updated', handleNotificationsUpdated);
      clearInterval(interval);
    };
  }, []);

  const handleStartChildSession = (child: ChildProfile) => {
    startChildSession(child, 'SupervisorLaunched');
    onStageChange(2); // Zoom camera thẳng vào Kệ Sách Thần Kỳ (Stage 2)
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsUiVisible(true);
    }, 950);
    return () => clearTimeout(timer);
  }, []);

  // GSAP Entrance Animations
  useGSAP(() => {
    if (!isUiVisible) return;
    animateHeaderDown('.laptop-top-bar');
    animateModalPop('.laptop-unified-card', { delay: 0.08 });
    animateStaggerList('.laptop-metric-item', { delay: 0.22, stagger: 0.05 });
  }, { scope: containerRef, dependencies: [isUiVisible] });

  // Stagger animation on tab change
  useGSAP(() => {
    if (!isUiVisible) return;
    animateStaggerList('.laptop-tab-content-row', { stagger: 0.04, duration: 0.3 });
  }, { scope: containerRef, dependencies: [activeTab, isUiVisible] });

  const handleNotificationAction = (type: Flow4NotificationType) => {
    setIsNotificationDrawerOpen(false);
    updateUnreadCount();
    if (type === Flow4NotificationType.AssignmentCancelled || type === Flow4NotificationType.TeacherInteractionScore) {
      setActiveTab('assignments');
    } else if (type === Flow4NotificationType.HoldModeAlert) {
      setActiveTab('interventions');
    } else if (type === Flow4NotificationType.StoryShared) {
      setActiveTab('community');
    }
  };

  if (!isUiVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      data-time-of-day={timeOfDay}
      className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 overflow-hidden z-30 font-sans theme-${timeOfDay} transition-colors duration-500`}
    >
      {/* 1. TOP HEADER FLOATING GLASSBAR */}
      <DashboardTopNav
        onStageChange={onStageChange}
        timeOfDay={timeOfDay}
        onTimeOfDayChange={onTimeOfDayChange}
        onToggleViewMode={onToggleViewMode}
        is2DViewAvailable={is2DViewAvailable}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAcceptInviteModal={() => {
          laptopData.setAcceptInviteError(null);
          laptopData.setAcceptCodeInput('');
          laptopData.setShowAcceptInviteModal(true);
        }}
        onOpenNotificationDrawer={() => {
          setIsNotificationDrawerOpen(true);
          updateUnreadCount();
        }}
        unreadNotificationsCount={unreadCount}
        user={user}
      />

      {/* 2. MAIN DASHBOARD CONTENT AREA - UNIFIED SINGLE PANEL */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex items-center justify-center my-auto px-1 sm:px-2 py-1 overflow-hidden pointer-events-none">
        <div className="laptop-unified-card pointer-events-auto w-full h-[82vh] max-h-[880px] min-h-[580px] flex flex-col lg:flex-row rounded-3xl bg-tod-surface backdrop-blur-3xl border border-tod-border shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-tod-text overflow-hidden transition-colors duration-500">
          
          {/* CỘT TRÁI: DANH SÁCH HỒ SƠ CÁC BÉ */}
          <div className="w-full lg:w-[340px] xl:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r border-tod-border bg-tod-card flex flex-col h-full overflow-hidden transition-colors duration-500">
            <ChildProfilesSidebar
              childProfiles={laptopData.childProfiles}
              selectedChildId={laptopData.selectedChildId}
              onSelectChild={(id) => laptopData.setSelectedChildId(id)}
              isLoadingChildren={laptopData.isLoadingChildren}
              onOpenAddChildModal={laptopData.handleOpenAddChildModal}
              onOpenAcceptInviteModal={() => {
                laptopData.setAcceptInviteError(null);
                laptopData.setAcceptCodeInput('');
                laptopData.setShowAcceptInviteModal(true);
              }}
              onActivateChild={laptopData.handleActivateChild}
              activatingChildId={laptopData.activatingChildId}
              onRefresh={laptopData.fetchChildProfiles}
              isLoggedIn={isLoggedIn}
              onLogin={() => onStageChange(4)}
            />
          </div>

          {/* CỘT PHẢI: NỘI DUNG CHÍNH (CÁC TAB ĐIỀU KHIỂN & QUẢN LÝ) */}
          <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-tod-surface/30">
            {/* Navigation Tabs Header */}
            <LaptopDashboardTabNav activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Tab Content Container */}
            <div className="flex-1 p-4 overflow-y-auto dashboard-scrollbar space-y-3.5">
              {/* TAB 1: CHILD PROFILE & LEARNING CONFIGURATION */}
              {activeTab === 'analytics' && (
                <ParentAnalyticsTab
                  selectedChild={laptopData.selectedChild}
                  activatingChildId={laptopData.activatingChildId}
                  handleActivateChild={laptopData.handleActivateChild}
                  setActiveTab={setActiveTab}
                  isEditingChild={laptopData.isEditingChild}
                  setIsEditingChild={laptopData.setIsEditingChild}
                  editNickname={laptopData.editNickname}
                  setEditNickname={laptopData.setEditNickname}
                  editAgeBand={laptopData.editAgeBand}
                  setEditAgeBand={laptopData.setEditAgeBand}
                  editLanguage={laptopData.editLanguage}
                  setEditLanguage={laptopData.setEditLanguage}
                  isSavingEdit={laptopData.isSavingEdit}
                  handleSaveChildProfile={laptopData.handleSaveChildProfile}
                  editSuccessMsg={laptopData.editSuccessMsg}
                  isConfirmingDelete={laptopData.isConfirmingDelete}
                  setIsConfirmingDelete={laptopData.setIsConfirmingDelete}
                  isDeletingChild={laptopData.isDeletingChild}
                  handleDeleteChildProfile={laptopData.handleDeleteChildProfile}
                  deleteError={laptopData.deleteError}
                  availableOrgs={laptopData.availableOrgs}
                  availableClasses={laptopData.availableClasses}
                  setShowSetupPinModal={laptopData.setShowSetupPinModal}
                  setShowEasyLoginBadgeModal={laptopData.setShowEasyLoginBadgeModal}
                  handleStartChildSession={handleStartChildSession}
                  credentialVersion={laptopData.credentialVersion}
                  learningProfile={laptopData.learningProfile}
                  isEditingLearningProfile={laptopData.isEditingLearningProfile}
                  setIsEditingLearningProfile={laptopData.setIsEditingLearningProfile}
                  learningReadingLevel={laptopData.learningReadingLevel}
                  setLearningReadingLevel={laptopData.setLearningReadingLevel}
                  learningComprehensionGoal={laptopData.learningComprehensionGoal}
                  setLearningComprehensionGoal={laptopData.setLearningComprehensionGoal}
                  learningTopics={laptopData.learningTopics}
                  setLearningTopics={laptopData.setLearningTopics}
                  customTopicInput={laptopData.customTopicInput}
                  setCustomTopicInput={laptopData.setCustomTopicInput}
                  isSavingLearningProfile={laptopData.isSavingLearningProfile}
                  handleSaveLearningProfile={laptopData.handleSaveLearningProfile}
                  learningProfileSuccessMsg={laptopData.learningProfileSuccessMsg}
                  learningProfileErrorMsg={laptopData.learningProfileErrorMsg}
                  isLoadingDetail={laptopData.isLoadingDetail}
                  fetchChildDetail={laptopData.fetchChildDetail}
                  safetyPolicy={laptopData.safetyPolicy}
                  contentCategories={laptopData.contentCategories}
                  tokenQuota={laptopData.tokenQuota}
                  handleOpenAddChildModal={laptopData.handleOpenAddChildModal}
                  isLoggedIn={isLoggedIn}
                  onLogin={() => onStageChange(4)}
                />
              )}

              {/* TAB 2: ASSIGNMENT MANAGEMENT (LUỒNG 4.1 & 4.1b & 4.4) */}
              {activeTab === 'assignments' && (
                <AssignmentManagerTab onLogin={() => onStageChange(4)} />
              )}

              {/* TAB 3: COMMUNITY SHARING & CLASS GATEKEEPING (LUỒNG 4.2) */}
              {activeTab === 'community' && (
                <CommunitySharingTab />
              )}

              {/* TAB 4: PEDAGOGICAL INTERVENTION & HOLD MODE (LUỒNG 4.5) */}
              {activeTab === 'interventions' && (
                <InterventionHoldModeSection />
              )}

              {/* TAB 5: SAFETY POLICY CONTROLS */}
              {activeTab === 'controls' && laptopData.selectedChild && (
                <SafetyPolicyControls
                  selectedChildNickname={laptopData.selectedChild.nickname}
                  safetyPolicy={laptopData.safetyPolicy}
                  safetyMaxStoryLength={laptopData.safetyMaxStoryLength}
                  setSafetyMaxStoryLength={laptopData.setSafetyMaxStoryLength}
                  safetyApprovalMode={laptopData.safetyApprovalMode}
                  setSafetyApprovalMode={laptopData.setSafetyApprovalMode}
                  safetyParentalGate={laptopData.safetyParentalGate}
                  setSafetyParentalGate={laptopData.setSafetyParentalGate}
                  safetyConsent={laptopData.safetyConsent}
                  setSafetyConsent={laptopData.setSafetyConsent}
                  contentCategories={laptopData.contentCategories}
                  safetyCategories={laptopData.safetyCategories}
                  setSafetyCategories={laptopData.setSafetyCategories}
                  isLoadingCategories={laptopData.isLoadingCategories}
                  isSavingSafety={laptopData.isSavingSafety}
                  isSavedChanges={laptopData.isSavedChanges}
                  handleSaveSafetyPolicy={laptopData.handleSaveSafetyPolicy}
                  safetyErrorMsg={laptopData.safetyErrorMsg}
                  safetySuccessMsg={laptopData.safetySuccessMsg}
                />
              )}

              {/* TAB 6: SUPERVISION MANAGEMENT */}
              {activeTab === 'supervision' && (
                laptopData.selectedChild ? (
                  <SupervisionManager
                    childNickname={laptopData.selectedChild.nickname}
                    supervisors={laptopData.supervisors}
                    invitations={laptopData.invitations}
                    isLoadingSupervision={laptopData.isLoadingSupervision}
                    supervisionError={laptopData.supervisionError}
                    supervisionSuccessMsg={laptopData.supervisionSuccessMsg}
                    isInviting={laptopData.isInviting}
                    setIsInviting={laptopData.setIsInviting}
                    inviteEmail={laptopData.inviteEmail}
                    setInviteEmail={laptopData.setInviteEmail}
                    inviteExpiresDays={laptopData.inviteExpiresDays}
                    setInviteExpiresDays={laptopData.setInviteExpiresDays}
                    isSendingInvite={laptopData.isSendingInvite}
                    handleSendInvitation={laptopData.handleCreateInvitation}
                    onOpenPermissionsModal={laptopData.handleOpenPermissions}
                    onOpenTransferOwnershipModal={(sup) => {
                      laptopData.setTransferError(null);
                      laptopData.setTransferTargetSupervisor(sup);
                    }}
                    onOpenAcceptInviteModal={() => {
                      laptopData.setAcceptInviteError(null);
                      laptopData.setAcceptCodeInput('');
                      laptopData.setShowAcceptInviteModal(true);
                    }}
                    revokingRelId={laptopData.revokingRelId}
                    handleRevokeSupervision={(relId) => laptopData.handleRevokeSupervision(relId)}
                    cancellingInvId={laptopData.cancellingInvId}
                    handleCancelInvitation={laptopData.handleCancelInvitation}
                    handleReissueInvitation={laptopData.handleReissueInvitation}
                    copiedCode={laptopData.copiedCode}
                    handleCopyInviteCode={laptopData.handleCopyCode}
                    onRefresh={() => laptopData.fetchSupervisionData(laptopData.selectedChild!.id)}
                  />
                ) : (
                  <div className="text-center py-12 px-4 rounded-3xl bg-tod-card border border-tod-border space-y-3 shadow-sm text-tod-text">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mx-auto">
                      {isLoggedIn ? <Users className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-tod-text">
                        {isLoggedIn ? 'Chưa chọn hồ sơ bé' : 'Chưa Đăng Nhập'}
                      </h3>
                      <p className="text-xs text-tod-text-muted max-w-sm mx-auto">
                        {isLoggedIn
                          ? 'Vui lòng chọn một hồ sơ bé từ danh sách bên trái hoặc nhập mã mời giám sát bạn nhận được.'
                          : 'Vui lòng đăng nhập tài khoản ở góc trên bên phải để xem thông tin giám sát và quản lý học sinh.'}
                      </p>
                    </div>
                    {isLoggedIn && (
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            laptopData.setAcceptInviteError(null);
                            laptopData.setAcceptCodeInput('');
                            laptopData.setShowAcceptInviteModal(true);
                          }}
                          className="btn-dashboard-primary text-xs px-4 py-2"
                        >
                          Nhập Mã Mời Giám Sát
                        </button>
                        <button
                          type="button"
                          onClick={() => laptopData.setShowAddChildModal(true)}
                          className="px-4 py-2 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text text-xs font-bold transition-colors cursor-pointer"
                        >
                          + Tạo Hồ Sơ Bé Mới
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* TAB 7: CONVERSATION STARTERS & CREATIVE CONTROLS */}
              {activeTab === 'prompts' && (
                <CreativeControlsTab
                  selectedChild={laptopData.selectedChild}
                  isPlayingAudio={laptopData.isPlayingAudio}
                  setIsPlayingAudio={laptopData.setIsPlayingAudio}
                  feedbackRating={laptopData.feedbackRating}
                  setFeedbackRating={laptopData.setFeedbackRating}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ALL MODAL DIALOGS EXTRACTED CONTAINER */}
      <LaptopModalsContainer laptopData={laptopData} />

      {/* NOTIFICATION DRAWER (LUỒNG 4 NOTIFICATIONS) */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onSelectAction={handleNotificationAction}
      />
    </div>
  );
};
