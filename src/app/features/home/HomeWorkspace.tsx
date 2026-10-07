"use client";

import "./home.css";
import { useMemo } from "react";
import { Eye, Sparkles, WandSparkles } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import Frog from "@/app/components/brand/Frog";
import HeroPond from "@/app/components/brand/HeroPond";
import { ageLabel } from "@/app/lib/storyView";
import type { WorkspaceId } from "@/app/components/shell/nav";
import { useRiseIn, useGrowBars } from "@/app/lib/motion";

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function HomeWorkspace({ go, onKid }: { go: (id: WorkspaceId) => void; onKid: () => void }) {
  const { user } = useAuth();
  const { children: kids, child, selectChild, stories, storiesLoading, error, reviewQueue } = useWorkspaceData();

  const rootRef = useRiseIn<HTMLElement>(".cont, .stats3 > div, .mini-item, .reco", [child?.id, stories.length]);
  const barsRef = useGrowBars<HTMLDivElement>(".bar i", [child?.id, stories.length]);

  const published = stories.filter((s) => s.tone === "ok");
  const readable = published[0];
  const unfinished = stories.find((s) => s.tone !== "ok");

  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return { d, label: DAYS[d.getDay()], v: 0 };
    });
    for (const s of stories) {
      const t = new Date(s.createdAt);
      t.setHours(0, 0, 0, 0);
      const slot = days.find((x) => x.d.getTime() === t.getTime());
      if (slot) slot.v += 1;
    }
    return days;
  }, [stories]);
  const max = Math.max(1, ...week.map((w) => w.v));

  if (!child) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane"><div className="empty"><Frog size={110} mood="think" /><b className="display">Chưa có hồ sơ bé</b><span>Tạo hồ sơ bé để bắt đầu tạo truyện. Bạn có thể tạo hồ sơ từ ứng dụng quản trị phụ huynh.</span></div></div>
      </section>
    );
  }

  return (
    <section ref={rootRef} className="ws dock" style={{ gridTemplateColumns: "1fr 320px" }}>
      <div className="pane">
        <div className="ph">
          <span>Tổng quan</span>
          {kids.length > 1 && (
            <div className="act">
              <div className="seg" style={{ minWidth: 200 }}>
                {kids.slice(0, 4).map((k) => <button key={k.id} className={k.id === child.id ? "on" : ""} onClick={() => selectChild(k.id)}>{k.nickname}</button>)}
              </div>
            </div>
          )}
        </div>
        {error && <div className="err-banner" role="alert">{error}</div>}

        <div className="home-body">
          <header className="hero">
            <div>
            <h1 className="display home-h1">Chào {user?.fullName?.split(" ").slice(-1)[0] || "bạn"}</h1>
            <p className="sub" style={{ fontSize: 14, marginTop: 4 }}>
              {storiesLoading ? "Đang tải truyện…" : `${child.nickname} (${ageLabel(child.ageBand)}) có ${stories.length} truyện, ${published.length} truyện đã sẵn sàng để đọc.`}
            </p>
          </div>
            <HeroPond />
          </header>

          <div className="continue">
            <button className="cont" onClick={onKid} disabled={!readable}>
              <span className="thumb cover" style={{ background: readable?.gradient ?? "var(--surface-2)" }} />
              <span className="grow">
                <small>Cho {child.nickname} đọc</small>
                <b className="display">{readable?.title ?? "Chưa có truyện sẵn sàng"}</b>
                <small>{readable ? readable.statusLabel : "Hãy tạo truyện đầu tiên trong Studio"}</small>
              </span>
              <span className="go"><Eye className="ic" /></span>
            </button>
            <button className="cont" onClick={() => go("studio")}>
              <span className="thumb cover" style={{ background: unfinished?.gradient ?? "var(--surface-2)" }} />
              <span className="grow">
                <small>{unfinished ? "Truyện đang làm dở" : "Bắt đầu mới"}</small>
                <b className="display">{unfinished?.title ?? "Tạo truyện mới"}</b>
                <small>{unfinished?.statusLabel ?? "Mô tả ý tưởng, AI sẽ viết cùng bạn"}</small>
              </span>
              <span className="go"><WandSparkles className="ic" /></span>
            </button>
          </div>

          <div className="stats3">
            <div><b className="display">{stories.length}</b><small>truyện của {child.nickname}</small></div>
            <div><b className="display">{published.length}</b><small>đã duyệt, sẵn sàng đọc</small></div>
            <div><b className="display" style={{ color: "var(--warn-ink)" }}>{reviewQueue.length}</b><small>đang chờ bạn duyệt</small></div>
          </div>

          <div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 13.5 }}>Truyện được tạo trong 7 ngày qua</h3>
              <span className="sub">truyện</span>
            </div>
            <div ref={barsRef} className="bars">
              {week.map((w, i) => (
                <div key={w.d.getTime()} className={`bar${i === week.length - 1 ? " today" : ""}`}>
                  <em>{w.v}</em>
                  <i data-h={`${(w.v / max) * 100}%`} style={{ height: `${(w.v / max) * 100}%`, minHeight: w.v ? 4 : 2 }} />
                  <small>{w.label}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pane">
        <div className="ph"><span>Việc cần làm</span><div className="act"><span className="pill wait">{reviewQueue.length} truyện chờ duyệt</span></div></div>
        <div className="pb">
          <div className="sec" style={{ gap: 7 }}>
            {reviewQueue.length === 0 && <p className="sub">Không có truyện nào đang chờ duyệt.</p>}
            {reviewQueue.map((s) => (
              <button key={s.id} className="mini-item" onClick={() => go("review")}>
                <span className="cover-sm" style={{ background: s.gradient }} />
                <span className="grow" style={{ textAlign: "left" }}><b>{s.title}</b><small>{s.by} · {ageLabel(s.ageBand)}</small></span>
              </button>
            ))}
          </div>
          <div className="reco">
            <b className="row"><Sparkles className="ic" style={{ color: "var(--primary)" }} />Tạo truyện cho {child.nickname}</b>
            <p>AI viết trong khuôn khổ chính sách an toàn của {child.nickname}, và mọi truyện đều qua bước duyệt của bạn.</p>
            <button className="btn btn-p" onClick={() => go("studio")}>Tạo trong Studio</button>
          </div>
        </div>
      </div>
    </section>
  );
}
