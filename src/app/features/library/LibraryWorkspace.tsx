"use client";

import "./library.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { aiStoryCreationService } from "@/app/services/aiStoryCreationService";
import AudioRing from "./AudioRing";
import { ChevronLeft, ChevronRight, Eye, Flag, Info, SlidersHorizontal, PencilLine, Route, Search, Send, WandSparkles, X } from "lucide-react";
import AsidePane, { AsideContext } from "@/app/components/shell/AsidePane";
import { useAuth } from "@/app/context/AuthContext";
import type { StoryDto } from "@/app/types/story";
import { storyService } from "@/app/services/storyService";
import { ageLabel, familyToCard, splitScenes, statusKey, toCard, type StoryCard } from "@/app/lib/storyView";
import { parentAuthoringService } from "@/app/services/parentAuthoringService";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import { useRiseIn } from "@/app/lib/motion";
import AddToRoadmapDialog from "@/app/features/roadmap/AddToRoadmapDialog";
import { guardianService } from "@/app/services/guardianService";
import type { CommunitySubmission, ContentReport } from "@/app/types/progress";
import { CommunityDialog, ReportDialog } from "./ModerationDialogs";
import { confirmDialog } from "@/app/lib/confirm";

const SUB_STATUS: Record<string, string> = { pending: "Đang chờ duyệt", approved: "Đã có trong thư viện cộng đồng", rejected: "Bị từ chối — có thể nộp lại", withdrawn: "Đã rút", removed: "Đã gỡ" };

/** Luồng 2 mục 6.9 — nhóm trạng thái hiển thị cho phụ huynh. */
const STATUS_GROUPS: { id: string; label: string; keys: string[] }[] = [
  { id: "draft", label: "Nháp", keys: ["draft"] },
  { id: "generating", label: "Đang sinh", keys: ["input_accepted", "generating"] },
  { id: "outline", label: "Chờ bạn duyệt dàn ý", keys: ["outline_review"] },
  { id: "moderation", label: "Đang kiểm duyệt an toàn", keys: ["moderation_review"] },
  { id: "review", label: "Chờ bạn duyệt", keys: ["content_review"] },
  { id: "media", label: "Đang chuẩn bị media", keys: ["approved", "media_processing", "media_review"] },
  { id: "ready", label: "Sẵn sàng", keys: ["ready", "published"] },
  { id: "blocked", label: "Bị chặn", keys: ["blocked"] },
  { id: "rejected", label: "Bị từ chối", keys: ["rejected"] },
];

const statusOf = (s: StoryCard) => STATUS_GROUPS.find((g) => g.keys.includes(statusKey(s.raw)))?.id ?? "draft";

/** Một trang khi đọc: chữ của cảnh, các tranh và đoạn giọng đọc (đã sẵn sàng, có URL) của cảnh đó. */
type PreviewPage = { text: string; images: string[]; audio: { url: string; label: string }[] };

/**
 * Xem trước truyện như bé thấy — không ghi nhận lượt đọc, không cộng điểm.
 * Truyện AI lấy từng cảnh từ gói media của backend (GET /stories/{id}/media/package: chữ, tranh, giọng đọc);
 * chưa có gói media (hoặc truyện thủ công) thì chỉ hiện chữ, chia đoạn theo nội dung truyện.
 */
export type PreviewStory = Pick<StoryCard, "id" | "title" | "cover"> & { family?: boolean; raw?: Pick<StoryDto, "content"> };

/**
 * Bộ nhớ tạm của hộp xem trước (sống đến khi tải lại trang): đóng rồi mở lại cùng truyện thì dùng ngay, không gọi API nữa.
 * Đường dẫn ảnh/giọng đọc là URL có chữ ký nên chỉ giữ ngắn; ảnh lỗi thì xoá mục tương ứng để lần sau lấy đường dẫn mới.
 */
const PREVIEW_CACHE = new Map<string, { pages: PreviewPage[]; at: number }>();
const PREVIEW_TTL_MS = 5 * 60_000;

/** `loadContent`: nguồn chữ riêng (Content Creator đọc qua /creator/stories); không truyền thì dùng API của phụ huynh. */
export function Preview({ story, onClose, loadContent }: { story: PreviewStory; onClose: () => void; loadContent?: () => Promise<string> }) {
  const [pages, setPages] = useState<PreviewPage[] | null>(null);
  const [page, setPage] = useState(0);
  const [shot, setShot] = useState(0);
  const [broken, setBroken] = useState<string | null>(null);
  /** Ảnh đã tải xong; chưa khớp ảnh đang chọn thì hiện vòng tải thay vì ảnh cũ. */
  const [loaded, setLoaded] = useState<string | null>(null);
  const cacheKey = `${story.id}:${story.family ? "f" : "s"}:${loadContent ? "c" : "p"}:${story.raw?.content?.length ?? 0}`;
  useEffect(() => {
    // Creator sửa nội dung liên tục và nguồn chữ riêng không có dấu hiệu đổi, nên không dùng bộ nhớ tạm cho họ.
    const hit = loadContent ? undefined : PREVIEW_CACHE.get(cacheKey);
    if (hit && Date.now() - hit.at < PREVIEW_TTL_MS) { setPages(hit.pages); return; }
    const c = new AbortController();
    const textOnly = (content: string): PreviewPage[] => splitScenes(content).map((text) => ({ text, images: [], audio: [] }));
    const load = async (): Promise<PreviewPage[]> => {
      // Bản nháp thủ công của phụ huynh không nằm trong GET /Story và không có gói media: chỉ hiện chữ.
      if (story.family && !loadContent) {
        const d = await parentAuthoringService.get(story.id);
        const versionId = d.data?.story.selectedVersionId;
        const v = versionId ? await parentAuthoringService.version(story.id, versionId) : null;
        return textOnly(v?.data?.content ?? "");
      }
      const [content, pack] = await Promise.all([
        loadContent ? loadContent() : storyService.getStoryById(story.id).then((r) => r.data?.content ?? story.raw?.content ?? ""),
        aiStoryCreationService.getMediaPackage(story.id, c.signal).then((r) => (r.success ? r.data : null)).catch(() => null),
      ]);
      const texts = splitScenes(content);
      const scenes = pack?.scenes?.slice().sort((a, b) => a.sceneIndex - b.sceneIndex) ?? [];
      if (!scenes.length) return textOnly(content);
      return scenes.map((scene, i) => {
        const audio = (scene.audio ?? []).slice().sort((a, b) => a.segmentOrder - b.segmentOrder);
        return {
          text: scene.text?.trim() || audio.map((a) => a.text).join(" ").trim() || texts[i] || "",
          images: scene.illustrations.slice().sort((a, b) => a.beatOrder - b.beatOrder)
            .flatMap((x) => (x.status === "Ready" && x.url ? [x.url] : [])),
          audio: audio.flatMap((a) => (a.status === "Ready" && a.url ? [{ url: a.url, label: `Đoạn ${a.segmentOrder + 1}` }] : [])),
        };
      });
    };
    void load().then((p) => { if (c.signal.aborted) return; if (!loadContent) PREVIEW_CACHE.set(cacheKey, { pages: p, at: Date.now() }); setPages(p); }).catch(() => { if (!c.signal.aborted) setPages([]); });
    return () => c.abort();
  }, [story]); // eslint-disable-line react-hooks/exhaustive-deps -- loadContent đổi theo từng lần vẽ; chỉ tải lại khi đổi truyện
  const go =(to: number) => { setPage(to); setShot(0); setBroken(null); };
  // Tải sẵn tranh và giọng đọc của trang hiện tại và trang kế để lật trang không phải chờ.
  const warm = useRef<(HTMLImageElement | HTMLAudioElement)[]>([]);
  useEffect(() => {
    if (!pages) return;
    const items: (HTMLImageElement | HTMLAudioElement)[] = [];
    for (const p of [pages[page], pages[page + 1]]) {
      if (!p) continue;
      p.images.forEach((u) => { const im = new Image(); im.src = u; items.push(im); });
      if (p.audio[0]) { const au = new Audio(); au.preload = "auto"; au.src = p.audio[0].url; items.push(au); }
    }
    warm.current = items;
  }, [pages, page]);
  const current = pages?.[page];
  const image = current?.images[shot];
  const shown = image && broken !== image ? image : null;
  // Phát qua portal ra <body>: nếu để trong vùng nội dung, thanh điều hướng trên cùng sẽ đè lên hộp thoại.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label={`Xem trước ${story.title}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dlg wide preview">
        <div className="row"><b className="display grow" style={{ fontSize: "var(--fs-lg)" }}>{story.title}</b><span className="pill draft">Xem trước — không tính lượt đọc</span><button className="btn btn-g" aria-label="Đóng" onClick={onClose}><X className="ic" /></button></div>
        <div className="preview-body">
          <div className="preview-media">
            {shown
              // Ảnh là URL có chữ ký của backend, nên dùng thẻ img thường.
              // eslint-disable-next-line @next/next/no-img-element
              ? <img key={shown} className={`preview-img${loaded === shown ? "" : " loading"}`} src={shown} alt={`Tranh minh hoạ trang ${page + 1}`} ref={(el) => { if (el?.complete && el.naturalWidth > 0) setLoaded(shown); }} onLoad={() => setLoaded(shown)} onError={() => { PREVIEW_CACHE.delete(cacheKey); setBroken(shown); }} />
              : <div className="cover" style={{ aspectRatio: "16/9", borderRadius: 16, background: story.cover }} role="img" aria-label="Chưa có tranh minh hoạ cho trang này" />}
            {shown && loaded !== shown && <div className="preview-loading" role="status" aria-label="Đang tải tranh"><span className="preview-spin" aria-hidden="true" /></div>}
            {/* Nút nghe tròn ở góc phải trên của hình; key theo trang để đổi trang thì dừng tiếng và chạy lại từ đầu. */}
            {current && current.audio.length > 0 && <AudioRing key={page} urls={current.audio.map((a) => a.url)} label={`Nghe giọng đọc trang ${page + 1}`} />}
          </div>
          {current && current.images.length > 1 && (
            <div className="row preview-shots" aria-label="Chọn tranh trong trang">
              {current.images.map((u, i) => <button key={u} className="btn btn-s" aria-pressed={i === shot} onClick={() => { setShot(i); setBroken(null); }}>Tranh {i + 1}</button>)}
            </div>
          )}
          <p className="display preview-text">{pages === null ? "Đang mở truyện…" : current?.text || "Truyện chưa có nội dung."}</p>
        </div>
        <div className="row">
          <button className="btn btn-s" disabled={page === 0} onClick={() => go(page - 1)} aria-label="Trang trước"><ChevronLeft className="ic" /></button>
          <span className="grow sub" style={{ textAlign: "center" }}>{pages?.length ? `Trang ${page + 1} / ${pages.length}` : ""}</span>
          <button className="btn btn-s" disabled={!pages || page >= pages.length - 1} onClick={() => go(page + 1)} aria-label="Trang sau"><ChevronRight className="ic" /></button>
        </div>
      </div>
    </div>,
    document.body,
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
      <span className="bk-cover" style={{ background: story.cover }}>
        {!ready ? <span className={`pill ${story.tone} bk-badge`}>{story.statusLabel}</span> : isNew(story) && <span className="bk-badge bk-new">Mới</span>}
        <span className="bk-name display">{story.title}</span>
        {rank !== undefined && <span className="bk-rank display" aria-hidden>{rank}</span>}
      </span>
      <span className="bk-title">{story.title}</span>
      <span className="bk-meta">{story.topic} · {ageLabel(story.ageBand)}</span>
    </button>
  );
}

type ShelfProps = { title: string; sub?: string; items: { id: number }[]; pills?: { id: string; label: string }[]; pill?: string; onPill?: (id: string) => void; onAll?: () => void; children: React.ReactNode };

/** Một kệ truyện: tiêu đề, nút lọc dạng viên thuốc và "Xem tất cả". */
export function Shelf({ title, sub, items, pills, pill, onPill, onAll, children }: ShelfProps) {
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
export function ShelfRow({ children }: { children: React.ReactNode }) {
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

const SOURCE_PILLS = [{ id: "all", label: "Tất cả" }, { id: "creator", label: "Của creator" }, { id: "ai", label: "Do AI tạo" }, { id: "manual", label: "Nhập sẵn" }, { id: "family", label: "Tự soạn" }];
const sourceOf = (s: StoryCard) => (s.creator ? "creator" : s.family ? "family" : s.fromAi ? "ai" : "manual");
const SOURCE_LABEL: Record<string, string> = { creator: "Của creator", ai: "Do AI tạo", manual: "Nhập sẵn", family: "Tự soạn gia đình" };

export default function LibraryWorkspace({ go }: Pick<WorkspaceProps,'go'>) {
  const { user } = useAuth();
  // Thư viện lấy truyện của mọi người dùng qua GET /Story (không lọc theo tác giả), rồi chỉ giữ truyện đã được duyệt.
  const [pub, setPub] = useState<StoryCard[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadPublic = useCallback(async () => {
    setStoriesLoading(true);
    const all: StoryDto[] = [];
    const creatorIds = new Set<number>();
    let message: string | null = null;
    // Mỗi trang tối đa 100 truyện (giới hạn của backend) nên tải lần lượt tới hết.
    for (let pageIndex = 1; pageIndex <= 50; pageIndex++) {
      const res = await storyService.getStories({ pageIndex, pageSize: 100, isDescending: true });
      if (!res.success) { message = res.message; break; }
      const items = res.data?.items ?? [];
      all.push(...items);
      if (items.length === 0 || all.length >= (res.data?.totalCount ?? 0)) break;
    }
    // Truyện của Creator đã duyệt nằm ở API riêng (GET /Story/community), gộp vào thư viện chung.
    for (let pageIndex = 1; pageIndex <= 50; pageIndex++) {
      const res = await storyService.getCommunityStories({ pageIndex, pageSize: 100, isDescending: true });
      if (!res.success) { message = message ?? res.message; break; }
      const items = res.data?.items ?? [];
      items.forEach((s) => creatorIds.add(s.id));
      all.push(...items.filter((s) => !all.some((x) => x.id === s.id)));
      if (items.length === 0 || !res.data?.hasNextPage) break;
    }
    setPub(all.map((s) => (creatorIds.has(s.id) ? { ...toCard(s), creator: true } : toCard(s))));
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
  useEffect(() => { void loadPublic(); void loadFamily(); }, [loadPublic, loadFamily]);
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
  const [dialog, setDialog] = useState<"preview" | "roadmap" | "report" | "community" | null>(null);
  const [mod, setMod] = useState<{ reports: ContentReport[]; submission: CommunitySubmission | null } | null>(null);
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
  // Mới nhất: chỉ truyện đã công khai (không hiện truyện riêng), mới ra mắt xếp trước.
  const released = useMemo(() => sorted.filter((s) => !s.family && s.raw.isPublished), [sorted]);
  const latest = released.slice(0, 10);
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

  // Chưa bấm vào truyện nào thì không chọn sẵn truyện đầu tiên.
  const sel = stories.find((s) => s.id === selected) ?? null;
  const pick = (id: number) => { setSelected(id); if (asideCollapsed) setAsideCollapsed(false); };
  const card = (s: StoryCard, rank?: number) => <BookCard key={s.id} story={s} rank={rank} on={sel?.id === s.id} onPick={() => pick(s.id)} />;
  const selStatus = sel ? statusOf(sel) : null;
  // Quản lý (nộp thư viện cộng đồng, rút) chỉ dành cho truyện của chính bạn; truyện của người khác chỉ xem, xem trước, báo cáo hoặc thêm vào lộ trình.
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
              {latest.length > 0 && (
                <Shelf title="Mới nhất" items={latest} onAll={released.length > latest.length ? () => setExpanded({ title: "Mới nhất", items: released }) : undefined}>
                  <ShelfRow>{latest.map((s, i) => card(s, i + 1))}</ShelfRow>
                </Shelf>
              )}
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
              <div className="cover cover-portrait" style={{ background: sel.cover }} />
              <h3 className="display" style={{ fontSize: "var(--fs-xl)", margin: 0, lineHeight: 1.2 }}>{sel.title}</h3>
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
              {selStatus === "ready" && <button className="btn btn-p btn-c" onClick={() => setDialog("roadmap")}><Route className="ic" />Thêm vào lộ trình</button>}
              {selStatus === "ready" && mod?.submission && <p className="sub">Thư viện cộng đồng: {SUB_STATUS[mod.submission.status] ?? mod.submission.status}</p>}
              {mine && selStatus === "ready" && mod?.submission && ((mod.submission.canWithdraw ?? mod.submission.status === "pending") || (mod.submission.canRemove ?? mod.submission.status === "approved")) && (
                <button className="btn btn-s btn-c" onClick={async () => { const withdraw = mod.submission!.status === "pending"; if (!(await confirmDialog(withdraw ? "Rút yêu cầu nộp thư viện cộng đồng? Truyện sẽ không còn chờ duyệt." : "Gỡ truyện khỏi thư viện cộng đồng? Mọi người sẽ không còn thấy truyện này."))) return; void (mod.submission!.canRemove ?? mod.submission!.status === "approved" ? guardianService.removeCommunity(mod.submission!.id) : guardianService.withdrawCommunity(mod.submission!.id)).then((r) => { flash(r.message); void loadMod(); }); }}>{mod.submission.status === "pending" ? "Rút yêu cầu" : "Gỡ khỏi thư viện cộng đồng"}</button>
              )}
              {mine && selStatus === "ready" && !(mod?.submission && ["pending", "approved"].includes(mod.submission.status)) && (
                <button className="btn btn-s btn-c" disabled={!!mod?.reports.some((r) => r.status === "pending")} title={mod?.reports.some((r) => r.status === "pending") ? "Truyện đang có báo cáo chờ xử lý" : undefined} onClick={() => setDialog("community")}><Send className="ic" />Nộp thư viện cộng đồng</button>
              )}
              {selStatus === "ready" && <button className="btn btn-g btn-c" onClick={() => setDialog("report")}><Flag className="ic" />Báo cáo nội dung</button>}
              {mod?.reports.some((r) => r.status === "pending") && <p className="sub">Đã có báo cáo đang chờ kiểm duyệt viên xử lý.</p>}
              {selStatus !== "archived" && <button className="btn btn-s btn-c" onClick={() => setDialog("preview")}><Eye className="ic" />Xem trước như bé thấy</button>}
              </>}
            </>
          ) : <p className="sub">Chọn một truyện để xem chi tiết.</p>}
      </AsidePane>
      {sel && dialog === "preview" && <Preview story={sel} onClose={() => setDialog(null)} />}
      {sel && dialog === "roadmap" && <AddToRoadmapDialog story={{ storyId: sel.id, title: sel.title, ageBand: sel.ageBand, length: sel.words }} onClose={() => setDialog(null)} />}
      {sel && dialog === "report" && <ReportDialog story={sel} onClose={() => setDialog(null)} onDone={(m) => { setDialog(null); flash(m); void loadMod(); }} />}
      {sel && dialog === "community" && <CommunityDialog story={sel} nickname="" onClose={() => setDialog(null)} onDone={(m) => { setDialog(null); flash(m); void loadMod(); }} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </section>
    </AsideContext.Provider>
  );
}
