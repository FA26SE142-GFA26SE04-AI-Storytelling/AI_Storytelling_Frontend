"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Heart, Library, Search } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import { useRiseIn } from "@/app/lib/motion";
import { coverFor } from "@/app/lib/storyView";
import { showToast } from "@/app/lib/toast";
import { childReadingService } from "@/app/services/childReadingService";
import type { ChildStory } from "@/app/types/childReading";
import KidSearchAction from "./KidSearchAction";
import KidShelf from "./KidShelf";
import "@/app/styles/features/kid/kid-lobby.css";

interface KidShelvesProps {
  token: string; busy: boolean; unlockTitle?: string; refreshKey: number;
  onOpen: (storyId: number) => void;
  onLockChange?: (lock: { locked: boolean; unlockStoryId: number | null }) => void;
}

interface ShelfState {
  items: ChildStory[]; totalCount: number; pageSize: number; pageIndex: number; loading: boolean; loadingMore: boolean;
}

const initialShelf: ShelfState = {
  items: [], totalCount: 0, pageSize: 20, pageIndex: 1, loading: false, loadingMore: false,
};

export default function KidShelves({
  token, busy, unlockTitle, refreshKey, onOpen, onLockChange,
}: KidShelvesProps) {
  const [mine, setMine] = useState<ShelfState>(initialShelf);
  const [library, setLibrary] = useState<ShelfState>(initialShelf);
  const [lock, setLock] = useState<{ locked: boolean; unlockStoryId: number | null } | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<ChildStory[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => () => { searchAbortRef.current?.abort(); }, []);

  const prevLockRef = useRef<{ locked: boolean; unlockStoryId: number | null } | null>(null);
  useEffect(() => {
    if (!lock) return;
    if (!prevLockRef.current || prevLockRef.current.locked !== lock.locked || prevLockRef.current.unlockStoryId !== lock.unlockStoryId) {
      prevLockRef.current = lock;
      onLockChange?.(lock);
    }
  }, [lock, onLockChange]);

  const scope = useRef(0);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const run = ++scope.current;
    setMine((s) => ({ ...s, loading: true }));
    setLibrary((s) => ({ ...s, loading: true }));

    void Promise.all([
      childReadingService.stories(token, { source: "mine", pageIndex: 1 }, controller.signal),
      childReadingService.stories(token, { source: "library", pageIndex: 1 }, controller.signal),
    ]).then(([mineRes, libRes]) => {
      if (controller.signal.aborted || run !== scope.current) return;

      if (mineRes.success && mineRes.data) setMine({ items: mineRes.data.items, totalCount: mineRes.data.totalCount, pageSize: mineRes.data.pageSize, pageIndex: 1, loading: false, loadingMore: false });
      else { setMine((s) => ({ ...s, loading: false })); if (mineRes.message) showToast(mineRes.message, "err"); }

      if (libRes.success && libRes.data) setLibrary({ items: libRes.data.items, totalCount: libRes.data.totalCount, pageSize: libRes.data.pageSize, pageIndex: 1, loading: false, loadingMore: false });
      else { setLibrary((s) => ({ ...s, loading: false })); if (libRes.message) showToast(libRes.message, "err"); }

      const isLocked = Boolean((mineRes.success && mineRes.data?.isLocked) || (libRes.success && libRes.data?.isLocked));
      const unlockStoryId = (mineRes.success && mineRes.data?.isLocked ? mineRes.data.unlockStoryId : null) ?? (libRes.success && libRes.data?.isLocked ? libRes.data.unlockStoryId : null) ?? null;
      setLock({ locked: isLocked, unlockStoryId });
    });

    return () => {
      scope.current = run + 1;
      controller.abort();
    };
  }, [token, refreshKey]);

  const handleMore = async (source: "mine" | "library") => {
    const current = source === "mine" ? mine : library;
    const setter = source === "mine" ? setMine : setLibrary;
    if (current.loadingMore || current.items.length >= current.totalCount) return;

    const nextPage = current.pageIndex + 1;
    setter((s) => ({ ...s, loadingMore: true }));

    const r = await childReadingService.stories(token, { source, pageIndex: nextPage });
    if (r.success && r.data) {
      const data = r.data;
      if (data.isLocked) setLock({ locked: true, unlockStoryId: data.unlockStoryId ?? null });
      setter((s) => ({ ...s, items: [...s.items, ...data.items], totalCount: data.totalCount, pageSize: data.pageSize, pageIndex: nextPage, loadingMore: false }));
    } else {
      setter((s) => ({ ...s, loadingMore: false }));
      if (r.message) showToast(r.message, "err");
    }
  };

  const handleSearchSubmit = async (keyword: string) => {
    searchAbortRef.current?.abort();
    const ctrl = new AbortController();
    searchAbortRef.current = ctrl;
    setSearching(true);
    setSearchResults((prev) => prev ?? []);

    const r = await childReadingService.stories(token, { search: keyword, source: "", pageIndex: 1 }, ctrl.signal);
    if (ctrl.signal.aborted) return;
    if (r.success && r.data) setSearchResults(r.data.items);
    else { setSearchResults([]); if (r.message) showToast(r.message, "err"); }
    setSearching(false);
  };

  const handleCloseSearch = () => {
    searchAbortRef.current?.abort();
    searchAbortRef.current = null;
    setSearchOpen(false);
    setSearchResults(null);
    setSearching(false);
  };

  const shelvesRef = useRiseIn<HTMLDivElement>(".kid-shelf", [
    lock?.locked, mine.items.length, library.items.length, refreshKey,
  ]);

  const loading = mine.loading || library.loading;
  const empty = !loading && mine.items.length === 0 && library.items.length === 0;
  const waiting = loading && mine.items.length === 0 && library.items.length === 0;
  const showSearch = !lock?.locked && (mine.items.length > 0 || library.items.length > 0);

  const searchAction = showSearch ? (
    <KidSearchAction
      open={searchOpen} onOpen={() => setSearchOpen(true)}
      onSubmit={handleSearchSubmit} onClose={handleCloseSearch} searching={searching}
    />
  ) : undefined;

  const renderBookItem = (s: ChildStory) => (
    <button key={s.storyId} className="bk" disabled={busy} aria-label={"Đọc truyện " + s.title} onClick={() => onOpen(s.storyId)}>
      <span className="bk-cover" style={{ background: coverFor(s.coverImageUrl) }}>
        <span className="pill ok bk-badge"><BookOpen className="ic" aria-hidden="true" />Đọc được</span>
        {!s.coverImageUrl && <span className="bk-name display">{s.title}</span>}
      </span>
      <span className="bk-title">{s.title}</span>
      {s.description && <span className="bk-meta">{s.description}</span>}
    </button>
  );

  return (
    <div ref={shelvesRef}>
      {waiting && <div className="kid-shelves-loading" role="status" aria-label="Đang tải truyện"><span className="kid-skeleton" /><span className="kid-skeleton" /></div>}
      {lock?.locked ? (
        <KidShelf title="Truyện em có thể đọc" icon={BookOpen} tone="gold">
          <button className="bk" disabled={busy} aria-label={"Đọc lại truyện " + (unlockTitle ?? "đang mở")} onClick={() => { if (lock.unlockStoryId) onOpen(lock.unlockStoryId); }}>
            <span className="bk-cover" style={{ background: coverFor() }}>
              <span className="pill ok bk-badge"><BookOpen className="ic" aria-hidden="true" />Đọc được</span>
              <span className="bk-name display">{unlockTitle ?? "Truyện đang mở"}</span>
            </span>
            <span className="bk-title">{unlockTitle ?? "Truyện đang mở"}</span>
            <span className="bk-meta">Em đọc lại truyện này nhé</span>
          </button>
        </KidShelf>
      ) : (
        <>
          {searchResults !== null && (
            <KidShelf title="Kết quả tìm" icon={Search} tone="sky" hasMore={false}>
              {searching ? (
                <p role="status">Đang tìm truyện…</p>
              ) : searchResults.length === 0 ? (
                <p>Chưa có truyện phù hợp. Em thử từ khác nhé.</p>
              ) : searchResults.map(renderBookItem)}
            </KidShelf>
          )}

          {mine.items.length > 0 && (
            <KidShelf title="Truyện của em" icon={Heart} tone="rose" action={searchAction} hasMore={mine.totalCount > mine.items.length} loadingMore={mine.loadingMore} onMore={() => void handleMore("mine")}>
              {mine.items.map(renderBookItem)}
            </KidShelf>
          )}

          {library.items.length > 0 && (
            <KidShelf title="Thư viện" icon={Library} tone="sky" action={mine.items.length === 0 ? searchAction : undefined} hasMore={library.totalCount > library.items.length} loadingMore={library.loadingMore} onMore={() => void handleMore("library")}>
              {library.items.map(renderBookItem)}
            </KidShelf>
          )}

          {empty && (
            <div className="kl-panel kid-shelves-empty" role="status">
              <Frog mood="think" size={96} />
              <p className="display">Bố mẹ chưa chọn truyện cho em</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
