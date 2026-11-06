'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import { ApiResponse } from '@/app/types/auth';
import { normalizeQuizType } from '@/app/lib/storyRules';
import { AIProposalDto, PartialEditRequestDto, QuizQuestionDto, ReviewArtifact, ValidationResultDto } from '@/app/types/aiStory';
import { hasMissingLearning, missingLearning } from './storyReviewLearning';
import { loadStoryReviewBundle, requireReviewData as requireData, type StoryReviewBundle } from './storyReviewBundle';
export type { StoryReviewBundle } from './storyReviewBundle';

/** Các câu hỏi trong nội dung đề xuất của AI (`{ items: [...] }`), loại câu hỏi đưa về mã của backend; sai dạng thì trả null. */
function quizItemsOf(content: unknown): QuizQuestionDto[] | null {
  const raw = (content as { items?: unknown } | null)?.items;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const items: QuizQuestionDto[] = [];
  for (const it of raw as Record<string, unknown>[]) {
    if (typeof it?.type !== 'string' || typeof it.question !== 'string') return null;
    items.push({
      type: normalizeQuizType(it.type) ?? it.type,
      question: it.question,
      correctAnswer: typeof it.correctAnswer === 'string' ? it.correctAnswer : null,
      choices: Array.isArray(it.choices) ? it.choices.filter((c): c is string => typeof c === 'string') : null,
    });
  }
  return items;
}


export function useStoryReview(storyId: number, actor: 'parent' | 'creator' = 'parent') {
  const [bundle, setBundle] = useState<StoryReviewBundle | null>(null);
  const [proposal, setProposal] = useState<AIProposalDto | null>(null);
  const [validation, setValidation] = useState<ValidationResultDto | null>(null);
  const [busy, setBusy] = useState(true);
  const [aiTask, setAiTask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const confirmation = useRef<{ versionId: number; operationId: string } | null>(null);

  const load = useCallback(async (signal: AbortSignal) => {
    const next = await loadStoryReviewBundle(storyId, signal);
    if (signal.aborted) return;
    setBundle(next); setValidation(null);
  }, [storyId]);

  useEffect(() => {
    const c = new AbortController(); controller.current = c;
    setBundle(null); setProposal(null); setValidation(null); setBusy(true); setError(null); lock.current = true;
    void load(c.signal).catch(e => { if (!c.signal.aborted) setError((e as Error).message); })
      .finally(() => { if (!c.signal.aborted) { lock.current = false; setBusy(false); } });
    return () => { c.abort(); controller.current?.abort(); };
  }, [load]);

  const run = async (action: (signal: AbortSignal) => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    const c = new AbortController(); controller.current = c;
    try { await action(c.signal); }
    catch (e) { if (!c.signal.aborted) setError((e as Error).message); }
    finally { if (!c.signal.aborted) { lock.current = false; setBusy(false); } }
  };

  const createProposal = async (result: ApiResponse<{ proposalId: string }>, signal: AbortSignal) => {
    if (signal.aborted) return;
    const created = requireData(result);
    const data = requireData(await api.getProposal(storyId, created.proposalId, signal));
    if (!signal.aborted) setProposal(data);
  };

  const decideProposal = (apply: boolean) => run(async signal => {
    if (!proposal) return;
    if (!apply) {
      const result = requireData(await api.discardProposal(storyId, proposal.proposalId, signal));
      if (signal.aborted) return;
      if (!result.success) throw new Error(result.message);
      setProposal(null); await load(signal);
      return;
    }
    const applied = await api.applyProposal(storyId, proposal.proposalId, signal);
    if (signal.aborted) return;
    if (applied.success && applied.data?.success) { setProposal(null); await load(signal); return; }
    // Backend lỗi 500 khi áp dụng đề xuất câu hỏi (ProposalService đọc loại "multiple_choice" bằng Enum.Parse): tự lưu đúng các câu hỏi
    // của đề xuất bằng đường lưu học liệu rồi đóng đề xuất. Chỉ dùng khi áp dụng thường bị lỗi máy chủ.
    const items = proposal.artifactType === 'quiz' && (applied.status ?? 0) >= 500 ? quizItemsOf(proposal.suggestedContent) : null;
    if (!items) throw new Error(applied.data?.message || applied.message || 'Chưa áp dụng được đề xuất.');
    requireData(await api.updateQuizReview(storyId, { versionId: proposal.storyVersionId, items }, signal));
    if (signal.aborted) return;
    await api.discardProposal(storyId, proposal.proposalId, signal);
    setProposal(null); await load(signal);
  });

  const approve = (onApproved: () => void) => run(async signal => {
    if (!bundle || hasMissingLearning(bundle)) throw new Error('Hãy tạo đủ học liệu cho bản thảo hiện tại trước khi phê duyệt.');
    const versionId = bundle.summary.storyVersionId;
    if (confirmation.current?.versionId !== versionId)
      confirmation.current = { versionId, operationId: `review-${actor}-${crypto.randomUUID()}` };
    const response = await api.confirmPackage(storyId, confirmation.current, signal);
    const result = requireData(response);
    if (signal.aborted) return;
    if (result.storyId !== storyId || ('versionId' in result && result.versionId !== versionId))
      throw new Error('Máy chủ trả kết quả cho bản thảo khác. Hãy tải lại trạng thái truyện.');
    confirmation.current = null;
    onApproved();
  });

  /** Người duyệt xác nhận các tương tác khi nghe (POST /review/listening/complete), rồi tải lại để cập nhật trạng thái. */
  const confirmListening = () => run(async signal => {
    if (!bundle?.listening?.required) return;
    requireData(await api.completeListening(storyId, signal));
    if (signal.aborted) return;
    await load(signal);
  });

  /** Gọi AI tạo đề xuất; aiTask là nhãn hiển thị trong lúc chờ (AI có thể mất vài giây). */
  const askAi = (label: string, call: (signal: AbortSignal) => Promise<ApiResponse<{ proposalId: string }>>) => run(async signal => {
    if (!bundle || proposal) return;
    setAiTask(label);
    try { await createProposal(await call(signal), signal); }
    finally { if (!signal.aborted) setAiTask(null); }
  });

  /** Sinh lại một loại tương tác khi nghe (loại bị lỗi thời hoặc thiếu); ra đề xuất để xem trước rồi mới áp dụng. */
  const regenerateListening = (type: string) =>
    askAi('AI đang soạn lại tương tác khi nghe…', signal => api.regenerateListening(storyId, type, signal));

  const reviseStory = (selection: PartialEditRequestDto['selection'], instruction: string) =>
    askAi('AI đang viết lại đoạn đã chọn…', signal => api.partialEditStory(storyId, { versionId: bundle!.story.versionId, selection, instruction }, signal));

  const regenerateArtifact = (artifact: Exclude<ReviewArtifact, 'story'>) =>
    askAi('AI đang soạn lại học liệu…', signal => api.regenerateReviewArtifact(storyId, artifact, signal));

  const saveStory = (draft: { title: string; content: string; lesson: string; assistanceReferences?: import('@/app/types/backendContracts').AssistanceReference[] }, onSaved?: () => void) => run(async signal => {
    if (!bundle) return;
    requireData(await api.updateStoryReview(storyId, { versionId: bundle.story.versionId, ...draft }, signal));
    if (signal.aborted) return;
    await load(signal);
    onSaved?.();
  });

  const generateMissingLearning = () => run(async signal => {
    if (!bundle || proposal || !bundle.summary.canEdit) return;
    const result = requireData(await api.generateArtifacts(storyId, missingLearning(bundle), signal));
    if (signal.aborted) return;
    await load(signal);
    if (!result.success) throw new Error(result.message || 'Chưa thể tạo đủ học liệu.');
  });

  return { bundle, proposal, validation, busy, aiTask, error, run, load, requireData, createProposal, decideProposal, approve, generateMissingLearning, confirmListening, regenerateListening,
    reviseStory, regenerateArtifact, saveStory,
    refresh: () => run(load), clearProposal: () => setProposal(null) };
}
