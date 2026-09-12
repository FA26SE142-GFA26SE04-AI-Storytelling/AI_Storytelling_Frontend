'use client';

import React, { useState } from 'react';
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

export const LibraryView: React.FC = () => {
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

  return (
    <div className="min-h-screen w-full bg-background text-on-background transition-colors duration-300 py-6 px-3 sm:px-6 lg:px-8 flex flex-col gap-8 max-w-7xl mx-auto">
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
