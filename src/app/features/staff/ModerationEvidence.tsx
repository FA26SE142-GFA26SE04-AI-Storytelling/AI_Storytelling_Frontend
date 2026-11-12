import type { ReactNode } from 'react';
import type { PublicReviewFlagDto } from '@/app/types/backendContracts';
import { matchedEvidence } from '@/app/features/story-workflow/moderationEvidence';
import { formatFlagCriterion, formatFlagKind, formatFlagName, formatFlagReason } from './moderationFlagDisplay';

export function ModerationFlagHeader({
  flag,
  trailing,
}: {
  flag: Pick<PublicReviewFlagDto, 'name' | 'kind' | 'criterionCode'>;
  trailing?: ReactNode;
}) {
  const displayName = formatFlagName(flag.name, flag.kind);
  const displayKind = formatFlagKind(flag.kind);
  const displayCriterion = formatFlagCriterion(flag.criterionCode);

  return (
    <div className="row st-wrap mod-flag-head">
      <b>{displayName}{trailing}</b>
      {displayKind && <span className="pill wait">{displayKind}</span>}
      {displayCriterion && displayCriterion !== displayKind && (
        <span className="pill draft">{displayCriterion}</span>
      )}
    </div>
  );
}

export default function ModerationEvidence({ flag, content }: { flag: PublicReviewFlagDto; content: string | null | undefined }) {
  const match = matchedEvidence(content, flag);
  return <>
    <p className="mod-flag-reason">{formatFlagReason(flag.reason)}</p>
    {flag.evidenceQuote
      ? <blockquote>{flag.evidenceQuote}</blockquote>
      : <p className="sub mod-flag-empty-quote">Không có đoạn trích dẫn cụ thể cho cờ này. Hãy đối chiếu trực tiếp phần nội dung tương ứng.</p>}
    {flag.contextNote && <p className="sub mod-flag-note">{flag.contextNote}</p>}
    {match ? <details><summary>Đối chiếu trong bản nộp</summary><p className="mod-pre">{match.before}<mark className="mod-hl">{match.quote}</mark>{match.after}</p></details>
      : flag.evidenceQuote && <p className="sub mod-flag-note">Chưa xác định được vị trí trích dẫn trong nội dung này. Hãy đối chiếu trực tiếp bản nộp.</p>}
  </>;
}
