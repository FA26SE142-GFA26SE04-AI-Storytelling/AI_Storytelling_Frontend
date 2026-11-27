"use client";

import { useEffect, useState } from "react";
import Dialog from "@/app/components/Dialog";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { eventService } from "@/app/services/eventService";
import type { ApiResponse } from "@/app/types/auth";
import type { EventAppealDto, EventAwardCandidateDto, EventRewardRecipientDto } from "@/app/types/event";
import { AWARD_STATUS_LABEL, REWARD_TYPE_LABEL, type EventAwardSlotDto } from "@/app/types/event";
import { awardGroupKey } from "./eventRewards";
import { formatVnDateTime } from "./eventTime";

type Props = {
  awards: EventAwardSlotDto[];
  expanded: boolean;
  busy: boolean;
  txCodes: Record<number, string>;
  onCodeChange: (id: number, value: string) => void;
  onFulfill: (id: number) => void;
  canViewRecipient?: boolean;
  canEditAssignment?: boolean;
  canRevoke?: boolean;
  /** Đơn khiếu nại đang mở, để kết luận "Chấp nhận" cùng lúc thu hồi. */
  openAppeals?: EventAppealDto[];
  onAssignmentSaved?: () => void;
};

function RecipientDialog({ awardId, onClose }: { awardId: number; onClose: () => void }) {
  const [result, setResult] = useState<ApiResponse<EventRewardRecipientDto> | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    void eventService.rewardRecipient(awardId, abort.signal).then((response) => {
      if (!abort.signal.aborted) setResult(response);
    });
    return () => abort.abort();
  }, [awardId]);

  const data = result?.success ? result.data : null;
  const rows = data ? [
    ["Họ tên người nhận", data.recipientName],
    ["Số điện thoại", data.phoneNumber],
    ["Địa chỉ nhận quà", data.shippingAddress],
    ["Ngân hàng", data.bankName],
    ["Số tài khoản", data.bankAccountNumber],
    ["Tên chủ tài khoản", data.bankAccountHolder],
    ["Thông tin tài khoản đã lưu", data.legacyBankAccountText],
  ].filter(([, value]) => Boolean(value)) : [];

  return (
    <Dialog title="Thông tin nhận giải" onClose={onClose}>
      {!result && <p role="status">Đang tải thông tin…</p>}
      {result && !data && <p className="notice err" role="alert">{result.message || "Không tải được thông tin nhận giải."}</p>}
      {data?.isLegacyPlaintext && <p className="notice warn">Thông tin cũ chưa được mã hóa.</p>}
      {rows.length > 0 && <dl className="sec">{rows.map(([label, value]) => (
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
      ))}</dl>}
    </Dialog>
  );
}

function candidateMetricText(c: EventAwardCandidateDto): string {
  const parts: string[] = [];
  if (c.rubricScore != null) parts.push(`Điểm chấm: ${c.rubricScore}`);
  if (c.averageStars != null) parts.push(`${c.averageStars.toFixed(2)} ★ (${c.validVoteCount ?? 0} phiếu)`);
  if (c.completedAt) parts.push(`Hoàn thành ${formatVnDateTime(c.completedAt)}`);
  return parts.join(" · ");
}

function EditAwardAssignmentDialog({
  award,
  onClose,
  onSaved,
}: {
  award: EventAwardSlotDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [result, setResult] = useState<ApiResponse<EventAwardCandidateDto[]> | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>(award.participationId != null ? String(award.participationId) : "");
  const [reason, setReason] = useState(award.manualAssignmentNote ?? "");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    void eventService.awardCandidates(award.id, abort.signal).then((response) => {
      if (!abort.signal.aborted) setResult(response);
    });
    return () => abort.abort();
  }, [award.id]);

  const candidates = result?.success ? (result.data ?? []) : [];

  const handleSave = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setErrorMsg("Vui lòng nhập lý do điều chỉnh người nhận giải.");
      return;
    }
    setErrorMsg("");
    setSaving(true);
    const participationId = selectedValue === "" ? null : Number(selectedValue);
    const res = await eventService.manualAssignAward(award.id, { participationId, reason: trimmedReason });
    setSaving(false);
    if (!res.success) {
      const msg = res.message || "Không lưu được điều chỉnh người nhận giải.";
      setErrorMsg(msg);
      showToast(msg, "err");
      return;
    }
    showToast(participationId == null ? "Đã bỏ trống suất giải thưởng." : "Đã cập nhật người nhận giải.", "ok");
    onSaved();
    onClose();
  };

  return (
    <Dialog title="Chỉnh người nhận giải" onClose={onClose}>
      <div className="ev-award-edit-form">
        <p className="sub" style={{ margin: 0 }}>
          <strong>{award.rankOrTier}</strong> · Suất #{award.slotIndex} — {award.rewardName}
        </p>

        {!result && <p role="status">Đang tải danh sách ứng viên đủ điều kiện…</p>}
        {result && !result.success && (
          <p className="notice err" role="alert">{result.message || "Không tải được danh sách ứng viên."}</p>
        )}

        {result?.success && (
          <fieldset className="ev-award-candidates">
            <legend className="sub">Chọn người nhận giải (theo thứ tự xếp hạng)</legend>
            <label className={`ev-award-candidate-item${selectedValue === "" ? " is-selected" : ""}`}>
              <input
                type="radio"
                name={`award-candidate-${award.id}`}
                value=""
                checked={selectedValue === ""}
                onChange={() => setSelectedValue("")}
              />
              <div>
                <strong>Bỏ trống suất</strong>
                <small>Không gán người nhận cho suất này khi hệ thống tính lại.</small>
              </div>
            </label>
            {candidates.length === 0 && (
              <p className="sub" style={{ margin: "4px 0 0" }}>
                Chưa có người tham gia nào đã xác minh đạt cho nguồn xếp hạng này.
              </p>
            )}
            {candidates.map((c) => {
              const heldElsewhere = c.currentAwardId != null && c.currentAwardId !== award.id;
              const metric = candidateMetricText(c);
              const val = String(c.participationId);
              return (
                <label
                  key={c.participationId}
                  className={`ev-award-candidate-item${selectedValue === val ? " is-selected" : ""}${heldElsewhere ? " is-disabled" : ""}`}
                >
                  <input
                    type="radio"
                    name={`award-candidate-${award.id}`}
                    value={val}
                    checked={selectedValue === val}
                    disabled={heldElsewhere}
                    onChange={() => setSelectedValue(val)}
                  />
                  <div>
                    <strong>#{c.rank} · {c.displayName}</strong>
                    {c.storyTitle && <small>Truyện: {c.storyTitle}</small>}
                    {metric && <small>{metric}</small>}
                    {c.currentAwardRankOrTier && (
                      <small className="ev-award-held-note">
                        {heldElsewhere ? `Đang giữ suất khác: ${c.currentAwardRankOrTier}` : `Đang giữ suất này`}
                      </small>
                    )}
                  </div>
                </label>
              );
            })}
          </fieldset>
        )}

        <label className="ev-field">
          <span className="sub">Lý do điều chỉnh (bắt buộc, tối đa 500 ký tự)</span>
          <textarea
            className="inp"
            rows={3}
            maxLength={500}
            placeholder="Ví dụ: Điều chỉnh theo biên bản rà soát của BTC…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>

        {errorMsg && <p className="notice err" role="alert">{errorMsg}</p>}

        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-g" disabled={saving} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="btn btn-p" disabled={saving || !result?.success || !reason.trim()} onClick={() => void handleSave()}>
            {saving ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function renderWinnerCell(group: EventAwardSlotDto[], expanded: boolean) {
  if (expanded || group.length === 1) {
    const award = group[0];
    return (
      <div className="ev-award-winner">
        {award.winnerName ? (
          <>
            <strong>{award.winnerName}</strong>
            {award.winnerStoryTitle && <small>{award.winnerStoryTitle}</small>}
          </>
        ) : award.participationId != null ? (
          <strong>Hồ sơ #{award.participationId}</strong>
        ) : (
          <span className="sub">Chưa gán</span>
        )}
        {award.isManualAssignment && (
          <div className="ev-award-manual">
            <span className="ev-award-manual-badge">Chỉnh tay</span>
            {award.manualAssignmentNote && <small>{award.manualAssignmentNote}</small>}
          </div>
        )}
      </div>
    );
  }

  const assigned = group.filter((item) => item.winnerName || item.participationId != null);
  const hasManual = group.some((item) => item.isManualAssignment);
  if (assigned.length === 0) {
    return (
      <div className="ev-award-winner">
        <span className="sub">Chưa gán</span>
        {hasManual && (
          <div className="ev-award-manual">
            <span className="ev-award-manual-badge">Chỉnh tay</span>
          </div>
        )}
      </div>
    );
  }
  const names = assigned.map((item) => item.winnerName || `Hồ sơ #${item.participationId}`);
  const preview = names.slice(0, 2).join(", ") + (names.length > 2 ? ` (+${names.length - 2})` : "");
  return (
    <div className="ev-award-winner">
      <strong>{preview}</strong>
      <small>{assigned.length}/{group.length} suất đã gán</small>
      {hasManual && (
        <div className="ev-award-manual">
          <span className="ev-award-manual-badge">Chỉnh tay</span>
        </div>
      )}
    </div>
  );
}

export function RevokeAwardDialog({
  award,
  openAppeals,
  onClose,
  onSaved,
}: {
  award: EventAwardSlotDto;
  openAppeals: EventAppealDto[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [result, setResult] = useState<ApiResponse<EventAwardCandidateDto[]> | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [appealValue, setAppealValue] = useState<string>(() => {
    const targeted = openAppeals.find((a) => a.targetAwardId === award.id);
    return targeted ? String(targeted.id) : "";
  });
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    void eventService.awardCandidates(award.id, abort.signal).then((response) => {
      if (!abort.signal.aborted) setResult(response);
    });
    return () => abort.abort();
  }, [award.id]);

  const candidates = result?.success ? (result.data ?? []) : [];
  const availableAppeals = openAppeals.filter((appeal) => appeal.targetAwardId == null || appeal.targetAwardId === award.id);
  const handleRevoke = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setErrorMsg("Vui lòng nhập lý do thu hồi suất giải thưởng.");
      return;
    }
    const ok = await confirmDialog(
      `Thu hồi suất ${award.rankOrTier} (#${award.slotIndex}) của ${award.winnerName || "người nhận hiện tại"}? Hành động này sẽ gửi thông báo thu hồi kèm lý do.`,
    );
    if (!ok) return;

    setErrorMsg("");
    setSaving(true);
    const replacementParticipationId = selectedValue === "" ? null : Number(selectedValue);
    const appealId = availableAppeals.find((appeal) => String(appeal.id) === appealValue)?.id ?? null;
    const res = await eventService.revokeAward(award.id, { reason: trimmedReason, replacementParticipationId, appealId });
    setSaving(false);
    if (!res.success) {
      const msg = res.message || "Không thu hồi được suất giải thưởng.";
      setErrorMsg(msg);
      showToast(msg, "err");
      return;
    }
    showToast(
      replacementParticipationId != null
        ? "Đã thu hồi suất giải và gán người thay thế."
        : "Đã thu hồi suất giải và ghi nhận hoàn ngân sách.",
      "ok",
    );
    onSaved();
    onClose();
  };

  return (
    <Dialog title="Thu hồi suất giải thưởng" onClose={onClose}>
      <div className="ev-award-edit-form">
        <p className="sub" style={{ margin: 0 }}>
          <strong>{award.rankOrTier}</strong> · Suất #{award.slotIndex} — {award.rewardName}
          {award.winnerName ? ` (hiện tại: ${award.winnerName})` : ""}
        </p>

        {!result && <p role="status">Đang tải danh sách ứng viên thay thế…</p>}
        {result && !result.success && (
          <p className="notice err" role="alert">{result.message || "Không tải được danh sách ứng viên."}</p>
        )}

        {result?.success && (
          <fieldset className="ev-award-candidates">
            <legend className="sub">Chọn người thay thế (hoặc để trống)</legend>
            <label className={`ev-award-candidate-item${selectedValue === "" ? " is-selected" : ""}`}>
              <input
                type="radio"
                name={`revoke-replacement-${award.id}`}
                value=""
                checked={selectedValue === ""}
                onChange={() => setSelectedValue("")}
              />
              <div>
                <strong>Không gán người thay</strong>
                <small>Ghi nhận hoàn ngân sách của suất giải.</small>
              </div>
            </label>
            {candidates.map((c) => {
              const isCurrent = c.participationId === award.participationId;
              const heldElsewhere = c.currentAwardId != null && c.currentAwardId !== award.id;
              const disabled = isCurrent || heldElsewhere;
              const metric = candidateMetricText(c);
              const val = String(c.participationId);
              return (
                <label
                  key={c.participationId}
                  className={`ev-award-candidate-item${selectedValue === val ? " is-selected" : ""}${disabled ? " is-disabled" : ""}`}
                >
                  <input
                    type="radio"
                    name={`revoke-replacement-${award.id}`}
                    value={val}
                    checked={selectedValue === val}
                    disabled={disabled}
                    onChange={() => setSelectedValue(val)}
                  />
                  <div>
                    <strong>#{c.rank} · {c.displayName}</strong>
                    {c.storyTitle && <small>Truyện: {c.storyTitle}</small>}
                    {metric && <small>{metric}</small>}
                    {isCurrent && <small className="ev-award-held-note">Đang bị thu hồi suất này</small>}
                    {!isCurrent && heldElsewhere && c.currentAwardRankOrTier && (
                      <small className="ev-award-held-note">Đang giữ suất khác: {c.currentAwardRankOrTier}</small>
                    )}
                  </div>
                </label>
              );
            })}
          </fieldset>
        )}

        {availableAppeals.length > 0 && (
          <label className="ev-field">
            <span className="sub">Chấp nhận đơn khiếu nại cùng lúc (dùng được cả sau hạn khiếu nại)</span>
            <select className="inp" value={appealValue} onChange={(e) => setAppealValue(e.target.value)}>
              <option value="">Không gắn đơn khiếu nại</option>
              {availableAppeals.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  Đơn #{a.id}{a.targetAwardLabel ? ` · ${a.targetAwardLabel}` : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="ev-field">
          <span className="sub">Lý do thu hồi (bắt buộc, tối đa 500 ký tự)</span>
          <textarea
            className="inp"
            rows={3}
            maxLength={500}
            placeholder="Nhập lý do thu hồi để gửi tới người nhận giải…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>

        {errorMsg && <p className="notice err" role="alert">{errorMsg}</p>}

        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-g" disabled={saving} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="btn btn-no" disabled={saving || !result?.success || !reason.trim()} onClick={() => void handleRevoke()}>
            {saving ? "Đang xử lý…" : "Xác nhận thu hồi"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export default function EventAwardsTable({
  awards,
  expanded,
  busy,
  txCodes,
  onCodeChange,
  onFulfill,
  canViewRecipient,
  canEditAssignment,
  canRevoke,
  openAppeals = [],
  onAssignmentSaved,
}: Props) {
  const [recipientAwardId, setRecipientAwardId] = useState<number | null>(null);
  const [editingAward, setEditingAward] = useState<EventAwardSlotDto | null>(null);
  const [revokingAward, setRevokingAward] = useState<EventAwardSlotDto | null>(null);
  const groups = new Map<string, EventAwardSlotDto[]>();
  for (const award of awards) {
    const key = awardGroupKey(award, expanded);
    const group = groups.get(key) ?? [];
    group.push(award);
    groups.set(key, group);
  }
  return (
    <div className="ev-prizes-scroll">
      <table className="ev-prizes">
        <caption className="sr-only">Danh sách giải thưởng và trạng thái trao thưởng</caption>
        <thead>
          <tr>
            <th scope="col">Hạng giải</th>
            <th scope="col">Phần thưởng</th>
            <th scope="col">Người nhận</th>
            <th scope="col">Giá trị / suất</th>
            <th scope="col">Trạng thái</th>
            <th scope="col">Xử lý</th>
          </tr>
        </thead>
        <tbody>
          {[...groups.entries()].map(([key, group]) => {
            const award = group[0];
            const statuses = [...new Set(group.map((item) => AWARD_STATUS_LABEL[item.status]))].join(", ");
            const isSingleSlot = expanded || group.length === 1;
            const canEditSlot = Boolean(canEditAssignment && isSingleSlot && award.status === "AwardProposed");
            const canRevokeSlot = Boolean(canRevoke && isSingleSlot && award.status === "AppealHold");
            return (
              <tr key={key}>
                <th scope="row"><strong>{award.rankOrTier}</strong><small>{expanded ? `Suất #${award.slotIndex}` : `${group.length} suất`}</small></th>
                <td><strong>{award.rewardName}</strong><small>{REWARD_TYPE_LABEL[award.rewardType]}</small></td>
                <td>{renderWinnerCell(group, expanded)}</td>
                <td className="ev-numeric">{award.unitValueVnd.toLocaleString("vi-VN")} đ{award.creditGrantAmount > 0 && <small>{award.creditGrantAmount} lượt</small>}</td>
                <td>
                  {statuses}
                  {isSingleSlot && award.status === "Revoked" && award.revokedReason && (
                    <small>Lý do: {award.revokedReason}</small>
                  )}
                </td>
                <td>
                  {canEditSlot ? (
                    <button type="button" className="btn btn-s" disabled={busy} onClick={() => setEditingAward(award)}>
                      Sửa
                    </button>
                  ) : canRevokeSlot ? (
                    <button type="button" className="btn btn-no" disabled={busy} onClick={() => setRevokingAward(award)}>
                      Thu hồi
                    </button>
                  ) : expanded && (award.status === "FulfillmentProcessing" || award.status === "Failed") ? (
                    <div className="ev-prize-actions">
                      {canViewRecipient && (award.rewardType === "CashTransfer" || award.rewardType === "PhysicalGift") && (
                        <button type="button" className="btn btn-g" disabled={busy} onClick={() => setRecipientAwardId(award.id)}>
                          Xem thông tin nhận
                        </button>
                      )}
                      <input aria-label={`Mã vận đơn hoặc giao dịch giải #${award.id}`} className="inp"
                        placeholder="Mã vận đơn / GD…" value={txCodes[award.id] ?? ""}
                        onChange={(event) => onCodeChange(award.id, event.target.value)} />
                      <button type="button" className="btn btn-ok" disabled={busy} onClick={() => onFulfill(award.id)}>
                        {award.status === "Failed" ? "Trao lại" : "Xác nhận đã trao"}
                      </button>
                    </div>
                  ) : <span className="sub">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {canViewRecipient && recipientAwardId !== null && (
        <RecipientDialog key={recipientAwardId} awardId={recipientAwardId} onClose={() => setRecipientAwardId(null)} />
      )}
      {canEditAssignment && editingAward !== null && (
        <EditAwardAssignmentDialog
          key={editingAward.id}
          award={editingAward}
          onClose={() => setEditingAward(null)}
          onSaved={() => onAssignmentSaved?.()}
        />
      )}
      {canRevoke && revokingAward !== null && (
        <RevokeAwardDialog
          key={revokingAward.id}
          award={revokingAward}
          openAppeals={openAppeals}
          onClose={() => setRevokingAward(null)}
          onSaved={() => onAssignmentSaved?.()}
        />
      )}
    </div>
  );
}
