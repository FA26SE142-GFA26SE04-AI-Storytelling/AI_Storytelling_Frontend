import { afterEach, describe, expect, it, vi } from 'vitest';

const hookHost = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  const sameDeps = (a: readonly unknown[] | undefined, b: readonly unknown[]) =>
    !!a && a.length === b.length && b.every((value, index) => Object.is(value, a[index]));
  return {
    pkg: vi.fn(),
    begin() { cursor = 0; effects = []; },
    commit() { effects.forEach(effect => effect()); },
    reset() {
      slots.forEach(slot => slot.cleanup?.());
      slots.length = 0;
      effects = [];
    },
    useState<T>(initial: T) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value as T, (next: T | ((current: T) => T)) => {
        slots[index].value = typeof next === 'function'
          ? (next as (current: T) => T)(slots[index].value as T)
          : next;
      }] as const;
    },
    useRef<T>(initial: T) {
      const index = cursor++;
      slots[index] ??= { value: { current: initial } };
      return slots[index].value as { current: T };
    },
    useEffect(effect: () => void | (() => void), deps: readonly unknown[]) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) effects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { deps, cleanup: effect() || undefined };
      });
    },
  };
});

vi.mock('react', () => ({
  useState: hookHost.useState,
  useRef: hookHost.useRef,
  useEffect: hookHost.useEffect,
}));
vi.mock('@/app/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 11 } }) }));
vi.mock('@/app/services/moderationService', () => ({
  moderationService: { package: hookHost.pkg },
}));

import { useReviewItem } from '@/app/features/staff/useReviewItem';

afterEach(() => {
  hookHost.reset();
  vi.clearAllMocks();
});

describe('useReviewItem event access revocation', () => {
  it('invokes onAccessRevoked and blocks claim when opening or acting returns 403', async () => {
    const onRevoked = vi.fn();
    hookHost.pkg.mockResolvedValueOnce({
      success: true,
      data: { kind: 'PublicStoryReview', data: { itemId: 77 } },
    });

    hookHost.begin();
    let state = useReviewItem('PublicStoryReview', 77, () => {}, onRevoked);
    hookHost.commit();
    await Promise.resolve();

    hookHost.begin();
    state = useReviewItem('PublicStoryReview', 77, () => {}, onRevoked);
    hookHost.commit();
    expect(state.claimBlocked).toBe(false);

    const ok = await state.act(async () => ({
      success: false,
      status: 403,
      message: 'Phân công sự kiện đã thay đổi; bạn không còn quyền duyệt bài dự thi này.',
      data: null,
    }));
    expect(ok).toBe(false);
    expect(onRevoked).toHaveBeenCalledWith('Phân công sự kiện đã thay đổi; bạn không còn quyền duyệt bài dự thi này.');

    hookHost.begin();
    state = useReviewItem('PublicStoryReview', 77, () => {}, onRevoked);
    hookHost.commit();
    expect(state.claimBlocked).toBe(true);
    expect(hookHost.pkg).toHaveBeenCalledTimes(1);
  });

  it('reloads package on 403 when onAccessRevoked is not provided', async () => {
    hookHost.pkg
      .mockResolvedValueOnce({
        success: true,
        data: { kind: 'GrayZone', data: { itemId: 88 } },
      })
      .mockResolvedValueOnce({
        success: false,
        status: 403,
        message: 'Mất quyền.',
        data: null,
      });

    hookHost.begin();
    let state = useReviewItem('GrayZone', 88, () => {});
    hookHost.commit();
    await Promise.resolve();

    hookHost.begin();
    state = useReviewItem('GrayZone', 88, () => {});
    hookHost.commit();
    expect(hookHost.pkg).toHaveBeenCalledTimes(1);

    const ok = await state.act(async () => ({
      success: false,
      status: 403,
      message: 'Mất quyền.',
      data: null,
    }));
    expect(ok).toBe(false);

    hookHost.begin();
    state = useReviewItem('GrayZone', 88, () => {});
    hookHost.commit();
    await Promise.resolve();

    expect(hookHost.pkg).toHaveBeenCalledTimes(2);
  });
});
