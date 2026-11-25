"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/app/lib/toast";
import { eventService } from "@/app/services/eventService";
import { staffService } from "@/app/services/staffService";
import type { EventDetailDto } from "@/app/types/event";
import type { StaffAccount } from "@/app/types/staff";

export default function EventModeratorAssignment({ detail, onRefresh }: { detail: EventDetailDto; onRefresh: () => void }) {
  const [moderators, setModerators] = useState<StaffAccount[]>([]);
  const [selection, setSelection] = useState(detail.leadModeratorId ?? 0);
  const [assistantIds, setAssistantIds] = useState(detail.assistantModeratorIds ?? []);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const currentModerator = moderators.find((moderator) => moderator.userId === detail.leadModeratorId);
  const selectedAssistants = assistantIds.filter((id) => id !== selection);
  const changed = selection !== detail.leadModeratorId || selectedAssistants.length !== (detail.assistantModeratorIds?.length ?? 0) ||
    selectedAssistants.some((id) => !detail.assistantModeratorIds?.includes(id));

  useEffect(() => {
    let active = true;
    void staffService.staff("Moderator").then((response) => {
      if (!active) return;
      if (response.success) {
        const list = response.data ?? [];
        setModerators(list);
        setSelection((cur) => (cur > 0 && list.some((m) => m.userId === cur && m.status === "active") ? cur : 0));
      } else setLoadError(response.message || "Không tải được danh sách Moderator.");
    });
    return () => { active = false; };
  }, []);

  async function save() {
    if (busy || selection <= 0) return;
    setBusy(true);
    const response = await eventService.updateLeadModerator(detail.id, selection, selectedAssistants);
    setBusy(false);
    if (!response.success) {
      showToast(response.message || "Không lưu được phân công Moderator.", "err");
      return;
    }
    showToast("Đã cập nhật phân công Moderator.", "ok");
    onRefresh();
  }

  return (
    <section className="ev-card">
      <h3 className="display">Phân công Moderator</h3>
      <p className="sub">Phụ trách chính hiện tại {currentModerator?.fullName || (detail.leadModeratorId ? `#${detail.leadModeratorId}` : "chưa xác định")}</p>
      {loadError && <p role="alert" className="sub ev-warn-text">{loadError}</p>}
      <label className="ev-field">
        <span>Moderator phụ trách chính</span>
        <select className="inp" value={selection} onChange={(event) => setSelection(Number(event.target.value))}>
          <option value={0}>Chọn Moderator</option>
          {moderators.filter((moderator) => moderator.status === "active").map((moderator) => (
            <option key={moderator.userId} value={moderator.userId}>{moderator.fullName}</option>
          ))}
        </select>
      </label>
      <fieldset className="ev-field">
        <legend>Moderator hỗ trợ</legend>
        {moderators.filter((moderator) => moderator.userId !== selection &&
          (moderator.status === "active" || assistantIds.includes(moderator.userId))).map((moderator) => (
          <label className="row" key={moderator.userId}>
            <input type="checkbox" checked={assistantIds.includes(moderator.userId)} disabled={busy}
              onChange={(event) => setAssistantIds((previous) => event.target.checked
                ? [...previous, moderator.userId] : previous.filter((id) => id !== moderator.userId))} />
            {moderator.fullName}{moderator.status !== "active" && " (ngừng hoạt động)"}
          </label>
        ))}
        {assistantIds.filter((id) => !moderators.some((moderator) => moderator.userId === id)).map((id) => (
          <label className="row" key={id}>
            <input type="checkbox" checked disabled={busy} onChange={() => setAssistantIds((previous) => previous.filter((item) => item !== id))} />
            Moderator #{id}
          </label>
        ))}
      </fieldset>
      {selection > 0 && changed && (
        <button type="button" className="btn btn-p" disabled={busy} onClick={() => void save()}>Lưu phân công</button>
      )}
    </section>
  );
}
