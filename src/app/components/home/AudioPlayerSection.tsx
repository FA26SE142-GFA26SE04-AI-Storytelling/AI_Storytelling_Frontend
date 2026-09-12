'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Pause, RotateCcw, RotateCw, Moon, Clock, BookOpen, Sparkles, Volume2 } from 'lucide-react';
import { LULLABY_SOUNDS } from '../../constants/mockData';

export const AudioPlayerSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedIndex, setSpeedIndex] = useState<number>(0);
  const [selectedSound, setSelectedSound] = useState<string>('rain');
  const [isLullabyActive, setIsLullabyActive] = useState<boolean>(false);

  const speeds = ['1.0x (Chuẩn)', '1.2x (Nhanh)', '0.8x (Chậm)'];

  const handleSpeedToggle = () => {
    setSpeedIndex((prev) => (prev + 1) % speeds.length);
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
      {/* Left Card: Tiếp Tục Lắng Nghe WITH GLOWING BLUR BACKDROP */}
      <div className="relative group">
        {/* Glowing Blur Backdrop Layer */}
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-rose-500/25 via-amber-500/20 to-teal-400/25 blur-2xl opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none" />

        <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-outline-variant/30 dark:border-[#283556] shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-primary-container/40 dark:hover:border-amber-400/40 flex flex-col justify-between transition-all duration-300 h-full">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/30 dark:border-[#283556] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-primary-container/20 text-on-primary-container">
                  🎧
                </span>
                <h3 className="font-extrabold text-on-surface text-base">
                  Tiếp Tục Lắng Nghe
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary-container/20 text-on-primary-container text-xs font-bold">
                Đang nghe dở 55%
              </span>
            </div>

            {/* Active Audio Item */}
            <div className="bg-surface-container/70 dark:bg-[#172038]/70 rounded-2xl p-3 border border-outline-variant/20 dark:border-[#283556] shadow-2xs hover:shadow-md hover:scale-[1.01] hover:border-primary-container/40 transition-all flex items-center gap-3.5 mb-4 cursor-pointer">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-container-high group/img">
                <Image
                  src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=200&auto=format&fit=crop"
                  alt="Chú Gấu Leo Đi Tìm Mật"
                  fill
                  className="object-cover group-hover/img:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-primary-container">
                  Chương 3: Cây sồi cổ thụ
                </span>
                <h4 className="font-bold text-on-surface text-sm truncate">
                  Chú Gấu Leo Đi Tìm Mật
                </h4>
                <span className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5 opacity-80">
                  🎙️ Giọng đọc: Chú Trí Trắng (Dịu êm)
                </span>
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="flex flex-col gap-1.5 mb-4">
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden cursor-pointer">
                <div className="bg-primary-container h-full rounded-full transition-all duration-300 w-[55%]" />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant opacity-70">
                <span>05:52</span>
                <span>Tổng thời lượng: 08:00</span>
              </div>
            </div>
          </div>

          {/* Player Controls & Action Pills */}
          <div className="flex flex-col gap-3 pt-2">
            {/* Main Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Tua lại 10 giây"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-primary-container hover:brightness-105 text-on-primary-container flex items-center justify-center shadow-md shadow-primary-container/20 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current translate-x-0.5" />
                )}
              </button>
              <button
                className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Tua tiếp 10 giây"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Speed Toggle & Reading Mode */}
            <div className="flex items-center justify-between border-t border-outline-variant/30 dark:border-[#283556] pt-3 text-xs font-semibold">
              <button
                onClick={handleSpeedToggle}
                className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
              >
                Tốc độ: <span className="text-primary-container font-bold">{speeds[speedIndex]}</span>
              </button>
              <button className="text-primary-container hover:underline flex items-center gap-1 cursor-pointer font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Xem bản ghi chữ câu chuyện &gt;</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Card: Chế Độ Ru Ngủ 🌙 WITH GLOWING BLUR BACKDROP */}
      <div className="relative group">
        {/* Glowing Blur Backdrop Layer */}
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-indigo-500/25 via-purple-500/25 to-teal-400/25 blur-2xl opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none" />

        <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-outline-variant/30 dark:border-[#283556] shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-amber-400/40 flex flex-col justify-between transition-all duration-300 h-full">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/30 dark:border-[#283556] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-secondary-container/30 text-on-secondary-container dark:text-amber-300">
                  <Moon className="w-4 h-4 fill-amber-400 text-amber-500" />
                </span>
                <h3 className="font-extrabold text-on-surface text-base">
                  Chế Độ Ru Ngủ & Nhạc Nền Dịu 🌙
                </h3>
              </div>
              <button
                onClick={() => setIsLullabyActive(!isLullabyActive)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer p-0.5 ${
                  isLullabyActive ? 'bg-tertiary-container' : 'bg-outline-variant/60'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    isLullabyActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-subtitle text-xs sm:text-sm mb-4">
              Kết hợp tiếng mưa rơi nhẹ nhàng hoặc tiếng sóng biển thư giãn giúp bé dễ dàng chìm vào giấc ngủ sâu.
            </p>

            {/* Lullaby Sound Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              {LULLABY_SOUNDS.map((sound) => {
                const isSelected = selectedSound === sound.id;
                return (
                  <button
                    key={sound.id}
                    onClick={() => setSelectedSound(sound.id)}
                    className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                      isSelected
                        ? 'bg-secondary-container/20 border-secondary-container text-amber-800 dark:text-amber-300 shadow-xs font-bold scale-102'
                        : 'bg-surface-container/40 dark:bg-[#172038] border-outline-variant/20 text-on-surface-variant hover:border-outline-variant'
                    }`}
                  >
                    <span className="text-xl">{sound.icon}</span>
                    <span className="text-xs font-bold truncate w-full">{sound.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sleep Timer Bar */}
          <div className="p-3 rounded-2xl bg-surface-container/60 dark:bg-[#172038] border border-outline-variant/20 flex items-center justify-between text-xs font-bold text-on-surface">
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-300">
              <Clock className="w-4 h-4" />
              Hẹn giờ tự động tắt: 30 phút
            </span>
            <span className="text-tertiary-container font-extrabold">Đang bật</span>
          </div>
        </div>
      </div>
    </section>
  );
};
