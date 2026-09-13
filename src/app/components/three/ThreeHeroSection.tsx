'use client';

import React, { useState } from 'react';
import { ThreeStoryCanvas, SceneMode, ThemeColor } from './ThreeStoryCanvas';
import { ThreeDemoControls } from './ThreeDemoControls';
import { Sparkles, Compass, Play, Wand2, ShieldCheck, Stars } from 'lucide-react';
import Link from 'next/link';

export const ThreeHeroSection: React.FC = () => {
  const [sceneMode, setSceneMode] = useState<SceneMode>('portal');
  const [themeColor, setThemeColor] = useState<ThemeColor>('coral');
  const [speed, setSpeed] = useState<number>(1.0);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [particleCount, setParticleCount] = useState<number>(2000);

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-amber-500/10 via-amber-100/30 to-transparent dark:from-zinc-950 dark:via-zinc-900/50 dark:to-zinc-950 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Title & Intro Badge */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 text-sm font-semibold shadow-sm backdrop-blur-md">
            <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
            <span>Trải nghiệm 3D Độc Đáo với Three.js & WebGL</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
            Khám Phá Thế Giới Truyện <br />
            <span className="bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
              Không Gian 3D Kỳ Diệu
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 font-medium">
            Tận hưởng thế giới câu chuyện AI được chuyển thể thành các mô hình không gian 3D tương tác sống động, hạt vũ trụ ma thuật và hiệu ứng WebGL thế hệ mới.
          </p>
        </div>

        {/* 3D Canvas Showcase Container */}
        <div className="relative w-full rounded-3xl p-2 md:p-4 bg-gradient-to-br from-amber-200/50 via-white/70 to-red-200/50 dark:from-zinc-800/40 dark:via-zinc-900/60 dark:to-zinc-800/40 border border-amber-300/60 dark:border-zinc-700/60 shadow-2xl backdrop-blur-xl">
          
          {/* Main 3D Canvas Component */}
          <ThreeStoryCanvas
            sceneMode={sceneMode}
            themeColor={themeColor}
            speed={speed}
            wireframe={wireframe}
            particleCount={particleCount}
          />

          {/* Floating Interactive Badge Overlays */}
          <div className="absolute top-6 left-6 hidden sm:flex items-center gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-amber-200/50 dark:border-zinc-700 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
              3D
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Chế độ đang xem</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase">{sceneMode}</p>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 hidden sm:flex items-center gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-amber-200/50 dark:border-zinc-700 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
              <Stars className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Chuyển động chuột</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Mouse Parallax 360°</p>
            </div>
          </div>

          {/* CTA overlay inside canvas */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-4 z-10 w-full px-4">
            <Link
              href="/create"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-red-500/25 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Wand2 className="w-5 h-5" />
              Tạo Truyện 3D Với AI
            </Link>
            <Link
              href="/explore"
              className="px-6 py-3.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-zinc-800 dark:text-white font-bold border border-zinc-200 dark:border-zinc-700 shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Compass className="w-5 h-5 text-amber-500" />
              Khám Phá Truyện
            </Link>
          </div>
        </div>

        {/* Live Controls Toolbar */}
        <ThreeDemoControls
          sceneMode={sceneMode}
          setSceneMode={setSceneMode}
          themeColor={themeColor}
          setThemeColor={setThemeColor}
          speed={speed}
          setSpeed={setSpeed}
          wireframe={wireframe}
          setWireframe={setWireframe}
          particleCount={particleCount}
          setParticleCount={setParticleCount}
        />

        {/* Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-amber-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Render 60 FPS</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Tối ưu mượt mà với WebGL & RequestAnimationFrame</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-amber-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Dọn Dẹp Bộ Nhớ</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Tự động Dispose Geometries & Textures khi unmount</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-amber-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Tương Tác Linh Hoạt</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Tùy biến bối cảnh 3D ngay trên giao diện Live</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
