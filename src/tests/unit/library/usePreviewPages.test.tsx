import { afterEach, describe, expect, it, vi } from "vitest";
import { aiStoryCreationService } from "@/app/services/aiStoryCreationService";
import { parentAuthoringService } from "@/app/services/parentAuthoringService";
import { storyService } from "@/app/services/storyService";
import type { StoryMediaPackage } from "@/app/types/aiStory";
import type { StoryDto } from "@/app/types/story";

const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  const sameDeps = (a: readonly unknown[] | undefined, b: readonly unknown[] | undefined) =>
    !!a && !!b && a.length === b.length && b.every((value, index) => Object.is(value, a[index]));

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
    useEffect(effect: () => void | (() => void), deps?: readonly unknown[]) {
      const index = cursor++;
      if (deps === undefined || !sameDeps(slots[index]?.deps, deps)) {
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
  useEffect: host.useEffect,
}));

import { clearPreviewPagesCache, usePreviewPages, type PreviewStory } from "@/app/features/library/usePreviewPages";

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

function makeMediaPackage(text: string, imageUrl = "https://cdn.example.invalid/p1.png"): StoryMediaPackage {
  return {
    storyId: 10,
    storyVersionId: 1,
    scenes: [
      {
        sceneIndex: 0,
        text,
        illustrations: [{ beatOrder: 0, status: "Ready", url: imageUrl }],
        audio: [{ segmentOrder: 0, status: "Ready", text, url: "https://cdn.example.invalid/a1.mp3" }],
      },
    ],
  } as unknown as StoryMediaPackage;
}

describe("usePreviewPages", () => {
  afterEach(() => {
    host.reset();
    clearPreviewPagesCache();
    vi.restoreAllMocks();
  });

  it("does not cache empty results from transient failures, caches loaded pages, and honors invalidateCache()", async () => {
    const story: PreviewStory = { id: 10, title: "Truyện cộng đồng", cover: "", creator: true, raw: { content: "" } };
    vi.spyOn(storyService, "getStoryById").mockResolvedValue({ success: false, message: "404", data: null });
    const mediaSpy = vi
      .spyOn(storyService, "getCommunityStoryMedia")
      .mockResolvedValueOnce({ success: false, message: "Timeout", data: null })
      .mockResolvedValueOnce({ success: true, message: "OK", data: makeMediaPackage("Cảnh hồi phục") })
      .mockResolvedValueOnce({ success: true, message: "OK", data: makeMediaPackage("Cảnh mới sau xoá đệm") });

    // Lần 1: media lỗi tạm -> trả [], KHÔNG lưu đệm
    const first = renderHook((p: { story: PreviewStory; page: number }) => usePreviewPages(p.story, p.page), {
      story,
      page: 0,
    });
    await vi.waitFor(() => {
      expect(first.result.current.pages).toEqual([]);
    });
    first.unmount();
    host.reset();

    // Lần 2: tải lại thành công và lưu đệm
    const second = renderHook((p: { story: PreviewStory; page: number }) => usePreviewPages(p.story, p.page), {
      story,
      page: 0,
    });
    await vi.waitFor(() => {
      expect(second.result.current.pages?.[0]?.text).toBe("Cảnh hồi phục");
    });
    expect(mediaSpy).toHaveBeenCalledTimes(2);

    // Lần 3: dùng lại bộ nhớ đệm, không gọi API thêm
    const invalidate = second.result.current.invalidateCache;
    second.unmount();
    host.reset();
    const third = renderHook((p: { story: PreviewStory; page: number }) => usePreviewPages(p.story, p.page), {
      story,
      page: 0,
    });
    expect(third.result.current.pages?.[0]?.text).toBe("Cảnh hồi phục");
    expect(mediaSpy).toHaveBeenCalledTimes(2);

    // Xoá đệm (ví dụ URL có chữ ký bị lỗi): lần mở sau phải tải mới
    invalidate();
    third.unmount();
    host.reset();
    const fourth = renderHook((p: { story: PreviewStory; page: number }) => usePreviewPages(p.story, p.page), {
      story,
      page: 0,
    });
    await vi.waitFor(() => {
      expect(fourth.result.current.pages?.[0]?.text).toBe("Cảnh mới sau xoá đệm");
    });
    expect(mediaSpy).toHaveBeenCalledTimes(3);
  });

  it("resets pages to null and aborts stale requests when story changes mid-fetch", async () => {
    let signalFirst: AbortSignal | undefined;
    let resolveFirst!: (val: unknown) => void;
    vi.spyOn(storyService, "getStoryById").mockImplementation((id, signal) => {
      if (id === 1) {
        signalFirst = signal;
        return new Promise((resolve) => {
          resolveFirst = resolve;
        }) as never;
      }
      return Promise.resolve({
        success: true,
        message: "OK",
        data: { id: 2, content: "Truyện thứ hai." } as StoryDto,
      });
    });
    vi.spyOn(aiStoryCreationService, "getMediaPackage").mockResolvedValue({
      success: false,
      message: "No media",
      data: null,
    });

    const hook = renderHook((s: PreviewStory) => usePreviewPages(s, 0), { id: 1, title: "Một", cover: "" });
    expect(hook.result.current.pages).toBeNull();

    // Đổi sang truyện 2 khi truyện 1 đang tải: hủy yêu cầu 1 và nhận kết quả truyện 2
    hook.rerender({ id: 2, title: "Hai", cover: "" });
    expect(signalFirst?.aborted).toBe(true);
    await vi.waitFor(() => {
      expect(hook.result.current.pages?.[0]?.text).toBe("Truyện thứ hai.");
    });

    // Truyện 1 trả về muộn không được ghi đè truyện 2
    resolveFirst({ success: true, message: "OK", data: { id: 1, content: "Truyện một muộn." } });
    await Promise.resolve();
    await Promise.resolve();
    expect(hook.result.current.pages?.[0]?.text).toBe("Truyện thứ hai.");
  });

  it("supports family drafts, custom loadContent without caching, and avoids refetch on cloned story objects", async () => {
    const parentGetSpy = vi.spyOn(parentAuthoringService, "get").mockResolvedValue({
      success: true,
      message: "OK",
      data: { story: { selectedVersionId: 5 } },
    } as never);
    vi.spyOn(parentAuthoringService, "version").mockResolvedValue({
      success: true,
      message: "OK",
      data: { content: "Đoạn gia đình 1.\n\nĐoạn gia đình 2." },
    } as never);

    const familyHook = renderHook((s: PreviewStory) => usePreviewPages(s, 0), {
      id: 30,
      title: "Truyện nhà",
      cover: "",
      family: true,
    });
    await vi.waitFor(() => {
      expect(familyHook.result.current.pages).toHaveLength(2);
    });
    // Truyền object mới có cùng thuộc tính: không tải lại
    familyHook.rerender({ id: 30, title: "Truyện nhà", cover: "", family: true });
    expect(parentGetSpy).toHaveBeenCalledTimes(1);
    familyHook.unmount();
    host.reset();

    // Nguồn chữ riêng (CreatorPreview): luôn gọi loadContent mới, không lưu đệm
    const customLoader = vi.fn().mockResolvedValueOnce("Bản thảo 1.").mockResolvedValueOnce("Bản thảo 2.");
    vi.spyOn(aiStoryCreationService, "getMediaPackage").mockResolvedValue({
      success: false,
      message: "No media",
      data: null,
    });

    const creatorA = renderHook(
      (p: { story: PreviewStory; load: () => Promise<string> }) => usePreviewPages(p.story, 0, p.load),
      { story: { id: 40, title: "Nháp creator", cover: "" }, load: customLoader },
    );
    await vi.waitFor(() => {
      expect(creatorA.result.current.pages?.[0]?.text).toBe("Bản thảo 1.");
    });
    creatorA.unmount();
    host.reset();

    const creatorB = renderHook(
      (p: { story: PreviewStory; load: () => Promise<string> }) => usePreviewPages(p.story, 0, p.load),
      { story: { id: 40, title: "Nháp creator", cover: "" }, load: customLoader },
    );
    await vi.waitFor(() => {
      expect(creatorB.result.current.pages?.[0]?.text).toBe("Bản thảo 2.");
    });
    expect(customLoader).toHaveBeenCalledTimes(2);
  });
});
