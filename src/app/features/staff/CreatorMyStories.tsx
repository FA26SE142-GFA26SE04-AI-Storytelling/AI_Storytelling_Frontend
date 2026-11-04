"use client";

import "@/app/features/library/library.css";
import "@/app/features/created/created.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Info, PencilLine, RefreshCw, WandSparkles } from "lucide-react";
import Select from "@/app/components/Select";
import AsidePane, { AsideContext } from "@/app/components/shell/AsidePane";
import Frog from "@/app/components/brand/Frog";
import { creatorService } from "@/app/services/creatorService";
import type { CreatorDraft } from "@/app/types/creator";
import { gradientFor } from "@/app/lib/storyView";
import { fmt } from "./ui";
import { SHELVES, shelfOf } from "./CreatorLibrary";
import type { CreatorPageProps } from "./CreatorStories";

const AGE: Record<string, string> = { "6-8": "6–8 tuổi", "9-10": "9–10 tuổi" };
const MODE: Record<string, string> = { reading: "Đọc", listening: "Nghe", combined: "Đọc và nghe" };
const isAi = (s: CreatorDraft) => s.source?.toLowerCase() === "ai";
const SHORT: Record<string, string> = { draft: "Đang soạn", review: "Đang duyệt", ready: "Sẵn sàng", archived: "Lưu trữ" };
const SOURCES = [{ id: "all", label: "Tất cả" }, { id: "ai", label: "Do AI tạo" }, { id: "manual", label: "Thủ công" }];

/** Trang "Truyện của tôi" của Content Creator: mọi truyện đã tạo (AI và thủ công), lọc theo trạng thái, xem chi tiết rồi mở soạn tiếp. */
export function CreatorMyStories({ go }: Pick<CreatorPageProps, "go">) {
  const [list, setList] = useState<CreatorDraft[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState("all");
  const [source, setSource] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);
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
  const shown = all.filter((s) => (group === "all" || shelfOf(s) === group) && (source === "all" || (source === "ai") === isAi(s)));
  const count = (id: string) => all.filter((s) => shelfOf(s) === id).length;
  const sel = all.find((s) => s.storyId === selected) ?? null;
  const pick = (s: CreatorDraft) => { setSelected(s.storyId); if (collapsed) setCollapsed(false); };
  const open = (s: CreatorDraft) => go(isAi(s) ? "create-ai" : "create-manual", s.storyId);

  return (
    <AsideContext.Provider value={aside}>
      <section className="ws dock lib" data-aside={collapsed ? "collapsed" : undefined}>
        <div className="pane"><div className="lib-scroll created">
          <div className="created-bar">
            <div className="created-pills" role="tablist" aria-label="Lọc theo trạng thái">
              <button role="tab" aria-selected={group === "all"} className={group === "all" ? "on" : ""} onClick={() => setGroup("all")}>Tất cả<em>{all.length}</em></button>
              {SHELVES.map((g) => <button key={g.id} role="tab" aria-selected={group === g.id} className={group === g.id ? "on" : ""} onClick={() => setGroup(g.id)}>{SHORT[g.id] ?? g.title}<em>{count(g.id)}</em></button>)}
            </div>
            <div className="created-actions">
              <Select<string> className="created-select" ariaLabel="Lọc theo nguồn" value={source} options={SOURCES.map((s) => ({ value: s.id, label: s.label }))} onChange={setSource} />
              <button className="btn btn-g" onClick={() => void load()} disabled={loading} aria-label="Tải lại" title="Tải lại"><RefreshCw className="ic" /></button>
              <button className="btn btn-s" onClick={() => go("create-manual")}><PencilLine className="ic" />Thủ công</button>
              <button className="btn btn-p" onClick={() => go("create-ai")}><WandSparkles className="ic" />Dùng AI</button>
            </div>
          </div>

          {error && <p className="notice err" role="alert">{error}</p>}
          {loading && !all.length && <p className="sub" role="status">Đang tải truyện…</p>}

          {shown.length > 0 ? (
            <div className="created-grid">
              {shown.map((s) => {
                const name = s.title || "Truyện chưa đặt tên";
                return (
                  <button className={`bk${selected === s.storyId ? " on" : ""}`} key={s.storyId} onClick={() => pick(s)} aria-pressed={selected === s.storyId} aria-label={`Xem chi tiết truyện ${name}`}>
                    <span className="bk-cover" style={{ background: gradientFor(s.storyId) }}>
                      <span className="pill draft bk-badge">{SHELVES.find((g) => g.id === shelfOf(s))?.title}</span>
                      <span className="bk-name display">{name}</span>
                    </span>
                    <span className="bk-title">{name}</span>
                    <span className="bk-meta">{isAi(s) ? "Do AI tạo" : "Thủ công"} · {AGE[s.ageBand] ?? s.ageBand}</span>
                  </button>
                );
              })}
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
              <div className="cover" style={{ aspectRatio: "16/10", borderRadius: 12, background: gradientFor(sel.storyId) }} />
              <h3 className="display" style={{ fontSize: 20, margin: 0, lineHeight: 1.2 }}>{sel.title || "Truyện chưa đặt tên"}</h3>
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
              </div>
              <button className="btn btn-p btn-c" onClick={() => open(sel)}>{isAi(sel) ? <WandSparkles className="ic" /> : <PencilLine className="ic" />}Mở để soạn tiếp</button>
            </>
          ) : <p className="sub">Chọn một truyện để xem chi tiết.</p>}
        </AsidePane>
      </section>
    </AsideContext.Provider>
  );
}
