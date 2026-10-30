"use client";

import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";
import { useFlash } from "@/app/lib/useFlash";
import { childProfileService } from "@/app/services/childProfileService";
import type { ChildProfile } from "@/app/types/childProfile";
import LearningHistory from "@/app/features/adaptive/LearningHistory";
import LearningForm, { learningFrom, learningRequest, type LearningValue } from "./LearningForm";
import { profileLifecycleService } from '@/app/services/profileLifecycleService';

/** Bước 1.3 — sửa hồ sơ học tập. Owner hoặc người có quyền "Sửa mức đọc". */
export default function LearningTab({ child, canEdit, onSaved }: { child: ChildProfile; canEdit: boolean; onSaved: () => void }) {
  const [value, setValue] = useState<LearningValue | null>(null);
  const [exists, setExists] = useState(false);
  const [saved, setSaved] = useState("");
  const [historyKey, setHistoryKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saved2, flashSaved] = useFlash();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    setValue(null);
    void childProfileService.getLearningProfile(child.id).then((r) => {
      if (!alive) return;
      setExists(r.success && !!r.data);
      const v = learningFrom(r.success ? r.data : null, child.ageBand);
      setValue(v);
      setSaved(JSON.stringify(v));
    });
    return () => { alive = false; };
  }, [child.id, child.ageBand]);

  const save = async () => {
    if (!value) return;
    setBusy(true);
    setNote(null);
    const r = exists ? await childProfileService.setLearningProfile(child.id, learningRequest(value)) : await profileLifecycleService.createLearning(child.id, learningRequest(value));
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? "Đã lưu hồ sơ học tập. Truyện tạo sau sẽ theo cấu hình mới." : r.message || "Không lưu được." });
    if (r.success) {
      setHistoryKey((k) => k + 1);
      flashSaved();
      setExists(true);
      setSaved(JSON.stringify(value));
      onSaved();
    }
  };

  // Chỉ cho lưu khi có thay đổi so với lần tải/lưu gần nhất, hoặc khi bé chưa có hồ sơ học tập.
  const dirty = !exists || JSON.stringify(value) !== saved;

  if (!value) return <p className="sub">Đang tải hồ sơ học tập…</p>;
  return (
    <div className="sec" style={{ gap: 16 }}>
      <div>
        <p className="sub">{exists ? `AI dựa vào đây để viết truyện vừa sức ${child.nickname}.` : `${child.nickname} chưa có hồ sơ học tập. Lưu để có thể kích hoạt hồ sơ.`}</p>
      </div>
      <LearningForm value={value} onChange={setValue} disabled={!canEdit} ageBand={child.ageBand} />
      {!canEdit && <p className="sub">Bạn chưa có quyền sửa mức đọc của bé. Hãy xin quyền ở tab Người giám sát.</p>}
      {canEdit && <button className={`btn btn-p${saved2 ? " saved" : ""}`} style={{ width: "fit-content" }} disabled={busy || !dirty} onClick={() => void save()}>{saved2 ? <Check className="ic" /> : <Save className="ic" />}{busy ? "Đang lưu…" : saved2 ? "Đã lưu" : "Lưu hồ sơ học tập"}</button>}
      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
      {child.status === "Active" && <LearningHistory child={child} refreshKey={historyKey} />}
    </div>
  );
}
