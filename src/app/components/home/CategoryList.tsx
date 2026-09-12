import React from 'react';
import Link from 'next/link';
import { CATEGORIES } from '../../constants/mockData';
import { ArrowRight } from 'lucide-react';

export const CategoryList: React.FC = () => {
  return (
    <section className="mb-12">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="heading-section flex items-center gap-2">
            Khám Phá Thế Giới Kỳ Thú 🌈
          </h2>
          <p className="text-subtitle text-xs sm:text-sm mt-1">
            Chọn đề tài bé yêu thích để bắt đầu hành trình phiêu lưu mới
          </p>
        </div>
        <Link
          href="/explore"
          className="group text-xs sm:text-sm font-bold text-primary-container hover:underline flex items-center gap-1 transition-colors self-end sm:self-auto"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid of Categories with Glowing Blur Backdrops */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {CATEGORIES.map((category) => (
          <div key={category.id} className="relative group">
            {/* Glowing Blur Backdrop Layer */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-teal-400/20 blur-lg opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />

            <div
              className={`relative rounded-2xl p-4 border transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-105 hover:border-primary-container/60 dark:hover:border-amber-400/60 flex flex-col items-center text-center cursor-pointer bg-gradient-to-b ${category.bgGradient} ${category.borderColor} backdrop-blur-md dark:bg-none dark:bg-[#0F1626]/90 dark:border-[#283556]`}
            >
              {/* Icon Bubble */}
              <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest/90 dark:bg-[#172038] shadow-2xs flex items-center justify-center text-2xl mb-3 group-hover:scale-120 group-hover:rotate-6 transition-all duration-300">
                {category.icon}
              </div>

              {/* Category Title */}
              <h3 className={`font-bold text-sm sm:text-base leading-snug mb-1 ${category.textColor} dark:text-[#DFE2EF] group-hover:text-primary-container dark:group-hover:text-amber-300 transition-colors`}>
                {category.title}
              </h3>

              {/* Story Count Badge */}
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${category.badgeBg} dark:bg-[#172038] dark:text-[#B2BDD4] group-hover:scale-105 transition-transform`}>
                {category.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
