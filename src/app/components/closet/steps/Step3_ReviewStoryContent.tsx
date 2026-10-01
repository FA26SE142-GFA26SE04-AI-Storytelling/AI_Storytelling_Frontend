'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Save,
  ArrowRight,
  ArrowLeft,
  Clock,
  FileText,
} from 'lucide-react';
import { aiStoryCreationService as api } from '../../../services/aiStoryCreationService';
import { AIProposalDto, ContentGenerationProgressDto, StoryReviewDto } from '../../../types/aiStory';
import { normalizeStoryStatus } from '../hooks/storyGenerationFlow';
import { useStoryProgressPolling } from '../hooks/useStoryProgressPolling';
import { StoryGeneratingWaitingState } from '../subcomponents/StoryGeneratingWaitingState';
import { StoryContentCheckEditor } from '../subcomponents/StoryContentCheckEditor';

export interface Step3_ReviewStoryContentProps {
  storyId: number;
  onProceedToQuiz: (storyId: number) => void;
  onBackToOutline?: () => void;
}

const loadGenProgress = (id: number, signal: AbortSignal) => api.getGenerationProgress(id, signal);
const isStillGenerating = (p: ContentGenerationProgressDto) => {
  const status = normalizeStoryStatus(p.storyStatus);
  if (['rejected', 'archived'].includes(status)) return false;
  if (status === 'content_review' || p.content === 'stable' || p.isComplete) return false;
  return !p.currentStep.startsWith('failed_');
};

export const Step3_ReviewStoryContent: React.FC<Step3_ReviewStoryContentProps> = ({
  storyId,
  onProceedToQuiz,
  onBackToOutline,
}) => {
  // 1. Polling tiến trình sinh Content nếu AI đang viết
  const poll = useStoryProgressPolling(storyId, loadGenProgress, isStillGenerating, 300_000);
  const progress = poll.data;

  const isContentReady =
    !!progress &&
    (normalizeStoryStatus(progress.storyStatus) === 'content_review' ||
      progress.content === 'stable' ||
      progress.isComplete ||
      typeof progress.stableStoryVersionId === 'number');

  // 2. Trạng thái kiểm tra & chỉnh sửa câu chuyện (Check Content)
  const [storyData, setStoryData] = useState<StoryReviewDto | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [lesson, setLesson] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loadingStory, setLoadingStory] = useState(false);

  // AI Partial Edit state
  const [selection, setSelection] = useState<{ start: number; endExclusive: number; text: string } | null>(null);
  const [aiInstruction, setAiInstruction] = useState('');
  const [proposal, setProposal] = useState<AIProposalDto | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      controller.current?.abort();
    };
  }, []);

  // Tải chi tiết câu chuyện khi Content đã hoàn thành
  const fetchStoryContent = useCallback(async () => {
    if (!isContentReady) return;
    setLoadingStory(true);
    setError(null);
    try {
      const c = new AbortController();
      controller.current = c;
      const res = await api.getStoryReview(storyId, c.signal);
      if (res.success && res.data) {
        setStoryData(res.data);
        setTitle(res.data.title || '');
        setContent(res.data.content || '');
        setLesson(res.data.lesson || '');
        setIsDirty(false);
      } else {
        setError(res.message || 'Không thể tải nội dung câu chuyện.');
      }
    } catch (err) {
      setError((err as Error).message || 'Lỗi tải câu chuyện.');
    } finally {
      setLoadingStory(false);
    }
  }, [isContentReady, storyId]);

  useEffect(() => {
    if (isContentReady && !storyData) {
      void fetchStoryContent();
    }
  }, [isContentReady, storyData, fetchStoryContent]);

  // Lưu chỉnh sửa câu chuyện
  const handleSaveContent = async () => {
    if (!storyData || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const c = new AbortController();
      controller.current = c;
      const res = await api.updateStoryReview(
        storyId,
        {
          versionId: storyData.versionId,
          title: title.trim(),
          content: content.trim(),
          lesson: lesson.trim(),
        },
        c.signal
      );
      if (res.success && res.data) {
        setStoryData(res.data);
        setIsDirty(false);
        setIsEditing(false);
        setSuccessMessage('Đã lưu nội dung câu chuyện thành công!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(res.message || 'Chưa thể lưu nội dung câu chuyện.');
      }
    } catch (err) {
      setError((err as Error).message || 'Lỗi kết nối khi lưu.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  // Đề xuất AI viết lại đoạn đã chọn
  const handleProposeAiEdit = async () => {
    if (!storyData || !selection || !aiInstruction.trim() || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const c = new AbortController();
      controller.current = c;
      const res = await api.partialEditStory(
        storyId,
        {
          versionId: storyData.versionId,
          selection,
          instruction: aiInstruction.trim(),
        },
        c.signal
      );
      if (res.success && res.data) {
        const propRes = await api.getProposal(storyId, res.data.proposalId, c.signal);
        if (propRes.success && propRes.data) {
          setProposal(propRes.data);
          setAiInstruction('');
        }
      } else {
        setError(res.message || 'Không thể tạo đề xuất viết lại.');
      }
    } catch (err) {
      setError((err as Error).message || 'Lỗi khi yêu cầu AI viết lại.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  // Quyết định áp dụng đề xuất AI
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
      await fetchStoryContent();
    } catch (err) {
      setError((err as Error).message || 'Lỗi xử lý đề xuất.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  // Làm lại toàn văn (Retry content)
  const handleRetryContent = async () => {
    if (lock.current) return;
    if (!window.confirm('Bạn có chắc muốn AI viết lại toàn bộ câu chuyện này không?')) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const c = new AbortController();
      controller.current = c;
      const res = await api.retryGeneration(storyId, { retryKey: crypto.randomUUID() }, c.signal);
      if (res.success) {
        setStoryData(null);
        poll.refresh();
      } else {
        setError(res.message || 'Chưa thể gửi yêu cầu viết lại câu chuyện.');
      }
    } catch (err) {
      setError((err as Error).message || 'Lỗi kết nối khi gửi yêu cầu.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  // Xác nhận nội dung và chuyển sang bước tạo Quiz
  const handleConfirmAndProceed = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const c = new AbortController();
      controller.current = c;

      if (isDirty && storyData) {
        await api.updateStoryReview(
          storyId,
          {
            versionId: storyData.versionId,
            title: title.trim(),
            content: content.trim(),
            lesson: lesson.trim(),
          },
          c.signal
        );
      }

      await api.completeStoryReview(storyId, c.signal);

      try {
        await api.generateArtifacts(
          storyId,
          {
            storyVersionId: storyData?.versionId,
            includeQuiz: true,
            includeVocabulary: true,
          },
          c.signal
        );
      } catch {
        // Bỏ qua nếu worker đã chạy
      }

      onProceedToQuiz(storyId);
    } catch (err) {
      setError((err as Error).message || 'Chưa thể chuyển sang bước tạo câu đố.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readMinutes = Math.max(1, Math.round(wordCount / 120));

  // --- MÀN HÌNH ĐANG VIẾT NỘI DUNG ---
  if (!isContentReady || loadingStory) {
    return (
      <StoryGeneratingWaitingState
        busy={busy}
        error={error || poll.error}
        onRefresh={poll.refresh}
        onBackToOutline={onBackToOutline}
      />
    );
  }

  // --- MÀN HÌNH SOÁT DUYỆT & KIỂM TRA NỘI DUNG (CHECK CONTENT SCREEN) ---
  return (
    <div className="dashboard-glass-panel p-5 sm:p-6 space-y-5">
      {/* Header bước kiểm tra */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-tod-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-500 border border-sky-500/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 text-[10px] font-black uppercase">
                Bước 1 / 3: Kiểm tra nội dung
              </span>
              {isDirty && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                  Chưa lưu
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-tod-text mt-0.5">
              Soát duyệt & Xác nhận câu chuyện
            </h3>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2 text-xs text-tod-text-muted">
          <span className="flex items-center gap-1 dashboard-card px-2.5 py-1">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>{wordCount} từ</span>
          </span>
          <span className="flex items-center gap-1 dashboard-card px-2.5 py-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>~{readMinutes} phút đọc</span>
          </span>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</p>}
      {successMessage && <p role="status" className="text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">{successMessage}</p>}

      {/* Editor & AI Rewrite subcomponent */}
      <StoryContentCheckEditor
        title={title}
        onTitleChange={(v) => { setTitle(v); setIsDirty(true); }}
        content={content}
        onContentChange={(v) => { setContent(v); setIsDirty(true); }}
        lesson={lesson}
        onLessonChange={(v) => { setLesson(v); setIsDirty(true); }}
        isEditing={isEditing}
        onToggleEditing={() => setIsEditing(!isEditing)}
        busy={busy}
        selection={selection}
        onSelectionChange={setSelection}
        aiInstruction={aiInstruction}
        onAiInstructionChange={setAiInstruction}
        onProposeAiEdit={() => void handleProposeAiEdit()}
        proposal={proposal}
        onDecideProposal={(apply) => void handleDecideProposal(apply)}
        textareaRef={textareaRef}
      />

      {/* Action Buttons Toolbar */}
      <div className="pt-4 border-t border-tod-border flex flex-wrap items-center justify-between gap-3">
        {/* Left actions: Quay lại hoặc làm lại */}
        <div className="flex items-center gap-2 flex-wrap">
          {onBackToOutline && (
            <button
              type="button"
              disabled={busy}
              onClick={onBackToOutline}
              className="dashboard-card px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 text-tod-text-muted hover:text-tod-text cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sửa dàn ý</span>
            </button>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => void handleRetryContent()}
            className="dashboard-card px-3.5 py-2 text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1.5 cursor-pointer"
            title="Yêu cầu AI viết lại hoàn toàn bản thảo khác"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Viết lại câu chuyện</span>
          </button>

          {isDirty && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSaveContent()}
              className="dashboard-card px-3.5 py-2 text-xs font-bold text-sky-500 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu thay đổi</span>
            </button>
          )}
        </div>

        {/* Right primary action: Xác nhận nội dung và đi tiếp sang tạo Quiz */}
        <button
          type="button"
          disabled={busy || !title.trim() || !content.trim()}
          onClick={() => void handleConfirmAndProceed()}
          className="btn-dashboard-primary px-5 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Xác nhận nội dung & Tạo câu đố</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
