'use client';

import React, { useState } from 'react';
import { ExploreHeroHeader } from '../../components/explore/ExploreHeroHeader';
import { ExploreAgeFilter } from '../../components/explore/ExploreAgeFilter';
import { ExploreTopicsGrid } from '../../components/explore/ExploreTopicsGrid';
import { ExploreFilterToolbar } from '../../components/explore/ExploreFilterToolbar';
import { ExploreCuratedShowcase } from '../../components/explore/ExploreCuratedShowcase';
import { ExploreStoryGrid } from '../../components/explore/ExploreStoryGrid';
import { ExploreSafetyBanner } from '../../components/explore/ExploreSafetyBanner';
import { FEATURED_TOPICS, SHOWCASE_COLLECTIONS, EXPLORE_STORY_LIST } from '../../constants/mockData';

export const ExploreView: React.FC = () => {
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasInteractive, setHasInteractive] = useState<boolean>(false);
  const [hasLullabyMusic, setHasLullabyMusic] = useState<boolean>(false);
  const [durationFilter, setDurationFilter] = useState<string>('all');
  const [voiceFilter, setVoiceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const quickTags = [
    { label: 'Lừa đảo học đường', icon: '🪄' },
    { label: 'Khủng long dũng cảm', icon: '🦖' },
    { label: 'Bí mật đại dương', icon: '🌊' },
    { label: 'Truyện ru ngủ êm đềm', icon: '📜' },
    { label: 'Khám phá sao Hỏa', icon: '🚀' },
  ];

  const ageOptions = [
    { id: 'all', label: 'Tất cả độ tuổi', icon: '' },
    { id: '2-4', label: '2 - 4 tuổi (Mầm non)', icon: '👶' },
    { id: '5-7', label: '5 - 7 tuổi (Khám phá)', icon: '🎒' },
    { id: '8-10', label: '8 - 10 tuổi (Tư duy)', icon: '🦁' },
    { id: '11+', label: '11+ tuổi', icon: '🎓' },
  ];

  return (
    <div className="min-h-screen w-full bg-background text-on-background transition-colors duration-300 py-6 px-3 sm:px-6 lg:px-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* 1. HERO TREASURY HEADER & SEARCH SECTION */}
      <ExploreHeroHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        quickTags={quickTags}
      />

      {/* 2. AGE FILTER TOOLBAR */}
      <ExploreAgeFilter
        selectedAge={selectedAge}
        setSelectedAge={setSelectedAge}
        ageOptions={ageOptions}
      />

      {/* 3. FAVORITE TOPICS & GENRES GRID */}
      <ExploreTopicsGrid
        topics={FEATURED_TOPICS}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* 4. SECONDARY TOOLBAR FILTERS */}
      <ExploreFilterToolbar
        durationFilter={durationFilter}
        setDurationFilter={setDurationFilter}
        voiceFilter={voiceFilter}
        setVoiceFilter={setVoiceFilter}
        hasInteractive={hasInteractive}
        setHasInteractive={setHasInteractive}
        hasLullabyMusic={hasLullabyMusic}
        setHasLullabyMusic={setHasLullabyMusic}
      />

      {/* 5. CURATED SHOWCASE COLLECTIONS */}
      <ExploreCuratedShowcase collections={SHOWCASE_COLLECTIONS} />

      {/* 6. UPDATED STORY LIBRARY GRID */}
      <ExploreStoryGrid
        stories={EXPLORE_STORY_LIST}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* 7. COPPA CHILD SAFETY BANNER */}
      <ExploreSafetyBanner />
    </div>
  );
};
