import type { EventRewardType } from "@/app/types/event";
import { CLAIM_FIELD_LABELS, claimFieldsFor, type ClaimField, type ClaimRewardPayload } from "./eventRewards";

export default function EventClaimFields({ rewardType, fields, onChange }: {
  rewardType: EventRewardType;
  fields: ClaimRewardPayload;
  onChange: (field: ClaimField, value: string) => void;
}) {
  return (
    <div className="sec">
      {rewardType === "CashTransfer" && (
        <p className="sub">Có thể để trống nếu bạn đã lưu tài khoản nhận tiền.</p>
      )}
      {claimFieldsFor(rewardType).map((field) => (
        <label className="ev-field" key={field}>
          <span>{CLAIM_FIELD_LABELS[field]}</span>
          <input className="inp" value={fields[field] ?? ""} autoComplete="off"
            maxLength={field === "bankAccountNumber" ? 100 : field === "shippingAddress" ? 500 : 200}
            inputMode={field === "phoneNumber" ? "tel" : field === "bankAccountNumber" ? "numeric" : undefined}
            onChange={(event) => onChange(field, event.target.value)} />
        </label>
      ))}
    </div>
  );
}
