'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  Headphones,
  Award,
  Play,
  Heart,
  Search,
  ChevronDown,
  Filter,
  Check,
  Lock,
  Printer,
  Share2,
  ArrowRight,
  Flame,
  Wand2,
  Clock,
  Star,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  Palette
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
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
      
      {/* -------------------------------------------------------------------------- */}
      {/* 1. HERO USER HEADER & STATS CARDS BANNER */}
      {/* -------------------------------------------------------------------------- */}
      <section className="relative w-full rounded-3xl bg-gradient-to-b from-amber-100/60 via-amber-50/40 to-surface-container-lowest dark:from-[#151D30] dark:to-[#0F1626] border border-outline-variant/40 dark:border-[#283556] p-6 sm:p-8 shadow-sm overflow-hidden flex flex-col gap-6 transition-colors duration-300">
        {/* Decorative Glowing Blobs */}
        <div
          className="absolute -top-10 -left-10 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-30 dark:opacity-20 animate-float-blob-1"
          style={{ background: 'var(--badge-gradient-1)' }}
        />
        <div
          className="absolute -bottom-12 -right-12 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-30 dark:opacity-20 animate-float-blob-2"
          style={{ background: 'var(--badge-gradient-2)' }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Welcome Info */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Top Level Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-xs font-extrabold w-fit shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>📍 CẤP ĐỘ: HIỆP SĨ CỔ TÍCH KHÍ ⚡</span>
            </div>

            {/* Main Heading */}
            <h1 className="heading-hero text-2xl sm:text-3xl lg:text-4xl text-on-surface">
              Tủ Truyện Diệu Kỳ Của Bé Bo 📚✨
            </h1>

            {/* Subtitle */}
            <p className="text-subtitle text-xs sm:text-sm">
              Bé đã khám phá <strong className="text-primary-container font-black">18 câu chuyện kỳ thú</strong> và giành được <strong className="text-amber-500 font-black">4 huy hiệu</strong> thám hiểm nhỏ. Hãy cùng tiếp tục khám phá thế giới thần tiên nhé!
            </p>

            {/* Action Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />}
                className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold"
              >
                Chế độ đọc ngoại tuyến (Offline)
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                className="font-bold text-xs"
              >
                Bộ lọc nhanh
              </Button>
            </div>
          </div>

          {/* Right Stats Grid (4 Cards) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {/* Stat Box 1 */}
            <div className="bg-surface-container-lowest/90 dark:bg-[#121A2D]/90 backdrop-blur-md border border-outline-variant/40 dark:border-[#283556] p-3.5 rounded-2xl shadow-2xs flex items-center gap-3 group hover:border-primary-container/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-110 transition-transform">
                📖
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-on-surface leading-tight">18</span>
                <span className="text-[11px] font-semibold text-on-surface-variant opacity-80">Truyện đã đọc</span>
              </div>
            </div>

            {/* Stat Box 2 */}
            <div className="bg-surface-container-lowest/90 dark:bg-[#121A2D]/90 backdrop-blur-md border border-outline-variant/40 dark:border-[#283556] p-3.5 rounded-2xl shadow-2xs flex items-center gap-3 group hover:border-primary-container/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-110 transition-transform">
                🎨
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-on-surface leading-tight">6</span>
                <span className="text-[11px] font-semibold text-on-surface-variant opacity-80">Tự tạo cùng AI</span>
              </div>
            </div>

            {/* Stat Box 3 */}
            <div className="bg-surface-container-lowest/90 dark:bg-[#121A2D]/90 backdrop-blur-md border border-outline-variant/40 dark:border-[#283556] p-3.5 rounded-2xl shadow-2xs flex items-center gap-3 group hover:border-primary-container/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-110 transition-transform">
                🎧
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-on-surface leading-tight">145</span>
                <span className="text-[11px] font-semibold text-on-surface-variant opacity-80">Phút lắng nghe</span>
              </div>
            </div>

            {/* Stat Box 4 */}
            <div className="bg-surface-container-lowest/90 dark:bg-[#121A2D]/90 backdrop-blur-md border border-outline-variant/40 dark:border-[#283556] p-3.5 rounded-2xl shadow-2xs flex items-center gap-3 group hover:border-primary-container/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-110 transition-transform">
                🏆
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-on-surface leading-tight">4/12</span>
                <span className="text-[11px] font-semibold text-on-surface-variant opacity-80">Huy hiệu đã đạt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* 2. SECONDARY FILTER & SEARCH TOOLBAR */}
      {/* -------------------------------------------------------------------------- */}
      <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs">
        {/* Left Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              activeTab === 'all'
                ? 'bg-primary-container text-on-primary-container shadow-md scale-102 ring-2 ring-primary-container/30'
                : 'bg-surface-container-lowest dark:bg-[#0F1626] text-on-surface-variant hover:bg-surface-container border border-outline-variant/40'
            }`}
          >
            <span>⚡ Tất cả truyện (24)</span>
          </button>

          <button
            onClick={() => setActiveTab('reading')}
            className={`px-4 py-2 rounded-full font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              activeTab === 'reading'
                ? 'bg-primary-container text-on-primary-container shadow-md scale-102 ring-2 ring-primary-container/30'
                : 'bg-surface-container-lowest dark:bg-[#0F1626] text-on-surface-variant hover:bg-surface-container border border-outline-variant/40'
            }`}
          >
            <span>📖 Đang đọc dở (3)</span>
          </button>

          <button
            onClick={() => setActiveTab('created')}
            className={`px-4 py-2 rounded-full font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              activeTab === 'created'
                ? 'bg-primary-container text-on-primary-container shadow-md scale-102 ring-2 ring-primary-container/30'
                : 'bg-surface-container-lowest dark:bg-[#0F1626] text-on-surface-variant hover:bg-surface-container border border-outline-variant/40'
            }`}
          >
            <span>🎨 Bé tự tạo cùng AI (6)</span>
          </button>
        </div>

        {/* Right Search Input & Sort Dropdown */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên truyện trong tủ của bé..."
              className="w-full pl-9 pr-3 py-2 rounded-full bg-surface-container-lowest dark:bg-[#0F1626] border border-outline-variant/40 text-on-surface text-xs font-medium placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary-container"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <select className="appearance-none bg-surface-container-lowest dark:bg-[#0F1626] border border-outline-variant/40 rounded-full px-3.5 py-2 pr-8 font-bold text-on-surface text-xs cursor-pointer focus:outline-none focus:border-primary-container">
              <option value="recent">📌 Mới nghe gần đây</option>
              <option value="favorite">❤️ Yêu thích nhất</option>
              <option value="name">🔤 Theo tên A-Z</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* 3. FEATURED RESUME BANNER ("TIẾP TỤC CUỘC PHIÊU LƯU") */}
      {/* -------------------------------------------------------------------------- */}
      <section className="relative w-full rounded-3xl bg-surface-container-lowest dark:bg-[#0F1626] border border-outline-variant/40 p-5 sm:p-8 shadow-md flex flex-col gap-5 overflow-hidden group hover:shadow-xl transition-all">
        {/* Subtle Glow Aura behind Card */}
        <div className="radiant-glow-aura" />

        {/* Card Header Tag */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="badge-eyebrow-label text-rose-600 dark:text-rose-400">
              📍 TIẾP TỤC CUỘC PHIÊU LƯU
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-eyebrow-label text-on-surface-variant/80">
              PHIÊU LƯU KỲ THÚ • GIỌNG ĐỌC MẸ HIỀN (AI EMOTION)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-[10px]">
              Chương 2 / 5
            </span>
          </div>
        </div>

        {/* Card Main Body */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Cover Preview */}
          <div className="lg:col-span-4 relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md group/img">
            <Image
              src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop"
              alt="Lâu Đài Kẹo Ngọt Trên Mây"
              fill
              className="object-cover group-hover/img:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-[11px] font-extrabold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Còn 5 phút</span>
            </span>
          </div>

          {/* Right Content Details & Progress */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 className="heading-section text-xl sm:text-2xl lg:text-3xl text-on-surface">
                Lâu Đài Kẹo Ngọt Trên Mây
              </h2>

              <p className="text-subtitle text-xs sm:text-sm leading-relaxed italic">
                &ldquo;Bé An và Chú Sóc Bông đã bước qua chiếc cổng vôi cầu phồng. Trước mắt bé là hai cánh cổng bí mật: Cổng Sô-cô-la phát sáng và Cổng Thạch Lam Lấp Lánh...&rdquo;
              </p>
            </div>

            {/* Reading Progress Line */}
            <div className="flex flex-col gap-1.5 bg-surface-container/40 p-3.5 rounded-2xl border border-outline-variant/30">
              <div className="flex items-center justify-between text-xs font-extrabold text-on-surface">
                <span className="flex items-center gap-1.5 text-rose-500">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Tiến độ đọc: 65%</span>
                </span>
                <span className="text-on-surface-variant font-semibold">Đã nghe 7 / 10 phút</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-400 to-rose-500 h-full rounded-full w-[65%] transition-all duration-300" />
              </div>
            </div>

            {/* Next Branch Choice Callout */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-extrabold text-amber-700 dark:text-amber-300">
                  ⚡ Lựa chọn ở nhánh tiếp theo đang chờ bé:
                </span>
                <span className="font-semibold text-on-surface">
                  Mở Cổng Sô-cô-la hay Qua Cổng Thạch Lam?
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="primary"
                size="md"
                shimmer
                icon={<Play className="w-4 h-4 fill-current ml-0.5" />}
                className="font-extrabold text-xs sm:text-sm"
              >
                Tiếp tục nghe (Chương 2)
              </Button>
              <Button
                variant="outline"
                size="md"
                icon={<BookOpen className="w-4 h-4" />}
                className="font-extrabold text-xs sm:text-sm"
              >
                Đọc sách tranh
              </Button>
              <button
                onClick={() => toggleFav('featured')}
                className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                  favorites['featured']
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant/40'
                }`}
                aria-label="Toggle favorite"
              >
                <Heart className={`w-4 h-4 ${favorites['featured'] ? 'fill-white' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* 4. SECTION: "TÁC PHẨM BÉ ĐÃ SÁNG TẠO CÙNG AI" */}
      {/* -------------------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="heading-section text-lg sm:text-xl flex items-center gap-2">
              <span className="text-teal-500">🎨</span>
              <span>Tác Phẩm Bé Đã Sáng Tạo Cùng AI</span>
            </h2>
            <p className="text-subtitle text-xs">
              Những câu chuyện đặc sắc do chính trí tưởng tượng của bé dệt nên
            </p>
          </div>

          <Link href="#" className="text-xs font-bold text-primary-container hover:underline flex items-center gap-1">
            <span>Xem tất cả (6)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Grid Cards (2 Story Cards + 1 Create New Prompt Card) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(LIBRARY_CREATED_STORIES || []).map((story) => {
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
                    <span className="text-[11px] font-semibold text-on-surface-variant/70">
                      {story.tag}
                    </span>

                    <h3 className="heading-card text-sm sm:text-base font-extrabold text-on-surface group-hover:text-primary-container transition-colors line-clamp-1">
                      {story.title}
                    </h3>

                    <p className="text-subtitle text-xs line-clamp-2 leading-relaxed">
                      {story.description}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 pt-0 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="primary" size="sm" className="text-xs py-2">
                      <Play className="w-3.5 h-3.5 fill-current mr-1" />
                      <span>Nghe audio</span>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs py-2">
                      <BookOpen className="w-3.5 h-3.5 mr-1" />
                      <span>Đọc lại</span>
                    </Button>
                  </div>

                  <Button
                    variant="gold"
                    size="sm"
                    className="w-full text-[11px] py-1.5 justify-center font-bold"
                  >
                    <span>📜 In thành sách tranh kỷ niệm 🖨️</span>
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Callout Card: Create New Story with AI */}
          <div className="relative rounded-3xl bg-gradient-to-br from-teal-50/80 via-emerald-100/40 to-surface-container-lowest dark:from-teal-950/30 dark:to-[#0F1626] border-2 border-dashed border-teal-400/60 p-6 flex flex-col items-center justify-center text-center gap-4 group hover:border-teal-500 transition-all shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🎨
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="heading-card text-base font-black text-on-surface">
                Bé muốn vẽ thêm truyện mới?
              </h3>
              <p className="text-subtitle text-xs max-w-xs">
                Nói cho AI nghe nhân vật bé thích (robot, mèo con, phi thuyền...), truyện sẽ xuất hiện ngay!
              </p>
            </div>

            <Link href="/create" className="w-full">
              <Button
                variant="secondary"
                size="md"
                shimmer
                icon={<Wand2 className="w-4 h-4" />}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md"
              >
                Bắt đầu sáng tác ngay
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* 5. SECTION: "BỘ SƯU TẬP YÊU THÍCH & RU NGỦ" */}
      {/* -------------------------------------------------------------------------- */}
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
          {(LIBRARY_FAVORITE_STORIES || []).map((story) => {
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

      {/* -------------------------------------------------------------------------- */}
      {/* 6. SECTION: "THỬ THÁCH 7 NGÀY ĐỌC TRUYỆN & BỘ HUY HIỆU CỦA BÉ" */}
      {/* -------------------------------------------------------------------------- */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 7-Day Reading Streak Challenge Box */}
        <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-[#0F1626] rounded-3xl p-6 border border-outline-variant/40 shadow-xs flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-1">
            <h3 className="heading-card text-lg sm:text-xl font-black text-on-surface flex items-center gap-2">
              <span className="text-rose-500">🔥</span>
              <span>Thử Thách 7 Ngày Đọc Truyện</span>
            </h3>
            <p className="text-subtitle text-xs">
              Xây dựng thói quen đọc sách trước khi ngủ cùng Bé Bo
            </p>
          </div>

          {/* 7 Days Streak Circles */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3 py-2">
            {(DAY_STREAKS || []).map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm border transition-all ${
                    item.isCompleted
                      ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-500/20'
                      : item.isCurrent
                      ? 'bg-amber-400 text-amber-950 border-amber-400 ring-4 ring-amber-400/20 font-black animate-pulse'
                      : 'bg-surface-container/60 text-on-surface-variant/40 border-outline-variant/30'
                  }`}
                >
                  {item.isCompleted ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : item.isCurrent ? (
                    <Flame className="w-5 h-5 fill-current text-rose-600" />
                  ) : (
                    <Lock className="w-4 h-4 opacity-50" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-on-surface-variant">
                  {item.day}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Note Box */}
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-rose-500" />
            <span>Bé đã đạt 4/7 ngày đọc liên tiếp! Còn 3 ngày nữa để mở rương quà bảo bối thần kỳ.</span>
          </div>
        </div>

        {/* Right Column: Badges Collection Showcase */}
        <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-[#0F1626] rounded-3xl p-6 border border-outline-variant/40 shadow-xs flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between">
            <h3 className="heading-card text-lg sm:text-xl font-black text-on-surface">
              Bộ Huy Hiệu Của Bé
            </h3>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Đã thu thập 4/12
            </span>
          </div>

          {/* Badges List */}
          <div className="grid grid-cols-3 gap-2.5">
            {(LIBRARY_BADGES || []).map((bdg) => (
              <div
                key={bdg.id}
                className="flex flex-col items-center text-center p-3 rounded-2xl bg-surface-container/40 border border-outline-variant/30 hover:border-amber-400/50 transition-all group cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-1.5 group-hover:scale-110 transition-transform ${bdg.bgColor}`}>
                  {bdg.icon}
                </div>
                <span className="text-[11px] font-extrabold text-on-surface line-clamp-1">
                  {bdg.title}
                </span>
                <span className="text-[9px] font-semibold text-on-surface-variant/70">
                  {bdg.subtitle}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <Button
              variant="gold"
              size="sm"
              icon={<Award className="w-4 h-4" />}
              className="w-full sm:w-auto flex-1 text-xs justify-center font-bold"
            >
              Khoe Thành Tích Cùng Ông Bà
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto text-xs justify-center font-bold"
            >
              In phiếu khen thưởng
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
