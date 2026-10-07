'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import { ApiResponse } from '@/app/types/auth';
import { AIProposalDto, DiscussionReviewDto, QuizReviewDto, ReviewPackageDto, StoryReviewDto, ValidationResultDto, VocabularyReviewDto } from '@/app/types/aiStory';
import { hasMissingLearning, missingLearning } from './storyReviewLearning';

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

export function useStoryReview(storyId: number) {
  const [bundle, setBundle] = useState<StoryReviewBundle | null>(null);
  const [proposal, setProposal] = useState<AIProposalDto | null>(null);
  const [validation, setValidation] = useState<ValidationResultDto | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async (signal: AbortSignal) => {
    const [p, s, v, q, d] = await Promise.all([
      api.getReviewPackage(storyId, signal), api.getStoryReview(storyId, signal),
      api.getVocabularyReview(storyId, signal), api.getQuizReview(storyId, signal), api.getDiscussionReview(storyId, signal),
    ]);
    if (signal.aborted) return;
    const next = { summary: requireData(p), story: requireData(s), vocabulary: requireData(v), quiz: requireData(q), discussion: requireData(d) };
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
    for (const artifact of ['story', 'vocabulary', 'quiz', 'discussion'] as const) {
      const completed = requireData(await api.completeReview(storyId, artifact, signal));
      if (signal.aborted) return;
      if (!completed) throw new Error('Chưa thể hoàn tất kiểm duyệt học liệu.');
    }
    const checks = requireData(await api.validateReview(storyId, signal));
    if (signal.aborted) return;
    setValidation(checks);
    if (!checks.canApprove) throw new Error(checks.issues.join(' • ') || 'Nội dung chưa đủ điều kiện phê duyệt.');
    const result = requireData(await api.approveStory(storyId, signal));
    if (!signal.aborted && result.success) onApproved();
    else if (!signal.aborted) throw new Error('Máy chủ chưa xác nhận phê duyệt.');
  });

  const generateMissingLearning = () => run(async signal => {
    if (!bundle || proposal || !bundle.summary.canEdit) return;
    const result = requireData(await api.generateArtifacts(storyId, missingLearning(bundle), signal));
    if (signal.aborted) return;
    await load(signal);
    if (!result.success) throw new Error(result.message || 'Chưa thể tạo đủ học liệu.');
  });

  return { bundle, proposal, validation, busy, error, run, load, requireData, createProposal, decideProposal, approve, generateMissingLearning,
    refresh: () => run(load), clearProposal: () => setProposal(null) };
}
