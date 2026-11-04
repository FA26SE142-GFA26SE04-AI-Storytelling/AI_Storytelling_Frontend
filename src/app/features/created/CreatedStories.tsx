"use client";

import "@/app/features/library/library.css";
import "./created.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Info, PencilLine, RefreshCw, WandSparkles } from "lucide-react";
import Select from "@/app/components/Select";
import AsidePane, { AsideContext } from "@/app/components/shell/AsidePane";
import Frog from "@/app/components/brand/Frog";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { storyService } from "@/app/services/storyService";
import { parentAuthoringService } from "@/app/services/parentAuthoringService";
import { Preview } from "@/app/features/library/LibraryWorkspace";
import { ageLabel, familyToCard, statusKey, toCard, type StoryCard } from "@/app/lib/storyView";

/** Nhóm trạng thái hiển thị trên trang: gom các trạng thái chi tiết của backend thành vài nhóm dễ hiểu. */
const GROUPS: { id: string; label: string; keys: string[] }[] = [
  { id: "doing", label: "Đang soạn", keys: ["draft", "input_accepted", "generating", "outline_review", "moderation_review", "content_review"] },
  { id: "media", label: "Đang chuẩn bị", keys: ["approved", "media_processing", "media_review"] },
  { id: "done", label: "Đã xong", keys: ["ready", "published"] },
  { id: "other", label: "Bị chặn / lưu trữ", keys: ["blocked", "rejected", "archived"] },
];
const groupOf = (s: StoryCard) => GROUPS.find((g) => g.keys.includes(statusKey(s.raw)))?.id ?? "doing";
const when = (iso: string) => new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const SOURCES = [{ id: "all", label: "Tất cả" }, { id: "ai", label: "Do AI tạo" }, { id: "manual", label: "Thủ công" }];

/** Trang "Truyện đã tạo": mọi truyện phụ huynh đã tạo (AI và thủ công), kể cả bản nháp chưa vào Thư viện. */
export default function CreatedStories({ go }: Pick<WorkspaceProps, "go">) {
  const { user } = useAuth();
  const { children: kids } = useWorkspaceData();
  const [ai, setAi] = useState<StoryCard[]>([]);
  const [manual, setManual] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [group, setGroup] = useState("all");
  const [source, setSource] = useState("all");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const mine: StoryCard[] = [];
    // Truyện AI: lấy từ GET /Story (tối đa 100 truyện mỗi trang) rồi chỉ giữ truyện của chính phụ huynh.
    for (let pageIndex = 1; pageIndex <= 50; pageIndex++) {
      const r = await storyService.getStories({ pageIndex, pageSize: 100, isDescending: true });
      if (!r.success) { setError(r.message); break; }
      const items = r.data?.items ?? [];
      mine.push(...items.filter((s) => s.authorUserId === user?.id).map(toCard));
      if (items.length === 0 || pageIndex * 100 >= (r.data?.totalCount ?? 0)) break;
    }
    // Truyện thủ công không có trong GET /Story nên tải riêng từ GET /parent/stories.
    const family: StoryCard[] = [];
    for (let page = 1; page <= 50; page++) {
      const r = await parentAuthoringService.mine(page, 100);
      if (!r.success) { setError((e) => e || r.message); break; }
      family.push(...(r.data?.items ?? []).map(familyToCard));
      if (!r.data?.hasNextPage) break;
    }
    setAi(mine); setManual(family); setLoading(false);
  }, [user?.id]);
  useEffect(() => { void load(); }, [load]);

  const all = useMemo(() => {
    const seen = new Set(manual.map((s) => s.id));
    return [...manual, ...ai.filter((s) => !seen.has(s.id))].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [ai, manual]);
  const shown = all.filter((s) => (group === "all" || groupOf(s) === group) && (source === "all" || (source === "ai" ? s.fromAi : !!s.family)));
  const count = (id: string) => all.filter((s) => groupOf(s) === id).length;

  // Khung Chi tiết bên phải thu gọn được; mới vào thì thu gọn, bấm vào một truyện sẽ tự mở.
  const [selected, setSelected] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [reading, setReading] = useState(false);
  const aside = useMemo(() => ({ collapsed, toggle: () => setCollapsed((v) => !v) }), [collapsed]);
  const sel = all.find((s) => s.id === selected) ?? null;
  const pick = (s: StoryCard) => { setSelected(s.id); if (collapsed) setCollapsed(false); };
  // Bé mà truyện dành cho: danh sách truyện không trả hồ sơ bé, nên với truyện thủ công lấy từ chi tiết bản nháp (GET /parent/stories/{id}).
  // Truyện AI chưa có API trả hồ sơ bé nên không biết được.
  const [kidOf, setKidOf] = useState<Record<number, number | null>>({});
  useEffect(() => {
    if (!sel?.family || sel.id in kidOf) return;
    let alive = true;
    void parentAuthoringService.get(sel.id).then((r) => { if (alive) setKidOf((m) => ({ ...m, [sel.id]: r.data?.childProfileId ?? null })); });
    return () => { alive = false; };
  }, [sel, kidOf]);
  const kidName = !sel ? "" : !sel.family ? "Chưa có thông tin" : !(sel.id in kidOf) ? "Đang tải…" : kids.find((k) => k.id === kidOf[sel.id])?.nickname ?? "Chưa có thông tin";
  const open = (s: StoryCard) => (s.family ? go("authoring", { storyId: s.id }) : go("studio", { storyId: s.id }));

  return (
    <AsideContext.Provider value={aside}>
    <section className="ws dock lib" data-aside={collapsed ? "collapsed" : undefined}>
      <div className="pane"><div className="lib-scroll created">
        <div className="created-bar">
          <div className="created-pills" role="tablist" aria-label="Lọc theo trạng thái">
            <button role="tab" aria-selected={group === "all"} className={group === "all" ? "on" : ""} onClick={() => setGroup("all")}>Tất cả<em>{all.length}</em></button>
            {GROUPS.map((g) => <button key={g.id} role="tab" aria-selected={group === g.id} className={group === g.id ? "on" : ""} onClick={() => setGroup(g.id)}>{g.label}<em>{count(g.id)}</em></button>)}
          </div>
          <div className="created-actions">
            <Select<string> className="created-select" ariaLabel="Lọc theo nguồn" value={source} options={SOURCES.map((s) => ({ value: s.id, label: s.label }))} onChange={setSource} />
            <button className="btn btn-g" onClick={() => void load()} disabled={loading} aria-label="Tải lại" title="Tải lại"><RefreshCw className="ic" /></button>
            <button className="btn btn-s" onClick={() => go("authoring")}><PencilLine className="ic" />Thủ công</button>
            <button className="btn btn-p" onClick={() => go("studio")}><WandSparkles className="ic" />Dùng AI</button>
          </div>
        </div>

        {error && <p className="notice err" role="alert">{error}</p>}
        {loading && !all.length && <p className="sub" role="status">Đang tải truyện đã tạo…</p>}

        {shown.length > 0 ? (
          <div className="created-grid">
            {shown.map((s) => (
              <button className={`bk${selected === s.id ? " on" : ""}`} key={`${s.family ? "m" : "a"}${s.id}`} onClick={() => pick(s)} aria-pressed={selected === s.id} aria-label={`Xem chi tiết truyện ${s.title}`}>
                <span className="bk-cover" style={{ background: s.gradient }}>
                  <span className={`pill ${s.tone} bk-badge`}>{s.statusLabel}</span>
                  <span className="bk-name display">{s.title}</span>
                </span>
                <span className="bk-title">{s.title}</span>
                <span className="bk-meta">{s.family ? "Thủ công" : "Do AI tạo"} · {ageLabel(s.ageBand)}</span>
              </button>
            ))}
          </div>
        ) : !loading && (
          <div className="empty">
            <Frog size={110} mood="think" />
            <b className="display">{all.length ? "Không có truyện nào ở mục này" : "Bạn chưa tạo truyện nào"}</b>
            <span>{all.length ? "Thử chọn mục khác hoặc xem tất cả." : "Tạo truyện bằng AI hoặc tự viết, truyện sẽ nằm ở đây."}</span>
          </div>
        )}
      </div></div>

      <AsidePane title="Chi tiết" icon={Info}>
        {sel ? (
          <>
            <div className="cover" style={{ aspectRatio: "16/10", borderRadius: 12, background: sel.gradient }} />
            <h3 className="display" style={{ fontSize: 20, margin: 0, lineHeight: 1.2 }}>{sel.title || "Truyện chưa đặt tên"}</h3>
            {sel.raw.description && <p className="sub">{sel.raw.description}</p>}
            <div className="meta">
              <span>Cách tạo</span><b>{sel.family ? "Thủ công" : "Do AI tạo"}</b>
              <span>Dành cho bé</span><b>{kidName}</b>
              <span>Độ tuổi</span><b>{ageLabel(sel.ageBand)}</b>
              <span>Thể loại</span><b>{sel.topic}</b>
              {sel.words > 0 && <><span>Độ dài</span><b>khoảng {sel.words} từ</b></>}
              <span>Tạo lúc</span><b>{when(sel.createdAt)}</b>
              {sel.raw.updatedAt && <><span>Cập nhật</span><b>{when(sel.raw.updatedAt)}</b></>}
              <span>Trạng thái</span><span className={`pill ${sel.tone}`} style={{ width: "fit-content" }}>{sel.statusLabel}</span>
            </div>
            <button className="btn btn-s btn-c" onClick={() => setReading(true)}><Eye className="ic" />Đọc thử như bé thấy</button>
            <button className="btn btn-p btn-c" onClick={() => open(sel)}>{sel.family ? <PencilLine className="ic" /> : <WandSparkles className="ic" />}Mở để soạn tiếp</button>
          </>
        ) : <p className="sub">Chọn một truyện để xem chi tiết.</p>}
      </AsidePane>
      {sel && reading && <Preview story={sel} onClose={() => setReading(false)} />}
    </section>
    </AsideContext.Provider>
  );
}
