import { afterEach, describe, expect, it, vi } from "vitest";
import { storyService } from "@/app/services/storyService";
import type { CommunityLibraryStoryDto } from "@/app/types/backendContracts";
import type { StoryDto } from "@/app/types/story";

// Host giả lập React hook lifecycle trong môi trường Node (không có DOM)
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
    useState<T>(initial: T | (() => T)) {
      const index = cursor++;
      if (!slots[index]) {
        slots[index] = {
          value: typeof initial === "function" ? (initial as () => T)() : initial,
        };
      }
      return [
        slots[index].value as T,
        (next: T | ((current: T) => T)) => {
          slots[index].value =
            typeof next === "function" ? (next as (current: T) => T)(slots[index].value as T) : next;
        },
      ] as const;
    },
    useRef<T>(initial: T) {
      const index = cursor++;
      slots[index] ??= { value: { current: initial } };
      return slots[index].value as { current: T };
    },
    useCallback<T>(fn: T, deps: readonly unknown[]) {
      const index = cursor++;
      if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
        slots[index] = { value: fn, deps };
      }
      return slots[index].value as T;
    },
    useMemo<T>(factory: () => T, deps: readonly unknown[]) {
      const index = cursor++;
      if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
        slots[index] = { value: factory(), deps };
      }
      return slots[index].value as T;
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

vi.mock("react", () => ({
  useState: host.useState,
  useRef: host.useRef,
  useCallback: host.useCallback,
  useMemo: host.useMemo,
  useEffect: host.useEffect,
}));

import { clearLibraryCatalogCache, loadAllPages, useLibraryCatalog } from "@/app/features/library/useLibraryCatalog";

function renderHook<P, R>(hook: (props: P) => R, initialProps: P) {
  let currentProps = initialProps;
  function run() {
    host.begin();
    const value = hook(currentProps);
    host.commit();
    return value;
  }
  run();
  return {
    result: {
      get current() {
        return run();
      },
    },
    rerender(nextProps: P) {
      currentProps = nextProps;
      return run();
    },
    unmount() {
      host.unmount();
    },
  };
}

function makeStoryDto(overrides: Partial<StoryDto> = {}): StoryDto {
  return {
    id: 1,
    title: "Truyện mẫu",
    content: "Nội dung mẫu",
    ageBand: "6-8",
    status: "Ready",
    isPublished: true,
    source: "Ai",
    genre: "Khám phá",
    createdAt: "2026-11-20T00:00:00Z",
    authorUserId: 10,
    language: "vi",
    description: null,
    moralLesson: null,
    coverImageUrl: null,
    ...overrides,
  } as StoryDto;
}

function makeCommunityDto(overrides: Partial<CommunityLibraryStoryDto> = {}): CommunityLibraryStoryDto {
  return {
    ...makeStoryDto(),
    viewCount: 12,
    favoriteCount: 4,
    ...overrides,
  } as CommunityLibraryStoryDto;
}

describe("useLibraryCatalog & loadAllPages", () => {
  afterEach(() => {
    host.reset();
    clearLibraryCatalogCache();
    vi.restoreAllMocks();
  });

  it("loadAllPages iterates pages until hasNextPage is false and stops with error on failure", async () => {
    const fetchOk = vi
      .fn()
      .mockResolvedValueOnce({
        success: true,
        data: { items: [makeStoryDto({ id: 1 })], hasNextPage: true, totalCount: 2 },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { items: [makeStoryDto({ id: 2 })], hasNextPage: false, totalCount: 2 },
      });

    const full = await loadAllPages(fetchOk);
    expect(fetchOk).toHaveBeenCalledTimes(2);
    expect(full.message).toBeNull();
    expect(full.items.map((s) => s.id)).toEqual([1, 2]);

    const fetchFail = vi
      .fn()
      .mockResolvedValueOnce({
        success: true,
        data: { items: [makeStoryDto({ id: 1 })], hasNextPage: true, totalCount: 3 },
      })
      .mockResolvedValueOnce({
        success: false,
        message: "Lỗi tải trang 2",
      });

    const partial = await loadAllPages(fetchFail);
    expect(partial.message).toBe("Lỗi tải trang 2");
    expect(partial.items.map((s) => s.id)).toEqual([1]);

    const fetchEmptyErr = vi.fn().mockResolvedValueOnce({ success: false, message: "   " });
    const emptyErr = await loadAllPages(fetchEmptyErr);
    expect(emptyErr.message).toBe("Không thể tải thư viện truyện.");
    expect(emptyErr.items).toEqual([]);
  });

  it("merges family and community stories without duplicates, filters unpublished/drafts, and caches per userId", async () => {
    const mineStory = makeStoryDto({ id: 1, title: "Truyện nhà" });
    const draftStory = makeStoryDto({ id: 2, title: "Bản nháp", status: "Draft", isPublished: false });
    const overlapStory = makeStoryDto({ id: 3, title: "Truyện trùng" });
    const overlapComm = makeCommunityDto({
      id: 3, title: "Truyện trùng", viewCount: 44, favoriteCount: 7,
      coverImageUrl: "https://example.invalid/community-cover.jpg#crop=0,0,0.5,0.5",
    });
    const commOnly = makeCommunityDto({ id: 4, title: "Truyện cộng đồng", viewCount: 90, favoriteCount: 15 });

    const getMineSpy = vi.spyOn(storyService, "getStories").mockResolvedValue({
      success: true,
      data: {
        items: [mineStory, draftStory, overlapStory],
        totalCount: 3,
        pageIndex: 1,
        pageSize: 100,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });
    const getCommSpy = vi.spyOn(storyService, "getCommunityStories").mockResolvedValue({
      success: true,
      data: {
        items: [overlapComm, commOnly],
        totalCount: 2,
        pageIndex: 1,
        pageSize: 100,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });

    const first = renderHook((uid: number | undefined) => useLibraryCatalog(uid), 42);
    await vi.waitFor(() => {
      expect(first.result.current.storiesLoading).toBe(false);
    });

    expect(first.result.current.error).toBeNull();
    expect(first.result.current.stories.map((s) => s.id)).toEqual([1, 3, 4]);
    const overlapCard = first.result.current.stories.find((s) => s.id === 3);
    expect(overlapCard?.creator).toBe(true);
    expect(overlapCard?.viewCount).toBe(44);
    expect(overlapCard?.favoriteCount).toBe(7);
    expect(overlapCard?.raw.coverImageUrl).toBe(overlapComm.coverImageUrl);
    expect(overlapCard?.cover).toContain('200% 200% no-repeat url("https://example.invalid/community-cover.jpg")');

    // Mở lại cùng user trong 30 giây: dùng bộ nhớ đệm, không gọi lại API
    first.unmount();
    host.reset();
    const second = renderHook((uid: number | undefined) => useLibraryCatalog(uid), 42);
    expect(second.result.current.storiesLoading).toBe(false);
    expect(second.result.current.stories.map((s) => s.id)).toEqual([1, 3, 4]);
    expect(getMineSpy).toHaveBeenCalledTimes(1);
    expect(getCommSpy).toHaveBeenCalledTimes(1);

    // Đổi sang user khác: không hiển thị dữ liệu cache của user cũ và gọi lại API
    second.rerender(99);
    await vi.waitFor(() => {
      expect(getMineSpy).toHaveBeenCalledTimes(2);
      expect(getCommSpy).toHaveBeenCalledTimes(2);
    });
  });

  it("communityOnly (Thư viện Creator) loads only GET /Story/community and keeps its own cache", async () => {
    const getMineSpy = vi.spyOn(storyService, "getStories");
    const getCommSpy = vi.spyOn(storyService, "getCommunityStories").mockResolvedValue({
      success: true,
      data: { items: [makeCommunityDto({ id: 5, viewCount: 9 })], totalCount: 1, pageIndex: 1, pageSize: 100, totalPages: 1, hasPreviousPage: false, hasNextPage: false },
    });

    const hook = renderHook((uid: number | undefined) => useLibraryCatalog(uid, { communityOnly: true }), 42);
    await vi.waitFor(() => {
      expect(hook.result.current.storiesLoading).toBe(false);
    });
    expect(getMineSpy).not.toHaveBeenCalled();
    expect(hook.result.current.stories.map((s) => [s.id, s.creator, s.viewCount])).toEqual([[5, true, 9]]);

    // Bộ nhớ đệm của Thư viện Creator không dùng chung với thư viện phụ huynh của cùng tài khoản.
    hook.unmount();
    host.reset();
    getMineSpy.mockResolvedValue({ success: true, data: { items: [], totalCount: 0, pageIndex: 1, pageSize: 100, totalPages: 0, hasPreviousPage: false, hasNextPage: false } });
    renderHook((uid: number | undefined) => useLibraryCatalog(uid), 42);
    await vi.waitFor(() => {
      expect(getMineSpy).toHaveBeenCalledTimes(1);
      expect(getCommSpy).toHaveBeenCalledTimes(2);
    });
  });

  it("handles rejected requests cleanly and supports retryStories", async () => {
    vi.spyOn(storyService, "getStories").mockRejectedValueOnce(new Error("Mất kết nối mạng"));
    vi.spyOn(storyService, "getCommunityStories").mockResolvedValueOnce({
      success: true,
      data: { items: [], totalCount: 0, pageIndex: 1, pageSize: 100, totalPages: 0, hasPreviousPage: false, hasNextPage: false },
    });

    const hook = renderHook((uid: number | undefined) => useLibraryCatalog(uid), 7);
    await vi.waitFor(() => {
      expect(hook.result.current.storiesLoading).toBe(false);
    });
    expect(hook.result.current.error).toBe("Mất kết nối mạng");

    vi.spyOn(storyService, "getStories").mockResolvedValueOnce({
      success: true,
      data: {
        items: [makeStoryDto({ id: 88, title: "Truyện tải lại" })],
        totalCount: 1,
        pageIndex: 1,
        pageSize: 100,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });
    vi.spyOn(storyService, "getCommunityStories").mockResolvedValueOnce({
      success: true,
      data: { items: [], totalCount: 0, pageIndex: 1, pageSize: 100, totalPages: 0, hasPreviousPage: false, hasNextPage: false },
    });

    hook.result.current.retryStories();
    await vi.waitFor(() => {
      expect(hook.result.current.storiesLoading).toBe(false);
      expect(hook.result.current.stories.map((s) => s.id)).toEqual([88]);
    });
    expect(hook.result.current.error).toBeNull();
  });

  it("ignores late responses after unmount without populating session cache", async () => {
    let resolveLate!: (val: unknown) => void;
    const getStoriesSpy = vi.spyOn(storyService, "getStories").mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLate = resolve;
      }) as never,
    );
    vi.spyOn(storyService, "getCommunityStories").mockResolvedValueOnce({
      success: true,
      data: { items: [], totalCount: 0, pageIndex: 1, pageSize: 100, totalPages: 0, hasPreviousPage: false, hasNextPage: false },
    });

    const lateHook = renderHook((uid: number | undefined) => useLibraryCatalog(uid), 55);
    lateHook.unmount();

    resolveLate({
      success: true,
      data: {
        items: [makeStoryDto({ id: 999, title: "Truyện đến muộn" })],
        totalCount: 1,
        pageIndex: 1,
        pageSize: 100,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });
    await Promise.resolve();
    await Promise.resolve();

    // Mount lại cùng user 55: cache phải rỗng nên vẫn phải tải mới
    host.reset();
    getStoriesSpy.mockClear();
    getStoriesSpy.mockResolvedValueOnce({
      success: true,
      data: { items: [], totalCount: 0, pageIndex: 1, pageSize: 100, totalPages: 0, hasPreviousPage: false, hasNextPage: false },
    });
    vi.spyOn(storyService, "getCommunityStories").mockResolvedValueOnce({
      success: true,
      data: { items: [], totalCount: 0, pageIndex: 1, pageSize: 100, totalPages: 0, hasPreviousPage: false, hasNextPage: false },
    });
    renderHook((uid: number | undefined) => useLibraryCatalog(uid), 55);
    expect(getStoriesSpy).toHaveBeenCalledTimes(1);
  });

  it("surfaces error without caching when APIs fail with empty message, preserves stale cache on refresh failure, and clears error on user switch", async () => {
    const getMineSpy = vi.spyOn(storyService, "getStories").mockResolvedValueOnce({
      success: false,
      message: "",
      data: null,
    });
    const getCommSpy = vi.spyOn(storyService, "getCommunityStories").mockResolvedValueOnce({
      success: false,
      message: "",
      data: null,
    });

    const hook = renderHook((uid: number | undefined) => useLibraryCatalog(uid), 77);
    await vi.waitFor(() => {
      expect(hook.result.current.storiesLoading).toBe(false);
    });
    expect(hook.result.current.error).toBe("Không thể tải thư viện truyện.");
    expect(hook.result.current.stories).toEqual([]);

    // Đổi sang user mới khi user cũ đang lỗi: phải xoá lỗi cũ ngay trong lúc đang tải
    let resolveNextUser!: (v: unknown) => void;
    getMineSpy.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveNextUser = resolve;
      }) as never,
    );
    getCommSpy.mockResolvedValueOnce({
      success: true,
      data: { items: [], totalCount: 0, pageIndex: 1, pageSize: 100, totalPages: 0, hasPreviousPage: false, hasNextPage: false },
    });
    hook.rerender(88);
    expect(hook.result.current.error).toBeNull();
    expect(hook.result.current.storiesLoading).toBe(true);

    // Hoàn tất tải cho user 88 để tạo cache
    resolveNextUser({
      success: true,
      data: {
        items: [makeStoryDto({ id: 501, title: "Truyện đã lưu đệm" })],
        totalCount: 1,
        pageIndex: 1,
        pageSize: 100,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });
    await vi.waitFor(() => {
      expect(hook.result.current.storiesLoading).toBe(false);
      expect(hook.result.current.stories.map((s) => s.id)).toEqual([501]);
    });

    // Giả lập cache quá hạn (>30s) và lần tải nền kế tiếp thất bại cả hai đầu API: giữ truyện cũ + hiện lỗi
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(Date.now() + 60_000);
    hook.unmount();
    host.reset();
    getMineSpy.mockResolvedValueOnce({ success: false, message: "Mất kết nối máy chủ", data: null });
    getCommSpy.mockResolvedValueOnce({ success: false, message: "Mất kết nối máy chủ", data: null });

    const staleHook = renderHook((uid: number | undefined) => useLibraryCatalog(uid), 88);
    await vi.waitFor(() => {
      expect(staleHook.result.current.error).toBe("Mất kết nối máy chủ");
    });
    expect(staleHook.result.current.stories.map((s) => s.id)).toEqual([501]);
    nowSpy.mockRestore();
  });
});
