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
  UserPlus,
  RefreshCw,
  AlertCircle,
  Plus,
  X,
  User,
  Star,
  Edit3,
  Tag,
  Coins,
  Calendar,
  Globe,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';
import { useAuth } from '../../context/AuthContext';
import { childProfileService } from '../../services/childProfileService';
import {
  ChildProfile,
  LearningProfile,
  SafetyPolicy,
  TokenQuotaStatus,
} from '../../types/childProfile';

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

  // Child Profiles States (fetched from GET /api/v1/ChildProfile/mine)
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState<boolean>(true);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [childError, setChildError] = useState<string | null>(null);
  const [showAddChildModal, setShowAddChildModal] = useState<boolean>(false);
  const [newChildNickname, setNewChildNickname] = useState<string>('');
  const [newChildAgeBand, setNewChildAgeBand] = useState<string>('Age_6_8');
  const [isCreatingChild, setIsCreatingChild] = useState<boolean>(false);
  const [activatingChildId, setActivatingChildId] = useState<number | null>(null);
  const [createChildSuccess, setCreateChildSuccess] = useState<string | null>(null);

  // Selected Child Detailed Data (Learning Profile, Safety Policy, Token Quota)
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [safetyPolicy, setSafetyPolicy] = useState<SafetyPolicy | null>(null);
  const [tokenQuota, setTokenQuota] = useState<TokenQuotaStatus | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

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

  // Safety Policy Edit States
  const [safetyMaxStoryLength, setSafetyMaxStoryLength] = useState<number>(2000);
  const [safetyApprovalMode, setSafetyApprovalMode] = useState<string>('AlwaysManual');
  const [safetyParentalGate, setSafetyParentalGate] = useState<boolean>(true);
  const [isSavingSafety, setIsSavingSafety] = useState<boolean>(false);

  // Parent Control Settings States
  const [selectedScreenTime, setSelectedScreenTime] = useState<number>(30);
  const [isBedtimeEnabled, setIsBedtimeEnabled] = useState<boolean>(true);
  const [isPinProtected, setIsPinProtected] = useState<boolean>(true);
  const [aiFilterLevel, setAiFilterLevel] = useState<'strict' | 'standard' | 'creative'>('standard');
  const [isSavedChanges, setIsSavedChanges] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
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
  }, []);

  const handleCreateChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildNickname.trim()) return;

    setIsCreatingChild(true);
    setChildError(null);
    setCreateChildSuccess(null);

    try {
      const res = await childProfileService.createChildProfile({
        nickname: newChildNickname.trim(),
        ageBand: newChildAgeBand,
        language: 'vi',
        scope: 'Personal',
      });

      if (res.success && res.data) {
        const createdChild = res.data;
        // Tự động thiết lập Learning Profile + Safety Policy + Kích hoạt sang Active (Đang hoạt động)
        const activateRes = await childProfileService.setupAndActivateChild(
          createdChild.id,
          createdChild.nickname,
          createdChild.ageBand
        );

        if (activateRes.success) {
          setCreateChildSuccess(`Đã tạo và kích hoạt bé "${createdChild.nickname}" thành công (Đang hoạt động)!`);
        } else {
          setCreateChildSuccess(`Đã tạo bé "${createdChild.nickname}". Vui lòng nhấn "Kích hoạt" để hoàn tất.`);
        }

        setNewChildNickname('');
        setShowAddChildModal(false);
        await fetchChildProfiles();
        setSelectedChildId(createdChild.id);
        setTimeout(() => setCreateChildSuccess(null), 5000);
      } else {
        setChildError(res.message || 'Không thể tạo hồ sơ bé.');
      }
    } catch (err) {
      setChildError((err as Error).message || 'Có lỗi xảy ra khi tạo hồ sơ bé.');
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
      } else {
        setLearningProfile(null);
      }

      if (spRes.status === 'fulfilled' && spRes.value.success && spRes.value.data) {
        setSafetyPolicy(spRes.value.data);
        setSafetyMaxStoryLength(spRes.value.data.maxStoryLength || 2000);
        setSafetyApprovalMode(spRes.value.data.requiredApprovalMode || 'AlwaysManual');
        setSafetyParentalGate(spRes.value.data.parentalGateEnabled ?? true);
      } else {
        setSafetyPolicy(null);
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

  useEffect(() => {
    if (selectedChild) {
      setEditNickname(selectedChild.nickname);
      setEditAgeBand(selectedChild.ageBand);
      setEditLanguage(selectedChild.language || 'vi');
      fetchChildDetail(selectedChild.id);
    }
  }, [selectedChildId, childProfiles.length]);

  const handleSaveChildProfile = async (e: React.FormEvent) => {
    e.preventDefault();
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

        // Nạp lại danh sách mới từ máy chủ
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

  const handleSaveSafetyPolicy = async () => {
    if (!selectedChild) return;
    setIsSavingSafety(true);
    try {
      const res = await childProfileService.setSafetyPolicy(selectedChild.id, {
        maxStoryLength: safetyMaxStoryLength,
        requiredApprovalMode: safetyApprovalMode as any,
        parentalGateEnabled: safetyParentalGate,
        consentRecorded: true,
      });

      if (res.success) {
        setIsSavedChanges(true);
        await fetchChildDetail(selectedChild.id);
        setTimeout(() => setIsSavedChanges(false), 3000);
      } else {
        alert(res.message || 'Không thể lưu quy tắc an toàn.');
      }
    } catch (err) {
      alert((err as Error).message || 'Lỗi khi lưu quy tắc an toàn.');
    } finally {
      setIsSavingSafety(false);
    }
  };

  const getReadingLevelDesc = (level: number) => {
    switch (level) {
      case 1:
        return 'Cấp 1 • Làm quen chữ cái, nhận biết âm thanh & hình ảnh trực quan.';
      case 2:
        return 'Cấp 2 • Đọc hiểu câu ngắn có hội thoại đơn giản và cốt truyện gần gũi.';
      case 3:
        return 'Cấp 3 • Tư duy phân tích, từ vựng phong phú, khám phá thế giới & khoa học.';
      case 4:
        return 'Cấp 4 • Phát triển tư duy phản biện, suy luận logic và thấu cảm xã hội.';
      case 5:
        return 'Cấp 5 • Tưởng tượng chuyên sâu, phân tích tình huống phức tạp & đồng tác giả AI.';
      default:
        return 'Cấp độ nhận thức phát triển tự nhiên phù hợp theo lứa tuổi của bé.';
    }
  };


  const formatAgeBand = (ageBand: string) => {
    switch (ageBand) {
      case 'Age_6_8':
      case 'Age6To8':
        return '6 - 8 tuổi';
      case 'Age_9_12':
      case 'Age9To12':
        return '9 - 12 tuổi';
      case 'Age_3_5':
      case 'Age3To5':
        return '3 - 5 tuổi';
      default:
        return ageBand || 'Chưa đặt tuổi';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return {
          label: 'Đang hoạt động',
          className: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
        };
      case 'PendingParentConsent':
        return {
          label: 'Chờ đồng ý',
          className: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400',
        };
      case 'Archived':
        return {
          label: 'Đã lưu trữ',
          className: 'bg-zinc-900 border-zinc-700 text-zinc-400',
          dot: 'bg-zinc-500',
        };
      default:
        return {
          label: status || 'Hoạt động',
          className: 'bg-sky-950/70 border-sky-500/40 text-sky-300',
          dot: 'bg-sky-400',
        };
    }
  };

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
            {/* TAB 1: CHI TIẾT HỒ SƠ BÉ (CHILD DETAIL) */}
            {activeTab === 'analytics' && (
              <div className="space-y-3">
                {selectedChild ? (
                  <>
                    {/* Header Spotlight Card */}
                    <div className="laptop-metric-item p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/70 via-indigo-950/50 to-zinc-900 border border-sky-500/40 shadow-lg flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-lg text-white shadow-md shadow-sky-500/20 ring-2 ring-sky-400/40 shrink-0">
                          {selectedChild.nickname ? selectedChild.nickname.charAt(0).toUpperCase() : 'B'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="font-extrabold text-base text-white truncate flex items-center gap-2">
                            <span>{selectedChild.nickname}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                              ID #{selectedChild.id}
                            </span>
                          </h3>
                          <span className="text-[11px] text-zinc-400">
                            Hồ sơ trẻ em trên hệ thống
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {selectedChild.status !== 'Active' && (
                          <button
                            type="button"
                            onClick={() => handleActivateChild(selectedChild.id, selectedChild.nickname, selectedChild.ageBand)}
                            disabled={activatingChildId === selectedChild.id}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                          >
                            {activatingChildId === selectedChild.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                            )}
                            <span>Kích hoạt</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingChild(!isEditingChild);
                            if (!isEditingChild && selectedChild) {
                              setEditNickname(selectedChild.nickname);
                              setEditAgeBand(selectedChild.ageBand);
                              setEditLanguage(selectedChild.language || 'vi');
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                            isEditingChild
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300 hover:text-white'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isEditingChild ? 'Đóng' : 'Sửa'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsConfirmingDelete(true);
                            setDeleteError(null);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 hover:text-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                          title="Xóa hồ sơ bé"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>

                    {/* Hộp Thoại Xác Nhận Xóa Hồ Sơ Trẻ */}
                    {isConfirmingDelete && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/90 via-zinc-900 to-zinc-950 border-2 border-rose-500/60 flex flex-col gap-3 shadow-2xl animate-in fade-in duration-200">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                            <AlertTriangle className="w-5 h-5 text-rose-400" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <strong className="text-xs font-bold text-rose-200">
                              Xác nhận xóa hồ sơ bé "{selectedChild.nickname}" (ID #{selectedChild.id})?
                            </strong>
                            <p className="text-[11px] text-zinc-300 leading-relaxed">
                              Thao tác này sẽ gọi API <code className="text-rose-400 font-mono">DELETE /ChildProfile/{selectedChild.id}</code> để chuyển trạng thái hồ sơ sang <span className="font-mono text-amber-300 font-bold">Archived</span> (Lưu trữ). Dữ liệu lịch sử truyện đã đọc vẫn được bảo lưu an toàn.
                            </p>
                          </div>
                        </div>

                        {deleteError && (
                          <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600/50 text-rose-200 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{deleteError}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-rose-500/20">
                          <span className="text-[10px] text-zinc-400 font-mono">
                            API: DELETE /ChildProfile/{selectedChild.id}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isDeletingChild}
                              onClick={() => {
                                setIsConfirmingDelete(false);
                                setDeleteError(null);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="button"
                              disabled={isDeletingChild}
                              onClick={handleDeleteChildProfile}
                              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-rose-900/40"
                            >
                              {isDeletingChild ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang xóa...</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xác Nhận Xóa</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inline Edit Form */}
                    {isEditingChild && (
                      <form
                        onSubmit={handleSaveChildProfile}
                        className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-sky-950/40 border-2 border-sky-500/50 flex flex-col gap-3 shadow-2xl animate-in fade-in duration-200"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                          <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                            <Edit3 className="w-4 h-4 text-sky-400" />
                            Chỉnh Sửa Hồ Sơ Bé #{selectedChild.id} ({selectedChild.nickname})
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditingChild(false)}
                            className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800"
                          >
                            ✕ Đóng
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-zinc-300">Biệt danh (nickname) *</label>
                            <input
                              type="text"
                              required
                              maxLength={150}
                              value={editNickname}
                              onChange={(e) => setEditNickname(e.target.value)}
                              placeholder="VD: Bé Bống, Bin..."
                              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-zinc-300">Nhóm tuổi (ageBand) *</label>
                            <select
                              value={editAgeBand}
                              onChange={(e) => setEditAgeBand(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                            >
                              <option value="Age_3_5">Age_3_5 (3 - 5 tuổi)</option>
                              <option value="Age_6_8">Age_6_8 (6 - 8 tuổi)</option>
                              <option value="Age_9_12">Age_9_12 (9 - 12 tuổi)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-zinc-300">Ngôn ngữ (language)</label>
                            <select
                              value={editLanguage}
                              onChange={(e) => setEditLanguage(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                            >
                              <option value="vi">vi (Tiếng Việt 🇻🇳)</option>
                              <option value="en">en (English 🇬🇧)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                          <span className="text-[10px] text-zinc-400">
                            API: <code className="text-sky-400 font-mono">PUT /ChildProfile/{selectedChild.id}</code>
                          </span>
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingChild(false);
                                setIsConfirmingDelete(true);
                                setDeleteError(null);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-rose-100 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa bé này</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingChild(false)}
                              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingEdit || !editNickname.trim()}
                              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-sky-500/20"
                            >
                              {isSavingEdit ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang lưu...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Lưu Thay Đổi</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {editSuccessMsg && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{editSuccessMsg}</span>
                      </div>
                    )}

                    {/* Chi Tiết Thuộc Tính Child Profile (nickname, ageBand, language, status, scope, organizationId, createdAt) */}
                    <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-sky-400" />
                          Thông Tin Chi Tiết Hồ Sơ (Child Detail)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-mono">ID #{selectedChild.id}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingChild(true);
                              setEditNickname(selectedChild.nickname);
                              setEditAgeBand(selectedChild.ageBand);
                              setEditLanguage(selectedChild.language || 'vi');
                            }}
                            className="px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Edit3 className="w-3 h-3 text-sky-400" />
                            <span>Sửa</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        {/* 1. nickname */}
                        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">nickname</span>
                          <strong className="text-white text-sm truncate">{selectedChild.nickname}</strong>
                        </div>

                        {/* 2. ageBand */}
                        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">ageBand</span>
                          <span className="font-bold text-sky-300 flex items-center gap-1.5">
                            <span>{selectedChild.ageBand}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-500/30">
                              {formatAgeBand(selectedChild.ageBand)}
                            </span>
                          </span>
                        </div>

                        {/* 3. language */}
                        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">language</span>
                          <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                            <span>{selectedChild.language}</span>
                            <span className="text-[10px] text-zinc-400 font-normal">
                              {selectedChild.language === 'vi' ? '(Tiếng Việt 🇻🇳)' : ''}
                            </span>
                          </span>
                        </div>

                        {/* 4. status */}
                        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">status</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${getStatusBadge(selectedChild.status).className}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadge(selectedChild.status).dot}`} />
                              <span>{selectedChild.status}</span>
                            </span>
                            <span className="text-[10px] text-zinc-400">({getStatusBadge(selectedChild.status).label})</span>
                          </div>
                        </div>

                        {/* 5. scope */}
                        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">scope</span>
                          <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                            <span>{selectedChild.scope}</span>
                            <span className="text-[10px] text-zinc-400 font-normal">
                              {selectedChild.scope === 'Personal' ? '(Cá nhân)' : '(Lớp học/Tổ chức)'}
                            </span>
                          </span>
                        </div>

                        {/* 6. organizationId */}
                        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">organizationId</span>
                          <span className="font-bold text-amber-300 font-mono">
                            {selectedChild.organizationId !== null && selectedChild.organizationId !== undefined
                              ? selectedChild.organizationId
                              : 0}
                          </span>
                        </div>

                        {/* 7. createdAt (full width) */}
                        <div className="sm:col-span-2 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">createdAt</span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="font-mono text-xs text-zinc-200">
                              "{selectedChild.createdAt}"
                            </span>
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-sky-400" />
                              {new Date(selectedChild.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dữ Liệu Lấy Từ API: /api/v1/SafetyPolicy/{childProfileId} */}
                    <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-zinc-200">
                            Quy Tắc An Toàn (Safety Policy)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-mono">
                            GET /api/v1/SafetyPolicy/{selectedChild.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => fetchChildDetail(selectedChild.id)}
                            title="Làm mới Safety Policy"
                            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingDetail ? 'animate-spin text-sky-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {isLoadingDetail ? (
                        <div className="py-4 flex items-center justify-center gap-2 text-zinc-400 text-xs">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                          <span>Đang nạp dữ liệu Safety Policy từ máy chủ...</span>
                        </div>
                      ) : safetyPolicy ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          {/* 1. maxStoryLength */}
                          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                              maxStoryLength
                            </span>
                            <span className="font-bold text-white font-mono text-sm">
                              {safetyPolicy.maxStoryLength}
                            </span>
                          </div>

                          {/* 2. requiredApprovalMode */}
                          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                              requiredApprovalMode
                            </span>
                            <span className="font-bold text-sky-300 font-mono text-sm">
                              "{safetyPolicy.requiredApprovalMode}"
                            </span>
                          </div>

                          {/* 3. parentalGateEnabled */}
                          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                              parentalGateEnabled
                            </span>
                            <div className="flex items-center gap-1.5 pt-0.5 font-mono">
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[11px] font-bold flex items-center gap-1.5 ${
                                  safetyPolicy.parentalGateEnabled
                                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    safetyPolicy.parentalGateEnabled ? 'bg-emerald-400' : 'bg-zinc-500'
                                  }`}
                                />
                                <span>{String(safetyPolicy.parentalGateEnabled)}</span>
                              </span>
                            </div>
                          </div>

                          {/* 4. consentRecorded */}
                          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                              consentRecorded
                            </span>
                            <div className="flex items-center gap-1.5 pt-0.5 font-mono">
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[11px] font-bold flex items-center gap-1.5 ${
                                  safetyPolicy.consentRecorded
                                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                                    : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    safetyPolicy.consentRecorded ? 'bg-emerald-400' : 'bg-amber-400'
                                  }`}
                                />
                                <span>{String(safetyPolicy.consentRecorded)}</span>
                              </span>
                            </div>
                          </div>

                          {/* 5. categories */}
                          <div className="sm:col-span-2 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                                categories
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                [{safetyPolicy.categories?.length ?? 0} items]
                              </span>
                            </div>

                            {safetyPolicy.categories && safetyPolicy.categories.length > 0 ? (
                              <div className="flex flex-col gap-1.5">
                                {safetyPolicy.categories.map((cat, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs font-mono"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-zinc-400 text-[11px]">"contentCategoryId":</span>
                                      <span className="text-white font-bold">{cat.contentCategoryId}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-zinc-400 text-[11px]">"rule":</span>
                                      <span className="text-indigo-300 font-bold px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30">
                                        "{cat.rule}"
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 font-mono text-xs text-zinc-400 flex items-center gap-2">
                                <span>[]</span>
                                <span className="text-[10px] text-zinc-500">(Không có danh mục hạn chế)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-3 px-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-zinc-300">
                              Chưa thiết lập Safety Policy
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              Cần thiết lập quy tắc an toàn trước khi kích hoạt Active.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveSafetyPolicy()}
                            disabled={isSavingSafety}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {isSavingSafety ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            <span>Khởi tạo Safety Policy</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center text-zinc-400 text-xs flex flex-col items-center gap-2">
                    <User className="w-8 h-8 text-zinc-600" />
                    <span>Chưa có hồ sơ bé nào được chọn. Hãy chọn bé ở danh sách bên phải.</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PARENTAL CONTROLS & SAFETY (API: /SafetyPolicy/{id}) */}
            {activeTab === 'controls' && (
              <div className="space-y-3">
                {/* Story Length Limit */}
                <div className="laptop-tab-content-row p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-400" />
                      Độ Dài Câu Truyện AI Tối Đa (Max Story Length)
                    </span>
                    <strong className="text-xs font-black text-sky-400">{safetyMaxStoryLength} ký tự</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {[1000, 2000, 3500].map((len) => (
                      <button
                        key={len}
                        type="button"
                        onClick={() => setSafetyMaxStoryLength(len)}
                        className={`p-2 rounded-xl text-center font-bold text-[11px] transition-all cursor-pointer border ${
                          safetyMaxStoryLength === len
                            ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {len === 1000 ? 'Ngắn (1,000)' : len === 2000 ? 'Chuẩn (2,000)' : 'Dài (3,500)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Approval Mode */}
                <div className="laptop-tab-content-row p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Chế Độ Phê Duyệt Cốt Truyện
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSafetyApprovalMode('AlwaysManual')}
                      className={`p-2.5 rounded-xl text-left flex flex-col gap-0.5 border cursor-pointer transition-all ${
                        safetyApprovalMode === 'AlwaysManual'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <strong className="text-[11px] font-bold">Phụ Huynh Duyệt Thủ Công</strong>
                      <span className="text-[9px] text-zinc-400">Yêu cầu cha mẹ xem trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSafetyApprovalMode('AutoApproveSafe')}
                      className={`p-2.5 rounded-xl text-left flex flex-col gap-0.5 border cursor-pointer transition-all ${
                        safetyApprovalMode === 'AutoApproveSafe'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <strong className="text-[11px] font-bold">Tự Động Khi Đạt An Toàn</strong>
                      <span className="text-[9px] text-zinc-400">AI lọc nội dung phù hợp lứa tuổi</span>
                    </button>
                  </div>
                </div>

                {/* Parental Gate Toggle */}
                <div className="laptop-tab-content-row p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">Cổng An Toàn Phụ Huynh (Parental Gate)</span>
                      <span className="text-[10px] text-zinc-400">Ngăn bé tự ý thay đổi cấu hình hoặc nội dung</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSafetyParentalGate(!safetyParentalGate)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      safetyParentalGate ? 'bg-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        safetyParentalGate ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

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

                {/* Save Changes Button */}
                <button
                  type="button"
                  onClick={handleSaveSafetyPolicy}
                  disabled={isSavingSafety || !selectedChild}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingSafety ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang Lưu Vào Máy Chủ...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isSavedChanges ? '✓ Đã Lưu Cấu Hình An Toàn!' : `Lưu Cấu Hình An Toàn Cho ${selectedChild?.nickname || 'Bé'}`}</span>
                    </>
                  )}
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

        {/* RIGHT CARD: CHILD PROFILES LIST (API: /ChildProfile/mine) */}
        <div className="laptop-right-card pointer-events-auto w-full lg:w-[380px] rounded-3xl bg-zinc-950/90 backdrop-blur-2xl border border-sky-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-white p-4 sm:p-5 flex flex-col gap-3.5 max-h-[75vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>Hồ Sơ Của Bé</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {childProfiles.length}
                  </span>
                </h2>
                <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  API /ChildProfile/mine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={fetchChildProfiles}
                disabled={isLoadingChildren}
                title="Làm mới danh sách bé"
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingChildren ? 'animate-spin text-sky-400' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setShowAddChildModal(!showAddChildModal)}
                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-md ${
                  showAddChildModal
                    ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20 hover:scale-[1.02]'
                }`}
              >
                {showAddChildModal ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                <span>{showAddChildModal ? 'Đóng' : 'Thêm Bé'}</span>
              </button>
            </div>
          </div>

          {/* Inline Form Thêm Bé */}
          {showAddChildModal && (
            <form
              onSubmit={handleCreateChildSubmit}
              className="p-3.5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-zinc-900/90 border border-emerald-500/30 flex flex-col gap-2.5 shrink-0"
            >
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                Tạo Hồ Sơ Trẻ Mới
              </span>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-300">Biệt danh của bé *</label>
                <input
                  type="text"
                  required
                  value={newChildNickname}
                  onChange={(e) => setNewChildNickname(e.target.value)}
                  placeholder="Ví dụ: Bé Bắp, Bé Sam..."
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-300">Nhóm tuổi nhận thức *</label>
                <select
                  value={newChildAgeBand}
                  onChange={(e) => setNewChildAgeBand(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Age_6_8">6 - 8 tuổi (Tiểu học cơ bản)</option>
                  <option value="Age_9_12">9 - 12 tuổi (Khám phá nâng cao)</option>
                  <option value="Age_3_5">3 - 5 tuổi (Mầm non)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(false)}
                  className="flex-1 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingChild || !newChildNickname.trim()}
                  className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer transition-all"
                >
                  {isCreatingChild ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Lưu Hồ Sơ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Success / Error Banners */}
          {createChildSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-2 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{createChildSuccess}</span>
            </div>
          )}

          {childError && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] flex flex-col gap-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span className="font-semibold leading-tight">{childError}</span>
              </div>
              <button
                type="button"
                onClick={fetchChildProfiles}
                className="self-start text-[10px] text-sky-400 hover:underline font-semibold"
              >
                Nhấn để thử lại
              </button>
            </div>
          )}

          {/* Content Area: List of Child Profiles */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-0.5">
            {isLoadingChildren ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-400">
                <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
                <span className="text-xs font-medium">Đang tải danh sách bé từ máy chủ...</span>
              </div>
            ) : childProfiles.length === 0 ? (
              <div className="py-7 px-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col items-center justify-center text-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-white">Chưa có hồ sơ trẻ nào</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[220px]">
                    Tạo hồ sơ bé để theo dõi quá trình học tập và tạo truyện phù hợp theo lứa tuổi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(true)}
                  className="mt-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Hồ Sơ Bé Đầu Tiên</span>
                </button>
              </div>
            ) : (
              childProfiles.map((child) => {
                const isSelected = selectedChildId === child.id;
                const statusBadge = getStatusBadge(child.status);
                return (
                  <div
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-zinc-900/90 border-sky-500/60 shadow-lg shadow-sky-500/10'
                        : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md ${
                          isSelected
                            ? 'bg-gradient-to-tr from-sky-400 to-indigo-600 ring-2 ring-sky-400/50'
                            : 'bg-gradient-to-tr from-zinc-700 to-zinc-800 text-zinc-300'
                        }`}
                      >
                        {child.nickname ? child.nickname.charAt(0).toUpperCase() : 'B'}
                      </div>
                      <div className="flex flex-col min-w-0 gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-white truncate max-w-[130px]">
                            {child.nickname}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                          <span className="px-1.5 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-semibold">
                            {formatAgeBand(child.ageBand)}
                          </span>
                          <span className="text-[9px] text-zinc-500">ID #{child.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[9px] font-bold flex items-center gap-1 ${statusBadge.className}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        {statusBadge.label}
                      </span>
                      {child.status !== 'Active' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateChild(child.id, child.nickname, child.ageBand);
                          }}
                          disabled={activatingChildId === child.id}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shadow-sm hover:scale-105"
                          title="Thiết lập học tập, an toàn và kích hoạt ngay"
                        >
                          {activatingChildId === child.id ? (
                            <>
                              <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-300" />
                              <span>Đang kích hoạt...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                              <span>Kích hoạt ngay</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Footer */}
          {childProfiles.length > 0 && (
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 shrink-0">
              <span>Đang quản lý {childProfiles.length} bé</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('stories');
                  alert(`Đang mở kho truyện cho bé ID #${selectedChildId || childProfiles[0]?.id}!`);
                }}
                className="text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" />
                <span>Kho Truyện Của Bé →</span>
              </button>
            </div>
          )}
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
