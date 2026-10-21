"use client";

import { useEffect, useState } from "react";
import { Check, Flag, Flower2, Footprints, History, RefreshCw, type LucideIcon } from "lucide-react";
import { aiStoryCreationService as api } from "@/app/services/aiStoryCreationService";
import { useRegisterApprove } from "@/app/features/story-workflow/approveSlot";
import type { OutlineVersionDto } from "@/app/types/aiStory";

type BeatKey = "opening" | "development" | "ending";
const BEATS: [BeatKey, string, string, LucideIcon][] = [
  ["opening", "Mở đầu", "nhân vật, bối cảnh", Flag],
  ["development", "Diễn biến", "thử thách và cao trào", Footprints],
  ["ending", "Kết thúc", "cách giải quyết và bài học", Flower2],
];

type Props = {
  storyId: number;
  version: OutlineVersionDto | null;
  editable: boolean;
  /** Tab dàn ý đang được xem. Panel vẫn được dựng khi ẩn để nút duyệt trên thanh tiến trình không biến mất. */
  visible: boolean;
  onReveal: () => void;
  onApproved: () => void;
  onChanged: () => void;
};

const key = () => crypto.randomUUID();

export default function OutlinePanel({ storyId, version, editable, visible, onReveal, onApproved, onChanged }: Props) {
  const [draft, setDraft] = useState({ title: "", opening: "", development: "", ending: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (version) {
      setDraft({ title: version.title, opening: version.opening, development: version.development, ending: version.ending });
    }
  }, [version]);

  const dirty = !!version && (draft.title !== version.title || draft.opening !== version.opening || draft.development !== version.development || draft.ending !== version.ending);
  const incomplete = BEATS.some(([k]) => !draft[k].trim()) || !draft.title.trim();
  const run = async (fn: () => Promise<{ success: boolean; message: string }>, after: () => void) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    const r = await fn();
    setBusy(false);
    if (!r.success) setErr(r.message);
    else after();
  };

  const approve = () => {
    if (!version) return;
    void run(async () => {
      if (dirty) {
        const saved = await api.editOutline(storyId, version.versionNo, draft);
        if (!saved.success || !saved.data) return saved;
        return api.approveOutline(storyId, saved.data.versionNo, { approvalKey: key() });
      }
      return api.approveOutline(storyId, version.versionNo, { approvalKey: key() });
    }, onApproved);
  };

  // Nút duyệt nằm trên thanh tiến trình. Đang xem tab khác thì bấm sẽ đưa về tab dàn ý để xem trước khi duyệt.
  // Không có thanh tiến trình (ví dụ màn của Content Creator) thì tự vẽ nút duyệt bên dưới.
  const approveInBar = useRegisterApprove(editable && version ? {
    label: visible ? "Duyệt dàn ý và viết truyện" : "Xem dàn ý để duyệt",
    disabled: visible ? busy || incomplete : false,
    reason: visible && incomplete ? "Dàn ý cần có tiêu đề và đủ ba phần, kể cả kết thúc." : null,
    run: () => (visible ? approve() : onReveal()),
  } : null);

  if (!version) return <div className="pb"><p className="sub">Dàn ý sẽ xuất hiện ở đây khi AI viết xong.</p></div>;

  const save = () => run(() => api.editOutline(storyId, version.versionNo, draft), onChanged);
  const regenerate = () => run(() => api.regenerateOutline(storyId, version.versionNo, { operationKey: key() }), onChanged);

  return (
    <div className="pb">
      <div className="row"><span className="pill ai">Dàn ý bản {version.versionNo}</span>{dirty && <span className="pill wait">Chưa lưu</span>}</div>
      <label className="field"><span className="lbl">Tiêu đề</span>
        <input className="inp display" style={{ fontSize: 15, fontWeight: 700 }} disabled={!editable || busy} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
      <div className="beats">
        {BEATS.map(([k, label, hint, Icon]) => (
          <div key={k} className={`beat${k === "ending" ? " end" : ""}`}>
            <span className="dot"><Icon /></span>
            <label className="field"><span className="lbl">{label}<small>{hint}</small></span>
              <textarea className="inp" rows={3} disabled={!editable || busy} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} /></label>
          </div>
        ))}
      </div>
      <OutlineHistory storyId={storyId} current={version.versionNo} />
      {err && <div className="notice err" role="alert">{err}</div>}
      {editable && incomplete && <div className="notice warn">Dàn ý cần có tiêu đề và đủ ba phần, kể cả kết thúc.</div>}
      {editable && (
        <>
          <div className="row">
            <button className="btn btn-s grow btn-c" disabled={busy || !dirty} onClick={() => void save()}>Lưu chỉnh sửa</button>
            <button className="btn btn-s grow btn-c" disabled={busy} onClick={() => void regenerate()}><RefreshCw className="ic" />Viết lại</button>
          </div>
          {approveInBar
            ? <p className="hint">Hài lòng với dàn ý thì bấm dấu ✓ trên thanh tiến trình, AI sẽ viết truyện.</p>
            : <button className="btn btn-ok btn-c" disabled={busy || incomplete} onClick={() => void approve()}><Check className="ic" />Duyệt dàn ý và viết truyện</button>}
        </>
      )}
    </div>
  );
}

/** Các bản dàn ý trước (AI viết lại, phụ huynh sửa) để đối chiếu; chỉ xem, không khôi phục. */
function OutlineHistory({ storyId, current }: { storyId: number; current: number }) {
  const [versions, setVersions] = useState<OutlineVersionDto[] | null>(null);
  const [open, setOpen] = useState<OutlineVersionDto | null>(null);
  const load = () => { if (versions === null) void api.getOutlineVersions(storyId).then((r) => setVersions(r.data ?? [])); };
  return (
    <details onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) load(); }}>
      <summary><History className="ic" /> Các bản dàn ý trước</summary>
      {versions === null && <p className="sub">Đang tải…</p>}
      {versions?.filter((v) => v.versionNo !== current).length === 0 && <p className="sub">Chưa có bản nào khác.</p>}
      <div className="sec" style={{ gap: 4, marginTop: 6 }}>
        {versions?.filter((v) => v.versionNo !== current).sort((a, b) => b.versionNo - a.versionNo).map((v) => (
          <button key={v.versionNo} type="button" className={`chip${open?.versionNo === v.versionNo ? " on" : ""}`} style={{ width: "fit-content" }} onClick={() => setOpen(open?.versionNo === v.versionNo ? null : v)}>
            Bản {v.versionNo} · {new Date(v.createdAt).toLocaleString("vi-VN")}
          </button>
        ))}
        {open && (
          <div className="notice" style={{ whiteSpace: "pre-wrap" }}>
            <b>{open.title}</b>{["", open.opening, open.development, open.ending].join("\n\n")}
          </div>
        )}
      </div>
    </details>
  );
}
