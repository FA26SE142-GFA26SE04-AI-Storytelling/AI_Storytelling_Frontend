'use client';

import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  animateHeaderDown,
  animateModalPop,
  animateStaggerList,
} from '../../utils/gsapAnimations';

import {
  Users,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';
import { useAuth } from '../../context/AuthContext';
import { useChildSession } from '../../context/ChildSessionContext';
import { ChildProfile } from '../../types/childProfile';
import { childAccessCredentialService } from '../../services/childAccessCredentialService';

// Domain Subcomponents
import { DashboardTopNav } from './common/DashboardTopNav';
import { ChildProfilesSidebar } from './profiles/ChildProfilesSidebar';
import { ParentAnalyticsTab } from './tabs/ParentAnalyticsTab';
import { SafetyPolicyControls } from './safety/SafetyPolicyControls';
import { SupervisionManager } from './supervision/SupervisionManager';
import { CreativeControlsTab } from './creative/CreativeControlsTab';
import { useParentLaptopData } from './hooks/useParentLaptopData';

// Modal Dialogs
import { AddChildModal } from './modals/AddChildModal';
import { SupervisionPermissionsModal } from './modals/SupervisionPermissionsModal';
import { TransferOwnershipModal } from './modals/TransferOwnershipModal';
import { AcceptInvitationModal } from './modals/AcceptInvitationModal';
import { SetupChildPinModal } from './modals/SetupChildPinModal';
import { EasyLoginCardModal } from './modals/EasyLoginCardModal';

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
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'controls' | 'supervision' | 'prompts'>('analytics');
  const [isUiVisible, setIsUiVisible] = useState<boolean>(false);
  const { startChildSession } = useChildSession();

  const laptopData = useParentLaptopData();

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
        user={user}
      />

      {/* 2. MAIN DASHBOARD CONTENT AREA - UNIFIED SINGLE PANEL */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex items-center justify-center my-auto px-1 sm:px-2 py-1 overflow-hidden pointer-events-none">
        <div className="laptop-unified-card pointer-events-auto w-full h-[80vh] max-h-[860px] min-h-[580px] flex flex-col lg:flex-row rounded-3xl bg-tod-surface backdrop-blur-3xl border border-tod-border shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-tod-text overflow-hidden transition-colors duration-500">
          
          {/* CỘT TRÁI: DANH SÁCH HỒ SƠ CÁC BÉ */}
          <div className="w-full lg:w-[350px] xl:w-[370px] shrink-0 border-b lg:border-b-0 lg:border-r border-tod-border bg-tod-card flex flex-col h-full overflow-hidden transition-colors duration-500">
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
            />
          </div>

          {/* CỘT PHẢI: NỘI DUNG CHÍNH (CÁC TAB ĐIỀU KHIỂN & QUẢN LÝ) */}
          <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-tod-surface/30">
            {/* Navigation Tabs Header */}
            <div className="p-2.5 sm:p-3 bg-tod-card/80 border-b border-tod-border flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none shrink-0 transition-colors duration-500">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'analytics'
                    ? 'bg-sky-500 text-white font-black shadow-md shadow-sky-500/20'
                    : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Hồ Sơ & Học Tập</span>
              </button>
              <button
                onClick={() => setActiveTab('controls')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'controls'
                    ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-500/20'
                    : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Kiểm Soát An Toàn</span>
              </button>
              <button
                onClick={() => setActiveTab('supervision')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'supervision'
                    ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-500/20'
                    : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Người Giám Sát</span>
              </button>
              <button
                onClick={() => setActiveTab('prompts')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'prompts'
                    ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gợi Ý Trò Chuyện</span>
              </button>
            </div>

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
                />
              )}

              {/* TAB 2: SAFETY POLICY CONTROLS */}
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

              {/* TAB 3: SUPERVISION MANAGEMENT */}
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
                    <Users className="w-10 h-10 text-indigo-500 mx-auto" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-tod-text">Chưa chọn hồ sơ bé</h3>
                      <p className="text-xs text-tod-text-muted max-w-sm mx-auto">
                        Vui lòng chọn một hồ sơ bé từ danh sách bên trái hoặc nhập mã mời giám sát bạn nhận được.
                      </p>
                    </div>
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
                  </div>
                )
              )}

              {/* TAB 4: CONVERSATION STARTERS & CREATIVE CONTROLS */}
              {activeTab === 'prompts' && (
                <CreativeControlsTab
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

      {/* MODAL 1: ADD NEW CHILD PROFILE */}
      <AddChildModal
        isOpen={laptopData.showAddChildModal}
        onClose={() => laptopData.setShowAddChildModal(false)}
        newChildNickname={laptopData.newChildNickname}
        setNewChildNickname={laptopData.setNewChildNickname}
        newChildAgeBand={laptopData.newChildAgeBand}
        setNewChildAgeBand={laptopData.setNewChildAgeBand}
        newChildLanguage={laptopData.newChildLanguage}
        setNewChildLanguage={laptopData.setNewChildLanguage}
        newChildScope={laptopData.newChildScope}
        setNewChildScope={laptopData.setNewChildScope}
        newChildOrgId={laptopData.newChildOrgId}
        setNewChildOrgId={laptopData.setNewChildOrgId}
        newChildClassGroupId={laptopData.newChildClassGroupId}
        setNewChildClassGroupId={laptopData.setNewChildClassGroupId}
        availableOrgs={laptopData.availableOrgs}
        availableClasses={laptopData.availableClasses}
        isLoadingOrgsAndClasses={laptopData.isLoadingOrgsAndClasses}
        loadOrgsAndClasses={laptopData.loadOrgsAndClasses}
        isCreatingChild={laptopData.isCreatingChild}
        createChildModalError={laptopData.createChildModalError}
        handleCreateChildSubmit={laptopData.handleCreateChildSubmit}
      />

      {/* MODAL 2: SUPERVISOR PERMISSIONS MANAGEMENT */}
      <SupervisionPermissionsModal
        targetSupervisor={laptopData.permissionTargetSupervisor}
        childNickname={laptopData.selectedChild?.nickname || ''}
        childScope={laptopData.selectedChild?.scope}
        onClose={() => laptopData.setPermissionTargetSupervisor(null)}
        supervisorPermissions={laptopData.supervisorPermissions}
        isLoadingPermissions={laptopData.isLoadingPermissions}
        permissionModalError={laptopData.permissionModalError}
        togglingPermissionKey={laptopData.togglingPermissionKey}
        handleTogglePermission={laptopData.handleTogglePermission}
      />

      {/* MODAL 3: TRANSFER OWNERSHIP MODAL */}
      <TransferOwnershipModal
        targetSupervisor={laptopData.transferTargetSupervisor}
        childNickname={laptopData.selectedChild?.nickname || ''}
        onClose={() => laptopData.setTransferTargetSupervisor(null)}
        isTransferringOwnership={laptopData.isTransferringOwnership}
        transferError={laptopData.transferError}
        onConfirmTransfer={laptopData.handleTransferOwnershipSubmit}
      />

      {/* MODAL 4: ACCEPT INVITATION MODAL */}
      <AcceptInvitationModal
        isOpen={laptopData.showAcceptInviteModal}
        onClose={() => laptopData.setShowAcceptInviteModal(false)}
        acceptCodeInput={laptopData.acceptCodeInput}
        setAcceptCodeInput={laptopData.setAcceptCodeInput}
        isAcceptingInvite={laptopData.isAcceptingInvite}
        acceptInviteError={laptopData.acceptInviteError}
        onAcceptSubmit={laptopData.handleAcceptInvitationSubmit}
        onRejectSubmit={laptopData.handleRejectInvitationSubmit}
      />

      {/* MODAL 5: SETUP CHILD PIN & AVATAR MODAL */}
      <SetupChildPinModal
        isOpen={laptopData.showSetupPinModal}
        onClose={() => laptopData.setShowSetupPinModal(false)}
        child={laptopData.selectedChild}
        onCredentialUpdated={() => {
          laptopData.setCredentialVersion((prev) => prev + 1);
        }}
      />

      {/* MODAL 6: EASY LOGIN CARD & BADGE MODAL */}
      <EasyLoginCardModal
        isOpen={laptopData.showEasyLoginBadgeModal}
        onClose={() => laptopData.setShowEasyLoginBadgeModal(false)}
        child={laptopData.selectedChild}
        credential={laptopData.selectedChild ? childAccessCredentialService.getCredential(laptopData.selectedChild.id) : null}
      />
    </div>
  );
};
