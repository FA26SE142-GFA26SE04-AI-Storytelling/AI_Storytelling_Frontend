'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { animatePopItem } from '../../utils/gsapAnimations';

gsap.registerPlugin(useGSAP);

import { RoomCanvas, STAGES, TimeOfDay } from './RoomCanvas';
import { getVietnamTimeOfDay } from './room/stages';
import { RoomHeader } from './RoomHeader';
import { LibraryBookshelfZoomOverlay } from '../library/LibraryBookshelfZoomOverlay';
import { ParentDeskZoomOverlay } from '../parents/ParentDeskZoomOverlay';
import { ParentLaptopDashboardOverlay } from '../parents/ParentLaptopDashboardOverlay';
import { BackpackAuthZoomOverlay } from '../backpack/BackpackAuthZoomOverlay';
import { ChildEasyLoginOverlay } from '../child/ChildEasyLoginOverlay';
import { ParentalGateModal } from '../common/ParentalGateModal';
import { useAuth } from '../../context/AuthContext';
import { useChildSession } from '../../context/ChildSessionContext';
import { childProfileService } from '../../services/childProfileService';
import { ChildProfile } from '../../types/childProfile';
import { ArrowLeft } from 'lucide-react';

export default function Room3DView() {
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getVietnamTimeOfDay);
  const [isTopHovered, setIsTopHovered] = useState<boolean>(false);

  // Initial Auth parameters parsed from URL
  const [initialAuthTab, setInitialAuthTab] = useState<'signin' | 'signup' | 'verify' | 'forgot' | 'reset'>('signin');
  const [initialEmail, setInitialEmail] = useState<string>('');
  const [initialToken, setInitialToken] = useState<string>('');

  const isHeaderVisible = currentStage === 0 || isTopHovered;
  const { isLoggedIn } = useAuth();
  const {
    isChildModeActive,
    startChildSession,
    isParentalGateOpen,
    closeParentalGate,
    onParentalGateSuccess,
    pendingGateDestinationStage,
    setPendingGateDestinationStage,
    requestExitWithGate,
  } = useChildSession();

  const [showChildEasyLogin, setShowChildEasyLogin] = useState<boolean>(false);
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const roomViewRef = useRef<HTMLDivElement>(null);

  // Tải danh sách bé cho màn hình EasyLogin độc lập
  const fetchChildrenForEasyLogin = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await childProfileService.getMyChildProfiles();
      if (res.success && res.data) {
        setChildProfiles(res.data);
      }
    } catch (e) {
      console.error('Failed to load child profiles for easy login:', e);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchChildrenForEasyLogin();
  }, [fetchChildrenForEasyLogin]);

  // Bộ điều phối chuyển đổi Stage có bảo vệ an toàn cho trẻ em
  const handleStageChange = useCallback((targetStage: number) => {
    if (isChildModeActive && (targetStage === 5 || targetStage === 6)) {
      setPendingGateDestinationStage(targetStage);
      requestExitWithGate();
      return;
    }
    setCurrentStage(targetStage);
  }, [isChildModeActive, requestExitWithGate, setPendingGateDestinationStage]);

  // Tự động đọc URL query params khi vào trang chủ
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    const tokenParam = params.get('token') || params.get('resetToken');
    const emailParam = params.get('email') || '';
    const codeParam = params.get('code') || params.get('invitationCode') || params.get('inviteCode');

    if (codeParam) {
      sessionStorage.setItem('pendingInvitationCode', codeParam);
      if (isLoggedIn) {
        setCurrentStage(6);
      } else {
        setCurrentStage(5);
        setInitialAuthTab('signup');
      }
    } else if (tokenParam || authParam === 'reset') {
      setCurrentStage(5);
      setInitialAuthTab('reset');
      if (tokenParam) setInitialToken(tokenParam);
      if (emailParam) setInitialEmail(emailParam);
    } else if (authParam === 'forgot') {
      setCurrentStage(5);
      setInitialAuthTab('forgot');
      if (emailParam) setInitialEmail(emailParam);
    } else if (authParam === 'signin') {
      setCurrentStage(5);
      setInitialAuthTab('signin');
      if (emailParam) setInitialEmail(emailParam);
    } else if (authParam === 'signup') {
      setCurrentStage(5);
      setInitialAuthTab('signup');
      if (emailParam) setInitialEmail(emailParam);
    } else if (authParam === 'verify') {
      setCurrentStage(5);
      setInitialAuthTab('verify');
      if (emailParam) setInitialEmail(emailParam);
    }
  }, [isLoggedIn]);

  // Wheel scroll handler to change camera stages smoothly
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleWheel = (e: WheelEvent) => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        if (e.deltaY > 30) {
          handleStageChange(Math.min(currentStage + 1, STAGES.length - 1));
        } else if (e.deltaY < -30) {
          handleStageChange(Math.max(currentStage - 1, 0));
        }
      }, 250);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentStage, handleStageChange]);

  // GSAP: Hiệu ứng nút quay lại toàn cảnh khi Zoom vào Stage 3 hoặc 4
  useGSAP(() => {
    if (currentStage === 3 || currentStage === 4) {
      animatePopItem('.room-back-btn');
    }
  }, { scope: roomViewRef, dependencies: [currentStage] });

  const handleEasyLoginSuccess = (child: ChildProfile) => {
    startChildSession(child, 'IndependentEasyLogin');
    setShowChildEasyLogin(false);
    setCurrentStage(2); // Kệ Sách Thần Kỳ
  };

  const handleGateUnlockSuccess = () => {
    onParentalGateSuccess();
    if (pendingGateDestinationStage !== null) {
      setCurrentStage(pendingGateDestinationStage);
    } else {
      setCurrentStage(6); // Quay lại Laptop người lớn
    }
  };

  return (
    <div
      ref={roomViewRef}
      data-time-of-day={timeOfDay}
      className={`relative w-screen h-screen overflow-hidden select-none bg-zinc-950 font-sans theme-${timeOfDay} transition-colors duration-700`}
    >
      {/* Invisible Top Edge Hover Detector */}
      {currentStage !== 0 && (
        <div
          onMouseEnter={() => setIsTopHovered(true)}
          className="fixed top-0 left-0 right-0 h-8 z-30 pointer-events-auto"
        />
      )}

      {/* 3D Header Navigation */}
      <RoomHeader
        currentStage={currentStage}
        onStageChange={handleStageChange}
        timeOfDay={timeOfDay}
        onTimeOfDayChange={setTimeOfDay}
        isVisible={isHeaderVisible}
        onMouseEnter={() => setIsTopHovered(true)}
        onMouseLeave={() => setIsTopHovered(false)}
        onOpenChildLogin={() => {
          fetchChildrenForEasyLogin();
          setShowChildEasyLogin(true);
        }}
      />

      {/* Nút Quay lại Toàn Cảnh khi Zoom vào các góc đồ vật */}
      {(currentStage === 3 || currentStage === 4) && (
        <div className="fixed top-4 left-4 z-30 pointer-events-auto">
          <button
            onClick={() => handleStageChange(0)}
            className="room-back-btn px-4 py-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-900 text-white font-extrabold text-xs flex items-center gap-2 border border-white/20 shadow-xl backdrop-blur-xl transition-all hover:scale-105 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Quay lại Toàn Cảnh (Góc 1)</span>
          </button>
        </div>
      )}

      {/* Fullscreen 3D Room Canvas */}
      <RoomCanvas
        currentStageIndex={currentStage}
        onStageChange={handleStageChange}
        timeOfDay={timeOfDay}
        onTimeOfDayChange={setTimeOfDay}
      />

      {/* Interactive Floating Parent Desk Overlay when zoomed into Desk (Stage 1) */}
      {currentStage === 1 && (
        <ParentDeskZoomOverlay
          currentStage={currentStage}
          onStageChange={handleStageChange}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
          is2DViewAvailable={false}
        />
      )}

      {/* Interactive Floating Bookshelf Overlay when zoomed into Bookshelf (Stage 2) */}
      {currentStage === 2 && (
        <LibraryBookshelfZoomOverlay
          currentStage={currentStage}
          onStageChange={handleStageChange}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
          is2DViewAvailable={false}
        />
      )}

      {/* Interactive Sign In Floating Card when zoomed into Backpack (Stage 5) */}
      {currentStage === 5 && (
        <BackpackAuthZoomOverlay
          currentStage={currentStage}
          onStageChange={handleStageChange}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
          initialAuthTab={initialAuthTab}
          initialEmail={initialEmail}
          initialToken={initialToken}
        />
      )}

      {/* Interactive Parent Dashboard Overlay when zoomed into Laptop (Stage 6) */}
      {currentStage === 6 && (
        <ParentLaptopDashboardOverlay
          currentStage={currentStage}
          onStageChange={handleStageChange}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
          is2DViewAvailable={false}
        />
      )}

      {/* Modal Cổng Bảo Vệ Phụ Huynh (Parental Gate) */}
      <ParentalGateModal
        isOpen={isParentalGateOpen}
        onClose={closeParentalGate}
        onSuccess={handleGateUnlockSuccess}
      />

      {/* Modal Bé Đăng Nhập Độc Lập (Child EasyLogin Overlay) */}
      <ChildEasyLoginOverlay
        isOpen={showChildEasyLogin}
        onClose={() => setShowChildEasyLogin(false)}
        childProfiles={childProfiles}
        onLoginSuccess={handleEasyLoginSuccess}
      />
    </div>
  );
}
