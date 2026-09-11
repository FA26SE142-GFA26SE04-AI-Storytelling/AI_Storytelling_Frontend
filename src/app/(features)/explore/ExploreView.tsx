'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  Heart,
  Star,
  Play,
  Clock,
  ArrowRight,
  ChevronDown,
  Moon,
  Gamepad2,
  Check
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
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
      
      {/* -------------------------------------------------------------------------- */}
      {/* 1. HERO TREASURY HEADER & SEARCH SECTION */}
      {/* -------------------------------------------------------------------------- */}
      <section className="relative w-full rounded-3xl hero-animated-bg border border-outline-variant/40 p-6 sm:p-10 shadow-lg overflow-hidden flex flex-col gap-6 transition-colors duration-300">
        {/* Background Glowing Blobs */}
        <div
          className="absolute -top-12 -left-12 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-35 dark:opacity-25 animate-float-blob-1"
          style={{ background: 'var(--badge-gradient-1)' }}
        />
        <div
          className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-35 dark:opacity-25 animate-float-blob-2"
          style={{ background: 'var(--badge-gradient-2)' }}
        />

        {/* Magical Twinkling Stardust Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-6 left-[10%] animate-twinkle-1 drop-shadow-xs" style={{ color: 'var(--badge-gradient-1)' }}>
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div className="absolute top-1/3 left-[40%] animate-twinkle-2 drop-shadow-xs" style={{ color: 'var(--badge-gradient-2)' }}>
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div className="absolute bottom-10 left-[22%] animate-twinkle-3 drop-shadow-xs" style={{ color: 'var(--badge-gradient-3)' }}>
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div className="absolute top-8 right-[15%] animate-twinkle-2 drop-shadow-xs" style={{ color: 'var(--badge-gradient-1)' }}>
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div className="absolute bottom-6 right-[28%] animate-twinkle-1 drop-shadow-xs" style={{ color: 'var(--badge-gradient-3)' }}>
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Main Title & Subtitle */}
          <div className="flex flex-col gap-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/30 border border-secondary-container/50 text-on-secondary-container dark:text-amber-300 text-xs font-extrabold w-fit shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-400" />
              <span>⚡ KHO TÀNG 5.000+ CÂU CHUYỆN DIỆU KỲ</span>
            </div>

            <h1 className="heading-hero text-on-surface">
              Khám phá Kho Tàng Truyện Cổ Tích & Khoa Học Diệu Kỳ
            </h1>

            <p className="text-subtitle">
              Hơn 5.000+ câu chuyện được tạo bởi AI và đội ngũ chuyên gia tâm lý thiếu nhi, giúp bồi đắp tâm hồn, nuôi dưỡng lòng nhân ái và kích hoạt trí tưởng tượng vô tận của bé.
            </p>
          </div>

          {/* Top Right Floating Expert Verification Card */}
          <div className="relative group shrink-0 max-w-xs">
            <div className="radiant-glow-aura" />
            <div className="relative z-10 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/50 p-4 rounded-2xl shadow-md flex items-center gap-3.5 group hover:border-primary-container/60 transition-all">
              <div className="w-11 h-11 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl shrink-0 group-hover:scale-110 transition-transform">
                🧠
              </div>
              <div className="flex flex-col">
                <span className="badge-eyebrow-label text-amber-600 dark:text-amber-400">
                  Được kiểm duyệt bởi
                </span>
                <span className="text-xs font-bold text-on-surface leading-snug">
                  Chuyên gia tâm lý mầm non & sư phạm thiếu nhi
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Big Search Bar Input */}
        <div className="relative z-10 w-full mt-2 group">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="relative flex items-center w-full rounded-2xl bg-surface-container-lowest border-2 border-outline-variant/60 focus-within:border-primary-container shadow-md p-1.5 transition-all"
          >
            <Search className="w-5 h-5 ml-3 text-on-surface-variant/60 shrink-0 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên truyện, nhân vật (chú gấu, phi hành gia, rùa con...)"
              className="w-full bg-transparent px-3 py-2 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Search className="w-4 h-4" />}
            >
              Tìm kiếm phép thuật
            </Button>
          </form>

          {/* Quick Suggestion Tags */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-1 text-xs">
            <span className="badge-eyebrow-label text-on-surface-variant/80 flex items-center gap-1">
              <span>🪄</span> Gợi ý cho bé:
            </span>
            {quickTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(tag.label)}
                className="px-3 py-1 rounded-full bg-surface-container/70 hover:bg-primary-container/20 hover:text-primary-container border border-outline-variant/30 text-on-surface-variant text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>{tag.icon}</span>
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* 2. AGE FILTER TOOLBAR (CHỌN LỨA TUỔI CỦA BÉ) */}
      {/* -------------------------------------------------------------------------- */}
      <section className="w-full bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant/40 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-on-surface shrink-0">
          <span className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-lg">
            👶
          </span>
          <span>Chọn lứa tuổi của bé:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {ageOptions.map((opt) => {
            const isSelected = selectedAge === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedAge(opt.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  isSelected
                    ? 'bg-primary-container text-on-primary-container shadow-md scale-102 ring-2 ring-primary-container/30'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30'
                }`}
              >
                {opt.icon && <span>{opt.icon}</span>}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* 3. FAVORITE TOPICS & GENRES GRID (CHỦ ĐỀ & THỂ LOẠI YÊU THÍCH) */}
      {/* -------------------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 badge-eyebrow-label text-on-surface-variant">
          <span>👤</span>
          <span>CHỦ ĐỀ & THỂ LOẠI YÊU THÍCH</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {(FEATURED_TOPICS || []).map((topic) => {
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

      {/* -------------------------------------------------------------------------- */}
      {/* 4. SECONDARY TOOLBAR FILTERS (DURATION, VOICE, INTERACTIVE, SLEEP MODE, COUNT) */}
      {/* -------------------------------------------------------------------------- */}
      <section className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-outline-variant/30 text-xs">
        {/* Left Filter Dropdowns & Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Duration Selector */}
          <div className="relative">
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="appearance-none bg-surface-container border border-outline-variant/40 rounded-full px-3.5 py-1.5 pr-8 font-semibold text-on-surface cursor-pointer focus:outline-none focus:border-primary-container"
            >
              <option value="all">⏱️ Thời lượng: Mọi thời lượng</option>
              <option value="short">Dưới 5 phút</option>
              <option value="medium">5 - 10 phút</option>
              <option value="long">Trên 10 phút</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Voice Selector */}
          <div className="relative">
            <select
              value={voiceFilter}
              onChange={(e) => setVoiceFilter(e.target.value)}
              className="appearance-none bg-surface-container border border-outline-variant/40 rounded-full px-3.5 py-1.5 pr-8 font-semibold text-on-surface cursor-pointer focus:outline-none focus:border-primary-container"
            >
              <option value="all">🎙️ Giọng đọc: Tất cả giọng đọc</option>
              <option value="north">Giọng miền Bắc</option>
              <option value="south">Giọng miền Nam</option>
              <option value="warm">Giọng đọc truyền cảm</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Interactive Checkbox Pill */}
          <button
            onClick={() => setHasInteractive(!hasInteractive)}
            className={`px-3.5 py-1.5 rounded-full font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              hasInteractive
                ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                : 'bg-surface-container border-outline-variant/40 text-on-surface-variant'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Có ô mảnh tương tác</span>
          </button>

          {/* Lullaby Music Checkbox Pill */}
          <button
            onClick={() => setHasLullabyMusic(!hasLullabyMusic)}
            className={`px-3.5 py-1.5 rounded-full font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              hasLullabyMusic
                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
                : 'bg-surface-container border-outline-variant/40 text-on-surface-variant'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Có nhạc sóng ru ngủ</span>
          </button>
        </div>

        {/* Right Story Count Status */}
        <div className="text-on-surface-variant text-[11px] sm:text-xs font-semibold">
          Đang hiển thị <span className="font-black text-on-surface">36</span> trên{' '}
          <span className="font-black text-on-surface">5.620</span> câu chuyện
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* 5. CURATED SHOWCASE COLLECTIONS (TUYỂN TẬP ĐẶC SẮC ĐƯỢC YÊU THÍCH NHẤT) */}
      {/* -------------------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="heading-section text-lg sm:text-xl flex items-center gap-2">
            <span className="text-amber-500">🌟</span>
            <span>Tuyển Tập Đặc Sắc Được Yêu Thích Nhất</span>
          </h2>
          <Link
            href="#"
            className="text-xs font-bold text-primary-container hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả bộ sưu tập</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(SHOWCASE_COLLECTIONS || []).map((card) => (
            <div
              key={card.id}
              className={`relative rounded-3xl bg-gradient-to-br ${card.cardBg} border ${card.accentBorder} p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4 group hover:shadow-md transition-all`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${card.badgeBg}`}
                  >
                    {card.tag}
                  </span>
                  <span className="text-[11px] font-bold text-on-surface-variant/70">
                    {card.count}
                  </span>
                </div>

                <h3 className="heading-card text-base sm:text-lg group-hover:text-primary-container transition-colors leading-snug">
                  {card.title}
                </h3>

                <p className="text-subtitle text-xs leading-relaxed line-clamp-3">
                  {card.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30 mt-1">
                {/* Age badges */}
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-on-surface-variant">
                  <span>Dành cho:</span>
                  {card.ages.map((a) => (
                    <span
                      key={a}
                      className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/40"
                    >
                      {a}
                    </span>
                  ))}
                  <span>tuổi</span>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  className="font-bold text-xs"
                >
                  Khám phá ngay
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* 6. UPDATED STORY LIBRARY GRID (KHO TRUYỆN CỔ TÍCH MỚI CẬP NHẬT) */}
      {/* -------------------------------------------------------------------------- */}
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

        {/* Grid of 8 Story Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(EXPLORE_STORY_LIST || []).map((story) => {
            const isFav = !!favorites[story.id];
            return (
              <div
                key={story.id}
                className="group relative bg-surface-container-lowest rounded-3xl border border-outline-variant/40 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
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
                    <button className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center shrink-0 transition-colors cursor-pointer" aria-label="Play audio snippet">
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

        {/* -------------------------------------------------------------------------- */}
        {/* 7. PAGINATION / LOAD MORE BUTTON */}
        {/* -------------------------------------------------------------------------- */}
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

      {/* -------------------------------------------------------------------------- */}
      {/* 8. SECURITY & SAFETY BANNER (COPPA CHILD SAFETY) */}
      {/* -------------------------------------------------------------------------- */}
      <section className="w-full rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-surface-container-lowest border border-emerald-500/30 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shrink-0">
            🛡️
          </div>
          <div className="flex flex-col gap-1 max-w-2xl">
            <span className="badge-eyebrow-label text-emerald-600 dark:text-emerald-400">
              📍 TIÊU CHUẨN AN TOÀN TRẺ EM COPPA & NGUYÊN TẮC GIÁO DỤC TÍCH CỰC
            </span>
            <h3 className="heading-card text-base sm:text-lg">
              Cam kết 100% An Toàn & Lành Mạnh Cho Tuổi Thơ Của Bé
            </h3>
            <p className="text-subtitle text-xs leading-relaxed">
              Toàn bộ nội dung và hình ảnh đều trải qua 3 lớp kiểm duyệt nghiêm ngặt: Lớp bộ lọc AI tự động loại bỏ tạp chất, Lớp chuyên gia tâm lý nhi khoa và Lớp cài đặt phụ huynh quản lý trực tiếp.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="md"
          className="shrink-0 font-extrabold whitespace-nowrap"
        >
          Xem Báo Cáo An Toàn
        </Button>
      </section>
    </div>
  );
};
