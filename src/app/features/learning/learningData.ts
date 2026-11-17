"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parentReadingFeedbackService, parentStorySummaryService } from "@/app/services/childReadingService";
import { parentWishService } from "@/app/services/storyWishService";
import type { PagedParentSummaries, PagedReadingFeedback, ParentReadingOverview, ReadingFeedbackFilter, StoryEmotionCode } from "@/app/types/childReading";
import type { ApiResponse } from "@/app/types/auth";
import { showToast } from "@/app/lib/toast";
import type { ParentWishDto } from "@/app/types/storyWish";
import type { RoadmapItem } from "@/app/types/progress";
import { groupStages } from "@/app/services/roadmapAdapters";

export const FEELING_FACE: Record<string, string> = { VeryLike: "😍", Like: "🙂", Neutral: "😐", Dislike: "🙁" };

/** 7 cảm xúc sau khi đọc, theo thứ tự Backend. Nhãn chỉ dùng cho emotionCounts (tổng quan chỉ trả mã); danh sách phiên dùng label từ API. */
export const EMOTION_KEYS: readonly StoryEmotionCode[] = ["Happy", "Funny", "Surprised", "Excited", "Touched", "Sad", "Scared"];
export const EMOTION_FACE: Record<string, string> = { Happy: "😄", Funny: "😂", Surprised: "😮", Excited: "😆", Touched: "🥹", Sad: "😢", Scared: "😨" };
export const EMOTION_LABEL: Record<StoryEmotionCode, string> = { Happy: "Vui", Funny: "Buồn cười", Surprised: "Ngạc nhiên", Excited: "Hồi hộp", Touched: "Cảm động", Sad: "Buồn", Scared: "Hơi sợ" };

/**
 * Tải dữ liệu cho popup (gọi khi mở). Dữ liệu có link ký hết hạn sau 15 phút: khi ảnh/âm thanh lỗi gọi refresh()
 * để lấy link mới, chỉ một lần mỗi lần mở để không lặp vô hạn. Lỗi lần tải đầu: toast rồi đóng popup.
 */
export function usePopupData<T>(load: (signal: AbortSignal) => Promise<ApiResponse<T>>, onClose: () => void) {
  const [data, setData] = useState<T | null>(null);
  const [tick, setTick] = useState(0);
  const refreshed = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      if (r.success && r.data) return setData(r.data);
      showToast(r.success ? "Không tải được dữ liệu, bạn thử lại nhé." : r.message, "err");
      if (tick === 0) onClose();
    });
    return () => controller.abort();
  }, [load, onClose, tick]);
  const refresh = useCallback(() => {
    if (refreshed.current) return;
    refreshed.current = true;
    setTick((t) => t + 1);
  }, []);
  return { data, setData, refresh };
}

export const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

/** Chia lộ trình thành đã đọc / đang đọc / chờ / đã gỡ hoặc bỏ qua. */
export function splitRoadmap(items: RoadmapItem[] | undefined) {
  const list = items ?? [];
  const done = list.filter((i) => i.status === "completed").sort((a, b) => Date.parse(a.completedAt ?? "") - Date.parse(b.completedAt ?? ""));
  const opens = list.filter((i) => i.status === "open").sort((a, b) => a.id - b.id);
  const open = opens[0] ?? null;
  const queued = list.filter((i) => i.status === "queued").sort((a, b) => a.position - b.position || a.id - b.id);
  const off = list.filter((i) => i.status === "skipped" || i.status === "removed");
  return { done, open, opens, queued, off, stages: groupStages(list), total: done.length + opens.length + queued.length };
}

type Paged<T> = { data: T | null; error: string; reload: () => void };

/** Chuyển khoảng lọc thời gian sang mốc UTC ISO. */
export function rangeToUtc(range: ReadingFeedbackFilter["range"], now: Date = new Date()): { from: string | null; to: string | null } {
  if (range === "all") return { from: null, to: null };
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === "7d") {
    start.setDate(start.getDate() - 6);
  } else if (range === "30d") {
    start.setDate(start.getDate() - 29);
  }
  return { from: start.toISOString(), to: null };
}

/** Truyện bé đã đọc xong: cảm xúc, điểm câu đố, câu trả lời ở điểm dừng (GET /ParentReadingFeedback). */
export function useReadingFeedback(
  childId: number,
  page: number,
  pageSize: number,
  filter: ReadingFeedbackFilter = { status: "Completed", range: "all" },
): Paged<PagedReadingFeedback> & { loading: boolean } {
  const [data, setData] = useState<PagedReadingFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const { from, to } = rangeToUtc(filter.range);
    void parentReadingFeedbackService.list(childId, page, pageSize, { status: filter.status, from, to }, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      setLoading(false);
      setData(r.success ? r.data : null);
      setError(r.success ? "" : r.message);
    });
    return () => controller.abort();
  }, [childId, page, pageSize, filter.status, filter.range, tick]);
  return { data, error, loading, reload: useCallback(() => setTick((t) => t + 1), []) };
}

/** Tổng quan việc đọc của bé theo khoảng thời gian (GET /ParentReadingFeedback/{id}/overview). */
export function useReadingOverview(childId: number, range: ReadingFeedbackFilter["range"]): Paged<ParentReadingOverview> {
  const [data, setData] = useState<ParentReadingOverview | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const { from, to } = rangeToUtc(range);
    void parentReadingFeedbackService.overview(childId, from, to, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      setData(r.success ? r.data : null);
      setError(r.success ? "" : r.message);
    });
    return () => controller.abort();
  }, [childId, range, tick]);
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

/** data: điều ước đang chờ bố mẹ xử lý; making: điều ước bố mẹ đã chọn "Tạo truyện mới" và truyện đang được tạo. */
export function usePendingWishes(childId: number): Paged<ParentWishDto[]> & { making: ParentWishDto[] } {
  const [data, setData] = useState<ParentWishDto[] | null>(null);
  const [making, setMaking] = useState<ParentWishDto[]>([]);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void parentWishService.list(childId, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      setData(r.success ? (r.data ?? []).filter((w) => w.status === "Pending") : null);
      setMaking(r.success ? (r.data ?? []).filter((w) => w.status === "Accepted" && w.generatedStoryId != null) : []);
      setError(r.success ? "" : r.message);
    });
    return () => controller.abort();
  }, [childId, tick]);
  return { data, making, error, reload: useCallback(() => setTick((t) => t + 1), []) };
}
