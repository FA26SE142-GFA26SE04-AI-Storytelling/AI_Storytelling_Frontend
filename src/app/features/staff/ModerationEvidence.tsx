import type { PublicReviewFlagDto } from '@/app/types/backendContracts';
import { matchedEvidence } from '@/app/features/story-workflow/moderationEvidence';

export default function ModerationEvidence({ flag, content }: { flag: PublicReviewFlagDto; content: string | null | undefined }) {
  const match = matchedEvidence(content, flag);
  return <>
    <p>{flag.reason}</p>
    {flag.evidenceQuote ? <blockquote>{flag.evidenceQuote}</blockquote> : <p className="sub">Cờ này không có đoạn trích evidence.</p>}
    {flag.contextNote && <p className="sub">{flag.contextNote}</p>}
    {match ? <details><summary>Đối chiếu trong bản nộp</summary><p>{match.before}<mark style={{ background: 'var(--surface)', color: 'var(--primary)', fontWeight: 800 }}>{match.quote}</mark>{match.after}</p></details>
      : flag.evidenceQuote && <p className="sub">Chưa xác định được vị trí trích dẫn trong nội dung này. Hãy đối chiếu trực tiếp bản nộp.</p>}
  </>;
}
