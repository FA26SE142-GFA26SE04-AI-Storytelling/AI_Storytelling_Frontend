"use client";

import { completionPercent, ratePercent, vnd } from "@/app/lib/billing";
import type { CreatorContentStatisticsDto, CreatorReadingStatisticsDto, CreatorRevenueStatisticsDto } from "@/app/types/backendContracts";

function Counts({ items }: { items: [string, number][] }) {
  return <div className="row" style={{ flexWrap: "wrap", gap: 16 }}>
    {items.map(([label, n]) => <div key={label} style={{ display: "flex", flexDirection: "column" }}>
      <span className="sub">{label}</span><b className="display" style={{ fontSize: "var(--fs-xl)" }}>{n}</b>
    </div>)}
  </div>;
}

export function ContentSection({ data }: { data: CreatorContentStatisticsDto }) {
  return <>
    <Counts items={[["Bản nháp", data.draft], ["Sẵn sàng", data.ready], ["Chờ duyệt", data.pendingReview], ["Đã xuất bản", data.published]]} />
    <Counts items={[["Được duyệt", data.submissionsApproved], ["Bị từ chối", data.submissionsRejected], ["Yêu cầu sửa", data.submissionsChangesRequested], ["Đã rút", data.submissionsWithdrawn]]} />
  </>;
}

export function ReadingSection({ data }: { data: CreatorReadingStatisticsDto }) {
  return <>
    <Counts items={[["Lượt xem", data.views], ["Yêu thích", data.favorites], ["Đọc hết", data.completedReadings], ["Lượt đọc hợp lệ", data.validReads]]} />
    <span className="sub">Tỷ lệ đọc hết: {completionPercent(data.completionRate)}</span>
    {data.stories.length === 0 ? <p className="sub">Chưa có lượt đọc trong kỳ này.</p> : <div className="st-scroll">
      <table className="st-table stack-table">
        <thead><tr><th>Truyện</th><th>Lượt xem</th><th>Yêu thích</th><th>Đọc hết</th><th>Lượt đọc hợp lệ</th><th>Tỷ lệ đọc hết</th></tr></thead>
        <tbody>{data.stories.map(s => <tr key={s.storyId}>
          <td data-label="Truyện">{s.title}</td><td data-label="Lượt xem">{s.views}</td><td data-label="Yêu thích">{s.favorites}</td>
          <td data-label="Đọc hết">{s.completedReadings}</td><td data-label="Lượt đọc hợp lệ">{s.validReads}</td><td data-label="Tỷ lệ đọc hết">{completionPercent(s.completionRate)}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </>;
}

export function RevenueSection({ data }: { data: CreatorRevenueStatisticsDto }) {
  return <>
    <b className="display" style={{ fontSize: "var(--fs-xl)" }}>Thu nhập dự kiến: {vnd(data.estimatedEarningsVnd)}</b>
    <p className="sub" style={{ margin: 0 }}>
      Quỹ Creator kỳ này {vnd(data.creatorFundVnd)} = {ratePercent(data.readingFundRate)}% doanh thu Gói Đọc + {ratePercent(data.creativeFundRate)}% doanh thu Gói Sáng tạo.
      {" "}Bạn có {data.myValidReads}/{data.totalValidReadsAllCreators} lượt đọc hợp lệ (đọc từ {data.minimumReadSeconds} giây).
    </p>
    {data.myValidReads === 0 || data.stories.length === 0 ? <p className="sub">Chưa có lượt đọc hợp lệ trong kỳ này.</p> : <div className="st-scroll">
      <table className="st-table stack-table">
        <thead><tr><th>Truyện</th><th>Lượt đọc hợp lệ</th><th>Thu nhập dự kiến</th></tr></thead>
        <tbody>{data.stories.map(s => <tr key={s.storyId}>
          <td data-label="Truyện">{s.title}</td><td data-label="Lượt đọc hợp lệ">{s.validReads}</td><td data-label="Thu nhập dự kiến">{vnd(s.estimatedEarningsVnd)}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    <p className="sub" style={{ margin: 0 }}>Đây là số dự kiến. Việc chi trả thực hiện ngoài hệ thống.</p>
  </>;
}
