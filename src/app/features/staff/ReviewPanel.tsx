'use client';
import type { QueueItem } from '@/app/types/staff';
import type { ReviewKind } from '@/app/services/moderationService';
import CommunitySubmissionReviewPanel from './CommunitySubmissionReviewPanel';
import ContentReportReviewPanel from './ContentReportReviewPanel';
import GrayZoneReviewPanel from './GrayZoneReviewPanel';
import PublicStoryRemovalPanel from './PublicStoryRemovalPanel';
import PublicStoryReviewPanel from './PublicStoryReviewPanel';
import { ReviewPanelHeader } from './ReviewPanelHeader';
import RoadmapReviewPanel from './RoadmapReviewPanel';

export { ReviewPanelHeader };

/** Bộ định tuyến panel kiểm duyệt theo đúng `ReviewKind` backend (cả Moderator và Administrator). */
export default function ReviewPanel({
  kind,
  id,
  queueItem,
  onDecision,
}: {
  kind: ReviewKind;
  id: number;
  queueItem?: QueueItem;
  onDecision: () => void;
}) {
  switch (kind) {
    case 'PublicStoryReview':
      return <PublicStoryReviewPanel id={id} queueItem={queueItem} onDecision={onDecision} />;
    case 'CommunitySubmission':
      return <CommunitySubmissionReviewPanel id={id} queueItem={queueItem} onDecision={onDecision} />;
    case 'GrayZoneStory':
      return <GrayZoneReviewPanel id={id} queueItem={queueItem} onDecision={onDecision} />;
    case 'ContentReport':
      return <ContentReportReviewPanel id={id} queueItem={queueItem} onDecision={onDecision} />;
    case 'PublicStoryRemoval':
      return <PublicStoryRemovalPanel id={id} queueItem={queueItem} onDecision={onDecision} />;
    case 'RoadmapTemplateReview':
      return <RoadmapReviewPanel id={id} queueItem={queueItem} onDecision={onDecision} />;
  }
}
