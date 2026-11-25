import { describe, expect, it } from 'vitest';
import { vocabRanges } from '@/app/features/kid/ChildReaderCaption';

describe('vocabRanges', () => {
  const text = 'Tổn thất lớn. Không ai chịu tổn thất trong trận Bạch Đằng.';

  it('tìm mọi lần xuất hiện, không phân biệt hoa thường', () => {
    const r = vocabRanges(text, [{ id: 1, term: 'tổn thất' }]);
    expect(r.map((x) => text.slice(x.start, x.end))).toEqual(['Tổn thất', 'tổn thất']);
  });

  it('chỉ khớp nguyên từ và ưu tiên từ dài, không chồng nhau', () => {
    const r = vocabRanges('Bạch Đằng, sông Đằng', [{ id: 1, term: 'Đằng' }, { id: 2, term: 'Bạch Đằng' }, { id: 3, term: 'ông' }]);
    expect(r).toEqual([{ start: 0, end: 9, id: 2 }, { start: 16, end: 20, id: 1 }]);
  });

  it('bỏ qua từ rỗng', () => {
    expect(vocabRanges(text, [{ id: 1, term: '  ' }])).toEqual([]);
  });
});
