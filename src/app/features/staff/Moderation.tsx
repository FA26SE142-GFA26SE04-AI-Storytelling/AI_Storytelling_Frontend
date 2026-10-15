"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Hand, Undo2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { staffService } from "@/app/services/staffService";
import { WISH_CARDS } from "@/app/services/readingLocal";
import type { EvaluationPrompt, EvaluationRun, ModerationDecision, ModerationItem, ModerationItemType } from "@/app/types/staff";
import { ageLabel } from "@/app/lib/storyView";
import { Notice, Page, fmt, useAction } from "./ui";

const TYPE: Record<ModerationItemType, string> = {
  public_story_review: "Duyệt truyện mẫu",
  roadmap_template_review: "Duyệt bộ truyện mẫu",
  gray_zone_story: "Rà truyện vùng xám",
  content_report: "Xử lý báo cáo",
  community_submission: "Duyệt thư viện cộng đồng",
};
const PRIORITY: Record<string, [string, string]> = { high: ["flag", "Ưu tiên cao"], medium: ["wait", "Trung bình"], low: ["draft", "Thấp"] };
const REPORT_REASON: Record<string, string> = { safety_concern: "Không an toàn", inappropriate: "Không phù hợp", wrong_age_band: "Sai lứa tuổi", copyright: "Bản quyền", cultural: "Văn hoá", other: "Khác" };
const ACTIONS: Record<ModerationItemType, { id: ModerationDecision; label: string; tone: string }[]> = {
  public_story_review: [{ id: "approved", label: "Duyệt", tone: "btn-ok" }, { id: "changes_requested", label: "Yêu cầu sửa", tone: "btn-s" }, { id: "rejected", label: "Từ chối", tone: "btn-no" }],
  roadmap_template_review: [{ id: "approved", label: "Duyệt", tone: "btn-ok" }, { id: "changes_requested", label: "Yêu cầu sửa", tone: "btn-s" }, { id: "rejected", label: "Từ chối", tone: "btn-no" }],
  gray_zone_story: [{ id: "cleared", label: "Cho qua (an toàn)", tone: "btn-ok" }, { id: "blocked", label: "Chặn", tone: "btn-no" }],
  content_report: [{ id: "archived", label: "Lưu trữ truyện", tone: "btn-no" }, { id: "dismissed", label: "Bỏ qua (không vi phạm)", tone: "btn-s" }, { id: "escalated", label: "Chuyển lên Administrator", tone: "btn-g" }],
  community_submission: [{ id: "approved", label: "Duyệt", tone: "btn-ok" }, { id: "rejected", label: "Từ chối", tone: "btn-no" }],
};
const ADMIN_ACTIONS: { id: ModerationDecision; label: string; tone: string }[] = [{ id: "archived", label: "Lưu trữ truyện", tone: "btn-no" }, { id: "dismissed", label: "Bỏ qua", tone: "btn-s" }];
const DECISION_LABEL: Record<string, string> = { approved: "Đã duyệt", changes_requested: "Yêu cầu sửa", rejected: "Từ chối", cleared: "Cho qua", blocked: "Chặn", archived: "Lưu trữ", dismissed: "Bỏ qua", escalated: "Chuyển lên Admin" };

/** Luồng 5 Bước 5.7 — một hàng đợi duy nhất, nhận xử lý (pull-based), quyết định kèm lý do. */
export function ModerationQueue({ admin }: { admin?: boolean }) {
  const { user } = useAuth();
  const me = user?.id ?? -1;
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [filter, setFilter] = useState<"open" | "mine" | "done">(admin ? "open" : "open");
  const [selected, setSelected] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [cards, setCards] = useState<number[]>([]);
  const [noModerator, setNoModerator] = useState(false);

  const load = useCallback(async () => {
    const [q, staff] = await Promise.all([staffService.queue(), staffService.staff()]);
    setItems(q.data ?? []);
    setNoModerator(!(staff.data ?? []).some((s) => s.role === "Moderator" && s.status === "active"));
  }, []);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);

  // Administrator chỉ xử lý ca được chuyển lên, hoặc toàn bộ hàng đợi khi không còn Moderator (BR-5.7c).
  const visible = useMemo(() => items.filter((i) => {
    if (admin && !noModerator && i.status !== "escalated" && !(i.status === "resolved" && filter === "done")) return false;
    if (filter === "open") return i.status === "pending" || i.status === "in_review" || i.status === "escalated";
    if (filter === "mine") return i.status === "in_review" && i.claimedByUserId === me;
    return i.status === "resolved";
  }), [items, filter, admin, noModerator, me]);
  const cur = items.find((i) => i.id === selected) ?? visible[0];

  useEffect(() => { setReason(""); setTags(cur?.subject.tags ?? []); setCards(cur?.subject.wishCardIds ?? []); }, [cur?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mineNow = cur?.status === "in_review" && cur.claimedByUserId === me;
  const canDecide = mineNow || (admin && cur?.status === "escalated") || (admin && noModerator && mineNow);
  const hasStory = cur && ["public_story_review", "gray_zone_story", "community_submission"].includes(cur.itemType);
  const publicStory = cur && ["public_story_review", "community_submission"].includes(cur.itemType);
  const actions = cur ? (admin && cur.status === "escalated" ? ADMIN_ACTIONS : ACTIONS[cur.itemType]) : [];

  return (
    <Page title={admin ? "Kiểm duyệt — ca chuyển lên" : "Hàng đợi kiểm duyệt"}
      sub={admin ? (noModerator ? "Hiện không còn Moderator nào hoạt động — Administrator xử lý toàn bộ hàng đợi." : "Chỉ hiện các báo cáo Moderator chuyển lên cần Administrator quyết định cuối.") : "Bấm “Nhận xử lý” trước khi quyết định. Mục nhận quá 2 giờ chưa quyết định sẽ tự trả về hàng đợi. Bạn chỉ thấy nội dung, không thấy biệt danh bé hay người giám sát."}
      actions={<div className="seg" style={{ minWidth: 300 }}>
        {(["open", "mine", "done"] as const).map((f) => <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f === "open" ? "Đang chờ" : f === "mine" ? "Tôi đang xử lý" : "Đã xử lý"}</button>)}
      </div>}>
      <Notice note={note} />
      <div className="st-split">
        <div className="st-list">
          {visible.length === 0 && <p className="sub">Không có mục nào.</p>}
          {visible.map((i) => {
            const overdue = (i.status === "pending" || i.status === "in_review") && Date.parse(i.dueAt) < Date.now();
            return (
              <button key={i.id} className={`st-item${cur?.id === i.id ? " on" : ""}`} onClick={() => setSelected(i.id)}>
                <span className="row"><b className="grow">{i.subject.title}</b><span className={`pill ${PRIORITY[i.priority][0]}`}>{PRIORITY[i.priority][1]}</span></span>
                <small>{TYPE[i.itemType]} · {i.status === "in_review" ? (i.claimedByUserId === me ? "Bạn đang xử lý" : "Có người đang xử lý") : i.status === "escalated" ? "Đã chuyển lên Admin" : i.status === "resolved" ? DECISION_LABEL[i.decision ?? ""] : "Đang chờ"}</small>
                <small className={overdue ? "overdue" : ""}>{overdue ? "Quá hạn SLA · " : ""}Hạn {fmt(i.dueAt)}</small>
              </button>
            );
          })}
        </div>

        {cur ? (
          <div className="st-card">
            <div className="row" style={{ flexWrap: "wrap" }}>
              <h3 className="grow">{cur.subject.title}</h3>
              <span className="pill ai">{TYPE[cur.itemType]}</span>
              {cur.subject.targetAgeBand && <span className="pill draft">{ageLabel(cur.subject.targetAgeBand)}</span>}
              {cur.subject.readingLevel && <span className="pill draft">Mức {cur.subject.readingLevel}</span>}
            </div>
            <small className="sub">Gửi lúc {fmt(cur.submittedAt)} · hạn xử lý {fmt(cur.dueAt)}</small>
            {cur.itemType === "content_report" && (
              <div className="notice err">Lý do báo cáo: <b>{REPORT_REASON[cur.subject.reportReason ?? ""] ?? cur.subject.reportReason}</b>{cur.subject.reportDescription ? ` — “${cur.subject.reportDescription}”` : ""}</div>
            )}
            {cur.itemType === "gray_zone_story" && cur.subject.modelRiskScore != null && (
              <div className="notice err">Mô hình kiểm duyệt gắn cờ vùng xám (điểm rủi ro {cur.subject.modelRiskScore.toFixed(2)}). Bạn chỉ trả lời: truyện có an toàn cho trẻ không?</div>
            )}
            <div className="st-content">{cur.subject.content}</div>
            {cur.itemType === "roadmap_template_review" && <p className="sub">Gồm {cur.subject.storyIds?.length ?? 0} truyện Public Library. Kiểm tra thứ tự hợp lý theo độ khó.</p>}

            {hasStory && (
              <div className="field">
                <span className="lbl">Nhãn nội dung (sửa nếu AI gắn chưa đúng)</span>
                <div className="chips">
                  {tags.map((t) => <button key={t} type="button" className="chip on" disabled={!canDecide} onClick={() => setTags(tags.filter((x) => x !== t))}>{t} ✕</button>)}
                  {canDecide && <input className="inp" style={{ width: 160 }} value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Thêm nhãn" aria-label="Thêm nhãn"
                    onKeyDown={(e) => { if (e.key === "Enter" && tagInput.trim()) { setTags([...new Set([...tags, tagInput.trim()])]); setTagInput(""); } }} />}
                </div>
              </div>
            )}
            {publicStory && (
              <div className="field">
                <span className="lbl">Thẻ ước khớp với truyện (để gợi ý đúng cho điều ước của bé)</span>
                <div className="chips">
                  {WISH_CARDS.map((c) => <button key={c.id} type="button" disabled={!canDecide} className={`chip${cards.includes(c.id) ? " on" : ""}`} onClick={() => setCards(cards.includes(c.id) ? cards.filter((x) => x !== c.id) : [...cards, c.id])}>{c.emoji} {c.label}</button>)}
                </div>
              </div>
            )}

            {cur.status === "resolved" ? (
              <div className="notice ok">Quyết định: <b>{DECISION_LABEL[cur.decision ?? ""]}</b>{cur.decisionReason ? ` — ${cur.decisionReason}` : ""}</div>
            ) : canDecide ? (
              <>
                <textarea className="inp" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do / góp ý (bắt buộc khi từ chối, chặn, lưu trữ, yêu cầu sửa, chuyển lên)" aria-label="Lý do" />
                <div className="row" style={{ flexWrap: "wrap" }}>
                  {actions.map((a) => <button key={a.id} className={`btn ${a.tone}`} disabled={busy} onClick={() => void run(() => staffService.decide(cur.id, me, a.id, reason, hasStory ? tags : undefined, publicStory ? cards : undefined))}>{a.label}</button>)}
                  <span className="grow" />
                  {mineNow && <button className="btn btn-g" disabled={busy} onClick={() => void run(() => staffService.release(cur.id), "Đã trả mục về hàng đợi.")}><Undo2 className="ic" />Trả lại</button>}
                </div>
              </>
            ) : cur.status === "pending" && (!admin || noModerator) ? (
              <button className="btn btn-p" style={{ width: "fit-content" }} disabled={busy} onClick={() => void run(() => staffService.claim(cur.id, me), "Bạn đã nhận xử lý mục này.")}><Hand className="ic" />Nhận xử lý</button>
            ) : <p className="sub">Mục này đang có người khác xử lý.</p>}
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
