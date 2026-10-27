"use client";

import { BookOpen, CheckCircle2, Clock, Sparkles, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { ChildProfile, TokenQuotaStatus } from "@/app/types/childProfile";
import { statusKey, type StoryCard } from "@/app/lib/storyView";

/** Nhóm trạng thái truyện để thống kê. Nhãn bằng chữ, thanh dài ngắn cùng một màu (không dựa vào màu để phân biệt). */
const GROUPS: { id: string; label: string; keys: string[] }[] = [
  { id: "published", label: "Đã xuất bản", keys: ["published"] },
  { id: "approved", label: "Đã duyệt, sẵn sàng", keys: ["ready", "approved"] },
  { id: "review", label: "Chờ bạn duyệt", keys: ["outline_review", "content_review", "media_review"] },
  { id: "working", label: "AI đang làm", keys: ["input_accepted", "generating", "media_processing", "moderation_review"] },
  { id: "blocked", label: "Bị chặn", keys: ["blocked"] },
];
const MONTHS = 6;
/** WorkspaceDataContext tải tối đa 100 truyện mới nhất của tài khoản. */
const PAGE_CAP = 100;

function Tile({ icon, value, label, hint }: { icon: ReactNode; value: ReactNode; label: string; hint?: string }) {
  return (
    <div className="as-tile" title={hint}>
      <span className="as-ic" aria-hidden>{icon}</span>
      <b className="display">{value}</b>
      <small>{label}</small>
    </div>
  );
}

/** Thống kê của tài khoản ở cuối trang Tổng quan: số bé, truyện đã tạo theo trạng thái và theo tháng, lượt tạo truyện. */
export default function AccountStats({ kids, stories, quota }: { kids: ChildProfile[]; stories: StoryCard[]; quota: TokenQuotaStatus | null }) {
  const capped = stories.length >= PAGE_CAP;
  const total = capped ? `${PAGE_CAP}+` : stories.length;
  const keyOf = (s: StoryCard) => statusKey(s.raw);
  const known = new Set(GROUPS.flatMap((g) => g.keys));
  const rows = [
    ...GROUPS.map((g) => ({ ...g, count: stories.filter((s) => g.keys.includes(keyOf(s))).length })),
    { id: "other", label: "Bản nháp và khác", keys: [], count: stories.filter((s) => !known.has(keyOf(s))).length },
  ].filter((r) => r.count > 0);
  const maxRow = Math.max(1, ...rows.map((r) => r.count));
  const approved = rows.filter((r) => r.id === "published" || r.id === "approved").reduce((n, r) => n + r.count, 0);
  const waiting = rows.find((r) => r.id === "review")?.count ?? 0;

  // Truyện tạo trong 6 tháng gần nhất (tính cả tháng này).
  const now = new Date();
  const months = Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1);
    const count = stories.filter((s) => { const c = new Date(s.createdAt); return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth(); }).length;
    return { key: `${d.getFullYear()}-${d.getMonth()}`, short: `T${d.getMonth() + 1}`, long: `tháng ${d.getMonth() + 1}/${d.getFullYear()}`, count, current: i === MONTHS - 1 };
  });
  const maxMonth = Math.max(1, ...months.map((m) => m.count));

  return (
    <section className="dash-block wide as" aria-labelledby="as-title">
      <h3 id="as-title">Thống kê tài khoản</h3>

      <div className="as-tiles">
        <Tile icon={<Users />} value={kids.length} label="hồ sơ bé" />
        <Tile icon={<BookOpen />} value={total} label="truyện đã tạo" hint={capped ? `Tính trên ${PAGE_CAP} truyện mới nhất` : undefined} />
        <Tile icon={<CheckCircle2 />} value={approved} label="đã duyệt" />
        <Tile icon={<Clock />} value={waiting} label="chờ bạn duyệt" />
        <Tile icon={<Sparkles />}
          value={quota ? (quota.isUnlimited ? "∞" : <>{quota.quotaUsed ?? 0}<small>/{quota.quotaLimit ?? "?"}</small></>) : "—"}
          label={quota?.isUnlimited ? "lượt tạo truyện" : "lượt tạo truyện đã dùng"} />
      </div>

      {stories.length === 0 ? <p className="sub">Chưa có truyện nào. Tạo truyện đầu tiên để xem thống kê.</p> : (
        <div className="as-charts">
          <div className="as-panel">
            <h4>Truyện theo trạng thái</h4>
            <table className="as-table">
              <thead className="sr-only"><tr><th>Trạng thái</th><th>Số truyện</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">{r.label}</th>
                    <td className="as-bar-cell"><span className="as-hbar" style={{ width: `${(r.count / maxRow) * 100}%` }} aria-hidden /></td>
                    <td className="as-num">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="as-panel">
            <h4>Truyện tạo trong {MONTHS} tháng qua</h4>
            <div className="as-cols" aria-hidden>
              {months.map((m) => (
                <div key={m.key} className={`as-col${m.current ? " now" : ""}`} title={`${m.count} truyện trong ${m.long}`}>
                  <em>{m.count || ""}</em>
                  <i style={{ height: `${(m.count / maxMonth) * 100}%` }} />
                  <small>{m.short}</small>
                </div>
              ))}
            </div>
            <table className="sr-only">
              <caption>Số truyện tạo theo tháng</caption>
              <tbody>{months.map((m) => <tr key={m.key}><th scope="row">{m.long}</th><td>{m.count}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
      {capped && <small className="sub">Số liệu tính trên {PAGE_CAP} truyện mới nhất của tài khoản.</small>}
    </section>
  );
}
