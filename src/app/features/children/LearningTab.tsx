"use client";

import { useEffect, useState } from "react";
import { Check, Save, Trash2 } from "lucide-react";
import IconButton from "@/app/components/IconButton";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { useFlash } from "@/app/lib/useFlash";
import { childProfileService } from "@/app/services/childProfileService";
import type { ChildProfile } from "@/app/types/childProfile";
import LearningForm, { learningFrom, learningRequest, type LearningValue } from "./LearningForm";
import { profileLifecycleService } from '@/app/services/profileLifecycleService';

/** Bước 1.3 — sửa hồ sơ học tập. Owner hoặc người có quyền "Sửa mức đọc". */
export default function LearningTab({ child, canEdit, onSaved }: { child: ChildProfile; canEdit: boolean; onSaved: () => void }) {
  const [value, setValue] = useState<LearningValue | null>(null);
  const [exists, setExists] = useState(false);
  const [saved, setSaved] = useState("");
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
      flashSaved();
      setExists(true);
      setSaved(JSON.stringify(value));
      onSaved();
    }
  };

  // Xoá hồ sơ học tập (chỉ Owner): bé quay về trạng thái chưa có, truyện tạo sau dùng mức đọc mặc định theo tuổi.
  const remove = async () => {
    if (!await confirmDialog(`Xoá hồ sơ học tập của ${child.nickname}? Mức đọc, chế độ đọc, mục tiêu đọc hiểu và các chủ đề yêu thích sẽ bị xoá và không khôi phục được. Truyện tạo sau sẽ dùng mức đọc mặc định theo tuổi cho tới khi bạn thiết lập lại.`)) return;
    setBusy(true);
    setNote(null);
    const r = await profileLifecycleService.removeLearning(child.id);
    setBusy(false);
    // 404: hồ sơ học tập đã không còn (có thể đã bị xoá ở nơi khác) nên vẫn đưa về trạng thái chưa có.
    if (!r.success && r.status !== 404) {
      showToast(r.status === 403 ? "Chỉ người quản lý chính của bé mới xoá được hồ sơ học tập." : "Chưa xoá được hồ sơ học tập. Vui lòng thử lại.", "err");
      return;
    }
    const empty = learningFrom(null, child.ageBand);
    setExists(false);
    setValue(empty);
    setSaved(JSON.stringify(empty));
    showToast(`Đã xoá hồ sơ học tập của ${child.nickname}.`, "ok");
    onSaved();
  };

  // Chỉ cho lưu khi có thay đổi so với lần tải/lưu gần nhất, hoặc khi bé chưa có hồ sơ học tập.
  const dirty = !exists || JSON.stringify(value) !== saved;

  if (!value) return <p className="sub">Đang tải hồ sơ học tập…</p>;
  return (
    <div className="sec" style={{ gap: 16 }}>
      <div style={{ position: "relative" }}>
        <LearningForm value={value} onChange={setValue} disabled={!canEdit} ageBand={child.ageBand} />
      </div>
      {canEdit && (dirty || saved2 || exists) && (
        <div className="row" style={{ gap: 10 }}>
          {(dirty || saved2) && <button className={`btn btn-p${saved2 ? " saved" : ""}`} style={{ width: "fit-content" }} disabled={busy || !dirty} onClick={() => void save()}>{saved2 ? <Check className="ic" /> : <Save className="ic" />}{busy ? "Đang lưu…" : saved2 ? "Đã lưu" : "Lưu hồ sơ học tập"}</button>}
          <span className="grow" />
          {exists && <IconButton icon={Trash2} className="btn btn-no" label="Xoá hồ sơ học tập" disabled={busy} onClick={() => void remove()} />}
        </div>
      )}
      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
    </div>
  );
}
