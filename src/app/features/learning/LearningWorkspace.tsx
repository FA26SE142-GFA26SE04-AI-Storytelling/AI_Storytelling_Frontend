"use client";

import "@/app/features/library/library.css";
import "@/app/features/children/children.css";
import "@/app/features/roadmap/roadmap.css";
import "./learning.css";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { guardianService } from "@/app/services/guardianService";
import { avatarOf } from "@/app/lib/guardian";
import { useRiseIn } from "@/app/lib/motion";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import type { RoadmapItem } from "@/app/types/progress";
import type { ChildProfile } from "@/app/types/childProfile";
import Frog from "@/app/components/brand/Frog";
import { openChildCreate } from "@/app/features/children/childrenIntent";
import { splitRoadmap, usePendingWishes } from "./learningData";
import { takeLearningBack } from "./learningIntent";
import OverviewTab from "./OverviewTab";
import RoadmapTab from "./RoadmapTab";
import ResultsTab from "./ResultsTab";
import WishesTab from "./WishesTab";

export type LearningTabId = "overview" | "roadmap" | "results" | "wishes";
const TABS: { id: LearningTabId; label: string }[] = [
  { id: "overview", label: "Tổng quan" },
  { id: "roadmap", label: "Lộ trình" },
  { id: "results", label: "Kết quả đọc" },
  { id: "wishes", label: "Điều ước" },
];
const CHILD_STATUS: Record<string, string> = { Draft: "Chưa kích hoạt", Suspended: "Tạm dừng", Archived: "Đã lưu trữ" };

type RoadmapState = { items: RoadmapItem[]; error: string | null };

/**
 * Luồng 4 — "Học tập của bé": mỗi bé một chỗ xem bé đang đọc gì, lộ trình đọc (Luồng 4a),
 * kết quả từng truyện và phần bé kể lại (Luồng 4b, 4c), điều ước bé gửi.
 */
export default function LearningWorkspace({ go }: WorkspaceProps) {
  const { user } = useAuth();
  const { children: kids } = useWorkspaceData();
  const [selId, setSelId] = useState<number | null>(null);
  const [tab, setTab] = useState<LearningTabId>("overview");
  const [roadmaps, setRoadmaps] = useState<Record<number, RoadmapState>>({});
  const child = kids.find((k) => k.id === selId) ?? kids[0] ?? null;
  // Quay về từ Thư viện sau khi thêm truyện: mở lại đúng bé, ở tab Lộ trình.
  useEffect(() => {
    const back = takeLearningBack();
    if (back !== null) { setSelId(back); setTab("roadmap"); }
  }, []);

  const loadRoadmaps = useCallback(async () => {
    const pairs = await Promise.all(kids.map(async (k) => {
      const r = await guardianService.roadmap(k.id);
      return [k.id, { items: r.data ?? [], error: r.success ? null : r.message }] as const;
    }));
    setRoadmaps(Object.fromEntries(pairs));
  }, [kids]);
  useEffect(() => { void loadRoadmaps(); }, [loadRoadmaps]);

  const reloadOne = useCallback(async (id: number) => {
    const r = await guardianService.roadmap(id);
    setRoadmaps((m) => ({ ...m, [id]: { items: r.data ?? [], error: r.success ? null : r.message } }));
  }, []);

  const listRef = useRiseIn<HTMLUListElement>(".rm-kidcard", [kids.length]);
  const bodyRef = useRiseIn<HTMLDivElement>(".lr-card, .lr-tile", [child?.id, tab], { delay: 40, distance: 10 });

  if (!child) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane"><div className="empty"><Frog size={110} mood="think" /><b className="display">Chưa có hồ sơ bé</b><span>Tạo hồ sơ bé để theo dõi việc học.</span><button className="btn btn-p" onClick={() => openChildCreate(go)}>Thêm hồ sơ bé</button></div></div>
      </section>
    );
  }

  return (
    <section className="ws dock lr-page">
      <aside className="pane rm-side" aria-label="Các bé">
        <ul ref={listRef} className="rm-side-list">
          {kids.map((k) => {
            const state = roadmaps[k.id];
            const { done, open, total } = splitRoadmap(state?.items);
            return (
              <li key={k.id}>
                <button className={`rm-kidcard${child.id === k.id ? " on" : ""}`} aria-pressed={child.id === k.id} onClick={() => setSelId(k.id)}>
                  <span className="av" aria-hidden>{avatarOf(k.avatarId).emoji}</span>
                  <span className="grow">
                    <b>{k.nickname}</b>
                    <span className="rm-kidcard-sub">{state === undefined ? "Đang tải…" : open ? `Đang đọc: ${open.title}` : total ? "Đã đọc hết" : "Lộ trình trống"}</span>
                    <span className="rm-mini" aria-hidden><i style={{ width: `${total ? (done.length / total) * 100 : 0}%` }} /></span>
                  </span>
                  <span className="rm-kidcard-n">{done.length}/{total}</span>
                  {k.status !== "Active" && <span className="pill draft">{CHILD_STATUS[k.status] ?? k.status}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <LearningMain key={child.id} child={child} tab={tab} setTab={setTab} bodyRef={bodyRef}
        roadmap={roadmaps[child.id]} canEdit={child.ownerUserId === user?.id}
        onRoadmapChanged={() => void reloadOne(child.id)} go={go} />
    </section>
  );
}

/** Phần bên phải cho một bé: thanh tab và nội dung tab. Tách riêng để đổi bé thì tải lại điều ước của bé đó. */
function LearningMain({ child, tab, setTab, bodyRef, roadmap, canEdit, onRoadmapChanged, go }: {
  child: ChildProfile;
  tab: LearningTabId;
  setTab: (t: LearningTabId) => void;
  bodyRef: React.RefObject<HTMLDivElement | null>;
  roadmap: RoadmapState | undefined;
  canEdit: boolean;
  onRoadmapChanged: () => void;
  go: WorkspaceProps["go"];
}) {
  const wishes = usePendingWishes(child.id);
  const wishCount = wishes.data?.length ?? null;
  return (
    <div className="pane children-main">
      <div className="tabs children-tabs" role="tablist" aria-label={`Học tập của ${child.nickname}`} style={{ "--i": Math.max(0, TABS.findIndex((x) => x.id === tab)), "--n": TABS.length } as React.CSSProperties}>
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === "wishes" && !!wishCount && <span className="lr-badge">{wishCount}</span>}
          </button>
        ))}
      </div>
      <div ref={bodyRef} className="pb children-body">
        <div key={tab} className="tab-pane lr-pane" role="tabpanel">
          {tab === "overview" && <OverviewTab child={child} items={roadmap?.items} wishCount={wishCount} onTab={setTab} />}
          {tab === "roadmap" && <RoadmapTab child={child} items={roadmap?.items} error={roadmap?.error ?? null} canEdit={canEdit} onChanged={onRoadmapChanged} go={go} />}
          {tab === "results" && <ResultsTab child={child} />}
          {tab === "wishes" && <WishesTab child={child} wishes={wishes.data} making={wishes.making} error={wishes.error} canEdit={canEdit} go={go} onChanged={wishes.reload} />}
        </div>
      </div>
    </div>
  );
}
