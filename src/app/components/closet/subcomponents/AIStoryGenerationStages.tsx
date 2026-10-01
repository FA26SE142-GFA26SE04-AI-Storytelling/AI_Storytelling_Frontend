'use client';

import React from 'react';
import { BookOpen, CheckCircle2, HelpCircle, Loader2, MessageCircle } from 'lucide-react';
import { ContentGenerationProgressDto } from '../../../types/aiStory';
import { contentDestination, generationDisplayPhase } from '../hooks/storyGenerationFlow';

interface Props { progress: ContentGenerationProgressDto | null; isRetrying: boolean }
const labels: Record<string, string> = {
  not_started: 'Chưa bắt đầu', pending: 'Đang chờ', processing: 'Đang thực hiện',
  generating: 'Đang thực hiện', completed: 'Hoàn tất', stable: 'Hoàn tất và đã kiểm tra', failed: 'Chưa hoàn tất',
};

export function AIStoryGenerationStages({ progress, isRetrying }: Props) {
  const phase = generationDisplayPhase(progress);
  const destination = progress ? contentDestination(progress) : 'waiting';
  const stopped = destination === 'stopped';
  const complete = destination === 'review' || destination === 'media';
  const failed = !!progress?.currentStep.startsWith('failed_');
  const title = stopped ? 'Quá trình sáng tác đã dừng'
    : complete ? 'Câu chuyện và học liệu đã sẵn sàng'
      : isRetrying ? 'Đang thử lại nội dung câu chuyện'
        : phase === 'content'
          ? failed ? 'Chưa thể hoàn tất nội dung câu chuyện' : 'Đang viết và kiểm tra nội dung câu chuyện'
          : failed ? 'Chưa thể hoàn tất học liệu' : 'Đang tạo học liệu từ câu chuyện';

  return <div className="space-y-5">
    <div>
      <h3 className="text-lg font-black text-tod-text" aria-live="polite">{title}</h3>
      <p className="text-sm text-tod-text-muted mt-2">
        {stopped ? 'Câu chuyện đã bị dừng hoặc được lưu trữ, không thể tiếp tục.'
          : phase === 'content'
            ? 'Nội dung truyện được hoàn thiện và kiểm tra chất lượng, an toàn trước khi tạo học liệu.'
            : 'Nội dung truyện đã hoàn tất. Học liệu được tạo lần lượt: từ vựng, câu đố, rồi gợi ý trò chuyện.'}
      </p>
    </div>
    <ol aria-label="Các giai đoạn sáng tác" className="flex flex-col sm:flex-row gap-3 text-sm">
      <li aria-current={!stopped && phase === 'content' ? 'step' : undefined} className={`flex-1 rounded-2xl border p-3 ${phase === 'learning' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-sky-500/40 bg-sky-500/10'}`}>
        <span className="font-bold">1. Nội dung câu chuyện</span>
        <span className="block text-xs text-tod-text-muted mt-1">{phase === 'learning' ? 'Đã hoàn tất và kiểm tra' : stopped ? 'Đã dừng' : failed ? 'Cần thử lại' : 'Đang chuẩn bị nội dung'}</span>
      </li>
      <li aria-current={!stopped && !complete && phase === 'learning' ? 'step' : undefined} className={`flex-1 rounded-2xl border p-3 ${phase === 'learning' ? 'border-sky-500/40 bg-sky-500/10' : 'border-tod-border text-tod-text-muted'}`}>
        <span className="font-bold">2. Học liệu cho bé</span>
        <span className="block text-xs text-tod-text-muted mt-1">{complete ? 'Đã hoàn tất' : stopped ? 'Đã dừng' : phase === 'content' ? 'Chờ câu chuyện hoàn tất' : failed ? 'Chưa hoàn tất' : 'Đang chuẩn bị học liệu'}</span>
      </li>
    </ol>
    {!stopped && phase === 'content' && <div className="dashboard-card p-5 border border-sky-500/30">
      <div className="flex items-center gap-3"><BookOpen className="w-5 h-5 text-sky-500" /><h4 className="font-bold">Nội dung câu chuyện</h4></div>
      <p className="mt-2 text-sm text-tod-text-muted">{isRetrying ? 'Đang thử lại' : progress ? labels[progress.content] ?? 'Đang cập nhật' : 'Đang kiểm tra trạng thái'}</p>
      <p className="mt-3 text-sm text-tod-text-muted">Từ vựng, câu đố và trò chuyện chưa được tạo ở giai đoạn này.</p>
    </div>}
    {!stopped && phase === 'learning' && <>
      <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-4 h-4" />Nội dung câu chuyện đã hoàn tất và vượt qua kiểm tra.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {([['vocabulary', 'Từ vựng', BookOpen], ['quiz', 'Câu đố', HelpCircle], ['discussion', 'Trò chuyện', MessageCircle]] as const).map(([field, name, Icon], index) => {
          const state = progress![field];
          const running = ['processing', 'generating'].includes(state);
          return <div className="dashboard-card p-4" key={field}>
            <div className="flex items-center justify-between gap-2"><Icon className="w-5 h-5 text-sky-500" />{state === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : running ? <Loader2 className="w-4 h-4 animate-spin text-sky-500" /> : null}</div>
            <h4 className="font-bold mt-2">{index + 1}. {name}</h4>
            <p className="text-sm text-tod-text-muted mt-1">{state === 'not_started' ? field === 'vocabulary' ? 'Chờ bắt đầu tạo học liệu' : field === 'quiz' ? 'Chờ từ vựng hoàn tất' : 'Chờ câu đố hoàn tất' : labels[state] ?? 'Đang cập nhật'}</p>
          </div>;
        })}
      </div>
    </>}
  </div>;
}
