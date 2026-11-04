"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookCheck, ChartColumn, Eye, RefreshCw, Wallet } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import { creatorStatsService, type CreatorMonthStat, type CreatorStats } from "@/app/services/creatorStatsService";
import { Page } from "./ui";
import type { CreatorPageProps } from "./CreatorStories";

type Metric = "revenue" | "views" | "completedReads";
const METRICS: { id: Metric; label: string; icon: typeof Wallet }[] = [
  { id: "revenue", label: "Doanh thu", icon: Wallet },
  { id: "views", label: "Lượt xem", icon: Eye },
  { id: "completedReads", label: "Đọc xong", icon: BookCheck },
];
const monthLabel = (m: string) => { const [y, mo] = m.split("-"); return `T${Number(mo)}/${y.slice(2)}`; };
const total = (months: CreatorMonthStat[], key: Metric) => months.reduce((s, m) => s + m[key], 0);

/** Trang "Doanh thu và thống kê" của Creator: thẻ tổng và biểu đồ cột theo tháng. Số liệu chỉ lấy từ API, không có dữ liệu mẫu. */
export function CreatorEarnings({ go }: CreatorPageProps) {
  void go;
  const [data, setData] = useState<CreatorStats | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [message, setMessage] = useState("");
  const [metric, setMetric] = useState<Metric>("revenue");

  const load = useCallback(async () => {
    setState("loading"); setMessage("");
    const r = await creatorStatsService.monthly(6);
    if (r.success && r.data && r.data.months.length > 0) { setData(r.data); setState("ready"); return; }
    setData(null);
    // 404 hoặc 405: máy chủ chưa có API thống kê; trường hợp khác là lỗi thật.
    if (r.success || r.status === 404 || r.status === 405) setState("empty");
    else { setState("error"); setMessage(r.message); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const months = data?.months ?? [];
  const money = useMemo(() => new Intl.NumberFormat("vi-VN", { style: "currency", currency: data?.currency || "VND", maximumFractionDigits: 0 }), [data?.currency]);
  const fmtValue = (key: Metric, v: number) => (key === "revenue" ? money.format(v) : v.toLocaleString("vi-VN"));
  const max = Math.max(1, ...months.map((m) => m[metric]));
  const current = METRICS.find((m) => m.id === metric)!;
  const thisMonth = months[months.length - 1];
  const prev = months[months.length - 2];
  const delta = (key: Metric) => (thisMonth && prev && prev[key] > 0 ? Math.round(((thisMonth[key] - prev[key]) / prev[key]) * 100) : null);

  return (
    <Page title="Doanh thu và thống kê" actions={<button className="btn btn-g" onClick={() => void load()} disabled={state === "loading"} aria-label="Tải lại" title="Tải lại"><RefreshCw className="ic" /></button>}>
      {state === "loading" && <p className="sub" role="status">Đang tải thống kê…</p>}
      {state === "error" && <p className="notice err" role="alert">{message || "Không tải được thống kê."}</p>}
      {state === "empty" && (
        <div className="empty">
          <Frog size={110} mood="think" />
          <b className="display">Chưa có dữ liệu thống kê</b>
          <span>Doanh thu và lượt xem truyện của bạn sẽ hiện ở đây theo từng tháng khi hệ thống bắt đầu ghi nhận.</span>
        </div>
      )}
      {state === "ready" && data && (
        <>
          <div className="ce-stats">
            {METRICS.map((m) => {
              const d = delta(m.id); const Icon = m.icon;
              return (
                <button key={m.id} className={`ce-stat${metric === m.id ? " on" : ""}`} onClick={() => setMetric(m.id)} aria-pressed={metric === m.id}>
                  <span className="ce-stat-ic"><Icon aria-hidden /></span>
                  <span className="ce-stat-name">{m.label} tháng này</span>
                  <b>{thisMonth ? fmtValue(m.id, thisMonth[m.id]) : "—"}</b>
                  <span className="ce-stat-sub">{d === null ? `Tổng ${months.length} tháng: ${fmtValue(m.id, total(months, m.id))}` : `${d >= 0 ? "▲" : "▼"} ${Math.abs(d)}% so với tháng trước`}</span>
                </button>
              );
            })}
          </div>

          <section className="st-card ce-chart" aria-label={`Biểu đồ ${current.label} theo tháng`}>
            <h3><ChartColumn className="ic" aria-hidden /> {current.label} theo tháng</h3>
            <div className="ce-bars" role="img" aria-label={months.map((m) => `${monthLabel(m.month)}: ${fmtValue(metric, m[metric])}`).join("; ")}>
              {months.map((m) => (
                <div className="ce-bar" key={m.month}>
                  <span className="ce-bar-val">{fmtValue(metric, m[metric])}</span>
                  <span className="ce-bar-fill" style={{ height: `${Math.max(2, (m[metric] / max) * 100)}%` }} />
                  <span className="ce-bar-month">{monthLabel(m.month)}</span>
                </div>
              ))}
            </div>
          </section>

          {data.topStories.length > 0 && (
            <section className="st-card" aria-label="Truyện nổi bật">
              <h3>Truyện nổi bật</h3>
              <table className="st-table">
                <thead><tr><th>Truyện</th><th>Lượt xem</th><th>Đọc xong</th><th>Doanh thu</th></tr></thead>
                <tbody>{data.topStories.map((s) => <tr key={s.storyId}><td><b>{s.title || "Truyện chưa đặt tên"}</b></td><td>{s.views.toLocaleString("vi-VN")}</td><td>{s.completedReads.toLocaleString("vi-VN")}</td><td>{money.format(s.revenue)}</td></tr>)}</tbody>
              </table>
            </section>
          )}
        </>
      )}
    </Page>
  );
}
