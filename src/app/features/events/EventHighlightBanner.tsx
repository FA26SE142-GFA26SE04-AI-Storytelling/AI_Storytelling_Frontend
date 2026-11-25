"use client";

import "@/app/styles/features/events/events.css";
import { useEffect, useState } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import { eventService } from "@/app/services/eventService";
import { isNewEvent, type EventSummaryDto } from "@/app/types/event";

export type EventHighlightBannerProps = {
  role: "Parent" | "ContentCreator";
  onOpenEvents: (eventId: number) => void;
  initialEvents?: EventSummaryDto[];
};

/** Banner nổi bật trên trang chủ Parent và Creator hiển thị sự kiện đã phát hành (Published). */
export default function EventHighlightBanner({ role, onOpenEvents, initialEvents }: EventHighlightBannerProps) {
  const [events, setEvents] = useState<EventSummaryDto[]>(initialEvents ?? []);

  useEffect(() => {
    if (initialEvents) return;
    let active = true;
    void eventService.list(false).then((res) => {
      if (!active || !res.success || !res.data) return;
      setEvents(res.data.filter((e) => e.status === "Published"));
    });
    return () => {
      active = false;
    };
  }, [initialEvents]);

  const published = events.filter((e) => e.status === "Published");
  const featured = published[0];
  if (!featured) return null;

  const openDetail = () => {
    try {
      sessionStorage.setItem("taletale_selected_event_id", String(featured.id));
    } catch {
      /* ignore storage errors */
    }
    onOpenEvents(featured.id);
  };

  return (
    <section
      className="ev-banner ev-home-banner"
      role="button"
      tabIndex={0}
      aria-label={`Xem chi tiết sự kiện ${featured.title}`}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail();
        }
      }}
    >
      <div className="ev-home-banner-body">
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {isNewEvent(featured) && <span className="ev-new-badge">Mới</span>}
          <span className="pill">
            <Trophy className="ic" aria-hidden="true" />
            Sự kiện đang mở
          </span>
          {published.length > 1 && <span className="pill">+{published.length - 1} sự kiện khác</span>}
          <span className="pill">Nhóm tuổi: {featured.targetAgeBands}</span>
          <span className="pill">{featured.budgetVnd > 0 ? `Quỹ thưởng: ${featured.budgetVnd.toLocaleString("vi-VN")} đ` : "Quà tặng / Lượt AI"}</span>
        </div>
        <h3 className="display">{featured.title}</h3>
        <p>{featured.description}</p>
      </div>
      <button
        type="button"
        className="btn btn-gold"
        onClick={(e) => {
          e.stopPropagation();
          openDetail();
        }}
      >
        {role === "ContentCreator" ? "Gửi truyện dự thi" : "Tham gia cùng bé"}
        <ArrowRight className="ic" aria-hidden="true" />
      </button>
    </section>
  );
}
