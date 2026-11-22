"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRiseIn } from "@/app/lib/motion";

type ShelfProps = { title: string; sub?: string; /** Kệ cần chú ý (việc phụ huynh phải làm): nền và viền vàng. */ accent?: boolean; items: { id: number }[]; pills?: { id: string; label: string }[]; pill?: string; onPill?: (id: string) => void; onAll?: () => void; children: React.ReactNode };

/** Một kệ truyện: tiêu đề, nút lọc dạng viên thuốc và "Xem tất cả". */
export function Shelf({ title, sub, accent, items, pills, pill, onPill, onAll, children }: ShelfProps) {
  // Mỗi kệ tự chạy hiệu ứng hiện dần, chỉ khi danh sách truyện của chính kệ đó đổi (đổi chủ đề không làm kệ khác nháy lại).
  const animKey = items.map((s) => s.id).join(",");
  const ref = useRiseIn<HTMLElement>(".bk", [animKey], { delay: 22, distance: 12 });
  return (
    <section ref={ref} className={`shelf${accent ? " accent" : ""}`} aria-label={title}>
      <div className="shelf-h">
        <h3 className="display">{title}</h3>
        {sub && <span className="sub">{sub}</span>}
        {onAll && <button className="shelf-all" onClick={onAll}>Xem tất cả<ChevronRight className="ic" /></button>}
      </div>
      {pills && pills.length > 0 && (
        <div className="shelf-pills" role="tablist">
          {pills.map((p) => <button key={p.id} role="tab" aria-selected={pill === p.id} className={pill === p.id ? "on" : ""} onClick={() => onPill?.(p.id)}>{p.label}</button>)}
        </div>
      )}
      {children}
    </section>
  );
}

/** Hàng ngang cuộn được, có nút mũi tên hai bên. */
export function ShelfRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const measure = useCallback(() => {
    const el = ref.current; if (!el) return;
    const start = el.scrollLeft < 4, end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdge((v) => (v.start === start && v.end === end ? v : { start, end }));
  }, []);
  useEffect(() => {
    measure();
    const el = ref.current;
    const ro = el ? new ResizeObserver(measure) : null;
    if (el && ro) { ro.observe(el); Array.from(el.children).forEach((c) => ro.observe(c)); }
    return () => ro?.disconnect();
  }, [measure, children]);
  const move = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="shelf-row-wrap">
      {!edge.start && <button className="shelf-arrow left" aria-label="Xem truyện trước" onClick={() => move(-1)}><ChevronLeft className="ic" /></button>}
      <div className="shelf-row" ref={ref} onScroll={measure}>{children}</div>
      {!edge.end && <button className="shelf-arrow right" aria-label="Xem thêm truyện" onClick={() => move(1)}><ChevronRight className="ic" /></button>}
    </div>
  );
}
