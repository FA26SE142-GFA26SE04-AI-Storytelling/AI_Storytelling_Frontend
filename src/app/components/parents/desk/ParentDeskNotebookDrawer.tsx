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
} from 'lucide-react';

export interface ParentDeskNotebookDrawerProps {
  activeTab: 'stats' | 'conversation' | 'activity';
  setActiveTab: (tab: 'stats' | 'conversation' | 'activity') => void;
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
          <span>Thống Kê Đọc Tuần</span>
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
          <span>Gợi Ý Trò Chuyện AI</span>
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
          <span>Nhật Ký & Báo Cáo</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 p-4 overflow-y-auto dashboard-scrollbar">
        {/* TAB 1: WEEKLY STATS */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-3.5">
            {/* 4 Quick Stat Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="desk-stat-card p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Thời gian đọc tuần
                </span>
                <strong className="text-lg font-black text-tod-text">145 Phút</strong>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">+18% so với tuần trước</span>
              </div>

              <div className="desk-stat-card p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> Truyện đã đọc
                </span>
                <strong className="text-lg font-black text-tod-text">12 Câu Truyện</strong>
                <span className="text-[9px] text-purple-600 dark:text-purple-300 font-bold">5 truyện tự tạo AI</span>
              </div>

              <div className="desk-stat-card p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5" /> Chỉ số EQ & Nhân ái
                </span>
                <strong className="text-lg font-black text-tod-text">94 / 100</strong>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-300 font-bold">Xuất sắc bài học chia sẻ</span>
              </div>

              <div className="desk-stat-card p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Từ vựng học được
                </span>
                <strong className="text-lg font-black text-tod-text">28 Từ Mới</strong>
                <span className="text-[9px] text-amber-600 dark:text-amber-300 font-bold">Tiếng Việt & Tiếng Anh</span>
              </div>
            </div>

            {/* EQ & Competency Progress Bar */}
            <div className="desk-tab-content-item p-3.5 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-tod-text">Tiến trình rèn luyện cảm xúc tuần này</span>
                <span className="text-sky-500 font-bold">85% Hoàn thành</span>
              </div>
              <div className="w-full h-2 bg-tod-surface border border-tod-border rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 w-[85%] rounded-full" />
              </div>
              <p className="text-[10px] text-tod-text-muted leading-normal mt-0.5">
                Bé Bo đã thể hiện sự thấu hiểu tuyệt vời thông qua các lựa chọn ứng xử trong truyện "Chiếc Bánh Quy Biết Bay".
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
                  <p className="text-[10px] text-purple-600 dark:text-purple-300 font-medium">Gợi ý câu hỏi AI dựa trên truyện hôm nay</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-tod-surface border border-tod-border text-xs text-tod-text leading-relaxed font-medium">
                "Hôm nay khi chú thỏ Bông nướng bánh quy và chia sẻ cho cả xóm làng, con cảm thấy hành động đó như thế nào? Nếu là con, con sẽ chia sẻ món quà nào cho bạn bè?"
              </div>

              {/* Audio voice sample player */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setIsPlayingAudioSample(!isPlayingAudioSample)}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-700 dark:text-purple-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isPlayingAudioSample ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlayingAudioSample ? 'Tạm dừng giọng đọc' : 'Nghe gợi ý giọng nói'}</span>
                </button>

                <div className="flex items-center gap-1 text-xs">
                  <button
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

        {/* TAB 3: READING ACTIVITY LOG & PDF REPORT */}
        {activeTab === 'activity' && (
          <div className="desk-tab-content-item flex flex-col gap-3">
            <div className="p-3 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-tod-text">Nhật Ký Đọc Gần Đây</span>
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="py-1 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingPdf ? 'Đang Xuất...' : 'Xuất PDF Tuần'}</span>
                </button>
              </div>

              {/* Activity Rows */}
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-tod-surface border border-tod-border flex items-center justify-between">
                  <div>
                    <strong className="text-tod-text block text-[11px]">Chiếc Bánh Quy Biết Bay Của Thỏ Bông</strong>
                    <span className="text-[10px] text-tod-text-muted">12/03 • 8 phút • Bé An đồng tác giả AI</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold">100%</span>
                </div>

                <div className="p-2 rounded-xl bg-tod-surface border border-tod-border flex items-center justify-between">
                  <div>
                    <strong className="text-tod-text block text-[11px]">Khủng Long Dino Đi Tìm Mẹ Thần Tiên</strong>
                    <span className="text-[10px] text-tod-text-muted">09/03 • 12 phút • Nghe trước ngủ</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold">100%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
