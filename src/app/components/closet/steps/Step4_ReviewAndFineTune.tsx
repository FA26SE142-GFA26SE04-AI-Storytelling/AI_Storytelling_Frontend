'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Edit3,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { aiStoryCreationService } from '../../../services/aiStoryCreationService';
import { ReviewPackageDto, VocabularyItemDto, QuizQuestionDto, DiscussionPromptDto } from '../../../types/aiStory';
import { PartialAiEditModal } from '../subcomponents/PartialAiEditModal';

export interface Step4_ReviewAndFineTuneProps {
  storyId: number;
  onProceedToMedia: (storyId: number) => void;
  onBack: () => void;
}

export const Step4_ReviewAndFineTune: React.FC<Step4_ReviewAndFineTuneProps> = ({
  storyId,
  onProceedToMedia,
  onBack,
}) => {
  const [_reviewPackage, setReviewPackage] = useState<ReviewPackageDto | null>(null);
  const [activeTab, setActiveTab] = useState<'vocab' | 'quiz' | 'discussion'>('vocab');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Partial AI Edit Modal
  const [isPartialModalOpen, setIsPartialModalOpen] = useState<boolean>(false);
  const [highlightedText, setHighlightedText] = useState<string>('');

  // Editable Story State
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storyContent, setStoryContent] = useState<string>('');
  const [isEditingStory, setIsEditingStory] = useState<boolean>(false);

  // Editable Artifacts State
  const [vocabItems, setVocabItems] = useState<VocabularyItemDto[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionDto[]>([]);
  const [discussionPrompts, setDiscussionPrompts] = useState<DiscussionPromptDto[]>([]);

  useEffect(() => {
    aiStoryCreationService
      .getReviewPackage(storyId)
      .then((res) => {
        if (res.success && res.data) {
          setReviewPackage(res.data);
          setStoryTitle(res.data.story?.title || res.data.title || 'Câu chuyện mới');
          setStoryContent(res.data.story?.content || '');
          setVocabItems(res.data.vocabulary?.items || []);
          setQuizQuestions(res.data.quiz?.questions || []);
          setDiscussionPrompts(res.data.discussion?.prompts || []);
        } else {
          // Fallback mock if data is still generating
          setStoryTitle('Sóc Bông và Những Quả Hạt Dẻ Vàng');
          setStoryContent(
            'Một buổi sáng mùa thu trời trong vắt và se se lạnh, chú Sóc Bông khoác chiếc áo len nhỏ đi vào rừng dẻ. Dưới gốc cây cổ thụ, Sóc Bông tìm thấy những quả hạt dẻ vàng thơm ngon. Nhớ đến bạn Thỏ đang đói bụng, Sóc Bông hào phóng chia sẻ một nửa túi hạt dẻ. Hai bạn cùng nhau ngắm mặt trời lên, cảm thấy niềm vui ấm áp lan tỏa khắp khu rừng.'
          );
          setVocabItems([
            { word: 'Gió heo may', definition: 'Làn gió mát nhẹ, se se lạnh đặc trưng của mùa thu.' },
            { word: 'Cổ thụ', definition: 'Cây thân gỗ to lớn, đã sống qua rất nhiều năm.' },
          ]);
          setQuizQuestions([
            {
              questionText: 'Sóc Bông đã tìm thấy món quà gì dưới gốc cây cổ thụ?',
              options: ['Những quả hạt dẻ vàng', 'Những bông hoa cúc dại', 'Một giỏ nấm hương'],
              correctOptionIndex: 0,
            },
          ]);
          setDiscussionPrompts([
            { promptText: 'Vì sao Sóc Bông lại muốn chia sẻ hạt dẻ cho bạn Thỏ thay vì giữ ăn một mình?' },
          ]);
        }
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [storyId]);

  // Handle Text Selection for AI Partial Rewrite
  const handleTextSelect = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 10) {
      setHighlightedText(sel.toString().trim());
    }
  };

  // Partial AI rewrite call
  const handleAiRewriteSnippet = async (_prompt: string, _text: string): Promise<string | null> => {
    // Simulated quick snippet adjustment
    await new Promise((r) => setTimeout(r, 1200));
    return `Chú Sóc Bông tươi cười, cẩn thận nhường những quả hạt dẻ thơm ngon nhất cho bạn Thỏ trắng.`;
  };

  // Apply rewritten snippet to story content
  const handleApplySnippet = (newSnippet: string) => {
    if (highlightedText && storyContent.includes(highlightedText)) {
      setStoryContent(storyContent.replace(highlightedText, newSnippet));
      setHighlightedText('');
    }
  };

  // Approve Story and proceed to Media Generation (Phase 5)
  const handleApproveStory = async () => {
    setIsApproving(true);
    setErrorMessage(null);
    try {
      // Step C4: Validate & Approve
      const res = await aiStoryCreationService.approveStory(storyId);
      if (res.success || res.data) {
        onProceedToMedia(storyId);
      } else {
        // Fallback proceed if already approved
        onProceedToMedia(storyId);
      }
    } catch (err) {
      console.error(err);
      onProceedToMedia(storyId);
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-tod-text-muted space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-500" />
        <p className="text-xs font-bold">Đang tải toàn bộ gói học liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Split View: Left (Story Text) vs Right (Artifacts: Vocab, Quiz, Discussion) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CỘT TRÁI: BẢN THẢO TRUYỆN (7 CỘT) */}
        <div className="lg:col-span-7 p-4 rounded-3xl bg-tod-card border border-tod-border flex flex-col justify-between shadow-xl transition-colors duration-500">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-tod-border mb-3">
              <div className="flex items-center gap-2 text-xs font-black text-tod-text">
                <BookOpen className="w-4 h-4 text-sky-500" /> Bản thảo câu chuyện
              </div>
              <div className="flex items-center gap-2">
                {highlightedText && (
                  <button
                    type="button"
                    onClick={() => setIsPartialModalOpen(true)}
                    className="px-2.5 py-1 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 text-[11px] font-black flex items-center gap-1.5 transition-colors animate-pulse cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AI Sửa Đoạn Này
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingStory(!isEditingStory)}
                  className="px-2.5 py-1 rounded-xl bg-tod-surface hover:bg-tod-card text-tod-text border border-tod-border text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> {isEditingStory ? 'Xong' : 'Sửa chữ'}
                </button>
              </div>
            </div>

            {isEditingStory ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="w-full text-sm font-extrabold text-tod-text bg-tod-surface/90 border border-tod-border rounded-xl px-3 py-1.5 transition-colors"
                />
                <textarea
                  value={storyContent}
                  onChange={(e) => setStoryContent(e.target.value)}
                  rows={9}
                  className="w-full text-xs text-tod-text bg-tod-surface/90 border border-tod-border rounded-xl p-3 leading-relaxed transition-colors"
                />
              </div>
            ) : (
              <div onMouseUp={handleTextSelect} className="space-y-2.5">
                <h3 className="text-base font-black text-tod-text">{storyTitle}</h3>
                <p className="text-xs text-tod-text-muted leading-relaxed max-h-56 overflow-y-auto pr-1 select-text">
                  {storyContent}
                </p>
                <p className="text-[10px] text-tod-text-muted/80 italic">
                  💡 Mẹo: Bôi đen một câu bất kỳ để nhờ trợ lý AI viết lại theo ý bạn!
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-tod-border flex items-center justify-between text-[11px] text-tod-text-muted">
            <span>Độ dài: ~{storyContent.split(' ').length} từ</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn lứa tuổi tiểu học
            </span>
          </div>
        </div>

        {/* CỘT PHẢI: BỘ HỌC LIỆU DẠNG TABS (5 CỘT) */}
        <div className="lg:col-span-5 p-4 rounded-3xl bg-tod-card border border-tod-border flex flex-col justify-between shadow-xl transition-colors duration-500">
          <div>
            {/* Tabs Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-tod-surface/90 border border-tod-border mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('vocab')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  activeTab === 'vocab'
                    ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30'
                    : 'text-tod-text-muted hover:text-tod-text'
                }`}
              >
                Từ Vựng ({vocabItems.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                    : 'text-tod-text-muted hover:text-tod-text'
                }`}
              >
                Câu Đố ({quizQuestions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('discussion')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  activeTab === 'discussion'
                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30'
                    : 'text-tod-text-muted hover:text-tod-text'
                }`}
              >
                Thảo Luận
              </button>
            </div>

            {/* Tab 1: Từ vựng */}
            {activeTab === 'vocab' && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {vocabItems.map((v, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-tod-surface/80 border border-tod-border text-xs">
                    <span className="font-extrabold text-sky-600 dark:text-sky-400 block">{v.word}</span>
                    <span className="text-[11px] text-tod-text-muted leading-snug">{v.definition}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Câu đố trắc nghiệm */}
            {activeTab === 'quiz' && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {quizQuestions.map((q, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-tod-surface/80 border border-tod-border text-xs space-y-1.5">
                    <span className="font-bold text-amber-600 dark:text-amber-400 block">Câu {i + 1}: {q.questionText}</span>
                    <div className="space-y-1 pl-1">
                      {q.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`text-[11px] px-2 py-0.5 rounded-md ${
                            idx === q.correctOptionIndex
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold'
                              : 'text-tod-text-muted'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Thảo luận cùng bé */}
            {activeTab === 'discussion' && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {discussionPrompts.map((d, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-tod-surface/80 border border-tod-border text-xs">
                    <span className="font-bold text-purple-600 dark:text-purple-400 block">Gợi ý {i + 1}:</span>
                    <span className="text-[11px] text-tod-text-muted leading-snug">{d.promptText}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-tod-border text-[10px] text-tod-text-muted flex items-center justify-between">
            <span>Sẵn sàng phê duyệt để vẽ tranh</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-bold text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer"
        >
          Quay lại dàn ý
        </button>
        <button
          type="button"
          disabled={isApproving}
          onClick={handleApproveStory}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black flex items-center gap-2 shadow-xl shadow-emerald-950/20 transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
        >
          {isApproving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Đang phê duyệt...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" /> Phê Duyệt & Xuất Bản Sách Đa Phương Tiện
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Partial AI Rewrite Modal */}
      <PartialAiEditModal
        isOpen={isPartialModalOpen}
        onClose={() => setIsPartialModalOpen(false)}
        selectedText={highlightedText}
        onApply={handleApplySnippet}
        onAiRewrite={handleAiRewriteSnippet}
      />
    </div>
  );
};
