"use client";

import { useMemo, useState } from "react";
import { Archive, CircleAlert, ClipboardPaste, Check, PencilLine, ShieldCheck, Wand2 } from "lucide-react";
import { existingStoryService as api } from "@/app/services/existingStoryService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { ExistingStoryEvaluation } from "@/app/types/existingStory";
import { FREE_TEXT_MAX, detectPii } from "@/app/lib/storyRules";
import type { WorkspaceId } from "@/app/components/shell/nav";
import Frog from "@/app/components/brand/Frog";

type Method = "paste" | "editor";
type Stage =
  | { kind: "form" }
  | { kind: "decide"; storyId: number; versionId: number; evaluation: ExistingStoryEvaluation }
  | { kind: "done"; title: string }
  | { kind: "archived" };

const DECISION: Record<string, { label: string; tone: string; text: string }> = {
  Suitable: { label: "Phù hợp", tone: "ok", text: "Truyện an toàn và vừa sức bé." },
  AdaptRecommended: { label: "Nên điều chỉnh", tone: "wait", text: "Truyện an toàn nhưng chưa vừa với hồ sơ của bé." },
  Blocked: { label: "Bị chặn", tone: "flag", text: "Truyện có nội dung vi phạm quy tắc an toàn của bé. Bạn chỉ có thể sửa thành bản mới hoặc lưu trữ." },
};

/** Luồng 2 mục 3.2, 5.2–5.4 — nhập truyện có sẵn (dán hoặc tự soạn). */
export default function ImportStoryPanel({ child, go, onDone }: { child: ChildProfile; go: (id: WorkspaceId) => void; onDone: () => void }) {
  const [method, setMethod] = useState<Method>("paste");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lesson, setLesson] = useState("");
  const [attest, setAttest] = useState(false);
  const [stage, setStage] = useState<Stage>({ kind: "form" });
  const [editing, setEditing] = useState(false);
  const [keepReason, setKeepReason] = useState("");
  const [guideline, setGuideline] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pii = useMemo(() => detectPii(`${title}\n${content}`, child.nickname), [title, content, child.nickname]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try { await fn(); } finally { setBusy(false); }
  };

  /** Sau mỗi bản mới: Phù hợp → đã chuyển sang tạo học liệu; còn lại → hiện đánh giá để phụ huynh quyết định. */
  const afterVersion = async (storyId: number, versionId: number, decision: string | null) => {
    if (decision === "Suitable") { setStage({ kind: "done", title }); return; }
    const ev = await api.evaluate(storyId, versionId);
    if (!ev.success || !ev.data) { setErr(ev.message); return; }
    setStage({ kind: "decide", storyId, versionId, evaluation: ev.data });
  };

  const submit = () => run(async () => {
    if (method === "paste" && !attest) { setErr("Hãy xác nhận bạn có quyền dùng nội dung này cho con."); return; }
    const imported = await api.importStory({ inputMethod: "paste", content, title: title.trim() || undefined, childProfileId: child.id, idempotencyKey: crypto.randomUUID() });
    if (!imported.success || !imported.data) { setErr(imported.message); return; }
    if (!imported.data.canProceed) { setErr(imported.data.fallbackMessage || "Truyện chưa thể đi tiếp. Hãy sửa lại nội dung."); return; }
    const { storyId, storyVersionId } = imported.data;
    const ev = await api.evaluate(storyId, storyVersionId);
    if (!ev.success || !ev.data) { setErr(ev.message); return; }
    if (ev.data.decisionText === "Suitable") {
      // Phù hợp: giữ bản gốc và chuyển sang tạo học liệu.
      const kept = await api.keepOriginal(storyId, storyVersionId, "Đánh giá phù hợp với hồ sơ của bé");
      if (!kept.success) { setErr(kept.message); return; }
      setStage({ kind: "done", title });
      return;
    }
    setStage({ kind: "decide", storyId, versionId: storyVersionId, evaluation: ev.data });
  });

  if (stage.kind === "done" || stage.kind === "archived") {
    return (
      <div className="empty">
        <Frog size={110} mood={stage.kind === "done" ? "happy" : "idle"} />
        <b className="display">{stage.kind === "done" ? "Đã nhận truyện" : "Đã lưu trữ truyện"}</b>
        <span>{stage.kind === "done" ? "Hệ thống đang tạo từ vựng, câu hỏi và gợi ý thảo luận. Truyện sẽ xuất hiện trong hàng chờ duyệt sau ít phút." : "Truyện không hiện với bé."}</span>
        <div className="row">
          {stage.kind === "done" && <button className="btn btn-p" onClick={() => go("review")}>Mở hàng chờ duyệt</button>}
          <button className="btn btn-s" onClick={onDone}>Nhập truyện khác</button>
        </div>
      </div>
    );
  }

  if (stage.kind === "decide") {
    const { storyId, versionId, evaluation: ev } = stage;
    const d = DECISION[ev.decisionText] ?? DECISION.AdaptRecommended;
    const blocked = ev.decisionText === "Blocked";
    const issues = [...ev.hardSafetyIssues, ...ev.profileFitIssues];
    return (
      <div className="import-body">
        <div className="sec" style={{ gap: 10 }}>
          <div className="row"><h3 className="display grow" style={{ margin: 0 }}>Kết quả đánh giá</h3><span className={`pill ${d.tone}`}>{d.label}</span></div>
          <p className="sub">{d.text}{ev.wordCount ? ` Truyện dài khoảng ${ev.wordCount.toLocaleString("vi-VN")} tiếng.` : ""}</p>
          {issues.map((i) => <div key={i.code + i.message} className="ck"><span className="st warn"><CircleAlert /></span>{i.message}</div>)}
        </div>

        {editing ? (
          <div className="sec" style={{ gap: 10 }}>
            <label className="field"><span className="lbl">Tên truyện</span><input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label className="field"><span className="lbl">Nội dung</span><textarea className="inp" rows={14} value={content} onChange={(e) => setContent(e.target.value)} /></label>
            <label className="field"><span className="lbl">Bài học (không bắt buộc)</span><input className="inp" maxLength={FREE_TEXT_MAX} value={lesson} onChange={(e) => setLesson(e.target.value)} /></label>
            <div className="row">
              <button className="btn btn-g" onClick={() => setEditing(false)}>Hủy</button>
              <button className="btn btn-p" disabled={busy || content.trim().length < 50} onClick={() => void run(async () => {
                const r = await api.manualEdit(storyId, versionId, title, content, lesson);
                if (!r.success || !r.data) { setErr(r.message); return; }
                setEditing(false);
                await afterVersion(storyId, r.data.storyVersionId, r.data.decision);
              })}><Check className="ic" />Lưu bản sửa và đánh giá lại</button>
            </div>
          </div>
        ) : (
          <div className="sec" style={{ gap: 12 }}>
            {!blocked && (
              <div className="choice">
                <b><Wand2 className="ic" />Để AI điều chỉnh</b>
                <span className="sub">AI rút gọn, đổi từ khó và câu dài cho vừa sức bé; giữ nhân vật, cốt truyện và bài học. Mỗi truyện được chỉnh bằng AI tối đa 2 lần.</span>
                <input className="inp" maxLength={FREE_TEXT_MAX} value={guideline} onChange={(e) => setGuideline(e.target.value)} placeholder="Ghi chú thêm cho AI (không bắt buộc)" />
                <button className="btn btn-p" style={{ width: "fit-content" }} disabled={busy} onClick={() => void run(async () => {
                  const r = await api.adapt(storyId, versionId, guideline.trim() || undefined);
                  if (!r.success || !r.data) { setErr(r.message); return; }
                  await afterVersion(storyId, r.data.storyVersionId, r.data.decision);
                })}>{busy ? "AI đang chỉnh…" : "AI điều chỉnh"}</button>
              </div>
            )}
            <div className="choice">
              <b><PencilLine className="ic" />Tự sửa</b>
              <span className="sub">Sửa trực tiếp nội dung, hệ thống tạo bản mới và đánh giá lại.</span>
              <button className="btn btn-s" style={{ width: "fit-content" }} onClick={() => setEditing(true)}>Mở trình sửa</button>
            </div>
            {ev.canKeepOriginal && !blocked && (
              <div className="choice">
                <b><ShieldCheck className="ic" />Giữ bản gốc</b>
                <span className="sub">Dùng nguyên truyện dù chưa vừa với hồ sơ. Lựa chọn này được ghi lại.</span>
                <input className="inp" maxLength={FREE_TEXT_MAX} value={keepReason} onChange={(e) => setKeepReason(e.target.value)} placeholder="Lý do (bắt buộc), ví dụ: bố mẹ sẽ đọc cùng con" />
                <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy || !keepReason.trim()} onClick={() => void run(async () => {
                  const r = await api.keepOriginal(storyId, versionId, keepReason.trim());
                  if (!r.success) { setErr(r.message); return; }
                  setStage({ kind: "done", title });
                })}>Giữ bản gốc</button>
              </div>
            )}
            {!ev.canKeepOriginal && !blocked && <p className="sub">Không giữ được bản gốc vì truyện vượt độ dài tối đa của bé.</p>}
            <button className="btn btn-no" style={{ width: "fit-content" }} disabled={busy} onClick={() => void run(async () => {
              const r = await api.archive(storyId, "supervisor_preference");
              if (!r.success) { setErr(r.message); return; }
              setStage({ kind: "archived" });
            })}><Archive className="ic" />Lưu trữ, không dùng truyện này</button>
          </div>
        )}
        {err && <div className="notice err" role="alert">{err}</div>}
      </div>
    );
  }

  return (
    <form className="import-body" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <div className="seg" style={{ maxWidth: 320 }}>
        <button type="button" className={method === "paste" ? "on" : ""} onClick={() => setMethod("paste")}><ClipboardPaste size={13} /> Dán truyện có sẵn</button>
        <button type="button" className={method === "editor" ? "on" : ""} onClick={() => setMethod("editor")}><PencilLine size={13} /> Tự viết</button>
      </div>
      <p className="sub">
        {method === "paste" ? "Dán truyện bạn đã có (sách, báo, truyện sưu tầm). " : "Tự viết truyện cho con. "}
        Hệ thống kiểm tra an toàn và mức phù hợp với {child.nickname} trước khi tạo câu hỏi và gửi bạn duyệt. Chỉ nhận truyện tiếng Việt.
      </p>
      <label className="field"><span className="lbl">Tên truyện (không bắt buộc)</span><input className="inp" maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label className="field"><span className="lbl">Nội dung truyện</span>
        <textarea className="inp" rows={14} required minLength={50} value={content} onChange={(e) => setContent(e.target.value)} placeholder={method === "paste" ? "Dán nội dung truyện vào đây" : "Ngày xửa ngày xưa…"} /></label>
      <span className="sub">{content.trim() ? `${content.trim().split(/\s+/).length.toLocaleString("vi-VN")} tiếng` : ""}</span>
      {pii.length > 0 && <div className="notice err" role="status"><CircleAlert className="ic" /> Truyện có thể chứa thông tin cá nhân ({[...new Set(pii.map((p) => p.kind))].join(", ")}). Nên bỏ trước khi nhập.</div>}
      {method === "paste" ? (
        <label className="row" style={{ alignItems: "flex-start", fontSize: 13 }}>
          <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} style={{ marginTop: 3, accentColor: "var(--primary)" }} />
          <span>Tôi có quyền sử dụng nội dung này cho con tôi. Truyện chỉ dùng trong gia đình.</span>
        </label>
      ) : <p className="sub">Truyện bạn tự viết được ghi nhận là tác phẩm của bạn.</p>}
      {err && <div className="notice err" role="alert">{err}</div>}
      <button className="btn btn-p" style={{ width: "fit-content" }} disabled={busy || content.trim().length < 50 || (method === "paste" && !attest)}>{busy ? "Đang kiểm tra…" : "Nhập và đánh giá"}</button>
    </form>
  );
}
