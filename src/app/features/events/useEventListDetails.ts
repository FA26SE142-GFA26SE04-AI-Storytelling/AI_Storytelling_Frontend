import { useEffect, useState } from "react";
import { eventService } from "@/app/services/eventService";
import type { EventDetailDto, EventSummaryDto } from "@/app/types/event";

/** List DTOs omit schedules and story totals. Read their detail endpoints with bounded concurrency. */
export function useEventListDetails(events: EventSummaryDto[]) {
  const [details, setDetails] = useState<Map<number, EventDetailDto>>(new Map());
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setDetails(new Map());
    setLoading(true);
    setFailed(false);
    const read = async () => {
      for (let offset = 0; offset < events.length; offset += 4) {
        const batch = await Promise.allSettled(events.slice(offset, offset + 4).map((event) => eventService.detail(event.id)));
        if (!active) return;
        setDetails((previous) => {
          const next = new Map(previous);
          for (const result of batch) {
            if (result.status === "fulfilled" && result.value.success && result.value.data)
              next.set(result.value.data.id, result.value.data);
          }
          return next;
        });
        if (batch.some((result) => result.status === "rejected" || !result.value.success || !result.value.data))
          setFailed(true);
      }
      if (active) setLoading(false);
    };
    void read();
    return () => { active = false; };
  }, [events]);
  return { details, loading, failed };
}
