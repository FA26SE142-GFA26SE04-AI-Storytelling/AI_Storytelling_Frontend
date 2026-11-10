"use client";
import { useRef, useState } from "react";
import { ArrowRight, ClipboardPaste, FileUp, PencilLine, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { showToast } from "@/app/lib/toast";
import { OUTPUT_MODE } from "@/app/lib/storyRules";
import { existingStoryService as svc } from "@/app/services/existingStoryService";
import type { ExistingStoryEvaluation } from "@/app/types/existingStory";
import type { StoryOutputMode } from "@/app/types/story";

type Source = "paste" | "file";
type Draft = { storyId: number; versionId: number; title: string; content: string | null };
const DECISION: Record<string, [string, string, string]> = {
  Suitable: ["ok", "Phù hợp", "Truyện hợp với hồ sơ của bé, có thể tạo học liệu ngay."],
  AdaptRecommended: ["wait", "Nên chỉnh lại", "Truyện chưa thật hợp với bé. Bạn có thể nhờ AI chỉnh, tự sửa, hoặc giữ nguyên nếu được phép."],
  Blocked: ["flag", "Chưa phù hợp", "Truyện có nội dung không an toàn với bé. Hãy nhờ AI chỉnh hoặc tự sửa trước khi dùng."],
};
const MAX_FILE = 5_000_000;

/**
 * Luồng 3b — nhập truyện có sẵn: dán văn bản hoặc tải tệp .txt/.docx → AI đánh giá mức phù hợp với bé
 * → AI chuyển thể, tự sửa hoặc giữ nguyên → Backend tạo học liệu, truyện đi tiếp các bước duyệt của Studio.
 */
export default function ImportStoryPanel({ childId, kidName, onOpen }: { childId: number; kidName: string; onOpen: (storyId: number) => void }) {
  const [source, setSource] = useState<Source>("paste");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<StoryOutputMode>("learning");
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [evaluation, setEvaluation] = useState<ExistingStoryEvaluation | null>(null);
  const [dialog, setDialog] = useState<"adapt" | "edit" | "keep" | null>(null);
  const [guideline, setGuideline] = useState("");
  const [edit, setEdit] = useState({ title: "", content: "", lesson: "" });
  const [reason, setReason] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const ready = source === "paste" ? text.trim().length > 0 : !!file;
  const evaluate = async (storyId: number, versionId: number) => {
    setBusy("AI đang đánh giá truyện…");
    const r = await svc.evaluate(storyId, versionId);
    setBusy(null);
    if (r.success && r.data) setEvaluation(r.data); else showToast(r.message, "err");
  };

  const submit = async () => {
    if (!ready || busy) return;
    if (file && file.size > MAX_FILE) { showToast("Tệp lớn hơn 5 MB. Hãy chọn tệp nhỏ hơn.", "err"); return; }
    setBusy("Đang nhập truyện…");
    const key = `import-${childId}-${crypto.randomUUID()}`;
    const r = source === "paste"
      ? await svc.importStory({ inputMethod: "paste", content: text.trim(), title: title.trim() || undefined, childProfileId: childId, outputMode: mode, idempotencyKey: key })
      : await svc.importFile({ file: file!, title: title.trim() || undefined, childProfileId: childId, outputMode: mode, idempotencyKey: key });
    setBusy(null);
    if (!r.success || !r.data) { showToast(r.message, "err"); return; }
    if (!r.data.canProceed) { showToast(r.data.fallbackMessage || "Nội dung này chưa nhập được. Hãy kiểm tra lại truyện.", "err"); return; }
    const next = { storyId: r.data.storyId, versionId: r.data.storyVersionId, title: title.trim(), content: source === "paste" ? text.trim() : null };
    setDraft(next);
    await evaluate(next.storyId, next.versionId);
  };

  /** Sau khi chỉnh / sửa: phù hợp thì Backend đã xếp việc tạo học liệu, mở Studio; còn lại đánh giá bản mới. */
  const afterMutation = async (r: Awaited<ReturnType<typeof svc.adapt>>, content: string | null) => {
    if (!r.success || !r.data || !draft) { setBusy(null); showToast(r.message, "err"); return; }
    setDraft({ ...draft, versionId: r.data.storyVersionId, content });
    setDialog(null);
    if (r.data.decision === "Suitable") { setBusy(null); showToast("Truyện đã phù hợp. Đang tạo học liệu."); onOpen(draft.storyId); return; }
    await evaluate(draft.storyId, r.data.storyVersionId);
  };
  const adapt = async () => {
    if (!draft) return;
    setBusy("AI đang chỉnh truyện cho hợp với bé…");
    await afterMutation(await svc.adapt(draft.storyId, draft.versionId, guideline.trim() || undefined), null);
  };
  const saveEdit = async () => {
    if (!draft) return;
    setBusy("Đang lưu và đánh giá lại…");
    await afterMutation(await svc.manualEdit(draft.storyId, draft.versionId, edit.title.trim(), edit.content.trim(), edit.lesson.trim()), edit.content.trim());
  };
  const keep = async (why: string) => {
    if (!draft) return;
    setBusy("Đang chuyển sang tạo học liệu…");
    const r = await svc.keepOriginal(draft.storyId, draft.versionId, why);
    setBusy(null);
    if (r.success) { setDialog(null); onOpen(draft.storyId); } else showToast(r.message, "err");
  };
  const reset = () => { setDraft(null); setEvaluation(null); setText(""); setFile(null); setTitle(""); setGuideline(""); };

  if (draft && evaluation) {
    const [tone, label, hint] = DECISION[evaluation.decisionText] ?? ["draft", evaluation.decisionText, ""];
    const issues = [...evaluation.hardSafetyIssues, ...evaluation.profileFitIssues];
    const suitable = evaluation.decisionText === "Suitable";
    return (
      <div className="pb brief import-panel">
        <div className="import-result">
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <ShieldCheck className="ic" aria-hidden />
            <b className="display grow">Kết quả đánh giá cho {kidName}</b>
            <span className={`pill ${tone}`}>{label}</span>
          </div>
          <p className="import-hint">{hint}</p>
          <div className="st-grid">
            <div className="st-kpi"><small>Điểm an toàn</small><b>{evaluation.safetyScore ?? "—"}</b></div>
            <div className="st-kpi"><small>Số chữ</small><b>{evaluation.wordCount ?? "—"}</b></div>
            <div className="st-kpi"><small>Độ dễ đọc</small><b>{evaluation.readabilityFre != null ? Math.round(evaluation.readabilityFre) : "—"}</b></div>
          </div>
          {issues.length > 0 && <ul className="import-issues">{issues.map((i, n) => <li key={`${i.code}-${n}`}>{i.message}</li>)}</ul>}
        </div>
        {busy ? <p className="notice" data-inline-notice>{busy}</p> : (
          <div className="import-actions">
            {suitable
              ? <button className="btn btn-p" onClick={() => void keep("Truyện phù hợp với hồ sơ của bé")}><ArrowRight className="ic" />Tiếp tục tạo học liệu</button>
              : <button className="btn btn-p" onClick={() => { setGuideline(""); setDialog("adapt"); }}><Sparkles className="ic" />Nhờ AI chỉnh</button>}
            <button className="btn btn-s" onClick={() => { setEdit({ title: draft.title, content: draft.content ?? "", lesson: "" }); setDialog("edit"); }}><PencilLine className="ic" />Tự sửa</button>
            {!suitable && evaluation.canKeepOriginal && <button className="btn btn-s" onClick={() => { setReason(""); setDialog("keep"); }}>Giữ nguyên</button>}
            <span className="grow" />
            <button className="btn btn-g" onClick={reset}><RotateCcw className="ic" />Nhập truyện khác</button>
          </div>
        )}
        {dialog === "adapt" && <Dialog title="Nhờ AI chỉnh truyện" onClose={() => setDialog(null)}>
          <div className="st-form">
            <p className="notice">AI chỉnh độ dài, từ ngữ và độ khó cho hợp với {kidName}; giữ nhân vật, cốt truyện và bài học.</p>
            <label className="field"><span className="lbl">Lưu ý thêm cho AI (không bắt buộc)</span><textarea className="inp" rows={3} maxLength={500} value={guideline} onChange={(e) => setGuideline(e.target.value)} placeholder="Ví dụ: bỏ đoạn đánh nhau, giữ tên nhân vật" /></label>
            <div className="row"><button className="btn btn-g" onClick={() => setDialog(null)}>Huỷ</button><span className="grow" /><button className="btn btn-p" disabled={!!busy} onClick={() => void adapt()}><Sparkles className="ic" />Chỉnh truyện</button></div>
          </div>
        </Dialog>}
        {dialog === "edit" && <Dialog title="Tự sửa truyện" wide onClose={() => setDialog(null)}>
          <div className="st-form">
            <label className="field"><span className="lbl">Tên truyện</span><input className="inp" maxLength={200} value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></label>
            <label className="field"><span className="lbl">Nội dung</span><textarea className="inp" rows={12} value={edit.content} onChange={(e) => setEdit({ ...edit, content: e.target.value })} placeholder={draft.content === null ? "Dán lại nội dung truyện đã sửa" : undefined} /></label>
            <label className="field"><span className="lbl">Bài học của truyện</span><input className="inp" maxLength={300} value={edit.lesson} onChange={(e) => setEdit({ ...edit, lesson: e.target.value })} /></label>
            <div className="row"><button className="btn btn-g" onClick={() => setDialog(null)}>Huỷ</button><span className="grow" /><button className="btn btn-p" disabled={!!busy || !edit.title.trim() || !edit.content.trim()} onClick={() => void saveEdit()}>Lưu và đánh giá lại</button></div>
          </div>
        </Dialog>}
        {dialog === "keep" && <Dialog title="Giữ nguyên truyện" onClose={() => setDialog(null)}>
          <div className="st-form">
            <p className="notice warn">Truyện được dùng như bản gốc dù chưa thật hợp với {kidName}. Lý do được ghi vào nhật ký.</p>
            <label className="field"><span className="lbl">Lý do giữ nguyên</span><textarea className="inp" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
            <div className="row"><button className="btn btn-g" onClick={() => setDialog(null)}>Huỷ</button><span className="grow" /><button className="btn btn-p" disabled={!!busy || !reason.trim()} onClick={() => void keep(reason.trim())}>Giữ nguyên và tiếp tục</button></div>
          </div>
        </Dialog>}
      </div>
    );
  }

  return (
    <div className="pb brief import-panel">
      <label className="field"><span className="lbl">Tên truyện</span><input className="inp" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Thỏ và Rùa" /></label>
      <div className="field">
        <span className="lbl">Nội dung truyện</span>
        <div className="seg" role="radiogroup" aria-label="Cách nhập" style={{ maxWidth: 320 }}>
          <button type="button" role="radio" aria-checked={source === "paste"} className={source === "paste" ? "on" : ""} onClick={() => setSource("paste")}><ClipboardPaste className="ic" />Dán văn bản</button>
          <button type="button" role="radio" aria-checked={source === "file"} className={source === "file" ? "on" : ""} onClick={() => setSource("file")}><FileUp className="ic" />Tải tệp</button>
        </div>
        {source === "paste"
          ? <textarea className="inp" rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Dán nội dung truyện, mỗi đoạn cách nhau một dòng trống" aria-label="Nội dung truyện" />
          : <div className="import-file">
              <input ref={fileRef} type="file" accept=".txt,.docx" hidden aria-label="Chọn tệp truyện (.txt, .docx)" onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
              <button type="button" className="btn btn-s" onClick={() => fileRef.current?.click()}><FileUp className="ic" />{file ? "Chọn tệp khác" : "Chọn tệp .txt hoặc .docx"}</button>
              {file && <span className="pill">{file.name}</span>}
            </div>}
      </div>
      <div className="field">
        <span className="lbl">Kiểu truyện</span>
        <div className="seg" role="radiogroup" aria-label="Kiểu truyện" style={{ maxWidth: 360 }}>
          {(Object.keys(OUTPUT_MODE) as StoryOutputMode[]).map((m) => <button key={m} type="button" role="radio" aria-checked={mode === m} title={OUTPUT_MODE[m].hint} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>{OUTPUT_MODE[m].label}</button>)}
        </div>
      </div>
      {busy ? <p className="notice" data-inline-notice>{busy}</p>
        : <button className="btn btn-p import-go" disabled={!ready} onClick={() => void submit()}><ShieldCheck className="ic" />Nhập và kiểm tra</button>}
    </div>
  );
}
