"use client";

import "@/app/features/library/library.css";
import "@/app/features/created/created.css";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { fmt } from "./ui";
import { SHELVES, shelfOf } from "./CreatorLibrary";
import type { CreatorPageProps } from "./CreatorStories";

const AGE: Record<string, string> = { "6-8": "6–8 tuổi", "9-10": "9–10 tuổi" };
const MODE: Record<string, string> = { reading: "Đọc", listening: "Nghe", combined: "Đọc và nghe" };
const isAi = (s: CreatorDraft) => s.source?.toLowerCase() === "ai";
/** Thứ tự các kệ: truyện đã xong lên đầu (giống trang của phụ huynh). */
const SHELF_ORDER = ["ready", "review", "draft"];
/** Màu nhãn theo trạng thái Moderator duyệt phiên bản hiện tại. */
const REVIEW_TONE: Record<string, string> = { None: "draft", Pending: "wait", Approved: "ok", ChangesRequested: "wait", Rejected: "flag", Withdrawn: "draft" };
const SOURCES = [{ id: "all", label: "Tất cả" }, { id: "ai", label: "Do AI tạo" }, { id: "manual", label: "Thủ công" }];

/** Trang "Truyện của tôi" của Content Creator: mọi truyện đã tạo (AI và thủ công), lọc theo trạng thái, xem chi tiết rồi mở soạn tiếp. */
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
  const [pub, setPub] = useState<CreatorPublicationStatus | null>(null);
  const [pubTick, setPubTick] = useState(0);
  const [collapsed, setCollapsed] = useState(true);
  const aside = useMemo(() => ({ collapsed, toggle: () => setCollapsed((v) => !v) }), [collapsed]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const all: CreatorDraft[] = [];
    for (let pageIndex = 1; pageIndex <= 50; pageIndex++) {
      const r = await creatorService.list(pageIndex, 100);
      if (!r.ok) { setError(r.message); break; }
      all.push(...(r.data?.items ?? []));
      if (!r.data?.hasNextPage) break;
    }
    setList(all); setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const all = useMemo(() => [...(list ?? [])].sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()), [list]);
  const needle = q.trim().toLowerCase();
  const shown = all.filter((s) => (source === "all" || (source === "ai") === isAi(s)) && (!needle || (s.title || "").toLowerCase().includes(needle)));
  const shelves = SHELF_ORDER.map((id) => SHELVES.find((g) => g.id === id)!).map((g) => ({ ...g, items: shown.filter((s) => shelfOf(s) === g.id) })).filter((g) => g.items.length > 0);
  const openShelf = shelves.find((g) => g.id === expanded) ?? null;
  const sel = all.find((s) => s.storyId === selected) ?? null;
  const pick = (s: CreatorDraft) => { setSelected(s.storyId); if (collapsed) setCollapsed(false); };
  useEffect(() => {
    setPub(null);
    if (selected === null) return;
    const c = new AbortController();
    void creatorPublicationService.status(selected, c.signal).then((r) => { if (!c.signal.aborted && r.success) setPub(r.data ?? null); }).catch(() => undefined);
    return () => c.abort();
  }, [selected, pubTick]);
  const canRemove = !!pub && pub.isPublished && !pub.openItemId;
  const card = (s: CreatorDraft) => {
    const name = s.title || "Truyện chưa đặt tên";
    return (
      <button className={`bk${selected === s.storyId ? " on" : ""}`} key={s.storyId} onClick={() => pick(s)} aria-pressed={selected === s.storyId} aria-label={`Xem chi tiết truyện ${name}`}>
        <span className="bk-cover" style={{ background: coverFor(s.coverImageUrl) }}>
          <span className="pill draft bk-badge">{SHELVES.find((g) => g.id === shelfOf(s))?.title}</span>
          <span className="bk-name display">{name}</span>
        </span>
        <span className="bk-title">{name}</span>
        <span className="bk-meta">{isAi(s) ? "Do AI tạo" : "Thủ công"} · {AGE[s.ageBand] ?? s.ageBand}</span>
      </button>
    );
  };
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
              <div className="meta">
                <span>Cách tạo</span><b>{isAi(sel) ? "Do AI tạo" : "Thủ công"}</b>
                <span>Độ tuổi</span><b>{AGE[sel.ageBand] ?? sel.ageBand}</b>
                <span>Thể loại</span><b>{sel.genre || "Khác"}</b>
                <span>Trải nghiệm</span><b>{MODE[sel.experienceMode] ?? sel.experienceMode}</b>
                <span>Phiên bản</span><b>{sel.lastVersionNo ? `V${sel.lastVersionNo}` : "Chưa lưu"}</b>
                <span>Tạo lúc</span><b>{fmt(sel.createdAt)}</b>
                {sel.updatedAt && <><span>Cập nhật</span><b>{fmt(sel.updatedAt)}</b></>}
                <span>Trạng thái</span><span className="pill draft" style={{ width: "fit-content" }}>{SHELVES.find((g) => g.id === shelfOf(sel))?.title}</span>
                <span>Kiểm duyệt</span>{pub ? <span className={`pill ${REVIEW_TONE[pub.reviewStatus] ?? "draft"}`} style={{ width: "fit-content" }}>{REVIEW[pub.reviewStatus] ?? pub.reviewStatus}</span> : <b>…</b>}
                <span>Công khai</span>{pub ? <span className={`pill ${pub.isPublished ? "ok" : "flag"}`} style={{ width: "fit-content" }}>{pub.isPublished ? "Đã công khai" : "Chưa công khai"}</span> : <b>…</b>}
              </div>
              <button className="btn btn-s btn-c" onClick={() => setReading(true)}><Eye className="ic" />Đọc thử như bé thấy</button>
              {canRemove && <button className="btn btn-no btn-c" onClick={() => setRemoving(true)}><Undo2 className="ic" />Yêu cầu gỡ</button>}
              <button className="btn btn-p btn-c" onClick={() => open(sel)}>{isAi(sel) ? <WandSparkles className="ic" /> : <PencilLine className="ic" />}Mở để soạn tiếp</button>
            </>
          ) : <p className="sub">Chọn một truyện để xem chi tiết.</p>}
        </AsidePane>
        {sel && removing && <RemovalRequestDialog storyId={sel.storyId} title={sel.title} onClose={() => setRemoving(false)} onDone={() => setPubTick((n) => n + 1)} />}
        {sel && reading && <CreatorPreview story={sel} onClose={() => setReading(false)} />}
      </section>
    </AsideContext.Provider>
  );
}
