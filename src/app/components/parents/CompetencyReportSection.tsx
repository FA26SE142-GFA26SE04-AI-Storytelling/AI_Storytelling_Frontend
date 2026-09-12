'use client';

import React from 'react';
import { Target, Brain } from 'lucide-react';

export const CompetencyReportSection: React.FC = () => {
  return (
    <div className="relative group">
      {/* Glowing Blur Backdrop Layer */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-rose-500/20 via-emerald-500/20 to-amber-500/20 blur-2xl opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none" />

      <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-6 border border-outline-variant/40 shadow-xs space-y-6 overflow-hidden">
        <div className="relative z-10 flex items-center justify-between border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 block">
                BÁO CÁO PHÁT TRIỂN TOÀN DIỆN
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-on-surface">
                Phân Bố Năng Lực & EQ Nhận Thức
              </h3>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">
            Bé Bo • 4 tuổi
          </span>
        </div>

        {/* 4 Competency Skill Progress Bars */}
        <div className="relative z-10 space-y-4">
          
          {/* Skill 1 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-extrabold">
              <span className="text-on-surface flex items-center gap-1.5">
                💡 Trí tưởng tượng sáng tạo
              </span>
              <span className="text-rose-500">72%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full w-[72%]" />
            </div>
            <p className="text-[11px] text-on-surface-variant opacity-80 leading-relaxed">
              Tự đề xuất các nhánh truyện kỳ lạ (bánh kẹo bay, cá heo biết hót).
            </p>
          </div>

          {/* Skill 2 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-extrabold">
              <span className="text-on-surface flex items-center gap-1.5">
                💖 Lòng nhân ái & sẻ chia
              </span>
              <span className="text-emerald-500">85%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[85%]" />
            </div>
            <p className="text-[11px] text-on-surface-variant opacity-80 leading-relaxed">
              Luôn chọn giải pháp giúp đỡ bạn bè/con vật khi gặp khó khăn.
            </p>
          </div>

          {/* Skill 3 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-extrabold">
              <span className="text-on-surface flex items-center gap-1.5">
                🔀 Tư duy phản biện & Tự quyết định
              </span>
              <span className="text-amber-500">70%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-[70%]" />
            </div>
            <p className="text-[11px] text-on-surface-variant opacity-80 leading-relaxed">
              Thích dừng lại cân nhắc giữa 2 nhánh cốt truyện trước khi chọn.
            </p>
          </div>

          {/* Skill 4 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-extrabold">
              <span className="text-on-surface flex items-center gap-1.5">
                🌙 Thói quen ngủ ngon & Điều hòa cảm xúc
              </span>
              <span className="text-teal-500">90%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full w-[90%]" />
            </div>
            <p className="text-[11px] text-on-surface-variant opacity-80 leading-relaxed">
              Duy trì 5 truyện ru ngủ mỗi tối, không quấy khóc trước giờ ngủ.
            </p>
          </div>

        </div>

        {/* Expert Advice Box */}
        <div className="relative z-10 p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-300/40 dark:border-rose-800/40 space-y-2">
          <div className="flex items-center gap-2 font-extrabold text-xs text-rose-600 dark:text-rose-300">
            <Brain className="w-4 h-4" />
            <span>Lời khuyên từ Chuyên gia Tâm lý Trẻ em MagicTales:</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed italic opacity-90">
            &quot;Tuần này Bé Bo có xu hướng thích những câu chuyện giúp đỡ bạn bè (như Chú Gấu Momi và Khủng Long Dino). Ba mẹ nên duy trì các tình huống lồng ghép lòng dũng cảm, thì con hãy tiếp tục tạo ra nhiều kết thúc có câu chuyện tương tác ngủ ngoan nhé!&quot;
          </p>
        </div>

      </div>
    </div>
  );
};
