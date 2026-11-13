import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CommunityLibraryStoryDto } from '@/app/types/backendContracts';
import { storyService } from '@/app/services/storyService';

// Host giả lập React hook lifecycle cho môi trường Node không có DOM / @testing-library/react
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  const sameDeps = (a: readonly unknown[] | undefined, b: readonly unknown[]) =>
    !!a && a.length === b.length && b.every((value, index) => Object.is(value, a[index]));

  return {
    begin() {
      cursor = 0;
      effects = [];
    },
    commit() {
      const pending = [...effects];
      effects = [];
      pending.forEach((effect) => effect());
    },
    reset() {
      slots.forEach((slot) => slot.cleanup?.());
      slots.length = 0;
      effects = [];
    },
    unmount() {
      slots.forEach((slot) => {
        slot.cleanup?.();
        slot.cleanup = undefined;
      });
    },
    useState<T>(initial: T) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [
        slots[index].value as T,
        (next: T | ((current: T) => T)) => {
          slots[index].value =
            typeof next === 'function'
              ? (next as (current: T) => T)(slots[index].value as T)
              : next;
        },
      ] as const;
    },
    useEffect(effect: () => void | (() => void), deps: readonly unknown[]) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) {
        effects.push(() => {
          slots[index]?.cleanup?.();
          slots[index] = { deps, cleanup: effect() || undefined };
        });
      }
    },
  };
});

vi.mock('react', () => ({
  useState: host.useState,
  useEffect: host.useEffect,
}));

import { useCommunityStatShelves } from '@/app/features/library/useCommunityStatShelves';

function renderHook<P, R>(
  hook: (props: P) => R,
  options?: { initialProps?: P }
) {
  let currentProps = options?.initialProps as P;

  function run() {
    host.begin();
    const value = hook(currentProps);
    host.commit();
    return value;
  }

  run();

  const result = {
    get current() {
      return run();
    },
  };

  return {
    result,
    rerender(newProps?: P) {
      if (newProps !== undefined) {
        currentProps = newProps;
      }
      return run();
    },
    unmount() {
      host.unmount();
    },
  };
}

// Fixture tối thiểu theo yêu cầu (không dùng dữ liệu thật, ép kiểu cần thiết)
function makeStoryFixture(overrides: Partial<CommunityLibraryStoryDto>): CommunityLibraryStoryDto {
  return {
    id: 1,
    title: 'Truyện mẫu',
    viewCount: 0,
    favoriteCount: 0,
    ...overrides,
  } as unknown as CommunityLibraryStoryDto;
}

describe('useCommunityStatShelves', () => {
  afterEach(() => {
    host.reset();
    vi.restoreAllMocks();
  });

  it('enabled=false: không gọi getCommunityStories, hai mảng rỗng', () => {
    const spy = vi.spyOn(storyService, 'getCommunityStories');
    const { result } = renderHook((enabled: boolean) => useCommunityStatShelves(enabled), {
      initialProps: false,
    });

    expect(spy).not.toHaveBeenCalled();
    expect(result.current.mostViewed).toEqual([]);
    expect(result.current.mostFavorited).toEqual([]);
  });

  it('enabled=true: gọi 2 lần với { orderBy: "views", isDescending: true, pageSize: 10 } và { orderBy: "favorites", isDescending: true, pageSize: 10 }', async () => {
    const spy = vi.spyOn(storyService, 'getCommunityStories').mockResolvedValue({
      success: true,
      data: {
        items: [],
        totalCount: 0,
        pageIndex: 1,
        pageSize: 10,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });

    renderHook((enabled: boolean) => useCommunityStatShelves(enabled), {
      initialProps: true,
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, {
      orderBy: 'views',
      isDescending: true,
      pageSize: 10,
    });
    expect(spy).toHaveBeenNthCalledWith(2, {
      orderBy: 'favorites',
      isDescending: true,
      pageSize: 10,
    });
  });

  it('lọc: truyện viewCount 0 không vào mostViewed; truyện favoriteCount 0 không vào mostFavorited; giữ đúng thứ tự', async () => {
    const viewedList = [
      makeStoryFixture({ id: 101, title: 'Truyện A', viewCount: 200, favoriteCount: 0 }),
      makeStoryFixture({ id: 102, title: 'Truyện B', viewCount: 0, favoriteCount: 50 }),
      makeStoryFixture({ id: 103, title: 'Truyện C', viewCount: 15, favoriteCount: 2 }),
    ];
    const favoritedList = [
      makeStoryFixture({ id: 201, title: 'Truyện D', viewCount: 0, favoriteCount: 88 }),
      makeStoryFixture({ id: 202, title: 'Truyện E', viewCount: 99, favoriteCount: 0 }),
      makeStoryFixture({ id: 203, title: 'Truyện F', viewCount: 10, favoriteCount: 42 }),
    ];

    vi.spyOn(storyService, 'getCommunityStories').mockImplementation(async (filter) => {
      if (filter?.orderBy === 'views') {
        return {
          success: true,
          data: {
            items: viewedList,
            totalCount: viewedList.length,
            pageIndex: 1,
            pageSize: 10,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        };
      }
      if (filter?.orderBy === 'favorites') {
        return {
          success: true,
          data: {
            items: favoritedList,
            totalCount: favoritedList.length,
            pageIndex: 1,
            pageSize: 10,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        };
      }
      return { success: false, message: 'Tham số không hợp lệ' };
    });

    const { result } = renderHook((enabled: boolean) => useCommunityStatShelves(enabled), {
      initialProps: true,
    });

    await vi.waitFor(() => {
      expect(result.current.mostViewed).toHaveLength(2);
      expect(result.current.mostFavorited).toHaveLength(2);
    });

    // Truyện B (viewCount 0) không vào mostViewed; giữ đúng thứ tự A rồi C
    expect(result.current.mostViewed.map((s) => s.id)).toEqual([101, 103]);
    expect(result.current.mostViewed[0].viewCount).toBe(200);
    expect(result.current.mostViewed[1].viewCount).toBe(15);

    // Truyện E (favoriteCount 0) không vào mostFavorited; giữ đúng thứ tự D rồi F
    expect(result.current.mostFavorited.map((s) => s.id)).toEqual([201, 203]);
    expect(result.current.mostFavorited[0].favoriteCount).toBe(88);
    expect(result.current.mostFavorited[1].favoriteCount).toBe(42);
  });

  it('lỗi (success false) thì hai mảng rỗng', async () => {
    vi.spyOn(storyService, 'getCommunityStories').mockResolvedValue({
      success: false,
      message: 'Lỗi tải kệ cộng đồng',
    });

    const { result } = renderHook((enabled: boolean) => useCommunityStatShelves(enabled), {
      initialProps: true,
    });

    await vi.waitFor(() => {
      expect(result.current.mostViewed).toEqual([]);
      expect(result.current.mostFavorited).toEqual([]);
    });
  });

  it('unmount trước khi có kết quả thì không có lỗi state update (không throw và không có cảnh báo)', async () => {
    let resolvePending!: (val: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePending = resolve;
    });

    vi.spyOn(storyService, 'getCommunityStories').mockReturnValue(pendingPromise as never);
    const consoleErrorSpy = vi.spyOn(console, 'error');

    const { unmount } = renderHook((enabled: boolean) => useCommunityStatShelves(enabled), {
      initialProps: true,
    });

    // Unmount khi promise chưa hoàn thành
    expect(() => unmount()).not.toThrow();

    // Cho promise giải quyết sau khi đã unmount
    resolvePending({
      success: true,
      data: {
        items: [makeStoryFixture({ id: 999, viewCount: 50, favoriteCount: 50 })],
      },
    });

    await Promise.resolve();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
