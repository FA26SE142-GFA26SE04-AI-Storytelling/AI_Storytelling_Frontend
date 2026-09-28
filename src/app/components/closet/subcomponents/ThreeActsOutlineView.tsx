'use client';

import React from 'react';
import { BookOpen, Sparkles, Flag, Milestone, CheckCircle2 } from 'lucide-react';
import { OutlineProgressDto } from '../../../types/aiStory';

export interface ThreeActsOutlineViewProps {
  outlineProgress: OutlineProgressDto;
  isEditing: boolean;
  onEditChange?: (field: 'opening' | 'development' | 'ending' | 'title', value: string) => void;
  editValues?: {
    title: string;
    opening: string;
    development: string;
    ending: string;
  };
}

export const ThreeActsOutlineView: React.FC<ThreeActsOutlineViewProps> = ({
  outlineProgress,
  isEditing,
  onEditChange,
  editValues,
}) => {
  const currentVersion = outlineProgress.currentVersion;
  const nodes = currentVersion?.nodes || [];

  // Fallback map nodes or defaults if outline has 3 chapters/nodes
  const openingNode = nodes.find((n) => n.chapterNumber === 1);
  const devNode = nodes.find((n) => n.chapterNumber === 2);
  const endingNode = nodes.find((n) => n.chapterNumber === 3);

  const displayTitle = editValues?.title ?? currentVersion?.title ?? 'Câu chuyện kỳ thú';
  const openingText = editValues?.opening ?? openingNode?.summary ?? openingNode?.title ?? '';
  const devText = editValues?.development ?? devNode?.summary ?? devNode?.title ?? '';
  const endingText = editValues?.ending ?? endingNode?.summary ?? endingNode?.title ?? '';

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-tod-card border border-tod-border backdrop-blur-md transition-colors duration-500">
        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-bold text-tod-text-muted uppercase tracking-wider block">
            Tiêu đề cốt truyện dự kiến
          </span>
          {isEditing ? (
            <input
              type="text"
              value={displayTitle}
              onChange={(e) => onEditChange?.('title', e.target.value)}
              className="w-full text-base font-extrabold text-tod-text bg-tod-surface/90 border border-tod-border rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500 mt-1"
              placeholder="Nhập tiêu đề truyện..."
            />
          ) : (
            <h4 className="text-base font-extrabold text-tod-text truncate">
              {displayTitle}
            </h4>
          )}
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
          Phiên bản {currentVersion?.versionNumber ?? 1}
        </span>
      </div>

      {/* 3 Acts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Hồi 1: Mở đầu */}
        <div className="p-4 rounded-2xl bg-tod-card border border-emerald-500/30 shadow-lg flex flex-col justify-between transition-colors duration-500">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center border border-emerald-500/40">
                1
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-300 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Mở đầu (Khởi hành)
              </span>
            </div>
            {isEditing ? (
              <textarea
                value={openingText}
                onChange={(e) => onEditChange?.('opening', e.target.value)}
                rows={4}
                className="w-full text-xs font-medium text-tod-text bg-tod-surface/90 border border-tod-border rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                placeholder="Mô tả bối cảnh và xuất phát điểm của nhân vật..."
              />
            ) : (
              <p className="text-xs leading-relaxed text-tod-text-muted">
                {openingText || 'Nhân vật chính xuất hiện trong khung cảnh yên bình và bắt đầu khám phá thế giới xung quanh.'}
              </p>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-tod-border text-[10px] text-tod-text-muted flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Giới thiệu nhân vật & bối cảnh
          </div>
        </div>

        {/* Hồi 2: Diễn biến */}
        <div className="p-4 rounded-2xl bg-tod-card border border-amber-500/30 shadow-lg flex flex-col justify-between transition-colors duration-500">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-center border border-amber-500/40">
                2
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                <Milestone className="w-3.5 h-3.5" /> Diễn biến (Thử thách)
              </span>
            </div>
            {isEditing ? (
              <textarea
                value={devText}
                onChange={(e) => onEditChange?.('development', e.target.value)}
                rows={4}
                className="w-full text-xs font-medium text-tod-text bg-tod-surface/90 border border-tod-border rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                placeholder="Mô tả xung đột, thử thách bất ngờ hoặc cuộc gặp gỡ..."
              />
            ) : (
              <p className="text-xs leading-relaxed text-tod-text-muted">
                {devText || 'Một thử thách bất ngờ xuất hiện, nhân vật cùng bạn bè đồng lòng tìm cách giải quyết bằng sự dũng cảm.'}
              </p>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-tod-border text-[10px] text-tod-text-muted flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-amber-500" /> Kịch tính & cao trào câu chuyện
          </div>
        </div>

        {/* Hồi 3: Kết thúc */}
        <div className="p-4 rounded-2xl bg-tod-card border border-purple-500/30 shadow-lg flex flex-col justify-between transition-colors duration-500">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-black flex items-center justify-center border border-purple-500/40">
                3
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Kết thúc (Ý nghĩa)
              </span>
            </div>
            {isEditing ? (
              <textarea
                value={endingText}
                onChange={(e) => onEditChange?.('ending', e.target.value)}
                rows={4}
                className="w-full text-xs font-medium text-tod-text bg-tod-surface/90 border border-tod-border rounded-xl p-2.5 focus:outline-none focus:border-purple-500"
                placeholder="Mô tả kết quả tươi sáng và bài học bổ ích cho bé..."
              />
            ) : (
              <p className="text-xs leading-relaxed text-tod-text-muted">
                {endingText || 'Mọi thử thách được hóa giải trọn vẹn, để lại bài học yêu thương và niềm vui ấm áp.'}
              </p>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-tod-border text-[10px] text-tod-text-muted flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-purple-500" /> Bài học đạo đức & niềm vui trọn vẹn
          </div>
        </div>
      </div>
    </div>
  );
};
