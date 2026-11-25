"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toCard, type StoryCard } from "@/app/lib/storyView";
import { storyService } from "@/app/services/storyService";
import type { StoryDto } from "@/app/types/story";
import { SHOWN_GROUPS, statusOf } from "./libraryFilters";

/**
 * Bộ nhớ đệm của thư viện trong phiên: mở lại trang thì hiện ngay truyện đã tải, rồi tải bản mới ở nền.
 * Gắn với người dùng để đăng nhập tài khoản khác không thấy dữ liệu cũ.
 */
let pubCache: { userId: number; communityOnly: boolean; cards: StoryCard[]; at: number } | null = null;
const PUB_FRESH_MS = 30_000;

/** Xoá bộ nhớ đệm phiên của thư viện (dùng cho kiểm thử hoặc khi cần làm mới hoàn toàn). */
export function clearLibraryCatalogCache() {
  pubCache = null;
}

/** Tải lần lượt mọi trang của một API danh sách (mỗi trang tối đa 100 truyện, giới hạn của backend). */
export async function loadAllPages<T extends StoryDto = StoryDto>(
  fetchPage: (pageIndex: number) => Promise<{
    success: boolean;
    data?: { items?: T[]; hasNextPage?: boolean; totalCount?: number } | null;
    message?: string | null;
  }>,
) {
  const items: T[] = [];
  for (let pageIndex = 1; pageIndex <= 50; pageIndex++) {
    const res = await fetchPage(pageIndex);
    if (!res.success) return { items, message: res.message?.trim() || "Không thể tải thư viện truyện." };
    const page = res.data?.items ?? [];
    items.push(...page);
    if (page.length === 0 || res.data?.hasNextPage === false || items.length >= (res.data?.totalCount ?? Infinity)) break;
  }
  return { items, message: null as string | null };
}

/**
 * Hook tải danh mục truyện thư viện phụ huynh (truyện gia đình + truyện cộng đồng đã xuất bản),
 * gộp thống kê lượt đọc/yêu thích và lưu bộ nhớ đệm ngắn theo từng tài khoản.
 * `communityOnly`: chỉ tải truyện cộng đồng (Thư viện của Content Creator, không có truyện gia đình).
 */
export function useLibraryCatalog(userId: number | undefined, { communityOnly = false }: { communityOnly?: boolean } = {}) {
  const initialCache = pubCache && pubCache.userId === userId && pubCache.communityOnly === communityOnly ? pubCache : null;
  const [pub, setPub] = useState<StoryCard[]>(() => initialCache?.cards ?? []);
  const [storiesLoading, setStoriesLoading] = useState(!initialCache);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  const loadPublic = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    try {
      const [mine, community] = await Promise.all([
        communityOnly
          ? { items: [] as StoryDto[], message: null }
          : loadAllPages((pageIndex) => storyService.getStories({ pageIndex, pageSize: 100, isDescending: true })),
        loadAllPages((pageIndex) => storyService.getCommunityStories({ pageIndex, pageSize: 100, isDescending: true })),
      ]);
      if (reqId !== reqIdRef.current) return;
      const ids = new Set(mine.items.map((s) => s.id));
      const communityMap = new Map(community.items.map((s) => [s.id, s]));
      const all = [...mine.items, ...community.items.filter((s) => !ids.has(s.id))];
      const cards: StoryCard[] = all.map((s) => {
        const comm = communityMap.get(s.id);
        return comm
          ? { ...toCard(comm), creator: true, viewCount: comm.viewCount, favoriteCount: comm.favoriteCount }
          : toCard(s);
      });
      const message = mine.message || community.message || null;
      if (cards.length > 0 || !message) setPub(cards);
      if (!message && userId !== undefined) pubCache = { userId, communityOnly, cards, at: Date.now() };
      setError(message);
    } catch (err: unknown) {
      if (reqId !== reqIdRef.current) return;
      setError(err instanceof Error && err.message ? err.message : "Không thể tải thư viện truyện.");
    } finally {
      if (reqId === reqIdRef.current) setStoriesLoading(false);
    }
  }, [userId, communityOnly]);

  useEffect(() => {
    const currentCache = pubCache && pubCache.userId === userId && pubCache.communityOnly === communityOnly ? pubCache : null;
    if (currentCache && Date.now() - currentCache.at < PUB_FRESH_MS) {
      setPub(currentCache.cards);
      setError(null);
      setStoriesLoading(false);
    } else {
      setPub(currentCache?.cards ?? []);
      setError(null);
      setStoriesLoading(!currentCache);
      void loadPublic();
    }
    return () => {
      reqIdRef.current += 1;
    };
  }, [userId, communityOnly, loadPublic]);

  const retryStories = useCallback(() => {
    setError(null);
    setStoriesLoading(true);
    void loadPublic();
  }, [loadPublic]);

  const stories = useMemo(
    () => pub.filter((s) => s.raw.isPublished && (SHOWN_GROUPS as readonly string[]).includes(statusOf(s))),
    [pub],
  );

  return { stories, storiesLoading, error, retryStories };
}
