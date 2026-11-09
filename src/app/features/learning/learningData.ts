"use client";

import { useCallback, useEffect, useState } from "react";
import { parentReadingFeedbackService, parentStorySummaryService } from "@/app/services/childReadingService";
import { parentWishService } from "@/app/services/storyWishService";
import type { PagedParentSummaries, PagedReadingFeedback } from "@/app/types/childReading";
import type { ParentWishDto } from "@/app/types/storyWish";
import type { RoadmapItem } from "@/app/types/progress";

export const FEELING_FACE: Record<string, string> = { VeryLike: "😍", Like: "🙂", Neutral: "😐", Dislike: "🙁" };

export const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

/** Chia lộ trình thành đã đọc / đang đọc / chờ / đã gỡ hoặc bỏ qua. */
export function splitRoadmap(items: RoadmapItem[] | undefined) {
  const list = items ?? [];
  const done = list.filter((i) => i.status === "completed").sort((a, b) => Date.parse(a.completedAt ?? "") - Date.parse(b.completedAt ?? ""));
  const open = list.find((i) => i.status === "open") ?? null;
  const queued = list.filter((i) => i.status === "queued").sort((a, b) => a.position - b.position);
  const off = list.filter((i) => i.status === "skipped" || i.status === "removed");
  return { done, open, queued, off, total: done.length + (open ? 1 : 0) + queued.length };
}

type Paged<T> = { data: T | null; error: string; reload: () => void };

/** Truyện bé đã đọc xong: cảm xúc, điểm câu đố, câu trả lời ở điểm dừng (GET /ParentReadingFeedback). */
export function useReadingFeedback(childId: number, page: number, pageSize: number): Paged<PagedReadingFeedback> {
  const [data, setData] = useState<PagedReadingFeedback | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void parentReadingFeedbackService.list(childId, page, pageSize, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      setData(r.success ? r.data : null);
      setError(r.success ? "" : r.message);
    });
    return () => controller.abort();
  }, [childId, page, pageSize, tick]);
  return { data, error, reload: useCallback(() => setTick((t) => t + 1), []) };
}

/** Phần bé kể lại cuối truyện (GET /ParentStorySummary). */
export function useStorySummaries(childId: number, page: number, pageSize: number): Paged<PagedParentSummaries> {
  const [data, setData] = useState<PagedParentSummaries | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void parentStorySummaryService.list(childId, page, pageSize, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      setData(r.success ? r.data : null);
      setError(r.success ? "" : r.message);
    });
    return () => controller.abort();
  }, [childId, page, pageSize, tick]);
  return { data, error, reload: useCallback(() => setTick((t) => t + 1), []) };
}

/** Điều ước bé gửi đang chờ bố mẹ xử lý. */
export function usePendingWishes(childId: number): Paged<ParentWishDto[]> {
  const [data, setData] = useState<ParentWishDto[] | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void parentWishService.list(childId, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      setData(r.success ? (r.data ?? []).filter((w) => w.status === "Pending") : null);
      setError(r.success ? "" : r.message);
    });
    return () => controller.abort();
  }, [childId, tick]);
  return { data, error, reload: useCallback(() => setTick((t) => t + 1), []) };
}
