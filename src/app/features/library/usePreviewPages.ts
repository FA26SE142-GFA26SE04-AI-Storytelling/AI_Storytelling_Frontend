"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiStoryCreationService } from "@/app/services/aiStoryCreationService";
import { parentAuthoringService } from "@/app/services/parentAuthoringService";
import { storyService } from "@/app/services/storyService";
import { splitScenes, type StoryCard } from "@/app/lib/storyView";
import type { StoryDto } from "@/app/types/story";

/** Một trang khi đọc: chữ của cảnh, các tranh và đoạn giọng đọc (đã sẵn sàng, có URL) của cảnh đó. */
export type PreviewPage = { text: string; images: string[]; audio: { url: string; label: string }[] };

/**
 * Xem trước truyện như bé thấy — không ghi nhận lượt đọc, không cộng điểm.
 * Truyện AI lấy từng cảnh từ gói media của backend (GET /stories/{id}/media/package: chữ, tranh, giọng đọc);
 * chưa có gói media (hoặc truyện thủ công) thì chỉ hiện chữ, chia đoạn theo nội dung truyện.
 */
export type PreviewStory = Pick<StoryCard, "id" | "title" | "cover"> & {
  family?: boolean;
  creator?: boolean;
  raw?: Pick<StoryDto, "content">;
};

/**
 * Bộ nhớ tạm của hộp xem trước (sống đến khi tải lại trang): đóng rồi mở lại cùng truyện thì dùng ngay, không gọi API nữa.
 * Đường dẫn ảnh/giọng đọc là URL có chữ ký nên chỉ giữ ngắn; ảnh lỗi thì xoá mục tương ứng để lần sau lấy đường dẫn mới.
 */
const PREVIEW_CACHE = new Map<string, { pages: PreviewPage[]; at: number }>();
const PREVIEW_TTL_MS = 5 * 60_000;

/** Xoá bộ nhớ tạm của hộp xem trước (dùng cho kiểm thử hoặc khi cần tải mới toàn bộ). */
export function clearPreviewPagesCache() {
  PREVIEW_CACHE.clear();
}

/** Tải nội dung + gói media từng cảnh của truyện cho hộp Xem trước, kèm bộ nhớ tạm ngắn và tải trước trang kế. */
export function usePreviewPages(story: PreviewStory, page: number, loadContent?: () => Promise<string>) {
  const [pages, setPages] = useState<PreviewPage[] | null>(null);
  const loadContentRef = useRef(loadContent);
  useEffect(() => {
    loadContentRef.current = loadContent;
  });

  const storyId = story.id;
  const isFamily = Boolean(story.family);
  const isCreator = Boolean(story.creator);
  const rawContent = story.raw?.content ?? "";
  const hasLoadContent = Boolean(loadContent);
  const cacheKey = `${storyId}:${isFamily ? "f" : isCreator ? "r" : "s"}:${hasLoadContent ? "c" : "p"}:${rawContent.length}`;

  useEffect(() => {
    // Creator sửa nội dung liên tục và nguồn chữ riêng không có dấu hiệu đổi, nên không dùng bộ nhớ tạm cho họ.
    const hit = hasLoadContent ? undefined : PREVIEW_CACHE.get(cacheKey);
    if (hit && Date.now() - hit.at < PREVIEW_TTL_MS) {
      setPages(hit.pages);
      return;
    }
    setPages(null);
    const controller = new AbortController();
    const textOnly = (content: string): PreviewPage[] =>
      splitScenes(content).map((text) => ({ text, images: [], audio: [] }));
    const load = async (): Promise<PreviewPage[]> => {
      const customLoader = loadContentRef.current;
      // Bản nháp thủ công của phụ huynh không nằm trong GET /Story và không có gói media: chỉ hiện chữ.
      if (isFamily && !customLoader) {
        const detail = await parentAuthoringService.get(storyId);
        const versionId = detail.data?.story.selectedVersionId;
        const version = versionId ? await parentAuthoringService.version(storyId, versionId) : null;
        return textOnly(version?.data?.content ?? "");
      }
      const [content, pack] = await Promise.all([
        customLoader
          ? customLoader().catch(() => "")
          : storyService
              .getStoryById(storyId, controller.signal)
              .then((r) => r.data?.content ?? rawContent)
              .catch(() => rawContent),
        // Truyện Creator đã công khai: ảnh/giọng đọc lấy qua API thư viện chung (API tạo media chỉ cho đúng tác giả).
        (isCreator && !customLoader
          ? storyService.getCommunityStoryMedia(storyId, controller.signal)
          : aiStoryCreationService.getMediaPackage(storyId, controller.signal)
        )
          .then((r) => (r.success ? r.data : null))
          .catch(() => null),
      ]);
      const texts = splitScenes(content);
      const scenes = pack?.scenes?.slice().sort((a, b) => a.sceneIndex - b.sceneIndex) ?? [];
      if (!scenes.length) return textOnly(content);
      return scenes.map((scene, i) => {
        const audio = (scene.audio ?? []).slice().sort((a, b) => a.segmentOrder - b.segmentOrder);
        return {
          text: scene.text?.trim() || audio.map((a) => a.text).join(" ").trim() || texts[i] || "",
          images: scene.illustrations
            .slice()
            .sort((a, b) => a.beatOrder - b.beatOrder)
            .flatMap((x) => (x.status === "Ready" && x.url ? [x.url] : [])),
          audio: audio.flatMap((a) =>
            a.status === "Ready" && a.url ? [{ url: a.url, label: `Đoạn ${a.segmentOrder + 1}` }] : [],
          ),
        };
      });
    };
    void load()
      .then((loadedPages) => {
        if (controller.signal.aborted) return;
        if (!hasLoadContent && loadedPages.length > 0) PREVIEW_CACHE.set(cacheKey, { pages: loadedPages, at: Date.now() });
        setPages(loadedPages);
      })
      .catch(() => {
        if (!controller.signal.aborted) setPages([]);
      });
    return () => controller.abort();
  }, [cacheKey, storyId, isFamily, isCreator, rawContent, hasLoadContent]);

  // Tải sẵn tranh và giọng đọc của trang hiện tại và trang kế để lật trang không phải chờ.
  const warm = useRef<(HTMLImageElement | HTMLAudioElement)[]>([]);
  useEffect(() => {
    if (!pages) return;
    const items: (HTMLImageElement | HTMLAudioElement)[] = [];
    for (const p of [pages[page], pages[page + 1]]) {
      if (!p) continue;
      if (typeof Image !== "undefined") {
        p.images.forEach((url) => {
          const image = new Image();
          image.src = url;
          items.push(image);
        });
      }
      if (p.audio[0] && typeof Audio !== "undefined") {
        const audio = new Audio();
        audio.preload = "auto";
        audio.src = p.audio[0].url;
        items.push(audio);
      }
    }
    warm.current = items;
  }, [pages, page]);

  const invalidateCache = useCallback(() => {
    PREVIEW_CACHE.delete(cacheKey);
  }, [cacheKey]);

  return { pages, invalidateCache };
}
