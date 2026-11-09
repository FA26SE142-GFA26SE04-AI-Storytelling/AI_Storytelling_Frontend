"use client";

import "@/app/features/library/library.css";
import "./roadmap.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { guardianService } from "@/app/services/guardianService";
import { roadmapTemplate } from "@/app/services/roadmapAdapters";
import { avatarOf } from "@/app/lib/guardian";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import type * as B from "@/app/types/backendContracts";
import type { RoadmapItem, RoadmapTemplate } from "@/app/types/progress";
import Frog from "@/app/components/brand/Frog";
import { Shelf, ShelfRow } from "@/app/features/library/LibraryWorkspace";
import AddToRoadmapDialog from "./AddToRoadmapDialog";
import RoadmapAlbum from "./RoadmapAlbum";
import { useRoadmapTemplates } from "./roadmapData";
import TemplateDialog from "./TemplateDialog";
import ChildRoadmapDialog from "./ChildRoadmapDialog";

/** Nhóm tuổi của lộ trình mẫu ("6-8") và của hồ sơ bé ("Age_6_8") viết khác nhau; đưa về một dạng để so. */
const band = (v: string) => v.replace(/^Age_/, "").replace("_", "-");

/**
 * Luồng 4a — "Lộ trình của con".
 * Bên trái là thư viện lộ trình mẫu do Moderator soạn, mỗi lộ trình là một album. Bên phải là các bé:
 * bấm một bé để xem lộ trình của bé, bé đã đọc tới đâu, và sắp xếp / gỡ / thêm truyện.
 */
export default function RoadmapWorkspace({ go }: WorkspaceProps) {
  const { user } = useAuth();
  const { children: kids } = useWorkspaceData();
  const { templates, error: loadError } = useRoadmapTemplates();
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [opened, setOpened] = useState<B.RoadmapLibraryItemDto | null>(null);
  const [adding, setAdding] = useState<RoadmapTemplate | null>(null);
  const [kidOpen, setKidOpen] = useState<number | null>(null);
  const [roadmaps, setRoadmaps] = useState<Record<number, RoadmapItem[]>>({});

  const loadKids = useCallback(async () => {
    const pairs = await Promise.all(kids.map(async (k) => [k.id, (await guardianService.roadmap(k.id)).data ?? []] as const));
    setRoadmaps(Object.fromEntries(pairs));
  }, [kids]);
  useEffect(() => { void loadKids(); }, [loadKids]);

  const list = useMemo(() => templates ?? [], [templates]);
  const kidBands = useMemo(() => new Set(kids.map((k) => band(k.ageBand))), [kids]);
  const forKids = list.filter((t) => kidBands.has(band(t.ageBand)));
  const topics = useMemo(() => [...new Set(list.map((t) => t.mainCategory?.displayName).filter((t): t is string => !!t))], [list]);
  const activeTopic = topic && topics.includes(topic) ? topic : topics[0] ?? null;
  const byTopic = list.filter((t) => t.mainCategory?.displayName === activeTopic);
  const needle = q.trim().toLowerCase();
  const results = needle ? list.filter((t) => `${t.name} ${t.description ?? ""}`.toLowerCase().includes(needle)) : [];
  const album = (t: B.RoadmapLibraryItemDto) => <RoadmapAlbum key={t.id} item={t} onOpen={() => setOpened(t)} />;
  const kid = kids.find((k) => k.id === kidOpen) ?? null;

  return (
    <section className="ws dock rm-page">
      <div className="pane">
        <div className="lib-scroll">
          <div className="lbar">
            <label className="lsearch">
              <Search className="ic" aria-hidden />
              <input className="inp grow" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm lộ trình theo tên" aria-label="Tìm lộ trình theo tên" style={{ border: 0, background: "none" }} />
              {q && <button className="btn btn-g icon-only" aria-label="Xoá tìm kiếm" onClick={() => setQ("")}><X className="ic" /></button>}
            </label>
          </div>
          {loadError && <div className="notice err" role="alert" data-inline-notice>{loadError}</div>}
          {templates === null ? <p className="sub lib-empty">Đang tải lộ trình mẫu…</p>
          : list.length === 0 ? (
            <div className="lib-empty">
              <Frog size={90} mood="think" />
              <b className="display">Chưa có lộ trình mẫu nào</b>
              <button className="btn btn-s" onClick={() => go("library")}>Mở thư viện truyện</button>
            </div>
          ) : needle ? (
            <Shelf title="Kết quả" sub={`${results.length} lộ trình`} items={results}>
              {results.length ? <div className="shelf-grid">{results.map(album)}</div> : <p className="sub">Không tìm thấy lộ trình phù hợp.</p>}
            </Shelf>
          ) : (
            <>
              {forKids.length > 0 && (
                <Shelf title="Hợp với các bé" items={forKids}>
                  <ShelfRow>{forKids.map(album)}</ShelfRow>
                </Shelf>
              )}
              {topics.length > 1 && (
                <Shelf title="Theo chủ đề" items={byTopic} pills={topics.map((t) => ({ id: t, label: t }))} pill={activeTopic ?? undefined} onPill={setTopic}>
                  <ShelfRow>{byTopic.map(album)}</ShelfRow>
                </Shelf>
              )}
              <Shelf title="Tất cả lộ trình" items={list}>
                <div className="shelf-grid">{list.map(album)}</div>
              </Shelf>
            </>
          )}
        </div>
      </div>

      <aside className="pane rm-side" aria-label="Các bé">
        <h3 className="display rm-side-h">Các bé</h3>
        {kids.length === 0 ? <p className="sub">Chưa có hồ sơ bé.</p> : (
          <ul className="rm-side-list">
            {kids.map((k) => {
              const items = roadmaps[k.id];
              const done = items?.filter((i) => i.status === "completed").length ?? 0;
              const total = items?.filter((i) => i.status !== "skipped" && i.status !== "removed").length ?? 0;
              const now = items?.find((i) => i.status === "open");
              return (
                <li key={k.id}>
                  <button className={`rm-kidcard${kidOpen === k.id ? " on" : ""}`} onClick={() => setKidOpen(k.id)}>
                    <span className="av" aria-hidden>{avatarOf(k.avatarId).emoji}</span>
                    <span className="grow">
                      <b>{k.nickname}</b>
                      <span className="rm-kidcard-sub">{items === undefined ? "Đang tải…" : now ? `Đang đọc: ${now.title}` : total ? "Đã đọc hết" : "Lộ trình trống"}</span>
                      <span className="rm-mini" aria-hidden><i style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></span>
                    </span>
                    <span className="rm-kidcard-n">{done}/{total}</span>
                    {k.status !== "Active" && <span className="pill draft">{k.status === "Draft" ? "Chưa kích hoạt" : k.status === "Archived" ? "Đã lưu trữ" : "Tạm dừng"}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {opened && <TemplateDialog item={opened} onClose={() => setOpened(null)} onAdd={(d) => { setOpened(null); setAdding(roadmapTemplate(d)); }} />}
      {adding && <AddToRoadmapDialog template={adding} onClose={() => setAdding(null)} onDone={() => void loadKids()} />}
      {kid && <ChildRoadmapDialog child={kid} canEdit={kid.ownerUserId === user?.id} onClose={() => setKidOpen(null)} onChanged={() => void loadKids()} />}
    </section>
  );
}
