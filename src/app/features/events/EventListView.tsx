"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Search, Trophy } from "lucide-react";
import Lotus from "@/app/components/brand/Lotus";
import SafeImage from "@/app/components/SafeImage";
import {
  EVENT_ACTIVITY_LABEL,
  isNewEvent,
  PARTICIPATION_STATUS_LABEL,
  type EventDetailDto,
  type EventParticipationDto,
  type EventSummaryDto,
} from "@/app/types/event";
import { useEventListDetails } from "./useEventListDetails";
import { eventScheduleWindow, formatVnDate } from "./eventTime";

type EventGroup = "open" | "upcoming" | "ended";
type Filter = "all" | EventGroup | "joined";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "open", label: "Đang mở" },
  { key: "upcoming", label: "Sắp diễn ra" },
  { key: "ended", label: "Đã kết thúc" },
  { key: "joined", label: "Đã tham gia" },
];

export function groupOf(event: EventSummaryDto, detail?: EventDetailDto): EventGroup {
  if (event.status === "Closed") return "ended";
  const { start, end } = eventScheduleWindow(event, detail);
  const now = Date.now();
  if (end !== null && end < now) return "ended";
  return start !== null && start > now ? "upcoming" : "open";
}

export default function EventListView({ events, loading, participations = [], onSelect }: {
  events: EventSummaryDto[];
  loading: boolean;
  participations?: EventParticipationDto[];
  onSelect: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const joinedMap = useMemo(() => {
    const map = new Map<number, EventParticipationDto[]>();
    for (const p of participations) {
      const list = map.get(p.eventId) ?? [];
      list.push(p);
      map.set(p.eventId, list);
    }
    return map;
  }, [participations]);
  const published = useMemo(() => events.filter((event) => event.status === "Published" || event.status === "Closed"), [events]);
  const { details, loading: detailsLoading, failed } = useEventListDetails(published);
  const counts: Record<Filter, number> = { all: published.length, open: 0, upcoming: 0, ended: 0, joined: 0 };
  for (const event of published) {
    counts[groupOf(event, details.get(event.id))]++;
    if (joinedMap.has(event.id)) counts.joined++;
  }
  const filtered = published.filter((event) =>
    (filter === "all" || (filter === "joined" ? joinedMap.has(event.id) : groupOf(event, details.get(event.id)) === filter)) &&
    `${event.title} ${event.description} ${event.mainCategoryName ?? ""}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")),
  );

  return (
    <div className="ev-public-list">
      <header className="ev-public-list-head">
        <Trophy className="ev-event-heading-icon" aria-hidden="true" />
        <div><h2 className="display">Sự kiện</h2><p>Khám phá và theo dõi các sự kiện kể chuyện trên Taletale.</p></div>
      </header>
      <div className="ev-event-list-toolbar">
        <div className="ev-event-filters" role="group" aria-label="Lọc trạng thái sự kiện">
          {FILTERS.map(({ key, label }) => (
            <button key={key} type="button" aria-pressed={filter === key} className={filter === key ? "on" : ""}
              onClick={() => setFilter(key)}>{label} ({counts[key]})</button>
          ))}
        </div>
        <label className="ev-event-search"><Search className="ic" aria-hidden="true" />
          <input className="inp" type="search" aria-label="Tìm sự kiện" placeholder="Tìm tên sự kiện…"
            value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      {loading ? <p className="sub" role="status">Đang tải danh sách sự kiện…</p> : (
        <>
          {failed && <p className="sub" role="status">Một số sự kiện chưa tải được thời gian hoặc số truyện. Bạn vẫn có thể mở chi tiết.</p>}
          <div className="ev-events-table-scroll">
            <table className="ev-events-table">
              <caption className="sr-only">Danh sách sự kiện Taletale</caption>
              <thead><tr><th scope="col">Sự kiện</th><th scope="col">Nhóm tuổi</th><th scope="col">Thời gian</th><th scope="col">Trạng thái</th><th scope="col">Truyện</th><th scope="col">Ngân sách</th><th scope="col"><span className="sr-only">Xem chi tiết</span></th></tr></thead>
              <tbody>
                {filtered.map((event) => {
                  const detail = details.get(event.id);
                  const { start, end } = eventScheduleWindow(event, detail);
                  const group = groupOf(event, detail);
                  return (
                    <tr key={event.id}>
                      <th scope="row"><div className="ev-event-table-title">
                        {event.bannerUrl ? <SafeImage className="ev-event-thumbnail" src={event.bannerUrl} alt="" /> : <Lotus className="ev-event-thumbnail" size={56} />}
                        <div>
                          <div className="ev-event-title-row">
                            <strong className="display">{event.title}</strong>
                            {event.mainCategoryName && <span className="pill">{event.mainCategoryName}</span>}
                            {isNewEvent(event) && <span className="ev-new-badge">Mới</span>}
                          </div>
                          <p>{event.description}</p>
                        </div>
                      </div></th>
                      <td><span className="ev-event-age-tag">{event.targetAgeBands} tuổi</span></td>
                      <td><span className="ev-event-dates"><CalendarDays className="ic" aria-hidden="true" />
                        {start !== null && end !== null ? `${formatVnDate(start)} – ${formatVnDate(end)}` : detailsLoading ? "Đang tải…" : "—"}
                      </span></td>
                      <td>
                        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                          <span className={`ev-event-status-tag ${group}`}><span aria-hidden="true" />{FILTERS.find(({ key }) => key === group)?.label}</span>
                          {(joinedMap.get(event.id) ?? []).map((p) => (
                            <span key={p.id} className="pill">
                              {p.activityType ? `${EVENT_ACTIVITY_LABEL[p.activityType]}: ` : ""}
                              {PARTICIPATION_STATUS_LABEL[p.status]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="ev-numeric">{detail ? `${detail.eventStoriesCount} truyện` : detailsLoading ? "Đang tải…" : "—"}</td>
                      <td className="ev-numeric">{event.budgetVnd > 0 ? `${event.budgetVnd.toLocaleString("vi-VN")} đ` : "Quà / Lượt AI"}</td>
                      <td><button type="button" className="ev-event-view" aria-label={`Xem chi tiết ${event.title}`} onClick={() => onSelect(event.id)}>Xem chi tiết<ArrowRight className="ic" aria-hidden="true" /></button></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={7} className="ev-events-empty">{published.length ? "Không tìm thấy sự kiện phù hợp." : "Chưa có sự kiện nào được công bố."}</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="ev-event-list-count" role="status">Hiển thị {filtered.length ? `1 – ${filtered.length}` : "0"} trên {published.length} sự kiện</p>
        </>
      )}
    </div>
  );
}
