import type { EventAwardSlotDto, EventDetailDto, EventRewardType } from "@/app/types/event";

export const CLAIM_FIELD_LABELS = {
  recipientName: "Họ tên người nhận",
  phoneNumber: "Số điện thoại",
  shippingAddress: "Địa chỉ nhận quà",
  bankName: "Ngân hàng",
  bankAccountNumber: "Số tài khoản",
  bankAccountHolder: "Tên chủ tài khoản",
};

export type ClaimField = keyof typeof CLAIM_FIELD_LABELS;
export type ClaimRewardPayload = Partial<Record<ClaimField, string>>;

export function claimFieldsFor(rewardType: EventRewardType): ClaimField[] {
  if (rewardType === "PhysicalGift") return ["recipientName", "phoneNumber", "shippingAddress"];
  if (rewardType === "CashTransfer") return ["bankName", "bankAccountNumber", "bankAccountHolder"];
  return [];
}

export function buildClaimRequest(
  rewardType: EventRewardType,
  fields: ClaimRewardPayload,
): { request: ClaimRewardPayload } | { error: string } {
  const keys = claimFieldsFor(rewardType);
  const request: ClaimRewardPayload = {};
  for (const key of keys) {
    const value = fields[key]?.trim();
    if (value) request[key] = value;
  }
  const count = Object.keys(request).length;
  if (rewardType === "PhysicalGift" && count !== keys.length) {
    return { error: "Cần nhập họ tên, số điện thoại và địa chỉ nhận quà." };
  }
  if (rewardType === "CashTransfer" && count > 0 && count !== keys.length) {
    return { error: "Cần nhập ngân hàng, số tài khoản và tên chủ tài khoản." };
  }
  return { request };
}

/** Lọc danh sách giải thưởng cá nhân thuộc đúng sự kiện đang xem. */
export function rewardsForEvent(
  myRewards: EventAwardSlotDto[],
  detail: Pick<EventDetailDto, "awards">,
): EventAwardSlotDto[] {
  const ids = new Set(detail.awards.map((award) => award.id));
  return myRewards.filter((award) => ids.has(award.id));
}

/** Tạo khóa gom nhóm giải thưởng theo cấu hình hoạt động / nguồn kết quả. */
export function awardGroupKey(award: EventAwardSlotDto, expanded: boolean): string {
  if (expanded) return String(award.id);
  return `${award.trackId ?? ""}|${award.eventActivityId ?? ""}|${award.resultSource ?? ""}|${award.rankOrTier}|${award.rewardName}|${award.rewardType}|${award.unitValueVnd}|${award.creditGrantAmount}`;
}
