import { positiveStoryId } from "@/app/lib/workspaceLocation";

export type EventResultDestination = { eventId: number; claimAwardId?: number };
export type EventResultTarget = EventResultDestination & { focusResult: boolean };

export function eventResultHref(path: "/app/events" | "/staff/events", target: EventResultDestination): string {
  const params = new URLSearchParams({ eventId: String(target.eventId) });
  if (target.claimAwardId) params.set("claim", String(target.claimAwardId));
  return `${path}?${params}#my-result`;
}

export function readEventResultNavigation(href: string): { target: EventResultTarget | null; cleanHref: string } | null {
  const url = new URL(href);
  if (url.pathname !== "/app/events" && url.pathname !== "/staff/events") return null;
  if (!url.searchParams.has("eventId") && !url.searchParams.has("claim")) return null;
  const eventId = positiveStoryId(url.searchParams.get("eventId"));
  const claimAwardId = positiveStoryId(url.searchParams.get("claim")) ?? undefined;
  const focusResult = url.hash === "#my-result";
  url.searchParams.delete("eventId");
  url.searchParams.delete("claim");
  if (focusResult) url.hash = "";
  return {
    target: eventId === null ? null : { eventId, claimAwardId, focusResult },
    cleanHref: `${url.pathname}${url.search}${url.hash}`,
  };
}
