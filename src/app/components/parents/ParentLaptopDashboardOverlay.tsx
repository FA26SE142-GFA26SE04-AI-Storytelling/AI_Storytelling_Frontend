'use client';

import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  animateHeaderDown,
  animateDrawerLeft,
  animateDrawerRight,
  animateStaggerList,
} from '../../utils/gsapAnimations';

import {
  Users,
  ShieldCheck,
  Sparkles,
  User,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';
import { useAuth } from '../../context/AuthContext';
import { childProfileService } from '../../services/childProfileService';
import { supervisionService } from '../../services/supervisionService';
import {
  ChildProfile,
  LearningProfile,
  SafetyPolicy,
  TokenQuotaStatus,
  SupervisionRelationship,
  SupervisionInvitation,
  SupervisionPermissionKey,
  OrganizationSummary,
  ClassGroupSummary,
  ContentCategory,
} from '../../types/childProfile';

// Domain Subcomponents
import { DashboardTopNav } from './common/DashboardTopNav';
import { ChildProfilesSidebar } from './profiles/ChildProfilesSidebar';
import { ChildProfileDetailCard } from './profiles/ChildProfileDetailCard';
import { LearningProfileCard } from './profiles/LearningProfileCard';
import { SafetySummaryCard } from './profiles/SafetySummaryCard';
import { TokenQuotaCard } from './profiles/TokenQuotaCard';
import { SafetyPolicyControls } from './safety/SafetyPolicyControls';
import { SupervisionManager } from './supervision/SupervisionManager';
import { CreativeControlsTab } from './creative/CreativeControlsTab';

// Modal Dialogs
import { AddChildModal } from './modals/AddChildModal';
import { SupervisionPermissionsModal } from './modals/SupervisionPermissionsModal';
import { TransferOwnershipModal } from './modals/TransferOwnershipModal';
import { AcceptInvitationModal } from './modals/AcceptInvitationModal';

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

  // Child Profiles States (fetched from GET /api/v1/ChildProfile/mine)
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState<boolean>(true);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [childError, setChildError] = useState<string | null>(null);

  // New Child Profile Form States (Bước 1.2 — Tạo ChildProfile độc lập)
  const [showAddChildModal, setShowAddChildModal] = useState<boolean>(false);
  const [newChildNickname, setNewChildNickname] = useState<string>('');
  const [newChildAgeBand, setNewChildAgeBand] = useState<'Age_6_8' | 'Age_9_12'>('Age_6_8');
  const [newChildLanguage, setNewChildLanguage] = useState<string>('vi');
  const [newChildScope, setNewChildScope] = useState<'Personal' | 'Organization'>('Personal');
  const [newChildOrgId, setNewChildOrgId] = useState<number | null>(null);
  const [newChildClassGroupId, setNewChildClassGroupId] = useState<number | null>(null);
  const [isCreatingChild, setIsCreatingChild] = useState<boolean>(false);
  const [createChildModalError, setCreateChildModalError] = useState<string | null>(null);
  const [availableOrgs, setAvailableOrgs] = useState<OrganizationSummary[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassGroupSummary[]>([]);
  const [isLoadingOrgsAndClasses, setIsLoadingOrgsAndClasses] = useState<boolean>(false);
  const [activatingChildId, setActivatingChildId] = useState<number | null>(null);
  const [createChildSuccess, setCreateChildSuccess] = useState<string | null>(null);

  // Selected Child Detailed Data (Learning Profile, Safety Policy, Token Quota)
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [safetyPolicy, setSafetyPolicy] = useState<SafetyPolicy | null>(null);
  const [tokenQuota, setTokenQuota] = useState<TokenQuotaStatus | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Learning Profile Edit States
  const [isEditingLearningProfile, setIsEditingLearningProfile] = useState<boolean>(false);
  const [learningReadingLevel, setLearningReadingLevel] = useState<number>(2);
  const [learningComprehensionGoal, setLearningComprehensionGoal] = useState<string>('');
  const [learningTopics, setLearningTopics] = useState<Array<{ topic: string; relation: 'FavoriteTopic' | 'Interested' | 'Avoid' }>>([]);
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [isSavingLearningProfile, setIsSavingLearningProfile] = useState<boolean>(false);
  const [learningProfileSuccessMsg, setLearningProfileSuccessMsg] = useState<string | null>(null);
  const [learningProfileErrorMsg, setLearningProfileErrorMsg] = useState<string | null>(null);

  // Inline Edit Child Profile States
  const [isEditingChild, setIsEditingChild] = useState<boolean>(false);
  const [editNickname, setEditNickname] = useState<string>('');
  const [editAgeBand, setEditAgeBand] = useState<string>('Age_6_8');
  const [editLanguage, setEditLanguage] = useState<string>('vi');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Delete Child Profile States
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  const [isDeletingChild, setIsDeletingChild] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Supervision States (GET /api/v1/Supervision/{childProfileId}/relationships & /invitations)
  const [supervisors, setSupervisors] = useState<SupervisionRelationship[]>([]);
  const [invitations, setInvitations] = useState<SupervisionInvitation[]>([]);
  const [isLoadingSupervision, setIsLoadingSupervision] = useState<boolean>(false);
  const [supervisionError, setSupervisionError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteExpiresDays, setInviteExpiresDays] = useState<number>(7);
  const [isSendingInvite, setIsSendingInvite] = useState<boolean>(false);
  const [supervisionSuccessMsg, setSupervisionSuccessMsg] = useState<string | null>(null);
  const [revokingRelId, setRevokingRelId] = useState<number | null>(null);
  const [cancellingInvId, setCancellingInvId] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Permissions Management Modal States
  const [permissionTargetSupervisor, setPermissionTargetSupervisor] = useState<SupervisionRelationship | null>(null);
  const [supervisorPermissions, setSupervisorPermissions] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState<boolean>(false);
  const [togglingPermissionKey, setTogglingPermissionKey] = useState<string | null>(null);
  const [permissionModalError, setPermissionModalError] = useState<string | null>(null);

  // Transfer Ownership Modal States
  const [transferTargetSupervisor, setTransferTargetSupervisor] = useState<SupervisionRelationship | null>(null);
  const [isTransferringOwnership, setIsTransferringOwnership] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Accept Invitation Modal States
  const [showAcceptInviteModal, setShowAcceptInviteModal] = useState<boolean>(false);
  const [acceptCodeInput, setAcceptCodeInput] = useState<string>('');
  const [isAcceptingInvite, setIsAcceptingInvite] = useState<boolean>(false);
  const [acceptInviteError, setAcceptInviteError] = useState<string | null>(null);

  // Safety Policy Edit States
  const [safetyMaxStoryLength, setSafetyMaxStoryLength] = useState<number>(2000);
  const [safetyApprovalMode, setSafetyApprovalMode] = useState<'AlwaysManual' | 'AutoPublishOnThreshold'>('AlwaysManual');
  const [safetyParentalGate, setSafetyParentalGate] = useState<boolean>(true);
  const [safetyConsent, setSafetyConsent] = useState<boolean>(true);
  const [contentCategories, setContentCategories] = useState<ContentCategory[]>([]);
  const [safetyCategories, setSafetyCategories] = useState<Array<{ contentCategoryId: number; rule: 'Allowed' | 'Restricted' | 'Blocked' }>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);
  const [isSavingSafety, setIsSavingSafety] = useState<boolean>(false);
  const [safetySuccessMsg, setSafetySuccessMsg] = useState<string | null>(null);
  const [safetyErrorMsg, setSafetyErrorMsg] = useState<string | null>(null);
  const [isSavedChanges, setIsSavedChanges] = useState<boolean>(false);

  // Conversation Starter Audio & Feedback
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [feedbackRating, setFeedbackRating] = useState<'like' | 'dislike' | null>('like');

  const fetchChildProfiles = async () => {
    setIsLoadingChildren(true);
    setChildError(null);
    try {
      const res = await childProfileService.getMyChildProfiles();
      if (res.success && res.data) {
        setChildProfiles(res.data);
        if (res.data.length > 0 && !selectedChildId) {
          setSelectedChildId(res.data[0].id);
        }
      } else {
        setChildError(res.message || 'Không thể tải danh sách hồ sơ trẻ.');
      }
    } catch (err) {
      setChildError((err as Error).message || 'Lỗi kết nối tới máy chủ.');
    } finally {
      setIsLoadingChildren(false);
    }
  };

  useEffect(() => {
    fetchChildProfiles();

    // Tự động kiểm tra mã mời trên URL khi mở bảng điều khiển
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('code') || params.get('invitationCode') || params.get('inviteCode');
      if (inviteCode) {
        setAcceptCodeInput(inviteCode.trim());
        setShowAcceptInviteModal(true);
      }
    }
  }, []);

  const loadOrgsAndClasses = async () => {
    setIsLoadingOrgsAndClasses(true);
    try {
      const [orgsRes, classesRes] = await Promise.allSettled([
        childProfileService.getMyOrganizations(),
        childProfileService.getMyClassGroups(),
      ]);

      if (orgsRes.status === 'fulfilled' && orgsRes.value.success && orgsRes.value.data) {
        setAvailableOrgs(orgsRes.value.data);
      } else {
        setAvailableOrgs([]);
      }

      if (classesRes.status === 'fulfilled' && classesRes.value.success && classesRes.value.data) {
        setAvailableClasses(classesRes.value.data);
      } else {
        setAvailableClasses([]);
      }
    } catch (err) {
      console.error('Error loading organizations or class groups:', err);
    } finally {
      setIsLoadingOrgsAndClasses(false);
    }
  };

  const handleOpenAddChildModal = () => {
    setNewChildNickname('');
    setNewChildAgeBand('Age_6_8');
    setNewChildLanguage('vi');
    setNewChildScope('Personal');
    setNewChildOrgId(null);
    setNewChildClassGroupId(null);
    setCreateChildModalError(null);
    setShowAddChildModal(true);
    loadOrgsAndClasses();
  };

  const handleCreateChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildNickname.trim()) {
      setCreateChildModalError('Biệt danh của bé không được để trống.');
      return;
    }

    if (newChildScope === 'Organization') {
      if (!newChildOrgId) {
        setCreateChildModalError('Bắt buộc chọn một Tổ chức đã kích hoạt (Active) khi tạo hồ sơ với phạm vi Trường học/Tổ chức.');
        return;
      }
      if (!newChildClassGroupId) {
        setCreateChildModalError('Bắt buộc chọn Lớp học đích thuộc Tổ chức đã chọn.');
        return;
      }
    }

    setIsCreatingChild(true);
    setCreateChildModalError(null);
    setChildError(null);
    setCreateChildSuccess(null);

    try {
      const res = await childProfileService.createChildProfile({
        nickname: newChildNickname.trim(),
        ageBand: newChildAgeBand,
        language: newChildLanguage || 'vi',
        scope: newChildScope,
        organizationId: newChildScope === 'Organization' ? newChildOrgId : null,
        classGroupId: newChildScope === 'Organization' ? newChildClassGroupId : null,
      });

      if (res.success && res.data) {
        const createdChild = res.data;
        setCreateChildSuccess(
          `✓ Đã tạo hồ sơ bé "${createdChild.nickname}" thành công (Mã: #${createdChild.id}, Phạm vi: ${
            createdChild.scope === 'Organization' ? 'Trường học/Tổ chức' : 'Cá nhân/Gia đình'
          }, Trạng thái: Bản nháp / Draft). Vui lòng thiết lập Hồ sơ học tập & Quy tắc an toàn trước khi kích hoạt.`
        );

        setShowAddChildModal(false);
        await fetchChildProfiles();
        setSelectedChildId(createdChild.id);
        setTimeout(() => setCreateChildSuccess(null), 8000);
      } else {
        setCreateChildModalError(res.message || 'Không thể tạo hồ sơ bé.');
      }
    } catch (err) {
      setCreateChildModalError((err as Error).message || 'Có lỗi xảy ra khi tạo hồ sơ bé.');
    } finally {
      setIsCreatingChild(false);
    }
  };

  const handleActivateChild = async (childId: number, nickname: string, ageBand: string) => {
    setActivatingChildId(childId);
    setChildError(null);
    try {
      const res = await childProfileService.setupAndActivateChild(childId, nickname, ageBand);
      if (res.success) {
        setCreateChildSuccess(`⚡ Đã kích hoạt hồ sơ bé "${nickname}" thành công (Đang hoạt động)!`);
        await fetchChildProfiles();
        setTimeout(() => setCreateChildSuccess(null), 5000);
      } else {
        setChildError(res.message || 'Không thể kích hoạt hồ sơ bé.');
      }
    } catch (err) {
      setChildError((err as Error).message || 'Lỗi khi kích hoạt hồ sơ bé.');
    } finally {
      setActivatingChildId(null);
    }
  };

  const selectedChild = childProfiles.find((c) => c.id === selectedChildId) || childProfiles[0] || null;

  const ensureContentCategories = async (): Promise<ContentCategory[]> => {
    if (contentCategories.length > 0) return contentCategories;
    try {
      setIsLoadingCategories(true);
      const res = await childProfileService.getContentCategories();
      if (res.success && res.data && res.data.length > 0) {
        setContentCategories(res.data);
        return res.data;
      }
    } catch (e) {
      console.error('Failed to load content categories:', e);
    } finally {
      setIsLoadingCategories(false);
    }
    const fallbackCats: ContentCategory[] = [
      { id: 1, code: 'VIOLENCE', displayName: 'Bạo lực & Chiến đấu mạnh', isActive: true },
      { id: 2, code: 'HORROR', displayName: 'Kinh dị & Yếu tố gây sợ hãi', isActive: true },
      { id: 3, code: 'SENSITIVE_LANG', displayName: 'Ngôn từ nhạy cảm & Thô tục', isActive: true },
      { id: 4, code: 'ADULT_THEME', displayName: 'Chủ đề người lớn & Phức tạp', isActive: true },
      { id: 5, code: 'FAIRY_TALE', displayName: 'Cổ tích & Huyền thoại dân gian', isActive: true },
      { id: 6, code: 'SCIENCE_NATURE', displayName: 'Khoa học, Tự nhiên & Không gian', isActive: true },
    ];
    setContentCategories(fallbackCats);
    return fallbackCats;
  };

  const fetchChildDetail = async (childId: number) => {
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const [lpRes, spRes, quotaRes] = await Promise.allSettled([
        childProfileService.getLearningProfile(childId),
        childProfileService.getSafetyPolicy(childId),
        childProfileService.getTokenQuotaForChild(childId),
      ]);

      if (lpRes.status === 'fulfilled' && lpRes.value.success && lpRes.value.data) {
        setLearningProfile(lpRes.value.data);
        setLearningReadingLevel(lpRes.value.data.readingLevel || 2);
        setLearningComprehensionGoal(lpRes.value.data.comprehensionGoal || '');
        setLearningTopics(
          (lpRes.value.data.topics || []).map((t) => ({
            topic: t.topic,
            relation: (t.relation as any) || 'FavoriteTopic',
          }))
        );
      } else {
        setLearningProfile(null);
        setLearningReadingLevel(2);
        setLearningComprehensionGoal('');
        setLearningTopics([
          { topic: 'Khám phá thế giới & Thiên nhiên', relation: 'FavoriteTopic' },
          { topic: 'Khoa học & Vũ trụ', relation: 'FavoriteTopic' },
        ]);
      }

      const availableCats = await ensureContentCategories();

      if (spRes.status === 'fulfilled' && spRes.value.success && spRes.value.data) {
        const sp = spRes.value.data;
        setSafetyPolicy(sp);
        setSafetyMaxStoryLength(sp.maxStoryLength || 2000);
        setSafetyApprovalMode(
          sp.requiredApprovalMode === 'AutoPublishOnThreshold' ? 'AutoPublishOnThreshold' : 'AlwaysManual'
        );
        setSafetyParentalGate(sp.parentalGateEnabled ?? true);
        setSafetyConsent(sp.consentRecorded ?? true);
        if (sp.categories && sp.categories.length > 0) {
          setSafetyCategories(
            sp.categories.map((c) => ({
              contentCategoryId: c.contentCategoryId,
              rule: (c.rule as 'Allowed' | 'Restricted' | 'Blocked') || 'Blocked',
            }))
          );
        } else {
          setSafetyCategories(
            availableCats.map((c) => ({
              contentCategoryId: c.id,
              rule: ['VIOLENCE', 'HORROR', 'SENSITIVE_LANG', 'ADULT_THEME'].some((code) =>
                c.code.toUpperCase().includes(code)
              )
                ? 'Blocked'
                : 'Allowed',
            }))
          );
        }
      } else {
        setSafetyPolicy(null);
        setSafetyMaxStoryLength(2000);
        setSafetyApprovalMode('AlwaysManual');
        setSafetyParentalGate(true);
        setSafetyConsent(true);
        setSafetyCategories(
          availableCats.map((c) => ({
            contentCategoryId: c.id,
            rule: ['VIOLENCE', 'HORROR', 'SENSITIVE_LANG', 'ADULT_THEME'].some((code) =>
              c.code.toUpperCase().includes(code)
            )
              ? 'Blocked'
              : 'Allowed',
          }))
        );
      }

      if (quotaRes.status === 'fulfilled' && quotaRes.value.success && quotaRes.value.data) {
        setTokenQuota(quotaRes.value.data);
      } else {
        setTokenQuota(null);
      }
    } catch (err) {
      console.error('Error fetching child details:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const fetchSupervisionData = async (childId: number) => {
    setIsLoadingSupervision(true);
    setSupervisionError(null);
    try {
      const [relRes, invRes] = await Promise.allSettled([
        supervisionService.getSupervisors(childId),
        supervisionService.getInvitations(childId),
      ]);

      if (relRes.status === 'fulfilled' && relRes.value.success && relRes.value.data) {
        setSupervisors(relRes.value.data);
      } else {
        setSupervisors([]);
      }

      if (invRes.status === 'fulfilled' && invRes.value.success && invRes.value.data) {
        setInvitations(invRes.value.data);
      } else {
        setInvitations([]);
      }
    } catch (err) {
      console.error('Error fetching supervision:', err);
      setSupervisionError('Không thể nạp danh sách giám sát.');
    } finally {
      setIsLoadingSupervision(false);
    }
  };

  useEffect(() => {
    if (selectedChild) {
      setEditNickname(selectedChild.nickname);
      setEditAgeBand(selectedChild.ageBand);
      setEditLanguage(selectedChild.language || 'vi');
      fetchChildDetail(selectedChild.id);
      fetchSupervisionData(selectedChild.id);
    }
  }, [selectedChildId, childProfiles.length]);

  useEffect(() => {
    if (selectedChild && activeTab === 'supervision') {
      fetchSupervisionData(selectedChild.id);
    }
  }, [activeTab]);

  const handleCreateInvitation = async () => {
    if (!selectedChild) return;
    setIsSendingInvite(true);
    setSupervisionError(null);
    try {
      const res = await supervisionService.createInvitation(selectedChild.id, {
        inviteeEmail: inviteEmail.trim() || undefined,
        expiresInDays: inviteExpiresDays,
      });

      if (res.success && res.data) {
        setSupervisionSuccessMsg(`✓ Đã tạo mã mời giám sát: ${res.data.invitationCode}`);
        setInviteEmail('');
        setIsInviting(false);
        await fetchSupervisionData(selectedChild.id);
        setTimeout(() => setSupervisionSuccessMsg(null), 6000);
      } else {
        setSupervisionError(res.message || 'Không thể tạo lời mời.');
      }
    } catch (err) {
      setSupervisionError((err as Error).message || 'Lỗi khi tạo lời mời.');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    if (!selectedChild) return;
    setCancellingInvId(invitationId);
    try {
      const res = await supervisionService.cancelInvitation(invitationId);
      if (res.success) {
        setSupervisionSuccessMsg('✓ Đã huỷ lời mời giám sát.');
        await fetchSupervisionData(selectedChild.id);
        setTimeout(() => setSupervisionSuccessMsg(null), 4000);
      } else {
        setSupervisionError(res.message || 'Không thể huỷ lời mời.');
      }
    } catch (err) {
      setSupervisionError((err as Error).message || 'Lỗi khi huỷ lời mời.');
    } finally {
      setCancellingInvId(null);
    }
  };

  const handleRevokeSupervision = async (relId: number) => {
    if (!selectedChild) return;
    if (!confirm('Bạn có chắc chắn muốn thu hồi quan hệ giám sát này không?')) return;
    setRevokingRelId(relId);
    try {
      const res = await supervisionService.revokeSupervision(relId);
      if (res.success) {
        setSupervisionSuccessMsg('✓ Đã thu hồi quyền giám sát.');
        await fetchSupervisionData(selectedChild.id);
        setTimeout(() => setSupervisionSuccessMsg(null), 4000);
      } else {
        setSupervisionError(res.message || 'Không thể thu hồi quyền giám sát.');
      }
    } catch (err) {
      setSupervisionError((err as Error).message || 'Lỗi khi thu hồi quyền.');
    } finally {
      setRevokingRelId(null);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleOpenPermissions = async (sup: SupervisionRelationship) => {
    setPermissionTargetSupervisor(sup);
    setPermissionModalError(null);
    setIsLoadingPermissions(true);
    try {
      const res = await supervisionService.getRelationshipPermissions(sup.id);
      if (res.success && res.data) {
        setSupervisorPermissions(res.data);
      } else {
        setSupervisorPermissions([]);
        setPermissionModalError(res.message || 'Chưa thể tải quyền của người giám sát này.');
      }
    } catch (err) {
      setPermissionModalError((err as Error).message || 'Lỗi khi tải danh sách quyền.');
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const handleTogglePermission = async (permissionKey: SupervisionPermissionKey) => {
    if (!permissionTargetSupervisor || togglingPermissionKey) return;
    const relId = permissionTargetSupervisor.id;
    const isGranted = supervisorPermissions.includes(permissionKey);
    setTogglingPermissionKey(permissionKey);
    setPermissionModalError(null);

    // Optimistic UI update
    setSupervisorPermissions((prev) =>
      isGranted ? prev.filter((p) => p !== permissionKey) : [...prev, permissionKey]
    );

    try {
      const res = isGranted
        ? await supervisionService.revokePermission(relId, permissionKey)
        : await supervisionService.grantPermission(relId, permissionKey);

      if (!res.success) {
        // Rollback on failure
        setSupervisorPermissions((prev) =>
          isGranted ? [...prev, permissionKey] : prev.filter((p) => p !== permissionKey)
        );
        setPermissionModalError(res.message || 'Không thể cập nhật quyền.');
      }
    } catch (err) {
      // Rollback on error
      setSupervisorPermissions((prev) =>
        isGranted ? [...prev, permissionKey] : prev.filter((p) => p !== permissionKey)
      );
      setPermissionModalError((err as Error).message || 'Lỗi khi cập nhật quyền.');
    } finally {
      setTogglingPermissionKey(null);
    }
  };

  const handleTransferOwnershipSubmit = async () => {
    if (!selectedChild || !transferTargetSupervisor) return;
    setIsTransferringOwnership(true);
    setTransferError(null);
    try {
      const res = await supervisionService.transferOwnership(
        selectedChild.id,
        transferTargetSupervisor.supervisorUserId
      );
      if (res.success) {
        setSupervisionSuccessMsg(
          `✓ Đã chuyển nhượng quyền Owner bé "${selectedChild.nickname}" cho Supervisor #${transferTargetSupervisor.supervisorUserId} thành công!`
        );
        setTransferTargetSupervisor(null);
        await Promise.all([
          fetchChildProfiles(),
          fetchSupervisionData(selectedChild.id),
        ]);
        setTimeout(() => setSupervisionSuccessMsg(null), 5000);
      } else {
        setTransferError(res.message || 'Không thể chuyển giao quyền Owner.');
      }
    } catch (err) {
      setTransferError((err as Error).message || 'Lỗi khi chuyển quyền Owner.');
    } finally {
      setIsTransferringOwnership(false);
    }
  };

  const handleAcceptInvitationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptCodeInput.trim()) return;
    setIsAcceptingInvite(true);
    setAcceptInviteError(null);
    try {
      const res = await supervisionService.acceptInvitation(acceptCodeInput.trim());
      if (res.success && res.data) {
        const newRel = res.data;
        setSupervisionSuccessMsg(
          `✓ Chấp nhận mã mời thành công! Bạn đã trở thành người giám sát bé (Hồ sơ #${newRel.childProfileId}).`
        );
        setAcceptCodeInput('');
        setShowAcceptInviteModal(false);
        await fetchChildProfiles();
        setSelectedChildId(newRel.childProfileId);
        setTimeout(() => setSupervisionSuccessMsg(null), 6000);
      } else {
        setAcceptInviteError(res.message || res.errors?.[0] || 'Mã mời không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err) {
      setAcceptInviteError((err as Error).message || 'Lỗi khi chấp nhận mã mời.');
    } finally {
      setIsAcceptingInvite(false);
    }
  };

  const handleSaveChildProfile = async () => {
    if (!selectedChild || !editNickname.trim()) return;

    setIsSavingEdit(true);
    setDetailError(null);
    try {
      const res = await childProfileService.updateChildProfile(selectedChild.id, {
        nickname: editNickname.trim(),
        ageBand: editAgeBand,
        language: editLanguage || 'vi',
      });

      if (res.success && res.data) {
        setEditSuccessMsg(`✓ Đã cập nhật thành công hồ sơ bé "${res.data.nickname}"!`);
        setIsEditingChild(false);
        setChildProfiles((prev) =>
          prev.map((c) => (c.id === res.data!.id ? { ...c, ...res.data } : c))
        );
        await fetchChildProfiles();
        setTimeout(() => setEditSuccessMsg(null), 4000);
      } else {
        setDetailError(res.message || 'Không thể cập nhật hồ sơ bé.');
      }
    } catch (err) {
      setDetailError((err as Error).message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteChildProfile = async () => {
    if (!selectedChild) return;
    setIsDeletingChild(true);
    setDeleteError(null);
    try {
      const res = await childProfileService.deleteChildProfile(selectedChild.id);
      if (res.success) {
        setEditSuccessMsg(`✓ Đã lưu trữ/xóa hồ sơ bé "${selectedChild.nickname}" thành công!`);
        setIsConfirmingDelete(false);
        setIsEditingChild(false);

        const updatedProfilesRes = await childProfileService.getMyChildProfiles();
        if (updatedProfilesRes.success && updatedProfilesRes.data) {
          setChildProfiles(updatedProfilesRes.data);
          const remaining = updatedProfilesRes.data.filter((c) => c.id !== selectedChild.id);
          if (remaining.length > 0) {
            setSelectedChildId(remaining[0].id);
          } else {
            setSelectedChildId(null);
          }
        }
        setTimeout(() => setEditSuccessMsg(null), 4000);
      } else {
        setDeleteError(res.message || 'Không thể xóa hồ sơ trẻ.');
      }
    } catch (err) {
      setDeleteError((err as Error).message || 'Có lỗi xảy ra khi xóa hồ sơ.');
    } finally {
      setIsDeletingChild(false);
    }
  };

  const handleSaveLearningProfile = async () => {
    if (!selectedChild) return;
    setIsSavingLearningProfile(true);
    setLearningProfileErrorMsg(null);
    try {
      const res = await childProfileService.setLearningProfile(selectedChild.id, {
        readingLevel: learningReadingLevel,
        comprehensionGoal: learningComprehensionGoal.trim() || 'Phát triển từ vựng và tư duy qua truyện kể',
        topics: learningTopics.length > 0 ? learningTopics : [
          { topic: 'Khám phá thế giới & Thiên nhiên', relation: 'FavoriteTopic' },
        ],
      });

      if (res.success) {
        setLearningProfileSuccessMsg('Đã lưu cấu hình học tập thành công!');
        setIsEditingLearningProfile(false);
        await fetchChildDetail(selectedChild.id);
        setTimeout(() => setLearningProfileSuccessMsg(null), 3500);
      } else {
        setLearningProfileErrorMsg(res.message || 'Không thể lưu hồ sơ học tập.');
      }
    } catch (err) {
      setLearningProfileErrorMsg((err as Error).message || 'Có lỗi xảy ra khi lưu.');
    } finally {
      setIsSavingLearningProfile(false);
    }
  };

  const handleSaveSafetyPolicy = async () => {
    if (!selectedChild) return;
    setSafetyErrorMsg(null);
    setSafetySuccessMsg(null);

    if (!safetyConsent) {
      setSafetyErrorMsg('Phụ huynh cần tích chọn xác nhận đồng thuận giám sát và bảo vệ dữ liệu trẻ em (Consent Record) trước khi lưu.');
      return;
    }

    setIsSavingSafety(true);
    try {
      const res = await childProfileService.setSafetyPolicy(selectedChild.id, {
        maxStoryLength: safetyMaxStoryLength,
        requiredApprovalMode: safetyApprovalMode,
        parentalGateEnabled: safetyParentalGate,
        consentRecorded: safetyConsent,
        categories: safetyCategories,
      });

      if (res.success) {
        setIsSavedChanges(true);
        setSafetySuccessMsg(`✓ Đã lưu thành công quy tắc an toàn cho bé ${selectedChild.nickname}! Trạng thái nghiệp vụ: Safety Configured.`);
        await fetchChildDetail(selectedChild.id);
        setTimeout(() => {
          setIsSavedChanges(false);
          setSafetySuccessMsg(null);
        }, 4000);
      } else {
        setSafetyErrorMsg(res.message || 'Không thể lưu quy tắc an toàn.');
      }
    } catch (err) {
      setSafetyErrorMsg((err as Error).message || 'Lỗi khi lưu quy tắc an toàn.');
    } finally {
      setIsSavingSafety(false);
    }
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
    animateDrawerLeft('.laptop-left-card', { delay: 0.08 });
    animateDrawerRight('.laptop-right-card', { delay: 0.12 });
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
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 overflow-hidden z-30 font-sans"
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
          setAcceptInviteError(null);
          setAcceptCodeInput('');
          setShowAcceptInviteModal(true);
        }}
        user={user}
      />

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4 my-2 overflow-hidden pointer-events-none">
        {/* LEFT CARD: MAIN INTERACTIVE DASHBOARD TABS */}
        <div className="laptop-left-card pointer-events-auto w-full lg:w-[540px] max-h-[56vh] lg:max-h-[76vh] flex flex-col rounded-3xl bg-zinc-950/90 backdrop-blur-2xl border border-sky-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-white overflow-hidden">
          {/* Navigation Tabs Header */}
          <div className="p-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-sky-500 text-zinc-950 font-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Hồ Sơ & Học Tập</span>
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
              onClick={() => setActiveTab('supervision')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'supervision'
                  ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Người Giám Sát</span>
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
          <div className="flex-1 p-4 overflow-y-auto dashboard-scrollbar space-y-3.5">
            {/* TAB 1: CHILD PROFILE & LEARNING CONFIGURATION */}
            {activeTab === 'analytics' && (
              <div className="space-y-3">
                {selectedChild ? (
                  <>
                    {/* Draft Banner if status is Draft */}
                    {selectedChild.status === 'Draft' && (
                      <div className="laptop-metric-item p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-zinc-900 to-amber-950/30 border border-amber-500/40 shadow-lg flex items-start gap-3 text-amber-200 animate-in fade-in duration-200">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-300">Hồ sơ mới tạo (Bản nháp)</span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono text-amber-300 font-bold">
                              Chờ kích hoạt
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-relaxed">
                            Hồ sơ trẻ độc lập đã được tạo thành công. Vui lòng thiết lập <strong>Hồ sơ học tập</strong> và <strong>Quy tắc an toàn</strong> bên dưới trước khi bấm nút <strong>Kích hoạt</strong> để đưa bé vào trạng thái Đang hoạt động.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleActivateChild(selectedChild.id, selectedChild.nickname, selectedChild.ageBand)}
                            disabled={activatingChildId === selectedChild.id}
                            className="self-start mt-1 px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                          >
                            {activatingChildId === selectedChild.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                            )}
                            <span>Kích hoạt ngay</span>
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
                  </>
                ) : (
                  <div className="py-12 px-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 text-center flex flex-col items-center justify-center gap-3">
                    <User className="w-10 h-10 text-zinc-600" />
                    <span className="text-sm font-bold text-zinc-300">Chưa chọn hồ sơ bé nào</span>
                    <p className="text-xs text-zinc-500 max-w-xs">
                      Vui lòng chọn một hồ sơ ở danh sách bên phải hoặc tạo hồ sơ bé mới để bắt đầu thiết lập.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddChildModal}
                      className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      + Tạo Hồ Sơ Bé Mới
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SAFETY POLICY CONTROLS */}
            {activeTab === 'controls' && selectedChild && (
              <SafetyPolicyControls
                selectedChildNickname={selectedChild.nickname}
                safetyPolicy={safetyPolicy}
                safetyMaxStoryLength={safetyMaxStoryLength}
                setSafetyMaxStoryLength={setSafetyMaxStoryLength}
                safetyApprovalMode={safetyApprovalMode}
                setSafetyApprovalMode={setSafetyApprovalMode}
                safetyParentalGate={safetyParentalGate}
                setSafetyParentalGate={setSafetyParentalGate}
                safetyConsent={safetyConsent}
                setSafetyConsent={setSafetyConsent}
                contentCategories={contentCategories}
                safetyCategories={safetyCategories}
                setSafetyCategories={setSafetyCategories}
                isLoadingCategories={isLoadingCategories}
                isSavingSafety={isSavingSafety}
                isSavedChanges={isSavedChanges}
                handleSaveSafetyPolicy={handleSaveSafetyPolicy}
                safetyErrorMsg={safetyErrorMsg}
                safetySuccessMsg={safetySuccessMsg}
              />
            )}

            {/* TAB 3: SUPERVISION MANAGEMENT */}
            {activeTab === 'supervision' && selectedChild && (
              <SupervisionManager
                childNickname={selectedChild.nickname}
                supervisors={supervisors}
                invitations={invitations}
                isLoadingSupervision={isLoadingSupervision}
                supervisionError={supervisionError}
                supervisionSuccessMsg={supervisionSuccessMsg}
                isInviting={isInviting}
                setIsInviting={setIsInviting}
                inviteEmail={inviteEmail}
                setInviteEmail={setInviteEmail}
                inviteExpiresDays={inviteExpiresDays}
                setInviteExpiresDays={setInviteExpiresDays}
                isSendingInvite={isSendingInvite}
                handleSendInvitation={handleCreateInvitation}
                onOpenPermissionsModal={handleOpenPermissions}
                onOpenTransferOwnershipModal={(sup) => {
                  setTransferError(null);
                  setTransferTargetSupervisor(sup);
                }}
                revokingRelId={revokingRelId}
                handleRevokeSupervision={(relId) => handleRevokeSupervision(relId)}
                cancellingInvId={cancellingInvId}
                handleCancelInvitation={handleCancelInvitation}
                copiedCode={copiedCode}
                handleCopyInviteCode={handleCopyCode}
                onRefresh={() => fetchSupervisionData(selectedChild.id)}
              />
            )}

            {/* TAB 4: CONVERSATION STARTERS & CREATIVE CONTROLS */}
            {activeTab === 'prompts' && (
              <CreativeControlsTab
                isPlayingAudio={isPlayingAudio}
                setIsPlayingAudio={setIsPlayingAudio}
                feedbackRating={feedbackRating}
                setFeedbackRating={setFeedbackRating}
              />
            )}
          </div>
        </div>

        {/* RIGHT CARD: CHILD PROFILES LIST SIDEBAR */}
        <ChildProfilesSidebar
          childProfiles={childProfiles}
          selectedChildId={selectedChildId}
          onSelectChild={(id) => setSelectedChildId(id)}
          isLoadingChildren={isLoadingChildren}
          onOpenAddChildModal={handleOpenAddChildModal}
          onActivateChild={handleActivateChild}
          activatingChildId={activatingChildId}
          onRefresh={fetchChildProfiles}
        />
      </div>

      {/* MODAL 1: ADD NEW CHILD PROFILE */}
      <AddChildModal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        newChildNickname={newChildNickname}
        setNewChildNickname={setNewChildNickname}
        newChildAgeBand={newChildAgeBand}
        setNewChildAgeBand={setNewChildAgeBand}
        newChildLanguage={newChildLanguage}
        setNewChildLanguage={setNewChildLanguage}
        newChildScope={newChildScope}
        setNewChildScope={setNewChildScope}
        newChildOrgId={newChildOrgId}
        setNewChildOrgId={setNewChildOrgId}
        newChildClassGroupId={newChildClassGroupId}
        setNewChildClassGroupId={setNewChildClassGroupId}
        availableOrgs={availableOrgs}
        availableClasses={availableClasses}
        isLoadingOrgsAndClasses={isLoadingOrgsAndClasses}
        loadOrgsAndClasses={loadOrgsAndClasses}
        isCreatingChild={isCreatingChild}
        createChildModalError={createChildModalError}
        handleCreateChildSubmit={handleCreateChildSubmit}
      />

      {/* MODAL 2: SUPERVISOR PERMISSIONS MANAGEMENT */}
      <SupervisionPermissionsModal
        targetSupervisor={permissionTargetSupervisor}
        childNickname={selectedChild?.nickname || ''}
        onClose={() => setPermissionTargetSupervisor(null)}
        supervisorPermissions={supervisorPermissions}
        isLoadingPermissions={isLoadingPermissions}
        permissionModalError={permissionModalError}
        togglingPermissionKey={togglingPermissionKey}
        handleTogglePermission={handleTogglePermission}
      />

      {/* MODAL 3: TRANSFER OWNERSHIP MODAL */}
      <TransferOwnershipModal
        targetSupervisor={transferTargetSupervisor}
        childNickname={selectedChild?.nickname || ''}
        onClose={() => setTransferTargetSupervisor(null)}
        isTransferringOwnership={isTransferringOwnership}
        transferError={transferError}
        onConfirmTransfer={handleTransferOwnershipSubmit}
      />

      {/* MODAL 4: ACCEPT INVITATION MODAL */}
      <AcceptInvitationModal
        isOpen={showAcceptInviteModal}
        onClose={() => setShowAcceptInviteModal(false)}
        acceptCodeInput={acceptCodeInput}
        setAcceptCodeInput={setAcceptCodeInput}
        isAcceptingInvite={isAcceptingInvite}
        acceptInviteError={acceptInviteError}
        onAcceptSubmit={handleAcceptInvitationSubmit}
      />
    </div>
  );
};
