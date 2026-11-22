"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { storyService } from "@/app/services/storyService";
import { statusKey, toCard, type StoryCard } from "@/app/lib/storyView";
import type { StoryDto } from "@/app/types/story";

/** Thư viện chỉ hiện truyện đã duyệt: "ready/published" là đọc được, "approved/media_*" là đã duyệt nhưng đang chuẩn bị tranh và giọng đọc. */
const READY_KEYS = ["ready", "published"];
const PREPARING_KEYS = ["approved", "media_processing", "media_review"];

export const isReady = (s: StoryCard) => READY_KEYS.includes(statusKey(s.raw));
const isShown = (s: StoryCard) => s.raw.isPublished && !s.family && (isReady(s) || PREPARING_KEYS.includes(statusKey(s.raw)));

/**
 * Bộ nhớ đệm của thư viện trong phiên: mở lại trang thì hiện ngay truyện đã tải, rồi tải bản mới ở nền.
 * Gắn với người dùng để đăng nhập tài khoản khác không thấy dữ liệu cũ.
 */
let pubCache: { userId: number; cards: StoryCard[]; at: number } | null = null;
const PUB_FRESH_MS = 30_000;

/** Tải lần lượt mọi trang của một API danh sách (mỗi trang tối đa 100 truyện, giới hạn của backend). */
async function loadAllPages<T extends StoryDto = StoryDto>(
  fetchPage: (pageIndex: number) => Promise<{ success: boolean; data?: { items?: T[]; hasNextPage?: boolean; totalCount?: number } | null; message?: string | null }>
) {
  const items: T[] = [];
  for (let pageIndex = 1; pageIndex <= 50; pageIndex++) {
    const res = await fetchPage(pageIndex);
    if (!res.success) return { items, message: res.message ?? null };
    const page = res.data?.items ?? [];
    items.push(...page);
    if (page.length === 0 || res.data?.hasNextPage === false || items.length >= (res.data?.totalCount ?? Infinity)) break;
  }
  return { items, message: null as string | null };
}

/**
 * Truyện của thư viện phụ huynh: gộp GET /Story với GET /Story/community (truyện nhà sáng tạo đã duyệt, có lượt đọc/yêu thích),
 * chỉ giữ truyện đã công khai và đã được duyệt, mới tạo xếp trước.
 */
export function useLibraryStories() {
  const { user } = useAuth();
  const cached = pubCache && pubCache.userId === user?.id ? pubCache : null;
  const [cards, setCards] = useState<StoryCard[]>(() => cached?.cards ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [mine, community] = await Promise.all([
      loadAllPages((pageIndex) => storyService.getStories({ pageIndex, pageSize: 100, isDescending: true })),
      loadAllPages((pageIndex) => storyService.getCommunityStories({ pageIndex, pageSize: 100, isDescending: true })),
    ]);
    const ids = new Set(mine.items.map((s) => s.id));
    const communityMap = new Map(community.items.map((s) => [s.id, s]));
    const all = [...mine.items, ...community.items.filter((s) => !ids.has(s.id))];
    const next: StoryCard[] = all.map((s) => {
      const comm = communityMap.get(s.id);
      return comm ? { ...toCard(s), creator: true, viewCount: comm.viewCount, favoriteCount: comm.favoriteCount } : toCard(s);
    });
    const message = mine.message ?? community.message;
    setCards(next);
    if (!message && user) pubCache = { userId: user.id, cards: next, at: Date.now() };
    setError(message);
    setLoading(false);
  }, [user]);

  // Có dữ liệu đệm còn mới thì không tải lại; cũ hơn 30 giây thì vẫn hiện ngay và tải bản mới ở nền.
  useEffect(() => {
    if (cached && Date.now() - cached.at < PUB_FRESH_MS) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const stories = useMemo(
    () => cards.filter(isShown).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [cards],
  );
  return { stories, loading, error, reload: load };
}
