"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Lightbulb, RotateCcw, Save } from "lucide-react";
import { showToast } from "@/app/lib/toast";
import { useFlash } from "@/app/lib/useFlash";
import { readingScheduleService } from "@/app/services/readingScheduleService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { ReadingSchedule } from "@/app/types/readingSchedule";
import { scheduleFrom, scheduleRequest, sectionOfError, type ScheduleValue } from "./readingScheduleForm";
import TimeHabitsSections, { type SectionError } from "./TimeHabitsSections";

/** Thời gian & thói quen của bé: khung giờ đọc, giờ ngủ, nghỉ mắt, giới hạn màn hình, nhắc đọc, mục tiêu tuần. Chủ hồ sơ sửa được. */
export default function TimeHabitsTab({ child, canEdit }: { child: ChildProfile; canEdit: boolean }) {
  const [dto, setDto] = useState<ReadingSchedule | null>(null);
  const [value, setValue] = useState<ScheduleValue | null>(null);
  const [saved, setSaved] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SectionError>(null);
  const [savedFlash, flashSaved] = useFlash();

  const apply = useCallback((next: ReadingSchedule) => {
    const v = scheduleFrom(next);
    setDto(next);
    setValue(v);
    setSaved(JSON.stringify(v));
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoadError(null);
    setDto(null);
    setValue(null);
    setError(null);
    const r = await readingScheduleService.get(child.id, signal);
    if (signal?.aborted) return;
    if (r.success && r.data) apply(r.data);
    else setLoadError(r.message || "Không tải được cấu hình thời gian & thói quen.");
  }, [child.id, apply]);

  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const save = async () => {
    if (!value) return;
    setBusy(true);
    setError(null);
    const r = await readingScheduleService.set(child.id, scheduleRequest(value));
    setBusy(false);
    if (!r.success || !r.data) {
      const text = r.message || "Không lưu được cấu hình.";
      setError({ section: sectionOfError(text), text });
      return;
    }
    apply(r.data);
    flashSaved();
    showToast(`Đã lưu thời gian & thói quen của ${child.nickname}. Có hiệu lực ngay.`, "ok");
  };

  if (loadError) {
    return (
      <div className="sec" style={{ gap: 10 }}>
        <div className="notice err" role="alert" data-inline-notice>{loadError}</div>
        <button type="button" className="btn btn-s" style={{ width: "fit-content" }} onClick={() => void load()}><RotateCcw className="ic" />Thử lại</button>
      </div>
    );
  }
  if (!value || !dto) return <p className="sub">Đang tải thời gian & thói quen…</p>;

  // Chưa lưu lần nào: form đang điền sẵn gợi ý theo tuổi, nên cho lưu ngay dù chưa sửa gì.
  const dirty = dto.isSuggested || JSON.stringify(value) !== saved;
  return (
    <div className="sec time-habits" style={{ gap: 16 }}>
      {dto.isSuggested && (
        <div className="notice ok" role="status" data-inline-notice>
          <Lightbulb className="ic" aria-hidden /><span>Đây là gợi ý theo độ tuổi của {child.nickname}, chưa được lưu. Chỉnh theo ý bạn rồi bấm Lưu.</span>
        </div>
      )}
      <TimeHabitsSections value={value} onChange={(v) => { setValue(v); setError(null); }} disabled={!canEdit || busy}
        habit={dto.habit} savedGoalDays={dto.weeklyGoalDays} error={error} />
      {error?.section === "general" && <div className="notice err" role="alert" data-inline-notice>{error.text}</div>}
      {canEdit && (dirty || savedFlash) && (
        <button type="button" className={`btn btn-p${savedFlash ? " saved" : ""}`} style={{ width: "fit-content" }} disabled={busy || !dirty} onClick={() => void save()}>
          {savedFlash ? <Check className="ic" /> : <Save className="ic" />}{busy ? "Đang lưu…" : savedFlash ? "Đã lưu" : "Lưu thời gian & thói quen"}
        </button>
      )}
      {!canEdit && <p className="sub">Chỉ người quản lý chính của bé mới sửa được phần này.</p>}
    </div>
  );
}
