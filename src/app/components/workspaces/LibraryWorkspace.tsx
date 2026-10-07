"use client";

import { useMemo, useState } from "react";
import { BookOpen, Folder, Search, Sparkles, Tag, WandSparkles } from "lucide-react";
import { useWorkspaceData } from "../shell/WorkspaceData";
import { ageLabel, type StoryCard } from "../shell/storyView";
import type { WorkspaceId } from "../shell/nav";
import { useRiseIn } from "../../utils/motion";

type Filter = { id: string; label: string; icon: typeof Folder; test: (s: StoryCard) => boolean };

export default function LibraryWorkspace({ go }: { go: (id: WorkspaceId) => void }) {
  const { stories, storiesLoading, error, reload } = useWorkspaceData();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [age, setAge] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);

  const filters = useMemo<Filter[]>(() => {
    const topics = [...new Set(stories.map((s) => s.topic))];
    return [
      { id: "all", label: "Tất cả truyện", icon: Folder, test: () => true },
      { id: "ai", label: "Do AI tạo", icon: Sparkles, test: (s) => s.fromAi },
      { id: "manual", label: "Tự viết", icon: BookOpen, test: (s) => !s.fromAi },
      ...topics.map((t): Filter => ({ id: `t:${t}`, label: t, icon: Tag, test: (s) => s.topic === t })),
    ];
  }, [stories]);

  const ages = useMemo(() => [...new Set(stories.map((s) => s.ageBand))], [stories]);
  const list = useMemo(() => {
    const f = filters.find((x) => x.id === filter) ?? filters[0];
    return stories.filter((s) => f.test(s) && s.title.toLowerCase().includes(q.trim().toLowerCase()) && (age === "all" || s.ageBand === age));
  }, [filters, filter, stories, q, age]);

  const gridRef = useRiseIn<HTMLDivElement>(".card", [list], { delay: 28, distance: 12 });
  const sel = stories.find((s) => s.id === selected) ?? list[0];

  return (
    <section className="ws dock" style={{ gridTemplateColumns: "210px 1fr 290px" }}>
      <div className="pane">
        <div className="ph"><span>Thư viện</span></div>
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
            <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên truyện" style={{ border: 0, background: "none" }} />
          </label>
          <select className="inp" style={{ width: "auto" }} aria-label="Độ tuổi" value={age} onChange={(e) => setAge(e.target.value)}>
            <option value="all">Mọi độ tuổi</option>
            {ages.map((a) => <option key={a} value={a}>{ageLabel(a)}</option>)}
          </select>
          <button className="btn btn-s" onClick={() => void reload()}>Tải lại</button>
        </div>
        {error && <div className="err-banner" role="alert">{error}</div>}
        <div ref={gridRef} className="lgrid">
          {list.map((s) => (
            <button key={s.id} className={`card${sel?.id === s.id ? " on" : ""}`} onClick={() => setSelected(s.id)}>
              <span className="art2 cover" style={{ background: s.gradient }} />
              <span className="bd">
                <h4 className="display">{s.title}</h4>
                <span className="row" style={{ justifyContent: "space-between" }}>
                  <span className="m">{ageLabel(s.ageBand)}</span>
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
                <span>Nguồn</span><b>{sel.fromAi ? "Do AI tạo" : "Tự viết"}</b>
                <span>Độ tuổi</span><b>{ageLabel(sel.ageBand)}</b>
                <span>Chủ đề</span><b>{sel.topic}</b>
                {sel.words > 0 && <><span>Độ dài</span><b>{sel.words} từ</b></>}
                <span>Người tạo</span><b>{sel.by}</b>
                <span>Trạng thái</span><span className={`pill ${sel.tone}`} style={{ width: "fit-content" }}>{sel.statusLabel}</span>
              </div>
              {sel.statusLabel === "Chờ duyệt" && <button className="btn btn-p btn-c" onClick={() => go("review")}><WandSparkles className="ic" />Mở để duyệt</button>}
            </>
          ) : <p className="sub">Chọn một truyện để xem chi tiết.</p>}
        </div>
      </div>
    </section>
  );
}
