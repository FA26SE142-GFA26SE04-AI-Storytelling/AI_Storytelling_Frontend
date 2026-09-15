'use client';

import React, { useState } from 'react';
import { RoomCanvas, TimeOfDay } from '../../components/three/RoomCanvas';
import { getVietnamTimeOfDay } from '../../components/three/room/stages';
import { LibraryBookshelfZoomOverlay } from '../../components/library/LibraryBookshelfZoomOverlay';
import { LibraryHeroBanner } from '../../components/library/LibraryHeroBanner';
import { LibraryFilterToolbar } from '../../components/library/LibraryFilterToolbar';
import { LibraryResumeBanner } from '../../components/library/LibraryResumeBanner';
import { LibraryAiCreatedSection } from '../../components/library/LibraryAiCreatedSection';
import { LibraryLullabySection } from '../../components/library/LibraryLullabySection';
import { LibraryStreakAndBadges } from '../../components/library/LibraryStreakAndBadges';
import {
  LIBRARY_CREATED_STORIES,
  LIBRARY_FAVORITE_STORIES,
  LIBRARY_BADGES,
  DAY_STREAKS
} from '../../constants/mockData';
import { Box, Grid, Sparkles, BookOpen, Layers } from 'lucide-react';

export const LibraryView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'3d-bookshelf' | '2d-grid'>('3d-bookshelf');
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(2); // Default Stage 2 = Bookshelf Stage
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getVietnamTimeOfDay);
  const [activeTab, setActiveTab] = useState<'all' | 'reading' | 'created'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    'cr-1': true,
    'cr-2': true,
    'fav-1': true,
    'fav-2': true,
    'fav-3': true,
    'fav-4': true,
  });

  const toggleFav = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // IF 3D BOOKSHELF ZOOM VIEW MODE IS ACTIVE:
  if (viewMode === '3d-bookshelf') {
    return (
      <div className="relative w-screen h-screen overflow-hidden select-none bg-zinc-950">
        {/* Fullscreen 3D Room Canvas Focused on Bookshelf (Stage 2) */}
        <RoomCanvas
          currentStageIndex={currentStageIndex}
          onStageChange={(idx) => {
            setCurrentStageIndex(idx);
          }}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
        />

        {/* Floating Glassmorphic Bookshelf Zoom Overlay */}
        <LibraryBookshelfZoomOverlay
          currentStage={currentStageIndex}
          onStageChange={setCurrentStageIndex}
          timeOfDay={timeOfDay}
          onTimeOfDayChange={setTimeOfDay}
          onToggleViewMode={() => setViewMode('2d-grid')}
          is2DViewAvailable={true}
        />
      </div>
    );
  }

  // IF 2D DETAILED DASHBOARD VIEW MODE IS ACTIVE:
  return (
    <div className="min-h-screen w-full bg-background text-on-background transition-colors duration-300 py-6 px-3 sm:px-6 lg:px-8 flex flex-col gap-8 max-w-7xl mx-auto">
      
      {/* 3D BOOKSHELF PROMOTIONAL BANNER CTA */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-zinc-950 font-black shadow-md shrink-0">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-on-surface flex items-center justify-center sm:justify-start gap-2">
              <span>Khám Phá Tủ Sách Diệu Kỳ 3D</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-black uppercase">
                Góc Nhìn Zoom 3D
              </span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Tương tác trực tiếp trên kệ sách 3D 3 tầng, nghe audio ru ngủ và xem bìa truyện sống động.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setCurrentStageIndex(2);
            setViewMode('3d-bookshelf');
          }}
          className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 fill-zinc-950" />
          <span>Zoom Vào Tủ Sách 3D</span>
        </button>
      </div>

      {/* 1. HERO USER HEADER & STATS CARDS BANNER */}
      <LibraryHeroBanner />

      {/* 2. SECONDARY FILTER & SEARCH TOOLBAR */}
      <LibraryFilterToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* 3. FEATURED RESUME BANNER ("TIẾP TỤC CUỘC PHIÊU LƯU") */}
      <LibraryResumeBanner
        favorites={favorites}
        toggleFav={toggleFav}
      />

      {/* 4. SECTION: "TÁC PHẨM BÉ ĐÃ SÁNG TẠO CÙNG AI" */}
      <LibraryAiCreatedSection
        createdStories={LIBRARY_CREATED_STORIES}
        favorites={favorites}
        toggleFav={toggleFav}
      />

      {/* 5. SECTION: "BỘ SƯU TẬP YÊU THÍCH & RU NGỦ" */}
      <LibraryLullabySection
        favoriteStories={LIBRARY_FAVORITE_STORIES}
        favorites={favorites}
        toggleFav={toggleFav}
      />

      {/* 6. SECTION: "THỬ THÁCH 7 NGÀY ĐỌC TRUYỆN & BỘ HUY HIỆU CỦA BÉ" */}
      <LibraryStreakAndBadges
        dayStreaks={DAY_STREAKS}
        badges={LIBRARY_BADGES}
      />
    </div>
  );
};
