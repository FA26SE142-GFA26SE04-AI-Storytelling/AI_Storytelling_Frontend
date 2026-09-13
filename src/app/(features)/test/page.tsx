'use client';

import React, { useState, useEffect } from 'react';
import { NobitaRoomCanvas, STAGES, TimeOfDay } from '../../components/three/NobitaRoomCanvas';
import { Sparkles, ArrowRight, ArrowLeft, Home, Compass, BookOpen, Clock, ShieldCheck, Wand2, DoorOpen, Layers } from 'lucide-react';
import Link from 'next/link';

export default function Test3DUIPage() {
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('afternoon');

  // Wheel scroll handler to change camera stages smoothly
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleWheel = (e: WheelEvent) => {
      // Throttle wheel scroll events
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        if (e.deltaY > 30) {
          setCurrentStage((prev) => Math.min(prev + 1, STAGES.length - 1));
        } else if (e.deltaY < -30) {
          setCurrentStage((prev) => Math.max(prev - 1, 0));
        }
      }, 250);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleNextStage = () => {
    setCurrentStage((prev) => (prev < STAGES.length - 1 ? prev + 1 : 0));
  };

  const handlePrevStage = () => {
    setCurrentStage((prev) => (prev > 0 ? prev - 1 : STAGES.length - 1));
  };

  // Content for each UI station overlay
  const stageDetails = [
    {
      badge: 'STATION 01 / PERSPECTIVE WIRE MODEL',
      icon: Layers,
      title: 'Toàn Cảnh Bố Cục Kiến Trúc Phòng 3D',
      description:
        'Bối cảnh 3D được tái tạo theo chuẩn bản vẽ kỹ thuật (Blueprint Sheet M-001): Tường sau gồm Clean Shelves & Closet Frame A, Tường trái gồm Window Sill Detail A (1200x1600mm), Chiếu Tatami 6 ô chuẩn.',
      actionText: 'Bắt Đầu Trải Nghiệm (Cuộn Chuột Down 👇)',
      actionLink: '#',
    },
    {
      badge: 'STATION 02 / RIGHT WALL DESK',
      icon: Clock,
      title: 'Góc Bàn Học Gỗ & Ghế Xoay Chân Vịt',
      description:
        'Khu vực bàn làm việc đặt sát tường bên phải với bàn gỗ ngăn kéo và ghế xoay chân 5 nhánh. Nơi bắt đầu quá trình sáng tạo câu chuyện AI!',
      actionText: 'Tạo Truyện AI Ngay',
      actionLink: '/create',
    },
    {
      badge: 'STATION 03 / FRONT ELEVATION - CLEAN SHELVES',
      icon: BookOpen,
      title: 'Kệ Sách 3 Tầng Âm Tường (Clean Shelves)',
      description:
        'Kệ sách 3 tầng thiết kế tỉ lệ chuẩn theo bản vẽ mặt đứng Front Elevation, phía trên đặt quả địa cầu biển xanh và đồng hồ báo thức.',
      actionText: 'Khám Phá Thư Viện Truyện',
      actionLink: '/library',
    },
    {
      badge: 'STATION 04 / CLOSET DOOR FRAME A & PANEL B',
      icon: DoorOpen,
      title: 'Tủ Trượt Âm Tường Oshiire (Closet Track System)',
      description:
        'Tủ trượt 2 cánh Fusuma trắng kẻ sọc ngang xanh dương (Panel B) với hệ thống ray trượt âm tường (Closet Door Track System).',
      actionText: 'Khám Phá Nhân Vật AI',
      actionLink: '/explore',
    },
    {
      badge: 'STATION 05 / SIDE ELEVATION - WINDOW DETAIL A',
      icon: ShieldCheck,
      title: 'Cửa Sổ Trượt Kính (Window Opening 1200x1600mm)',
      description:
        'Hệ cửa sổ gỗ trượt lớn ở tường bên trái theo chi tiết kĩ thuật Detail A: Window Sill Section với góc nhìn toàn cảnh bên ngoài.',
      actionText: 'Vào Bảng Phụ Huynh',
      actionLink: '/parents',
    },
  ];

  const currentContent = stageDetails[currentStage] || stageDetails[0];
  const IconComponent = currentContent.icon;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-zinc-950 font-sans">

      {/* 1. Fullscreen 3D Room Canvas */}
      <NobitaRoomCanvas
        currentStageIndex={currentStage}
        timeOfDay={timeOfDay}
        onTimeOfDayChange={setTimeOfDay}
      />

      {/* 3. Floating Left Station Navigation Dots */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col gap-3 p-3 rounded-2xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/30 dark:border-zinc-800/40 shadow-xl">
        {STAGES.map((stg, idx) => (
          <button
            key={stg.id}
            onClick={() => setCurrentStage(idx)}
            className={`group relative flex items-center gap-3 p-2 rounded-xl transition-all ${currentStage === idx
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50'
              }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${currentStage === idx ? 'bg-white' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
            <span className="text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity absolute left-10 px-2 py-1 bg-zinc-900 text-white rounded-lg pointer-events-none">
              {stg.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
