import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { MonthPeriod } from "@/app/lib/monthPeriods";
import MonthAreaChart from "@/app/components/stats/MonthAreaChart";

describe("MonthAreaChart component", () => {
  it("renders SVG area chart with points, axis and tooltip correctly", () => {
    const months: MonthPeriod[] = [
      { key: "2026-06", label: "T6/2026", start: "2026-06-01", end: "2026-06-30" },
      { key: "2026-07", label: "T7/2026", start: "2026-07-01", end: "2026-07-31" },
      { key: "2026-08", label: "T8/2026", start: "2026-08-01", end: "2026-08-31" },
      { key: "2026-09", label: "T9/2026", start: "2026-09-01", end: "2026-09-30" },
      { key: "2026-10", label: "T10/2026", start: "2026-10-01", end: "2026-10-31" },
      { key: "2026-11", label: "T11/2026", start: "2026-11-01", end: "2026-11-30" },
    ];
    const values = [0, 0, 0, 0, 49000, 128000];
    const format = (n: number) => `${Math.round(n / 1000)}k`;

    const html = renderToStaticMarkup(
      <MonthAreaChart
        title="Doanh thu 6 tháng gần nhất"
        months={months}
        values={values}
        format={format}
        selectedKey="2026-11"
      />
    );

    // Kiểm tra render tiêu đề
    expect(html).toContain("Doanh thu 6 tháng gần nhất");

    // Kiểm tra có các nhãn tháng
    expect(html).toContain("T6");
    expect(html).toContain("T10");
    expect(html).toContain("T11");

    // Kiểm tra có đường line và area gradient SVG
    expect(html).toContain("mac-line");
    expect(html).toContain("mac-area");

    // Kiểm tra có tooltip hiển thị giá trị cao nhất
    expect(html).toContain("mac-tip-box");
    expect(html).toContain("128k");
  });
});
