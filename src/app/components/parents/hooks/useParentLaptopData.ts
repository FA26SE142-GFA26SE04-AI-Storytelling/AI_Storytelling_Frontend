import React, { useState, useEffect } from 'react';
import { childProfileService } from '../../../services/childProfileService';
import { supervisionService } from '../../../services/supervisionService';
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
} from '../../../types/childProfile';

export function useParentLaptopData() {
  // Child Profiles States
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState<boolean>(true);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [childError, setChildError] = useState<string | null>(null);

  // New Child Profile Form States
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

  // Selected Child Detailed Data
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [safetyPolicy, setSafetyPolicy] = useState<SafetyPolicy | null>(null);
  const [tokenQuota, setTokenQuota] = useState<TokenQuotaStatus | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Child Access Credential & Child Session States
  const [showSetupPinModal, setShowSetupPinModal] = useState<boolean>(false);
  const [showEasyLoginBadgeModal, setShowEasyLoginBadgeModal] = useState<boolean>(false);
  const [credentialVersion, setCredentialVersion] = useState<number>(0);

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

  // Supervision States
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

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const storedCode = sessionStorage.getItem('pendingInvitationCode');
      const inviteCode = params.get('code') || params.get('invitationCode') || params.get('inviteCode') || storedCode;
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
        setCreateChildModalError('Bắt buộc chọn một Tổ chức đã kích hoạt khi tạo hồ sơ với phạm vi Trường học/Tổ chức.');
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
          `✓ Đã tạo hồ sơ bé "${createdChild.nickname}" thành công (Mã: #${createdChild.id}). Vui lòng thiết lập Hồ sơ học tập & Quy tắc an toàn trước khi kích hoạt.`
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
        await fetchChildProfiles();
        const updatedList = await childProfileService.getMyChildProfiles();
        const targetChild = updatedList.data?.find((c) => c.id === childId);

        if (
          targetChild?.status === 'PendingParentConsent' ||
          targetChild?.status === 'Pending Parent Consent' ||
          targetChild?.status === 'pending_parent_consent'
        ) {
          setCreateChildSuccess(
            `⚡ Hồ sơ bé "${nickname}" đã sẵn sàng và đang ở trạng thái: Chờ phụ huynh chấp thuận. Hãy gửi mã mời cho phụ huynh để kích hoạt.`
          );
        } else {
          setCreateChildSuccess(`⚡ Đã kích hoạt hồ sơ bé "${nickname}" thành công (Đang hoạt động)!`);
        }
        setTimeout(() => setCreateChildSuccess(null), 6000);
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
            relation: (t.relation as 'FavoriteTopic' | 'Interested' | 'Avoid') || 'FavoriteTopic',
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
      setDetailError((err as Error).message || 'Lỗi khi tải chi tiết hồ sơ bé.');
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
      setSupervisionError((err as Error).message || 'Lỗi khi tải danh sách giám sát.');
    } finally {
      setIsLoadingSupervision(false);
    }
  };

  useEffect(() => {
    if (selectedChild) {
      setEditNickname(selectedChild.nickname);
      setEditAgeBand(selectedChild.ageBand);
      setEditLanguage(selectedChild.language || 'vi');
      setIsEditingChild(false);
      setIsConfirmingDelete(false);
      setIsEditingLearningProfile(false);
      fetchChildDetail(selectedChild.id);
      fetchSupervisionData(selectedChild.id);
    } else {
      setLearningProfile(null);
      setSafetyPolicy(null);
      setTokenQuota(null);
      setSupervisors([]);
      setInvitations([]);
    }
  }, [selectedChildId, childProfiles.length]);

  const handleCreateInvitation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedChild || !inviteEmail.trim()) return;
    setIsSendingInvite(true);
    setSupervisionError(null);
    try {
      const res = await supervisionService.createInvitation(selectedChild.id, {
        inviteeEmail: inviteEmail.trim(),
        expiresInDays: inviteExpiresDays,
      });

      if (res.success && res.data) {
        setSupervisionSuccessMsg(`✓ Đã tạo lời mời thành công cho ${inviteEmail}! Mã mời: ${res.data.invitationCode}`);
        setInviteEmail('');
        setIsInviting(false);
        await fetchSupervisionData(selectedChild.id);
        setTimeout(() => setSupervisionSuccessMsg(null), 6000);
      } else {
        setSupervisionError(res.message || 'Không thể gửi lời mời.');
      }
    } catch (err) {
      setSupervisionError((err as Error).message || 'Có lỗi xảy ra.');
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
        setSupervisionSuccessMsg('✓ Đã hủy lời mời.');
        await fetchSupervisionData(selectedChild.id);
        setTimeout(() => setSupervisionSuccessMsg(null), 3000);
      } else {
        setSupervisionError(res.message || 'Không thể hủy lời mời.');
      }
    } catch (err) {
      setSupervisionError((err as Error).message || 'Lỗi khi hủy lời mời.');
    } finally {
      setCancellingInvId(null);
    }
  };

  const handleReissueInvitation = async (invitationId: number) => {
    if (!selectedChild) return;
    try {
      const res = await supervisionService.reissueInvitation(selectedChild.id, invitationId, {
        expiresInDays: 7,
      });
      if (res.success && res.data) {
        setSupervisionSuccessMsg(`✓ Đã cấp lại mã mời thành công! Mã mới: ${res.data.invitationCode}`);
        await fetchSupervisionData(selectedChild.id);
        setTimeout(() => setSupervisionSuccessMsg(null), 6000);
      } else {
        setSupervisionError(res.message || 'Không thể cấp lại mã mời.');
      }
    } catch (err) {
      setSupervisionError((err as Error).message || 'Lỗi khi cấp lại mã mời.');
    }
  };

  const handleRevokeSupervision = async (relId: number) => {
    if (!selectedChild) return;
    setRevokingRelId(relId);
    try {
      const res = await supervisionService.revokeSupervision(relId);
      if (res.success) {
        setSupervisionSuccessMsg('✓ Đã thu hồi quyền giám sát.');
        await Promise.allSettled([
          fetchSupervisionData(selectedChild.id),
          fetchChildProfiles(),
        ]);
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

    setSupervisorPermissions((prev) =>
      isGranted ? prev.filter((p) => p !== permissionKey) : [...prev, permissionKey]
    );

    try {
      const res = isGranted
        ? await supervisionService.revokePermission(relId, permissionKey)
        : await supervisionService.grantPermission(relId, permissionKey);

      if (!res.success) {
        setSupervisorPermissions((prev) =>
          isGranted ? [...prev, permissionKey] : prev.filter((p) => p !== permissionKey)
        );
        setPermissionModalError(res.message || 'Không thể cập nhật quyền.');
      }
    } catch (err) {
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
          `✓ Đã chuyển nhượng quyền Owner bé "${selectedChild.nickname}" thành công!`
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

  const handleAcceptInvitationSubmit = async (customCode?: string) => {
    const codeToUse = (typeof customCode === 'string' && customCode.trim()) ? customCode.trim() : acceptCodeInput.trim();
    if (!codeToUse) return;
    setIsAcceptingInvite(true);
    setAcceptInviteError(null);
    try {
      const res = await supervisionService.acceptInvitation(codeToUse);
      if (res.success && res.data) {
        const newRel = res.data;
        setSupervisionSuccessMsg(
          `✓ Liên kết giám sát thành công! Đã kích hoạt quyền giám sát bé (Hồ sơ #${newRel.childProfileId}).`
        );
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pendingInvitationCode');
        }
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

  const handleRejectInvitationSubmit = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pendingInvitationCode');
    }
    setAcceptCodeInput('');
    setShowAcceptInviteModal(false);
    setSupervisionSuccessMsg(
      'Đã từ chối lời mời giám sát.'
    );
    setTimeout(() => setSupervisionSuccessMsg(null), 6000);
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
      setSafetyErrorMsg('Phụ huynh cần tích chọn xác nhận đồng thuận giám sát và bảo vệ dữ liệu trẻ em trước khi lưu.');
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
        setSafetySuccessMsg(`✓ Đã lưu thành công quy tắc an toàn cho bé ${selectedChild.nickname}!`);
        await fetchChildDetail(selectedChild.id);
        setTimeout(() => {
          setIsSavedChanges(false);
          setSafetySuccessMsg(null), 4000;
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

  return {
    childProfiles,
    isLoadingChildren,
    selectedChildId,
    setSelectedChildId,
    childError,
    showAddChildModal,
    setShowAddChildModal,
    newChildNickname,
    setNewChildNickname,
    newChildAgeBand,
    setNewChildAgeBand,
    newChildLanguage,
    setNewChildLanguage,
    newChildScope,
    setNewChildScope,
    newChildOrgId,
    setNewChildOrgId,
    newChildClassGroupId,
    setNewChildClassGroupId,
    isCreatingChild,
    createChildModalError,
    availableOrgs,
    availableClasses,
    isLoadingOrgsAndClasses,
    loadOrgsAndClasses,
    activatingChildId,
    createChildSuccess,
    learningProfile,
    safetyPolicy,
    tokenQuota,
    isLoadingDetail,
    detailError,
    showSetupPinModal,
    setShowSetupPinModal,
    showEasyLoginBadgeModal,
    setShowEasyLoginBadgeModal,
    credentialVersion,
    setCredentialVersion,
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
    learningProfileSuccessMsg,
    learningProfileErrorMsg,
    isEditingChild,
    setIsEditingChild,
    editNickname,
    setEditNickname,
    editAgeBand,
    setEditAgeBand,
    editLanguage,
    setEditLanguage,
    isSavingEdit,
    editSuccessMsg,
    isConfirmingDelete,
    setIsConfirmingDelete,
    isDeletingChild,
    deleteError,
    supervisors,
    invitations,
    isLoadingSupervision,
    supervisionError,
    isInviting,
    setIsInviting,
    inviteEmail,
    setInviteEmail,
    inviteExpiresDays,
    setInviteExpiresDays,
    isSendingInvite,
    supervisionSuccessMsg,
    revokingRelId,
    cancellingInvId,
    copiedCode,
    permissionTargetSupervisor,
    setPermissionTargetSupervisor,
    supervisorPermissions,
    isLoadingPermissions,
    togglingPermissionKey,
    permissionModalError,
    transferTargetSupervisor,
    setTransferTargetSupervisor,
    isTransferringOwnership,
    transferError,
    setTransferError,
    showAcceptInviteModal,
    setShowAcceptInviteModal,
    acceptCodeInput,
    setAcceptCodeInput,
    isAcceptingInvite,
    acceptInviteError,
    setAcceptInviteError,
    safetyMaxStoryLength,
    setSafetyMaxStoryLength,
    safetyApprovalMode,
    setSafetyApprovalMode,
    safetyParentalGate,
    setSafetyParentalGate,
    safetyConsent,
    setSafetyConsent,
    contentCategories,
    safetyCategories,
    setSafetyCategories,
    isLoadingCategories,
    isSavingSafety,
    safetySuccessMsg,
    safetyErrorMsg,
    isSavedChanges,
    isPlayingAudio,
    setIsPlayingAudio,
    feedbackRating,
    setFeedbackRating,
    fetchChildProfiles,
    handleOpenAddChildModal,
    handleCreateChildSubmit,
    handleActivateChild,
    selectedChild,
    fetchChildDetail,
    fetchSupervisionData,
    handleCreateInvitation,
    handleCancelInvitation,
    handleReissueInvitation,
    handleRevokeSupervision,
    handleCopyCode,
    handleOpenPermissions,
    handleTogglePermission,
    handleTransferOwnershipSubmit,
    handleAcceptInvitationSubmit,
    handleRejectInvitationSubmit,
    handleSaveChildProfile,
    handleDeleteChildProfile,
    handleSaveLearningProfile,
    handleSaveSafetyPolicy,
  };
}
