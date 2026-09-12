'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

import { ShowcaseCollection } from '../../types/explore';

interface ExploreCuratedShowcaseProps {
  collections: ShowcaseCollection[];
}

export const ExploreCuratedShowcase: React.FC<ExploreCuratedShowcaseProps> = ({
  collections,
}) => {
  return (
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
        {(collections || []).map((card) => (
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
  );
};
