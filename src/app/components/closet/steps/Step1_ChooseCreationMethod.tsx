'use client';

import React from 'react';
import { Sparkles, FileUp, Wand2, BookOpen, ShieldCheck, ChevronRight, User } from 'lucide-react';
import { ChildProfile } from '../../../types/childProfile';

export interface Step1_ChooseCreationMethodProps {
  childrenList: ChildProfile[];
  selectedChild: ChildProfile | null;
  onSelectChild: (child: ChildProfile) => void;
  onSelectMethod: (method: 'ai_prompt' | 'existing_import') => void;
}

export const Step1_ChooseCreationMethod: React.FC<Step1_ChooseCreationMethodProps> = ({
  childrenList,
  selectedChild,
  onSelectChild,
  onSelectMethod,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Chọn Hồ Sơ Bé */}
      <div className="p-4 rounded-2xl bg-tod-card border border-tod-border backdrop-blur-md transition-colors duration-500">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-tod-text-muted flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sky-500" /> Chọn độc giả nhí cho câu chuyện:
          </span>
          {selectedChild && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Đã áp dụng quy tắc an toàn ({selectedChild.ageBand || '6-8'} tuổi)
            </span>
          )}
        </div>

        {childrenList.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {childrenList.map((c) => {
              const isSelected = selectedChild?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectChild(c)}
                  className={`px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-extrabold flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-500 text-sky-600 dark:text-white shadow-lg shadow-sky-950/20 scale-[1.02]'
                      : 'bg-tod-surface hover:bg-tod-card border-tod-border text-tod-text-muted hover:text-tod-text'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isSelected ? 'bg-sky-500 text-white' : 'bg-tod-card text-tod-text-muted border border-tod-border'
                    }`}
                  >
                    {c.nickname ? c.nickname[0].toUpperCase() : 'B'}
                  </div>
                  <span>{c.nickname || 'Bé'}</span>
                  <span className="text-[10px] opacity-75 font-medium px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10">
                    {c.ageBand || 'Độ tuổi 6-8'}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-tod-text-muted italic">
            Chưa có hồ sơ bé. Truyện sẽ được cá nhân hóa theo độ tuổi chuẩn tiểu học (6-8 tuổi).
          </p>
        )}
      </div>

      {/* 2. Hai Hình Thức Sáng Tác Lớn (Hero Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Bút Thần AI Sáng Tác */}
        <div
          onClick={() => onSelectMethod('ai_prompt')}
          className="group relative p-7 sm:p-8 rounded-3xl bg-tod-card/90 border border-sky-500/30 hover:border-sky-500 hover:shadow-2xl hover:shadow-sky-900/20 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="absolute top-5 right-5">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
              Trường hợp 1
            </span>
          </div>

          <div>
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-500 border border-sky-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Wand2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-tod-text group-hover:text-sky-500 transition-colors">
              Sáng Tác Cùng Bút Thần AI
            </h3>
            <p className="text-xs sm:text-sm text-tod-text-muted mt-2.5 leading-relaxed">
              Bạn và bé chỉ cần đưa ra ý tưởng, thể loại và bài học mong muốn. Trợ lý AI sẽ sáng tác một câu chuyện mới toanh với dàn ý 3 hồi sinh động.
            </p>

            <ul className="mt-5 space-y-2.5 text-xs sm:text-[13px] text-tod-text">
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500 shrink-0" /> Tự động cân chỉnh từ vựng theo tuổi bé
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500 shrink-0" /> Xem, sửa hoặc yêu cầu đổi Dàn ý 3 hồi
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500 shrink-0" /> Quét an toàn đầu vào (Safety Guardrail)
              </li>
            </ul>
          </div>

          <div className="mt-7 pt-4 border-t border-tod-border flex items-center justify-between text-xs sm:text-sm font-black text-sky-600 dark:text-sky-400 group-hover:translate-x-1.5 transition-transform">
            <span>Bắt đầu cùng Bút Thần</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Card 2: Gửi Gắm Truyện Có Sẵn / Tải File */}
        <div
          onClick={() => onSelectMethod('existing_import')}
          className="group relative p-7 sm:p-8 rounded-3xl bg-tod-card/90 border border-amber-500/30 hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-900/20 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="absolute top-5 right-5">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              Trường hợp 2
            </span>
          </div>

          <div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <FileUp className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-tod-text group-hover:text-amber-500 transition-colors">
              Gửi Gắm Truyện Quen Thuộc
            </h3>
            <p className="text-xs sm:text-sm text-tod-text-muted mt-2.5 leading-relaxed">
              Tải lên tệp truyện có sẵn (Word <code className="text-amber-600 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">.docx</code>, Text <code className="text-amber-600 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">.txt</code>) hoặc dán truyện cổ tích, bài học bạn yêu thích.
            </p>

            <ul className="mt-5 space-y-2.5 text-xs sm:text-[13px] text-tod-text">
              <li className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500 shrink-0" /> Hỗ trợ tải tệp nhị phân tới 5 MB
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500 shrink-0" /> Đo độ khó đọc & tính an toàn tự động
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500 shrink-0" /> Giữ nguyên bản gốc hoặc nhờ AI tinh chỉnh
              </li>
            </ul>
          </div>

          <div className="mt-7 pt-4 border-t border-tod-border flex items-center justify-between text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 group-hover:translate-x-1.5 transition-transform">
            <span>Chọn tệp hoặc dán truyện</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
