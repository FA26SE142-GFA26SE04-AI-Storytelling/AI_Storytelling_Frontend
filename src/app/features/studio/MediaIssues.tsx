'use client';
import type { MediaGenerationIssue, MediaProgressDto, StoryMediaPackage } from '@/app/types/aiStory';
import { mediaIssueLabel, mediaIssueMessage, mediaIssueReason, mediaIssuesOf } from '@/app/features/story-workflow/mediaIssues';

const isWaiting = (issue: MediaGenerationIssue) => ['Pending', 'Processing'].includes(issue.status);
const timeOf = (value: string | null | undefined) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
};

export default function MediaIssues({ progress, pack, onSelectScene }: {
  progress: MediaProgressDto | null; pack?: StoryMediaPackage | null; onSelectScene?: (sceneId: number, sceneIndex: number) => void;
}) {
  const issues = mediaIssuesOf(progress, pack ?? null);
  if (!issues.length && !progress?.errorCode) return null;
  if (progress?.isReady || progress?.isGenerated) return null;

  const waiting = issues.filter(isWaiting);
  const failed = issues.filter(issue => !isWaiting(issue));
  // Các mục đang chờ thường cùng một nguyên nhân (vd. bị giới hạn lượt): gom lại thay vì lặp một thẻ cho mỗi mục.
  const reasons = [...new Set(waiting.map(issue => mediaIssueReason(issue.errorCode)).filter((x): x is string => !!x))];
  const retryTimes = waiting.map(issue => timeOf(issue.nextRetryAt)).filter((x): x is Date => !!x).sort((a, b) => a.getTime() - b.getTime());
  const codes = [...new Set(waiting.map(issue => issue.errorCode))];

  const title = !issues.length ? 'Chưa hoàn thành gói media'
    : failed.length ? `${failed.length + waiting.length} mục media cần kiểm tra`
    : `Đang hoàn thiện ${waiting.length} mục media`;
  const pick = (issue: MediaGenerationIssue) => onSelectScene
    ? <button key={issue.assetId} className="chip" onClick={() => onSelectScene(issue.sceneId, issue.sceneIndex)}>{mediaIssueLabel(issue)}</button>
    : <span key={issue.assetId} className="chip">{mediaIssueLabel(issue)}</span>;

  return <section className="media-issues" aria-label="Các mục media cần kiểm tra" aria-live="polite">
    <b>{title}</b>
    {issues.length ? <>
      {waiting.length > 0 && <div className="notice warn media-wait">
        <p><strong>{waiting.length} mục đang chờ hệ thống tự thử lại</strong>{reasons.length > 0 && <> · {reasons.join(' ')}</>}</p>
        {retryTimes[0] && <small>Thử lại sớm nhất lúc {retryTimes[0].toLocaleTimeString('vi-VN')}. Bạn không cần làm gì, có thể để màn hình này mở.</small>}
        <div className="media-chips">{waiting.map(pick)}</div>
        <details><summary>Chi tiết kỹ thuật</summary>
          <small>Mã: {codes.join(', ')} · Asset: {waiting.map(issue => `#${issue.assetId}`).join(', ')}</small></details>
      </div>}
      {failed.length > 0 && <ul>{failed.map(issue => {
        const retryAt = timeOf(issue.nextRetryAt);
        return <li className="notice err" key={issue.assetId}>
          {onSelectScene ? <button className="btn btn-s" onClick={() => onSelectScene(issue.sceneId, issue.sceneIndex)}>{mediaIssueLabel(issue)}</button> : <strong>{mediaIssueLabel(issue)}</strong>}
          <p>{mediaIssueMessage(issue)}</p>
          {retryAt && <small>Thử lại từ {retryAt.toLocaleTimeString('vi-VN')}.</small>}
          <details><summary>Chi tiết kỹ thuật</summary><small>Mã: {issue.errorCode} · Asset #{issue.assetId}{issue.attemptCount > 0 ? ` · Lượt sinh: ${issue.attemptCount}` : ''}</small></details>
        </li>;
      })}</ul>}
    </> : <p className="notice err">Lỗi gói media ({progress?.errorCode}). API chưa cung cấp vị trí lỗi cụ thể; chưa thể xác định cảnh bị ảnh hưởng.</p>}
  </section>;
}
