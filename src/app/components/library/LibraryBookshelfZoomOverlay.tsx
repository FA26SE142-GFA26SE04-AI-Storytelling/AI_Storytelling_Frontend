'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Search,
  Star,
  Play,
  Pause,
  Volume2,
  Bookmark,
  Heart,
  ChevronRight,
  X,
  Layers,
  Sunrise,
  Sun,
  Moon,
  Grid,
  Maximize2,
  Award,
  Flame,
  Wand2,
  Headphones,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';
import { LibraryStoryItem } from '../../types/library';
import {
  LIBRARY_CREATED_STORIES,
  LIBRARY_FAVORITE_STORIES,
  TRENDING_STORIES,
  LIBRARY_BADGES,
  DAY_STREAKS
} from '../../constants/mockData';

export interface LibraryBookshelfZoomOverlayProps {
  currentStage: number;
  onStageChange: (stageIndex: number) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay) => void;
  onToggleViewMode?: () => void;
  is2DViewAvailable?: boolean;
}

export const LibraryBookshelfZoomOverlay: React.FC<LibraryBookshelfZoomOverlayProps> = ({
  currentStage,
  onStageChange,
  timeOfDay,
  onTimeOfDayChange,
  onToggleViewMode,
  is2DViewAvailable = true,
}) => {
  const [selectedShelf, setSelectedShelf] = useState<'all' | 'created' | 'favorites' | 'lullaby'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStory, setActiveStory] = useState<LibraryStoryItem | null>(LIBRARY_CREATED_STORIES[0]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(35);
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({
    'cr-1': true,
    'cr-2': true,
    'fav-1': true,
    'fav-2': true,
    'fav-3': true,
    'fav-4': true,
  });

  const toggleFavorite = (id: string) => {
    setFavoritesMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  type ExtendedStoryItem = LibraryStoryItem & { shelfTier: 'created' | 'favorites' | 'lullaby' };

  // Filter books according to shelf tab & search query
  const allStories: ExtendedStoryItem[] = [
    ...LIBRARY_CREATED_STORIES.map((s) => ({ ...s, shelfTier: 'created' as const })),
    ...LIBRARY_FAVORITE_STORIES.map((s) => ({ ...s, shelfTier: 'favorites' as const })),
    ...TRENDING_STORIES.map((s) => ({
      id: `tr-${s.id}`,
      badge: s.tag,
      badgeBg: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
      tag: `${s.duration} • ${s.listens} lượt nghe`,
      title: s.title,
      description: s.description,
      rating: s.rating,
      imageUrl: s.imageUrl,
      isFavorite: s.isFavorite,
      shelfTier: 'lullaby' as const,
    })),
  ];

  const filteredStories = allStories.filter((story) => {
    const matchesShelf =
      selectedShelf === 'all' ||
      (selectedShelf === 'created' && story.shelfTier === 'created') ||
      (selectedShelf === 'favorites' && story.shelfTier === 'favorites') ||
      (selectedShelf === 'lullaby' && story.shelfTier === 'lullaby');

    const matchesQuery =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesShelf && matchesQuery;
  });

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 overflow-hidden z-20 font-sans">
      {/* 1. TOP HEADER FLOATING GLASSBAR */}
      <div className="pointer-events-auto w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:px-5 sm:py-3.5 rounded-3xl bg-zinc-900/85 dark:bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-white animate-in fade-in-0 slide-in-from-top-4 duration-300">
        
        {/* Brand & Stage Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <button
            onClick={() => onStageChange(0)}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
            title="Quay lại góc nhìn toàn cảnh phòng 3D"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Toàn Cảnh</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <BookOpen className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base tracking-tight bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300 bg-clip-text text-transparent flex items-center gap-2">
                <span>Tủ Sách Diệu Kỳ Của Bé</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider hidden sm:inline-block">
                  Góc Nhìn 3D Zoom
                </span>
              </h1>
              <p className="text-[10px] text-zinc-400 font-medium">Bấm chọn sách trên kệ 3 tầng để đọc & nghe ngay</p>
            </div>
          </div>
        </div>

        {/* Center Search & Shelf Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm truyện trên kệ..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-0.5 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Atmosphere & View Mode Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Time of Day Switcher */}
          <div className="flex items-center p-1 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-[11px] font-extrabold">
            <button
              onClick={() => onTimeOfDayChange('morning')}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'morning' ? 'bg-sky-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Buổi Sáng"
            >
              <Sunrise className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('afternoon')}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'afternoon' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Buổi Chiều"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('night')}
              className={`p-1.5 sm:px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                timeOfDay === 'night' ? 'bg-indigo-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Buổi Tối"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle View Mode (3D vs 2D) */}
          {is2DViewAvailable && onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              title="Chuyển sang giao diện 2D chi tiết"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chế độ 2D</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN INTERACTIVE CONTENT AREA (FLOATING DRAWERS ON LEFT & RIGHT) */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4 my-2 overflow-hidden pointer-events-none">
        
        {/* LEFT DRAWER: 3-TIER BOOKSHELF STORY SELECTOR */}
        <div className="pointer-events-auto w-full lg:w-[420px] max-h-[50vh] lg:max-h-[75vh] flex flex-col rounded-3xl bg-zinc-900/90 dark:bg-zinc-950/95 backdrop-blur-xl border border-amber-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.6)] text-white overflow-hidden animate-in fade-in-0 slide-in-from-left-6 duration-400">
          
          {/* Shelf Tiers Tabs */}
          <div className="p-3 bg-zinc-950/90 border-b border-zinc-800/80 flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedShelf('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedShelf === 'all'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Tất Cả ({allStories.length})
            </button>
            <button
              onClick={() => setSelectedShelf('created')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                selectedShelf === 'created'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Tầng 1: Tự Tạo AI</span>
            </button>
            <button
              onClick={() => setSelectedShelf('favorites')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                selectedShelf === 'favorites'
                  ? 'bg-rose-500 text-white shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Tầng 2: Yêu Thích</span>
            </button>
            <button
              onClick={() => setSelectedShelf('lullaby')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                selectedShelf === 'lullaby'
                  ? 'bg-indigo-500 text-white shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Tầng 3: Ru Ngủ</span>
            </button>
          </div>

          {/* Stories List Scrollable Container */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-700">
            {filteredStories.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">
                <p>Không tìm thấy truyện nào khớp với từ khóa "{searchQuery}"</p>
              </div>
            ) : (
              filteredStories.map((story) => {
                const isSelected = activeStory?.id === story.id;
                const isFav = !!favoritesMap[story.id];

                return (
                  <div
                    key={story.id}
                    onClick={() => {
                      setActiveStory(story);
                      setIsPlayingAudio(false);
                    }}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-900 border-amber-400/80 shadow-md ring-1 ring-amber-400/50 scale-[1.01]'
                        : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    {/* Story Thumbnail */}
                    <div className="relative w-14 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-800 shadow-md">
                      <img
                        src={story.imageUrl}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[9px] font-bold text-amber-300">
                        {story.shelfTier === 'created' ? 'AI' : story.shelfTier === 'favorites' ? '★' : '🎵'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-zinc-800 border border-zinc-700 text-amber-300 truncate">
                          {story.badge}
                        </span>
                        {story.rating && (
                          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {story.rating}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-xs text-white truncate group-hover:text-amber-300 transition-colors">
                        {story.title}
                      </h3>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">{story.tag}</p>
                    </div>

                    {/* Favorite Star Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(story.id);
                      }}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isFav
                          ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                          : 'text-zinc-500 hover:text-white hover:bg-white/10'
                      }`}
                      title={isFav ? 'Đã yêu thích' : 'Thêm vào danh sách yêu thích'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400' : ''}`} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick AI Create Story CTA Bar */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              Sáng tạo thêm câu chuyện mới?
            </span>
            <button
              onClick={() => onStageChange(3)}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <span>Tạo Với AI</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT DRAWER: ACTIVE SELECTED BOOK PLAYER & DETAILS PREVIEW */}
        {activeStory && (
          <div className="pointer-events-auto w-full lg:w-[380px] rounded-3xl bg-zinc-900/90 dark:bg-zinc-950/95 backdrop-blur-xl border border-sky-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.6)] text-white p-4 sm:p-5 flex flex-col gap-4 animate-in fade-in-0 slide-in-from-right-6 duration-400">
            
            {/* Header: Book Cover & Badges */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-zinc-950 shadow-inner group">
              <img
                src={activeStory.imageUrl}
                alt={activeStory.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
              
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-black text-amber-300">
                  {activeStory.badge}
                </span>
                <button
                  onClick={() => toggleFavorite(activeStory.id)}
                  className={`p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                    favoritesMap[activeStory.id]
                      ? 'bg-rose-500 text-white shadow-lg'
                      : 'bg-black/60 text-white hover:bg-black/80'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${favoritesMap[activeStory.id] ? 'fill-white' : ''}`} />
                </button>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <h2 className="font-black text-base sm:text-lg text-white leading-snug drop-shadow-md">
                  {activeStory.title}
                </h2>
                <p className="text-[11px] text-amber-200/90 font-semibold mt-0.5">{activeStory.tag}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
              {activeStory.description}
            </p>

            {/* Interactive Audio Preview Player */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-950/50 via-zinc-950 to-zinc-950 border border-sky-500/30 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-white">Audio Ru Ngủ & Đọc Truyện</span>
                    <p className="text-[9px] text-zinc-400">Giọng đọc AI thủ thỉ ấm áp</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-zinc-950 flex items-center justify-center shadow-md shadow-sky-500/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4 fill-zinc-950" /> : <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />}
                </button>
              </div>

              {/* Progress Slider Bar */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[9px] font-mono text-zinc-400">01:45</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioProgress}
                  onChange={(e) => setAudioProgress(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <span className="text-[9px] font-mono text-zinc-400">08:00</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => alert(`Đang mở đọc truyện: ${activeStory.title}`)}
                className="py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 fill-zinc-950" />
                <span>Đọc Truyện Ngay</span>
              </button>

              <button
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Headphones className="w-4 h-4 text-sky-400" />
                <span>{isPlayingAudio ? 'Tạm Dừng Audio' : 'Nghe Audio'}</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 3. BOTTOM FOOTER BAR: STREAK & BADGES QUICK PREVIEW */}
      <div className="pointer-events-auto w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/80 dark:bg-zinc-950/85 backdrop-blur-md border border-white/10 text-white animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
        
        {/* Day Streak */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-bounce" />
            <span>Thử Thách 7 Ngày:</span>
          </div>

          <div className="flex items-center gap-1">
            {DAY_STREAKS.map((stk, idx) => (
              <div
                key={idx}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 ${
                  stk.isCompleted
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                    : stk.isCurrent
                    ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 animate-pulse'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                <span>{stk.day}</span>
                {stk.isCompleted && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
              </div>
            ))}
          </div>
        </div>

        {/* Badges Preview */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <Award className="w-4 h-4 text-rose-400" />
          <span className="font-extrabold text-zinc-300">Huy hiệu:</span>
          <div className="flex items-center gap-1.5">
            {LIBRARY_BADGES.map((bdg) => (
              <span
                key={bdg.id}
                className="px-2 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-300 flex items-center gap-1"
              >
                <span>{bdg.icon}</span>
                <span>{bdg.title}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
