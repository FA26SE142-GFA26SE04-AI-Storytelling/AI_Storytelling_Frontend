'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import { ApiResponse } from '@/app/types/auth';
import { AIProposalDto, DiscussionReviewDto, PartialEditRequestDto, QuizReviewDto, ReviewArtifact, ReviewPackageDto, StoryReviewDto, ValidationResultDto, VocabularyReviewDto } from '@/app/types/aiStory';
import { hasMissingLearning, missingLearning } from './storyReviewLearning';
import { isReadingOnly } from '@/app/lib/storyRules';

function requireData<T>(result: ApiResponse<T>): T {
  if (!result.success || result.data === null || result.data === undefined) throw new Error(result.message || 'Phản hồi chưa hợp lệ.');
  return result.data;
}

export interface StoryReviewBundle {
  summary: ReviewPackageDto;
  story: StoryReviewDto;
  vocabulary: VocabularyReviewDto;
  quiz: QuizReviewDto;
  discussion: DiscussionReviewDto;
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
    const [v, q, d] = isReadingOnly(summary.outputMode)
      ? [{ ...empty }, { ...empty }, { ...empty }]
      : await Promise.all([api.getVocabularyReview(storyId, signal), api.getQuizReview(storyId, signal), api.getDiscussionReview(storyId, signal)])
        .then(([vr, qr, dr]) => [requireData(vr), requireData(qr), requireData(dr)] as const);
    if (signal.aborted) return;
    const next = { summary, story, vocabulary: v, quiz: q, discussion: d } as StoryReviewBundle;
    if ([next.story, next.vocabulary, next.quiz, next.discussion].some(item => item.versionId !== next.summary.storyVersionId)) {
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
    const result = requireData(await (apply ? api.applyProposal(storyId, proposal.proposalId, signal) : api.discardProposal(storyId, proposal.proposalId, signal)));
    if (signal.aborted) return;
    if (!result.success) throw new Error(result.message);
    setProposal(null); await load(signal);
  });

  const approve = (onApproved: () => void) => run(async signal => {
    if (!bundle || hasMissingLearning(bundle)) throw new Error('Hãy tạo đủ học liệu cho bản thảo hiện tại trước khi phê duyệt.');
    const artifacts = isReadingOnly(bundle.summary.outputMode) ? (['story'] as const) : (['story', 'vocabulary', 'quiz', 'discussion'] as const);
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

  /** Gọi AI tạo đề xuất; aiTask là nhãn hiển thị trong lúc chờ (AI có thể mất vài giây). */
  const askAi = (label: string, call: (signal: AbortSignal) => Promise<ApiResponse<{ proposalId: string }>>) => run(async signal => {
    if (!bundle || proposal) return;
    setAiTask(label);
    try { await createProposal(await call(signal), signal); }
    finally { if (!signal.aborted) setAiTask(null); }
  });

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

  const archive = (onArchived: () => void) => run(async signal => {
    // Backend hiện chưa lưu lý do; mặc định là phụ huynh không muốn dùng nữa (không ngắt phiên đọc).
    const result = requireData(await api.archiveStory(storyId, { reason: 'supervisor_preference' }, signal));
    if (!signal.aborted && result.success) onArchived();
  });

  const generateMissingLearning = () => run(async signal => {
    if (!bundle || proposal || !bundle.summary.canEdit) return;
    const result = requireData(await api.generateArtifacts(storyId, missingLearning(bundle), signal));
    if (signal.aborted) return;
    await load(signal);
    if (!result.success) throw new Error(result.message || 'Chưa thể tạo đủ học liệu.');
  });

  return { bundle, proposal, validation, busy, aiTask, error, run, load, requireData, createProposal, decideProposal, approve, generateMissingLearning,
    reviseStory, regenerateArtifact, saveStory, archive,
    refresh: () => run(load), clearProposal: () => setProposal(null) };
}
