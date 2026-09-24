'use client';

import React from 'react';
import {
  Clock,
  Sparkles,
  BarChart3,
  FileText,
  Download,
  Play,
  Pause,
  Brain,
  BookOpen,
  Award,
  Compass,
} from 'lucide-react';
import { LearningProfile, TokenQuotaStatus } from '../../../types/childProfile';
import { StoryDto } from '../../../types/story';

export interface ParentDeskNotebookDrawerProps {
  activeTab: 'stats' | 'conversation' | 'activity';
  setActiveTab: (tab: 'stats' | 'conversation' | 'activity') => void;
  childNickname?: string;
  learningProfile?: LearningProfile | null;
  tokenQuota?: TokenQuotaStatus | null;
  recentStories?: StoryDto[];
  isPlayingAudioSample: boolean;
  setIsPlayingAudioSample: (val: boolean) => void;
  feedbackRating: 'like' | 'dislike' | null;
  setFeedbackRating: (val: 'like' | 'dislike' | null) => void;
  handleExportPdf: () => void;
  isExportingPdf: boolean;
}

export const ParentDeskNotebookDrawer: React.FC<ParentDeskNotebookDrawerProps> = ({
  activeTab,
  setActiveTab,
  childNickname = 'Bé',
  learningProfile,
  tokenQuota,
  recentStories = [],
  isPlayingAudioSample,
  setIsPlayingAudioSample,
  feedbackRating,
  setFeedbackRating,
  handleExportPdf,
  isExportingPdf,
}) => {
  return (
    <div className="desk-left-drawer pointer-events-auto w-full lg:w-[460px] max-h-[50vh] lg:max-h-[75vh] flex flex-col rounded-3xl bg-tod-surface backdrop-blur-xl border border-tod-border shadow-[0_15px_40px_rgba(0,0,0,0.4)] text-tod-text overflow-hidden transition-colors duration-500">
      {/* Notebook Header Tabs */}
      <div className="p-3 bg-tod-card border-b border-tod-border flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'stats'
              ? 'bg-sky-500 text-white shadow-md font-extrabold'
              : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Hồ Sơ & Thống Kê</span>
        </button>
        <button
          onClick={() => setActiveTab('conversation')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'conversation'
              ? 'bg-purple-500 text-white shadow-md font-extrabold'
              : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gợi Ý Trò Chuyện</span>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'activity'
              ? 'bg-emerald-500 text-white shadow-md font-extrabold'
              : 'text-tod-text-muted hover:text-tod-text hover:bg-tod-surface'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Nhật Ký Truyện ({recentStories.length})</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 p-4 overflow-y-auto dashboard-scrollbar">
        {/* TAB 1: WEEKLY STATS & LIVE LEARNING PROFILE */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-3.5">
            {/* 4 Quick Stat Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="desk-stat-card p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-300 flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5" /> Cấp độ đọc hiểu
                </span>
                <strong className="text-lg font-black text-tod-text">
                  Cấp Độ {learningProfile?.readingLevel ?? 2}
                </strong>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Phù hợp độ tuổi nhận thức
                </span>
              </div>

              <div className="desk-stat-card p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> Truyện đã xuất bản
                </span>
                <strong className="text-lg font-black text-tod-text">
                  {recentStories.length} Truyện
                </strong>
                <span className="text-[9px] text-purple-600 dark:text-purple-300 font-bold">
                  Sáng tạo & kiểm duyệt
                </span>
              </div>

              <div className="desk-stat-card p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Token Quota AI
                </span>
                <strong className="text-lg font-black text-tod-text">
                  {tokenQuota?.isUnlimited
                    ? 'Không giới hạn'
                    : tokenQuota?.remaining !== undefined && tokenQuota?.remaining !== null
                    ? `${tokenQuota.remaining} Tokens`
                    : 'Đang nạp'}
                </strong>
                <span className="text-[9px] text-amber-600 dark:text-amber-300 font-bold">
                  {tokenQuota?.isUnlimited
                    ? 'Tài khoản VIP'
                    : `Hạn mức: ${tokenQuota?.quotaLimit ?? 1000} tokens`}
                </span>
              </div>

              <div className="desk-stat-card p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" /> Chủ đề yêu thích
                </span>
                <strong className="text-sm font-black text-tod-text truncate">
                  {learningProfile?.topics?.[0]?.topic || 'Khám phá thế giới'}
                </strong>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-300 font-bold">
                  {learningProfile?.topics?.length ?? 1} chủ đề quan tâm
                </span>
              </div>
            </div>

            {/* Goal Card */}
            <div className="desk-tab-content-item p-3.5 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-tod-text">Mục tiêu phát triển của {childNickname}</span>
                <span className="text-sky-500 font-bold">Đang áp dụng</span>
              </div>
              <p className="text-[11px] text-tod-text-muted leading-relaxed">
                {learningProfile?.comprehensionGoal ||
                  `Phát triển tư duy nhận thức, bồi dưỡng lòng nhân ái và thói quen đọc sách cho ${childNickname}.`}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: AI CONVERSATION STARTERS */}
        {activeTab === 'conversation' && (
          <div className="desk-tab-content-item flex flex-col gap-3">
            <div className="p-3.5 rounded-2xl bg-tod-card border border-purple-500/30 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-500 dark:text-purple-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-tod-text">Chủ Đề Trò Chuyện Tối Nay</h3>
                  <p className="text-[10px] text-purple-600 dark:text-purple-300 font-medium">
                    Gợi ý câu hỏi AI dựa trên nội dung bé {childNickname} vừa đọc
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-tod-surface border border-tod-border text-xs text-tod-text leading-relaxed font-medium">
                "Hôm nay khi nhân vật trong câu chuyện đối diện với thử thách và chọn cách sẻ chia với bạn bè, con cảm thấy hành động đó như thế nào? Nếu là con, con sẽ xử lý ra sao?"
              </div>

              {/* Audio voice sample player */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setIsPlayingAudioSample(!isPlayingAudioSample)}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-700 dark:text-purple-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isPlayingAudioSample ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlayingAudioSample ? 'Tạm dừng giọng đọc' : 'Nghe gợi ý giọng nói'}</span>
                </button>

                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setFeedbackRating('like')}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      feedbackRating === 'like'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300'
                        : 'bg-tod-surface border-tod-border text-tod-text-muted'
                    }`}
                  >
                    👍
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackRating('dislike')}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      feedbackRating === 'dislike'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-300'
                        : 'bg-tod-surface border-tod-border text-tod-text-muted'
                    }`}
                  >
                    👎
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: READING ACTIVITY LOG */}
        {activeTab === 'activity' && (
          <div className="desk-tab-content-item flex flex-col gap-3">
            <div className="p-3 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-tod-text">Nhật Ký Truyện Của Bé</span>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="py-1 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingPdf ? 'Đang Xuất...' : 'Xuất Báo Cáo'}</span>
                </button>
              </div>

              {/* Activity Rows */}
              {recentStories.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {recentStories.map((story) => (
                    <div
                      key={story.id}
                      className="p-2.5 rounded-xl bg-tod-surface border border-tod-border flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <strong className="text-tod-text block text-xs truncate">{story.title}</strong>
                        <span className="text-[10px] text-tod-text-muted">
                          {story.categoryName || story.ageBand} • {story.pages?.length || 1} trang • {story.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                        {story.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-tod-text-muted">
                  Bé chưa có truyện nào được tạo hoặc đọc gần đây.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
