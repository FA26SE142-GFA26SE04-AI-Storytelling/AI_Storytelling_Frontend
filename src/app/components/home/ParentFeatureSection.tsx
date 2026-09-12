import React from 'react';
import { ShieldCheck, Ban, Clock, MessageSquareHeart } from 'lucide-react';

export const ParentFeatureSection: React.FC = () => {
  return (
    <section className="relative mb-10 group">
      {/* Glowing Blur Backdrop Layer */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-teal-500/25 blur-2xl opacity-75 group-hover:opacity-95 transition-opacity pointer-events-none" />

      <div className="relative bg-gradient-to-br from-secondary-container/20 via-surface-container/70 to-tertiary-container/10 dark:from-[#0F1626]/90 dark:via-[#172038]/90 dark:to-[#0F1626]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-outline-variant/30 dark:border-[#283556] shadow-xs transition-colors duration-300 overflow-hidden">
        {/* Header Tag & Title */}
        <div className="mb-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container badge-eyebrow-label mb-2 shadow-2xs">
            📍 GÓC TƯ VẤN SƯ PHẠM ĐỒNG HÀNH CÙNG CON
          </span>
          <h2 className="heading-section text-xl sm:text-2xl md:text-3xl">
            Kích thích tư duy phản biện qua từng bước ngoặt truyện
          </h2>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Pedagogical Tip Box */}
          <div className="lg:col-span-6 bg-surface-container-lowest/90 dark:bg-[#172038]/90 backdrop-blur-md rounded-2xl p-5 border border-outline-variant/30 dark:border-[#283556] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 text-on-surface font-extrabold text-sm mb-3">
              <MessageSquareHeart className="w-5 h-5 text-primary-container" />
              <span>Mẹo nhỏ tối nay cho bố mẹ:</span>
            </div>
            <blockquote className="text-on-surface-variant text-xs sm:text-sm leading-relaxed italic font-medium bg-surface-container/50 dark:bg-[#0F1626]/50 p-4 rounded-xl border border-outline-variant/20">
              &ldquo;Hãy dừng lại trước mỗi quyết định của nhân vật và hỏi: <span className="text-primary-container font-bold not-italic">&apos;Nếu là con, con sẽ chọn làm gì?&apos;</span>. Việc này giúp trẻ học cách cảm nhận kết quả và tự tin thể hiện quan điểm cá nhân.&rdquo;
            </blockquote>
          </div>

          {/* Right Column: 3 Benefit Cards */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            {/* Item 1 */}
            <div className="bg-surface-container-lowest/90 dark:bg-[#172038]/90 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/30 dark:border-[#283556] shadow-2xs flex items-start gap-3.5 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] hover:border-primary-container/40 dark:hover:border-amber-400/40 transition-all duration-300 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container/20 text-tertiary-container flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-on-surface text-sm sm:text-base">
                  100% Nội Dung Kiểm Duyệt An Toàn
                </h4>
                <p className="text-on-surface-variant text-xs mt-0.5 font-medium opacity-80">
                  Đã lọc AI không chứa từ ngữ độc hại hay bạo lực
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="bg-surface-container-lowest/90 dark:bg-[#172038]/90 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/30 dark:border-[#283556] shadow-2xs flex items-start gap-3.5 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] hover:border-primary-container/40 dark:hover:border-amber-400/40 transition-all duration-300 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/20 text-on-secondary-container flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-on-surface text-sm sm:text-base">
                  Không Quảng Cáo Làm Phiền
                </h4>
                <p className="text-on-surface-variant text-xs mt-0.5 font-medium opacity-80">
                  Không gian thuần khiết để trẻ tập trung đọc & nghe
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="bg-surface-container-lowest/90 dark:bg-[#172038]/90 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/30 dark:border-[#283556] shadow-2xs flex items-start gap-3.5 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] hover:border-primary-container/40 dark:hover:border-amber-400/40 transition-all duration-300 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary-container flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-on-surface text-sm sm:text-base">
                  Kiểm Soát Thời Gian Sử Dụng
                </h4>
                <p className="text-on-surface-variant text-xs mt-0.5 font-medium opacity-80">
                  Phụ huynh dễ dàng cài đặt giới hạn 15 - 45 phút mỗi ngày
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
