"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Hand } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { staffService } from "@/app/services/staffService";
import { storyService } from "@/app/services/storyService";
import type { EvaluationPrompt, EvaluationRun, QueueItem, QueueItemDetail } from "@/app/types/staff";
import type { StoryDto } from "@/app/types/story";
import { ageLabel } from "@/app/lib/storyView";
import { Notice, Page, fmt, useAction } from "./ui";
import { DECIDABLE, ReviewPanel } from "./ReviewPanels";

const TYPE: Record<string, string> = {
  PublicStoryReview: "Duyệt truyện mẫu",
  RoadmapTemplateReview: "Duyệt bộ truyện mẫu",
  GrayZoneStory: "Rà truyện vùng xám",
  ContentReport: "Xử lý báo cáo",
  CommunitySubmission: "Duyệt thư viện cộng đồng",
  PublicStoryRemoval: "Yêu cầu gỡ truyện",
};
const PRIORITY: Record<string, [string, string]> = { High: ["flag", "Ưu tiên cao"], Medium: ["wait", "Trung bình"], Low: ["draft", "Thấp"] };
const STATUS: Record<string, string> = {
  Pending: "Đang chờ", Claimed: "Đang xử lý", Approved: "Đã duyệt", ChangesRequested: "Yêu cầu sửa", Rejected: "Từ chối", Cleared: "Cho qua",
  Blocked: "Chặn", Dismissed: "Bỏ qua", Archived: "Lưu trữ", Escalated: "Chuyển lên Admin", Withdrawn: "Đã rút",
};
const OPEN = ["Pending", "Claimed", "Escalated"];

/** Chuỗi JSON (cờ, checklist, tiến độ rà) của mục kiểm duyệt → danh sách dòng dễ đọc. */
function jsonLines(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : JSON.stringify(x)));
    if (v && typeof v === "object") return Object.entries(v).map(([k, x]) => `${k}: ${typeof x === "string" ? x : JSON.stringify(x)}`);
    return [String(v)];
  } catch { return [raw]; }
}

/**
 * Luồng 5 Bước 5.7 — một hàng đợi duy nhất (`/ModerationQueue`), nhận xử lý (pull-based, khoá 2 giờ).
 * Mục đang nhận được mở bằng gói duyệt riêng của từng loại (ReviewPanels). Truyện vùng xám chưa có API quyết định.
 */
export function ModerationQueue({ admin }: { admin?: boolean }) {
  const { user } = useAuth();
  const me = user?.id ?? -1;
  const [items, setItems] = useState<QueueItem[]>([]);
  const [filter, setFilter] = useState<"open" | "mine" | "done">("open");
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<QueueItemDetail | null>(null);
  const [story, setStory] = useState<StoryDto | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = await staffService.queue();
    setItems(q.data?.items ?? []);
    setLoadError(q.success ? null : q.message);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);

  // Administrator chỉ xem ca được chuyển lên; backend tự cho phép nhận mục khi không còn Moderator hợp lệ (BR-5.7c).
  const visible = useMemo(() => items.filter((i) => {
    if (admin && filter === "open") return i.status === "Escalated" || i.status === "Pending";
    if (filter === "open") return OPEN.includes(i.status);
    if (filter === "mine") return i.status === "Claimed" && i.claimedByUserId === me;
    return !OPEN.includes(i.status);
  }), [items, filter, admin, me]);
  const cur = items.find((i) => i.id === selected) ?? visible[0];
  const mineNow = cur?.status === "Claimed" && cur.claimedByUserId === me;

  // Mục mình đang nhận: mở chi tiết (cờ, checklist) và nội dung truyện liên quan.
  useEffect(() => {
    setDetail(null);
    setStory(undefined);
    if (!cur || !mineNow) return;
    let alive = true;
    void staffService.openItem(cur.id).then((r) => { if (alive) setDetail(r.success ? r.data : null); });
    if (cur.storyId && !DECIDABLE.includes(cur.itemType)) void storyService.getStoryById(cur.storyId).then((r) => { if (alive) setStory(r.success ? r.data : null); });
    return () => { alive = false; };
  }, [cur, mineNow]);

  return (
    <Page title={admin ? "Kiểm duyệt — ca chuyển lên" : "Hàng đợi kiểm duyệt"}
      sub={admin ? "Administrator xử lý ca được chuyển lên, và cả hàng đợi khi không còn Moderator hợp lệ." : "Bấm “Nhận xử lý” trước khi xem nội dung. Mục nhận quá 2 giờ chưa quyết định tự trả về hàng đợi. Không nhận được mục do chính mình tạo hoặc nộp."}
      actions={<div className="seg" style={{ minWidth: 300 }}>
        {(["open", "mine", "done"] as const).map((f) => <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f === "open" ? "Đang chờ" : f === "mine" ? "Tôi đang xử lý" : "Đã xử lý"}</button>)}
      </div>}>
      <Notice note={note} />
      {loadError && <div className="notice err">{loadError}</div>}
      <div className="st-split">
        <div className="st-list">
          {visible.length === 0 && <p className="sub">Không có mục nào.</p>}
          {visible.map((i) => (
            <button key={i.id} className={`st-item${cur?.id === i.id ? " on" : ""}`} onClick={() => setSelected(i.id)}>
              <span className="row"><b className="grow">{TYPE[i.itemType] ?? i.itemType} #{i.id}</b><span className={`pill ${PRIORITY[i.priority]?.[0] ?? "draft"}`}>{PRIORITY[i.priority]?.[1] ?? i.priority}</span></span>
              <small>{i.status === "Claimed" ? (i.claimedByUserId === me ? "Bạn đang xử lý" : "Có người đang xử lý") : STATUS[i.status] ?? i.status}{i.isResubmission ? " · Gửi lại" : ""}</small>
              <small className={i.isOverdue ? "overdue" : ""}>{i.isOverdue ? "Quá hạn SLA · " : ""}Hạn {fmt(i.slaDueAt)}</small>
            </button>
          ))}
        </div>

        {cur ? (
          <div className="st-card">
            <div className="row" style={{ flexWrap: "wrap" }}>
              <h3 className="grow">{story?.title || `${TYPE[cur.itemType] ?? cur.itemType} #${cur.id}`}</h3>
              <span className="pill ai">{TYPE[cur.itemType] ?? cur.itemType}</span>
              <span className="pill draft">{STATUS[cur.status] ?? cur.status}</span>
              {story?.ageBand && <span className="pill draft">{ageLabel(story.ageBand)}</span>}
            </div>
            <small className="sub">Vào hàng đợi {fmt(cur.createdAt)} · hạn xử lý {fmt(cur.slaDueAt)}{cur.claimExpiresAt && mineNow ? ` · khoá tới ${fmt(cur.claimExpiresAt)}` : ""}</small>

            {mineNow && DECIDABLE.includes(cur.itemType) ? (
              <ReviewPanel key={cur.id} item={cur} detail={detail} onDecided={() => { setSelected(null); void load(); }} />
            ) : mineNow ? (
              <>
                {detail && jsonLines(detail.flags).length > 0 && <div className="notice err"><b>Cờ cảnh báo:</b> {jsonLines(detail.flags).join(" · ")}</div>}
                {detail && jsonLines(detail.checklist).length > 0 && <ul className="sub" style={{ margin: 0 }}>{jsonLines(detail.checklist).map((l) => <li key={l}>{l}</li>)}</ul>}
                {cur.storyId && (story === undefined
                  ? <p className="sub">Đang tải nội dung truyện…</p>
                  : story ? <div className="st-content">{story.content || "Truyện chưa có nội dung."}</div>
                    : <p className="sub">Chưa xem được nội dung truyện #{cur.storyId} (backend chưa có API đọc nội dung cho kiểm duyệt).</p>)}
                {cur.contentReportId && <p className="sub">Báo cáo nội dung #{cur.contentReportId}.</p>}
                {cur.readingRoadmapId && <p className="sub">Bộ truyện mẫu #{cur.readingRoadmapId}.</p>}
                <div className="notice warn">Backend chưa có API ra quyết định cho loại mục này. Mục sẽ tự trả về hàng đợi sau 2 giờ.</div>
              </>
            ) : cur.status === "Pending" ? (
              <button className="btn btn-p" style={{ width: "fit-content" }} disabled={busy} onClick={() => void run(() => staffService.claim(cur.id), "Bạn đã nhận xử lý mục này.")}><Hand className="ic" />Nhận xử lý</button>
            ) : cur.status === "Claimed" ? <p className="sub">Mục này đang có người khác xử lý.</p>
              : <p className="sub">Mục đã xử lý: {STATUS[cur.status] ?? cur.status}.</p>}
          </div>
        ) : <div className="st-card"><p className="sub">Chọn một mục để xem.</p></div>}
      </div>
    </Page>
  );
}

/** Luồng 5 Bước 5.10 — Moderator chấm ngẫu nhiên ≥ 10 kết quả mỗi lượt đánh giá (ngoài hàng đợi, không SLA). */
export function RatingPage() {
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [prompts, setPrompts] = useState<EvaluationPrompt[]>([]);
  const [runId, setRunId] = useState<number | null>(null);
  const load = useCallback(async () => {
    const [r, p] = await Promise.all([staffService.runs(), staffService.prompts()]);
    setRuns(r.data ?? []);
    setPrompts(p.data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const { note, run } = useAction(load);
  const cur = runs.find((r) => r.id === runId) ?? runs[0];
  const topic = (id: number) => prompts.find((p) => p.id === id)?.params.topic ?? `#${id}`;
  const CRITERIA = [["safety", "An toàn"], ["ageFit", "Phù hợp tuổi"], ["educational", "Giá trị giáo dục"], ["coherence", "Mạch lạc"]] as const;

  return (
    <Page title="Đánh giá AI" sub="Chấm điểm 1–5 cho từng truyện sinh ở chế độ thử nghiệm. Điểm an toàn trung bình quyết định có được dùng phiên bản Prompt Catalog mới hay không.">
      <Notice note={note} />
      {runs.length === 0 && <p className="sub">Chưa có lượt đánh giá nào. Administrator sẽ chạy bộ đánh giá.</p>}
      {cur && (
        <>
          <div className="row"><span className="lbl">Lượt</span>
            <select className="inp" style={{ width: "auto" }} value={cur.id} onChange={(e) => setRunId(+e.target.value)}>{runs.map((r) => <option key={r.id} value={r.id}>#{r.id} · {r.catalogVersion} · {fmt(r.startedAt)}</option>)}</select>
            <span className="sub">{cur.results.filter((r) => r.rating).length}/{cur.results.length} đã chấm</span>
          </div>
          <div className="st-list">
            {cur.results.map((r) => <RatingRow key={r.promptId} title={topic(r.promptId)} outcome={r.actualOutcome} rating={r.rating} criteria={CRITERIA}
              onSave={(rating) => void run(() => staffService.rate(cur.id, r.promptId, rating))} />)}
          </div>
        </>
      )}
    </Page>
  );
}

type Rating = NonNullable<EvaluationRun["results"][number]["rating"]>;
function RatingRow({ title, outcome, rating, criteria, onSave }: { title: string; outcome: string; rating: Rating | null; criteria: readonly (readonly [keyof Rating, string])[]; onSave: (r: Rating) => void }) {
  const [r, setR] = useState<Rating>(rating ?? { safety: 4, ageFit: 4, educational: 4, coherence: 4 });
  return (
    <div className="st-item">
      <span className="row"><b className="grow">{title}</b><span className="pill draft">{outcome === "pass" ? "Sinh truyện" : outcome === "gray" ? "Vùng xám" : "Bị chặn"}</span>{rating && <span className="pill ok">Đã chấm</span>}</span>
      <div className="st-rating">
        {criteria.map(([k, label]) => (
          <label key={k}>{label}
            <select className="inp" value={r[k]} onChange={(e) => setR({ ...r, [k]: +e.target.value })}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </label>
        ))}
      </div>
      <button className="btn btn-s" style={{ width: "fit-content" }} onClick={() => onSave(r)}>Lưu điểm</button>
    </div>
  );
}
