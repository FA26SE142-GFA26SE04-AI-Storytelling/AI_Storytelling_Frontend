"use client";

import type { UpdatePlanSettingsRequest } from "@/app/types/backendContracts";

type S = UpdatePlanSettingsRequest;
type Props = { s: S; set: (patch: Partial<S>) => void };
type NumKey = { [K in keyof S]: S[K] extends number ? K : never }[keyof S];
type NullKey = { [K in keyof S]: S[K] extends number | null ? (null extends S[K] ? K : never) : never }[keyof S];

const NOTE = "Chỉ lưu, chưa áp dụng.";

function Num({ s, set, k, label, min = 0, max, note }: Props & { k: NumKey; label: string; min?: number; max?: number; note?: boolean }) {
  return (
    <label className="field">
      <span className="lbl">{label}</span>
      <input className="inp" type="number" min={min} max={max} value={s[k]} onChange={(e) => set({ [k]: Number(e.target.value) || 0 } as Partial<S>)} />
      {note && <span className="sub">{NOTE}</span>}
    </label>
  );
}

/** Ô số có tuỳ chọn "Không giới hạn" (gửi null). */
function Limit({ s, set, k, label, note }: Props & { k: NullKey; label: string; note?: boolean }) {
  const v = s[k] as number | null;
  return (
    <div className="field">
      <span className="lbl">{label}</span>
      <label className="row"><input type="checkbox" checked={v === null} onChange={(e) => set({ [k]: e.target.checked ? null : 0 } as Partial<S>)} /> Không giới hạn</label>
      {v !== null && <input className="inp" type="number" min={0} value={v} aria-label={label} onChange={(e) => set({ [k]: Math.max(0, Number(e.target.value) || 0) } as Partial<S>)} />}
      {note && <span className="sub">{NOTE}</span>}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="st-card sec"><b>{title}</b>{children}</section>;
}

export default function PlanSettingsFields({ s, set }: Props) {
  const p = { s, set };
  return (
    <>
      <Group title="Quỹ Creator">
        <Num {...p} k="readingFundPercent" label="Tỷ lệ quỹ Gói Đọc (%)" max={100} />
        <Num {...p} k="creativeFundPercent" label="Tỷ lệ quỹ Gói Sáng tạo (%)" max={100} />
      </Group>
      <Group title="Hạn mức Creator">
        <Num {...p} k="creatorMonthlyAiCredits" label="Lượt AI mỗi tháng (Creator thường)" />
        <Num {...p} k="creatorMonthlySubmitCredits" label="Lượt gửi duyệt mỗi tháng (Creator thường)" />
        <Num {...p} k="creatorWritingAssistPerDay" label="Lượt trợ lý viết mỗi ngày (Creator thường)" />
        <Num {...p} k="partnerMonthlyAiCredits" label="Lượt AI mỗi tháng (Creator đối tác)" note />
        <Num {...p} k="partnerMonthlySubmitCredits" label="Lượt gửi duyệt mỗi tháng (Creator đối tác)" note />
        <Num {...p} k="partnerWritingAssistPerDay" label="Lượt trợ lý viết mỗi ngày (Creator đối tác)" note />
      </Group>
      <Group title="Lượt đọc hợp lệ và dùng thử">
        <Num {...p} k="minimumReadSeconds" label="Thời gian đọc tối thiểu (giây)" min={1} max={3600} />
        <Num {...p} k="trialAiCredits" label="Lượt AI dùng thử" />
      </Group>
      <Group title="Mức Miễn phí">
        <Num {...p} k="freeMaxChildProfiles" label="Số hồ sơ bé tối đa" min={1} />
        <Limit {...p} k="freeWeeklyNewLibraryStories" label="Truyện thư viện mới mỗi tuần" />
        <label className="row"><input type="checkbox" checked={s.freeCanCopyRoadmapTemplates} onChange={(e) => set({ freeCanCopyRoadmapTemplates: e.target.checked })} /> Được sao chép bộ truyện mẫu</label>
        <Limit {...p} k="freeReadAloudPerMonth" label="Lượt đọc to mỗi tháng" note />
        <Num {...p} k="freeWritingAssistPerDay" label="Lượt trợ lý viết mỗi ngày" />
      </Group>
    </>
  );
}
