"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { childProfileService } from "@/app/services/childProfileService";
import { storyService } from "@/app/services/storyService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { StoryDto } from "@/app/types/story";
import { toCard, statusKey, type StoryCard } from "@/app/lib/storyView";

/** Dữ liệu dùng chung của khu phụ huynh. Không có "bé đang chọn": trang nào cần bé thì tự giữ lựa chọn hoặc hỏi bằng chooseChild. */
type DataState = {
  children: ChildProfile[];
  childrenLoading: boolean;
  /** Tải lại danh sách bé (sau khi tạo, sửa, kích hoạt, nhận lời mời). */
  reloadChildren: () => Promise<void>;
  stories: StoryCard[];
  storiesLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  reviewQueue: StoryCard[];
};

const Ctx = createContext<DataState | null>(null);

export function useWorkspaceData(): DataState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWorkspaceData phải nằm trong WorkspaceDataProvider");
  return v;
}

export function WorkspaceDataProvider({ children: node }: { children: React.ReactNode }) {
  const meId = useAuth().user?.id;
  const [kids, setKids] = useState<ChildProfile[]>([]);
  const [kidsLoading, setKidsLoading] = useState(true);
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadChildren = useCallback(async () => {
    const res = await childProfileService.getMyChildProfiles();
    const list = (res.data ?? []).filter((c) => !/archived/i.test(c.status));
    setKids(list);
    if (!res.success) setError(res.message);
    setKidsLoading(false);
  }, []);

  useEffect(() => {
    void reloadChildren();
  }, [reloadChildren]);

  const reload = useCallback(async () => {
    if (!meId) { setStories([]); return; }
    setStoriesLoading(true);
    // Backend chưa lọc được theo hồ sơ bé: tạm lấy truyện do mình tạo (gồm truyện của mọi bé mình quản lý).
    // Mỗi trang tối đa 100 truyện (giới hạn của backend) nên tải lần lượt tới hết.
    const all: StoryDto[] = [];
    let message: string | null = null;
    for (let pageIndex = 1; pageIndex <= 50; pageIndex++) {
      const res = await storyService.getStories({ authorUserId: meId, pageIndex, pageSize: 100, isDescending: true });
      if (!res.success) { message = res.message; break; }
      const items = res.data?.items ?? [];
      all.push(...items);
      if (items.length === 0 || all.length >= (res.data?.totalCount ?? 0)) break;
    }
    setStories(all.map(toCard));
    setError(message);
    setStoriesLoading(false);
  }, [meId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<DataState>(() => ({
    children: kids,
    childrenLoading: kidsLoading,
    reloadChildren,
    stories,
    storiesLoading,
    error,
    reload,
    reviewQueue: stories.filter((s) => statusKey(s.raw) === "content_review"),
  }), [kids, kidsLoading, stories, storiesLoading, error, reload, reloadChildren]);

  return <Ctx.Provider value={value}>{node}</Ctx.Provider>;
}
