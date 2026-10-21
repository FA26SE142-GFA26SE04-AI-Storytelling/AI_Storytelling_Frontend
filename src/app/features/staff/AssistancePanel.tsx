"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleStop, Sparkles, X } from "lucide-react";
import { describeAssistanceCode, type AssistanceApi } from "@/app/services/assistanceService";
import type { CreatorDraft, CreatorResult, SaveVersionInput } from "@/app/types/creator";
import type { AssistanceCommandResult, AssistanceEntryPoint, AssistancePatch, AssistanceReference, AssistanceTarget, AssistanceTask, CreateAssistanceInput } from "@/app/types/assistance";

const ENTRY: [AssistanceEntryPoint, string, string][] = [
  ["ContinueWriting", "Viết tiếp", "AI gợi ý hướng viết tiếp từ vị trí con trỏ."],
  ["SupportSelection", "Sửa đoạn đang chọn", "Bôi đen một đoạn trong nội dung rồi hỏi AI cách viết lại."],
  ["ReviewDraft", "Góp ý cả bản", "AI đọc cả bản nháp và chỉ ra chỗ nên xem lại."],
];
const POLL_MS = 3000;
const lines = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

/**
 * Hỏi AI khi soạn: gợi ý hướng → chốt hướng → (tuỳ chọn) AI viết thử đoạn → áp vào bản nháp.
 * Kết quả chỉ đổi bản nháp đang sửa; phải bấm Lưu mới tạo phiên bản (kèm khai đã dùng hướng / đoạn thử của AI).
 */
export default function AssistancePanel({ api, storyId, draft, form, getRange, onApply, onUseDirection, unavailableReason }: {
  api: AssistanceApi;
  storyId: number;
  draft: CreatorDraft;
  form: SaveVersionInput;
  /** Vị trí con trỏ / vùng chọn hiện tại trong ô nội dung (chỉ số UTF-16). */
  getRange: () => { start: number; end: number };
  onApply: (patch: AssistancePatch, refs: AssistanceReference[]) => void;
  onUseDirection: (ref: AssistanceReference) => void;
  unavailableReason?: string | null;
}) {
  const [entry, setEntry] = useState<AssistanceEntryPoint>("ContinueWriting");
  const [goal, setGoal] = useState("");
  const [keep, setKeep] = useState("");
  const [avoid, setAvoid] = useState("");
  const [task, setTask] = useState<AssistanceTask | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [ownDirection, setOwnDirection] = useState("");
  const poll = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (poll.current) clearTimeout(poll.current); }, []);

  const fail = (r: { code?: string; message: string }) => setError(describeAssistanceCode(r.code, r.message || "Chưa thực hiện được."));

  /** Tải lại task; còn lượt AI đang chạy thì hỏi lại sau vài giây. */
  const refresh = async (taskId: number) => {
    const r = await api.get(storyId, taskId);
    if (!r.ok || !r.data) { fail(r); return null; }
    setTask(r.data);
    if (poll.current) clearTimeout(poll.current);
    if (r.data.activeOperation) poll.current = setTimeout(() => void refresh(taskId), POLL_MS);
    return r.data;
  };

  /** Chạy một lệnh: lỗi xung đột revision thì tải lại task; xong thì tải lại để lấy kết quả và revision mới. */
  const run = async (taskId: number, fn: () => Promise<CreatorResult<AssistanceCommandResult>>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    const r = await fn();
    setBusy(false);
    if (!r.ok || !r.data) { fail(r); await refresh(taskId); return null; }
    await refresh(taskId);
    return r.data;
  };

  const start = async (input: CreateAssistanceInput) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    const c = await api.create(storyId, draft.revisionToken, draft.selectedVersionId, input);
    setBusy(false);
    if (!c.ok || !c.data) { fail(c); return; }
    setTask(c.data);
    await run(c.data.taskId, () => api.suggestions(storyId, c.data!.taskId, c.data!.taskRevision));
  };

  const ask = () => {
    const { start: s, end: e } = getRange();
    const content = form.content;
    let target: AssistanceTarget;
    if (entry === "ContinueWriting") target = { kind: "cursor", start: e, length: 0 };
    else if (entry === "SupportSelection") {
      if (e <= s) { setError("Hãy bôi đen một đoạn trong nội dung trước."); return; }
      if (e - s >= content.length) { setError("Đoạn chọn phải ngắn hơn cả truyện. Muốn xem cả bản, chọn \"Góp ý cả bản\"."); return; }
      target = { kind: "selection", start: s, length: e - s };
    } else target = { kind: "wholeDraft", start: 0, length: content.length };
    void start({ entryPoint: entry, editorSnapshot: { title: form.title, content }, target, goal: goal.trim(), constraints: { keep: lines(keep), avoid: lines(avoid) } });
  };

  const close = async () => {
    if (task && task.status !== "Closed") await api.close(storyId, task.taskId, task.taskRevision);
    if (poll.current) clearTimeout(poll.current);
    setTask(null);
    setError(null);
    setCustom("");
    setOwnDirection("");
  };

  if (unavailableReason) return <div className="st-card"><h3><Sparkles className="ic" /> Hỏi AI</h3><p className="sub" style={{ margin: 0 }}>{unavailableReason}</p></div>;

  // ---------- Chưa có phiên: chọn cách hỏi ----------
  if (!task) {
    return (
      <div className="st-card">
        <h3><Sparkles className="ic" /> Hỏi AI</h3>
        <div className="seg" style={{ width: "fit-content" }}>{ENTRY.map(([id, label]) => <button key={id} type="button" className={entry === id ? "on" : ""} onClick={() => setEntry(id)}>{label}</button>)}</div>
        <small className="sub">{ENTRY.find((x) => x[0] === entry)![2]} AI chỉ gợi ý; bạn quyết định dùng hay không.</small>
        <label className="field"><span className="lbl">Bạn muốn AI giúp gì? (không bắt buộc)</span>
          <input className="inp" maxLength={2000} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ví dụ: Thêm một chi tiết vui khi hai bạn gặp nhau" /></label>
        <div className="st-form">
          <label className="field"><span className="lbl">Giữ nguyên (cách nhau dấu phẩy)</span><input className="inp" value={keep} onChange={(e) => setKeep(e.target.value)} /></label>
          <label className="field"><span className="lbl">Tránh</span><input className="inp" value={avoid} onChange={(e) => setAvoid(e.target.value)} /></label>
        </div>
        {error && <div className="notice err" role="alert">{error}</div>}
        <button className="btn btn-p" style={{ width: "fit-content" }} disabled={busy || !form.content.trim()} onClick={ask}><Sparkles className="ic" />{busy ? "Đang hỏi…" : "Hỏi AI"}</button>
        {!form.content.trim() && <small className="sub">Viết vài dòng trước rồi hỏi AI.</small>}
      </div>
    );
  }

  const result = task.activeResult;
  const running = !!task.activeOperation;
  const editorChanged = form.title !== task.snapshot.title || form.content !== task.snapshot.content;
  const trialPatch = task.activeTrial?.result?.patch ?? null;
  const directionText = task.activeDirection?.direction?.confirmedDirectionText ?? null;

  return (
    <div className="st-card">
      <div className="row"><h3 className="grow"><Sparkles className="ic" /> Hỏi AI · {ENTRY.find((x) => x[0] === task.entryPoint)?.[1] ?? task.entryPoint}</h3>
        <button className="btn btn-g" aria-label="Đóng phiên hỏi AI" disabled={busy} onClick={() => void close()}><X className="ic" /></button></div>
      {(task.storyContextStale || task.audienceContextStale) && <div className="notice warn">Truyện hoặc cài đặt của bé đã đổi sau khi hỏi. Kết quả chỉ để tham khảo; hãy đóng và hỏi lại.</div>}

      {running && (
        <div className="row" style={{ gap: 8 }}>
          <span className="grow sub">AI đang nghĩ… có thể mất tới 2 phút. Bạn vẫn sửa bản nháp được.</span>
          <button className="btn btn-s" disabled={busy} onClick={() => void run(task.taskId, () => api.cancel(storyId, task.taskId, task.taskRevision, task.activeOperation!.operationId))}><CircleStop className="ic" />Dừng</button>
        </div>
      )}

      {/* Câu hỏi làm rõ */}
      {!running && result?.resultType === "Clarification" && result.question && task.activeClarificationStepId && (
        <div className="sec" style={{ gap: 6 }}>
          <b>{result.question.text}</b>
          <div className="chips">{result.question.choices.map((c) => (
            <button key={c.id} type="button" className="chip" disabled={busy} onClick={() => void answerThen({ choiceId: c.id })}>{c.text}</button>
          ))}</div>
          <div className="row" style={{ gap: 6 }}>
            <input className="inp grow" maxLength={2000} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Hoặc tự trả lời" />
            <button className="btn btn-s" disabled={busy || !custom.trim()} onClick={() => void answerThen({ customAnswer: custom.trim() })}>Gửi</button>
          </div>
          <button className="btn btn-g" style={{ width: "fit-content" }} disabled={busy} onClick={() => void answerThen({ letAiPropose: true })}>Để AI tự đề xuất</button>
        </div>
      )}

      {/* Các hướng gợi ý (chưa chốt) */}
      {!running && result?.resultType === "Options" && task.activeOptionsStepId && !task.activeDirectionStepId && (
        <div className="sec" style={{ gap: 8 }}>
          {result.options.map((o) => (
            <div key={o.id} className="st-item" style={{ cursor: "default" }}>
              <b>{o.summary}</b>
              <small>{o.direction}</small>
              <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy}
                onClick={() => void run(task.taskId, () => api.direction(storyId, task.taskId, task.taskRevision, task.activeOptionsStepId!, o.id, null))}>Chọn hướng này</button>
            </div>
          ))}
          <div className="row" style={{ gap: 6 }}>
            <input className="inp grow" maxLength={2000} value={ownDirection} onChange={(e) => setOwnDirection(e.target.value)} placeholder="Hoặc tự viết hướng bạn muốn" />
            <button className="btn btn-s" disabled={busy || !ownDirection.trim()}
              onClick={() => void run(task.taskId, () => api.direction(storyId, task.taskId, task.taskRevision, task.activeOptionsStepId!, null, ownDirection.trim()))}>Dùng hướng này</button>
          </div>
          {result.assumptions.length > 0 && <small className="sub">AI giả định: {result.assumptions.join("; ")}</small>}
        </div>
      )}

      {/* Đã chốt hướng */}
      {!running && task.activeDirectionStepId && directionText && (
        <div className="sec" style={{ gap: 6 }}>
          <div className="notice ok"><b>Hướng đã chọn:</b> {directionText}</div>
          {!trialPatch && (
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {task.entryPoint !== "ReviewDraft" && <button className="btn btn-p" disabled={busy}
                onClick={() => void run(task.taskId, () => api.trial(storyId, task.taskId, task.taskRevision, task.activeDirectionStepId!))}><Sparkles className="ic" />Để AI viết thử</button>}
              <button className="btn btn-s" disabled={busy} onClick={() => { onUseDirection({ taskId: task.taskId, stepId: task.activeDirectionStepId!, usage: "DirectionUsed" }); setInfo("Đã ghi nhận. Bạn tự viết theo hướng này rồi bấm Lưu."); }}>Tôi tự viết theo hướng này</button>
            </div>
          )}
        </div>
      )}

      {/* Đoạn AI viết thử */}
      {!running && trialPatch && task.activeTrialStepId && (
        <div className="sec" style={{ gap: 6 }}>
          {trialPatch.quote && <small className="sub">Thay cho: “{trialPatch.quote}”</small>}
          <div className="st-content" style={{ whiteSpace: "pre-wrap" }}>{trialPatch.text}</div>
          {editorChanged && <div className="notice warn">Bản nháp đã đổi so với lúc hỏi AI nên không áp dụng tự động được. Bạn có thể chép đoạn này, hoặc đóng và hỏi lại.</div>}
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-p" disabled={busy || editorChanged} onClick={() => {
              onApply(trialPatch, [
                { taskId: task.taskId, stepId: task.activeDirectionStepId!, usage: "DirectionUsed" },
                { taskId: task.taskId, stepId: task.activeTrialStepId!, usage: "TrialUsed" },
              ]);
              setInfo("Đã áp dụng vào bản nháp. Sửa thêm nếu muốn rồi bấm Lưu.");
            }}><Check className="ic" />Áp dụng vào bản nháp</button>
            <button className="btn btn-s" disabled={busy} onClick={() => void run(task.taskId, () => api.trial(storyId, task.taskId, task.taskRevision, task.activeDirectionStepId!))}>Viết thử lại</button>
          </div>
        </div>
      )}

      {/* Góp ý cả bản */}
      {!running && result?.resultType === "ReviewFindings" && task.activeReviewStepId && (
        <div className="sec" style={{ gap: 8 }}>
          {result.findings.length === 0 && <p className="sub" style={{ margin: 0 }}>AI không thấy chỗ nào cần sửa. Đây không phải chứng nhận an toàn.</p>}
          {result.findings.map((f) => (
            <div key={f.id} className="st-item" style={{ cursor: "default" }}>
              <small className="sub">“{f.quote}”</small>
              <span>{f.comment}</span>
              <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy || editorChanged} onClick={() => void start({
                entryPoint: "SupportSelection", editorSnapshot: { title: form.title, content: form.content },
                target: { kind: "selection", start: f.start, length: f.length }, goal: "", constraints: { keep: [], avoid: [] },
                parentTaskId: task.taskId, sourceReviewStepId: task.activeReviewStepId!, findingId: f.id,
              })}>Sửa đoạn này cùng AI</button>
            </div>
          ))}
          {result.warnings.length > 0 && <small className="sub">Lưu ý: {result.warnings.join("; ")}</small>}
          {editorChanged && <small className="sub">Bản nháp đã đổi sau khi AI góp ý; muốn sửa cùng AI hãy hỏi góp ý lại.</small>}
        </div>
      )}

      {info && <div className="notice ok" role="status">{info}</div>}
      {error && <div className="notice err" role="alert">{error}</div>}
      {!running && !result && !task.activeDirectionStepId && !error && <p className="sub" style={{ margin: 0 }}>Đang chờ kết quả…</p>}
    </div>
  );

  async function answerThen(a: { choiceId?: string; customAnswer?: string; letAiPropose?: boolean }) {
    if (!task?.activeClarificationStepId || !result?.question) return;
    const r = await run(task.taskId, () => api.answer(storyId, task.taskId, task.taskRevision, task.activeClarificationStepId!, result.question!.id, a));
    if (r) {
      setCustom("");
      await run(task.taskId, () => api.suggestions(storyId, task.taskId, r.taskRevision, r.stepId));
    }
  }
}
