"use client";

import { useEffect, useState } from "react";
import { storyService } from "@/app/services/storyService";
import type { CommunityLibraryStoryDto, CommunityStoryOrderBy } from "@/app/types/backendContracts";

/**
 * Hook tải dữ liệu cho hai kệ "Đọc nhiều nhất" và "Được yêu thích" ở thư viện phụ huynh.
 * Khi enabled là true, tải song song danh sách truyện cộng đồng theo lượt đọc và lượt yêu thích;
 * chỉ giữ các truyện có số lượt lớn hơn 0 và giữ nguyên thứ tự sắp xếp từ backend.
 */
export function useCommunityStatShelves(enabled: boolean): {
  mostViewed: CommunityLibraryStoryDto[];
  mostFavorited: CommunityLibraryStoryDto[];
} {
  const [mostViewed, setMostViewed] = useState<CommunityLibraryStoryDto[]>([]);
  const [mostFavorited, setMostFavorited] = useState<CommunityLibraryStoryDto[]>([]);

  useEffect(() => {
    if (!enabled) {
      setMostViewed([]);
      setMostFavorited([]);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function loadShelves() {
      try {
        const viewsOrder: CommunityStoryOrderBy = "views";
        const favoritesOrder: CommunityStoryOrderBy = "favorites";

        const [viewsRes, favsRes] = await Promise.all([
          storyService.getCommunityStories({ orderBy: viewsOrder, isDescending: true, pageSize: 10 }),
          storyService.getCommunityStories({ orderBy: favoritesOrder, isDescending: true, pageSize: 10 }),
        ]);

        if (cancelled || controller.signal.aborted) {
          return;
        }

        const nextViewed =
          viewsRes.success && viewsRes.data?.items
            ? viewsRes.data.items.filter((story) => (story.viewCount ?? 0) > 0)
            : [];

        const nextFavorited =
          favsRes.success && favsRes.data?.items
            ? favsRes.data.items.filter((story) => (story.favoriteCount ?? 0) > 0)
            : [];

        setMostViewed(nextViewed);
        setMostFavorited(nextFavorited);
      } catch (err: unknown) {
        if (cancelled || controller.signal.aborted) {
          return;
        }
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setMostViewed([]);
        setMostFavorited([]);
      }
    }

    void loadShelves();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled]);

  return { mostViewed, mostFavorited };
}
