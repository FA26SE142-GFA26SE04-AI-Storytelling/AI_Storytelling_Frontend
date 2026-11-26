export type CaptionChunk = {
  text: string;
  start: number;
  end: number;
};

function splitSentenceIntoChunks(
  original: string,
  sentStart: number,
  sentEnd: number,
  maxLen: number
): CaptionChunk[] {
  const result: CaptionChunk[] = [];
  let curStart = sentStart;
  const endLimit = sentEnd;

  while (curStart < endLimit) {
    while (curStart < endLimit && /\s/.test(original[curStart])) {
      curStart++;
    }
    if (curStart >= endLimit) break;

    let curEnd = endLimit;
    while (curEnd > curStart && /\s/.test(original[curEnd - 1])) {
      curEnd--;
    }
    if (curStart >= curEnd) break;

    const currentLen = curEnd - curStart;
    if (currentLen <= maxLen) {
      result.push({
        text: original.slice(curStart, curEnd),
        start: curStart,
        end: curEnd,
      });
      break;
    }

    const sliceStr = original.slice(curStart, curEnd);

    let cutIndex = -1;
    for (let i = maxLen - 1; i >= 0; i--) {
      if (sliceStr[i] === ',' || sliceStr[i] === ';') {
        cutIndex = i + 1;
        break;
      }
    }

    if (cutIndex === -1) {
      for (let i = maxLen - 1; i >= 0; i--) {
        if (/\s/.test(sliceStr[i])) {
          cutIndex = i;
          break;
        }
      }
    }

    if (cutIndex === -1) {
      cutIndex = maxLen;
    }

    const chunkEnd = curStart + cutIndex;
    let chunkTrimmedEnd = chunkEnd;
    while (chunkTrimmedEnd > curStart && /\s/.test(original[chunkTrimmedEnd - 1])) {
      chunkTrimmedEnd--;
    }

    if (chunkTrimmedEnd > curStart) {
      result.push({
        text: original.slice(curStart, chunkTrimmedEnd),
        start: curStart,
        end: chunkTrimmedEnd,
      });
    }

    curStart = chunkEnd;
  }

  return result;
}

export function splitCaptionChunks(text: string, maxLen = 90): CaptionChunk[] {
  if (!text || !text.trim()) return [];
  const limit = Math.max(1, Math.floor(maxLen));

  const sentenceDelimRegex = /[.!?…]+|\r?\n+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const rawRanges: { start: number; end: number }[] = [];

  while ((match = sentenceDelimRegex.exec(text)) !== null) {
    const delimEnd = match.index + match[0].length;
    rawRanges.push({ start: lastIndex, end: delimEnd });
    lastIndex = delimEnd;
  }
  if (lastIndex < text.length) {
    rawRanges.push({ start: lastIndex, end: text.length });
  }

  const chunks: CaptionChunk[] = [];
  for (const range of rawRanges) {
    const sentenceChunks = splitSentenceIntoChunks(text, range.start, range.end, limit);
    for (const c of sentenceChunks) {
      if (c.text.length > 0) {
        chunks.push(c);
      }
    }
  }

  return chunks;
}

export function chunkAt(chunks: CaptionChunk[], offset: number): number {
  if (chunks.length === 0) return -1;
  if (offset < chunks[0].start) return 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (offset >= chunk.start && offset < chunk.end) {
      return i;
    }
    if (i < chunks.length - 1) {
      const nextChunk = chunks[i + 1];
      if (offset >= chunk.end && offset < nextChunk.start) {
        return i;
      }
    }
  }

  return chunks.length - 1;
}

export function chunkByRatio(chunks: CaptionChunk[], ratio: number): number {
  const n = chunks.length;
  if (n === 0) return -1;

  const validRatio = Number.isNaN(ratio) ? 0 : ratio;
  const clamped = Math.min(1, Math.max(0, validRatio));
  return Math.min(n - 1, Math.floor(clamped * n));
}
