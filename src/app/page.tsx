import React from 'react';
import { HeroBanner } from './components/home/HeroBanner';
import { CategoryList } from './components/home/CategoryList';
import { AudioPlayerSection } from './components/home/AudioPlayerSection';
import { TrendingStories } from './components/home/TrendingStories';
import { ParentFeatureSection } from './components/home/ParentFeatureSection';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroBanner />
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 pb-12">
        <CategoryList />
        <AudioPlayerSection />
        <TrendingStories />
        <ParentFeatureSection />
      </div>
    </div>
  );
}
