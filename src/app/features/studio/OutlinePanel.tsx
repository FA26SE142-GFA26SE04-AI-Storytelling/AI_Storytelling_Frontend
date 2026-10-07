"use client";

import { useEffect, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import { aiStoryCreationService as api } from "@/app/services/aiStoryCreationService";
import type { OutlineVersionDto } from "@/app/types/aiStory";

type Props = {
  storyId: number;
  version: OutlineVersionDto | null;
  editable: boolean;
  onApproved: () => void;
  onChanged: () => void;
};

const key = () => crypto.randomUUID();

export default function OutlinePanel({ storyId, version, editable, onApproved, onChanged }: Props) {
  const [draft, setDraft] = useState({ title: "", opening: "", development: "", ending: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (version) {
      setDraft({ title: version.title, opening: version.opening, development: version.development, ending: version.ending });
    }
  }, [version]);

  if (!version) return <div className="pb"><p className="sub">Dàn ý sẽ xuất hiện ở đây khi AI viết xong.</p></div>;

  const dirty = draft.title !== version.title || draft.opening !== version.opening || draft.development !== version.development || draft.ending !== version.ending;
  const run = async (fn: () => Promise<{ success: boolean; message: string }>, after: () => void) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    const r = await fn();
    setBusy(false);
    if (!r.success) setErr(r.message);
    else after();
  };

  const save = () => run(() => api.editOutline(storyId, version.versionNo, draft), onChanged);
  const regenerate = () => run(() => api.regenerateOutline(storyId, version.versionNo, { operationKey: key() }), onChanged);
  const approve = () => run(async () => {
    if (dirty) {
      const saved = await api.editOutline(storyId, version.versionNo, draft);
      if (!saved.success || !saved.data) return saved;
      return api.approveOutline(storyId, saved.data.versionNo, { approvalKey: key() });
    }
    return api.approveOutline(storyId, version.versionNo, { approvalKey: key() });
  }, onApproved);

  const field = (k: "opening" | "development" | "ending", label: string) => (
    <label className="field"><span className="lbl">{label}</span>
      <textarea className="inp" rows={4} disabled={!editable || busy} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} /></label>
  );

  return (
    <div className="pb">
      <span className="pill ai" style={{ width: "fit-content" }}>Dàn ý bản {version.versionNo}</span>
      <label className="field"><span className="lbl">Tiêu đề</span>
        <input className="inp" disabled={!editable || busy} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
      {field("opening", "Mở đầu")}
      {field("development", "Diễn biến")}
      {field("ending", "Kết thúc")}
      {err && <div className="notice err" role="alert">{err}</div>}
      {editable && (
        <>
          <button className="btn btn-p btn-c" disabled={busy} onClick={() => void approve()}><Check className="ic" />Duyệt dàn ý và viết truyện</button>
          <div className="row">
            <button className="btn btn-s grow btn-c" disabled={busy || !dirty} onClick={() => void save()}>Lưu chỉnh sửa</button>
            <button className="btn btn-s grow btn-c" disabled={busy} onClick={() => void regenerate()}><RefreshCw className="ic" />Viết lại</button>
          </div>
        </>
      )}
    </div>
  );
}
