'use client';

import React from 'react';
import { SceneMode, ThemeColor } from './ThreeStoryCanvas';
import { Sparkles, Eye, Zap, Palette, Layers } from 'lucide-react';

interface ThreeDemoControlsProps {
  sceneMode: SceneMode;
  setSceneMode: (mode: SceneMode) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  wireframe: boolean;
  setWireframe: (wireframe: boolean) => void;
  particleCount: number;
  setParticleCount: (count: number) => void;
}

const MODES: { id: SceneMode; label: string; icon: string }[] = [
  { id: 'portal', label: 'Cổng Kỳ Diệu', icon: '🌀' },
  { id: 'cosmos', label: 'Vũ Trụ Tinh Tú', icon: '✨' },
  { id: 'orbs', label: 'Hành Tinh Truyện', icon: '🪐' },
];

const THEMES: { id: ThemeColor; name: string; bgClass: string; borderClass: string }[] = [
  { id: 'coral', name: 'Rực Rỡ (Coral)', bgClass: 'bg-red-500', borderClass: 'border-red-400' },
  { id: 'gold', name: 'Mật Nắng (Gold)', bgClass: 'bg-amber-500', borderClass: 'border-amber-400' },
  { id: 'mint', name: 'Xanh Ngọc (Mint)', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-400' },
  { id: 'purple', name: 'Huyền Biển (Purple)', bgClass: 'bg-purple-500', borderClass: 'border-purple-400' },
];

export const ThreeDemoControls: React.FC<ThreeDemoControlsProps> = ({
  sceneMode,
  setSceneMode,
  themeColor,
  setThemeColor,
  speed,
  setSpeed,
  wireframe,
  setWireframe,
  particleCount,
  setParticleCount,
}) => {
  return (
    <div className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-amber-200/60 dark:border-zinc-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-amber-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
            Bảng Bối Cảnh 3D (Three.js Live Controls)
          </h3>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300">
          WebGL 3D Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Mode Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-500" /> Mô Hình 3D
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSceneMode(mode.id)}
                className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all flex flex-col items-center gap-1 ${
                  sceneMode === mode.id
                    ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-300 shadow-sm font-bold scale-[1.02]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span className="text-base">{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Color Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-amber-500" /> Phối Màu Ánh Sáng
          </label>
          <div className="flex items-center gap-2.5 pt-1">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setThemeColor(theme.id)}
                title={theme.name}
                className={`w-9 h-9 rounded-full ${theme.bgClass} transition-all transform hover:scale-110 flex items-center justify-center ${
                  themeColor === theme.id
                    ? 'ring-4 ring-amber-400/50 dark:ring-amber-500/50 scale-110 shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {themeColor === theme.id && <span className="w-2 h-2 rounded-full bg-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Rotation Speed */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" /> Tốc Độ Xoay: <span className="text-amber-600 dark:text-amber-400 font-bold">{speed}x</span>
          </label>
          <div className="flex items-center gap-2 pt-1">
            {[0.5, 1.0, 2.0, 3.5].map((val) => (
              <button
                key={val}
                onClick={() => setSpeed(val)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  speed === val
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                    : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {val}x
              </button>
            ))}
          </div>
        </div>

        {/* Wireframe & Particle Density */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-amber-500" /> Khung Xương & Hạt
          </label>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setWireframe(!wireframe)}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                wireframe
                  ? 'bg-red-500 text-white border-red-500 shadow-md'
                  : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {wireframe ? 'Wireframe: ON' : 'Wireframe: OFF'}
            </button>
            <button
              onClick={() => setParticleCount(particleCount === 2000 ? 4000 : particleCount === 4000 ? 1000 : 2000)}
              className="py-2 px-3 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              ✨ {particleCount} Hạt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
