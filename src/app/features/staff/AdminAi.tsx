"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Play } from "lucide-react";
import { staffService, downloadBlob } from "@/app/services/staffService";
import type { AiMetrics, EvaluationPrompt, EvaluationRun, GenerationJobLog, PromptCatalogVersion } from "@/app/types/staff";
import { Notice, Page, fmt, useAction } from "./ui";

const Kpi = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="st-kpi"><small>{label}</small><b>{value}</b>{hint && <small>{hint}</small>}</div>
);
const pct = (n: number) => `${n.toLocaleString("vi-VN")}%`;

/** Luồng 5 Bước 5.2 — chỉ số chất lượng AI (chỉ thống kê, không định danh truyện hay bé). */
export function AdminOverview() {
  const [m, setM] = useState<AiMetrics | null>(null);
  useEffect(() => { void staffService.metrics().then((r) => setM(r.data)); }, []);
  return (
    <Page title="Chất lượng AI" sub="Số liệu tổng hợp theo kỳ, không gắn với truyện hay hồ sơ bé cụ thể.">
      {!m ? <p className="sub">Đang tải…</p> : (
        <>
          <div className="st-grid">
            <Kpi label="Sinh truyện thành công" value={pct(m.generationSuccessRate)} />
            <Kpi label="Bị chặn bởi quy tắc" value={pct(m.ruleBlockRate)} />
            <Kpi label="Bị mô hình gắn cờ vùng xám" value={pct(m.modelFlagRate)} />
            <Kpi label="Vùng xám được Moderator cho qua" value={pct(m.grayZoneClearRate)} hint="Cao = mô hình quá nhạy" />
            <Kpi label="Phải sinh lại (refine)" value={pct(m.regenerationRate)} />
            <Kpi label="Truyện nhập phải AI Adapt" value={pct(m.adaptationRate)} />
            <Kpi label="Phụ huynh duyệt" value={pct(m.approvalRate)} />
            <Kpi label="Bị từ chối" value={pct(m.rejectionRate)} />
            <Kpi label="Nhãn AI bị Moderator sửa" value={pct(m.tagCorrectionRate)} />
            <Kpi label="Điều ước được chấp nhận" value={pct(m.wishAcceptanceRate)} />
            <Kpi label="Token trung bình / truyện" value={m.avgTokensPerStory.toLocaleString("vi-VN")} />
            <Kpi label="Thời gian sinh trung bình" value={`${(m.avgLatencyMs / 1000).toFixed(1)} giây`} />
            <Kpi label="Thời gian kiểm duyệt trung bình" value={`${m.avgModerationHours} giờ`} />
            <Kpi label="Mục kiểm duyệt quá hạn" value={String(m.overdueModeration)} />
          </div>
          <div className="st-card">
            <h3>Trượt kiểm tra bám ngữ cảnh (Context Fidelity)</h3>
            {Object.entries(m.fidelityFailRate).map(([k, v]) => (
              <div key={k} className="row"><span style={{ width: 230, fontSize: 13 }}>{({ F1: "F1 Bám dàn ý", F2: "F2 Đúng bài học", F3: "F3 Hành vi an toàn", F4: "F4 Phù hợp văn hoá", F5: "F5 Nhất quán" } as Record<string, string>)[k]}</span><div className="st-bar grow"><i style={{ width: `${Math.min(100, v * 5)}%` }} /></div><small>{pct(v)}</small></div>
            ))}
          </div>
          <div className="st-card">
            <h3>Phụ huynh hay nhờ AI sửa gì</h3>
            {Object.entries(m.revisionRateByIntent).map(([k, v]) => (
              <div key={k} className="row"><span style={{ width: 230, fontSize: 13 }}>{({ simplify: "Đơn giản hơn", shorten: "Ngắn hơn", less_scary: "Bớt đáng sợ", more_dialogue: "Thêm hội thoại", emphasize_lesson: "Nhấn mạnh bài học", age_fit: "Phù hợp lứa tuổi" } as Record<string, string>)[k] ?? k}</span><div className="st-bar grow"><i style={{ width: `${v}%` }} /></div><small>{pct(v)}</small></div>
            ))}
          </div>
        </>
      )}
      {staffService.isLocal() && <p className="sub">Số liệu mẫu (máy chủ chưa có API chỉ số AI).</p>}
    </Page>
  );
}

const SOURCE: Record<string, string> = { parent: "Phụ huynh", content_creator: "Content Creator", evaluation: "Đánh giá AI" };
const ZONE: Record<string, [string, string]> = { safe: ["ok", "An toàn"], gray: ["wait", "Vùng xám"], blocked: ["flag", "Bị chặn"] };

/** Luồng 5 Bước 5.2b — nhật ký sinh truyện: chỉ mã job, không biệt danh bé hay email; xem nội dung truyện riêng phải ghi lý do. */
export function AdminLogs() {
  const [jobs, setJobs] = useState<GenerationJobLog[]>([]);
  const [source, setSource] = useState("all");
  const [zone, setZone] = useState("all");
  const [sel, setSel] = useState<number | null>(null);
  const [investigate, setInvestigate] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { void staffService.jobs().then((r) => setJobs(r.data ?? [])); }, []);
  const list = useMemo(() => jobs.filter((j) => (source === "all" || j.source === source) && (zone === "all" || j.moderationZone === zone)), [jobs, source, zone]);
  const cur = jobs.find((j) => j.jobId === sel);

  const exportCsv = () => {
    const rows = [["job_id", "thoi_diem", "nguon", "stage", "refine", "vung", "token", "ms", "ket_qua", "prompt_version"], ...list.map((j) => [j.jobId, j.at, j.source, j.stage, j.refineCount, j.moderationZone, j.totalTokens, j.durationMs, j.result, j.promptVersion])];
    downloadBlob(new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }), "nhat-ky-sinh-truyen.csv");
  };

  return (
    <Page title="Nhật ký sinh truyện" sub="Mỗi lời gọi AI ghi số token, thời gian, trạng thái; không lưu nguyên văn prompt hay câu trả lời. Nhật ký giữ 90 ngày."
      actions={<button className="btn btn-s" onClick={exportCsv}><Download className="ic" />Xuất CSV</button>}>
      <div className="row">
        <select className="inp" style={{ width: "auto" }} value={source} onChange={(e) => setSource(e.target.value)} aria-label="Nguồn"><option value="all">Mọi nguồn</option>{Object.entries(SOURCE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className="inp" style={{ width: "auto" }} value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Vùng kiểm duyệt"><option value="all">Mọi kết quả kiểm duyệt</option>{Object.entries(ZONE).map(([k, v]) => <option key={k} value={k}>{v[1]}</option>)}</select>
      </div>
      <div className="st-card st-scroll">
        <table className="st-table">
          <thead><tr><th>Job</th><th>Thời điểm</th><th>Nguồn</th><th>Bước cuối</th><th>Refine</th><th>Kiểm duyệt</th><th>Token</th><th>Thời gian</th><th>Prompt</th></tr></thead>
          <tbody>
            {list.map((j) => (
              <tr key={j.jobId} className={sel === j.jobId ? "on" : ""} onClick={() => { setSel(j.jobId); setMsg(null); setInvestigate(""); }} style={{ cursor: "pointer" }}>
                <td>#{j.jobId}</td><td>{fmt(j.at)}</td><td>{SOURCE[j.source]}</td><td>{j.stage}</td><td>{j.refineCount}</td>
                <td><span className={`pill ${ZONE[j.moderationZone][0]}`}>{ZONE[j.moderationZone][1]}</span></td>
                <td>{j.totalTokens.toLocaleString("vi-VN")}</td><td>{(j.durationMs / 1000).toFixed(1)}s</td><td>{j.promptVersion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cur && (
        <div className="st-card">
          <h3>Job #{cur.jobId} — các lời gọi AI</h3>
          <table className="st-table">
            <thead><tr><th>Loại</th><th>Mô hình</th><th>Token</th><th>Thời gian</th><th>Trạng thái</th></tr></thead>
            <tbody>{cur.calls.map((c, i) => <tr key={i}><td>{c.callType}</td><td>{c.model}</td><td>{c.tokens.toLocaleString("vi-VN")}</td><td>{(c.latencyMs / 1000).toFixed(1)}s</td><td>{c.status}</td></tr>)}</tbody>
          </table>
          {cur.source === "parent" && (
            <div className="row">
              <input className="inp" value={investigate} onChange={(e) => setInvestigate(e.target.value)} placeholder="Lý do điều tra sự cố (bắt buộc, được ghi nhật ký kiểm toán)" aria-label="Lý do điều tra" />
              <button className="btn btn-s" disabled={!investigate.trim()} onClick={() => setMsg("Đã ghi nhật ký kiểm toán. Nội dung truyện riêng chỉ xem được khi máy chủ hỗ trợ API điều tra sự cố.")}>Điều tra sự cố</button>
            </div>
          )}
          {msg && <p className="sub">{msg}</p>}
        </div>
      )}
    </Page>
  );
}

const CASE_LABEL: Record<string, string> = { normal: "Thông thường", edge: "Biên", adversarial: "Tấn công" };

/** Luồng 5 Bước 5.10 — chạy bộ đánh giá trên một phiên bản Prompt Catalog (sandbox) và xem kết quả. */
export function AdminEvaluation() {
  const [versions, setVersions] = useState<PromptCatalogVersion[]>([]);
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [prompts, setPrompts] = useState<EvaluationPrompt[]>([]);
  const [versionId, setVersionId] = useState<number | null>(null);
  const load = useCallback(async () => {
    const [v, r, p] = await Promise.all([staffService.versions(), staffService.runs(), staffService.prompts()]);
    setVersions(v.data ?? []);
    setRuns(r.data ?? []);
    setPrompts(p.data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);
  const caseOf = (id: number) => prompts.find((p) => p.id === id)?.caseType ?? "normal";

  return (
    <Page title="Đánh giá AI" sub="Chạy pipeline sinh truyện ở chế độ thử nghiệm: không tạo truyện cho ai, không vào hàng đợi kiểm duyệt. Không được dùng phiên bản Prompt Catalog mới nếu còn case tấn công lọt qua hoặc điểm an toàn giảm.">
      <Notice note={note} />
      <div className="row">
        <select className="inp" style={{ width: "auto" }} value={versionId ?? versions[0]?.id ?? ""} onChange={(e) => setVersionId(+e.target.value)} aria-label="Phiên bản">
          {versions.map((v) => <option key={v.id} value={v.id}>{v.version} ({v.status === "published" ? "đang dùng" : v.status === "draft" ? "nháp" : v.status})</option>)}
        </select>
        <button className="btn btn-p" disabled={busy || !versions.length} onClick={() => void run(() => staffService.runEvaluation(versionId ?? versions[0].id))}><Play className="ic" />Chạy bộ đánh giá</button>
      </div>
      {runs.map((r) => {
        const by = (t: string) => r.results.filter((x) => caseOf(x.promptId) === t);
        const rated = r.results.filter((x) => x.rating);
        const avg = (k: "safety" | "ageFit" | "educational" | "coherence") => (rated.length ? (rated.reduce((n, x) => n + x.rating![k], 0) / rated.length).toFixed(1) : "—");
        return (
          <div key={r.id} className="st-card">
            <h3>Lượt #{r.id} · {r.catalogVersion} · {fmt(r.startedAt)}</h3>
            <div className="st-grid">
              {(["normal", "edge", "adversarial"] as const).map((t) => {
                const list = by(t);
                return <Kpi key={t} label={`${CASE_LABEL[t]}: đúng kỳ vọng`} value={`${list.filter((x) => x.matched).length}/${list.length}`} hint={t === "adversarial" && list.some((x) => !x.matched) ? "Có case lọt qua!" : undefined} />;
              })}
              <Kpi label="Đạt độ khó" value={`${r.results.filter((x) => x.readabilityPass).length}/${r.results.length}`} />
              <Kpi label="Token trung bình" value={Math.round(r.results.reduce((n, x) => n + x.tokens, 0) / Math.max(1, r.results.length)).toLocaleString("vi-VN")} />
              <Kpi label="Điểm chấm (an toàn / tuổi / giáo dục / mạch lạc)" value={`${avg("safety")} / ${avg("ageFit")} / ${avg("educational")} / ${avg("coherence")}`} hint={`${rated.length} kết quả đã chấm`} />
            </div>
          </div>
        );
      })}
      {runs.length === 0 && <p className="sub">Chưa có lượt đánh giá nào.</p>}
    </Page>
  );
}
