"use client";

import "./library.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, ChevronLeft, ChevronRight, Eye, Flag, Info, SlidersHorizontal, PencilLine, Route, Search, Send, WandSparkles, X } from "lucide-react";
import AsidePane, { AsideContext } from "@/app/components/shell/AsidePane";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { useAuth } from "@/app/context/AuthContext";
import type { StoryDto } from "@/app/types/story";
import { storyService } from "@/app/services/storyService";
import { ageLabel, familyToCard, splitScenes, statusKey, toCard, type StoryCard } from "@/app/lib/storyView";
import { parentAuthoringService } from "@/app/services/parentAuthoringService";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import { useRiseIn } from "@/app/lib/motion";
import { ArchiveDialog } from "@/app/features/review/ReviewTools";
import AddToRoadmapDialog from "@/app/features/roadmap/AddToRoadmapDialog";
import { guardianService } from "@/app/services/guardianService";
import type { CommunitySubmission, ContentReport } from "@/app/types/progress";
import { useMyRole } from "@/app/features/children/useMyRole";
import { CommunityDialog, ReportDialog } from "./ModerationDialogs";

const SUB_STATUS: Record<string, string> = { pending: "Đang chờ duyệt", approved: "Đã có trong thư viện cộng đồng", rejected: "Bị từ chối — có thể nộp lại", withdrawn: "Đã rút", removed: "Đã gỡ" };

/** Luồng 2 mục 6.9 — nhóm trạng thái hiển thị cho phụ huynh. */
const STATUS_GROUPS: { id: string; label: string; keys: string[] }[] = [
  { id: "draft", label: "Nháp", keys: ["draft"] },
  { id: "generating", label: "Đang sinh", keys: ["input_accepted", "generating"] },
  { id: "outline", label: "Chờ duyệt dàn ý", keys: ["outline_review"] },
  { id: "moderation", label: "Đang kiểm duyệt an toàn", keys: ["moderation_review"] },
  { id: "review", label: "Chờ duyệt", keys: ["content_review"] },
  { id: "media", label: "Đang chuẩn bị media", keys: ["approved", "media_processing", "media_review"] },
  { id: "ready", label: "Sẵn sàng", keys: ["ready", "published"] },
  { id: "blocked", label: "Bị chặn", keys: ["blocked"] },
  { id: "rejected", label: "Bị từ chối", keys: ["rejected"] },
  { id: "archived", label: "Đã lưu trữ", keys: ["archived"] },
];

const statusOf = (s: StoryCard) => STATUS_GROUPS.find((g) => g.keys.includes(statusKey(s.raw)))?.id ?? "draft";

/** Xem trước truyện như bé thấy — không ghi nhận lượt đọc, không cộng điểm. */
function Preview({ story, onClose }: { story: StoryCard; onClose: () => void }) {
  const [pages, setPages] = useState<string[] | null>(null);
  const [page, setPage] = useState(0);
  useEffect(() => {
    void storyService.getStoryById(story.id).then((r) => {
      setPages(splitScenes(r.data?.content ?? story.raw.content ?? ""));
    });
  }, [story]);
  return (
    <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label={`Xem trước ${story.title}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dlg wide preview">
        <div className="row"><b className="display grow" style={{ fontSize: 18 }}>{story.title}</b><span className="pill draft">Xem trước — không tính lượt đọc</span><button className="btn btn-g" aria-label="Đóng" onClick={onClose}><X className="ic" /></button></div>
        <div className="cover" style={{ aspectRatio: "16/7", borderRadius: 16, background: story.gradient }} />
        <p className="display preview-text">{pages === null ? "Đang mở truyện…" : pages[page] ?? "Truyện chưa có nội dung."}</p>
        <div className="row">
          <button className="btn btn-s" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Trang trước"><ChevronLeft className="ic" /></button>
          <span className="grow sub" style={{ textAlign: "center" }}>{pages ? `Trang ${page + 1} / ${pages.length}` : ""}</span>
          <button className="btn btn-s" disabled={!pages || page >= pages.length - 1} onClick={() => setPage(page + 1)} aria-label="Trang sau"><ChevronRight className="ic" /></button>
        </div>
      </div>
    </div>
  );
}

const NEW_DAYS = 3;
const isNew = (s: StoryCard) => Date.now() - new Date(s.createdAt).getTime() < NEW_DAYS * 86_400_000;
/** Thư viện chỉ hiện truyện đã được duyệt: các nhóm trạng thái còn lại (nháp, đang sinh, chờ duyệt, bị chặn, bị từ chối, lưu trữ) bị ẩn. */
const SHOWN_GROUPS = ["media", "ready"];
const IN_PROGRESS = ["media"];

/** Thẻ truyện bìa đứng: tên truyện in trên bìa, nhãn trạng thái ở góc, số thứ tự lớn khi xếp hạng. */
function BookCard({ story, rank, on, onPick }: { story: StoryCard; rank?: number; on: boolean; onPick: () => void }) {
  const ready = statusOf(story) === "ready";
  return (
    <button className={`bk${on ? " on" : ""}`} onClick={onPick} aria-pressed={on}>
      <span className="bk-cover" style={{ background: story.gradient }}>
        {!ready ? <span className={`pill ${story.tone} bk-badge`}>{story.statusLabel}</span> : isNew(story) && <span className="bk-badge bk-new">Mới</span>}
        <span className="bk-name display">{story.title}</span>
        {rank !== undefined && <span className="bk-rank display" aria-hidden>{rank}</span>}
      </span>
      <span className="bk-title">{story.title}</span>
      <span className="bk-meta">{story.topic} · {ageLabel(story.ageBand)}</span>
    </button>
  );
}

type ShelfProps = { title: string; sub?: string; items: StoryCard[]; pills?: { id: string; label: string }[]; pill?: string; onPill?: (id: string) => void; onAll?: () => void; children: React.ReactNode };

/** Một kệ truyện: tiêu đề, nút lọc dạng viên thuốc và "Xem tất cả". */
function Shelf({ title, sub, items, pills, pill, onPill, onAll, children }: ShelfProps) {
  // Mỗi kệ tự chạy hiệu ứng hiện dần, chỉ khi danh sách truyện của chính kệ đó đổi (đổi chủ đề không làm kệ khác nháy lại).
  const animKey = items.map((s) => s.id).join(",");
  const ref = useRiseIn<HTMLElement>(".bk", [animKey], { delay: 22, distance: 12 });
  return (
    <section ref={ref} className="shelf" aria-label={title}>
      <div className="shelf-h">
        <h3 className="display">{title}</h3>
        {sub && <span className="sub">{sub}</span>}
        {onAll && <button className="shelf-all" onClick={onAll}>Xem tất cả<ChevronRight className="ic" /></button>}
      </div>
      {pills && pills.length > 0 && (
        <div className="shelf-pills" role="tablist">
          {pills.map((p) => <button key={p.id} role="tab" aria-selected={pill === p.id} className={pill === p.id ? "on" : ""} onClick={() => onPill?.(p.id)}>{p.label}</button>)}
        </div>
      )}
      {children}
    </section>
  );
}

/** Hàng ngang cuộn được, có nút mũi tên hai bên. */
function ShelfRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const measure = useCallback(() => {
    const el = ref.current; if (!el) return;
    const start = el.scrollLeft < 4, end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdge((v) => (v.start === start && v.end === end ? v : { start, end }));
  }, []);
  useEffect(() => {
    measure();
    const el = ref.current;
    const ro = el ? new ResizeObserver(measure) : null;
    if (el && ro) { ro.observe(el); Array.from(el.children).forEach((c) => ro.observe(c)); }
    return () => ro?.disconnect();
  }, [measure, children]);
  const move = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="shelf-row-wrap">
      {!edge.start && <button className="shelf-arrow left" aria-label="Xem truyện trước" onClick={() => move(-1)}><ChevronLeft className="ic" /></button>}
      <div className="shelf-row" ref={ref} onScroll={measure}>{children}</div>
      {!edge.end && <button className="shelf-arrow right" aria-label="Xem thêm truyện" onClick={() => move(1)}><ChevronRight className="ic" /></button>}
    </div>
  );
}

const SOURCE_PILLS = [{ id: "all", label: "Tất cả" }, { id: "ai", label: "Do AI tạo" }, { id: "manual", label: "Nhập sẵn" }, { id: "family", label: "Tự soạn" }];
const sourceOf = (s: StoryCard) => (s.family ? "family" : s.fromAi ? "ai" : "manual");
const SOURCE_LABEL: Record<string, string> = { ai: "Do AI tạo", manual: "Nhập sẵn", family: "Tự soạn gia đình" };

export default function LibraryWorkspace({ go }: Pick<WorkspaceProps,'go'>) {
  const { child } = useWorkspaceData();
  const { user } = useAuth();
  // Thư viện lấy truyện của mọi người dùng qua GET /Story (không lọc theo tác giả), rồi chỉ giữ truyện đã được duyệt.
  const [pub, setPub] = useState<StoryCard[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadPublic = useCallback(async () => {
    setStoriesLoading(true);
    const all: StoryDto[] = [];
    let message: string | null = null;
    // Mỗi trang tối đa 100 truyện (giới hạn của backend) nên tải lần lượt tới hết.
    for (let pageIndex = 1; pageIndex <= 50; pageIndex++) {
      const res = await storyService.getStories({ pageIndex, pageSize: 100, isDescending: true });
      if (!res.success) { message = res.message; break; }
      const items = res.data?.items ?? [];
      all.push(...items);
      if (items.length === 0 || all.length >= (res.data?.totalCount ?? 0)) break;
    }
    setPub(all.map(toCard));
    setError(message);
    setStoriesLoading(false);
  }, []);
  // Truyện tự soạn không có trong GET /Story (backend ẩn), nên tải riêng từ GET /parent/stories rồi gộp vào.
  const [family, setFamily] = useState<StoryCard[]>([]);
  const [familyError, setFamilyError] = useState<string | null>(null);
  const loadFamily = useCallback(async () => {
    const all: StoryCard[] = [];
    for (let page = 1; page <= 50; page++) {
      const r = await parentAuthoringService.mine(page, 100);
      if (!r.success) { setFamilyError(r.message); break; }
      all.push(...(r.data?.items ?? []).map(familyToCard));
      if (!r.data?.hasNextPage) { setFamilyError(null); break; }
    }
    setFamily(all);
  }, []);
  useEffect(() => { void loadPublic(); void loadFamily(); }, [loadPublic, loadFamily, child?.id]);
  const reload = useCallback(async () => { await Promise.all([loadPublic(), loadFamily()]); }, [loadPublic, loadFamily]);
  const stories = useMemo(() => {
    const seen = new Set(pub.map((s) => s.id));
    return [...pub, ...family.filter((s) => !seen.has(s.id))].filter((s) => SHOWN_GROUPS.includes(statusOf(s)));
  }, [pub, family]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!filterOpen) return;
    const down = (e: MouseEvent) => { if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setFilterOpen(false); };
    document.addEventListener("mousedown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [filterOpen]);
  const [source, setSource] = useState("all");
  const [topic, setTopic] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{ title: string; items: StoryCard[] } | null>(null);
  const [status, setStatus] = useState("all");
  // Bộ lọc theo thể loại (genre), nhóm tuổi (ageBand) và nguồn (source). "all" là không lọc.
  const [genreF, setGenreF] = useState("all");
  const [ageF, setAgeF] = useState("all");
  const [srcF, setSrcF] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [dialog, setDialog] = useState<"preview" | "archive" | "roadmap" | "report" | "community" | null>(null);
  const [mod, setMod] = useState<{ reports: ContentReport[]; submission: CommunitySubmission | null } | null>(null);
  const role = useMyRole(child);
  const [toast, setToast] = useState("");
  // Khung "Chi tiết" bên phải thu gọn được; cột lưới co theo bằng CSS (library.css).
  // Mới vào thì thu gọn; bấm vào một truyện sẽ tự mở khung chi tiết.
  const [asideCollapsed, setAsideCollapsed] = useState(true);
  const toggleAside = useCallback(() => setAsideCollapsed((v) => !v), []);
  const aside = useMemo(() => ({ collapsed: asideCollapsed, toggle: toggleAside }), [asideCollapsed, toggleAside]);

  const counts = useMemo(() => Object.fromEntries(STATUS_GROUPS.map((g) => [g.id, stories.filter((s) => statusOf(s) === g.id).length])), [stories]);

  // Mới tạo xếp trước; mọi kệ dùng chung thứ tự này.
  const sorted = useMemo(() => [...stories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [stories]);
  const topics = useMemo(() => [...new Set(sorted.map((s) => s.topic).filter(Boolean))], [sorted]);
  const activeTopic = topic && topics.includes(topic) ? topic : topics[0] ?? null;
  const latest = sorted.slice(0, 10);
  const inProgress = sorted.filter((s) => IN_PROGRESS.includes(statusOf(s)));
  const byTopic = sorted.filter((s) => s.topic === activeTopic);
  const bySource = sorted.filter((s) => source === "all" || sourceOf(s) === source);

  // Đang tìm hoặc lọc trạng thái thì bỏ các kệ, chỉ hiện một lưới kết quả.
  const filtering = genreF !== "all" || ageF !== "all" || srcF !== "all";
  const searching = q.trim() !== "" || status !== "all" || filtering;
  const ageBands = useMemo(() => [...new Set(sorted.map((s) => s.ageBand).filter(Boolean))], [sorted]);
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sorted.filter((s) =>
      (status === "all" || statusOf(s) === status) &&
      (genreF === "all" || s.topic === genreF) &&
      (ageF === "all" || s.ageBand === ageF) &&
      (srcF === "all" || sourceOf(s) === srcF) &&
      s.title.toLowerCase().includes(needle));
  }, [sorted, q, status, genreF, ageF, srcF]);
  const activeCount = [status, genreF, ageF, srcF].filter((v) => v !== "all").length;
  const clearFilters = () => { setQ(""); setStatus("all"); setGenreF("all"); setAgeF("all"); setSrcF("all"); };

  // Chưa bấm vào truyện nào thì không chọn sẵn truyện đầu tiên.
  const sel = stories.find((s) => s.id === selected) ?? null;
  const pick = (id: number) => { setSelected(id); if (asideCollapsed) setAsideCollapsed(false); };
  const card = (s: StoryCard, rank?: number) => <BookCard key={s.id} story={s} rank={rank} on={sel?.id === s.id} onPick={() => pick(s.id)} />;
  const selStatus = sel ? statusOf(sel) : null;
  // Quản lý (nộp thư viện cộng đồng, rút, lưu trữ) chỉ dành cho truyện của chính bạn; truyện của người khác chỉ xem, xem trước, báo cáo hoặc thêm vào lộ trình.
  const mine = !!sel && sel.raw.authorUserId === user?.id;
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3200); };
  const loadMod = async () => { if (sel) setMod((await guardianService.storyModeration(sel.id)).data); };
  useEffect(() => {
    setMod(null);
    if (sel && !sel.family && sel.raw.authorUserId === user?.id && statusOf(sel) === "ready") void guardianService.storyModeration(sel.id).then((r) => setMod(r.data));
  }, [sel, user?.id]);

  return (
    <AsideContext.Provider value={aside}>
    <section className="ws dock lib" data-aside={asideCollapsed ? "collapsed" : undefined}>
      <div className="pane">
        {(error || familyError) && <div className="err-banner" role="alert">{error ?? `Chưa tải được truyện tự soạn: ${familyError}`}</div>}
        <div className="lib-scroll">
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
                <div className="lfilter-pop" role="dialog" aria-label="Lọc truyện">
                  <label>Trạng thái
                    <select className={`inp${status !== "all" ? " on" : ""}`} aria-label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="all">Mọi trạng thái</option>
                      {STATUS_GROUPS.filter((g) => counts[g.id] > 0 || g.id === status).map((g) => <option key={g.id} value={g.id}>{g.label} ({counts[g.id]})</option>)}
                    </select>
                  </label>
                  <label>Thể loại
                    <select className={`inp${genreF !== "all" ? " on" : ""}`} aria-label="Lọc theo thể loại" value={genreF} onChange={(e) => setGenreF(e.target.value)}>
                      <option value="all">Mọi thể loại</option>
                      {topics.map((t) => <option key={t} value={t}>{t} ({stories.filter((s) => s.topic === t).length})</option>)}
                    </select>
                  </label>
                  <label>Độ tuổi
                    <select className={`inp${ageF !== "all" ? " on" : ""}`} aria-label="Lọc theo nhóm tuổi" value={ageF} onChange={(e) => setAgeF(e.target.value)}>
                      <option value="all">Mọi độ tuổi</option>
                      {ageBands.map((a) => <option key={a} value={a}>{ageLabel(a)} ({stories.filter((s) => s.ageBand === a).length})</option>)}
                    </select>
                  </label>
                  <label>Nguồn
                    <select className={`inp${srcF !== "all" ? " on" : ""}`} aria-label="Lọc theo nguồn" value={srcF} onChange={(e) => setSrcF(e.target.value)}>
                      <option value="all">Mọi nguồn</option>
                      {Object.entries(SOURCE_LABEL).map(([id, label]) => <option key={id} value={id}>{label} ({stories.filter((s) => sourceOf(s) === id).length})</option>)}
                    </select>
                  </label>
                  {activeCount > 0 && <button className="btn btn-g" onClick={() => { setStatus("all"); setGenreF("all"); setAgeF("all"); setSrcF("all"); }}><X className="ic" />Xoá lọc</button>}
                </div>
              )}
            </div>
            </div>
          </div>
          {storiesLoading && stories.length === 0 ? <p className="sub lib-empty">Đang tải truyện…</p>
          : stories.length === 0 ? (
            <div className="lib-empty">
              <b className="display">Chưa có truyện nào</b>
              <span className="sub">Hãy tạo truyện đầu tiên bằng AI, hoặc tự viết truyện theo cách thủ công.</span>
              <div className="row"><button className="btn btn-p" onClick={() => go("studio")}><WandSparkles className="ic" />Dùng AI tạo truyện</button><button className="btn btn-s" onClick={() => go("authoring")}>Viết thủ công</button></div>
            </div>
          ) : searching ? (
            <Shelf title="Kết quả" sub={`${results.length} truyện`} items={results}>
              {results.length > 0 ? <div className="shelf-grid">{results.map((s) => card(s))}</div> : <p className="sub">Không tìm thấy truyện phù hợp.</p>}
            </Shelf>
          ) : expanded ? (
            <Shelf title={expanded.title} sub={`${expanded.items.length} truyện`} items={expanded.items}>
              <button className="shelf-back" onClick={() => setExpanded(null)}><ChevronLeft className="ic" />Quay lại thư viện</button>
              <div className="shelf-grid">{expanded.items.map((s) => card(s))}</div>
            </Shelf>
          ) : (
            <>
              <Shelf title="Mới nhất" items={latest} onAll={sorted.length > latest.length ? () => setExpanded({ title: "Mới nhất", items: sorted }) : undefined}>
                <ShelfRow>{latest.map((s, i) => card(s, i + 1))}</ShelfRow>
              </Shelf>
              {inProgress.length > 0 && (
                <Shelf title="Đang chuẩn bị" items={inProgress} sub="Đã duyệt, đang tạo tranh và giọng đọc" onAll={() => setExpanded({ title: "Đang chuẩn bị", items: inProgress })}>
                  <ShelfRow>{inProgress.map((s) => card(s))}</ShelfRow>
                </Shelf>
              )}
              {topics.length > 0 && (
                <Shelf title="Theo chủ đề" items={byTopic} pills={topics.map((t) => ({ id: t, label: t }))} pill={activeTopic ?? undefined} onPill={setTopic} onAll={() => setExpanded({ title: `Chủ đề: ${activeTopic}`, items: byTopic })}>
                  <ShelfRow>{byTopic.map((s) => card(s))}</ShelfRow>
                </Shelf>
              )}
              <Shelf title="Tất cả truyện" items={bySource} pills={SOURCE_PILLS} pill={source} onPill={setSource}>
                {bySource.length > 0 ? <div className="shelf-grid">{bySource.map((s) => card(s))}</div> : <p className="sub">Chưa có truyện nào trong nhóm này.</p>}
              </Shelf>
            </>
          )}
        </div>
      </div>

      <AsidePane title="Chi tiết" icon={Info}>
          {sel ? (
            <>
              <div className="cover" style={{ aspectRatio: "16/10", borderRadius: 12, background: sel.gradient }} />
              <h3 className="display" style={{ fontSize: 20, margin: 0, lineHeight: 1.2 }}>{sel.title}</h3>
              {sel.raw.description && <p className="sub">{sel.raw.description}</p>}
              <div className="meta">
                <span>Nguồn</span><b>{SOURCE_LABEL[sourceOf(sel)]}</b>
                <span>Độ tuổi</span><b>{ageLabel(sel.ageBand)}</b>
                <span>Chủ đề</span><b>{sel.topic}</b>
                {sel.raw.moralLesson && <><span>Bài học</span><b>{sel.raw.moralLesson}</b></>}
                {sel.words > 0 && <><span>Độ dài</span><b>{sel.words.toLocaleString("vi-VN")} tiếng</b></>}
                <span>Người tạo</span><b>{sel.by}</b>
                <span>Trạng thái</span><span className={`pill ${sel.tone}`} style={{ width: "fit-content" }}>{sel.statusLabel}</span>
              </div>
              {/* Truyện tự soạn đi qua API riêng: kiểm tra, giao cho bé, thu hồi đều làm ở trang Tự soạn. */}
              {sel.family && <>
                <button className="btn btn-p btn-c" onClick={() => go("authoring", { storyId: sel.id })}><PencilLine className="ic" />Mở trong trang Thủ công</button>
              </>}
              {!sel.family && <>
              {selStatus === "review" && <button className="btn btn-p btn-c" onClick={() => sel.fromAi ? go('studio',{storyId:sel.id}) : go('review')}><WandSparkles className="ic" />Mở để duyệt</button>}
              {sel.fromAi && ['draft','generating','outline','review','media','moderation'].includes(selStatus ?? '') && <button className="btn btn-p btn-c" onClick={() => go("studio",{storyId:sel.id})}><WandSparkles className="ic" />Tiếp tục trong Studio</button>}
              {selStatus === "moderation" && <p className="sub">Truyện đang chờ kiểm duyệt viên xem, thường trong 24 giờ.</p>}
              {selStatus === "ready" && role?.can("AssignActivity") && <button className="btn btn-p btn-c" onClick={() => setDialog("roadmap")}><Route className="ic" />Thêm vào lộ trình của con</button>}
              {selStatus === "ready" && mod?.submission && <p className="sub">Thư viện cộng đồng: {SUB_STATUS[mod.submission.status] ?? mod.submission.status}</p>}
              {mine && selStatus === "ready" && mod?.submission && ((mod.submission.canWithdraw ?? mod.submission.status === "pending") || (mod.submission.canRemove ?? mod.submission.status === "approved")) && role?.can("ApproveStory") && (
                <button className="btn btn-s btn-c" onClick={() => void (mod.submission!.canRemove ?? mod.submission!.status === "approved" ? guardianService.removeCommunity(mod.submission!.id) : guardianService.withdrawCommunity(mod.submission!.id)).then((r) => { flash(r.success ? r.message : r.message); void loadMod(); })}>{mod.submission.status === "pending" ? "Rút yêu cầu" : "Gỡ khỏi thư viện cộng đồng"}</button>
              )}
              {mine && selStatus === "ready" && role?.can("ApproveStory") && !(mod?.submission && ["pending", "approved"].includes(mod.submission.status)) && (
                <button className="btn btn-s btn-c" disabled={!!mod?.reports.some((r) => r.status === "pending")} title={mod?.reports.some((r) => r.status === "pending") ? "Truyện đang có báo cáo chờ xử lý" : undefined} onClick={() => setDialog("community")}><Send className="ic" />Nộp thư viện cộng đồng</button>
              )}
              {selStatus === "ready" && <button className="btn btn-g btn-c" onClick={() => setDialog("report")}><Flag className="ic" />Báo cáo nội dung</button>}
              {mod?.reports.some((r) => r.status === "pending") && <p className="sub">Đã có báo cáo đang chờ kiểm duyệt viên xử lý.</p>}
              {selStatus !== "archived" && <button className="btn btn-s btn-c" onClick={() => setDialog("preview")}><Eye className="ic" />Xem trước như bé thấy</button>}
              {/* Lưu trữ cần quyền duyệt truyện (Luồng 2 mục 2.1, BR-1.10). */}
              {mine && selStatus !== "archived" && role?.can("ApproveStory") && <button className="btn btn-no btn-c" onClick={() => setDialog("archive")}><Archive className="ic" />Lưu trữ</button>}
              </>}
            </>
          ) : <p className="sub">Chọn một truyện để xem chi tiết.</p>}
      </AsidePane>
      {sel && dialog === "preview" && <Preview story={sel} onClose={() => setDialog(null)} />}
      {sel && dialog === "roadmap" && <AddToRoadmapDialog story={{ storyId: sel.id, title: sel.title, ageBand: sel.ageBand, length: sel.words }} onClose={() => setDialog(null)} />}
      {sel && dialog === "report" && <ReportDialog story={sel} onClose={() => setDialog(null)} onDone={(m) => { setDialog(null); flash(m); void loadMod(); }} />}
      {sel && dialog === "community" && <CommunityDialog story={sel} nickname={child?.nickname ?? ""} onClose={() => setDialog(null)} onDone={(m) => { setDialog(null); flash(m); void loadMod(); }} />}
      {sel && dialog === "archive" && <ArchiveDialog storyId={sel.id} onClose={() => setDialog(null)} onDone={(msg) => { setDialog(null); setToast(msg); void reload(); setTimeout(() => setToast(""), 3000); }} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </section>
    </AsideContext.Provider>
  );
}
