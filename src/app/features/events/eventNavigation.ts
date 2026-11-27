import { positiveStoryId } from "@/app/lib/workspaceLocation";

export type EventResultDestination = { eventId: number; claimAwardId?: number };
export type EventResultTarget = EventResultDestination & { focusResult: boolean };

export function eventResultHref(path: "/app/events" | "/staff/events", target: EventResultDestination): string {
  const params = new URLSearchParams({ eventId: String(target.eventId) });
  if (target.claimAwardId) params.set("claim", String(target.claimAwardId));
  return `${path}?${params}#my-result`;
}

export function eventSelectionHref(href: string, eventId: number | null, slug?: string): string {
  const url = new URL(href);
  if (eventId === null) url.searchParams.delete("eventId");
  else url.searchParams.set("eventId", String(eventId));
  if (eventId !== null && slug) url.searchParams.set("event", slug);
  else url.searchParams.delete("event");
  clearResultAction(url);
  return `${url.pathname}${url.search}${url.hash}`;
}

function clearResultAction(url: URL): void {
  url.searchParams.delete("claim");
  if (url.hash === "#my-result") url.hash = "";
}

export function readEventResultNavigation(href: string): { target: EventResultTarget | null; cleanHref: string } | null {
  const url = new URL(href);
  if (url.pathname !== "/app/events" && url.pathname !== "/staff/events") return null;
  if (!url.searchParams.has("eventId") && !url.searchParams.has("claim") && !url.searchParams.has("event")) return null;
  const eventId = positiveStoryId(url.searchParams.get("eventId"));
  const claimAwardId = positiveStoryId(url.searchParams.get("claim")) ?? undefined;
  const focusResult = url.hash === "#my-result";
  if (eventId === null) {
    url.searchParams.delete("eventId");
    url.searchParams.delete("event");
  }
  clearResultAction(url);
  return {
    target: eventId === null ? null : { eventId, claimAwardId, focusResult },
    cleanHref: `${url.pathname}${url.search}${url.hash}`,
  };
}
