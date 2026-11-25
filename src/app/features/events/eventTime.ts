const VN_OFFSET = "+07:00";
const vnDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh",
});
const vnTimeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "Asia/Ho_Chi_Minh",
});

export const formatEventDateInput = (value: string) => {
  if (!value) return "";
  const [date, time] = value.split("T");
  return date.split("-").reverse().join("/") + (time ? ` ${time.slice(0, 5)}` : "");
};

export function parseEventDateInput(value: string, includeTime = false): string {
  const text = value.trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(text);
  const compact = /^(\d{2})(\d{2})(\d{4})(?:(\d{2})(\d{2}))?$/.exec(text);
  const parts = match ?? compact;
  if (!parts) return "";
  const [, day, month, year, hour, minute] = parts;
  if (includeTime !== Boolean(hour) || (hour && (Number(hour) > 23 || Number(minute) > 59))) return "";
  const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (year === "0000" || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return "";
  return includeTime ? `${date}T${hour.padStart(2, "0")}:${minute}` : date;
}

export const formatVnDate = (value: string | number) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? vnDateFormat.format(date) : "—";
};

/** Chuyển ngày YYYY-MM-DD (giờ Việt Nam) sang UTC ISO đầu ngày (00:00:00+07:00). */
export const toVnStartIso = (dateStr: string): string =>
  new Date(`${dateStr}T00:00:00${VN_OFFSET}`).toISOString();

/** Chuyển ngày YYYY-MM-DD (giờ Việt Nam) sang UTC ISO cuối ngày trọn vẹn (23:59:59+07:00). */
export const toVnEndIso = (dateStr: string): string =>
  new Date(`${dateStr}T23:59:59${VN_OFFSET}`).toISOString();

/** Lấy chuỗi ngày YYYY-MM-DD theo múi giờ Việt Nam (Asia/Ho_Chi_Minh). */
export const toVnDateInput = (iso?: string | null): string => {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  return new Date(date.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
};

export const formatVnDateTime = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${vnDateFormat.format(d)} ${vnTimeFormat.format(d)}`;
};

export const vnTodayOffsetDate = (offsetDays: number): string =>
  new Date(Date.now() + 7 * 3_600_000 + offsetDays * 86_400_000).toISOString().slice(0, 10);
import type { EventDetailDto, EventSummaryDto } from "@/app/types/event";


export function eventScheduleWindow(event?: EventSummaryDto | null, detail?: EventDetailDto | null) {
  const activities = detail?.activities ?? [];
  const tracks = detail?.tracks ?? [];
  const starts = activities.length ? activities.flatMap((a) => [a.registrationStartAt, a.startAt])
    : tracks.map((track) => track.registrationStartAt);
  const ends = activities.length ? activities.flatMap((a) => [a.registrationEndAt, a.endAt, a.reviewCutoffAt])
    : tracks.map((track) => track.executionEndAt);
  const pick = (values: (string | null | undefined)[], compare: (left: number, right: number) => number) =>
    values.map((value) => value ? Date.parse(value) : NaN).filter(Number.isFinite).sort(compare)[0] ?? null;
  return {
    start: pick([event?.opensAt ?? detail?.opensAt], (a, b) => a - b) ?? pick(starts, (a, b) => a - b),
    end: pick([event?.closesAt ?? detail?.closesAt], (a, b) => a - b) ?? pick(ends, (a, b) => b - a),
  };
}
