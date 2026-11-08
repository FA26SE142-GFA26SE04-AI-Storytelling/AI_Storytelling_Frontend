"use client";

import "@/app/features/library/library.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Eye, Info, PencilLine, Search, SlidersHorizontal, WandSparkles, X } from "lucide-react";
import CreatorPreview from "./CreatorPreview";
import AsidePane, { AsideContext } from "@/app/components/shell/AsidePane";
import { Shelf, ShelfRow } from "@/app/features/library/LibraryWorkspace";
import { creatorService } from "@/app/services/creatorService";
import { creatorPublicationService } from "@/app/services/creatorPublicationService";
import type { CreatorDraft } from "@/app/types/creator";
import { coverFor } from "@/app/lib/storyView";
import { Notice, fmt } from "./ui";
import type { CreatorPageProps } from "./CreatorStories";

const AGE: Record<string, string> = { "6-8": "6–8 tuổi", "9-10": "9–10 tuổi" };
const MODE: Record<string, string> = { reading: "Đọc", listening: "Nghe", combined: "Đọc và nghe" };
const SOURCE: Record<string, string> = { ai: "Do AI tạo", manual: "Thủ công" };
const SOURCE_PILLS = [{ id: "all", label: "Tất cả" }, ...Object.entries(SOURCE).map(([id, label]) => ({ id, label }))];

const isAi = (s: CreatorDraft) => s.source?.toLowerCase() === "ai";
const sourceOf = (s: CreatorDraft) => (isAi(s) ? "ai" : "manual");
const statusKey = (s: CreatorDraft) => (s.status ?? "draft").toLowerCase().replace(/[^a-z]/g, "");

/** Kệ theo trạng thái; mỗi truyện chỉ nằm ở đúng một kệ. */
export const SHELVES: { id: string; title: string; sub: string; keys: string[] }[] = [
  { id: "draft", title: "Đang soạn", sub: "Bản nháp chưa gửi duyệt", keys: ["draft"] },
  { id: "review", title: "Đang duyệt & chuẩn bị", sub: "Chờ Moderator duyệt hoặc đang tạo tranh và giọng đọc",
    keys: ["inputaccepted", "generating", "outlinereview", "moderationreview", "contentreview", "approved", "mediaprocessing", "mediareview"] },
  { id: "ready", title: "Sẵn sàng", sub: "Đã duyệt, có thể công khai vào Thư viện chung", keys: ["ready", "published"] },
];
export const shelfOf = (s: CreatorDraft) => SHELVES.find((g) => g.keys.includes(statusKey(s)))?.id ?? "draft";
const NEW_DAYS = 3;
const isNew = (s: CreatorDraft) => Date.now() - new Date(s.createdAt).getTime() < NEW_DAYS * 86_400_000;

/** Thẻ truyện bìa đứng, giống Thư viện của phụ huynh: bấm để xem chi tiết ở khung bên phải. */
function BookCard({ story, rank, on, onPick, published }: { story: CreatorDraft; rank?: number; on: boolean; onPick: () => void; published: boolean }) {
  const name = story.title || "Truyện chưa đặt tên";
  // "Sẵn sàng" chỉ nghĩa là creator đã chốt nội dung và media; chỉ khi Moderator duyệt công khai mới là truyện đã xuất bản.
  const ready = shelfOf(story) === "ready" && published;
  const label = `${SHELVES.find((g) => g.id === shelfOf(story))?.title}${shelfOf(story) === "ready" && !published ? " · chưa công khai" : ""}`;
  return (
    <button className={`bk${on ? " on" : ""}`} onClick={onPick} aria-pressed={on}>
      <span className="bk-cover" style={{ background: coverFor(story.coverImageUrl) }}>
        {!ready ? <span className="pill draft bk-badge">{label}</span> : isNew(story) && <span className="bk-badge bk-new">Mới</span>}
        <span className="bk-name display">{name}</span>
        {rank !== undefined && <span className="bk-rank display" aria-hidden>{rank}</span>}
      </span>
      <span className="bk-title">{name}</span>
      <span className="bk-meta">{story.genre || "Khác"} · {AGE[story.ageBand] ?? story.ageBand}</span>
    </button>
  );
}

/** Trang "Thư viện" của Content Creator: bố cục giống Thư viện của phụ huynh (tìm kiếm, bộ lọc, kệ cuộn ngang, khung Chi tiết). */
export function CreatorLibrary({ go }: CreatorPageProps) {
  const [list, setList] = useState<CreatorDraft[] | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [age, setAge] = useState("all");
  const [src, setSrc] = useState("all");
  const [genre, setGenre] = useState("all");
  const [source, setSource] = useState("all");
  const [topic, setTopic] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{ title: string; items: CreatorDraft[] } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [reading, setReading] = useState(false);
  const [asideCollapsed, setAsideCollapsed] = useState(true);
  const toggleAside = useCallback(() => setAsideCollapsed((v) => !v), []);
  const aside = useMemo(() => ({ collapsed: asideCollapsed, toggle: toggleAside }), [asideCollapsed, toggleAside]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Danh sách truyện của creator không có cờ "đã công khai" (Ready cả khi chưa gửi duyệt), nên hỏi trạng thái phát hành của từng truyện Ready.
  const [published, setPublished] = useState<Record<number, boolean>>({});
  const load = useCallback(async () => {
    const r = await creatorService.list();
    const items = r.ok ? r.data?.items ?? [] : [];
    setList(items);
    setNote(r.ok ? null : { ok: false, text: r.message });
    const ids = items.filter((s) => shelfOf(s) === "ready").map((s) => s.storyId);
    const next: Record<number, boolean> = {};
    for (let i = 0; i < ids.length; i += 6) {
      await Promise.all(ids.slice(i, i + 6).map(async (id) => {
        const p = await creatorPublicationService.status(id).catch(() => null);
        next[id] = !!(p?.success && p.data?.isPublished);
      }));
    }
    setPublished(next);
  }, []);
  // Truyện Ready nhưng chưa được Moderator duyệt công khai (hoặc chưa biết) thì không hiện ở các kệ thư viện, chỉ ở kệ "Chưa công khai".
  const libShelf = useCallback((s: CreatorDraft) => (shelfOf(s) === "ready" && !published[s.storyId] ? "unpublished" : shelfOf(s)), [published]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!filterOpen) return;
    const down = (e: MouseEvent) => { if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setFilterOpen(false); };
    document.addEventListener("mousedown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [filterOpen]);

  // Thư viện chỉ hiện truyện đã được Moderator duyệt công khai.
  const sorted = useMemo(() => (list ?? []).filter((s) => published[s.storyId]).sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()), [list, published]);
  const activeCount = [status, genre, age, src].filter((v) => v !== "all").length;
  const topics = useMemo(() => [...new Set(sorted.filter((s) => !["draft", "review", "unpublished"].includes(libShelf(s))).map((s) => s.genre || "Khác"))], [sorted, libShelf]);
  const activeTopic = topic && topics.includes(topic) ? topic : topics[0] ?? null;
  const released = sorted.filter((s) => libShelf(s) === "ready");
  const latest = released.slice(0, 10);
  // Truyện đang soạn hoặc chưa công khai tách riêng; các kệ còn lại chỉ gồm truyện đã được Moderator duyệt công khai (hoặc đã lưu trữ).
  const rest = sorted;
  const byTopic = rest.filter((s) => (s.genre || "Khác") === activeTopic);
  const bySource = rest.filter((s) => source === "all" || sourceOf(s) === source);
  const searching = q.trim() !== "" || activeCount > 0;
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sorted.filter((s) => (status === "all" || shelfOf(s) === status) && (genre === "all" || (s.genre || "Khác") === genre) && (age === "all" || s.ageBand === age) && (src === "all" || sourceOf(s) === src) && (s.title || "").toLowerCase().includes(needle));
  }, [sorted, q, status, genre, age, src]);

  const sel = sorted.find((s) => s.storyId === selected) ?? null;
  const pick = (id: number) => { setSelected(id); if (asideCollapsed) setAsideCollapsed(false); };
  const card = (s: CreatorDraft, rank?: number) => <BookCard key={s.storyId} story={s} rank={rank} on={sel?.storyId === s.storyId} onPick={() => pick(s.storyId)} published={!!published[s.storyId]} />;
  const open = (s: CreatorDraft) => go(isAi(s) ? "create-ai" : "create-manual", s.storyId);
  const shelfLabel = (s: CreatorDraft) => `${SHELVES.find((g) => g.id === shelfOf(s))?.title ?? ""}${libShelf(s) === "unpublished" ? " · chưa công khai" : ""}`;

  return (
    <AsideContext.Provider value={aside}>
      <section className="ws dock lib" data-aside={asideCollapsed ? "collapsed" : undefined}>
        <div className="pane">
          <div className="lib-scroll">
            <Notice note={note} />
            <div className="lbar">
              <div className="lsearch">
                <label className="row grow" style={{ gap: 6, color: "var(--muted)" }}>
                  <Search className="ic" />
                  <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên truyện" style={{ border: 0, background: "none" }} aria-label="Tìm theo tên truyện" />
                </label>
                <div className="lfilter" ref={filterRef}>
                  <button className={`btn btn-s lfilter-btn${activeCount > 0 ? " on" : ""}`} aria-haspopup="dialog" aria-expanded={filterOpen} onClick={() => setFilterOpen((v) => !v)}>
                    <SlidersHorizontal className="ic" />Bộ lọc{activeCount > 0 && <span className="lfilter-n">{activeCount}</span>}
                  </button>
                  {filterOpen && (
                    <div className="lfilter-pop" role="dialog" aria-label="Lọc truyện mẫu">
                      <label>Trạng thái
                        <select className={`inp${status !== "all" ? " on" : ""}`} aria-label="Lọc theo trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}>
                          <option value="all">Mọi trạng thái</option>
                          {SHELVES.map((g) => <option key={g.id} value={g.id}>{g.title} ({sorted.filter((s) => shelfOf(s) === g.id).length})</option>)}
                        </select>
                      </label>
                      <label>Thể loại
                        <select className={`inp${genre !== "all" ? " on" : ""}`} aria-label="Lọc theo thể loại" value={genre} onChange={(e) => setGenre(e.target.value)}>
                          <option value="all">Mọi thể loại</option>
                          {topics.map((t) => <option key={t} value={t}>{t} ({sorted.filter((s) => (s.genre || "Khác") === t).length})</option>)}
                        </select>
                      </label>
                      <label>Độ tuổi
                        <select className={`inp${age !== "all" ? " on" : ""}`} aria-label="Lọc theo nhóm tuổi" value={age} onChange={(e) => setAge(e.target.value)}>
                          <option value="all">Mọi độ tuổi</option>
                          {Object.entries(AGE).map(([k, v]) => <option key={k} value={k}>{v} ({sorted.filter((s) => s.ageBand === k).length})</option>)}
                        </select>
                      </label>
                      <label>Nguồn
                        <select className={`inp${src !== "all" ? " on" : ""}`} aria-label="Lọc theo cách tạo" value={src} onChange={(e) => setSrc(e.target.value)}>
                          <option value="all">Mọi cách tạo</option>
                          {Object.entries(SOURCE).map(([k, v]) => <option key={k} value={k}>{v} ({sorted.filter((s) => sourceOf(s) === k).length})</option>)}
                        </select>
                      </label>
                      {activeCount > 0 && <button className="btn btn-g" onClick={() => { setStatus("all"); setGenre("all"); setAge("all"); setSrc("all"); }}><X className="ic" />Xoá lọc</button>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {list === null ? <p className="sub lib-empty">Đang tải truyện…</p>
              : list.length === 0 ? (
                <div className="lib-empty">
                  <b className="display">Chưa có truyện mẫu nào</b>
                  <span className="sub">Bắt đầu bằng AI từ một ý tưởng, hoặc tự viết theo cách thủ công.</span>
                  <div className="row"><button className="btn btn-p" onClick={() => go("create-ai")}><WandSparkles className="ic" />Dùng AI tạo truyện</button><button className="btn btn-s" onClick={() => go("create-manual")}>Viết thủ công</button></div>
                </div>
              ) : searching ? (
                <Shelf title="Kết quả" sub={`${results.length} truyện`} items={results.map((s) => ({ id: s.storyId }))}>
                  {results.length > 0 ? <div className="shelf-grid">{results.map((s) => card(s))}</div> : <p className="sub">Không tìm thấy truyện phù hợp.</p>}
                </Shelf>
              ) : expanded ? (
                <Shelf title={expanded.title} sub={`${expanded.items.length} truyện`} items={expanded.items.map((s) => ({ id: s.storyId }))}>
                  <button className="shelf-back" onClick={() => setExpanded(null)}><ChevronLeft className="ic" />Quay lại thư viện</button>
                  <div className="shelf-grid">{expanded.items.map((s) => card(s))}</div>
                </Shelf>
              ) : (
                <>
                  {latest.length > 0 && (
                    <Shelf title="Mới nhất" items={latest.map((s) => ({ id: s.storyId }))} onAll={released.length > latest.length ? () => setExpanded({ title: "Mới nhất", items: released }) : undefined}>
                      <ShelfRow>{latest.map((s, i) => card(s, i + 1))}</ShelfRow>
                    </Shelf>
                  )}
                  {topics.length > 0 && (
                    <Shelf title="Theo chủ đề" items={byTopic.map((s) => ({ id: s.storyId }))} pills={topics.map((t) => ({ id: t, label: t }))} pill={activeTopic ?? undefined} onPill={setTopic} onAll={() => setExpanded({ title: `Chủ đề: ${activeTopic}`, items: byTopic })}>
                      <ShelfRow>{byTopic.map((s) => card(s))}</ShelfRow>
                    </Shelf>
                  )}
                  <Shelf title="Tất cả truyện" items={bySource.map((s) => ({ id: s.storyId }))} pills={SOURCE_PILLS} pill={source} onPill={setSource}>
                    {bySource.length > 0 ? <div className="shelf-grid">{bySource.map((s) => card(s))}</div> : <p className="sub">Chưa có truyện nào trong nhóm này.</p>}
                  </Shelf>
                </>
              )}
          </div>
        </div>

        <AsidePane title="Chi tiết" icon={Info}>
          {sel ? (
            <>
              <div className="cover cover-portrait" style={{ background: coverFor(sel.coverImageUrl) }} />
              <h3 className="display" style={{ fontSize: "var(--fs-xl)", margin: 0, lineHeight: 1.2 }}>{sel.title || "Truyện chưa đặt tên"}</h3>
              {sel.description && <p className="sub">{sel.description}</p>}
              <div className="meta">
                <span>Cách tạo</span><b>{SOURCE[sourceOf(sel)]}</b>
                <span>Độ tuổi</span><b>{AGE[sel.ageBand] ?? sel.ageBand}</b>
                <span>Thể loại</span><b>{sel.genre || "Khác"}</b>
                <span>Chế độ</span><b>{MODE[sel.experienceMode] ?? sel.experienceMode}</b>
                <span>Phiên bản</span><b>{sel.lastVersionNo ? `V${sel.lastVersionNo}` : "Chưa lưu"}</b>
                <span>Cập nhật</span><b>{fmt(sel.updatedAt ?? sel.createdAt)}</b>
                <span>Trạng thái</span><span className="pill draft" style={{ width: "fit-content" }}>{shelfLabel(sel)}</span>
              </div>
              <button className="btn btn-s btn-c" onClick={() => setReading(true)}><Eye className="ic" />Đọc thử như bé thấy</button>
              <button className="btn btn-p btn-c" onClick={() => open(sel)}>{isAi(sel) ? <WandSparkles className="ic" /> : <PencilLine className="ic" />}Mở để soạn tiếp</button>
            </>
          ) : <p className="sub">Chọn một truyện để xem chi tiết.</p>}
        </AsidePane>
        {sel && reading && <CreatorPreview story={sel} onClose={() => setReading(false)} />}
      </section>
    </AsideContext.Provider>
  );
}
