'use client';

import React from 'react';
import { Wand2, Heart, Headphones, Star, ChevronRight, Sparkles } from 'lucide-react';
import { LibraryStoryItem } from '../../types/library';

export type ExtendedStoryItem = LibraryStoryItem & { shelfTier: 'created' | 'favorites' | 'lullaby' };

export interface StoryListDrawerProps {
  stories: ExtendedStoryItem[];
  selectedShelf: 'all' | 'created' | 'favorites' | 'lullaby';
  onShelfSelect: (shelf: 'all' | 'created' | 'favorites' | 'lullaby') => void;
  activeStoryId?: string;
  onStorySelect: (story: ExtendedStoryItem) => void;
  favoritesMap: Record<string, boolean>;
  onToggleFavorite: (id: string) => void;
  onGoToCreateAI: () => void;
  searchQuery?: string;
}

export const StoryListDrawer: React.FC<StoryListDrawerProps> = ({
  stories,
  selectedShelf,
  onShelfSelect,
  activeStoryId,
  onStorySelect,
  favoritesMap,
  onToggleFavorite,
  onGoToCreateAI,
  searchQuery = '',
}) => {
  return (
    <div className="bookshelf-left-drawer pointer-events-auto w-full lg:w-[390px] max-h-[50vh] lg:max-h-[72vh] flex flex-col rounded-3xl bg-tod-surface/90 backdrop-blur-2xl border border-tod-border shadow-2xl text-tod-text overflow-hidden transition-colors duration-500">
      {/* 1. Shelf Tier Tabs */}
      <div className="p-2.5 bg-tod-card/90 border-b border-tod-border flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => onShelfSelect('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedShelf === 'all'
              ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
              : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
          }`}
        >
          Tất Cả ({stories.length})
        </button>
        <button
          onClick={() => onShelfSelect('created')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
            selectedShelf === 'created'
              ? 'bg-emerald-500 text-white shadow-md font-black'
              : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Tự Tạo AI</span>
        </button>
        <button
          onClick={() => onShelfSelect('favorites')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
            selectedShelf === 'favorites'
              ? 'bg-rose-500 text-white shadow-md font-black'
              : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
          }`}
        >
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>Yêu Thích</span>
        </button>
        <button
          onClick={() => onShelfSelect('lullaby')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
            selectedShelf === 'lullaby'
              ? 'bg-indigo-500 text-white shadow-md font-black'
              : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>Ru Ngủ</span>
        </button>
      </div>

      {/* 2. Scrollable Stories List */}
      <div className="flex-1 p-2.5 overflow-y-auto space-y-2 dashboard-scrollbar">
        {stories.length === 0 ? (
          <div className="py-8 text-center text-tod-text-muted text-xs">
            <p>Không tìm thấy truyện nào khớp với từ khóa "{searchQuery}"</p>
          </div>
        ) : (
          stories.map((story) => {
            const isSelected = activeStoryId === story.id;
            const isFav = !!favoritesMap[story.id];

            return (
              <div
                key={story.id}
                onClick={() => onStorySelect(story)}
                className={`bookshelf-story-card p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-400/50 scale-[1.01]'
                    : 'bg-tod-card/80 hover:bg-tod-surface border-tod-border text-tod-text'
                }`}
              >
                {/* Story Thumbnail */}
                <div className="relative w-13 h-15 rounded-xl overflow-hidden shrink-0 bg-tod-surface shadow-md">
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[8px] font-black text-amber-300">
                    {story.shelfTier === 'created' ? 'AI' : story.shelfTier === 'favorites' ? '★' : '🎵'}
                  </span>
                </div>

                {/* Story Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-tod-surface border border-tod-border text-amber-600 dark:text-amber-300 truncate">
                      {story.badge}
                    </span>
                    {story.rating && (
                      <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        {story.rating}
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-xs text-tod-text truncate">
                    {story.title}
                  </h3>
                  <p className="text-[10px] text-tod-text-muted truncate mt-0.5">{story.tag}</p>
                </div>

                {/* Heart Favorite Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(story.id);
                  }}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isFav
                      ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
                      : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-card'
                  }`}
                  title={isFav ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 3. AI Creator CTA Bar */}
      <div className="p-2.5 bg-tod-card/90 border-t border-tod-border flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-tod-text-muted flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          Sáng tạo câu chuyện mới?
        </span>
        <button
          onClick={onGoToCreateAI}
          className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span>Tạo Cùng AI</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
