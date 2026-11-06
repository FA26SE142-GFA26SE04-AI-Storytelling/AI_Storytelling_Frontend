'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import { ApiResponse } from '@/app/types/auth';
import { normalizeQuizType } from '@/app/lib/storyRules';
import { AIProposalDto, ListeningReviewDto, PartialEditRequestDto, QuizQuestionDto, QuizReviewDto, ReviewArtifact, ReviewPackageDto, StoryReviewDto, ValidationResultDto, VocabularyReviewDto } from '@/app/types/aiStory';
import { hasMissingLearning, missingLearning } from './storyReviewLearning';
import { isReadingOnly } from '@/app/lib/storyRules';

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

function requireData<T>(result: ApiResponse<T>): T {
  if (!result.success || result.data === null || result.data === undefined) throw new Error(result.message || 'Phản hồi chưa hợp lệ.');
  return result.data;
}

export interface StoryReviewBundle {
  summary: ReviewPackageDto;
  story: StoryReviewDto;
  vocabulary: VocabularyReviewDto;
  quiz: QuizReviewDto;
  /** Tương tác khi nghe; null khi truyện chỉ để đọc hoặc không tải được. */
  listening: ListeningReviewDto | null;
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

  const load = useCallback(async (signal: AbortSignal) => {
    const [p, s] = await Promise.all([api.getReviewPackage(storyId, signal), api.getStoryReview(storyId, signal)]);
    if (signal.aborted) return;
    const summary = requireData(p);
    const story = requireData(s);
    // Truyện "Chỉ để đọc": backend từ chối mọi API học liệu (409), nên không gọi và dùng danh sách rỗng.
    const empty = { storyId, versionId: summary.storyVersionId, items: [] };
    const [v, q, l] = isReadingOnly(summary.outputMode)
      ? [{ ...empty }, { ...empty }, null]
      // Tương tác khi nghe lỗi tải thì không chặn cả màn duyệt: tab nghe chỉ không hiện, backend vẫn là nơi quyết định cho duyệt.
      : await Promise.all([api.getVocabularyReview(storyId, signal), api.getQuizReview(storyId, signal),
          api.getListeningReview(storyId, signal).then(lr => (lr.success && lr.data ? lr.data : null)).catch(() => null)])
        .then(([vr, qr, lr]) => [requireData(vr), requireData(qr), lr] as const);
    if (signal.aborted) return;
    const next = { summary, story, vocabulary: v, quiz: q, listening: l } as StoryReviewBundle;
    if ([next.story, next.vocabulary, next.quiz, ...(next.listening ? [next.listening] : [])].some(item => item.versionId !== next.summary.storyVersionId)) {
      throw new Error('Bản thảo đã thay đổi trong lúc tải. Vui lòng kiểm tra lại.');
    }
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
    const artifacts = isReadingOnly(bundle.summary.outputMode) ? (['story'] as const) : (['story', 'vocabulary', 'quiz'] as const);
    for (const artifact of artifacts) {
      const completed = requireData(await api.completeReview(storyId, artifact, signal));
      if (signal.aborted) return;
      if (!completed) throw new Error('Chưa thể hoàn tất kiểm duyệt học liệu.');
    }
    const checks = requireData(await api.validateReview(storyId, signal));
    if (signal.aborted) return;
    setValidation(checks);
    if (!(actor === 'creator' ? checks.canConfirmContent : checks.canApprove)) throw new Error(checks.issues.join(' • ') || 'Nội dung chưa đủ điều kiện phê duyệt.');
    if (actor === 'creator') {
      const result = requireData(await api.confirmCreatorContent(storyId, bundle.summary.storyVersionId, signal));
      if (!signal.aborted && result.versionId === bundle.summary.storyVersionId) onApproved();
      return;
    }
    const result = requireData(await api.approveStory(storyId, signal));
    if (!signal.aborted && result.success) onApproved();
    else if (!signal.aborted) throw new Error('Máy chủ chưa xác nhận phê duyệt.');
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
