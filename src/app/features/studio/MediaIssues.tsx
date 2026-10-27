'use client';
import type { MediaProgressDto, StoryMediaPackage } from '@/app/types/aiStory';
import { mediaIssueLabel, mediaIssueMessage, mediaIssuesOf } from '@/app/features/story-workflow/mediaIssues';

export default function MediaIssues({ progress, pack, onSelectScene }: {
  progress: MediaProgressDto | null; pack?: StoryMediaPackage | null; onSelectScene?: (sceneId: number, sceneIndex: number) => void;
}) {
  const issues = mediaIssuesOf(progress, pack ?? null);
  if (!issues.length && !progress?.errorCode) return null;
  if (progress?.isReady || progress?.isGenerated) return null;
  return <section className="media-issues" aria-label="Các mục media cần kiểm tra" aria-live="polite">
    <b>{issues.length ? `${issues.length} mục media cần kiểm tra` : 'Chưa hoàn thành gói media'}</b>
    {issues.length ? <ul>{issues.map(issue => {
      const waiting = ['Pending', 'Processing'].includes(issue.status);
      const retryAt = issue.nextRetryAt ? new Date(issue.nextRetryAt) : null;
      return <li className={`notice ${waiting ? 'warn' : 'err'}`} key={issue.assetId}>
        {onSelectScene ? <button className="btn btn-s" onClick={() => onSelectScene(issue.sceneId, issue.sceneIndex)}>{mediaIssueLabel(issue)}</button> : <strong>{mediaIssueLabel(issue)}</strong>}
        <p>{mediaIssueMessage(issue)}</p>
        {retryAt && Number.isFinite(retryAt.getTime()) && <small>Thử lại từ {retryAt.toLocaleTimeString('vi-VN')}.</small>}
        <details><summary>Chi tiết kỹ thuật</summary><small>Mã: {issue.errorCode} · Asset #{issue.assetId}{issue.attemptCount > 0 ? ` · Lượt sinh: ${issue.attemptCount}` : ''}</small></details>
      </li>;
    })}</ul> : <p className="notice err">Lỗi gói media ({progress?.errorCode}). API chưa cung cấp vị trí lỗi cụ thể; chưa thể xác định cảnh bị ảnh hưởng.</p>}
  </section>;
}
