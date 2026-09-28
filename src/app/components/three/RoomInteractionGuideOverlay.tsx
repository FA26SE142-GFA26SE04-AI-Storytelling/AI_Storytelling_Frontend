'use client';

import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  BookOpen,
  Laptop,
  Briefcase,
  Lightbulb,
  DoorClosed,
} from 'lucide-react';
import { TimeOfDay } from './room/stages';

interface RoomHotspot {
  id: string;
  title: string;
  icon: React.ElementType;
  colorScheme: 'amber' | 'indigo' | 'sky' | 'emerald' | 'yellow';
  position: {
    top: string;
    left: string;
  };
  onClick: () => void;
}

interface RoomInteractionGuideOverlayProps {
  currentStage: number;
  onStageChange: (stageIndex: number) => void;
  timeOfDay: TimeOfDay;
}

export function RoomInteractionGuideOverlay({
  currentStage,
  onStageChange,
  timeOfDay,
}: RoomInteractionGuideOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Chỉ hiển thị ở chế độ Toàn Cảnh (Stage 0)
  const isVisible = currentStage === 0;

  // Định nghĩa các icon tương tác chính trên nền 3D (đã loại bỏ công tắc đèn)
  const hotspots: RoomHotspot[] = [
    {
      id: 'bookshelf',
      title: 'Kệ Sách Thần Kỳ - Thư viện truyện AI',
      icon: BookOpen,
      colorScheme: 'amber',
      position: { top: '44%', left: '33%' },
      onClick: () => onStageChange(2),
    },
    {
      id: 'laptop',
      title: 'Laptop Phụ Huynh - Quản lý hồ sơ bé',
      icon: Laptop,
      colorScheme: 'indigo',
      position: { top: '61%', left: '17%' },
      onClick: () => onStageChange(6),
    },
    {
      id: 'backpack',
      title: 'Cặp Sách Nobita - Đăng nhập & Tài khoản',
      icon: Briefcase,
      colorScheme: 'sky',
      position: { top: '73%', left: '83%' },
      onClick: () => onStageChange(5),
    },
    {
      id: 'closet',
      title: 'Tủ Trượt Âm Tường',
      icon: DoorClosed,
      colorScheme: 'emerald',
      position: { top: '35%', left: '57%' },
      onClick: () => onStageChange(3),
    },
  ];

  // GSAP: Hiệu ứng xuất hiện mượt mà của các icon khi ở Stage 0
  useGSAP(
    () => {
      if (isVisible) {
        gsap.fromTo(
          '.hotspot-icon-marker',
          { scale: 0, opacity: 0, y: 10 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.07,
            ease: 'back.out(2)',
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    { scope: containerRef, dependencies: [isVisible] }
  );

  if (!isVisible) return null;

  const getColorClasses = (scheme: RoomHotspot['colorScheme']) => {
    switch (scheme) {
      case 'amber':
        return {
          ping: 'bg-amber-400',
          dot: 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500',
          shadow: 'shadow-lg shadow-amber-500/30 hover:shadow-amber-500/60',
          ring: 'ring-amber-400/40 hover:ring-amber-300',
        };
      case 'indigo':
        return {
          ping: 'bg-indigo-400',
          dot: 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500',
          shadow: 'shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/60',
          ring: 'ring-indigo-400/40 hover:ring-indigo-300',
        };
      case 'sky':
        return {
          ping: 'bg-sky-400',
          dot: 'bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600',
          shadow: 'shadow-lg shadow-sky-500/30 hover:shadow-sky-500/60',
          ring: 'ring-sky-400/40 hover:ring-sky-300',
        };
      case 'emerald':
        return {
          ping: 'bg-emerald-400',
          dot: 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-600',
          shadow: 'shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/60',
          ring: 'ring-emerald-400/40 hover:ring-emerald-300',
        };
      case 'yellow':
        return {
          ping: 'bg-yellow-400',
          dot: 'bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-500',
          shadow: 'shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/60',
          ring: 'ring-yellow-400/40 hover:ring-yellow-300',
        };
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-20 overflow-hidden"
    >
      {hotspots.map((hs) => {
        const colors = getColorClasses(hs.colorScheme);
        const Icon = hs.icon;

        return (
          <button
            key={hs.id}
            id={`hotspot-pin-${hs.id}`}
            style={{
              left: 0,
              top: 0,
              opacity: 0,
              transform: 'translate3d(-9999px, -9999px, 0)',
            }}
            title={hs.title}
            onClick={hs.onClick}
            className="hotspot-icon-marker absolute pointer-events-auto group cursor-pointer p-2 outline-none will-change-transform"
          >
            <div className="relative flex items-center justify-center">
              {/* Vòng tròn Radar chỉ phát sáng lan tỏa khi di chuột vào (hover) */}
              <span
                className={`absolute -inset-1 rounded-full ${colors.ping} opacity-0 group-hover:opacity-75 group-hover:animate-ping duration-1000 pointer-events-none transition-opacity`}
              />

              {/* Nút Icon tròn tinh gọn với gradient & viền sáng */}
              <span
                className={`relative flex items-center justify-center w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full ${colors.dot} text-white ${colors.shadow} border border-white/80 ring-2 ${colors.ring} opacity-85 group-hover:opacity-100 group-hover:scale-125 group-active:scale-95 transition-all duration-300 ease-out`}
              >
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 drop-shadow" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
