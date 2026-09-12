'use client';

import React from 'react';
import Image from 'next/image';
import { FileText, Clock, Zap, Sparkles, Moon, ChevronRight } from 'lucide-react';

interface RecentReadingActivityProps {
  handleExportPdf: () => void;
  isExportingPdf: boolean;
}

export const RecentReadingActivity: React.FC<RecentReadingActivityProps> = ({
  handleExportPdf,
  isExportingPdf,
}) => {
  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
            HOẠT ĐỘNG ĐỌC GẦN ĐÂY
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface">
            Truyện Bé Yêu Thích & Tương Tác Nhiều Nhất
          </h2>
        </div>

        <button
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className="px-4 py-2 rounded-full border border-outline-variant/50 bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md hover:bg-surface-container text-on-surface font-extrabold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <FileText className="w-4 h-4 text-rose-500" />
          <span>{isExportingPdf ? 'Đang tạo PDF...' : 'Xuất Báo Cáo Tuần (PDF)'}</span>
        </button>
      </div>

      {/* 3 Story Cards Grid with Blur Backdrops */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 blur-lg opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />

          <div className="relative group bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-3 border border-outline-variant/30 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-pointer">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-surface-container">
              <Image
                src="https://images.unsplash.com/photo-1559454403-b8fb88521f11?q=80&w=600&auto=format&fit=crop"
                alt="Chú Gấu Momi"
                fill
                className="object-cover group-hover:scale-108 transition-transform duration-500"
                sizes="400px"
              />
              <div className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Zap className="w-3 h-3 fill-current" />
                <span>Nghe 5 lần tuần này</span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-300" />
                <span>12 phút</span>
              </div>
            </div>

            <div className="flex flex-col flex-1 px-1 space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-on-surface line-clamp-1 group-hover:text-rose-500 transition-colors">
                Chú Gấu Momi và Chiếc Bánh mật
              </h3>
              <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed opacity-80">
                Bài học về sự chia sẻ khi gấu Momi nhường chiếc bánh duy nhất cho bé thỏ trắng trong đợt rét lạnh...
              </p>

              <div className="mt-auto pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2 text-xs">
                <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  Lòng nhân ái
                </span>
                <button className="font-extrabold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5">
                  <span>Chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 blur-lg opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />

          <div className="relative group bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-3 border border-outline-variant/30 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-pointer">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-surface-container">
              <Image
                src="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=600&auto=format&fit=crop"
                alt="Khủng Long Dino Vũ Trụ"
                fill
                className="object-cover group-hover:scale-108 transition-transform duration-500"
                sizes="400px"
              />
              <div className="absolute top-2.5 left-2.5 bg-amber-500 text-on-secondary-container text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 fill-current" />
                <span>Truyện bé tự sáng tạo</span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-300" />
                <span>15 phút</span>
              </div>
            </div>

            <div className="flex flex-col flex-1 px-1 space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-on-surface line-clamp-1 group-hover:text-rose-500 transition-colors">
                Bé Bo & Khủng Long Dino Khám Phá Vũ Trụ
              </h3>
              <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed opacity-80">
                Bé Bo học cách &apos;Bay qua dải ngân hà kẹo bông&apos; và giúp bạn rồng tìm lại chiếc đĩa phát sáng...
              </p>

              <div className="mt-auto pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2 text-xs">
                <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Trí tưởng tượng
                </span>
                <button className="font-extrabold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5">
                  <span>Chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 blur-lg opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />

          <div className="relative group bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-3 border border-outline-variant/30 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-pointer">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-surface-container">
              <Image
                src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop"
                alt="Lâu Đài Kẹo Ngọt"
                fill
                className="object-cover group-hover:scale-108 transition-transform duration-500"
                sizes="400px"
              />
              <div className="absolute top-2.5 left-2.5 bg-indigo-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Moon className="w-3 h-3 fill-current" />
                <span>Nghe ru ngủ</span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-300" />
                <span>10 phút</span>
              </div>
            </div>

            <div className="flex flex-col flex-1 px-1 space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-on-surface line-clamp-1 group-hover:text-rose-500 transition-colors">
                Lâu Đài Kẹo Ngọt Của Chim Cánh Cụt
              </h3>
              <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed opacity-80">
                Âm nhạc êm dịu kết hợp câu chuyện lồng tiếng truyền cảm giúp bé thư giãn hoàn toàn trước giờ ngủ...
              </p>

              <div className="mt-auto pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2 text-xs">
                <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Ru ngủ êm dịu
                </span>
                <button className="font-extrabold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5">
                  <span>Chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
