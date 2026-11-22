"use client";

import "@/app/styles/features/library/library.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { aiStoryCreationService } from "@/app/services/aiStoryCreationService";
import AudioRing from "./AudioRing";
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Flag, BookOpen, SlidersHorizontal, PencilLine, Route, Search, WandSparkles, X } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { avatarOf } from "@/app/lib/guardian";
import { backToLearning, takeLibraryPick, type LibraryPick } from "@/app/features/learning/learningIntent";
import type { StoryDto } from "@/app/types/story";
import { storyService } from "@/app/services/storyService";
import { ageLabel, splitScenes, statusKey, toCard, type StoryCard } from "@/app/lib/storyView";
import { parentAuthoringService } from "@/app/services/parentAuthoringService";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import { useRiseIn } from "@/app/lib/motion";
import AddToRoadmapDialog from "@/app/features/roadmap/AddToRoadmapDialog";
import StoryHandoverButton from "@/app/features/kid/StoryHandoverButton";
import RoadmapAlbum from "@/app/features/roadmap/RoadmapAlbum";
import TemplateDialog from "@/app/features/roadmap/TemplateDialog";
import { useRoadmapTemplates } from "@/app/features/roadmap/roadmapData";
import { roadmapTemplate } from "@/app/services/roadmapAdapters";
import type { RoadmapTemplate } from "@/app/types/progress";
import type * as B from "@/app/types/backendContracts";
import { ReportDialog } from "./ModerationDialogs";
import { StoryStatsBadge } from "@/app/components/StoryStatsBadge";

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
export type PreviewStory = Pick<StoryCard, "id" | "title" | "cover"> & { family?: boolean; creator?: boolean; raw?: Pick<StoryDto, "content"> };

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
  const cacheKey = `${story.id}:${story.family ? "f" : story.creator ? "r" : "s"}:${loadContent ? "c" : "p"}:${story.raw?.content?.length ?? 0}`;
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
        // Truyện Creator đã công khai: ảnh/giọng đọc lấy qua API thư viện chung (API tạo media chỉ cho đúng tác giả).
        (story.creator && !loadContent ? storyService.getCommunityStoryMedia(story.id, c.signal) : aiStoryCreationService.getMediaPackage(story.id, c.signal)).then((r) => (r.success ? r.data : null)).catch(() => null),
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

/** Thư viện chỉ hiện truyện đã được duyệt: các nhóm trạng thái còn lại (nháp, đang sinh, chờ duyệt, bị chặn, bị từ chối, lưu trữ) bị ẩn. */
const SHOWN_GROUPS = ["media", "ready"];

/** Thẻ truyện bìa đứng: tên truyện in trên bìa, nhãn trạng thái ở góc, số thứ tự lớn khi xếp hạng. */
function BookCard({ story, onPick }: { story: StoryCard; onPick: (button: HTMLButtonElement) => void }) {
  return (
    <button type="button" className="lib-book" aria-haspopup="dialog" onClick={(event) => onPick(event.currentTarget)}>
      <span className="lib-book-cover" style={{ background: story.cover }}>
        {statusOf(story) !== "ready" && <span className={`pill ${story.tone} bk-badge`}>{story.statusLabel}</span>}
        {(story.viewCount !== undefined || story.favoriteCount !== undefined) && <StoryStatsBadge viewCount={story.viewCount} favoriteCount={story.favoriteCount} />}
      </span>
      <span className="lib-book-copy">
        <strong className="display">{story.title}</strong>
        <span>{story.topic} · {ageLabel(story.ageBand)}</span>
      </span>
    </button>
  );
}

type ShelfProps = { title: string; sub?: string; /** Kệ cần chú ý (việc phụ huynh phải làm): nền và viền vàng. */ accent?: boolean; items: { id: number }[]; pills?: { id: string; label: string }[]; pill?: string; onPill?: (id: string) => void; onAll?: () => void; children: React.ReactNode };

/** Một kệ truyện: tiêu đề, nút lọc dạng viên thuốc và "Xem tất cả". */
export function Shelf({ title, sub, accent, items, pills, pill, onPill, onAll, children }: ShelfProps) {
  // Mỗi kệ tự chạy hiệu ứng hiện dần, chỉ khi danh sách truyện của chính kệ đó đổi (đổi chủ đề không làm kệ khác nháy lại).
  const animKey = items.map((s) => s.id).join(",");
  const ref = useRiseIn<HTMLElement>(".bk", [animKey], { delay: 22, distance: 12 });
  return (
    <section ref={ref} className={`shelf${accent ? " accent" : ""}`} aria-label={title}>
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

const sourceOf = (s: StoryCard) => (s.creator ? "creator" : s.family ? "family" : s.fromAi ? "ai" : "manual");
const SOURCE_LABEL: Record<string, string> = { creator: "Của creator", ai: "Do AI tạo", manual: "Nhập sẵn", family: "Tự soạn gia đình" };

/**
 * Bộ nhớ đệm của thư viện trong phiên: mở lại trang thì hiện ngay truyện đã tải, rồi tải bản mới ở nền.
 * Gắn với người dùng để đăng nhập tài khoản khác không thấy dữ liệu cũ.
 */
let pubCache: { userId: number; cards: StoryCard[]; at: number } | null = null;
const PUB_FRESH_MS = 30_000;

/** Tải lần lượt mọi trang của một API danh sách (mỗi trang tối đa 100 truyện, giới hạn của backend). */
async function loadAllPages<T extends StoryDto = StoryDto>(
  fetchPage: (pageIndex: number) => Promise<{ success: boolean; data?: { items?: T[]; hasNextPage?: boolean; totalCount?: number } | null; message?: string | null }>
) {
  const items: T[] = [];
  for (let pageIndex = 1; pageIndex <= 50; pageIndex++) {
    const res = await fetchPage(pageIndex);
    if (!res.success) return { items, message: res.message ?? null };
    const page = res.data?.items ?? [];
    items.push(...page);
    if (page.length === 0 || res.data?.hasNextPage === false || items.length >= (res.data?.totalCount ?? Infinity)) break;
  }
  return { items, message: null as string | null };
}

export default function LibraryWorkspace({ go, onKid }: Pick<WorkspaceProps,'go' | 'onKid'>) {
  const { user } = useAuth();
  const { children: kids } = useWorkspaceData();
  // Mở từ nút "Thêm truyện" ở trang Học tập của bé: chọn sẵn bé đó, thêm xong thì quay về lộ trình của bé.
  const [libPick, setLibPick] = useState<LibraryPick | null>(null);
  useEffect(() => { setLibPick(takeLibraryPick()); }, []);
  const pickKid = kids.find((k) => k.id === libPick?.childId) ?? null;
  // Chặng đích (khi đi từ một chặng trên bản đồ lộ trình): số chặng, hoặc "new" = chặng mới ở cuối.
  const pickStage = pickKid ? libPick?.stage ?? undefined : undefined;
  const addedRef = useRef(false);
  const closeRoadmapDialog = (close: () => void) => {
    close();
    if (addedRef.current && pickKid) { addedRef.current = false; backToLearning(go, pickKid.id); }
  };
  // Thư viện lấy truyện của mọi người dùng qua GET /Story (không lọc theo tác giả), rồi chỉ giữ truyện đã được duyệt.
  const cached = pubCache && pubCache.userId === user?.id ? pubCache : null;
  const [pub, setPub] = useState<StoryCard[]>(() => cached?.cards ?? []);
  const [storiesLoading, setStoriesLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const loadPublic = useCallback(async () => {
    // Truyện của Creator đã duyệt nằm ở API riêng (GET /Story/community); tải song song với GET /Story rồi gộp.
    const [mine, community] = await Promise.all([
      loadAllPages((pageIndex) => storyService.getStories({ pageIndex, pageSize: 100, isDescending: true })),
      loadAllPages((pageIndex) => storyService.getCommunityStories({ pageIndex, pageSize: 100, isDescending: true })),
    ]);
    const ids = new Set(mine.items.map((s) => s.id));
    const communityMap = new Map(community.items.map((s) => [s.id, s]));
    const all = [...mine.items, ...community.items.filter((s) => !ids.has(s.id))];
    const cards: StoryCard[] = all.map((s) => {
      const comm = communityMap.get(s.id);
      return comm
        ? { ...toCard(s), creator: true, viewCount: comm.viewCount, favoriteCount: comm.favoriteCount }
        : toCard(s);
    });
    const message = mine.message ?? community.message;
    setPub(cards);
    if (!message && user) pubCache = { userId: user.id, cards, at: Date.now() };
    setError(message);
    setStoriesLoading(false);
  }, [user]);
  // Có dữ liệu đệm còn mới thì không tải lại; cũ hơn 30 giây thì vẫn hiện ngay và tải bản mới ở nền.
  useEffect(() => {
    if (cached && Date.now() - cached.at < PUB_FRESH_MS) return;
    void loadPublic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPublic]);
  const stories = useMemo(() => {
    // Thư viện chung chỉ hiện truyện đã công khai; truyện tự soạn của gia đình là riêng tư nên không đưa vào.
    return pub.filter((s) => s.raw.isPublished && SHOWN_GROUPS.includes(statusOf(s)));
  }, [pub]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!filterOpen) return;
    const down = (e: MouseEvent) => { if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setFilterOpen(false); };
    document.addEventListener("mousedown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [filterOpen]);
  const [tab, setTab] = useState<"stories" | "roadmaps">("stories");
  const [roadmapQuery, setRoadmapQuery] = useState("");
  const [sort, setSort] = useState("category");
  const { templates, error: roadmapError } = useRoadmapTemplates();
  const [openedTpl, setOpenedTpl] = useState<B.RoadmapLibraryItemDto | null>(null);
  const [addingTpl, setAddingTpl] = useState<RoadmapTemplate | null>(null);
  const album = (t: B.RoadmapLibraryItemDto) => <RoadmapAlbum key={`rm-${t.id}`} item={t} onOpen={() => setOpenedTpl(t)} />;
  const [status, setStatus] = useState("all");
  // Bộ lọc theo thể loại (genre), nhóm tuổi (ageBand) và nguồn (source). "all" là không lọc.
  const [genreF, setGenreF] = useState("all");
  const [ageF, setAgeF] = useState("all");
  const [srcF, setSrcF] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [dialog, setDialog] = useState<"preview" | "roadmap" | "report" | null>(null);
  const [toast, setToast] = useState("");
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const closeDetails = useCallback(() => {
    setSelected(null);
    returnFocus.current?.focus({ preventScroll: true });
  }, []);

  const counts = useMemo(() => Object.fromEntries(STATUS_GROUPS.map((g) => [g.id, stories.filter((s) => statusOf(s) === g.id).length])), [stories]);

  // Mới tạo xếp trước; mọi kệ dùng chung thứ tự này.
  const sorted = useMemo(() => [...stories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [stories]);
  const topics = useMemo(() => [...new Set(sorted.map((s) => s.topic).filter(Boolean))], [sorted]);
  const ageBands = useMemo(() => [...new Set(sorted.map((s) => s.ageBand).filter(Boolean))], [sorted]);
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sorted.filter((s) =>
      (status === "all" || statusOf(s) === status) &&
      (genreF === "all" || s.topic === genreF) &&
      (ageF === "all" || s.ageBand === ageF) &&
      (srcF === "all" || sourceOf(s) === srcF) &&
      s.title.toLowerCase().includes(needle)).sort((a, b) => {
      if (sort === "views") return (b.viewCount ?? 0) - (a.viewCount ?? 0);
      if (sort === "favorites") return (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0);
      return 0;
    });
  }, [sorted, q, status, genreF, ageF, srcF, sort]);
  const categoryGroups = useMemo(() => {
    if (sort !== "category") return [];
    const groups = new Map<string, StoryCard[]>();
    for (const story of results) {
      const label = story.topic.trim() || "Khác";
      const key = label.toLocaleLowerCase("vi");
      const group = groups.get(key);
      if (group) group.push(story);
      else groups.set(key, [story]);
    }
    return Array.from(groups.values()).sort(([a], [b]) => a.topic.localeCompare(b.topic, "vi"));
  }, [results, sort]);
  const favorites = sorted
    .filter((story) => statusOf(story) === "ready" && (story.favoriteCount ?? 0) > 0)
    .sort((a, b) => (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0)).slice(0, 6);
  const ageKey = (band: string) => ageLabel(band).replace(/[–—]/g, "-").toLowerCase();
  const recommendedAges = new Set((pickKid ? [pickKid] : kids).map((kid) => ageKey(kid.ageBand)));
  const recommended = sorted.filter((story) =>
    statusOf(story) === "ready" && (!recommendedAges.size || recommendedAges.has(ageKey(story.ageBand))),
  ).slice(0, 6);
  const activeCount = [status, genreF, ageF, srcF].filter((v) => v !== "all").length;
  const roadmapResults = useMemo(() => {
    const needle = roadmapQuery.trim().toLowerCase();
    return (templates ?? []).filter((t) => `${t.name} ${t.description ?? ""}`.toLowerCase().includes(needle));
  }, [templates, roadmapQuery]);
  const sel = stories.find((s) => s.id === selected) ?? null;
  const selStatus = sel ? statusOf(sel) : null;
  const detailOpen = !!sel && !dialog;

  useEffect(() => {
    if (!detailOpen) return;
    const modal = detailRef.current?.closest('[role="dialog"]');
    if (!modal) return;
    const tabbable = () => Array.from(modal.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]'))
      .filter((element) => element.getClientRects().length > 0);
    tabbable()[0]?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== modal) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeDetails();
      } else if (event.key === "Tab") {
        const items = tabbable();
        const first = items[0];
        const last = items[items.length - 1];
        if (!modal.contains(document.activeElement) || document.activeElement === (event.shiftKey ? first : last)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [detailOpen, closeDetails]);

  const storyGrid = (items: StoryCard[]) => (
    <div className="lib-grid">
      {items.map((story) => <BookCard key={story.id} story={story} onPick={(button) => {
        returnFocus.current = button;
        setSelected(story.id);
      }} />)}
    </div>
  );
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3200); };

  return (
    <section className="ws dock lib lib-catalog">
      <div className="pane">
        <div className="lib-scroll">
          {pickKid && (
            <div className="lib-pickbar" role="status">
              <span className="av" aria-hidden>{avatarOf(pickKid.avatarId).emoji}</span>
              <b className="grow">Đang chọn truyện cho {pickKid.nickname}{pickStage !== undefined && ` · ${pickStage === "new" ? "Chặng mới" : `Chặng ${pickStage}`}`}</b>
              <button className="btn btn-s" onClick={() => backToLearning(go, pickKid.id)}><ArrowLeft className="ic" />Quay lại</button>
              <button className="btn btn-g icon-only" aria-label="Thôi chọn" title="Thôi chọn" onClick={() => setLibPick(null)}><X className="ic" /></button>
            </div>
          )}
          <header className="lib-heading">
            <h2 className="display">Thư viện</h2>
            <div className="lib-switch" role="group" aria-label="Danh mục thư viện">
              <button type="button" aria-pressed={tab === "stories"} onClick={() => { setTab("stories"); setFilterOpen(false); }}><BookOpen className="ic" />Truyện</button>
              <button type="button" aria-pressed={tab === "roadmaps"} onClick={() => { setTab("roadmaps"); setFilterOpen(false); }}><Route className="ic" />Lộ trình mẫu</button>
            </div>
          </header>
          <div className="lbar">
            <div className="lsearch">
            <label className="row grow" style={{ gap: 6, color: "var(--muted)" }}>
              <Search className="ic" />
              <input className="inp" value={tab === "stories" ? q : roadmapQuery} onChange={(e) => (tab === "stories" ? setQ : setRoadmapQuery)(e.target.value)} placeholder={tab === "stories" ? "Tìm theo tên truyện" : "Tìm lộ trình mẫu"} style={{ border: 0, background: "none" }} aria-label={tab === "stories" ? "Tìm theo tên truyện" : "Tìm lộ trình mẫu"} />
            </label>
            {tab === "stories" && <div className="lfilter" ref={filterRef}>
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
            </div>}
            </div>
          </div>
          {tab === "stories" ? (
            <>
              <div className="lib-results">
                <span role="status">{storiesLoading ? "Đang tải truyện…" : `${results.length} truyện${activeCount ? ` · ${activeCount} bộ lọc` : ""}`}</span>
                <label>Sắp xếp <select className="inp" value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="category">Theo thể loại</option>
                  <option value="recent">Mới nhất</option>
                  <option value="views">Đọc nhiều nhất</option>
                  <option value="favorites">Được yêu thích</option>
                </select></label>
              </div>
              {error && <div className="notice err" role="alert">{error}</div>}
              {!q.trim() && !activeCount && stories.length > 0 && (
                <>
                  <section className="lib-collection" aria-labelledby="lib-favorites">
                    <div className="lib-collection-heading">
                      <h3 id="lib-favorites" className="display">Được yêu thích</h3>
                      <span>Theo lượt yêu thích trong cộng đồng</span>
                    </div>
                    {favorites.length ? storyGrid(favorites) : <p className="lib-none">Chưa có truyện được yêu thích.</p>}
                  </section>
                  <section className="lib-collection" aria-labelledby="lib-recommended">
                    <div className="lib-collection-heading">
                      <h3 id="lib-recommended" className="display">{pickKid ? `Đề xuất cho ${pickKid.nickname}` : "Đề xuất cho bé"}</h3>
                      <span>{recommendedAges.size ? "Truyện sẵn sàng theo nhóm tuổi của bé" : "Truyện mới đã sẵn sàng"}</span>
                    </div>
                    {recommended.length ? storyGrid(recommended) : <p className="lib-none">Chưa có truyện sẵn sàng trong nhóm tuổi này.</p>}
                  </section>
                </>
              )}
              {results.length > 0 ? (
                <section className="lib-collection" aria-labelledby="lib-story-results">
                  <div className="lib-collection-heading"><h3 id="lib-story-results" className="display">{sort === "category" ? "Theo thể loại" : "Danh sách truyện"}</h3></div>
                  {sort === "category" ? categoryGroups.map((items) => {
                    const label = items[0].topic.trim() || "Khác";
                    return (
                      <section key={label} className="lib-category" aria-label={label}>
                        <div className="lib-category-heading"><h4 className="display">{label}</h4><span>{items.length} truyện</span></div>
                        {storyGrid(items)}
                      </section>
                    );
                  }) : storyGrid(results)}
                </section>
              ) : !storiesLoading && !error && <p className="lib-none">{q.trim() || activeCount ? "Không tìm thấy truyện phù hợp." : "Chưa có truyện nào trong thư viện."}</p>}
            </>
          ) : (
            <>
              <div className="lib-results" role="status">{templates ? `${roadmapResults.length} lộ trình` : roadmapError ? "Không tải được lộ trình mẫu" : "Đang tải lộ trình mẫu…"}</div>
              {roadmapError && <div className="notice err" role="alert">{roadmapError}</div>}
              {roadmapResults.length > 0 ? <div className="lib-grid">{roadmapResults.map(album)}</div>
                : templates && !roadmapError && <p className="lib-none">{roadmapQuery.trim() ? "Không tìm thấy lộ trình phù hợp." : "Chưa có lộ trình mẫu."}</p>}
            </>
          )}
        </div>
      </div>

      {sel && detailOpen && <Dialog title={sel.title} onClose={closeDetails} wide className="lib-detail">
        <div ref={detailRef} className="lib-detail-layout">
          <div className="lib-detail-cover" style={{ background: sel.cover }} aria-hidden="true" />
          <div className="lib-detail-copy">
              {sel.raw.description && <p className="lib-desc">{sel.raw.description}</p>}
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
              {selStatus === "review" && <button className="btn btn-p btn-c" onClick={() => go(sel.fromAi ? 'studio' : 'authoring', { storyId: sel.id })}><WandSparkles className="ic" />Mở để duyệt</button>}
              {sel.fromAi && ['draft','generating','outline','review','media','moderation'].includes(selStatus ?? '') && <button className="btn btn-p btn-c" onClick={() => go("studio",{storyId:sel.id})}><WandSparkles className="ic" />Tiếp tục trong Studio</button>}
              {selStatus === "moderation" && <span className="pill wait lib-state" title="Kiểm duyệt viên thường xem trong 24 giờ">Đang chờ kiểm duyệt</span>}
              {selStatus === "ready" && <StoryHandoverButton storyId={sel.id} title={sel.title} onKid={onKid} />}
              {selStatus === "ready" && <button className="btn btn-p btn-c" onClick={() => setDialog("roadmap")}><Route className="ic" />Thêm vào lộ trình</button>}
              {selStatus === "ready" && <button className="btn btn-g btn-c" onClick={() => setDialog("report")}><Flag className="ic" />Báo cáo nội dung</button>}
              {selStatus === "ready" && <button className="btn btn-s btn-c" onClick={() => setDialog("preview")}><Eye className="ic" />Xem trước như bé thấy</button>}
              </>}
          </div>
        </div>
      </Dialog>}
      {sel && dialog === "preview" && <Preview story={sel} onClose={() => setDialog(null)} />}
      {openedTpl && <TemplateDialog item={openedTpl} onClose={() => setOpenedTpl(null)} onAdd={(d) => { setOpenedTpl(null); setAddingTpl(roadmapTemplate(d)); }} />}
      {addingTpl && <AddToRoadmapDialog template={addingTpl} childId={pickKid?.id} single={!!pickKid} onDone={() => { addedRef.current = true; }} onClose={() => closeRoadmapDialog(() => setAddingTpl(null))} />}
      {sel && dialog === "roadmap" &&<AddToRoadmapDialog story={{ storyId: sel.id, title: sel.title, ageBand: sel.ageBand, length: sel.words }} childId={pickKid?.id} single={!!pickKid} targetStage={pickStage} onDone={() => { addedRef.current = true; }} onClose={() => closeRoadmapDialog(() => setDialog(null))} />}
      {sel && dialog === "report" && <ReportDialog story={sel} onClose={() => setDialog(null)} onDone={(m) => { setDialog(null); flash(m); }} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </section>
  );
}
