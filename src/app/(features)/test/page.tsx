'use client';

import React, { useState, useEffect } from 'react';
import { RoomCanvas, STAGES, TimeOfDay } from '../../components/three/RoomCanvas';
import { getVietnamTimeOfDay } from '../../components/three/room/stages';
import { TestHeader } from './TestHeader';
import { X, LogIn, UserPlus, Lock, Mail, User, Sparkles, ArrowRight } from 'lucide-react';

export default function Test3DUIPage() {
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getVietnamTimeOfDay);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');

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

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-zinc-950 font-sans">

      {/* Dedicated Full-Width Test Page Header */}
      <TestHeader
        currentStage={currentStage}
        onStageChange={setCurrentStage}
        timeOfDay={timeOfDay}
        onTimeOfDayChange={setTimeOfDay}
      />

      {/* Fullscreen 3D Room Canvas */}
      <RoomCanvas
        currentStageIndex={currentStage}
        onStageChange={setCurrentStage}
        timeOfDay={timeOfDay}
        onTimeOfDayChange={setTimeOfDay}
      />

      {/* Interactive Sign In / Sign Up Floating Card when zoomed into Backpack (Stage 5) */}
      {currentStage === 5 && (
        <div className="fixed left-4 sm:left-12 top-1/2 -translate-y-1/2 z-30 w-[92%] sm:w-[420px] p-6 sm:p-7 rounded-3xl bg-zinc-900/90 dark:bg-zinc-950/90 backdrop-blur-2xl border border-white/20 dark:border-zinc-800/80 shadow-[0_0_50px_rgba(0,0,0,0.6)] text-white animate-in fade-in zoom-in duration-300">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-md">
                {authTab === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="font-black text-base tracking-tight text-white">
                  {authTab === 'signin' ? 'Đăng Nhập MagicTales' : 'Tạo Tài Khoản Mới'}
                </h2>
                <p className="text-[10px] text-zinc-400 font-medium">Cặp Sách Nobita 3D Authentication</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentStage(0)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Đóng & Quay lại góc nhìn toàn cảnh"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 mb-5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-xs font-bold">
            <button
              onClick={() => setAuthTab('signin')}
              className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
                authTab === 'signin'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => setAuthTab('signup')}
              className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
                authTab === 'signup'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Đăng Ký
            </button>
          </div>

          {/* Form Fields */}
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3.5">
            {authTab === 'signup' && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Họ và Tên</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Nhập họ và tên của bạn"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-zinc-300">Email / Tên tài khoản</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-zinc-300">Mật khẩu</label>
                {authTab === 'signin' && (
                  <a href="#" className="text-[10px] text-sky-400 hover:underline">Quên mật khẩu?</a>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>{authTab === 'signin' ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản Mới'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
