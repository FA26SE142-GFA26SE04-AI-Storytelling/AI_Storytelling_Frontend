import { describe, expect, it } from 'vitest';
import { shuffle } from '@/app/lib/shuffle';

describe('shuffle', () => {
  it('giữ đủ phần tử và không sửa mảng gốc', () => {
    const items = [1, 2, 3, 4, 5];
    const out = shuffle(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('luôn khác thứ tự gốc khi có từ 2 phần tử', () => {
    for (let n = 0; n < 200; n++) {
      expect(shuffle(['a', 'b'])).toEqual(['b', 'a']);
      expect(shuffle(['a', 'b', 'c', 'd'])).not.toEqual(['a', 'b', 'c', 'd']);
    }
  });

  it('random bất thường vẫn ra thứ tự khác gốc', () => {
    // Fisher–Yates với random luôn gần 1 giữ nguyên thứ tự; hàm phải tự xoay vòng.
    expect(shuffle([1, 2, 3], () => 0.9999)).toEqual([2, 3, 1]);
  });

  it('mảng rỗng, một phần tử hoặc toàn phần tử giống nhau trả về như cũ', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(['x'])).toEqual(['x']);
    expect(shuffle(['x', 'x'])).toEqual(['x', 'x']);
  });
});
