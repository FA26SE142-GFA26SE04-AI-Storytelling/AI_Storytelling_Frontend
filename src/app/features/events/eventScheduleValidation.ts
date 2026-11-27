import { formatEventDateInput } from "./eventTime";

type DateField = { label: string; value: string };
type ActivitySchedule = {
  regStart?: DateField;
  regEnd?: DateField;
  start: DateField;
  end: DateField;
};
type EventWindow = { opens: string; closes: string };

export function eventWindowDateError(label: string, date: string, window: EventWindow) {
  if (!date || !window.opens || !window.closes || window.opens > window.closes) return "";
  return date < window.opens || date > window.closes
    ? `${label} phải nằm trong lịch sự kiện (${formatEventDateInput(window.opens)} – ${formatEventDateInput(window.closes)}).`
    : "";
}

export function validateActivitySchedule({ regStart, regEnd, start, end }: ActivitySchedule, window?: EventWindow) {
  const required = ({ label, value }: DateField) => !value ? `Hãy chọn ngày cho “${label}”.`
    : window ? eventWindowDateError(label, value, window) : "";
  const earlier = (a: DateField, b: DateField) => a.value && b.value && a.value < b.value;
  const limit = ({ label, value }: DateField) => `${label} (${formatEventDateInput(value)})`;

  return {
    regStart: regStart ? required(regStart) : "",
    regEnd: regEnd
      ? required(regEnd) ||
        (regStart && earlier(regEnd, regStart) ? `Đóng đăng ký không được trước ngày ${limit(regStart)}.` :
          earlier(end, regEnd) ? `Đóng đăng ký không được sau ${limit(end)}.` : "")
      : "",
    start: required(start) ||
      (regStart && earlier(start, regStart) ? `${start.label} không được trước ngày ${limit(regStart)}.` : ""),
    end: required(end) ||
      (earlier(end, start) ? `${end.label} không được trước ngày ${limit(start)}.` : ""),
  };
}
