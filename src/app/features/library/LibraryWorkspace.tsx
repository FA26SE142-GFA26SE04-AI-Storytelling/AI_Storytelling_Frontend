"use client";

import "./library.css";
import { useEffect, useMemo, useState } from "react";
import { Archive, BookOpen, ChevronLeft, ChevronRight, Eye, Flag, Folder, Route, Search, Send, Sparkles, Tag, WandSparkles, X } from "lucide-react";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { storyService } from "@/app/services/storyService";
import { ageLabel, splitScenes, statusKey, type StoryCard } from "@/app/lib/storyView";
import type { WorkspaceId } from "@/app/components/shell/nav";
import { useRiseIn } from "@/app/lib/motion";
import { ArchiveDialog } from "@/app/features/review/ReviewTools";
import AddToRoadmapDialog from "@/app/features/roadmap/AddToRoadmapDialog";
import { guardianService } from "@/app/services/guardianService";
import type { CommunitySubmission, ContentReport } from "@/app/types/progress";
import { useMyRole } from "@/app/features/children/useMyRole";
import { CommunityDialog, ReportDialog } from "./ModerationDialogs";

const SUB_STATUS: Record<string, string> = { pending: "Đang chờ duyệt", approved: "Đã có trong thư viện cộng đồng", rejected: "Bị từ chối — có thể nộp lại", withdrawn: "Đã rút", removed: "Đã gỡ" };

type Filter = { id: string; label: string; icon: typeof Folder; test: (s: StoryCard) => boolean };

/** Luồng 2 mục 6.9 — nhóm trạng thái hiển thị cho phụ huynh. */
const STATUS_GROUPS: { id: string; label: string; keys: string[] }[] = [
  { id: "draft", label: "Nháp", keys: ["draft"] },
  { id: "generating", label: "Đang sinh", keys: ["input_accepted", "generating"] },
  { id: "outline", label: "Chờ duyệt dàn ý", keys: ["outline_review"] },
  { id: "moderation", label: "Đang kiểm duyệt an toàn", keys: ["moderation_review"] },
  { id: "review", label: "Chờ duyệt", keys: ["content_review"] },
  { id: "media", label: "Đang chuẩn bị media", keys: ["approved", "media_processing"] },
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
      const dto = r.data;
      const fromPages = dto?.pages?.slice().sort((a, b) => a.pageNumber - b.pageNumber).map((p) => p.content) ?? [];
      setPages(fromPages.length ? fromPages : splitScenes(dto?.content ?? story.raw.content ?? ""));
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

export default function LibraryWorkspace({ go }: { go: (id: WorkspaceId) => void }) {
  const { stories, storiesLoading, error, reload, child } = useWorkspaceData();
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [dialog, setDialog] = useState<"preview" | "archive" | "roadmap" | "report" | "community" | null>(null);
  const [mod, setMod] = useState<{ reports: ContentReport[]; submission: CommunitySubmission | null } | null>(null);
  const role = useMyRole(child);
  const [toast, setToast] = useState("");

  const filters = useMemo<Filter[]>(() => {
    const topics = [...new Set(stories.map((s) => s.topic))];
    return [
      { id: "all", label: "Tất cả truyện", icon: Folder, test: () => true },
      { id: "ai", label: "Do AI tạo", icon: Sparkles, test: (s) => s.fromAi },
      { id: "manual", label: "Nhập sẵn / tự viết", icon: BookOpen, test: (s) => !s.fromAi },
      ...topics.map((t): Filter => ({ id: `t:${t}`, label: t, icon: Tag, test: (s) => s.topic === t })),
    ];
  }, [stories]);

  const counts = useMemo(() => Object.fromEntries(STATUS_GROUPS.map((g) => [g.id, stories.filter((s) => statusOf(s) === g.id).length])), [stories]);

  const list = useMemo(() => {
    const f = filters.find((x) => x.id === filter) ?? filters[0];
    const needle = q.trim().toLowerCase();
    return stories.filter((s) => f.test(s) && (status === "all" || statusOf(s) === status) && s.title.toLowerCase().includes(needle));
  }, [filters, filter, stories, q, status]);

  const gridRef = useRiseIn<HTMLDivElement>(".card", [list], { delay: 28, distance: 12 });
  const sel = stories.find((s) => s.id === selected) ?? list[0];
  const selStatus = sel ? statusOf(sel) : null;
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3200); };
  const loadMod = async () => { if (sel) setMod((await guardianService.storyModeration(sel.id)).data); };
  useEffect(() => {
    setMod(null);
    if (sel && statusOf(sel) === "ready") void guardianService.storyModeration(sel.id).then((r) => setMod(r.data));
  }, [sel]);

  return (
    <section className="ws dock" style={{ gridTemplateColumns: "210px 1fr 290px" }}>
      <div className="pane">
        <div className="ph"><span>Truyện của {child?.nickname ?? "bé"}</span></div>
        <div className="pb" style={{ gap: 0 }}>
          <div className="tree">
            {filters.map((f, i) => (
              <div key={f.id} style={{ display: "contents" }}>
                {i === 3 && <div className="h">Chủ đề</div>}
                <button className={filter === f.id ? "on" : ""} onClick={() => setFilter(f.id)}>
                  <f.icon className="ic" />{f.label}{i < 3 && <em>{stories.filter(f.test).length}</em>}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pane">
        <div className="lbar">
          <label className="row grow" style={{ gap: 6, color: "var(--muted)" }}>
            <Search className="ic" />
            <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên truyện" style={{ border: 0, background: "none" }} aria-label="Tìm theo tên truyện" />
          </label>
          <select className="inp" style={{ width: "auto" }} aria-label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Mọi trạng thái</option>
            {STATUS_GROUPS.filter((g) => counts[g.id] > 0 || g.id === status).map((g) => <option key={g.id} value={g.id}>{g.label} ({counts[g.id]})</option>)}
          </select>
          <button className="btn btn-s" onClick={() => void reload()}>Tải lại</button>
        </div>
        {error && <div className="err-banner" role="alert">{error}</div>}
        <div ref={gridRef} className="lgrid">
          {list.map((s) => (
            <button key={s.id} className={`card${sel?.id === s.id ? " on" : ""}`} onClick={() => setSelected(s.id)}>
              <span className="card-cover cover" style={{ background: s.gradient }} />
              <span className="bd">
                <h4 className="display">{s.title}</h4>
                <span className="row" style={{ justifyContent: "space-between" }}>
                  <span className="m">{s.fromAi ? "AI" : "Nhập sẵn"} · {ageLabel(s.ageBand)}</span>
                  <span className={`pill ${s.tone}`}>{s.statusLabel}</span>
                </span>
              </span>
            </button>
          ))}
          {!storiesLoading && list.length === 0 && <p className="sub" style={{ gridColumn: "1/-1", padding: 24 }}>{stories.length === 0 ? "Chưa có truyện nào. Hãy tạo truyện đầu tiên trong Studio." : "Không tìm thấy truyện phù hợp."}</p>}
          {storiesLoading && <p className="sub" style={{ gridColumn: "1/-1", padding: 24 }}>Đang tải truyện…</p>}
        </div>
      </div>

      <div className="pane">
        <div className="ph"><span>Chi tiết</span></div>
        <div className="pb">
          {sel ? (
            <>
              <div className="cover" style={{ aspectRatio: "16/10", borderRadius: 12, background: sel.gradient }} />
              <h3 className="display" style={{ fontSize: 20, margin: 0, lineHeight: 1.2 }}>{sel.title}</h3>
              {sel.raw.synopsis && <p className="sub">{sel.raw.synopsis}</p>}
              <div className="meta">
                <span>Nguồn</span><b>{sel.fromAi ? "Do AI tạo" : "Nhập sẵn / tự viết"}</b>
                <span>Độ tuổi</span><b>{ageLabel(sel.ageBand)}</b>
                <span>Chủ đề</span><b>{sel.topic}</b>
                {sel.raw.moralLesson && <><span>Bài học</span><b>{sel.raw.moralLesson}</b></>}
                {sel.words > 0 && <><span>Độ dài</span><b>{sel.words.toLocaleString("vi-VN")} tiếng</b></>}
                <span>Người tạo</span><b>{sel.by}</b>
                <span>Trạng thái</span><span className={`pill ${sel.tone}`} style={{ width: "fit-content" }}>{sel.statusLabel}</span>
              </div>
              {selStatus === "review" && <button className="btn btn-p btn-c" onClick={() => go("review")}><WandSparkles className="ic" />Mở để duyệt</button>}
              {(selStatus === "generating" || selStatus === "outline") && <button className="btn btn-p btn-c" onClick={() => go("studio")}><WandSparkles className="ic" />Tiếp tục trong Studio</button>}
              {selStatus === "moderation" && <p className="sub">Truyện đang chờ kiểm duyệt viên xem, thường trong 24 giờ.</p>}
              {selStatus === "ready" && role?.can("AssignActivity") && <button className="btn btn-p btn-c" onClick={() => setDialog("roadmap")}><Route className="ic" />Thêm vào lộ trình của con</button>}
              {selStatus === "ready" && mod?.submission && <p className="sub">Thư viện cộng đồng: {SUB_STATUS[mod.submission.status] ?? mod.submission.status}</p>}
              {selStatus === "ready" && mod?.submission && (mod.submission.status === "pending" || mod.submission.status === "approved") && role?.can("ApproveStory") && (
                <button className="btn btn-s btn-c" onClick={() => void guardianService.withdrawCommunity(mod.submission!.id).then((r) => { flash(r.success ? r.message : r.message); void loadMod(); })}>{mod.submission.status === "pending" ? "Rút yêu cầu" : "Gỡ khỏi thư viện cộng đồng"}</button>
              )}
              {selStatus === "ready" && role?.can("ApproveStory") && !(mod?.submission && ["pending", "approved"].includes(mod.submission.status)) && (
                <button className="btn btn-s btn-c" disabled={!!mod?.reports.some((r) => r.status === "pending")} title={mod?.reports.some((r) => r.status === "pending") ? "Truyện đang có báo cáo chờ xử lý" : undefined} onClick={() => setDialog("community")}><Send className="ic" />Nộp thư viện cộng đồng</button>
              )}
              {selStatus === "ready" && <button className="btn btn-g btn-c" onClick={() => setDialog("report")}><Flag className="ic" />Báo cáo nội dung</button>}
              {mod?.reports.some((r) => r.status === "pending") && <p className="sub">Đã có báo cáo đang chờ kiểm duyệt viên xử lý.</p>}
              {selStatus !== "archived" && <button className="btn btn-s btn-c" onClick={() => setDialog("preview")}><Eye className="ic" />Xem trước như bé thấy</button>}
              {selStatus !== "archived" && <button className="btn btn-no btn-c" onClick={() => setDialog("archive")}><Archive className="ic" />Lưu trữ</button>}
            </>
          ) : <p className="sub">Chọn một truyện để xem chi tiết.</p>}
        </div>
      </div>
      {sel && dialog === "preview" && <Preview story={sel} onClose={() => setDialog(null)} />}
      {sel && dialog === "roadmap" && <AddToRoadmapDialog story={{ storyId: sel.id, title: sel.title, ageBand: sel.ageBand, length: sel.words }} onClose={() => setDialog(null)} />}
      {sel && dialog === "report" && <ReportDialog story={sel} onClose={() => setDialog(null)} onDone={(m) => { setDialog(null); flash(m); void loadMod(); }} />}
      {sel && dialog === "community" && <CommunityDialog story={sel} nickname={child?.nickname ?? ""} onClose={() => setDialog(null)} onDone={(m) => { setDialog(null); flash(m); void loadMod(); }} />}
      {sel && dialog === "archive" && <ArchiveDialog storyId={sel.id} onClose={() => setDialog(null)} onDone={(msg) => { setDialog(null); setToast(msg); void reload(); setTimeout(() => setToast(""), 3000); }} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </section>
  );
}
