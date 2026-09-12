'use client';

import React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';

export interface WorldOption {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  badge: string;
  gradient: string;
}

interface WorldSelectorProps {
  worlds: WorldOption[];
  selectedWorld: string;
  setSelectedWorld: (id: string) => void;
}

export const WorldSelector: React.FC<WorldSelectorProps> = ({
  worlds,
  selectedWorld,
  setSelectedWorld,
}) => {
  return (
    <div className="relative group">
      {/* Glowing Blur Backdrop Layer */}
      <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 blur-xl opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none" />

      <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-outline-variant/40 shadow-xs space-y-4 overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 flex items-center justify-center text-xs font-extrabold">
              2
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-on-surface">
              Thế Giới Diệu Kỳ (Bối Cảnh)
            </h2>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/50">
            Bé chọn 1 nơi
          </span>
        </div>

        {/* Environment Cards Grid (4 items) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {worlds.map((world) => {
            const isSelected = selectedWorld === world.id;
            return (
              <div
                key={world.id}
                onClick={() => setSelectedWorld(world.id)}
                className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer group ${
                  isSelected
                    ? 'bg-surface-bright dark:bg-[#181B25] border-rose-500 ring-2 ring-rose-500/30 shadow-md scale-[1.01]'
                    : 'bg-surface-container-low/30 dark:bg-[#181B25]/40 border-outline-variant/30 hover:border-outline-variant hover:bg-surface-bright'
                }`}
              >
                <div className="relative w-full h-28 overflow-hidden">
                  <Image
                    src={world.imageUrl}
                    alt={world.name}
                    fill
                    className="object-cover group-hover:scale-108 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                    {world.badge}
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Đã chọn</span>
                    </div>
                  )}
                </div>

                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-extrabold text-sm text-on-surface group-hover:text-primary-container transition-colors mb-1">
                    {world.name}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant opacity-80 leading-relaxed line-clamp-2">
                    {world.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
