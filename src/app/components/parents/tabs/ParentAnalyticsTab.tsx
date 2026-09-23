'use client';

import React from 'react';
import { User, AlertCircle, RefreshCw, Zap, Users } from 'lucide-react';
import {
  ChildProfile,
  LearningProfile,
  SafetyPolicy,
  TokenQuotaStatus,
  ContentCategory,
  OrganizationSummary,
  ClassGroupSummary,
} from '../../../types/childProfile';

import { ChildProfileDetailCard } from '../profiles/ChildProfileDetailCard';
import { LearningProfileCard } from '../profiles/LearningProfileCard';
import { SafetySummaryCard } from '../profiles/SafetySummaryCard';
import { TokenQuotaCard } from '../profiles/TokenQuotaCard';
import { ChildAccessCredentialCard } from '../profiles/ChildAccessCredentialCard';

export interface ParentAnalyticsTabProps {
  selectedChild: ChildProfile | null;
  activatingChildId: number | null;
  handleActivateChild: (childId: number, nickname: string, ageBand: string) => void;
  setActiveTab: (tab: 'analytics' | 'controls' | 'supervision' | 'prompts') => void;
  isEditingChild: boolean;
  setIsEditingChild: (val: boolean) => void;
  editNickname: string;
  setEditNickname: (val: string) => void;
  editAgeBand: string;
  setEditAgeBand: (val: string) => void;
  editLanguage: string;
  setEditLanguage: (val: string) => void;
  isSavingEdit: boolean;
  handleSaveChildProfile: () => void;
  editSuccessMsg: string | null;
  isConfirmingDelete: boolean;
  setIsConfirmingDelete: (val: boolean) => void;
  isDeletingChild: boolean;
  handleDeleteChildProfile: () => void;
  deleteError: string | null;
  availableOrgs: OrganizationSummary[];
  availableClasses: ClassGroupSummary[];
  setShowSetupPinModal: (val: boolean) => void;
  setShowEasyLoginBadgeModal: (val: boolean) => void;
  handleStartChildSession: (child: ChildProfile) => void;
  credentialVersion: number;
  learningProfile: LearningProfile | null;
  isEditingLearningProfile: boolean;
  setIsEditingLearningProfile: (val: boolean) => void;
  learningReadingLevel: number;
  setLearningReadingLevel: (val: number) => void;
  learningComprehensionGoal: string;
  setLearningComprehensionGoal: (val: string) => void;
  learningTopics: Array<{ topic: string; relation: 'FavoriteTopic' | 'Interested' | 'Avoid' }>;
  setLearningTopics: React.Dispatch<React.SetStateAction<Array<{ topic: string; relation: 'FavoriteTopic' | 'Interested' | 'Avoid' }>>>;
  customTopicInput: string;
  setCustomTopicInput: (val: string) => void;
  isSavingLearningProfile: boolean;
  handleSaveLearningProfile: () => void;
  learningProfileSuccessMsg: string | null;
  learningProfileErrorMsg: string | null;
  isLoadingDetail: boolean;
  fetchChildDetail: (childId: number) => void;
  safetyPolicy: SafetyPolicy | null;
  contentCategories: ContentCategory[];
  tokenQuota: TokenQuotaStatus | null;
  handleOpenAddChildModal: () => void;
}

export const ParentAnalyticsTab: React.FC<ParentAnalyticsTabProps> = ({
  selectedChild,
  activatingChildId,
  handleActivateChild,
  setActiveTab,
  isEditingChild,
  setIsEditingChild,
  editNickname,
  setEditNickname,
  editAgeBand,
  setEditAgeBand,
  editLanguage,
  setEditLanguage,
  isSavingEdit,
  handleSaveChildProfile,
  editSuccessMsg,
  isConfirmingDelete,
  setIsConfirmingDelete,
  isDeletingChild,
  handleDeleteChildProfile,
  deleteError,
  availableOrgs,
  availableClasses,
  setShowSetupPinModal,
  setShowEasyLoginBadgeModal,
  handleStartChildSession,
  credentialVersion,
  learningProfile,
  isEditingLearningProfile,
  setIsEditingLearningProfile,
  learningReadingLevel,
  setLearningReadingLevel,
  learningComprehensionGoal,
  setLearningComprehensionGoal,
  learningTopics,
  setLearningTopics,
  customTopicInput,
  setCustomTopicInput,
  isSavingLearningProfile,
  handleSaveLearningProfile,
  learningProfileSuccessMsg,
  learningProfileErrorMsg,
  isLoadingDetail,
  fetchChildDetail,
  safetyPolicy,
  contentCategories,
  tokenQuota,
  handleOpenAddChildModal,
}) => {
  if (!selectedChild) {
    return (
      <div className="py-12 px-6 rounded-3xl bg-tod-card border border-tod-border text-center flex flex-col items-center justify-center gap-3 shadow-sm">
        <User className="w-10 h-10 text-tod-text-muted opacity-40" />
        <span className="text-sm font-bold text-tod-text">Chưa chọn hồ sơ bé nào</span>
        <p className="text-xs text-tod-text-muted max-w-xs">
          Vui lòng chọn một hồ sơ ở danh sách bên trái hoặc tạo hồ sơ bé mới để bắt đầu thiết lập.
        </p>
        <button
          type="button"
          onClick={handleOpenAddChildModal}
          className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          + Tạo Hồ Sơ Bé Mới
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Draft Banner if status is Draft */}
      {selectedChild.status === 'Draft' && (
        <div className="laptop-metric-item p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-sm flex items-start gap-3 text-amber-700 dark:text-amber-200 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-700 dark:text-amber-300">Hồ sơ mới tạo (Bản nháp)</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono text-amber-700 dark:text-amber-300 font-bold">
                Chờ kích hoạt
              </span>
            </div>
            <p className="text-[11px] text-tod-text-muted leading-relaxed">
              Hồ sơ trẻ độc lập đã được tạo thành công. Vui lòng thiết lập <strong>Hồ sơ học tập</strong> và <strong>Quy tắc an toàn</strong> bên dưới trước khi bấm nút <strong>Kích hoạt</strong> để đưa bé vào trạng thái Đang hoạt động.
            </p>
            <button
              type="button"
              onClick={() => handleActivateChild(selectedChild.id, selectedChild.nickname, selectedChild.ageBand)}
              disabled={activatingChildId === selectedChild.id}
              className="self-start mt-1 px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
            >
              {activatingChildId === selectedChild.id ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              )}
              <span>Kích hoạt ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* Pending Parent Consent Banner */}
      {(selectedChild.status === 'PendingParentConsent' ||
        selectedChild.status === 'Pending Parent Consent' ||
        selectedChild.status === 'pending_parent_consent') && (
        <div className="laptop-metric-item p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 shadow-sm flex items-start gap-3 text-orange-700 dark:text-orange-200 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-orange-700 dark:text-orange-300">Chờ phụ huynh chấp thuận</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-[10px] font-mono text-orange-700 dark:text-orange-300 font-bold">
                Tạm dừng truy cập AI
              </span>
            </div>
            <p className="text-[11px] text-tod-text-muted leading-relaxed">
              Hồ sơ bé chưa có phụ huynh nào liên kết giám sát. Dữ liệu học tập được bảo lưu nguyên vẹn, nhưng quyền tương tác AI đang tạm giữ cho đến khi có phụ huynh quét mã chấp nhận lời mời.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('supervision')}
              className="self-start mt-1 px-3 py-1 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-700 dark:text-orange-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
            >
              <Users className="w-3.5 h-3.5 text-orange-500" />
              <span>Gửi mã mời phụ huynh</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Detail Card */}
      <ChildProfileDetailCard
        selectedChild={selectedChild}
        isEditingChild={isEditingChild}
        setIsEditingChild={setIsEditingChild}
        editNickname={editNickname}
        setEditNickname={setEditNickname}
        editAgeBand={editAgeBand}
        setEditAgeBand={setEditAgeBand}
        editLanguage={editLanguage}
        setEditLanguage={setEditLanguage}
        isSavingEdit={isSavingEdit}
        handleSaveEditChild={handleSaveChildProfile}
        editSuccessMsg={editSuccessMsg}
        isConfirmingDelete={isConfirmingDelete}
        setIsConfirmingDelete={setIsConfirmingDelete}
        isDeletingChild={isDeletingChild}
        handleDeleteChild={handleDeleteChildProfile}
        deleteError={deleteError}
        availableOrgs={availableOrgs}
        availableClasses={availableClasses}
      />

      {/* Child Access Credential & Launch Session Card */}
      <ChildAccessCredentialCard
        child={selectedChild}
        onOpenSetupModal={() => setShowSetupPinModal(true)}
        onOpenBadgeModal={() => setShowEasyLoginBadgeModal(true)}
        onStartChildSession={handleStartChildSession}
        credentialVersion={credentialVersion}
      />

      {/* Learning Profile Configuration Card */}
      <LearningProfileCard
        childId={selectedChild.id}
        childNickname={selectedChild.nickname}
        learningProfile={learningProfile}
        isEditingLearningProfile={isEditingLearningProfile}
        setIsEditingLearningProfile={setIsEditingLearningProfile}
        learningReadingLevel={learningReadingLevel}
        setLearningReadingLevel={setLearningReadingLevel}
        learningComprehensionGoal={learningComprehensionGoal}
        setLearningComprehensionGoal={setLearningComprehensionGoal}
        learningTopics={learningTopics}
        setLearningTopics={setLearningTopics}
        customTopicInput={customTopicInput}
        setCustomTopicInput={setCustomTopicInput}
        isSavingLearningProfile={isSavingLearningProfile}
        handleSaveLearningProfile={handleSaveLearningProfile}
        learningProfileSuccessMsg={learningProfileSuccessMsg}
        learningProfileErrorMsg={learningProfileErrorMsg}
        isLoadingDetail={isLoadingDetail}
        onRefresh={() => fetchChildDetail(selectedChild.id)}
      />

      {/* Safety Policy Quick Summary Card */}
      <SafetySummaryCard
        safetyPolicy={safetyPolicy}
        contentCategories={contentCategories}
        isLoadingDetail={isLoadingDetail}
        onNavigateToControls={() => setActiveTab('controls')}
        onRefresh={() => fetchChildDetail(selectedChild.id)}
      />

      {/* AI Token Quota Status Card */}
      <TokenQuotaCard
        tokenQuota={tokenQuota}
        isLoadingDetail={isLoadingDetail}
        onRefresh={() => fetchChildDetail(selectedChild.id)}
      />
    </div>
  );
};
