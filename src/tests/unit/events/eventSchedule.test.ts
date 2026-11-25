import { describe, expect, it } from "vitest";
import { eventDateBoundary, eventTimeValue, participationDateError, votingDateError } from "@/app/features/events/eventSchedule";
import { eventWindowDateError, validateActivitySchedule } from "@/app/features/events/eventScheduleValidation";
import { formatEventDateInput, formatVnDate, formatVnDateTime, parseEventDateInput } from "@/app/features/events/eventTime";

describe("event schedule in Vietnam", () => {
  it("allows the opening and closing days and flags earlier registrations or later review deadlines", () => {
    const window = { opens: "2026-11-24", closes: "2026-12-01" };
    expect(eventWindowDateError("Mở đăng ký", "2026-11-24", window)).toBe("");
    expect(eventWindowDateError("Hạn duyệt bài", "2026-12-01", window)).toBe("");
    expect(eventWindowDateError("Mở đăng ký", "2026-11-23", window)).toContain("24/11/2026 – 01/12/2026");
    expect(eventWindowDateError("Hạn duyệt bài", "2026-12-02", window)).toContain("Hạn duyệt bài");
  });

  it("displays and parses ambiguous dates day first while preserving the ISO wire value", () => {
    expect(formatEventDateInput("2026-12-01")).toBe("01/12/2026");
    expect(parseEventDateInput("01/12/2026")).toBe("2026-12-01");
    expect(parseEventDateInput("01122026")).toBe("2026-12-01");
    expect(parseEventDateInput("31/11/2026")).toBe("");
    expect(parseEventDateInput("29/02/2028")).toBe("2028-02-29");
    expect(parseEventDateInput("01/12/2026 09:30", true)).toBe("2026-12-01T09:30");
    expect(parseEventDateInput("01/12/2026 24:00", true)).toBe("");
    expect(formatVnDate("2026-11-30T17:00:00.000Z")).toBe("01/12/2026");
    expect(formatVnDateTime("2026-11-30T17:00:00.000Z")).toBe("01/12/2026 00:00:00");
  });

  it("points to the registration deadline when it exceeds the submission deadline", () => {
    const dates = {
      regStart: { label: "Mở đăng ký", value: "2026-11-24" },
      regEnd: { label: "Đóng đăng ký", value: "2026-12-01" },
      start: { label: "Mở nhận bài", value: "2026-11-24" },
      end: { label: "Hạn nộp bài", value: "2026-11-25" },
    };
    expect(validateActivitySchedule(dates)).toEqual({
      regStart: "", regEnd: "Đóng đăng ký không được sau Hạn nộp bài (25/11/2026).", start: "", end: "",
    });
    expect(Object.values(validateActivitySchedule({
      ...dates, regEnd: { ...dates.regEnd, value: dates.end.value },
    })).every((error) => !error)).toBe(true);
  });

  it("returns separate errors for missing dates and reversed dates", () => {
    expect(validateActivitySchedule({
      regStart: { label: "Mở đăng ký", value: "2026-11-25" },
      regEnd: { label: "Đóng đăng ký", value: "2026-11-24" },
      start: { label: "Mở bình chọn", value: "2026-11-24" },
      end: { label: "Đóng bình chọn", value: "" },
    })).toEqual({
      regStart: "",
      regEnd: "Đóng đăng ký không được trước ngày Mở đăng ký (25/11/2026).",
      start: "Mở bình chọn không được trước ngày Mở đăng ký (25/11/2026).",
      end: "Hãy chọn ngày cho “Đóng bình chọn”.",
    });
  });

  it("accepts participation on one day and keeps the entire inclusive day", () => {
    expect(participationDateError("2026-12-16", "2026-12-16", "Parent")).toBe("");
    expect(eventDateBoundary("2026-12-16", false)).toBe("2026-12-15T17:00:00.000Z");
    expect(eventDateBoundary("2026-12-16", true)).toBe("2026-12-16T16:59:59.999Z");
    expect(participationDateError("2026-12-16", "2026-12-12", "Parent")).toContain("Parent");
  });

  it("allows shared participation dates with distinct submission, review, and voting times", () => {
    const start = eventDateBoundary("2026-12-12", false);
    const end = eventDateBoundary("2026-12-16", true);
    const schedule = {
      creatorStart: start, creatorEnd: end, parentStart: start, parentEnd: end,
      submission: eventTimeValue("2026-12-16T09:00"),
      review: eventTimeValue("2026-12-16T12:00"),
      votingStart: eventTimeValue("2026-12-16T13:00"),
      votingEnd: end,
    };
    expect(votingDateError(schedule)).toBe("");
    expect(votingDateError({ ...schedule, votingStart: schedule.submission })).toContain("Giờ mở bình chọn");
    expect(votingDateError({ ...schedule, votingEnd: eventTimeValue("2026-12-17T08:00") })).toContain("lịch Parent");
  });
});
