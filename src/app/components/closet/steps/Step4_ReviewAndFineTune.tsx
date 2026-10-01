'use client';

import React, { useEffect, useRef, useState } from 'react';
import { aiStoryCreationService as api } from '../../../services/aiStoryCreationService';
import { DiscussionPromptDto, QuizQuestionDto, ReviewArtifact, StoryReviewDto, VocabularyItemDto } from '../../../types/aiStory';
import { useStoryReview } from '../hooks/useStoryReview';
import { isMediaStage } from '../hooks/storyGenerationFlow';
import { AIStoryProposalPreview } from '../subcomponents/AIStoryProposalPreview';
import { hasMissingLearning } from '../hooks/storyReviewLearning';

export interface Step4_ReviewAndFineTuneProps {
  storyId: number;
  onProceedToMedia: (storyId: number) => void;
  onBack: () => void;
}
const names: Record<ReviewArtifact, string> = { story: 'Câu chuyện', vocabulary: 'Từ vựng', quiz: 'Câu đố', discussion: 'Trò chuyện' };

export const Step4_ReviewAndFineTune: React.FC<Step4_ReviewAndFineTuneProps> = ({ storyId, onProceedToMedia, onBack }) => {
  const flow = useStoryReview(storyId);
  const [tab, setTab] = useState<ReviewArtifact>('story');
  const [story, setStory] = useState<StoryReviewDto | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyItemDto[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestionDto[]>([]);
  const [discussion, setDiscussion] = useState<DiscussionPromptDto[]>([]);
  const [dirty, setDirty] = useState<Set<ReviewArtifact>>(new Set());
  const [instruction, setInstruction] = useState('');
  const [selection, setSelection] = useState<{ start: number; endExclusive: number; text: string } | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!flow.bundle) return;
    setStory(flow.bundle.story); setVocabulary(flow.bundle.vocabulary.items);
    setQuiz(flow.bundle.quiz.items); setDiscussion(flow.bundle.discussion.items);
    setDirty(new Set()); setSelection(null);
  }, [flow.bundle]);
  useEffect(() => {
    if (flow.bundle && isMediaStage(flow.bundle.summary.storyStatus)) onProceedToMedia(storyId);
  }, [flow.bundle, storyId, onProceedToMedia]);
  const markDirty = (artifact: ReviewArtifact) => setDirty(current => new Set(current).add(artifact));
  const canEdit = flow.bundle?.summary.canEdit === true && !flow.busy && !flow.proposal;
  const patchStory = (field: 'title' | 'content' | 'lesson', value: string) => {
    setStory(s => s ? { ...s, [field]: value } : s); markDirty('story'); setSelection(null);
  };
  const save = () => flow.run(async signal => {
    if (!flow.bundle || !story) return;
    const versionId = flow.bundle.summary.storyVersionId;
    const result = tab === 'story'
      ? await api.updateStoryReview(storyId, { versionId, title: story.title, content: story.content, lesson: story.lesson }, signal)
      : tab === 'vocabulary'
        ? await api.updateVocabularyReview(storyId, { versionId, items: vocabulary }, signal)
        : tab === 'quiz'
          ? await api.updateQuizReview(storyId, { versionId, items: quiz }, signal)
          : await api.updateDiscussionReview(storyId, { versionId, items: discussion }, signal);
    if (signal.aborted) return;
    flow.requireData<unknown>(result);
    await flow.load(signal);
  });
  const propose = () => flow.run(async signal => {
    if (!story || dirty.size) return;
    const result = tab === 'story'
      ? await api.partialEditStory(storyId, { versionId: story.versionId, selection: selection!, instruction: instruction.trim() }, signal)
      : await api.regenerateReviewArtifact(storyId, tab, signal);
    await flow.createProposal(result, signal);
  });
  const archive = () => flow.run(async signal => {
    const result = flow.requireData(await api.archiveStory(storyId, { reason: 'Lưu trữ từ xưởng sáng tác' }, signal));
    if (!signal.aborted && result.success) onBack();
  });
  const inputClass = 'dashboard-input w-full p-3 text-sm';
  const changeVocabulary = (index: number, field: 'term' | 'definition', value: string) => {
    setVocabulary(items => items.map((item, i) => i === index ? { ...item, [field]: value } : item)); markDirty('vocabulary');
  };
  const changeQuiz = (index: number, patch: Partial<QuizQuestionDto>) => {
    setQuiz(items => items.map((item, i) => i === index ? { ...item, ...patch } : item)); markDirty('quiz');
  };
  const changeDiscussion = (index: number, patch: Partial<DiscussionPromptDto>) => {
    setDiscussion(items => items.map((item, i) => i === index ? { ...item, ...patch } : item)); markDirty('discussion');
  };

  if (!flow.bundle || !story) return <section className="dashboard-glass-panel p-6 space-y-3">
    <p>{flow.busy ? 'Đang tải bản thảo và học liệu...' : 'Chưa thể tải gói kiểm duyệt.'}</p>
    {flow.error && <p role="alert" className="text-rose-500">{flow.error}</p>}
    <button type="button" disabled={flow.busy} onClick={flow.refresh}>Kiểm tra lại</button>
    <button type="button" onClick={onBack}>Quay lại phòng</button>
  </section>;
  return <section className="dashboard-glass-panel p-5 space-y-4">
    <h3 className="text-lg font-black">Xem và tinh chỉnh câu chuyện</h3>
    {flow.error && <p role="alert" className="text-sm text-rose-500">{flow.error}</p>}
    {hasMissingLearning(flow.bundle) && <div className="dashboard-card p-4 space-y-3">
      <p role="status">Bản thảo hiện tại chưa có đủ học liệu. Sau khi sửa nội dung truyện, hãy tạo học liệu cho bản mới rồi xem lại trước khi phê duyệt.</p>
      <button type="button" disabled={!canEdit || dirty.size > 0} onClick={() => void flow.generateMissingLearning()} className="btn-dashboard-primary px-4 py-2 disabled:opacity-50">{flow.busy ? 'Đang xử lý...' : 'Tạo học liệu còn thiếu'}</button>
    </div>}
    <div className="flex gap-2 flex-wrap">
      {(Object.keys(names) as ReviewArtifact[]).map(artifact => <button type="button" key={artifact} disabled={flow.busy || (dirty.size > 0 && tab !== artifact)} onClick={() => setTab(artifact)} className={tab === artifact ? 'btn-dashboard-primary px-4 py-2' : 'dashboard-card px-4 py-2'}>{names[artifact]}{dirty.has(artifact) ? ' *' : ''}</button>)}
    </div>
    {tab === 'story' && <div className="space-y-3">
      <label className="block">Tiêu đề<input disabled={!canEdit} className={inputClass} value={story.title} onChange={e => patchStory('title', e.target.value)} /></label>
      <label className="block">Nội dung<textarea ref={contentRef} readOnly={!canEdit} className={inputClass} rows={12} value={story.content}
        onChange={e => patchStory('content', e.target.value)}
        onSelect={e => {
          const node = e.currentTarget; const start = node.selectionStart; const endExclusive = node.selectionEnd;
          setSelection(endExclusive > start ? { start, endExclusive, text: story.content.slice(start, endExclusive) } : null);
        }} /></label>
      <label className="block">Bài học<textarea disabled={!canEdit} className={inputClass} value={story.lesson} onChange={e => patchStory('lesson', e.target.value)} /></label>
      <label className="block">Yêu cầu AI viết lại đoạn đã chọn<input disabled={!canEdit} className={inputClass} value={instruction} onChange={e => setInstruction(e.target.value)} /></label>
      {selection && <p className="text-xs">Đã chọn {selection.text.length} ký tự để đề xuất viết lại.</p>}
    </div>}
    {tab === 'vocabulary' && <div className="space-y-3">{vocabulary.map((item, i) => <div key={item.id ?? i} className="dashboard-card p-3 space-y-2">
      <label>Từ<input disabled={!canEdit} className={inputClass} value={item.term} onChange={e => changeVocabulary(i, 'term', e.target.value)} /></label>
      <label>Giải nghĩa<textarea disabled={!canEdit} className={inputClass} value={item.definition} onChange={e => changeVocabulary(i, 'definition', e.target.value)} /></label>
    </div>)}</div>}
    {tab === 'quiz' && <div className="space-y-3">{quiz.map((item, i) => <div key={item.id ?? i} className="dashboard-card p-3 space-y-2">
      <label>Câu hỏi<textarea disabled={!canEdit} className={inputClass} value={item.question} onChange={e => changeQuiz(i, { question: e.target.value })} /></label>
      {(item.choices ?? []).map((choice, j) => <label key={j} className="block">Lựa chọn {j + 1}<input disabled={!canEdit} className={inputClass} value={choice} onChange={e => changeQuiz(i, { choices: item.choices!.map((v, k) => j === k ? e.target.value : v) })} /></label>)}
      <label>Đáp án<input disabled={!canEdit} className={inputClass} value={item.correctAnswer ?? ''} onChange={e => changeQuiz(i, { correctAnswer: e.target.value })} /></label>
    </div>)}</div>}
    {tab === 'discussion' && <div className="space-y-3">{discussion.map((item, i) => <div key={item.id ?? i} className="dashboard-card p-3 space-y-2">
      <label>Gợi ý trò chuyện<textarea disabled={!canEdit} className={inputClass} value={item.question} onChange={e => changeDiscussion(i, { question: e.target.value })} /></label>
      <label><input disabled={!canEdit} type="checkbox" checked={item.isMoralLesson} onChange={e => changeDiscussion(i, { isMoralLesson: e.target.checked })} /> Gắn với bài học của câu chuyện</label>
    </div>)}</div>}
    <div className="flex gap-3 flex-wrap">
      <button type="button" disabled={!canEdit || !dirty.has(tab) || dirty.size > 1} onClick={() => void save()} className="btn-dashboard-primary px-4 py-2 disabled:opacity-50">Lưu {names[tab].toLowerCase()}</button>
      <button type="button" disabled={!canEdit || dirty.size > 0 || (tab === 'story' && (!selection || !instruction.trim()))} onClick={() => void propose()} className="dashboard-card px-4 py-2 disabled:opacity-50">Đề xuất AI</button>
    </div>
    {dirty.size > 1 && <p>Hãy lưu từng phần trước khi chuyển sang chỉnh sửa phần khác. Kiểm tra lại để tải bản đã lưu sẽ bỏ thay đổi chưa lưu.</p>}
    {flow.proposal && <div className="dashboard-card p-4 space-y-3">
      <h4 className="font-bold">Xem trước đề xuất AI</h4>
      <div className="max-h-60 overflow-auto"><AIStoryProposalPreview proposal={flow.proposal} /></div>
      <button type="button" disabled={flow.busy} className="btn-dashboard-primary px-4 py-2" onClick={() => void flow.decideProposal(true)}>Áp dụng</button>
      <button type="button" disabled={flow.busy} className="dashboard-card px-4 py-2" onClick={() => void flow.decideProposal(false)}>Bỏ qua</button>
    </div>}
    {flow.validation && !flow.validation.canApprove && <ul className="text-sm">{flow.validation.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>}
    <div className="flex gap-3 flex-wrap">
      <button type="button" disabled={flow.busy} onClick={onBack} className="dashboard-card px-4 py-2">Quay lại phòng</button>
      <button type="button" disabled={flow.busy || dirty.size > 0 || !!flow.proposal} onClick={flow.refresh} className="dashboard-card px-4 py-2">Kiểm tra lại</button>
      <button type="button" disabled={!flow.bundle.summary.canApprove || hasMissingLearning(flow.bundle) || flow.busy || dirty.size > 0 || !!flow.proposal} onClick={() => void flow.approve(() => onProceedToMedia(storyId))} className="btn-dashboard-primary px-4 py-2 disabled:opacity-50">Đã xem các phần — kiểm tra và phê duyệt</button>
      {flow.bundle.summary.canArchive && <button type="button" disabled={flow.busy || dirty.size > 0 || !!flow.proposal} onClick={() => { if (window.confirm('Lưu trữ câu chuyện và dừng sáng tác?')) void archive(); }} className="dashboard-card px-4 py-2">Lưu trữ</button>}
    </div>
  </section>;
};
