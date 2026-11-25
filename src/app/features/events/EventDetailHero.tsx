import { BookOpen, CalendarDays, Coins, Tag, Users } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import Lotus from "@/app/components/brand/Lotus";
import { EVENT_STATUS_LABEL, isNewEvent, type EventDetailDto } from "@/app/types/event";
import { eventScheduleWindow, formatVnDate } from "./eventTime";

export default function EventDetailHero({ detail }: { detail: EventDetailDto }) {
  const { start, end } = eventScheduleWindow(detail, detail);
  return (
    <header className="ev-story-hero">
      <div className="ev-story-intro">
        <div className="ev-hero-badges">
          <span className="ev-story-status"><span aria-hidden="true" />{EVENT_STATUS_LABEL[detail.status]}</span>
          {isNewEvent(detail) && <span className="ev-new-badge">Mới</span>}
        </div>
        <h2 className="display">{detail.title}</h2>
        <p>{detail.description}</p>
        <div className="ev-story-meta">
          {start !== null && end !== null && (
            <span><CalendarDays className="ic" aria-hidden="true" />{formatVnDate(start)} – {formatVnDate(end)}</span>
          )}
          <span><Users className="ic" aria-hidden="true" />Nhóm tuổi {detail.targetAgeBands}</span>
          {detail.mainCategoryName && (
            <span><Tag className="ic" aria-hidden="true" />Chủ đề {detail.mainCategoryName}</span>
          )}
          <span><BookOpen className="ic" aria-hidden="true" />Tổng số truyện {detail.eventStoriesCount}</span>
          <span><Coins className="ic" aria-hidden="true" />{detail.budgetVnd > 0 ? `Ngân sách ${detail.budgetVnd.toLocaleString("vi-VN")} đ` : "Thưởng quà / Lượt AI"}</span>
        </div>
      </div>
      <div className="ev-reading-pond" aria-hidden="true">
        <span className="ev-reading-pad" /><Frog size={128} mood="happy" animated={false} />
        <BookOpen className="ev-frog-book" /><Lotus className="ev-reading-lotus" size={64} />
        <span className="ev-reading-ripple" />
      </div>
    </header>
  );
}
