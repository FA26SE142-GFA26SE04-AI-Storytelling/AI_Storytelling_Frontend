'use client';

import React from 'react';
import { ChevronDown, Clock, Heart, Play, Sparkles, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { ExploreStoryItem } from '../../types/explore';

interface ExploreStoryGridProps {
  stories: ExploreStoryItem[];
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export const ExploreStoryGrid: React.FC<ExploreStoryGridProps> = ({
  stories,
  favorites,
  toggleFavorite,
  sortBy,
  setSortBy,
}) => {
  return (
    <section className="flex flex-col gap-5 pt-4">
      {/* Section Title & Sort Dropdown Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-3">
        <div className="flex flex-col">
          <h2 className="heading-section text-xl sm:text-2xl flex items-center gap-2">
            <span>Kho Truyện Cổ Tích Mới Cập Nhật</span>
          </h2>
          <p className="text-subtitle text-xs">
            Tất cả câu chuyện đều qua kiểm duyệt an toàn trẻ em trước khi đăng tải
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-on-surface-variant">Sắp xếp theo:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-on-surface cursor-pointer focus:outline-none focus:border-primary-container"
            >
              <option value="newest">Mới nhất phát hành 🍿</option>
              <option value="popular">Nhiều lượt nghe nhất 🔥</option>
              <option value="rating">Đánh giá cao nhất ⭐</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid of Story Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {(stories || []).map((story) => {
          const isFav = !!favorites[story.id];
          return (
            <div
              key={story.id}
              className="group relative bg-surface-container-lowest rounded-3xl border border-outline-variant/40 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Ambient Glow behind card */}
              <div className="radiant-glow-aura" />

              {/* Image Cover Container */}
              <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface-container">
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Top Left Tag */}
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 shadow-xs">
                  {story.categoryTag}
                </span>

                {/* Top Right Heart Favorite Button */}
                <button
                  onClick={() => toggleFavorite(story.id)}
                  className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer active:scale-90 ${
                    isFav
                      ? 'bg-rose-500 text-white border-rose-400'
                      : 'bg-black/40 text-white/80 border-white/20 hover:bg-black/60'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                </button>

                {/* Bottom Right Duration Badge */}
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{story.duration}</span>
                </span>
              </div>

              {/* Content Details Container */}
              <div className="p-4 flex flex-col gap-2.5 flex-1 justify-between">
                <div className="flex flex-col gap-2">
                  {/* Badge Info Pills */}
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded-md font-extrabold ${story.badgeColor}`}
                    >
                      {story.badgeText}
                    </span>
                    <div className="flex items-center gap-1 font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{story.rating}</span>
                      <span className="text-on-surface-variant/60 font-normal">
                        ({story.listens})
                      </span>
                    </div>
                  </div>

                  {/* Story Title */}
                  <h3 className="heading-card text-sm font-extrabold text-on-surface group-hover:text-primary-container transition-colors line-clamp-1 leading-snug">
                    {story.title}
                  </h3>

                  {/* Short Description */}
                  <p className="text-subtitle text-xs line-clamp-2 leading-relaxed">
                    {story.description}
                  </p>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/30 mt-1">
                  <button
                    className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    aria-label="Play audio snippet"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-rose-500" />
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs"
                  >
                    <span>{story.actionText}</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination / Load More Button */}
      <div className="flex flex-col items-center justify-center gap-2 mt-6">
        <Button
          variant="gold"
          size="lg"
          shimmer
          icon={<Sparkles className="w-4 h-4 fill-current" />}
          className="animate-float-subtle-1 hover:scale-105 transition-all"
        >
          <span>Tải thêm 20 câu chuyện mới</span>
          <span>🪄</span>
        </Button>

        <span className="text-[11px] font-semibold text-on-surface-variant/70">
          Trang 1 trên tổng số 125 trang truyện chọn lọc
        </span>
      </div>
    </section>
  );
};
