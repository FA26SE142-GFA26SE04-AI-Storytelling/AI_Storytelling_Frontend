'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Pause, RotateCcw, RotateCw, Moon, Clock, BookOpen } from 'lucide-react';
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
      {/* Left Card: Tiếp Tục Lắng Nghe */}
      <div className="bg-surface-container-lowest dark:bg-[#0F1626] rounded-3xl p-5 border border-outline-variant/30 dark:border-[#283556] shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-primary-container/40 dark:hover:border-amber-400/40 flex flex-col justify-between transition-all duration-300">
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
          <div className="bg-surface-container dark:bg-[#172038] rounded-2xl p-3 border border-outline-variant/20 dark:border-[#283556] shadow-2xs hover:shadow-md hover:scale-[1.01] hover:border-primary-container/40 transition-all flex items-center gap-3.5 mb-4 cursor-pointer">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-container-high group">
              <Image
                src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=200&auto=format&fit=crop"
                alt="Chú Gấu Leo Đi Tìm Mật"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
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

          {/* Sub Controls */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/30">
            <button
              onClick={handleSpeedToggle}
              className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center gap-1 hover:scale-105 active:scale-95 cursor-pointer transition-all"
            >
              🚀 Tốc độ: {speeds[speedIndex]}
            </button>
            <button className="px-3 py-1.5 rounded-full border border-outline-variant/40 hover:bg-surface-container text-on-surface font-bold text-xs flex items-center gap-1 hover:scale-105 active:scale-95 cursor-pointer transition-all">
              <BookOpen className="w-3.5 h-3.5 text-primary-container" />
              <span>Mở tranh đọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Card: Chế Độ Ru Ngủ Tối Nay */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 border border-indigo-900/60 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1.5 hover:border-amber-400/50 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
        {/* Star Glow Background */}
        <div className="absolute top-2 right-12 w-2 h-2 rounded-full bg-amber-200 blur-2xs animate-pulse" />
        <div className="absolute top-10 right-24 w-1.5 h-1.5 rounded-full bg-indigo-200 blur-2xs animate-ping" />

        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-900/80 text-amber-300">
                <Moon className="w-4 h-4 fill-amber-300" />
              </span>
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Chế Độ Ru Ngủ Tối Nay 🌙
                </h3>
                <p className="text-[11px] text-indigo-300 font-medium">
                  Âm thanh êm dịu, hạ giọng ru nhỏ dần
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-900/90 border border-indigo-700 text-amber-300 text-[11px] font-bold flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer">
              <Clock className="w-3 h-3" />
              Hẹn giờ: 20 phút
            </span>
          </div>

          {/* Bedtime Track Item */}
          <div className="bg-indigo-900/40 border border-indigo-700/50 rounded-2xl p-3 flex items-center gap-3.5 mb-4 backdrop-blur-xs hover:scale-[1.01] hover:bg-indigo-900/60 hover:border-amber-300/40 transition-all cursor-pointer">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-indigo-950 group">
              <Image
                src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&auto=format&fit=crop"
                alt="Chú Cừu Bông Tìm Đảo Ngủ Ngon"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                Dành cho giấc ngủ sâu 💤
              </span>
              <h4 className="font-bold text-white text-sm truncate">
                Chú Cừu Bông Tìm Đảo Ngủ Ngon
              </h4>
              <p className="text-[11px] text-indigo-200 line-clamp-1">
                Giai điệu sáng mềm và giọng hát ru êm dịu không lời
              </p>
            </div>
          </div>

          {/* Ambient Sound Selector */}
          <div className="flex flex-col gap-2 mb-4">
            <span className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider">
              CHỌN NHẠC NỀN KÈM THEO:
            </span>
            <div className="flex flex-wrap gap-2">
              {LULLABY_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => setSelectedSound(sound.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    selectedSound === sound.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-xs'
                      : 'bg-indigo-900/50 hover:bg-indigo-900 text-indigo-200 border-indigo-800'
                  }`}
                >
                  <span>{sound.icon} {sound.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lullaby Play Button */}
        <button
          onClick={() => setIsLullabyActive(!isLullabyActive)}
          className={`w-full py-3 rounded-full font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98 ${
            isLullabyActive
              ? 'bg-emerald-400 text-slate-950 shadow-emerald-900/30'
              : 'bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-amber-900/40'
          }`}
        >
          <Moon className="w-4 h-4 fill-current" />
          <span>{isLullabyActive ? 'Đang Bật Ru Ngủ...' : '🌙 Bật Ru Ngủ'}</span>
        </button>
      </div>
    </section>
  );
};
