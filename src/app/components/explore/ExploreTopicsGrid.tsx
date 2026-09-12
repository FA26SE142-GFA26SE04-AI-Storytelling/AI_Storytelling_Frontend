'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { FeaturedTopic } from '../../types/explore';

interface ExploreTopicsGridProps {
  topics: FeaturedTopic[];
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
}

export const ExploreTopicsGrid: React.FC<ExploreTopicsGridProps> = ({
  topics,
  selectedCategory,
  setSelectedCategory,
}) => {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2 badge-eyebrow-label text-on-surface-variant">
        <span>👤</span>
        <span>CHỦ ĐỀ & THỂ LOẠI YÊU THÍCH</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {(topics || []).map((topic) => {
          const isSelected = selectedCategory === topic.id;
          return (
            <div
              key={topic.id}
              onClick={() => setSelectedCategory(isSelected ? null : topic.id)}
              className={`group relative bg-surface-container-lowest rounded-2xl p-4 border transition-all cursor-pointer flex flex-col gap-2.5 shadow-2xs hover:shadow-md ${
                topic.cardBorder
              } ${topic.hoverBg} ${
                isSelected ? 'ring-2 ring-primary-container bg-primary-container/5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform ${topic.colorBg}`}
                >
                  {topic.icon}
                </div>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-primary-container text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <h3 className="heading-3 text-xs sm:text-sm font-extrabold text-on-surface group-hover:text-primary-container transition-colors line-clamp-1">
                  {topic.title}
                </h3>
                <span className="text-[11px] font-semibold text-on-surface-variant/70">
                  {topic.count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
