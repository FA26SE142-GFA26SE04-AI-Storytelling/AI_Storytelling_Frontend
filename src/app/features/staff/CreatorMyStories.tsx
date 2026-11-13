"use client";

import "@/app/features/library/library.css";
import "@/app/features/created/created.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Eye, Info, PencilLine, RefreshCw, Search, Undo2, WandSparkles, X } from "lucide-react";
import { Shelf, ShelfRow } from "@/app/features/library/LibraryWorkspace";
import CreatorPreview from "./CreatorPreview";
import RemovalRequestDialog from "./RemovalRequestDialog";
import { REVIEW } from "./CreatorPublication";
import { creatorPublicationService } from "@/app/services/creatorPublicationService";
import type { CreatorPublicationStatus } from "@/app/types/backendContracts";
import Select from "@/app/components/Select";
import AsidePane, { AsideContext } from "@/app/components/shell/AsidePane";
import Frog from "@/app/components/brand/Frog";
import { creatorService } from "@/app/services/creatorService";
import type { CreatorDraft } from "@/app/types/creator";
import { coverFor } from "@/app/lib/storyView";
import { StoryStatsBadge } from "@/app/components/StoryStatsBadge";
import { fmt } from "./ui";
import { creatorShelfOf, currentCreatorPublication, groupCreatorStories, resolveStoryDisplayState, type CreatorPublicationSnapshot } from "./creatorStoryShelves";
import type { CreatorPageProps } from "./CreatorStories";

const AGE: Record<string, string> = { "6-8": "6–8 tuổi", "9-10": "9–10 tuổi" };
const MODE: Record<string, string> = { reading: "Đọc", listening: "Nghe", combined: "Đọc và nghe" };
const isAi = (s: CreatorDraft) => s.source?.toLowerCase() === "ai";
/** Màu nhãn theo trạng thái Moderator duyệt phiên bản hiện tại. */
const REVIEW_TONE: Record<string, string> = { None: "draft", Pending: "wait", Approved: "ok", ChangesRequested: "wait", Rejected: "flag", Withdrawn: "draft" };
const SOURCES = [{ id: "all", label: "Tất cả" }, { id: "ai", label: "Do AI tạo" }, { id: "manual", label: "Thủ công" }];

/** Thẻ truyện trên trang "Truyện của tôi", kèm huy hiệu theo trạng thái biên soạn hoặc kiểm duyệt công khai. */
export function CreatorStoryCard({
  story,
  selected,
  onPick,
  stats,
}: {
  story: CreatorDraft;
  selected: boolean;
  onPick: () => void;
  stats?: { viewCount: number; favoriteCount: number } | null;
}) {
  const name = story.title || "Truyện chưa đặt tên";
  const shelf = creatorShelfOf(story);
  return (
    <button
      className={`bk${selected ? " on" : ""}`}
      onClick={onPick}
      aria-pressed={selected}
      aria-label={`Xem chi tiết truyện ${name}`}
    >
      <span className="bk-cover" style={{ background: coverFor(story.coverImageUrl) }}>
        <span className={`pill ${shelf.tone} bk-badge`}>{shelf.badge}</span>
        <span className="bk-name display">{name}</span>
        {stats && <StoryStatsBadge viewCount={stats.viewCount} favoriteCount={stats.favoriteCount} belowPill />}
      </span>
      <span className="bk-title">{name}</span>
      <span className="bk-meta">{isAi(story) ? "Do AI tạo" : "Thủ công"} · {AGE[story.ageBand] ?? story.ageBand}</span>
    </button>
  );
}

/** Bảng thuộc tính trong cột Chi tiết của một truyện Creator, đồng bộ nhãn trạng thái với section. */
export function CreatorStoryDetailMeta({
  story,
  pub,
}: {
  story: CreatorDraft;
  pub: CreatorPublicationStatus | null;
}) {
  const merged = resolveStoryDisplayState(story, pub);
  const shelf = creatorShelfOf(merged);
  const reviewKey = pub?.reviewStatus ?? merged.reviewStatus ?? (shelf.id === "rejected" ? "Rejected" : null);
  const published = pub ? pub.isPublished : merged.isPublished;
  return (
    <div className="meta">
      <span>Cách tạo</span><b>{isAi(merged) ? "Do AI tạo" : "Thủ công"}</b>
      <span>Độ tuổi</span><b>{AGE[merged.ageBand] ?? merged.ageBand}</b>
      <span>Thể loại</span><b>{merged.genre || "Khác"}</b>
      <span>Trải nghiệm</span><b>{MODE[merged.experienceMode] ?? merged.experienceMode}</b>
      <span>Phiên bản</span><b>{merged.lastVersionNo ? `V${merged.lastVersionNo}` : "Chưa lưu"}</b>
      <span>Tạo lúc</span><b>{fmt(merged.createdAt)}</b>
      {merged.updatedAt && <><span>Cập nhật</span><b>{fmt(merged.updatedAt)}</b></>}
      <span>Trạng thái</span><span className={`pill ${shelf.tone}`} style={{ width: "fit-content" }}>{shelf.title}</span>
      <span>Kiểm duyệt</span>{reviewKey ? <span className={`pill ${REVIEW_TONE[reviewKey] ?? "draft"}`} style={{ width: "fit-content" }}>{REVIEW[reviewKey] ?? reviewKey}</span> : <b>…</b>}
      <span>Công khai</span>{published !== undefined ? <span className={`pill ${published ? "ok" : "flag"}`} style={{ width: "fit-content" }}>{published ? "Đã công khai" : "Chưa công khai"}</span> : <b>…</b>}
    </div>
  );
}

/** Trang "Truyện của tôi" của Content Creator: mọi truyện đã tạo (AI và thủ công), tách section kiểm duyệt và Bị từ chối, xem chi tiết rồi mở soạn tiếp. */
export function CreatorMyStories({ go }: Pick<CreatorPageProps, "go">) {
  const [list, setList] = useState<CreatorDraft[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  // Kệ đang mở "Xem tất cả" (lưới đầy đủ); null là xem các kệ.
  const [expanded, setExpanded] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [reading, setReading] = useState(false);
  const [removing, setRemoving] = useState(false);
  /** Trạng thái phát hành của truyện đang chọn (đã công khai / đang chờ duyệt) để biết có khóa đổi ảnh bìa không. */
  const [publicationSnapshot, setPublicationSnapshot] = useState<CreatorPublicationSnapshot | null>(null);
  const [pubTick, setPubTick] = useState(0);
  const pub = currentCreatorPublication(publicationSnapshot, list, selected, pubTick);
  const [collapsed, setCollapsed] = useState(true);
  const aside = useMemo(() => ({ collapsed, toggle: () => setCollapsed((v) => !v) }), [collapsed]);
  const [statsMap, setStatsMap] = useState<Map<number, { viewCount: number; favoriteCount: number }>>(new Map());
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError("");

    const loadDrafts = async () => {
      const all: CreatorDraft[] = [];
      for (let pageIndex = 1; pageIndex <= 50; pageIndex++) {
        if (signal?.aborted || !aliveRef.current) return null;
        const r = await creatorService.list(pageIndex, 100);
        if (signal?.aborted || !aliveRef.current) return null;
        if (!r.ok) { setError(r.message); break; }
        all.push(...(r.data?.items ?? []));
        if (!r.data?.hasNextPage) break;
      }
      return all;
    };

    const loadStats = async () => {
      const map = new Map<number, { viewCount: number; favoriteCount: number }>();
      try {
        for (let pageIndex = 1; pageIndex <= 50; pageIndex++) {
          if (signal?.aborted || !aliveRef.current) return null;
          const res = await creatorService.creatorPublishedStories({ pageIndex, pageSize: 100, isDescending: true });
          if (signal?.aborted || !aliveRef.current) return null;
          if (!res.success || !res.data) break;
          const items = res.data.items ?? [];
          for (const item of items) {
            const sid = item.id;
            if (sid) {
              map.set(sid, { viewCount: item.viewCount, favoriteCount: item.favoriteCount });
            }
          }
          if (items.length === 0 || res.data.hasNextPage === false || (res.data.totalPages && pageIndex >= res.data.totalPages)) break;
        }
      } catch {
        // Lỗi tải số liệu thì im lặng: không hiện toast, không hiện thông báo lỗi, không làm hỏng danh sách chính
      }
      return map;
    };

    const [all, stats] = await Promise.all([loadDrafts(), loadStats()]);
    if (signal?.aborted || !aliveRef.current) return;
    if (all !== null) setList(all);
    if (stats !== null) setStatsMap(stats);
    setLoading(false);
  }, []);
  useEffect(() => {
    const c = new AbortController();
    void load(c.signal);
    return () => c.abort();
  }, [load]);

  const all = useMemo(() => [...(list ?? [])].sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()), [list]);
  const needle = q.trim().toLowerCase();
  const shown = all
    .filter((s) => (source === "all" || (source === "ai") === isAi(s)) && (!needle || (s.title || "").toLowerCase().includes(needle)))
    .map((s) => resolveStoryDisplayState(s, pub));
  const shelves = groupCreatorStories(shown);
  const openShelf = shelves.find((g) => g.id === expanded) ?? null;
  const rawSel = all.find((s) => s.storyId === selected) ?? null;
  const sel = rawSel ? resolveStoryDisplayState(rawSel, pub) : null;
  const pick = (s: CreatorDraft) => { setSelected(s.storyId); if (collapsed) setCollapsed(false); };
  useEffect(() => {
    setPublicationSnapshot(null);
    if (selected === null) return;
    const c = new AbortController();
    void creatorPublicationService.status(selected, c.signal).then((r) => {
      if (!c.signal.aborted && r.success && r.data) setPublicationSnapshot({ list, revision: pubTick, data: r.data });
    }).catch(() => undefined);
    return () => c.abort();
  }, [selected, pubTick, list]);
  const canRemove = !!pub && pub.isPublished && !pub.openItemId;
  const card = (s: CreatorDraft) => (
    <CreatorStoryCard
      key={s.storyId}
      story={s}
      selected={selected === s.storyId}
      onPick={() => pick(s)}
      stats={statsMap.get(s.storyId)}
    />
  );
  const open = (s: CreatorDraft) => go(isAi(s) ? "create-ai" : "create-manual", s.storyId);

  return (
    <AsideContext.Provider value={aside}>
      <section className="ws dock lib" data-aside={collapsed ? "collapsed" : undefined}>
        <div className="pane"><div className="lib-scroll created">
          <div className="created-bar">
            <label className="lsearch created-search">
              <Search className="ic" aria-hidden />
              <input className="inp grow" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên truyện" aria-label="Tìm theo tên truyện" style={{ border: 0, background: "none" }} />
              {q && <button className="btn btn-g icon-only" aria-label="Xoá tìm kiếm" onClick={() => setQ("")}><X className="ic" /></button>}
            </label>
            <div className="created-actions">
              <Select<string> className="created-select" ariaLabel="Lọc theo nguồn" value={source} options={SOURCES.map((s) => ({ value: s.id, label: s.label }))} onChange={setSource} />
              <button className="btn btn-g" onClick={() => void load()} disabled={loading} aria-label="Tải lại" title="Tải lại"><RefreshCw className="ic" /></button>
              <button className="btn btn-s" onClick={() => go("create-manual")}><PencilLine className="ic" />Tự viết</button>
              <button className="btn btn-p" onClick={() => go("create-ai")}><WandSparkles className="ic" />Viết bằng AI</button>
            </div>
          </div>

          {error && <p className="notice err" role="alert">{error}</p>}
          {loading && !all.length && <p className="sub" role="status">Đang tải truyện…</p>}

          {openShelf ? (
            <Shelf title={openShelf.title} sub={`${openShelf.items.length} truyện`} items={openShelf.items.map((x) => ({ id: x.storyId }))}>
              <button className="shelf-back" onClick={() => setExpanded(null)}><ChevronLeft className="ic" />Quay lại</button>
              <div className="created-grid">{openShelf.items.map(card)}</div>
            </Shelf>
          ) : shelves.length > 0 ? (
            shelves.map((g) => (
              <Shelf key={g.id} title={g.title} sub={`${g.items.length} truyện`} items={g.items.map((x) => ({ id: x.storyId }))} onAll={g.items.length > 5 ? () => setExpanded(g.id) : undefined}>
                <ShelfRow>{g.items.map(card)}</ShelfRow>
              </Shelf>
            ))
          ) : !loading && (
            <div className="empty">
              <Frog size={110} mood="think" />
              <b className="display">{all.length ? "Không có truyện phù hợp" : "Bạn chưa tạo truyện nào"}</b>
              <span>{all.length ? "Thử đổi từ khoá hoặc nguồn truyện." : "Tạo truyện bằng AI hoặc tự viết, truyện sẽ nằm ở đây."}</span>
            </div>
          )}
        </div></div>

        <AsidePane title="Chi tiết" icon={Info}>
          {sel ? (
            <>
              <div className="cover cover-portrait" style={{ background: coverFor(sel.coverImageUrl) }} />
              <h3 className="display" style={{ fontSize: "var(--fs-xl)", margin: 0, lineHeight: 1.2 }}>{sel.title || "Truyện chưa đặt tên"}</h3>
              {sel.description && <p className="sub">{sel.description}</p>}
              <CreatorStoryDetailMeta story={sel} pub={pub} />
              <button className="btn btn-s btn-c" onClick={() => setReading(true)}><Eye className="ic" />Đọc thử như bé thấy</button>
              {canRemove && <button className="btn btn-no btn-c" onClick={() => setRemoving(true)}><Undo2 className="ic" />Yêu cầu gỡ</button>}
              <button className="btn btn-p btn-c" onClick={() => open(sel)}>{isAi(sel) ? <WandSparkles className="ic" /> : <PencilLine className="ic" />}Mở để soạn tiếp</button>
            </>
          ) : <p className="sub">Chọn một truyện để xem chi tiết.</p>}
        </AsidePane>
        {sel && removing && <RemovalRequestDialog storyId={sel.storyId} title={sel.title} onClose={() => setRemoving(false)} onDone={() => { setPubTick((n) => n + 1); void load(); }} />}
        {sel && reading && <CreatorPreview story={sel} onClose={() => setReading(false)} />}
      </section>
    </AsideContext.Provider>
  );
}
