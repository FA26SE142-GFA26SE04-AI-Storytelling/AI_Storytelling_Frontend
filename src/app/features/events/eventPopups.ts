import { isUnread, notificationKey } from "@/app/lib/notifications";
import type { MyAwardDto, MyEventResultDto } from "@/app/types/event";
import type { AppNotification } from "@/app/types/progress";

export const EVENT_POPUP_SESSION_KEY = "taletale-event-popups-shown";
export const EVENT_POPUP_DISMISSED_NOTIFS_KEY = "taletale-event-popups-dismissed-notifs";

function readIdSet(key: string): Set<number> {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    if (Array.isArray(stored)) {
      return new Set(stored.filter((id): id is number => typeof id === "number" && Number.isSafeInteger(id) && id > 0));
    }
  } catch {
    /* Storage may be unavailable. */
  }
  return new Set();
}

function addToIdSet(key: string, id: number): void {
  try {
    const ids = readIdSet(key);
    if (ids.has(id)) return;
    ids.add(id);
    sessionStorage.setItem(key, JSON.stringify([...ids]));
  } catch {
    /* Storage may be unavailable. */
  }
}

export function readShownAwardIds(): Set<number> {
  return readIdSet(EVENT_POPUP_SESSION_KEY);
}

/** Chỉ gọi khi người dùng đã đóng hoặc bấm nút trên chính pop-up giải này. */
export function rememberShownAward(awardId: number): void {
  addToIdSet(EVENT_POPUP_SESSION_KEY, awardId);
}

/** Thông báo đã đóng trong phiên: không hiện lại dù yêu cầu đánh dấu đã đọc chưa xong. */
export function readDismissedNotificationIds(): Set<number> {
  return readIdSet(EVENT_POPUP_DISMISSED_NOTIFS_KEY);
}

export function rememberDismissedNotification(notificationId: number): void {
  addToIdSet(EVENT_POPUP_DISMISSED_NOTIFS_KEY, notificationId);
}

export type EventPopup = {
  kind: "revoked" | "appealAccepted" | "award" | "noAward" | "ended";
  eventId: number;
  notificationId?: number;
  result?: MyEventResultDto;
  award?: MyAwardDto;
  payload?: Record<string, unknown>;
};

function parsePayload(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function payloadEventId(payload: Record<string, unknown>): number {
  const val = payload.eventId;
  return typeof val === "number" && Number.isFinite(val) ? val : 0;
}

const ACTIVE_AWARD_STATUSES = new Set([
  "AppealHold",
  "AwaitingClaim",
  "Claimed",
  "FulfillmentProcessing",
  "Fulfilled",
]);

/**
 * Chọn danh sách pop-up sự kiện theo đúng thứ tự ưu tiên:
 * 1. Thu hồi giải / Khiếu nại được chấp nhận (từ thông báo chưa đọc)
 * 2. Giải chưa nhận (AppealHold / AwaitingClaim) chưa hiện trong phiên
 *    & Kết quả không có giải (chỉ từ thông báo EventResultPublished chưa đọc)
 * 3. Sự kiện vừa kết thúc (từ thông báo EventEnded chưa đọc)
 */
export function pickEventPopups(
  results: MyEventResultDto[],
  notifications: AppNotification[],
  shownAwardIds: ReadonlySet<number>,
  dismissedNotificationIds: ReadonlySet<number> = new Set(),
): EventPopup[] {
  const unread = notifications.filter((n) => isUnread(n) && !dismissedNotificationIds.has(n.id));
  const resultByEventId = new Map<number, MyEventResultDto>(results.map((r) => [r.eventId, r]));

  const revokedPopups: EventPopup[] = [];
  const appealPopups: EventPopup[] = [];
  const awardPopups: EventPopup[] = [];
  const noAwardPopups: EventPopup[] = [];
  const endedPopups: EventPopup[] = [];

  const unreadResultNotifByEvent = new Map<number, { id: number; payload: Record<string, unknown> }>();
  const unreadApprovedNotifByEvent = new Map<number, number>();

  for (const n of unread) {
    const key = notificationKey(n.type);
    const payload = parsePayload(n.payload);
    const eventId = payloadEventId(payload);
    if (key === "event_award_revoked") {
      revokedPopups.push({
        kind: "revoked",
        eventId,
        notificationId: n.id,
        result: eventId ? resultByEventId.get(eventId) : undefined,
        payload,
      });
    } else if (key === "event_appeal_accepted") {
      appealPopups.push({
        kind: "appealAccepted",
        eventId,
        notificationId: n.id,
        result: eventId ? resultByEventId.get(eventId) : undefined,
        payload,
      });
    } else if (key === "event_result_published") {
      if (eventId && !unreadResultNotifByEvent.has(eventId)) {
        unreadResultNotifByEvent.set(eventId, { id: n.id, payload });
      }
    } else if (key === "event_award_approved") {
      if (eventId && !unreadApprovedNotifByEvent.has(eventId)) {
        unreadApprovedNotifByEvent.set(eventId, n.id);
      }
    } else if (key === "event_ended") {
      endedPopups.push({
        kind: "ended",
        eventId,
        notificationId: n.id,
        result: eventId ? resultByEventId.get(eventId) : undefined,
        payload,
      });
    }
  }

  const eventsWithAwardPopup = new Set<number>();
  for (const res of results) {
    for (const aw of res.awards) {
      if ((aw.status === "AppealHold" || aw.status === "AwaitingClaim") && !shownAwardIds.has(aw.awardId)) {
        const notifId =
          aw.status === "AwaitingClaim"
            ? (unreadApprovedNotifByEvent.get(res.eventId) ?? unreadResultNotifByEvent.get(res.eventId)?.id)
            : unreadResultNotifByEvent.get(res.eventId)?.id;
        awardPopups.push({
          kind: "award",
          eventId: res.eventId,
          notificationId: notifId,
          result: res,
          award: aw,
        });
        eventsWithAwardPopup.add(res.eventId);
      }
    }
  }

  for (const [eventId, notif] of unreadResultNotifByEvent.entries()) {
    if (eventsWithAwardPopup.has(eventId)) continue;
    const res = resultByEventId.get(eventId);
    const hasActiveAward = res?.awards.some((a) => ACTIVE_AWARD_STATUSES.has(a.status)) ?? false;
    if (hasActiveAward) continue;
    noAwardPopups.push({
      kind: "noAward",
      eventId,
      notificationId: notif.id,
      result: res,
      payload: notif.payload,
    });
  }

  return [
    ...revokedPopups,
    ...appealPopups,
    ...awardPopups,
    ...noAwardPopups,
    ...endedPopups,
  ];
}
