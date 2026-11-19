import { describe, expect, it } from 'vitest';
import { magnetOffset } from '@/app/lib/motion';

describe('magnetOffset', () => {
  it('bằng 0 khi con trỏ ở tâm', () => {
    expect(magnetOffset(100, 100)).toBe(0);
  });
  it('lệch 20px thì hút 5px', () => {
    expect(magnetOffset(120, 100)).toBe(5);
  });
  it('lệch rất xa thì kẹp ở 10px', () => {
    expect(magnetOffset(1100, 100)).toBe(10);
  });
  it('lệch âm rất xa thì kẹp ở -10px', () => {
    expect(magnetOffset(-900, 100)).toBe(-10);
  });
});
