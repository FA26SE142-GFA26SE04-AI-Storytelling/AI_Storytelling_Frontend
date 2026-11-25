import { describe, expect, it } from "vitest";
import type { EventAwardSlotDto } from "@/app/types/event";
import { awardGroupKey, buildClaimRequest, claimFieldsFor, rewardsForEvent } from "@/app/features/events/eventRewards";

function makeAward(overrides: Partial<EventAwardSlotDto> = {}): EventAwardSlotDto {
  return {
    id: 1,
    rankOrTier: "Giải Nhất",
    slotIndex: 1,
    rewardType: "CashTransfer",
    rewardName: "Tiền thưởng",
    unitValueVnd: 500_000,
    creditGrantAmount: 0,
    status: "AwaitingClaim",
    ...overrides,
  };
}

describe("eventRewards helpers", () => {
  it("hides recipient fields for PlatformCredits and CreatorPackage", () => {
    expect(claimFieldsFor("PlatformCredits")).toEqual([]);
    expect(claimFieldsFor("CreatorPackage")).toEqual([]);
    expect(claimFieldsFor("PhysicalGift")).toEqual(["recipientName", "phoneNumber", "shippingAddress"]);
    expect(claimFieldsFor("CashTransfer")).toEqual(["bankName", "bankAccountNumber", "bankAccountHolder"]);
  });

  it("requires full recipient fields for PhysicalGift", () => {
    const missing = buildClaimRequest("PhysicalGift", {
      recipientName: "Nguyễn Văn A",
      phoneNumber: "0901234567",
      shippingAddress: "   ",
    });
    expect("error" in missing).toBe(true);

    const ok = buildClaimRequest("PhysicalGift", {
      recipientName: " Nguyễn Văn A ",
      phoneNumber: " 0901234567 ",
      shippingAddress: " 123 Lê Lợi ",
    });
    expect(ok).toEqual({
      request: {
        recipientName: "Nguyễn Văn A",
        phoneNumber: "0901234567",
        shippingAddress: "123 Lê Lợi",
      },
    });
  });

  it("allows empty CashTransfer claim when payout account already exists and trims non-empty fields", () => {
    expect(buildClaimRequest("CashTransfer", {})).toEqual({ request: {} });
    expect(buildClaimRequest("CashTransfer", { bankName: "QA Bank" })).toHaveProperty("error");
    expect(buildClaimRequest("CashTransfer", {
      bankName: " QA Bank ", bankAccountNumber: " 000123 ", bankAccountHolder: " Parent QA ",
    })).toEqual({ request: {
      bankName: "QA Bank", bankAccountNumber: "000123", bankAccountHolder: "Parent QA",
    } });
  });

  it("filters myRewards strictly to awards belonging to the selected event", () => {
    const a1 = makeAward({ id: 10 });
    const a2 = makeAward({ id: 20 });
    const otherEventAward = makeAward({ id: 99 });
    expect(rewardsForEvent([a1, otherEventAward, a2], { awards: [a2, a1] })).toEqual([a1, a2]);
  });

  it("separates collapsed award groups by activity and result source", () => {
    const subAward = makeAward({ id: 1, eventActivityId: 5, resultSource: "SubmissionScore" });
    const voteAward = makeAward({ id: 2, eventActivityId: 6, resultSource: "VotingAverage" });
    expect(awardGroupKey(subAward, false)).not.toBe(awardGroupKey(voteAward, false));
    expect(awardGroupKey(subAward, true)).toBe("1");
  });
});
