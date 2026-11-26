"use client";

import "@/app/styles/features/events/events.css";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Coins, Tag, Users } from "lucide-react";
import SafeImage from "@/app/components/SafeImage";
import { eventService } from "@/app/services/eventService";
import { isNewEvent, type EventSummaryDto } from "@/app/types/event";
import { eventScheduleWindow, formatVnDate, formatVnDateRangeBadge } from "./eventTime";
import { useEventListDetails } from "./useEventListDetails";

export type EventHighlightBannerProps = {
  role: "Parent" | "ContentCreator";
  onOpenEvents: (eventId: number) => void;
  initialEvents?: EventSummaryDto[];
};

const MAX_VISIBLE_EVENTS = 3;

/** Giới thiệu tối đa 3 sự kiện đang diễn ra trên một hàng ở Thư viện Parent và Creator. */
export default function EventHighlightBanner({ role, onOpenEvents, initialEvents }: EventHighlightBannerProps) {
  const [events, setEvents] = useState<EventSummaryDto[]>([]);
  const published = useMemo(
    () => (initialEvents ?? events).filter((event) => event.status === "Published"),
    [initialEvents, events],
  );
  const missingSchedules = useMemo(() => published.filter((event) => {
    const { start, end } = eventScheduleWindow(event);
    return start === null || end === null;
  }), [published]);
  const { details } = useEventListDetails(missingSchedules);

  useEffect(() => {
    if (initialEvents) return;
    let active = true;
    void eventService.list(false).then((res) => {
      if (!active || !res.success || !res.data) return;
      setEvents(res.data);
    });
    return () => {
      active = false;
    };
  }, [initialEvents]);

  const now = Date.now();
  const active = published.flatMap((event) => {
    const { start, end } = eventScheduleWindow(event, details.get(event.id));
    return start !== null && end !== null && start <= now && now <= end ? [{ event, start, end }] : [];
  }).sort((a, b) =>
    (isNewEvent(b.event, now) ? 1 : 0) - (isNewEvent(a.event, now) ? 1 : 0)
      || (Date.parse(b.event.publishedAt ?? b.event.createdAt ?? "") || 0)
        - (Date.parse(a.event.publishedAt ?? a.event.createdAt ?? "") || 0)
      || b.event.id - a.event.id,
  );
  if (active.length === 0) return null;

  const visible = active.slice(0, MAX_VISIBLE_EVENTS);
  const hasFeaturedNew = isNewEvent(visible[0].event, now);
  const ctaLabel = role === "ContentCreator" ? "Gửi truyện dự thi" : "Tham gia cùng bé";

  const openDetail = (eventId: number) => {
    try {
      sessionStorage.setItem("taletale_selected_event_id", String(eventId));
    } catch {
      /* ignore storage errors */
    }
    onOpenEvents(eventId);
  };

  const openAllEvents = () => {
    try {
      sessionStorage.removeItem("taletale_selected_event_id");
    } catch {
      /* ignore storage errors */
    }
    onOpenEvents(0);
  };

  const cardSpanClass = (index: number): string => {
    if (visible.length === 1) return "ev-home-card--full";
    if (visible.length === 2) {
      if (hasFeaturedNew) return index === 0 ? "ev-home-card--wide" : "ev-home-card--narrow";
      return "ev-home-card--half";
    }
    if (hasFeaturedNew) return index === 0 ? "ev-home-card--featured" : "ev-home-card--compact";
    return "ev-home-card--equal";
  };

  const popoverAlignClass = (index: number): string => {
    if (visible.length === 1 || index === 0) return "ev-home-popover--start";
    if (index === visible.length - 1) return "ev-home-popover--end";
    return "ev-home-popover--center";
  };

  return (
    <section className="ev-home-banner" aria-label="Sự kiện đang diễn ra">
      <div className="ev-home-banner-head">
        <div className="ev-home-banner-head-left">
          <span className="ev-home-banner-eyebrow display">Sự kiện đang diễn ra</span>
          {active.length > 1 && (
            <span className="ev-home-banner-count">+{active.length - 1} sự kiện khác</span>
          )}
        </div>
        <button
          type="button"
          className="ev-home-more"
          onClick={active.length > 1 ? openAllEvents : () => openDetail(visible[0].event.id)}
        >
          {active.length > 1 ? "Xem tất cả sự kiện" : "Tìm hiểu thêm"}
          <ArrowRight className="ic" aria-hidden="true" />
        </button>
      </div>

      <div
        className={`ev-home-strip ev-home-strip--${visible.length}`}
        data-has-new={hasFeaturedNew ? "true" : "false"}
      >
        {visible.map(({ event, start, end }, index) => {
          const isNew = isNewEvent(event, now);
          const dateBadge = formatVnDateRangeBadge(start, end);
          const isPrimaryTile = visible.length === 1 || (index === 0 && hasFeaturedNew);
          const metaParts = [
            event.mainCategoryName?.trim(),
            event.targetAgeBands ? `Nhóm tuổi ${event.targetAgeBands}` : null,
            isPrimaryTile ? `Đến ${formatVnDate(end)}` : null,
          ].filter(Boolean);
          const rewardSummary = event.budgetVnd > 0
            ? `Ngân sách ${event.budgetVnd.toLocaleString("vi-VN")} đ`
            : "Thưởng quà & Lượt AI";

          return (
            <article
              key={event.id}
              className={`ev-home-card ${cardSpanClass(index)}${isPrimaryTile ? " is-primary" : " is-compact"}`}
            >
              <div className="ev-home-card-surface">
                {event.bannerUrl && (
                  <SafeImage className="ev-home-banner-image" src={event.bannerUrl} alt="" />
                )}
                <div className="ev-home-card-content">
                  <div
                    className={`ev-home-date-card${isPrimaryTile ? "" : " ev-home-date-card--mini"}`}
                    aria-label={`Thời gian diễn ra từ ${formatVnDate(start)} đến ${formatVnDate(end)}`}
                  >
                    <span className="ev-home-date-days display">{dateBadge.days}</span>
                    <span className="ev-home-date-month">{dateBadge.monthYear}</span>
                  </div>

                  <div className="ev-home-banner-body">
                    <div className="ev-home-card-title-row">
                      <h3 className="display">{event.title}</h3>
                      {isNew && <span className="ev-new-badge">Mới</span>}
                    </div>
                    {metaParts.length > 0 && (
                      <div className="ev-home-banner-kicker">{metaParts.join(" · ")}</div>
                    )}
                    <p>{event.description}</p>
                  </div>

                  {isPrimaryTile ? (
                    <div className="ev-home-banner-actions">
                      <button
                        type="button"
                        className="ev-home-cta"
                        onClick={() => openDetail(event.id)}
                      >
                        <span>{ctaLabel}</span>
                        <ArrowRight className="ic" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="ev-home-compact-link"
                      onClick={() => openDetail(event.id)}
                    >
                      <span>{ctaLabel}</span>
                      <ArrowRight className="ic" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <div
                className={`ev-home-popover ${popoverAlignClass(index)}`}
                role="region"
                aria-label={`Xem nhanh sự kiện ${event.title}`}
              >
                <div className="ev-home-popover-head">
                  <strong className="display">{event.title}</strong>
                  {isNew && <span className="ev-new-badge">Mới</span>}
                </div>
                {event.description && (
                  <p className="ev-home-popover-desc">{event.description}</p>
                )}
                <ul className="ev-home-popover-facts">
                  <li>
                    <CalendarDays className="ic" aria-hidden="true" />
                    <span>{formatVnDate(start)} – {formatVnDate(end)}</span>
                  </li>
                  {event.mainCategoryName && (
                    <li>
                      <Tag className="ic" aria-hidden="true" />
                      <span>Chủ đề: {event.mainCategoryName}</span>
                    </li>
                  )}
                  {event.targetAgeBands && (
                    <li>
                      <Users className="ic" aria-hidden="true" />
                      <span>Nhóm tuổi {event.targetAgeBands}</span>
                    </li>
                  )}
                  <li>
                    <Coins className="ic" aria-hidden="true" />
                    <span>{rewardSummary}</span>
                  </li>
                </ul>
                <button
                  type="button"
                  className="ev-home-popover-cta"
                  onClick={() => openDetail(event.id)}
                >
                  <span>{ctaLabel}</span>
                  <ArrowRight className="ic" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
