"use client";

import "./report.css";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { ageLabel } from "@/app/lib/storyView";
import { useRiseIn, useDrawDonut } from "@/app/lib/motion";

const SLICES = [
  { key: "ok", label: "Đã duyệt / sẵn sàng", color: "var(--mint)" },
  { key: "wait", label: "Đang chờ duyệt", color: "var(--gold)" },
  { key: "draft", label: "Nháp / lưu trữ / từ chối", color: "var(--faint)" },
] as const;

export default function ReportWorkspace() {
  const { stories, child, error } = useWorkspaceData();
  const rootRef = useRiseIn<HTMLElement>(".kpi, tbody tr", [stories.length], { delay: 35, distance: 10 });
  const donutRef = useDrawDonut<SVGSVGElement>([stories.length]);
  const ai = stories.filter((s) => s.fromAi);
  const count = (tone: string) => stories.filter((s) => s.tone === tone).length;
  const approvedRate = stories.length ? Math.round((count("ok") / stories.length) * 100) : 0;
  const total = Math.max(1, stories.length);
  let acc = 0;

  const kpis = [
    { l: "Tổng số truyện", v: String(stories.length), d: child ? `của ${child.nickname}` : "" },
    { l: "Do AI tạo", v: String(ai.length), d: `${stories.length ? Math.round((ai.length / stories.length) * 100) : 0}% tổng số` },
    { l: "Đã duyệt", v: String(count("ok")), d: `${approvedRate}% tổng số`, c: "var(--ok-ink)" },
    { l: "Đang chờ duyệt", v: String(count("wait")), d: "cần bạn xem", c: "var(--warn-ink)" },
    { l: "Nháp / lưu trữ", v: String(count("draft")), d: "chưa đến tay bé", muted: true },
  ];

  return (
    <section ref={rootRef} className="ws dock report">
      <div className="kpi-row">
        {kpis.map((k) => (
          <div key={k.l} className="kpi">
            <small>{k.l}</small>
            <b className="display" style={{ color: k.c }}>{k.v}</b>
            <span className="d" style={k.muted ? { color: "var(--muted)" } : undefined}>{k.d}</span>
          </div>
        ))}
      </div>
      {error && <div className="err-banner" style={{ gridColumn: "1/-1" }} role="alert">{error}</div>}

      <div className="pane" style={{ gridColumn: "1/-1" }}>
        <div className="ph"><span>Trạng thái truyện</span><span className="sub" style={{ fontWeight: 400 }}>{stories.length} truyện</span></div>
        <div className="pb" style={{ flexDirection: "row", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
          <svg ref={donutRef} width="130" height="130" viewBox="0 0 42 42" style={{ transform: "rotate(-90deg)" }} role="img" aria-label="Biểu đồ tròn trạng thái truyện">
            <circle cx="21" cy="21" r="15.9" fill="none" style={{ stroke: "var(--line)" }} strokeWidth="6" />
            {SLICES.map((s) => {
              const len = (count(s.key) / total) * 100;
              const el = len > 0 ? <circle key={s.key} cx="21" cy="21" r="15.9" fill="none" style={{ stroke: s.color }} strokeWidth="6" data-d={`${Math.max(len - 1, 0.1)} ${101 - len}`} strokeDasharray={`${Math.max(len - 1, 0.1)} ${101 - len}`} strokeDashoffset={-acc} /> : null;
              acc += len;
              return el;
            })}
          </svg>
          <div className="dl grow" style={{ maxWidth: 360 }}>
            {SLICES.map((s) => <div key={s.key}><i style={{ background: s.color }} />{s.label}<b>{count(s.key)}</b></div>)}
          </div>
        </div>
      </div>

      <div className="pane" style={{ gridColumn: "1/-1" }}>
        <div className="ph"><span>Nhật ký truyện gần đây</span><span className="sub" style={{ fontWeight: 400 }}>Dữ liệu từ danh sách truyện của bé</span></div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>Ngày tạo</th><th>Tên truyện</th><th>Nguồn</th><th>Độ tuổi</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {stories.slice(0, 12).map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>{s.title}</td>
                  <td>{s.fromAi ? "AI" : "Tự viết"}</td>
                  <td>{ageLabel(s.ageBand)}</td>
                  <td><span className={`pill ${s.tone}`}>{s.statusLabel}</span></td>
                </tr>
              ))}
              {stories.length === 0 && <tr><td colSpan={5} className="sub">Chưa có dữ liệu.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
