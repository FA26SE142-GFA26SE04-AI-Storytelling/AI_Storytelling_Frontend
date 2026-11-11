import { describe, expect, it } from 'vitest';
import { niceScale } from '@/app/components/stats/statFormat';

describe('niceScale', () => {
  it('doanh thu 99.000 ra các mức 0, 25k, 50k, 75k, 100k', () => {
    expect(niceScale(99000)).toEqual({ top: 100000, ticks: [0, 25000, 50000, 75000, 100000] });
  });

  it('số đếm nhỏ ra mức nguyên từng đơn vị', () => {
    expect(niceScale(4)).toEqual({ top: 4, ticks: [0, 1, 2, 3, 4] });
    expect(niceScale(1)).toEqual({ top: 1, ticks: [0, 1] });
    expect(niceScale(9)).toEqual({ top: 10, ticks: [0, 5, 10] });
  });

  it('toàn số 0 hoặc giá trị không hợp lệ vẫn có thang 0–1', () => {
    expect(niceScale(0)).toEqual({ top: 1, ticks: [0, 1] });
    expect(niceScale(Number.NaN)).toEqual({ top: 1, ticks: [0, 1] });
  });

  it('mức trên cùng luôn bao được giá trị lớn nhất và các mức đều nguyên', () => {
    for (const v of [3, 17, 250, 1500, 49000, 100000, 2_345_678]) {
      const { top, ticks } = niceScale(v);
      expect(top).toBeGreaterThanOrEqual(v);
      expect(ticks.every(Number.isInteger)).toBe(true);
      expect(ticks.length - 1).toBeLessThanOrEqual(5);
    }
  });
});
