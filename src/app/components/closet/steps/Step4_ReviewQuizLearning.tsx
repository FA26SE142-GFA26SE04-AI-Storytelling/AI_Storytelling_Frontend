'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  HelpCircle,
  BookA,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Edit3,
  Save,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { aiStoryCreationService as api } from '../../../services/aiStoryCreationService';
import {
  AIProposalDto,
  QuizQuestionDto,
  ReviewPackageDto,
  VocabularyItemDto,
} from '../../../types/aiStory';
import { AIStoryProposalPreview } from '../subcomponents/AIStoryProposalPreview';

export interface Step4_ReviewQuizLearningProps {
  storyId: number;
  onProceedToMedia: (storyId: number) => void;
  onBackToContent: () => void;
}

export const Step4_ReviewQuizLearning: React.FC<Step4_ReviewQuizLearningProps> = ({
  storyId,
  onProceedToMedia,
  onBackToContent,
}) => {
  const [activeTab, setActiveTab] = useState<'quiz' | 'vocabulary'>('quiz');

  // Dữ liệu Quiz & Từ vựng
  const [quizList, setQuizList] = useState<QuizQuestionDto[]>([]);
  const [vocabList, setVocabList] = useState<VocabularyItemDto[]>([]);
  const [versionId, setVersionId] = useState<number>(1);
  const [packageSummary, setPackageSummary] = useState<ReviewPackageDto | null>(null);

  const [loading, setLoading] = useState(true);
  const [isGeneratingArtifacts, setIsGeneratingArtifacts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Proposal state (khi AI sinh lại Quiz/Vocab)
  const [proposal, setProposal] = useState<AIProposalDto | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controller.current?.abort();
    };
  }, []);

  // Tải dữ liệu Quiz và Vocabulary
  const loadArtifacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = new AbortController();
      controller.current = c;

      const [pkgRes, quizRes, vocabRes] = await Promise.all([
        api.getReviewPackage(storyId, c.signal),
        api.getQuizReview(storyId, c.signal),
        api.getVocabularyReview(storyId, c.signal),
      ]);

      if (pkgRes.success && pkgRes.data) {
        setPackageSummary(pkgRes.data);
        setVersionId(pkgRes.data.storyVersionId);
      }

      const qItems = quizRes.success && quizRes.data?.items ? quizRes.data.items : [];
      const vItems = vocabRes.success && vocabRes.data?.items ? vocabRes.data.items : [];

      setQuizList(qItems);
      setVocabList(vItems);

      // Nếu chưa có câu hỏi hoặc từ vựng nào -> Kích hoạt sinh
      if (qItems.length === 0 && vItems.length === 0) {
        setIsGeneratingArtifacts(true);
        try {
          await api.generateArtifacts(
            storyId,
            { includeQuiz: true, includeVocabulary: true },
            c.signal
          );
          // Tải lại sau khi sinh
          const [qAfter, vAfter] = await Promise.all([
            api.getQuizReview(storyId, c.signal),
            api.getVocabularyReview(storyId, c.signal),
          ]);
          if (qAfter.success && qAfter.data?.items) setQuizList(qAfter.data.items);
          if (vAfter.success && vAfter.data?.items) setVocabList(vAfter.data.items);
        } catch {
          // Bỏ qua lỗi nếu backend đang xử lý ngầm
        } finally {
          setIsGeneratingArtifacts(false);
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Lỗi tải câu đố và từ vựng.');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    void loadArtifacts();
  }, [loadArtifacts]);

  // Cập nhật câu hỏi Quiz
  const updateQuizQuestion = (index: number, patch: Partial<QuizQuestionDto>) => {
    setQuizList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
    setIsDirty(true);
  };

  // Cập nhật lựa chọn (choices) của Quiz
  const updateQuizChoice = (qIndex: number, choiceIndex: number, value: string) => {
    setQuizList((prev) =>
      prev.map((item, i) => {
        if (i !== qIndex) return item;
        const newChoices = [...(item.choices || [])];
        newChoices[choiceIndex] = value;
        return { ...item, choices: newChoices };
      })
    );
    setIsDirty(true);
  };

  // Cập nhật từ vựng
  const updateVocabItem = (index: number, field: 'term' | 'definition', value: string) => {
    setVocabList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    setIsDirty(true);
  };

  // Lưu chỉnh sửa Quiz hoặc Từ vựng
  const handleSave = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const c = new AbortController();
      controller.current = c;
      if (activeTab === 'quiz') {
        const res = await api.updateQuizReview(storyId, { versionId, items: quizList }, c.signal);
        if (res.success) {
          setIsDirty(false);
          setIsEditing(false);
          setSuccessMessage('Đã lưu các câu đố thành công!');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(res.message || 'Chưa thể lưu câu đố.');
        }
      } else {
        const res = await api.updateVocabularyReview(storyId, { versionId, items: vocabList }, c.signal);
        if (res.success) {
          setIsDirty(false);
          setIsEditing(false);
          setSuccessMessage('Đã lưu từ vựng thành công!');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(res.message || 'Chưa thể lưu từ vựng.');
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Lỗi khi lưu.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  // Yêu cầu AI sinh lại Quiz hoặc Từ vựng
  const handleRegenerate = async (artifact: 'quiz' | 'vocabulary') => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const c = new AbortController();
      controller.current = c;
      const res = await api.regenerateReviewArtifact(storyId, artifact, c.signal);
      if (res.success && res.data) {
        const propRes = await api.getProposal(storyId, res.data.proposalId, c.signal);
        if (propRes.success && propRes.data) {
          setProposal(propRes.data);
        }
      } else {
        setError(res.message || `Không thể sinh lại ${artifact === 'quiz' ? 'câu đố' : 'từ vựng'}.`);
      }
    } catch (err) {
      setError((err as Error).message || 'Lỗi kết nối khi yêu cầu sinh lại.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  // Áp dụng hoặc bỏ qua Proposal
  const handleDecideProposal = async (apply: boolean) => {
    if (!proposal || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const c = new AbortController();
      controller.current = c;
      if (apply) {
        await api.applyProposal(storyId, proposal.proposalId, c.signal);
      } else {
        await api.discardProposal(storyId, proposal.proposalId, c.signal);
      }
      setProposal(null);
      await loadArtifacts();
    } catch (err) {
      setError((err as Error).message || 'Lỗi khi xử lý đề xuất.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  // Phê duyệt và chuyển tiếp sang sinh Media (Ảnh & Sound)
  const handleConfirmAndProceed = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const c = new AbortController();
      controller.current = c;

      // 1. Lưu thay đổi nếu có
      if (isDirty) {
        if (quizList.length > 0) {
          await api.updateQuizReview(storyId, { versionId, items: quizList }, c.signal);
        }
        if (vocabList.length > 0) {
          await api.updateVocabularyReview(storyId, { versionId, items: vocabList }, c.signal);
        }
      }

      // 2. Hoàn tất kiểm duyệt các phần
      await api.completeReview(storyId, 'quiz', c.signal);
      await api.completeReview(storyId, 'vocabulary', c.signal);

      // 3. Phê duyệt câu chuyện để kích hoạt tạo Media
      const approveRes = await api.approveStory(storyId, c.signal);
      if (approveRes.success) {
        onProceedToMedia(storyId);
      } else {
        setError(approveRes.message || 'Chưa thể phê duyệt câu chuyện.');
      }
    } catch (err) {
      setError((err as Error).message || 'Lỗi khi phê duyệt câu chuyện.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  // --- MÀN HÌNH ĐANG SINH CÂU ĐỐ (LOADING / GENERATING) ---
  if (loading || isGeneratingArtifacts) {
    return (
      <div className="dashboard-glass-panel p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-500 border border-sky-500/30 animate-pulse">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-tod-text">AI đang tạo câu đố & từ vựng...</h3>
            <p className="text-xs text-tod-text-muted mt-0.5">
              Phân tích nội dung câu chuyện để chuẩn bị các câu hỏi thú vị cho bé
            </p>
          </div>
        </div>

        <div className="dashboard-card p-6 border border-tod-border bg-tod-card/50 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-tod-text">
            <span>Tiến độ phân tích học liệu</span>
            <span className="text-sky-500 animate-pulse">Đang hoàn thiện câu hỏi...</span>
          </div>
          <div className="w-full bg-tod-surface h-2.5 rounded-full overflow-hidden border border-tod-border">
            <div className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full w-3/4 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadArtifacts()}
            className="dashboard-card px-4 py-2 text-xs font-bold"
          >
            Kiểm tra trạng thái
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onBackToContent}
            className="dashboard-card px-4 py-2 text-xs font-bold text-tod-text-muted hover:text-tod-text"
          >
            Quay lại sửa truyện
          </button>
        </div>
      </div>
    );
  }

  // --- MÀN HÌNH KIỂM TRA CÂU ĐỐ & TỪ VỰNG (CHECK QUIZ SCREEN) ---
  return (
    <div className="dashboard-glass-panel p-5 sm:p-6 space-y-5">
      {/* Header bước kiểm tra */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-tod-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-black uppercase">
                Bước 2 / 3: Kiểm tra câu đố
              </span>
              {isDirty && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                  Chưa lưu
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-tod-text mt-0.5">
              Kiểm tra & Tinh chỉnh câu đố cho bé
            </h3>
          </div>
        </div>

        {/* Tab Switcher: Câu đố vs Từ vựng */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-tod-card border border-tod-border">
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-tod-text-muted hover:text-tod-text'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Câu đố trắc nghiệm ({quizList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vocabulary')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'vocabulary'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-tod-text-muted hover:text-tod-text'
            }`}
          >
            <BookA className="w-3.5 h-3.5" />
            <span>Từ vựng bổ ích ({vocabList.length})</span>
          </button>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</p>}
      {successMessage && <p role="status" className="text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">{successMessage}</p>}

      {/* Preview đề xuất AI sinh lại */}
      {proposal && (
        <div className="dashboard-card p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Xem trước bộ câu đố mới do AI gợi ý</span>
          </div>
          <div className="max-h-52 overflow-y-auto rounded-xl p-3 bg-tod-surface border border-tod-border text-xs">
            <AIStoryProposalPreview proposal={proposal} />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDecideProposal(false)}
              className="dashboard-card px-3.5 py-1.5 text-xs font-bold"
            >
              Bỏ qua
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDecideProposal(true)}
              className="btn-dashboard-primary px-4 py-1.5 text-xs font-bold"
            >
              Áp dụng bộ câu đố này
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 dashboard-scrollbar">
        {/* TAB 1: CÂU ĐỐ TRẮC NGHIỆM */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-tod-text-muted">
              <span>Danh sách câu hỏi đố vui sau khi đọc truyện</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sky-500 hover:text-sky-400 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Khóa chỉnh sửa' : 'Chỉnh sửa câu đố'}</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRegenerate('quiz')}
                  className="text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đổi bộ câu hỏi khác</span>
                </button>
              </div>
            </div>

            {quizList.map((item, qIdx) => (
              <div
                key={item.id ?? qIdx}
                className="dashboard-card p-4 rounded-2xl border border-tod-border bg-tod-card/50 space-y-3"
              >
                {/* Câu hỏi */}
                <div className="flex items-start gap-2.5">
                  <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-500 text-xs font-black shrink-0">
                    Câu {qIdx + 1}
                  </span>
                  <div className="flex-1">
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={item.question}
                        onChange={(e) => updateQuizQuestion(qIdx, { question: e.target.value })}
                        className="dashboard-input w-full p-2.5 text-xs font-bold rounded-xl border border-tod-border"
                      />
                    ) : (
                      <p className="text-xs sm:text-sm font-bold text-tod-text">{item.question}</p>
                    )}
                  </div>
                </div>

                {/* Các lựa chọn A, B, C, D */}
                <div className="grid gap-2 sm:grid-cols-2 pt-1">
                  {(item.choices || []).map((choice, cIdx) => {
                    const isCorrect = item.correctAnswer === choice;
                    return (
                      <div
                        key={cIdx}
                        onClick={() => {
                          if (isEditing) updateQuizQuestion(qIdx, { correctAnswer: choice });
                        }}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                          isCorrect
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                            : 'bg-tod-surface border-tod-border text-tod-text'
                        } ${isEditing ? 'cursor-pointer hover:border-sky-400' : ''}`}
                      >
                        <span className="w-5 h-5 rounded-full bg-tod-card border border-tod-border flex items-center justify-center text-[10px] font-black shrink-0">
                          {String.fromCharCode(65 + cIdx)}
                        </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={choice}
                            onChange={(e) => updateQuizChoice(qIdx, cIdx, e.target.value)}
                            className="dashboard-input flex-1 p-1 text-xs rounded-lg border-0 bg-transparent"
                          />
                        ) : (
                          <span className="flex-1">{choice}</span>
                        )}
                        {isCorrect && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
                {isEditing && (
                  <p className="text-[11px] text-tod-text-muted italic">
                    👉 Bấm vào ô lựa chọn để đặt làm đáp án đúng (có dấu tích xanh).
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: TỪ VỰNG BỔ ÍCH */}
        {activeTab === 'vocabulary' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-tod-text-muted">
              <span>Các từ ngữ mới và giải nghĩa dễ hiểu cho bé</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sky-500 hover:text-sky-400 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Khóa chỉnh sửa' : 'Chỉnh sửa từ vựng'}</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRegenerate('vocabulary')}
                  className="text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sinh lại từ vựng</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {vocabList.map((item, vIdx) => (
                <div
                  key={item.id ?? vIdx}
                  className="dashboard-card p-3.5 rounded-2xl border border-tod-border bg-tod-card/50 space-y-2"
                >
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={item.term}
                        onChange={(e) => updateVocabItem(vIdx, 'term', e.target.value)}
                        placeholder="Từ vựng..."
                        className="dashboard-input w-full p-2 text-xs font-bold rounded-xl border border-tod-border"
                      />
                      <textarea
                        rows={2}
                        value={item.definition}
                        onChange={(e) => updateVocabItem(vIdx, 'definition', e.target.value)}
                        placeholder="Giải nghĩa cho bé..."
                        className="dashboard-input w-full p-2 text-xs rounded-xl border border-tod-border"
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black">
                          {item.term}
                        </span>
                      </div>
                      <p className="text-xs text-tod-text-muted leading-relaxed">{item.definition}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Toolbar */}
      <div className="pt-4 border-t border-tod-border flex flex-wrap items-center justify-between gap-3">
        {/* Left actions: Quay lại sửa truyện hoặc lưu */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onBackToContent}
            className="dashboard-card px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 text-tod-text-muted hover:text-tod-text"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sửa nội dung truyện</span>
          </button>

          {isDirty && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSave()}
              className="dashboard-card px-3.5 py-2 text-xs font-bold text-sky-500 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu thay đổi</span>
            </button>
          )}
        </div>

        {/* Right primary action: Xác nhận câu đố & chuyển sang tạo Tranh, Giọng đọc */}
        <button
          type="button"
          disabled={busy || quizList.length === 0}
          onClick={() => void handleConfirmAndProceed()}
          className="btn-dashboard-primary px-5 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Xác nhận câu đố & Tạo tranh, giọng đọc</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
