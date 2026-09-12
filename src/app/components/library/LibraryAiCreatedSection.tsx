'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Heart, Play, Wand2 } from 'lucide-react';
import { Button } from '../ui/Button';

import { LibraryStoryItem } from '../../types/library';

interface LibraryAiCreatedSectionProps {
  createdStories: LibraryStoryItem[];
  favorites: Record<string, boolean>;
  toggleFav: (id: string) => void;
}

export const LibraryAiCreatedSection: React.FC<LibraryAiCreatedSectionProps> = ({
  createdStories,
  favorites,
  toggleFav,
}) => {
  return (
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
        {(createdStories || []).map((story) => {
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
  );
};
