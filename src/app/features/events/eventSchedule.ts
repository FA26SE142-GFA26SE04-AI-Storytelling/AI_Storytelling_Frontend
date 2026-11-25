import { vnDate } from "@/app/lib/readingRules";

const VIETNAM_OFFSET = "+07:00";

export function eventDateInput(offsetDays: number) {
  return vnDate(new Date(Date.now() + offsetDays * 86_400_000));
}

export function eventTimeInput(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(Date.parse(iso) + 7 * 3_600_000).toISOString().slice(0, 16);
}

export function eventDateBoundary(date: string, end: boolean, original?: string) {
  if (original && eventTimeInput(original).slice(0, 10) === date) return new Date(original).toISOString();
  return new Date(`${date}T${end ? "23:59:59.999" : "00:00:00.000"}${VIETNAM_OFFSET}`).toISOString();
}

export function eventTimeValue(value: string, original?: string | null) {
  if (original && eventTimeInput(original) === value) return new Date(original).toISOString();
  return new Date(`${value}${VIETNAM_OFFSET}`).toISOString();
}

export function participationDateError(start: string, end: string, role: string) {
  if (!start || !end) return `Chọn ngày bắt đầu và ngày kết thúc cho ${role}.`;
  if (end < start) return `Ngày kết thúc của ${role} phải từ ngày bắt đầu trở đi.`;
  return "";
}

export function votingDateError({
  submission, review, votingStart, votingEnd, creatorStart, creatorEnd, parentStart, parentEnd,
  authorLabel = "Creator", voterLabel = "Parent",
}: Record<"submission" | "review" | "votingStart" | "votingEnd" | "creatorStart" | "creatorEnd" | "parentStart" | "parentEnd", string>
  & { authorLabel?: string; voterLabel?: string }) {
  if (!submission || !review || !votingStart) return "Nhập hạn nộp, hạn duyệt và giờ mở bình chọn.";
  if (submission <= creatorStart || submission > creatorEnd) return `Hạn nộp phải sau giờ mở và trong lịch tham gia của ${authorLabel}.`;
  if (review < submission) return "Hạn duyệt truyện phải từ hạn nộp truyện trở đi.";
  if (votingStart < review) return "Giờ mở bình chọn phải từ hạn duyệt truyện trở đi.";
  if (votingStart < parentStart || votingEnd > parentEnd || votingEnd <= votingStart) {
    return `Giờ mở và đóng bình chọn phải nằm trong lịch ${voterLabel}, với giờ đóng sau giờ mở.`;
  }
  return "";
}
