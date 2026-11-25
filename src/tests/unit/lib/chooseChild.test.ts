import { describe, expect, it, vi } from 'vitest';

const toast = vi.fn();
vi.mock('@/app/lib/toast', () => ({ showToast: (...a: unknown[]) => toast(...a) }));
const { ensureChild } = await import('@/app/lib/chooseChild');

type Kid = Parameters<typeof ensureChild>[0][number];
const kid = (status: string) => ({ id: 1, nickname: 'Bình', status }) as Kid;

describe('ensureChild', () => {
  it('chặn và báo khi chưa có bé, bé không hoạt động hoặc đang tải', () => {
    expect(ensureChild([], false)).toBe(false);
    expect(ensureChild([kid('Suspended')], false)).toBe(false);
    expect(ensureChild([kid('Active')], true)).toBe(false);
    expect(toast).toHaveBeenCalledTimes(3);
    expect(toast.mock.calls[0][0]).toMatch(/chưa có hồ sơ bé/);
  });

  it('cho mở khi có bé phù hợp, không báo gì', () => {
    toast.mockClear();
    expect(ensureChild([kid('Suspended'), kid('Active')], false)).toBe(true);
    expect(ensureChild([kid('Draft')], false, () => true)).toBe(true);
    expect(toast).not.toHaveBeenCalled();
  });
});
