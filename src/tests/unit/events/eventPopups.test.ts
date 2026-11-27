import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  pickEventPopups,
  readDismissedNotificationIds,
  readShownAwardIds,
  rememberDismissedNotification,
  rememberShownAward,
} from "@/app/features/events/eventPopups";
import { eventResultHref, eventSelectionHref, readEventResultNavigation } from "@/app/features/events/eventNavigation";
import { EventResultPopupCard } from "@/app/features/events/EventResultPopup";
import type { MyEventResultDto } from "@/app/types/event";
import type { AppNotification } from "@/app/types/progress";

const baseResult = (overrides: Partial<MyEventResultDto> = {}): MyEventResultDto => ({
  eventId: 10,
  eventTitle: "Lễ hội Mùa Thu",
  resultsPublishedAt: "2026-11-25T00:00:00Z",
  appealDeadlineAt: "2026-11-27T00:00:00Z",
  canAppeal: false,
  recap: { storiesRead: 2, submissions: 1, votes: 1, tasksCompleted: 2, tasksTotal: 2 },
  activities: [],
  awards: [],
  ...overrides,
});

const notif = (id: number, type: string, payload: Record<string, unknown>, read = false): AppNotification => ({
  id,
  type,
  payload: JSON.stringify(payload),
  status: read ? "Read" : "Unread",
  readAt: read ? "2026-11-25T01:00:00Z" : null,
  createdAt: "2026-11-25T00:00:00Z",
});

describe("pickEventPopups & EventResultPopupCard", () => {
  it("hiện pop-up award khi AppealHold / AwaitingClaim và không hiện lặp trong cùng phiên", () => {
    const res = baseResult({
      awards: [{
        awardId: 1, rankOrTier: "Giải Nhất", slotIndex: 1, rewardName: "Bộ sách", rewardType: "PhysicalGift",
        creditGrantAmount: 0, submitCreditGrantAmount: 0, unitValueVnd: 200_000,
        status: "AppealHold", claimOpensAt: "2026-11-27T00:00:00Z", asksChildNameConsent: false,
      }],
    });

    const first = pickEventPopups([res], [], new Set());
    expect(first).toHaveLength(1);
    expect(first[0].kind).toBe("award");

    const sameSession = pickEventPopups([res], [], new Set([1]));
    expect(sameSession).toHaveLength(0);
  });

  it("không hiện pop-up award với suất Claimed, Expired hoặc Revoked", () => {
    const res = baseResult({
      awards: [
        { awardId: 1, rankOrTier: "Nhất", slotIndex: 1, rewardName: "A", rewardType: "PlatformCredits", creditGrantAmount: 2, submitCreditGrantAmount: 0, unitValueVnd: 0, status: "Claimed", asksChildNameConsent: false },
        { awardId: 2, rankOrTier: "Nhì", slotIndex: 1, rewardName: "B", rewardType: "PlatformCredits", creditGrantAmount: 2, submitCreditGrantAmount: 0, unitValueVnd: 0, status: "Expired", asksChildNameConsent: false },
        { awardId: 3, rankOrTier: "Ba", slotIndex: 1, rewardName: "C", rewardType: "PlatformCredits", creditGrantAmount: 2, submitCreditGrantAmount: 0, unitValueVnd: 0, status: "Revoked", revokedReason: "Sai", asksChildNameConsent: false },
      ],
    });
    expect(pickEventPopups([res], [], new Set())).toHaveLength(0);
  });

  it("ưu tiên revoked/appealAccepted trước award/noAward trước ended và bỏ qua thông báo đã đọc", () => {
    const res = baseResult({
      awards: [{
        awardId: 5, rankOrTier: "Giải Nhất", slotIndex: 1, rewardName: "Cúp", rewardType: "PhysicalGift",
        creditGrantAmount: 0, submitCreditGrantAmount: 0, unitValueVnd: 0,
        status: "AwaitingClaim", claimDeadlineAt: "2026-11-30T00:00:00Z", asksChildNameConsent: false,
      }],
    });
    const list = pickEventPopups(
      [res],
      [
        notif(1, "EventEnded", { eventId: 10, eventTitle: "Lễ hội Mùa Thu" }, false),
        notif(2, "EventEnded", { eventId: 11, eventTitle: "Đã đọc" }, true),
        notif(3, "EventAwardRevoked", { eventId: 12, eventTitle: "Test 2", reason: "Sai điểm" }, false),
        notif(4, "EventAppealAccepted", { eventId: 13, eventTitle: "Test 3", resolutionNote: "Hợp lệ" }, false),
      ],
      new Set(),
    );
    expect(list.map((p) => p.kind)).toEqual(["revoked", "appealAccepted", "award", "ended"]);
    expect(list.some((p) => p.eventId === 11)).toBe(false);
  });

  it("giữ suất giải chưa xuất hiện khi hàng chờ được dựng lại sau điều hướng", () => {
    let stored: string | null = null;
    vi.stubGlobal("sessionStorage", {
      getItem: () => stored,
      setItem: (_key: string, value: string) => { stored = value; },
    });
    try {
      const award = {
        awardId: 1, rankOrTier: "Nhất", slotIndex: 1, rewardName: "Quà", rewardType: "PhysicalGift",
        creditGrantAmount: 0, submitCreditGrantAmount: 0, unitValueVnd: 0, status: "AwaitingClaim", asksChildNameConsent: false,
      } as const;
      const res = baseResult({ awards: [award, { ...award, awardId: 2 }] });
      const initialQueue = pickEventPopups(
        [res], [notif(3, "EventAwardRevoked", { eventId: 12 })], readShownAwardIds(),
      );
      expect(initialQueue.map((p) => p.kind)).toEqual(["revoked", "award", "award"]);
      expect(readShownAwardIds().size).toBe(0);
      const queueAfterViewingRevocation = pickEventPopups([res], [], readShownAwardIds());
      expect(queueAfterViewingRevocation.map((p) => p.award?.awardId)).toEqual([1, 2]);

      rememberShownAward(1);
      const resumedQueue = pickEventPopups([res], [], readShownAwardIds());
      expect(resumedQueue.map((p) => p.award?.awardId)).toEqual([2]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("không hiện lại thông báo đã đóng khi server vẫn trả chưa đọc", () => {
    const stored = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => { stored.set(key, value); },
    });
    try {
      const notifs = [
        notif(3, "EventAwardRevoked", { eventId: 12 }),
        notif(4, "EventEnded", { eventId: 13 }),
      ];
      rememberDismissedNotification(3);
      const queue = pickEventPopups([], notifs, readShownAwardIds(), readDismissedNotificationIds());
      expect(queue.map((p) => p.notificationId)).toEqual([4]);
      expect(readShownAwardIds().size).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each(["/staff/events", "/app/events"] as const)("dùng đúng URL sự kiện và chỉ đọc yêu cầu nhận thưởng một lần tại %s", (route) => {
    const origin = "http://localhost:3000";
    const href = eventResultHref(route, { eventId: 10, claimAwardId: 5 });
    expect(href).toBe(`${route}?eventId=10&claim=5#my-result`);
    const nav = readEventResultNavigation(origin + href)!;
    expect(nav.target).toEqual({ eventId: 10, claimAwardId: 5, focusResult: true });
    expect(nav.cleanHref).toBe(`${route}?eventId=10`);
    expect(readEventResultNavigation(origin + nav.cleanHref)?.target)
      .toEqual({ eventId: 10, focusResult: false });
    expect(readEventResultNavigation(`${origin}${route}?eventId=10&view=all#overview`)?.cleanHref)
      .toBe(`${route}?eventId=10&view=all#overview`);
    expect(readEventResultNavigation(`${origin}/staff/create-ai?eventId=10`)).toBeNull();
    const selected = eventSelectionHref(origin + nav.cleanHref, 10, "test-2");
    expect(selected).toBe(`${route}?eventId=10&event=test-2`);
    expect(readEventResultNavigation(origin + selected)?.cleanHref).toBe(selected);
    const changed = eventSelectionHref(origin + selected, 11, "ngay-hoi-doc-sach");
    expect(changed).toBe(`${route}?eventId=11&event=ngay-hoi-doc-sach`);
    expect(readEventResultNavigation(origin + changed)?.target?.eventId).toBe(11);
    expect(eventSelectionHref(origin + changed, null)).toBe(route);
  });

  it("render đầy đủ khối Lưu ý cho AppealHold và AwaitingClaim kèm nút Nhận thưởng", () => {
    const holdHtml = renderToStaticMarkup(
      createElement(EventResultPopupCard, {
        popup: {
          kind: "award",
          eventId: 10,
          result: baseResult(),
          award: {
            awardId: 1, rankOrTier: "Giải Nhất", slotIndex: 1, rewardName: "Bộ sách", rewardType: "PhysicalGift",
            creditGrantAmount: 0, submitCreditGrantAmount: 0, unitValueVnd: 200_000,
            status: "AppealHold", claimOpensAt: "2026-11-27T00:00:00Z", asksChildNameConsent: false,
          },
        },
        onClose: () => {},
        onOpenDetail: () => {},
        onClaim: () => {},
      }),
    );
    expect(holdHtml).toContain("Lưu ý");
    expect(holdHtml).toContain("Giải mở nhận từ");
    expect(holdHtml).toContain("có thể thay đổi");
    expect(holdHtml).toContain("địa chỉ");
    expect(holdHtml).not.toContain(">Nhận thưởng</button>");

    const claimHtml = renderToStaticMarkup(
      createElement(EventResultPopupCard, {
        popup: {
          kind: "award",
          eventId: 10,
          result: baseResult(),
          award: {
            awardId: 2, rankOrTier: "Giải Nhì", slotIndex: 1, rewardName: "Hộp quà", rewardType: "PhysicalGift",
            creditGrantAmount: 0, submitCreditGrantAmount: 0, unitValueVnd: 100_000,
            status: "AwaitingClaim", claimDeadlineAt: "2026-11-30T00:00:00Z", asksChildNameConsent: true,
          },
        },
        onClose: () => {},
        onOpenDetail: () => {},
        onClaim: () => {},
      }),
    );
    expect(claimHtml).toContain("Hãy nhận trước");
    expect(claimHtml).toContain("Nhận thưởng");
    expect(claimHtml).toContain("địa chỉ");
  });
});
