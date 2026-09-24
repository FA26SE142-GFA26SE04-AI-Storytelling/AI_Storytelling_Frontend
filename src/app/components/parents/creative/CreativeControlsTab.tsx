'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  Wand2,
  BookPlus,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Compass,
} from 'lucide-react';
import { ChildProfile } from '../../../types/childProfile';
import { aiStoryCreationService } from '../../../services/aiStoryCreationService';
import { existingStoryService } from '../../../services/existingStoryService';
import { AIStoryInputContextDto, AIStoryInputProgressDto, OutlineProgressDto } from '../../../types/aiStory';

export interface CreativeControlsTabProps {
  selectedChild?: ChildProfile | null;
  isPlayingAudio: boolean;
  setIsPlayingAudio: (val: boolean) => void;
  feedbackRating: 'like' | 'dislike' | null;
  setFeedbackRating: (val: 'like' | 'dislike' | null) => void;
}

export const CreativeControlsTab: React.FC<CreativeControlsTabProps> = ({
  selectedChild,
  isPlayingAudio,
  setIsPlayingAudio,
  feedbackRating,
  setFeedbackRating,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'import' | 'starters'>('create');

  // Creation State
  const [creationContext, setCreationContext] = useState<AIStoryInputContextDto | null>(null);
  const [promptInput, setPromptInput] = useState<string>('');
  const [genreInput, setGenreInput] = useState<string>('Thám hiểm & Phép thuật');
  const [lessonInput, setLessonInput] = useState<string>('Lòng dũng cảm & Tinh thần sẻ chia');
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState<boolean>(false);
  const [createdProgress, setCreatedProgress] = useState<AIStoryInputProgressDto | null>(null);
  const [outlineProgress, setOutlineProgress] = useState<OutlineProgressDto | null>(null);
  const [creationFeedback, setCreationFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Import State
  const [importTitle, setImportTitle] = useState<string>('');
  const [importContent, setImportContent] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load Creation Context when selected child changes
  useEffect(() => {
    if (selectedChild) {
      aiStoryCreationService.getCreationContext(selectedChild.id).then((res) => {
        if (res.success && res.data) {
          setCreationContext(res.data);
        }
      });
    } else {
      setCreationContext(null);
    }
  }, [selectedChild]);

  // Handle Submit AI Story Prompt
  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) {
      setCreationFeedback({ type: 'error', message: 'Vui lòng chọn một hồ sơ bé trước khi tạo truyện.' });
      return;
    }
    if (!promptInput.trim()) {
      setCreationFeedback({ type: 'error', message: 'Vui lòng nhập ý tưởng hoặc chủ đề truyện.' });
      return;
    }

    setIsSubmittingPrompt(true);
    setCreationFeedback(null);

    try {
      const res = await aiStoryCreationService.submitInput({
        childProfileId: selectedChild.id,
        prompt: promptInput.trim(),
        genre: genreInput,
        targetLesson: lessonInput,
      });

      if (res.success && res.data) {
        setCreatedProgress(res.data);
        setCreationFeedback({
          type: 'success',
          message: 'Ý tưởng đã được tiếp nhận và kiểm duyệt an toàn thành công!',
        });

        // Fetch outline for the created story
        if (res.data.storyId) {
          const outlineRes = await aiStoryCreationService.getOutline(res.data.storyId);
          if (outlineRes.success && outlineRes.data) {
            setOutlineProgress(outlineRes.data);
          }
        }
      } else {
        setCreationFeedback({
          type: 'error',
          message: res.message || 'Không thể tạo truyện. Vui lòng kiểm tra lại nội dung.',
        });
      }
    } catch {
      setCreationFeedback({ type: 'error', message: 'Lỗi kết nối khi gửi ý tưởng truyện.' });
    } finally {
      setIsSubmittingPrompt(false);
    }
  };

  // Handle Import Story
  const handleImportStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) {
      setImportFeedback({ type: 'error', message: 'Vui lòng chọn một hồ sơ bé.' });
      return;
    }
    if (!importTitle.trim() || !importContent.trim()) {
      setImportFeedback({ type: 'error', message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung truyện.' });
      return;
    }

    setIsImporting(true);
    setImportFeedback(null);

    try {
      const res = await existingStoryService.importStory({
        childProfileId: selectedChild.id,
        title: importTitle.trim(),
        content: importContent.trim(),
      });

      if (res.success && res.data) {
        setImportFeedback({
          type: 'success',
          message: `Import thành công truyện "${importTitle}"! AI đang tự động đánh giá an toàn.`,
        });
        setImportTitle('');
        setImportContent('');
      } else {
        setImportFeedback({ type: 'error', message: res.message || 'Không thể import câu chuyện.' });
      }
    } catch {
      setImportFeedback({ type: 'error', message: 'Lỗi kết nối máy chủ.' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4 text-tod-text">
      {/* Sub-tab Navigation */}
      <div className="flex p-1 rounded-2xl bg-tod-card border border-tod-border gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab('create')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'create'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-tod-text-muted hover:text-tod-text'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Sáng Tạo Truyện AI</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('import')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'import'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-tod-text-muted hover:text-tod-text'
          }`}
        >
          <BookPlus className="w-3.5 h-3.5" />
          <span>Nhập Truyện Có Sẵn</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('starters')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'starters'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-tod-text-muted hover:text-tod-text'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gợi Ý Trò Chuyện</span>
        </button>
      </div>

      {/* SUB-TAB 1: AI STORY CREATION */}
      {activeSubTab === 'create' && (
        <div className="space-y-3">
          <form onSubmit={handleSubmitPrompt} className="p-4 rounded-2xl bg-tod-card border border-purple-500/30 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-tod-text">
                    Sáng Tạo Cốt Truyện Cho Bé {selectedChild ? selectedChild.nickname : ''}
                  </h3>
                  <p className="text-[10px] text-purple-400 font-medium">
                    AI cá nhân hóa theo độ tuổi nhận thức và sở thích của bé
                  </p>
                </div>
              </div>

              {creationContext && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-extrabold text-amber-500">
                  ⚡ {creationContext.tokenBalance} Tokens
                </span>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-tod-text block mb-1">Ý tưởng hoặc thế giới bé muốn khám phá:</label>
              <textarea
                rows={2}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="VD: Một chú gấu trúc nhỏ muốn học lái tàu vũ trụ bay đến hành tinh kẹo bông gòn..."
                className="dashboard-input text-xs w-full resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-tod-text-muted block mb-0.5">Thể loại truyện:</label>
                <select
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  className="dashboard-input text-xs w-full py-1.5"
                >
                  <option value="Thám hiểm & Phép thuật">Thám hiểm & Phép thuật</option>
                  <option value="Khoa học & Vũ trụ">Khoa học & Vũ trụ</option>
                  <option value="Động vật & Thiên nhiên">Động vật & Thiên nhiên</option>
                  <option value="Tình bạn & Trường học">Tình bạn & Trường học</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-tod-text-muted block mb-0.5">Bài học đạo đức / Kỹ năng:</label>
                <input
                  type="text"
                  value={lessonInput}
                  onChange={(e) => setLessonInput(e.target.value)}
                  className="dashboard-input text-xs w-full py-1.5"
                />
              </div>
            </div>

            {creationFeedback && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
                  creationFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                {creationFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{creationFeedback.message}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmittingPrompt || !selectedChild}
                className="btn-dashboard-primary text-xs px-5 py-2 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingPrompt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isSubmittingPrompt ? 'Đang tạo dàn ý...' : 'Bắt Đầu Sáng Tạo AI'}</span>
              </button>
            </div>
          </form>

          {/* Outline Display if generated */}
          {outlineProgress?.currentVersion && (
            <div className="p-3.5 rounded-2xl bg-tod-card border border-tod-border space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-tod-text flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-sky-400" />
                  <span>Dàn Ý: {outlineProgress.currentVersion.title}</span>
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-extrabold">
                  {outlineProgress.currentVersion.status}
                </span>
              </div>
              <p className="text-xs text-tod-text-muted leading-relaxed">
                {outlineProgress.currentVersion.synopsis}
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: IMPORT EXISTING STORY */}
      {activeSubTab === 'import' && (
        <form onSubmit={handleImportStory} className="p-4 rounded-2xl bg-tod-card border border-purple-500/30 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <BookPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-tod-text">Nhập Truyện Hoặc Sách Có Sẵn</h3>
              <p className="text-[10px] text-purple-400 font-medium">
                AI sẽ đánh giá an toàn và đề xuất chuyển thể phù hợp với bé
              </p>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-tod-text block mb-1">Tiêu đề truyện:</label>
            <input
              type="text"
              value={importTitle}
              onChange={(e) => setImportTitle(e.target.value)}
              placeholder="VD: Cây Khế Thần Kỳ"
              className="dashboard-input text-xs w-full"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-tod-text block mb-1">Nội dung câu chuyện:</label>
            <textarea
              rows={4}
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              placeholder="Dán nội dung truyện thô vào đây..."
              className="dashboard-input text-xs w-full resize-none"
            />
          </div>

          {importFeedback && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
                importFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              {importFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{importFeedback.message}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isImporting || !selectedChild}
              className="btn-dashboard-primary text-xs px-5 py-2 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              <span>{isImporting ? 'Đang import...' : 'Nhập & Đánh Giá Truyện'}</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 3: CONVERSATION STARTERS */}
      {activeSubTab === 'starters' && (
        <div className="p-4 rounded-2xl bg-tod-card border border-purple-500/30 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-tod-text">Chủ Đề Trò Chuyện Tối Nay Với Bé</h3>
              <p className="text-[10px] text-purple-400 font-medium">
                Gợi ý câu hỏi AI dựa theo cốt truyện bé vừa đọc
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-tod-surface border border-tod-border text-xs text-tod-text leading-relaxed font-medium">
            "Hôm nay khi chú thỏ Bông nướng bánh quy và chia sẻ cho cả xóm làng, con cảm thấy hành động đó
            như thế nào? Nếu là con, con sẽ chia sẻ món quà nào cho các bạn ở lớp?"
          </div>

          {/* Audio sample toggle & feedback */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlayingAudio ? 'Tạm dừng giọng đọc' : 'Nghe gợi ý giọng nói'}</span>
            </button>

            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setFeedbackRating('like')}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  feedbackRating === 'like'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                    : 'bg-tod-surface border-tod-border text-tod-text-muted hover:text-tod-text'
                }`}
              >
                👍 Thích
              </button>
              <button
                type="button"
                onClick={() => setFeedbackRating('dislike')}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  feedbackRating === 'dislike'
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                    : 'bg-tod-surface border-tod-border text-tod-text-muted hover:text-tod-text'
                }`}
              >
                👎
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
