'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  Sparkles,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Check,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { aiStoryCreationService } from '../../../services/aiStoryCreationService';
import { ChildProfile } from '../../../types/childProfile';
import {
  AIStoryInputContextDto,
  AIStoryInputProgressDto,
  OutlineProgressDto,
} from '../../../types/aiStory';
import { ThreeActsOutlineView } from '../subcomponents/ThreeActsOutlineView';

export interface Step2A_AiPromptAndOutlineProps {
  selectedChild: ChildProfile | null;
  onProceedToConvergence: (storyId: number) => void;
  onBack: () => void;
}

export const Step2A_AiPromptAndOutline: React.FC<Step2A_AiPromptAndOutlineProps> = ({
  selectedChild,
  onProceedToConvergence,
  onBack,
}) => {
  // Phase inside 2A: 'input' -> 'checking_guardrail' -> 'outline_ready'
  const [subPhase, setSubPhase] = useState<'input' | 'checking_guardrail' | 'outline_ready'>('input');

  // Input states
  const [context, setContext] = useState<AIStoryInputContextDto | null>(null);
  const [topicPrompt, setTopicPrompt] = useState<string>('');
  const [genre, setGenre] = useState<string>('Thám hiểm & Phép thuật');
  const [lesson, setLesson] = useState<string>('Lòng dũng cảm và sự sẻ chia cùng bạn bè');
  const [characters, setCharacters] = useState<string>('Sóc Bông, Thỏ Trắng');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guardrail & Outline states
  const [createdStoryId, setCreatedStoryId] = useState<number | null>(null);
  const [createdRequestId, setCreatedRequestId] = useState<number | null>(null);
  const [guardrailStatus, setGuardrailStatus] = useState<AIStoryInputProgressDto | null>(null);
  const [outlineData, setOutlineData] = useState<OutlineProgressDto | null>(null);

  // Outline Editing states
  const [isEditingOutline, setIsEditingOutline] = useState<boolean>(false);
  const [editValues, setEditValues] = useState<{
    title: string;
    opening: string;
    development: string;
    ending: string;
  }>({ title: '', opening: '', development: '', ending: '' });
  const [isSavingOutline, setIsSavingOutline] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Nạp Context cấu hình an toàn cho trẻ (Step A1)
  useEffect(() => {
    if (selectedChild) {
      aiStoryCreationService.getCreationContext(selectedChild.id).then((res) => {
        if (res.success && res.data) {
          setContext(res.data);
          if (res.data.favoriteTopics && res.data.favoriteTopics.length > 0) {
            setTopicPrompt(`Chuyến phiêu lưu của những người bạn về chủ đề ${res.data.favoriteTopics[0]}`);
          }
        }
      });
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedChild]);

  // 2. Gửi ý tưởng tạo truyện (Step A2)
  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicPrompt.trim()) {
      setErrorMessage('Vui lòng nhập ý tưởng hoặc chủ đề câu chuyện.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const charArray = characters
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const res = await aiStoryCreationService.submitInput({
        childProfileId: selectedChild?.id ?? 1,
        prompt: topicPrompt.trim(),
        genre: genre.trim(),
        targetLesson: lesson.trim(),
        customCharacters: charArray,
        idempotencyKey: `ai-story-${Date.now()}`,
      });

      if (res.success && res.data) {
        setCreatedStoryId(res.data.storyId);
        setCreatedRequestId(res.data.requestId);
        setGuardrailStatus(res.data);
        setSubPhase('checking_guardrail');
        startPollingGuardrail(res.data.storyId, res.data.requestId);
      } else {
        setErrorMessage(res.message || 'Không thể gửi ý tưởng câu chuyện.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Lỗi kết nối khi gửi yêu cầu sáng tác.');
      setIsSubmitting(false);
    }
  };

  // 3. Polling kiểm tra Guardrail Input (Step A3)
  const startPollingGuardrail = (storyId: number, reqId: number) => {
    let attempts = 0;
    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const checkRes = await aiStoryCreationService.getInputProgress(storyId, reqId);
        if (checkRes.success && checkRes.data) {
          setGuardrailStatus(checkRes.data);
          if (checkRes.data.inputStatus === 'input_accepted') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            fetchOutline(storyId);
          } else if (checkRes.data.inputStatus === 'input_blocked') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setErrorMessage('Ý tưởng có chứa một số từ ngữ chưa phù hợp với độ tuổi của bé. Vui lòng thử ý tưởng khác.');
            setSubPhase('input');
            setIsSubmitting(false);
          }
        }
        if (attempts > 20) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          fetchOutline(storyId); // Fallback try load outline
        }
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 1500);
  };

  // 4. Lấy Dàn ý 3 hồi do AI sinh (Step A4)
  const fetchOutline = async (storyId: number) => {
    try {
      const outlineRes = await aiStoryCreationService.getOutline(storyId);
      if (outlineRes.success && outlineRes.data) {
        setOutlineData(outlineRes.data);
        const curVer = outlineRes.data.currentVersion;
        const nodes = curVer?.nodes || [];
        setEditValues({
          title: curVer?.title || 'Câu chuyện kỳ thú',
          opening: nodes.find((n) => n.chapterNumber === 1)?.summary || '',
          development: nodes.find((n) => n.chapterNumber === 2)?.summary || '',
          ending: nodes.find((n) => n.chapterNumber === 3)?.summary || '',
        });
        setSubPhase('outline_ready');
      } else {
        setErrorMessage('Đang hoàn thiện dàn ý, vui lòng thử lại sau ít giây.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Lưu Dàn ý chỉnh sửa thủ công (Step A5 manual)
  const handleSaveEditedOutline = async () => {
    if (!createdStoryId || !outlineData?.currentVersion) return;
    setIsSavingOutline(true);
    try {
      const verNo = outlineData.currentVersion.versionNumber;
      const res = await aiStoryCreationService.editOutline(createdStoryId, verNo, {
        title: editValues.title,
        synopsis: editValues.title,
        nodes: [
          { chapterNumber: 1, title: 'Mở đầu', summary: editValues.opening, keyAction: 'Khởi đầu' },
          { chapterNumber: 2, title: 'Diễn biến', summary: editValues.development, keyAction: 'Thử thách' },
          { chapterNumber: 3, title: 'Kết thúc', summary: editValues.ending, keyAction: 'Bài học' },
        ],
      });
      if (res.success) {
        setIsEditingOutline(false);
        await fetchOutline(createdStoryId);
      }
    } finally {
      setIsSavingOutline(false);
    }
  };

  // 6. Yêu cầu AI sinh lại dàn ý (Step A5 regenerate)
  const handleRegenerateOutline = async () => {
    if (!createdStoryId || !outlineData?.currentVersion) return;
    setIsRegenerating(true);
    try {
      const verNo = outlineData.currentVersion.versionNumber;
      await aiStoryCreationService.regenerateOutline(createdStoryId, verNo, {
        instructions: 'Hãy thay đổi bối cảnh kịch tính hơn và làm nhân vật gần gũi hơn với trẻ nhỏ',
      });
      await fetchOutline(createdStoryId);
    } finally {
      setIsRegenerating(false);
    }
  };

  // 7. Phê duyệt dàn ý & sang Phase 3 Hội tụ (Step A6)
  const handleApproveOutline = async () => {
    if (!createdStoryId || !outlineData?.currentVersion) return;
    setIsApproving(true);
    try {
      const verNo = outlineData.currentVersion.versionNumber;
      const res = await aiStoryCreationService.approveOutline(createdStoryId, verNo);
      if (res.success) {
        onProceedToConvergence(createdStoryId);
      } else {
        setErrorMessage(res.message || 'Không thể phê duyệt dàn ý.');
      }
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-5">
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* PHASE 1: FORM NHẬP Ý TƯỞNG */}
      {subPhase === 'input' && (
        <form onSubmit={handleSubmitPrompt} className="space-y-4">
          <div className="p-4 rounded-2xl bg-tod-card border border-tod-border shadow-sm transition-colors duration-500">
            <label className="text-sm font-black uppercase text-tod-text tracking-wider flex items-center gap-2 mb-2.5">
              <Sparkles className="w-4 h-4 text-sky-500" /> Ý tưởng hoặc chủ đề câu chuyện:
            </label>
            <textarea
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              rows={3}
              className="w-full text-sm text-tod-text bg-tod-surface/90 border border-tod-border rounded-xl p-3.5 focus:outline-none focus:border-sky-500 leading-relaxed placeholder:text-tod-text-muted/60 transition-colors"
              placeholder="Ví dụ: Chú Sóc Bông đi tìm hạt dẻ vàng trong rừng dẻ và học được cách sẻ chia cùng bạn bè..."
            />
            {context?.favoriteTopics && context.favoriteTopics.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs text-tod-text-muted font-bold">Gợi ý theo sở thích bé:</span>
                {context.favoriteTopics.map((top) => (
                  <button
                    key={top}
                    type="button"
                    onClick={() => setTopicPrompt((prev) => (prev ? `${prev}, ${top}` : top))}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/30 hover:border-sky-500 transition-colors cursor-pointer"
                  >
                    + {top}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-tod-card border border-tod-border shadow-sm transition-colors duration-500">
              <label className="text-xs font-bold text-tod-text-muted block mb-1.5">Thể loại</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full text-sm text-tod-text bg-tod-surface/90 border border-tod-border rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div className="p-4 rounded-xl bg-tod-card border border-tod-border shadow-sm transition-colors duration-500">
              <label className="text-xs font-bold text-tod-text-muted block mb-1.5">Bài học đạo đức</label>
              <input
                type="text"
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                className="w-full text-sm text-tod-text bg-tod-surface/90 border border-tod-border rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div className="p-4 rounded-xl bg-tod-card border border-tod-border shadow-sm transition-colors duration-500">
              <label className="text-xs font-bold text-tod-text-muted block mb-1.5">Nhân vật chính</label>
              <input
                type="text"
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                className="w-full text-sm text-tod-text bg-tod-surface/90 border border-tod-border rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl text-xs font-bold text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer"
            >
              Quay lại chọn hình thức
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !topicPrompt.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-xl shadow-sky-950/20 transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm duyệt ý tưởng...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" /> Bút Thần Phác Thảo Dàn Ý
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* PHASE 2: CHECKING GUARDRAIL LOADING */}
      {subPhase === 'checking_guardrail' && (
        <div className="p-8 rounded-3xl bg-tod-card border border-sky-500/40 text-center space-y-4 shadow-xl transition-colors duration-500">
          <div className="w-14 h-14 mx-auto rounded-full bg-sky-500/20 text-sky-500 flex items-center justify-center border border-sky-500/30">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-tod-text">Trợ Lý AI Đang Quét An Toàn & Chuẩn Bị Dàn Ý</h4>
            <p className="text-xs text-tod-text-muted mt-1 max-w-md mx-auto">
              Hệ thống đang đối chiếu ý tưởng với chính sách an toàn của bé và phân bổ cốt truyện thành 3 hồi kịch tính...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-sky-600 dark:text-sky-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Trạng thái: {guardrailStatus?.inputStatus || 'checking_input'}
          </div>
        </div>
      )}

      {/* PHASE 3: DÀN Ý 3 HỒI ĐÃ SẴN SÀNG */}
      {subPhase === 'outline_ready' && outlineData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-tod-border">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Dàn ý 3 hồi đã sẵn sàng để viết toàn văn!
            </div>
            <div className="flex items-center gap-2">
              {!isEditingOutline ? (
                <button
                  type="button"
                  onClick={() => setIsEditingOutline(true)}
                  className="px-3 py-1.5 rounded-xl bg-tod-surface hover:bg-tod-card text-tod-text border border-tod-border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa tay
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSavingOutline}
                  onClick={handleSaveEditedOutline}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Lưu dàn ý
                </button>
              )}
              <button
                type="button"
                disabled={isRegenerating}
                onClick={handleRegenerateOutline}
                className="px-3 py-1.5 rounded-xl bg-tod-surface hover:bg-tod-card text-tod-text border border-tod-border text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} /> Gợi ý dàn ý khác
              </button>
            </div>
          </div>

          <ThreeActsOutlineView
            outlineProgress={outlineData}
            isEditing={isEditingOutline}
            editValues={editValues}
            onEditChange={(field, val) => setEditValues((prev) => ({ ...prev, [field]: val }))}
          />

          <div className="flex items-center justify-between pt-4 border-t border-tod-border">
            <button
              type="button"
              onClick={() => setSubPhase('input')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer"
            >
              Đổi ý tưởng khác
            </button>
            <button
              type="button"
              disabled={isApproving}
              onClick={handleApproveOutline}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black flex items-center gap-2 shadow-xl shadow-emerald-950/20 transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Bắt đầu viết truyện...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Tuyệt vời, Bắt đầu Viết Toàn Văn!
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
