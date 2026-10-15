import { describe, expect, it } from 'vitest';
import { countWords, normalizeSelection, overlapInParagraph, paragraphSelection, paragraphsWithOffsets } from '@/app/features/story-workflow/storySelection';

const content = 'Rùa Bông đi chơi.\n\n  Trời mưa to.  \nRùa trú dưới lá sen.';

describe('story selection', () => {
  it('keeps the original offsets of every paragraph', () => {
    const paragraphs = paragraphsWithOffsets(content);
    expect(paragraphs).toHaveLength(3);
    for (const p of paragraphs) expect(content.slice(p.start, p.start + p.text.length)).toBe(p.text);
  });

  it('trims whitespace and orders the ends of a selection', () => {
    const p = paragraphsWithOffsets(content)[1];
    const sel = normalizeSelection(content, p.start + p.text.length, p.start)!;
    expect(sel.text).toBe('Trời mưa to.');
    expect(content.slice(sel.start, sel.endExclusive)).toBe(sel.text);
    expect(normalizeSelection(content, 17, 19)).toBeNull();
  });

  it('selects a whole paragraph and reports overlaps per paragraph', () => {
    const [first, second] = paragraphsWithOffsets(content);
    const sel = paragraphSelection(content, second)!;
    expect(overlapInParagraph(first, sel)).toBeNull();
    expect(overlapInParagraph(second, sel)).toEqual([2, 14]);
    const across = normalizeSelection(content, 4, second.start + 6)!;
    expect(overlapInParagraph(first, across)).toEqual([4, first.text.length]);
  });

  it('counts words', () => {
    expect(countWords(' Rùa  Bông đi ')).toBe(3);
    expect(countWords('')).toBe(0);
  });
});
