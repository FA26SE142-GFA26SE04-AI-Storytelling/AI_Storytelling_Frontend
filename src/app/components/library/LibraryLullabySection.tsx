'use client';

import React from 'react';
import { Heart, Play, Star } from 'lucide-react';
import { Button } from '../ui/Button';

import { LibraryStoryItem } from '../../types/library';

interface LibraryLullabySectionProps {
  favoriteStories: LibraryStoryItem[];
  favorites: Record<string, boolean>;
  toggleFav: (id: string) => void;
}

export const LibraryLullabySection: React.FC<LibraryLullabySectionProps> = ({
  favoriteStories,
  favorites,
  toggleFav,
}) => {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col">
        <h2 className="heading-section text-lg sm:text-xl flex items-center gap-2">
          <span className="text-indigo-500">🌙</span>
          <span>Bộ Sưu Tập Yêu Thích & Ru Ngủ</span>
        </h2>
        <p className="text-subtitle text-xs">
          Âm thanh dịu êm, sóng Alpha và bài học nhẹ nhàng cho giấc mơ đẹp
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {(favoriteStories || []).map((story) => {
          const isFav = !!favorites[story.id];
          return (
            <div
              key={story.id}
              className="group relative bg-surface-container-lowest dark:bg-[#0F1626] rounded-3xl border border-outline-variant/40 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Image Cover Container */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface-container">
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Left Badge */}
                  <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 shadow-xs ${story.badgeBg}`}>
                    {story.badge}
                  </span>

                  {/* Top Right Heart */}
                  <button
                    onClick={() => toggleFav(story.id)}
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer active:scale-90 ${
                      isFav
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-black/40 text-white/80 border-white/20 hover:bg-black/60'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                  </button>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-500 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{story.rating}</span>
                    </span>
                    <span className="font-semibold text-on-surface-variant/70">
                      {story.tag}
                    </span>
                  </div>

                  <h3 className="heading-card text-sm font-extrabold text-on-surface group-hover:text-primary-container transition-colors line-clamp-1">
                    {story.title}
                  </h3>

                  <p className="text-subtitle text-xs line-clamp-2 leading-relaxed">
                    {story.description}
                  </p>
                </div>
              </div>

              {/* Footer Action */}
              <div className="p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full text-xs py-2 justify-center font-bold">
                  <Play className="w-3.5 h-3.5 fill-current mr-1 text-rose-500" />
                  <span>Nghe ngay</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
