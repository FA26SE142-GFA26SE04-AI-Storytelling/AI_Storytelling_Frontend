"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { childProfileService } from "@/app/services/childProfileService";
import { storyService } from "@/app/services/storyService";
import type { ChildProfile } from "@/app/types/childProfile";
import { toCard, statusKey, type StoryCard } from "@/app/lib/storyView";

type DataState = {
  children: ChildProfile[];
  childrenLoading: boolean;
  child: ChildProfile | null;
  selectChild: (id: number) => void;
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
  const [kids, setKids] = useState<ChildProfile[]>([]);
  const [kidsLoading, setKidsLoading] = useState(true);
  const [childId, setChildId] = useState<number | null>(null);
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void childProfileService.getMyChildProfiles().then((res) => {
      if (!alive) return;
      const list = (res.data ?? []).filter((c) => !/archived/i.test(c.status));
      setKids(list);
      setChildId((cur) => cur ?? list.find((c) => /active/i.test(c.status))?.id ?? list[0]?.id ?? null);
      if (!res.success) setError(res.message);
      setKidsLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const reload = useCallback(async () => {
    if (childId === null) { setStories([]); return; }
    setStoriesLoading(true);
    const res = await storyService.getStories({ childProfileId: childId, pageSize: 100, sortBy: "createdAt", sortDescending: true });
    setStories((res.data?.items ?? []).map(toCard));
    setError(res.success ? null : res.message);
    setStoriesLoading(false);
  }, [childId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<DataState>(() => ({
    children: kids,
    childrenLoading: kidsLoading,
    child: kids.find((c) => c.id === childId) ?? null,
    selectChild: setChildId,
    stories,
    storiesLoading,
    error,
    reload,
    reviewQueue: stories.filter((s) => statusKey(s.raw) === "content_review"),
  }), [kids, kidsLoading, childId, stories, storiesLoading, error, reload]);

  return <Ctx.Provider value={value}>{node}</Ctx.Provider>;
}
