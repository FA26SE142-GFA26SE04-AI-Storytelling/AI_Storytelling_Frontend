"use client";

import { useEffect, useState, type ReactNode } from "react";
import PeriodPicker from "@/app/components/PeriodPicker";
import { currentMonthPeriod } from "@/app/lib/billing";
import type { Period } from "@/app/services/adminBillingService";
import { creatorStatisticsService } from "@/app/services/creatorStatisticsService";
import type { CreatorContentStatisticsDto, CreatorReadingStatisticsDto, CreatorRevenueStatisticsDto } from "@/app/types/backendContracts";
import { ContentSection, ReadingSection, RevenueSection } from "./CreatorStatisticsTables";
import { Page } from "./ui";

type Slot<T> = { loading: boolean; data: T | null; error: string };
const pending = <T,>(): Slot<T> => ({ loading: true, data: null, error: "" });

function Section<T>({ title, slot, children }: { title: string; slot: Slot<T>; children: (d: T) => ReactNode }) {
  return <section className="st-card" aria-busy={slot.loading}>
    <h3>{title}</h3>
    {slot.loading && <p className="sub">Đang tải…</p>}
    {!slot.loading && slot.error && <p className="notice err" role="alert" data-inline-notice>{slot.error}</p>}
    {!slot.loading && !slot.error && (slot.data ? children(slot.data) : <p className="sub">Chưa có dữ liệu trong kỳ này.</p>)}
  </section>;
}

/** Trang "Thống kê" của Content Creator: nội dung, lượt đọc và thu nhập dự kiến theo kỳ. */
export default function CreatorStatistics() {
  const [period, setPeriod] = useState<Period>(() => currentMonthPeriod(new Date()));
  const [content, setContent] = useState<Slot<CreatorContentStatisticsDto>>(pending);
  const [reading, setReading] = useState<Slot<CreatorReadingStatisticsDto>>(pending);
  const [revenue, setRevenue] = useState<Slot<CreatorRevenueStatisticsDto>>(pending);

  useEffect(() => {
    const c = new AbortController();
    const run = <T,>(req: Promise<{ success: boolean; data?: T | null; message: string }>, set: (s: Slot<T>) => void) => {
      set(pending<T>());
      void req.then(r => { if (!c.signal.aborted) set({ loading: false, data: r.success ? r.data ?? null : null, error: r.success ? "" : r.message }); });
    };
    run(creatorStatisticsService.content(period, c.signal), setContent);
    run(creatorStatisticsService.reading(period, undefined, c.signal), setReading);
    run(creatorStatisticsService.revenue(period, undefined, c.signal), setRevenue);
    return () => c.abort();
  }, [period]);

  return <Page title="Thống kê">
    <PeriodPicker value={period} onChange={setPeriod} />
    <p className="sub">Số liệu tính trực tiếp, kỳ tính trọn ngày theo giờ UTC.</p>
    <Section title="Tình hình nội dung" slot={content}>{d => <ContentSection data={d} />}</Section>
    <Section title="Lượt đọc" slot={reading}>{d => <ReadingSection data={d} />}</Section>
    <Section title="Thu nhập dự kiến" slot={revenue}>{d => <RevenueSection data={d} />}</Section>
  </Page>;
}
