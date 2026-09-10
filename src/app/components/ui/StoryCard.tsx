'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { StoryItem } from '../../types/home';
import { Play, BookOpen, Heart, Star, Headphones, Clock } from 'lucide-react';

interface StoryCardProps {
  story: StoryItem;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  const [isFav, setIsFav] = useState(story.isFavorite ?? false);

  return (
    <div className="group bg-surface-container-lowest dark:bg-[#0F1626] rounded-3xl p-3 border border-outline-variant/30 dark:border-[#283556] shadow-xs hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] hover:border-primary-container/50 dark:hover:border-amber-400/50 transition-all duration-300 flex flex-col h-full cursor-pointer">
      {/* Thumbnail Container */}
      <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-surface-container">
        <Image
          src={story.imageUrl}
          alt={story.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />

        {/* Duration Badge */}
        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-300" />
          <span>{story.duration}</span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFav(!isFav);
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface/80 dark:bg-black/60 backdrop-blur-md flex items-center justify-center text-on-surface-variant hover:text-primary-container hover:scale-115 active:scale-90 transition-all shadow-sm cursor-pointer z-10"
          aria-label="Add to favorites"
        >
          <Heart className={`w-4 h-4 transition-transform ${isFav ? 'fill-rose-500 text-rose-500 scale-110' : ''}`} />
        </button>
      </div>

      {/* Story Info */}
      <div className="flex flex-col flex-1 px-1">
        {/* Category / Creator Tag */}
        <span className={`self-start text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mb-2 ${story.tagColor}`}>
          {story.tag}
        </span>

        {/* Title */}
        <h3 className="heading-card text-base line-clamp-1 group-hover:text-primary-container dark:group-hover:text-amber-300 transition-colors mb-1.5">
          {story.title}
        </h3>

        {/* Description */}
        <p className="text-on-surface-variant text-xs line-clamp-2 mb-3 leading-relaxed opacity-80">
          {story.description}
        </p>

        {/* Meta info & Action */}
        <div className="mt-auto pt-2 border-t border-outline-variant/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 opacity-70" />
              {story.listens}
            </span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1 text-amber-500 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {story.rating}
            </span>
          </div>

          <button
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:scale-108 active:scale-95 cursor-pointer ${
              story.actionType === 'play'
                ? 'bg-tertiary-container hover:brightness-105 text-on-tertiary-container shadow-tertiary-container/20 hover:shadow-md'
                : 'bg-primary-container hover:brightness-105 text-on-primary-container shadow-primary-container/20 hover:shadow-md'
            }`}
          >
            {story.actionType === 'play' ? (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>{story.actionText}</span>
              </>
            ) : (
              <>
                <BookOpen className="w-3 h-3" />
                <span>{story.actionText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
