"use client";
import { confirmDialog } from "@/app/lib/confirm";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Coins, Pencil, Plus, RefreshCw, Search, Settings, SlidersHorizontal, Wrench } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import IconButton from "@/app/components/IconButton";
import Pager from "@/app/components/Pager";
import Select from "@/app/components/Select";
import { adminPaymentService as pay } from "@/app/services/paymentService";
import type { AdminPaymentTransactionDto, AdminSubscriptionPlanDto, CreditAdjustmentDto, MyQuotaDto, PagedResult, PaymentStatus, PlanType, ReconciliationExceptionDto } from "@/app/types/backendContracts";
import { Notice, Page, fmt, fmtDay, useAction } from "./ui";
import CreatePlanDialog from "./CreatePlanDialog";
import PlanSettingsDialog from "./PlanSettingsDialog";

const money = (n: number) => `${n.toLocaleString("vi-VN")}đ`;
const PLAN_TYPE: Record<PlanType, string> = { Reading: "Gói Đọc", Creative: "Gói Sáng tạo", AddOn: "Add-on", Legacy: "Gói cũ", CreatorPack: "Gói Creator" };
const PAY_STATUS: Record<PaymentStatus, [string, string]> = {
  Pending: ["wait", "Chờ thanh toán"], Paid: ["ok", "Đã thanh toán"], Expired: ["draft", "Hết hạn"], MismatchAmount: ["flag", "Sai số tiền"],
};
const PayPill = ({ status }: { status: PaymentStatus }) => { const [tone, label] = PAY_STATUS[status] ?? ["draft", status]; return <span className={`pill ${tone}`}>{label}</span>; };
const Payer = ({ t }: { t: AdminPaymentTransactionDto }) => <span className="pay-payer"><b>{t.payerName || `Tài khoản #${t.payerUserId}`}</b><small>{t.payerEmail}</small></span>;

/** Gói và lượt của một tài khoản: dùng chung cho trang lượt và popup điều chỉnh. */
function QuotaSummary({ q }: { q: MyQuotaDto }) {
  return (
    <div className="st-grid">
      <div className="st-kpi"><small>Gói hiện tại</small><b>{q.plan ? `${q.plan.planName}` : "Miễn phí"}</b>{q.plan && <small>Đến {fmtDay(q.plan.endAt)}</small>}</div>
      <div className="st-kpi"><small>Tổng lượt còn lại</small><b>{q.totalRemaining}</b></div>
      <div className="st-kpi"><small>Gói tháng · Add-on</small><b>{q.cycleCredits} · {q.addOnCredits}</b></div>
      <div className="st-kpi"><small>Dùng thử · Lượt khác</small><b>{q.trialCredits} · {q.otherCredits}</b></div>
    </div>
  );
}

/** Luồng 2 UC-L2-08: xem lượt của một tài khoản phụ huynh, cấp / trừ lượt kèm lý do, lịch sử điều chỉnh. */
export function AdminQuota() {
  const [idText, setIdText] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [quota, setQuota] = useState<MyQuotaDto | null>(null);
  const [history, setHistory] = useState<PagedResult<CreditAdjustmentDto> | null>(null);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: 1, reason: "" });
  const load = useCallback(async () => {
    const [h, q] = await Promise.all([pay.adjustments(userId, page), userId ? pay.userQuota(userId) : Promise.resolve(null)]);
    setHistory(h.success ? h.data : null);
    setQuota(q?.success ? q.data : null);
    return q && !q.success ? q.message : null;
  }, [userId, page]);
  const { note, setNote, busy, run } = useAction(load);
  useEffect(() => { void load().then((err) => { if (err) setNote({ ok: false, text: err }); }); }, [load, setNote]);
  const lookup = () => { const id = Number(idText); if (Number.isSafeInteger(id) && id > 0) { setUserId(id); setPage(1); } else setNote({ ok: false, text: "Hãy nhập mã tài khoản là số dương." }); };
  const valid = form.amount !== 0 && Number.isInteger(form.amount) && form.reason.trim().length > 0 && form.reason.length <= 500;
  return (
    <Page title="Lượt tạo truyện">
      <Notice note={note} />
      <div className="st-card">
        <div className="st-filters">
          <input className="inp" style={{ width: 220 }} inputMode="numeric" placeholder="Mã tài khoản phụ huynh" aria-label="Mã tài khoản phụ huynh" value={idText} onChange={(e) => setIdText(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") lookup(); }} />
          <button className="btn btn-s" disabled={!idText} onClick={lookup}><Search className="ic" />Xem</button>
          {userId && <button className="btn btn-g" onClick={() => { setUserId(null); setIdText(""); setPage(1); }}>Mọi tài khoản</button>}
          <span className="grow" />
          {userId && quota && <button className="btn btn-p" onClick={() => { setForm({ amount: 1, reason: "" }); setOpen(true); }}><SlidersHorizontal className="ic" />Điều chỉnh lượt</button>}
        </div>
        {userId && quota && <><h3>Tài khoản #{userId}</h3><QuotaSummary q={quota} /></>}
      </div>
      <div className="st-card st-scroll">
        <h3>Lịch sử điều chỉnh{userId ? ` của tài khoản #${userId}` : ""}</h3>
        <table className="st-table stack-table">
          <thead><tr><th>Thời gian</th><th>Tài khoản</th><th>Số lượt</th><th>Lý do</th><th>Người điều chỉnh</th></tr></thead>
          <tbody>
            {history?.items.map((a) => (
              <tr key={a.id}><td data-label="Thời gian">{fmt(a.createdAt)}</td><td data-label="Tài khoản">#{a.userId}</td>
                <td data-label="Số lượt"><span className={`pill ${a.amount > 0 ? "ok" : "flag"}`}>{a.amount > 0 ? `+${a.amount}` : a.amount}</span></td>
                <td data-label="Lý do">{a.reason}</td><td data-label="Người điều chỉnh">{a.adminName}</td></tr>
            ))}
            {history && history.items.length === 0 && <tr><td colSpan={5} className="sub">Chưa có lần điều chỉnh nào.</td></tr>}
          </tbody>
        </table>
        {history && <Pager page={history.pageIndex} totalPages={history.totalPages} hasPrev={history.hasPreviousPage} hasNext={history.hasNextPage} onPage={setPage} />}
      </div>
      {open && userId && <Dialog title={`Điều chỉnh lượt · tài khoản #${userId}`} onClose={() => setOpen(false)}>
        <div className="st-form">
          <div className="seg" role="radiogroup" aria-label="Cấp hay trừ lượt" style={{ maxWidth: 260 }}>
            <button type="button" role="radio" aria-checked={form.amount > 0} className={form.amount > 0 ? "on" : ""} onClick={() => setForm({ ...form, amount: Math.abs(form.amount) || 1 })}>Cấp thêm</button>
            <button type="button" role="radio" aria-checked={form.amount < 0} className={form.amount < 0 ? "on" : ""} onClick={() => setForm({ ...form, amount: -Math.abs(form.amount || 1) })}>Trừ bớt</button>
          </div>
          <label className="field"><span className="lbl">Số lượt</span><input className="inp" type="number" min={1} value={Math.abs(form.amount)} onChange={(e) => { const n = Math.max(0, Math.floor(+e.target.value || 0)); setForm({ ...form, amount: form.amount < 0 ? -n : n }); }} /></label>
          <label className="field"><span className="lbl">Lý do</span><textarea className="inp" rows={3} maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ví dụ: bù lượt do lỗi tạo truyện" /></label>
          <div className="row"><button className="btn btn-g" onClick={() => setOpen(false)}>Huỷ</button><span className="grow" />
            <button className="btn btn-p" disabled={busy || !valid} onClick={async () => {
              if (form.amount < 0 && !(await confirmDialog(`Trừ ${-form.amount} lượt của tài khoản #${userId}?`))) return;
              const ok = await run(() => pay.adjust({ userId, amount: form.amount, reason: form.reason.trim() }), form.amount > 0 ? `Đã cấp ${form.amount} lượt.` : `Đã trừ ${-form.amount} lượt.`);
              if (ok) setOpen(false);
            }}><Coins className="ic" />Lưu</button></div>
        </div>
      </Dialog>}
    </Page>
  );
}

const STATUS_FILTER: { value: PaymentStatus | ""; label: string }[] = [
  { value: "", label: "Mọi trạng thái" }, { value: "Pending", label: "Chờ thanh toán" }, { value: "MismatchAmount", label: "Sai số tiền" },
  { value: "Expired", label: "Hết hạn" }, { value: "Paid", label: "Đã thanh toán" },
];

/** Tab Giao dịch: mọi giao dịch, lọc trạng thái, tìm theo mã / email / tên; xác nhận tay giao dịch chưa Paid. */
function TransactionsTab() {
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<PagedResult<AdminPaymentTransactionDto> | null>(null);
  // Gõ xong 400 ms mới tìm, tránh gọi API mỗi phím.
  useEffect(() => { const id = setTimeout(() => { setSearch(searchText); setPage(1); }, 400); return () => clearTimeout(id); }, [searchText]);
  const load = useCallback(async () => { const r = await pay.transactions({ pageIndex: page, status, search }); setList(r.success ? r.data : null); return r.success ? null : r.message; }, [page, status, search]);
  const { note, setNote, busy, run } = useAction(load);
  useEffect(() => { void load().then((err) => { if (err) setNote({ ok: false, text: err }); }); }, [load, setNote]);
  const markPaid = async (t: AdminPaymentTransactionDto) => {
    if (!(await confirmDialog(`Xác nhận đã nhận đủ ${money(t.amount)} cho giao dịch ${t.transactionCode}? Gói ${t.planName} sẽ được áp cho ${t.payerEmail || `tài khoản #${t.payerUserId}`}.${t.status === "Pending" && new Date(t.expiresAt).getTime() > Date.now() ? " Giao dịch chưa hết hạn, người dùng vẫn có thể đang chuyển khoản." : ""}`))) return;
    void run(() => pay.markPaid(t.id), "Đã xác nhận thanh toán và áp gói.");
  };
  return <>
    <Notice note={note} />
    <div className="st-filters">
      <Select<PaymentStatus | ""> ariaLabel="Lọc trạng thái" value={status} options={STATUS_FILTER} onChange={(v) => { setStatus(v); setPage(1); }} />
      <input className="inp" style={{ width: 280 }} placeholder="Tìm mã giao dịch, email, tên" aria-label="Tìm giao dịch" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
      <IconButton icon={RefreshCw} label="Tải lại" onClick={() => void load()} />
      {list && <span className="sub">{list.totalCount} giao dịch</span>}
    </div>
    <div className="st-card st-scroll">
      <table className="st-table stack-table">
        <thead><tr><th>Mã giao dịch</th><th>Người mua</th><th>Gói</th><th>Số tiền</th><th>Trạng thái</th><th>Tạo lúc</th><th /></tr></thead>
        <tbody>
          {list?.items.map((t) => (
            <tr key={t.id}><td data-label="Mã giao dịch"><code>{t.transactionCode}</code></td><td data-label="Người mua"><Payer t={t} /></td>
              <td data-label="Gói">{t.planName}</td><td data-label="Số tiền">{money(t.amount)}</td>
              <td data-label="Trạng thái"><PayPill status={t.status} />{t.paidAt && <small className="pay-paid">{fmt(t.paidAt)}</small>}</td><td data-label="Tạo lúc">{fmt(t.createdAt)}</td>
              <td data-label="">{t.status !== "Paid" && <button className="btn btn-s" disabled={busy} onClick={() => void markPaid(t)}><BadgeCheck className="ic" />Xác nhận đã trả</button>}</td></tr>
          ))}
          {list && list.items.length === 0 && <tr><td colSpan={7} className="sub">Không có giao dịch phù hợp.</td></tr>}
        </tbody>
      </table>
      {list && <Pager page={list.pageIndex} totalPages={list.totalPages} hasPrev={list.hasPreviousPage} hasNext={list.hasNextPage} onPage={setPage} />}
    </div>
  </>;
}

/** Lý do không áp được gói: `NotApplied` là chưa áp, còn lại là nội dung lỗi lần áp gần nhất. */
const reasonText = (r: string) => (r === "NotApplied" ? "Chưa được áp gói" : "Áp gói bị lỗi");

/** Tab Chờ áp gói (UC-L2-13): giao dịch đã trả tiền nhưng chưa có chu kỳ / lượt; Admin áp lại, không cộng hai lần. */
function ReconciliationTab() {
  const [status, setStatus] = useState<"Open" | "Resolved">("Open");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<PagedResult<ReconciliationExceptionDto> | null>(null);
  const load = useCallback(async () => { const r = await pay.reconciliation(status, page); setList(r.success ? r.data : null); return r.success ? null : r.message; }, [status, page]);
  const { note, setNote, busy, run } = useAction(load);
  useEffect(() => { void load().then((err) => { if (err) setNote({ ok: false, text: err }); }); }, [load, setNote]);
  return <>
    <Notice note={note} />
    <div className="st-filters">
      <div className="seg" role="radiogroup" aria-label="Trạng thái xử lý" style={{ maxWidth: 260 }}>
        {([["Open", "Cần xử lý"], ["Resolved", "Đã xử lý"]] as const).map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={status === v} className={status === v ? "on" : ""} onClick={() => { setStatus(v); setPage(1); }}>{l}</button>)}
      </div>
      <IconButton icon={RefreshCw} label="Tải lại" onClick={() => void load()} />
    </div>
    <div className="st-card st-scroll">
      <table className="st-table stack-table">
        <thead><tr><th>Mã giao dịch</th><th>Người mua</th><th>Gói</th><th>Số tiền</th><th>Vấn đề</th><th>Ghi nhận lúc</th><th /></tr></thead>
        <tbody>
          {list?.items.map((x) => (
            <tr key={x.id}><td data-label="Mã giao dịch"><code>{x.transaction.transactionCode}</code></td><td data-label="Người mua"><Payer t={x.transaction} /></td>
              <td data-label="Gói">{x.transaction.planName}</td><td data-label="Số tiền">{money(x.transaction.amount)}</td>
              <td data-label="Vấn đề"><span className="pill flag" title={x.reason === "NotApplied" ? undefined : x.reason}>{reasonText(x.reason)}</span></td>
              <td data-label="Ghi nhận lúc">{fmt(x.createdAt)}{x.resolvedAt && <small className="pay-paid">Xử lý {fmt(x.resolvedAt)}{x.resolvedByName ? ` · ${x.resolvedByName}` : ""}</small>}</td>
              <td data-label="">{x.status === "Open" && <button className="btn btn-s" disabled={busy} onClick={async () => {
                if (await confirmDialog(`Áp lại gói ${x.transaction.planName} cho ${x.transaction.payerEmail || `tài khoản #${x.transaction.payerUserId}`}? Gói đã áp rồi thì không cộng thêm.`)) void run(() => pay.resolve(x.id), "Đã áp lại gói.");
              }}><Wrench className="ic" />Áp lại gói</button>}</td></tr>
          ))}
          {list && list.items.length === 0 && <tr><td colSpan={7} className="sub">{status === "Open" ? "Không có giao dịch nào chờ áp gói." : "Chưa có giao dịch nào được xử lý."}</td></tr>}
        </tbody>
      </table>
      {list && <Pager page={list.pageIndex} totalPages={list.totalPages} hasPrev={list.hasPreviousPage} hasNext={list.hasNextPage} onPage={setPage} />}
    </div>
  </>;
}

/** Luồng 2 mục 5.1, 5.3: giao dịch (xác nhận tay) và giao dịch đã trả tiền nhưng chưa áp gói. */
export function AdminPayments() {
  const [tab, setTab] = useState<"tx" | "rec">("tx");
  return (
    <Page title="Thanh toán">
      <div className="seg" role="tablist" aria-label="Thanh toán" style={{ maxWidth: 360 }}>
        <button type="button" role="tab" aria-selected={tab === "tx"} className={tab === "tx" ? "on" : ""} onClick={() => setTab("tx")}>Giao dịch</button>
        <button type="button" role="tab" aria-selected={tab === "rec"} className={tab === "rec" ? "on" : ""} onClick={() => setTab("rec")}>Chờ áp gói</button>
      </div>
      {tab === "tx" ? <TransactionsTab /> : <ReconciliationTab />}
    </Page>
  );
}

type PlanForm = { name: string; priceVnd: number; aiCredits: number; isActive: boolean };

/** Luồng 5 mục 5a: sửa tên, giá, lượt AI và bật / tắt bán gói. Đổi giá chỉ áp cho giao dịch tạo sau đó. */
export function AdminPlans() {
  const [plans, setPlans] = useState<AdminSubscriptionPlanDto[] | null>(null);
  const [edit, setEdit] = useState<AdminSubscriptionPlanDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form, setForm] = useState<PlanForm>({ name: "", priceVnd: 0, aiCredits: 0, isActive: true });
  const load = useCallback(async () => { const r = await pay.plans(); setPlans(r.data ?? []); return r.success ? null : r.message; }, []);
  const { note, setNote, busy, run } = useAction(load);
  useEffect(() => { void load().then((err) => { if (err) setNote({ ok: false, text: err }); }); }, [load, setNote]);
  const open = (p: AdminSubscriptionPlanDto) => { setEdit(p); setForm({ name: p.name, priceVnd: p.priceVnd, aiCredits: p.aiCredits, isActive: p.isActive }); };
  const changed = !!edit && (form.name !== edit.name || form.priceVnd !== edit.priceVnd || form.aiCredits !== edit.aiCredits || form.isActive !== edit.isActive);
  const valid = form.name.trim().length > 0 && form.name.length <= 150 && form.priceVnd > 0 && form.aiCredits >= 0;
  return (
    <Page
      title="Gói dịch vụ"
      actions={<>
        <IconButton icon={Settings} label="Cài đặt gói" className="btn btn-s" onClick={() => setSettingsOpen(true)} />
        <IconButton icon={Plus} label="Tạo gói" className="btn btn-p" onClick={() => setCreating(true)} />
      </>}
    >
      <Notice note={note} />
      <div className="st-card st-scroll">
        <table className="st-table stack-table">
          <thead><tr><th>Tên gói</th><th>Loại</th><th>Giá</th><th>Lượt AI</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {plans?.map((p) => (
              <tr key={p.id}><td data-label="Tên gói"><b>{p.name}</b></td><td data-label="Loại">{PLAN_TYPE[p.planType] ?? p.planType}</td>
                <td data-label="Giá">{money(p.priceVnd)}{p.planType === "Reading" || p.planType === "Creative" ? " / tháng" : ""}</td><td data-label="Lượt AI">{p.aiCredits}</td>
                <td data-label="Trạng thái"><span className={`pill ${p.isActive ? "ok" : "draft"}`}>{p.isActive ? "Đang bán" : "Ngừng bán"}</span></td>
                <td data-label=""><IconButton icon={Pencil} label={`Sửa ${p.name}`} onClick={() => open(p)} /></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <CreatePlanDialog open={creating} onClose={() => setCreating(false)} onCreated={() => void load()} />
      <PlanSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {edit && <Dialog title={`Sửa ${edit.name}`} onClose={() => setEdit(null)}>
        <div className="st-form">
          <label className="field"><span className="lbl">Tên gói</span><input className="inp" maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field"><span className="lbl">Giá (đồng)</span><input className="inp" type="number" min={1} step={1000} value={form.priceVnd} onChange={(e) => setForm({ ...form, priceVnd: Math.floor(+e.target.value || 0) })} /></label>
          <label className="field"><span className="lbl">{edit.planType === "Creative" ? "Lượt AI mỗi chu kỳ" : "Lượt AI"}</span><input className="inp" type="number" min={0} value={form.aiCredits} onChange={(e) => setForm({ ...form, aiCredits: Math.max(0, Math.floor(+e.target.value || 0)) })} /></label>
          <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={form.isActive} disabled={edit.planType === "Legacy"} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ accentColor: "var(--primary)" }} />Đang bán</label>
          {edit.planType === "Legacy" && <p className="notice warn">Gói cũ chỉ còn trong lịch sử giao dịch, không bật bán lại được.</p>}
          <p className="notice">Thay đổi chỉ áp cho giao dịch tạo sau khi lưu; giao dịch đang chờ giữ giá cũ.</p>
          <div className="row"><button className="btn btn-g" onClick={() => setEdit(null)}>Huỷ</button><span className="grow" />
            {changed && <button className="btn btn-p" disabled={busy || !valid} onClick={async () => {
              const ok = await run(() => pay.updatePlan(edit.id, { ...form, name: form.name.trim() }), `Đã lưu ${form.name.trim()}.`);
              if (ok) setEdit(null);
            }}>Lưu</button>}</div>
        </div>
      </Dialog>}
    </Page>
  );
}
