import type { PublicReviewFlagDto } from '@/app/types/backendContracts';

export function matchedEvidence(content: string | null | undefined, flag: PublicReviewFlagDto) {
  const start = flag.startOffset, end = flag.endOffset, quote = flag.evidenceQuote;
  if (!content || !quote || start == null || end == null || !Number.isInteger(start) || !Number.isInteger(end)
      || start < 0 || end <= start || end > content.length) return null;
  const part = content.slice(start, end);
  const index = part.indexOf(quote);
  if (index < 0) return null;
  return { before: part.slice(Math.max(0, index - 100), index), quote, after: part.slice(index + quote.length, index + quote.length + 100) };
}
