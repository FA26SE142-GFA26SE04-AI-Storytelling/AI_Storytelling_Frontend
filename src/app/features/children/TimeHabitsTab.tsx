"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Lightbulb, RotateCcw, Save } from "lucide-react";
import { showToast } from "@/app/lib/toast";
import { useFlash } from "@/app/lib/useFlash";
import { readingScheduleService } from "@/app/services/readingScheduleService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { ReadingSchedule } from "@/app/types/readingSchedule";
import {
  ALL_GROUPS, changedGroups, groupsText, saveLabel, scheduleFrom, scheduleRequest, sectionOfError,
  type ScheduleGroup, type ScheduleValue,
} from "./readingScheduleForm";
import TimeHabitsSections, { type SectionError } from "./TimeHabitsSections";

/** Thời gian & thói quen của bé: khung giờ đọc, giờ ngủ, nghỉ mắt, giới hạn màn hình, nhắc đọc, mục tiêu tuần. Chủ hồ sơ sửa được. */
export default function TimeHabitsTab({ child, canEdit }: { child: ChildProfile; canEdit: boolean }) {
  const [dto, setDto] = useState<ReadingSchedule | null>(null);
  const [value, setValue] = useState<ScheduleValue | null>(null);
  const [saved, setSaved] = useState<ScheduleValue | null>(null);
  // Nhóm vừa lưu, để thanh lưu báo đúng "đã lưu giới hạn thời gian / thói quen đọc".
  const [justSaved, setJustSaved] = useState<readonly ScheduleGroup[]>(ALL_GROUPS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SectionError>(null);
  const [savedFlash, flashSaved] = useFlash();

  const apply = useCallback((next: ReadingSchedule) => {
    const v = scheduleFrom(next);
    setDto(next);
    setValue(v);
    setSaved(v);
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

  const save = async (groups: readonly ScheduleGroup[]) => {
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
    setJustSaved(groups);
    flashSaved();
    showToast(`Đã lưu ${groupsText(groups)} của ${child.nickname}. Có hiệu lực ngay.`, "ok");
  };

  if (loadError) {
    return (
      <div className="sec" style={{ gap: 10 }}>
        <div className="notice err" role="alert" data-inline-notice>{loadError}</div>
        <button type="button" className="btn btn-s" style={{ width: "fit-content" }} onClick={() => void load()}><RotateCcw className="ic" />Thử lại</button>
      </div>
    );
  }
  if (!value || !dto || !saved) return <p className="sub">Đang tải thời gian & thói quen…</p>;

  // Chưa lưu lần nào: form đang điền sẵn gợi ý theo tuổi, nên cho lưu ngay dù chưa sửa gì (lưu cả hai nhóm).
  const edited = changedGroups(value, saved);
  const hasEdits = edited.length > 0;
  const pending: readonly ScheduleGroup[] = dto.isSuggested ? ALL_GROUPS : edited;
  const dirty = pending.length > 0;

  return (
    <div className="sec time-habits">
      {dto.isSuggested && (
        <div className="th-suggest-banner" role="status" data-inline-notice>
          <span className="th-suggest-ic" aria-hidden><Lightbulb className="ic" /></span>
          <div className="grow">
            <b>Gợi ý theo độ tuổi của {child.nickname}</b>
            <p className="sub">Cấu hình này chưa được lưu. Bạn có thể điều chỉnh theo ý muốn rồi bấm Lưu.</p>
          </div>
        </div>
      )}

      <TimeHabitsSections
        value={value}
        onChange={(v) => { setValue(v); setError(null); }}
        disabled={!canEdit || busy}
        habit={dto.habit}
        savedGoalDays={dto.weeklyGoalDays}
        error={error}
      />

      {error?.section === "general" && (
        <div className="notice err" role="alert" data-inline-notice>{error.text}</div>
      )}

      {canEdit && (dirty || savedFlash) && (
        <div className="th-save-bar">
          <span className={`th-save-hint${savedFlash ? " is-saved" : hasEdits ? " is-dirty" : ""}`}>
            {savedFlash
              ? `Đã lưu ${groupsText(justSaved)} và áp dụng ngay cho bé.`
              : hasEdits
                ? `Chưa lưu: ${groupsText(edited)}.`
                : `Áp dụng gợi ý cho ${child.nickname}?`}
          </span>
          <button
            type="button"
            className={`btn btn-p${savedFlash ? " saved" : ""}`}
            disabled={busy || !dirty}
            onClick={() => void save(pending)}
          >
            {savedFlash ? <Check className="ic" /> : <Save className="ic" />}
            {busy ? "Đang lưu…" : savedFlash ? "Đã lưu" : saveLabel(pending)}
          </button>
        </div>
      )}

      {!canEdit && <p className="sub">Chỉ người quản lý chính của bé mới sửa được phần này.</p>}
    </div>
  );
}
