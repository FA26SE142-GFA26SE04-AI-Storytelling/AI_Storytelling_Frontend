"use client";

import { useEffect, useState } from "react";
import { roadmapService } from "@/app/services/roadmapService";
import { storyService } from "@/app/services/storyService";
import { coverFor, DEFAULT_COVER } from "@/app/lib/storyView";
import type * as B from "@/app/types/backendContracts";

/**
 * Dữ liệu dùng chung của trang Lộ trình, có bộ nhớ đệm theo phiên để mỗi lộ trình mẫu / ảnh bìa chỉ tải một lần.
 * API lộ trình mẫu không có ảnh bìa nên bìa album ghép từ ảnh bìa của vài truyện đầu (GET /Story/{id}).
 */
/** Danh sách lộ trình mẫu dùng chung trong phiên: các trang mở lại thấy ngay, tải lại ở nền khi đã cũ hơn 60 giây. */
let listCache: { data: B.RoadmapLibraryItemDto[]; at: number } | null = null;
let listLoading: Promise<{ data: B.RoadmapLibraryItemDto[] | null; error: string | null }> | null = null;

function loadTemplateList() {
  listLoading ??= (async () => {
    const all: B.RoadmapLibraryItemDto[] = [];
    for (let pageIndex = 1; pageIndex <= 20; pageIndex++) {
      const r = await roadmapService.library({ pageIndex, pageSize: 50 });
      if (!r.success || !r.data) return { data: listCache?.data ?? all, error: r.message };
      all.push(...r.data.items);
      if (!r.data.hasNextPage) break;
    }
    listCache = { data: all, at: Date.now() };
    return { data: all, error: null };
  })().finally(() => { listLoading = null; });
  return listLoading;
}

/** Danh sách lộ trình mẫu đã xuất bản (chỉ danh sách); chi tiết từng album tải riêng bằng useTemplateDetail. */
export function useRoadmapTemplates() {
  const [templates, setTemplates] = useState<B.RoadmapLibraryItemDto[] | null>(() => listCache?.data ?? null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (listCache && Date.now() - listCache.at < 60_000) return;
    let alive = true;
    void loadTemplateList().then((r) => { if (alive) { setTemplates(r.data); setError(r.error); } });
    return () => { alive = false; };
  }, []);
  return { templates, error };
}

const details = new Map<number, Promise<B.RoadmapLibraryDetailDto | null>>();
const covers = new Map<number, Promise<string>>();

export function loadTemplateDetail(id: number) {
  let p = details.get(id);
  if (!p) {
    p = roadmapService.detail(id).then((r) => (r.success ? r.data : null));
    details.set(id, p);
    // Lỗi thì bỏ khỏi bộ nhớ đệm để lần mở sau thử lại.
    void p.then((d) => { if (!d) details.delete(id); });
  }
  return p;
}

/** Chi tiết một lộ trình mẫu (danh sách truyện theo thứ tự). `null` khi đang tải hoặc lỗi. */
export function useTemplateDetail(id: number | null) {
  const [state, setState] = useState<{ id: number; data: B.RoadmapLibraryDetailDto | null; done: boolean } | null>(null);
  useEffect(() => {
    if (id === null) return;
    let alive = true;
    void loadTemplateDetail(id).then((data) => { if (alive) setState({ id, data, done: true }); });
    return () => { alive = false; };
  }, [id]);
  const current = state && state.id === id ? state : null;
  return { detail: current?.data ?? null, loading: id !== null && !current?.done };
}

/**
 * Ảnh bìa của truyện cộng đồng (của Creator đã công khai), theo mã truyện. GET /Story/{id} không trả các truyện này
 * ("Không tìm thấy") nên lấy từ GET /Story/community — API này trả bìa đã đổi thành link thật. Tải một lần, nhớ lại.
 */
let communityCovers: Promise<Map<number, string | null>> | null = null;
function loadCommunityCovers() {
  communityCovers ??= (async () => {
    const map = new Map<number, string | null>();
    for (let pageIndex = 1; pageIndex <= 20; pageIndex++) {
      const r = await storyService.getCommunityStories({ pageIndex, pageSize: 100 });
      if (!r.success || !r.data) break;
      r.data.items.forEach((s) => map.set(s.id, s.coverImageUrl ?? null));
      if (!r.data.hasNextPage) break;
    }
    return map;
  })().catch(() => { communityCovers = null; return new Map(); });
  return communityCovers;
}

function loadCover(storyId: number) {
  let p = covers.get(storyId);
  if (!p) {
    p = storyService.getStoryById(storyId)
      .then(async (r) => {
        if (r.success && r.data) return coverFor(r.data.coverImageUrl);
        // Không tìm thấy qua GET /Story/{id}: có thể là truyện cộng đồng.
        const community = await loadCommunityCovers();
        return community.has(storyId) ? coverFor(community.get(storyId)) : DEFAULT_COVER;
      })
      .catch(() => DEFAULT_COVER);
    covers.set(storyId, p);
  }
  return p;
}

/** Giá trị CSS `background` của bìa từng truyện; truyện chưa tải xong hoặc không có ảnh dùng bìa mẫu chung. */
export function useStoryCovers(storyIds: number[]) {
  const key = storyIds.join(",");
  const [map, setMap] = useState<Record<number, string>>({});
  useEffect(() => {
    if (!key) return;
    let alive = true;
    const ids = key.split(",").map(Number);
    void Promise.all(ids.map(async (id) => [id, await loadCover(id)] as const)).then((pairs) => {
      if (alive) setMap((m) => ({ ...m, ...Object.fromEntries(pairs) }));
    });
    return () => { alive = false; };
  }, [key]);
  return (id: number) => map[id] ?? DEFAULT_COVER;
}
