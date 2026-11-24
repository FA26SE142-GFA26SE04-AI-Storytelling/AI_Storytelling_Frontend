"use client";

import { useEffect, useState } from "react";
import { BarChart3, ChevronRight, Coins, MailWarning, ReceiptText, TrendingUp, TriangleAlert, UserRoundCheck, Users, Wallet, type LucideIcon } from "lucide-react";
import type { AdminPaymentTransactionDto, RevenueStatisticsDto, UserAccountStatisticsDto } from "@/app/types/backendContracts";
import type { AdminCreatorStatistics } from "@/app/types/creatorAdmin";
import { defaultPeriod, lastMonths, PRESET_LABEL } from "@/app/lib/monthPeriods";
import { staffService } from "@/app/services/staffService";
import { adminPaymentService } from "@/app/services/paymentService";
import { creatorAdminService } from "@/app/services/creatorAdminService";
import StatCard from "@/app/components/stats/StatCard";
import MonthBars from "@/app/components/stats/MonthBars";
import MonthAreaChart from "@/app/components/stats/MonthAreaChart";
import { useMonthlyStats } from "@/app/components/stats/useMonthlyStats";
import { count, money, shortMoney } from "@/app/components/stats/statFormat";
import { useRiseIn } from "@/app/lib/motion";
import type { CreatorPageProps } from "./CreatorStories";
import { Payer, PayPill } from "./AdminSystem";
import { useAdminTodo, type AdminTodo } from "./adminTodo";
import { Page, fmt } from "./ui";
import "@/app/styles/features/staff/AdminDashboard.css";

type Stats = { revenue: RevenueStatisticsDto | null; accounts: UserAccountStatisticsDto | null; creators: AdminCreatorStatistics | null };
type TodoDef = { key: keyof AdminTodo; label: string; hint: string; page: string; tone: "wait" | "flag" | "ai" | "ok"; icon: LucideIcon };

/** Mỗi việc đang chờ dẫn thẳng tới trang xử lý việc đó. */
const TODOS: TodoDef[] = [
  { key: "pendingApplications", label: "Đơn đăng ký Creator chờ duyệt", hint: "Duyệt hoặc từ chối đơn", page: "creators", tone: "wait", icon: UserRoundCheck },
  { key: "mismatchedPayments", label: "Giao dịch sai số tiền", hint: "Đối chiếu sao kê rồi xác nhận", page: "payments", tone: "flag", icon: ReceiptText },
  { key: "openReconciliations", label: "Giao dịch chờ áp gói", hint: "Đã nhận tiền nhưng gói chưa được áp", page: "payments", tone: "flag", icon: TriangleAlert },
  { key: "payoutsDue", label: "Creator đến hạn chi trả", hint: "Ghi nhận lần chi trong mục Chi trả", page: "creators", tone: "ai", icon: Wallet },
  { key: "pendingInvites", label: "Lời mời nhân viên chưa nhận", hint: "Gửi lại hoặc huỷ lời mời", page: "staff", tone: "ok", icon: MailWarning },
];

/** undefined: đang tải; null: lỗi. */
const show = (v: number | null | undefined, fmt: (n: number) => string = count) => (v === undefined ? "…" : v === null ? "—" : fmt(v));

export default function AdminOverview({ go }: CreatorPageProps) {
  const [period] = useState(() => defaultPeriod());
  const [months] = useState(() => lastMonths(6));
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const todo = useAdminTodo(true, null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<AdminPaymentTransactionDto[] | null | undefined>(undefined);

  // Hiệu ứng lướt nhẹ các thẻ khi mở trang
  const animRef = useRiseIn<HTMLDivElement>(".ce-stat, .adm-card", [], { delay: 40, distance: 14 });

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    const data = <T,>(p: Promise<{ success: boolean; data: T | null }>) => p.then((r) => (r.success ? r.data : null), () => null);
    void Promise.all([
      data(staffService.revenueStats(period.start, period.end, ctrl.signal)),
      data(staffService.accountStats(period.start, period.end, ctrl.signal)),
      data(creatorAdminService.creatorStats(period.start, period.end, ctrl.signal)),
    ]).then(([revenue, accounts, creators]) => { if (alive) setStats({ revenue, accounts, creators }); });
    void data(adminPaymentService.transactions({ pageIndex: 1, pageSize: 5 })).then((r) => { if (alive) setRecent(r ? r.items : null); });
    return () => { alive = false; ctrl.abort(); };
  }, [period.start, period.end]);

  const monthly = useMonthlyStats(months, (s, e, sig) => staffService.revenueStats(s, e, sig), (d) => d.totalRevenueVnd, []);

  const pick = <T,>(get: (s: Stats) => T | null) => (stats === null ? undefined : get(stats));
  const revenue = pick((s) => s.revenue);
  const accounts = pick((s) => s.accounts);
  const creators = pick((s) => s.creators);
  const payIssues = todo === null ? undefined
    : todo.mismatchedPayments === null && todo.openReconciliations === null ? null
    : (todo.mismatchedPayments ?? 0) + (todo.openReconciliations ?? 0);
  const todoTotal = todo === null ? null : TODOS.reduce((n, t) => n + (todo[t.key] ?? 0), 0);

  return (
    <Page title="Tổng quan">
      <div ref={animRef} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Tên trang đã ở thanh trên; ở đây chỉ nói rõ số liệu tính cho khoảng thời gian nào. */}
        <div className="adm-head">
          <p className="sub">Số liệu kinh doanh tính cho {PRESET_LABEL[period.preset].toLowerCase()}; việc cần xử lý là số đang chờ hiện tại.</p>
          <span className="pill ai">{PRESET_LABEL[period.preset]}</span>
        </div>

        <div className="ce-stats adm-kpis">
          <StatCard
            icon={Coins}
            tone="gold"
            label="Doanh thu"
            value={show(revenue === undefined ? undefined : revenue?.totalRevenueVnd ?? null, money)}
            sub={revenue ? `${count(revenue.paidTransactionCount)} giao dịch đã thanh toán` : undefined}
          />
          <StatCard
            icon={Users}
            label="Tài khoản mới"
            value={show(accounts === undefined ? undefined : accounts?.newAccounts ?? null)}
            sub={accounts ? `${count(accounts.totalParentAccounts)} tài khoản phụ huynh` : undefined}
          />
          <StatCard
            icon={UserRoundCheck}
            label="Creator đang hoạt động"
            value={show(creators === undefined ? undefined : creators?.activeCreators ?? null)}
            sub={creators ? `${count(creators.partnerCreators)} Creator đối tác` : undefined}
          />
          <StatCard
            icon={TriangleAlert}
            label="Giao dịch cần xử lý"
            value={show(payIssues)}
            sub={todo ? `${show(todo.mismatchedPayments)} sai số tiền · ${show(todo.openReconciliations)} chờ áp gói` : undefined}
          />
        </div>

        <div className="adm-row">
          <section className="adm-card adm-chart" aria-label="Doanh thu 6 tháng gần nhất">
            <div className="adm-card-h">
              <h2 className="display">Doanh thu 6 tháng gần nhất</h2>
              <div className="seg" role="radiogroup" aria-label="Kiểu biểu đồ" style={{ maxWidth: 96, padding: 2 }}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={chartType === "area"}
                  className={chartType === "area" ? "on" : ""}
                  onClick={() => setChartType("area")}
                  title="Biểu đồ đường (DashStack)"
                  style={{ display: "grid", placeItems: "center", padding: "4px 8px" }}
                >
                  <TrendingUp className="ic" style={{ width: 15, height: 15 }} aria-hidden />
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={chartType === "bar"}
                  className={chartType === "bar" ? "on" : ""}
                  onClick={() => setChartType("bar")}
                  title="Biểu đồ cột"
                  style={{ display: "grid", placeItems: "center", padding: "4px 8px" }}
                >
                  <BarChart3 className="ic" style={{ width: 15, height: 15 }} aria-hidden />
                </button>
              </div>
            </div>

            {chartType === "area" ? (
              <MonthAreaChart
                months={months}
                values={monthly}
                format={shortMoney}
                selectedKey={months[months.length - 1]?.key}
              />
            ) : (
              <MonthBars
                title=""
                months={months}
                values={monthly}
                format={shortMoney}
                selectedKey={months[months.length - 1]?.key}
              />
            )}
          </section>

          <section className="adm-card adm-todo" aria-labelledby="adm-todo-h">
            <div className="adm-card-h">
              <h2 id="adm-todo-h" className="display">Việc cần xử lý</h2>
              <span className="adm-card-meta">{todoTotal === null ? "…" : `${count(todoTotal)} việc`}</span>
            </div>
            {TODOS.map(({ key, label, hint, page, tone, icon: Icon }) => {
              const n = todo === null ? undefined : todo[key];
              return (
                <button key={key} type="button" className={`adm-todo-item${n === 0 ? " done" : ""}`} onClick={() => go(page)}>
                  <span className={`adm-todo-ic ${tone}`}><Icon aria-hidden /></span>
                  <span className="adm-todo-txt"><b>{label}</b><small>{hint}</small></span>
                  <span className={`adm-todo-n ${tone}`}>{show(n)}</span>
                  <ChevronRight className="adm-todo-go" aria-hidden />
                </button>
              );
            })}
          </section>
        </div>

        <section className="adm-card adm-tx-card" aria-labelledby="adm-tx-h">
          <div className="adm-card-h">
            <h2 id="adm-tx-h" className="display">Giao dịch gần đây</h2>
            <button type="button" className="btn btn-s" onClick={() => go("payments")}>Xem tất cả</button>
          </div>
          {recent === undefined ? <p className="sub">Đang tải…</p>
            : recent === null ? <p className="empty-line">Không tải được danh sách giao dịch.</p>
            : recent.length === 0 ? <p className="empty-line">Chưa có giao dịch nào.</p>
            : (
              <div className="st-scroll">
                <table className="st-table stack-table adm-table">
                  <thead><tr><th>Mã giao dịch</th><th>Người mua</th><th>Gói</th><th className="num">Số tiền</th><th>Tạo lúc</th><th>Trạng thái</th></tr></thead>
                  <tbody>
                    {recent.map((t) => (
                      <tr key={t.id}>
                        <td data-label="Mã giao dịch"><b>{t.transactionCode}</b></td>
                        <td data-label="Người mua"><Payer t={t} /></td>
                        <td data-label="Gói">{t.planName}</td>
                        <td data-label="Số tiền" className="num">{money(t.amount)}</td>
                        <td data-label="Tạo lúc">{fmt(t.createdAt)}</td>
                        <td data-label="Trạng thái"><PayPill status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </div>
    </Page>
  );
}
