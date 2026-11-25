"use client";

import { useEffect, useState } from "react";
import Dialog from "@/app/components/Dialog";
import { eventService } from "@/app/services/eventService";
import type { ApiResponse } from "@/app/types/auth";
import type { EventRewardRecipientDto } from "@/app/types/event";
import { AWARD_STATUS_LABEL, REWARD_TYPE_LABEL, type EventAwardSlotDto } from "@/app/types/event";
import { awardGroupKey } from "./eventRewards";

type Props = {
  awards: EventAwardSlotDto[];
  expanded: boolean;
  busy: boolean;
  txCodes: Record<number, string>;
  onCodeChange: (id: number, value: string) => void;
  onFulfill: (id: number) => void;
  canViewRecipient?: boolean;
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

export default function EventAwardsTable({ awards, expanded, busy, txCodes, onCodeChange, onFulfill, canViewRecipient }: Props) {
  const [recipientAwardId, setRecipientAwardId] = useState<number | null>(null);
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
          <tr><th scope="col">Hạng giải</th><th scope="col">Phần thưởng</th><th scope="col">Giá trị / suất</th><th scope="col">Trạng thái</th><th scope="col">Xử lý</th></tr>
        </thead>
        <tbody>
          {[...groups.entries()].map(([key, group]) => {
            const award = group[0];
            const statuses = [...new Set(group.map((item) => AWARD_STATUS_LABEL[item.status]))].join(", ");
            return (
              <tr key={key}>
                <th scope="row"><strong>{award.rankOrTier}</strong><small>{expanded ? `Suất #${award.slotIndex}` : `${group.length} suất`}</small></th>
                <td><strong>{award.rewardName}</strong><small>{REWARD_TYPE_LABEL[award.rewardType]}</small></td>
                <td className="ev-numeric">{award.unitValueVnd.toLocaleString("vi-VN")} đ{award.creditGrantAmount > 0 && <small>{award.creditGrantAmount} lượt</small>}</td>
                <td>{statuses}</td>
                <td>
                  {expanded && (award.status === "FulfillmentProcessing" || award.status === "Failed") ? (
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
    </div>
  );
}
