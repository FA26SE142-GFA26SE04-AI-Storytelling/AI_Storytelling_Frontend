import type { ReadingFeedbackFilter } from "@/app/types/childReading";

const STATUS_OPTIONS: { id: ReadingFeedbackFilter["status"]; label: string }[] = [
  { id: "Completed", label: "Đã đọc xong" },
  { id: "Unfinished", label: "Chưa đọc xong" },
];

const RANGE_OPTIONS: { id: ReadingFeedbackFilter["range"]; label: string }[] = [
  { id: "7d", label: "7 ngày" },
  { id: "30d", label: "30 ngày" },
  { id: "all", label: "Tất cả" },
];

export default function ReadingFilters({
  value,
  onChange,
}: {
  value: ReadingFeedbackFilter;
  onChange: (v: ReadingFeedbackFilter) => void;
}) {
  return (
    <div className="lr-filters">
      <div className="seg" role="radiogroup" aria-label="Trạng thái đọc">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={value.status === opt.id}
            className={value.status === opt.id ? "on" : ""}
            onClick={() => onChange({ ...value, status: opt.id })}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="chips" role="radiogroup" aria-label="Khoảng thời gian">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={value.range === opt.id}
            className={value.range === opt.id ? "chip on" : "chip"}
            onClick={() => onChange({ ...value, range: opt.id })}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
