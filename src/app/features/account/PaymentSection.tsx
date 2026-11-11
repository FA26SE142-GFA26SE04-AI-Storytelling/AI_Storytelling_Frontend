'use client';
import { confirmDialog } from "@/app/lib/confirm";
import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Check, CircleCheck, Clock, Copy, CreditCard, Package, Plus, Receipt, Sparkles, WandSparkles } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import IconButton from '@/app/components/IconButton';
import Pager from '@/app/components/Pager';
import SafeImage from '@/app/components/SafeImage';
import { showToast } from '@/app/lib/toast';
import { paymentService } from '@/app/services/paymentService';
import type { CreatorQuotaDto, MyQuotaDto, PagedResult, PaymentStatus, PaymentTransactionDto, PlanType, SubscriptionPlanDto } from '@/app/types/backendContracts';

const day = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');
const time = (iso: string) => new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const money = (n: number) => `${n.toLocaleString('vi-VN')} đ`;

/** Quyền lợi của từng loại gói theo tài liệu cam kết (F-03). */
const BENEFITS: Record<PlanType, (p: SubscriptionPlanDto) => string[]> = {
  Reading: () => ['Đọc không giới hạn thư viện công khai', 'Tối đa 4 hồ sơ bé', 'Dùng lộ trình mẫu cho bé', 'Không kèm lượt tạo truyện AI'],
  Creative: (p) => ['Mọi quyền lợi của Gói Đọc', `${p.aiCredits} lượt tạo truyện AI mỗi chu kỳ`, 'Lượt chưa dùng không chuyển sang tháng sau'],
  AddOn: (p) => [`Thêm ${p.aiCredits} lượt tạo truyện AI`, 'Chỉ mua khi đang có gói', 'Hết hạn cùng chu kỳ gói hiện tại'],
  CreatorPack: (p) => [`+${p.aiCredits} lượt tạo truyện AI`, `+${p.submitCredits ?? 0} lượt gửi duyệt`, 'Lượt mua không hết hạn', 'Dùng sau khi hết hạn mức tháng'],
  Legacy: (p) => [`${p.aiCredits} lượt tạo truyện AI`],
};
const PLAN_ICON: Record<PlanType, typeof Sparkles> = { Reading: BookOpen, Creative: WandSparkles, AddOn: Plus, CreatorPack: Package, Legacy: Sparkles };

const STATUS: Record<PaymentStatus, [string, string]> = {
  Pending: ['wait', 'Chờ thanh toán'], Paid: ['ok', 'Đã thanh toán'], Expired: ['draft', 'Đã hết hạn'], MismatchAmount: ['flag', 'Sai số tiền'],
};

/** Nút và câu xác nhận của một gói, tuỳ gói đang dùng. */
function action(plan: SubscriptionPlanDto, quota: MyQuotaDto | null): { label: string; confirm: string } {
  if (plan.planType === 'CreatorPack') return { label: 'Mua gói', confirm: `Mua ${plan.name} (${money(plan.priceVnd)}): thêm ${plan.aiCredits} lượt tạo truyện AI và ${plan.submitCredits ?? 0} lượt gửi duyệt, không hết hạn.` };
  const cur = quota?.plan;
  const price = money(plan.priceVnd);
  if (plan.planType === 'AddOn') return { label: 'Mua thêm lượt', confirm: `Mua ${plan.name} (${price}): thêm ${plan.aiCredits} lượt tạo truyện AI${cur ? `, hết hạn cùng gói ngày ${day(cur.endAt)}` : ''}.` };
  if (!cur) return { label: 'Đăng ký', confirm: `Đăng ký ${plan.name} (${price}/tháng). Gói bắt đầu ngay khi thanh toán thành công.` };
  const end = day(quota?.nextPlan?.endAt ?? cur.endAt);
  if (cur.planType === plan.planType) return { label: 'Gia hạn', confirm: `Gia hạn ${plan.name} (${price}): chu kỳ mới bắt đầu sau ngày ${end}, lượt hiện tại giữ nguyên.` };
  if (cur.planType === 'Reading' && plan.planType === 'Creative') return { label: 'Nâng cấp', confirm: `Nâng lên ${plan.name} (${price}): bắt đầu ngay khi thanh toán xong. Số ngày còn lại của Gói Đọc không được quy đổi.` };
  return { label: 'Chuyển gói', confirm: `Chuyển sang ${plan.name} (${price}): bắt đầu sau khi gói hiện tại hết hạn ngày ${end}.` };
}

/** Thời gian còn lại tới `iso`, dạng mm:ss; hết hạn thì 0. */
function useCountdown(iso: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!iso) return; const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, [iso]);
  const left = iso ? Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000)) : 0;
  return { left, text: `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}` };
}

/** Popup thanh toán: mã QR, nội dung chuyển khoản, đếm ngược; tự hỏi lại trạng thái mỗi 5 giây tới khi Paid / hết hạn. */
function PayDialog({ tx, onClose, onPaid }: { tx: PaymentTransactionDto; onClose: () => void; onPaid: () => void }) {
  const [cur, setCur] = useState(tx);
  // Mã QR không tải được (thiếu cấu hình tài khoản nhận tiền, mạng lỗi…): ẩn ảnh, báo rõ thay vì hiện hình mặc định.
  const [qrBroken, setQrBroken] = useState(false);
  const pending = cur.status === 'Pending';
  const { left, text } = useCountdown(pending ? cur.expiresAt : null);
  useEffect(() => {
    if (!pending) return;
    const id = window.setInterval(() => {
      void paymentService.myTransactions(1, 20).then((r) => {
        const found = r.data?.items.find((t) => t.id === cur.id);
        if (!found || found.status === 'Pending') return;
        setCur(found);
        if (found.status === 'Paid') onPaid();
      });
    }, 5000);
    return () => window.clearInterval(id);
  }, [pending, cur.id, onPaid]);
  const copy = () => void navigator.clipboard?.writeText(cur.transactionCode).then(() => showToast('Đã chép nội dung chuyển khoản.'), () => showToast('Chưa chép được, bạn hãy gõ lại mã.', 'warn'));
  return (
    <Dialog title={cur.planName} onClose={onClose}>
      {cur.status === 'Paid' ? (
        <div className="pay-done" role="status"><CircleCheck aria-hidden /><b className="display">Thanh toán thành công</b><span>Gói đã được áp cho tài khoản của bạn.</span></div>
      ) : pending && left > 0 ? (
        <div className="pay-box">
          {cur.qrCodeUrl && !qrBroken ? <SafeImage className="pay-qr" src={cur.qrCodeUrl} alt={`Mã QR chuyển khoản ${money(cur.amount)}`} onError={() => setQrBroken(true)} />
            : <p className="notice warn pay-qr-missing">Chưa hiện được mã QR. Hãy thử lại sau hoặc liên hệ hỗ trợ.</p>}
          <div className="pay-facts">
            <div><small>Số tiền</small><b>{money(cur.amount)}</b></div>
            <div><small>Nội dung chuyển khoản</small><span className="row" style={{ gap: 6 }}><b><code>{cur.transactionCode}</code></b><IconButton icon={Copy} label="Chép nội dung chuyển khoản" onClick={copy} /></span></div>
            <div><small>Còn lại</small><b className={left < 120 ? 'pay-late' : ''}><Clock className="ic" aria-hidden />{text}</b></div>
          </div>
          <p className="pay-hint">Quét mã bằng app ngân hàng. Trang tự cập nhật khi nhận được tiền.</p>
        </div>
      ) : cur.status === 'MismatchAmount' ? (
        <p className="notice warn">Số tiền chuyển chưa khớp. Quản trị viên đang kiểm tra, bạn không cần chuyển lại.</p>
      ) : (
        <p className="notice warn">Giao dịch đã hết hạn. Nếu bạn đã chuyển tiền, quản trị viên sẽ kiểm tra và xác nhận; nếu chưa, hãy tạo giao dịch mới.</p>
      )}
    </Dialog>
  );
}

/** Trang "Nâng cấp gói" (Luồng 2, F-03, F-05): gói đang dùng và lượt còn lại, các gói đang bán, lịch sử giao dịch. */
export default function PaymentSection({ audience = 'parent' }: { audience?: 'parent' | 'creator' }) {
  const [quota, setQuota] = useState<MyQuotaDto | null>(null);
  const [creatorQuota, setCreatorQuota] = useState<CreatorQuotaDto | null>(null);
  const [creatorError, setCreatorError] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlanDto[] | null>(null);
  const [history, setHistory] = useState<PagedResult<PaymentTransactionDto> | null>(null);
  const [page, setPage] = useState(1);
  const [tx, setTx] = useState<PaymentTransactionDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [rev, setRev] = useState(0);
  const reload = useCallback(() => setRev((n) => n + 1), []);

  useEffect(() => {
    const c = new AbortController(); let alive = true;
    if (audience === 'creator') {
      void Promise.all([paymentService.creatorQuota(c.signal), paymentService.plans(c.signal)]).then(([q, p]) => {
        if (!alive) return;
        setCreatorQuota(q.success ? q.data : null);
        setCreatorError(!q.success);
        if (!q.success) showToast(q.message, 'err');
        setPlans((p.data ?? []).filter((x) => x.planType === 'CreatorPack' || x.audience === 'Creator'));
        if (!p.success) showToast(p.message, 'err');
      });
    } else {
      void Promise.all([paymentService.myQuota(c.signal), paymentService.plans(c.signal)]).then(([q, p]) => {
        if (!alive) return;
        setQuota(q.success ? q.data : null);
        setPlans(p.data ?? []);
        if (!p.success) showToast(p.message, 'err');
      });
    }
    return () => { alive = false; c.abort(); };
  }, [rev, audience]);
  useEffect(() => {
    const c = new AbortController(); let alive = true;
    void paymentService.myTransactions(page, 10, c.signal).then((r) => { if (alive) setHistory(r.success ? r.data : null); });
    return () => { alive = false; c.abort(); };
  }, [page, rev]);

  const buy = async (plan: SubscriptionPlanDto) => {
    if (busy) return;
    const a = action(plan, audience === 'creator' ? null : quota);
    if (!await confirmDialog(a.confirm)) return;
    setBusy(true);
    const r = await paymentService.create(plan.id);
    setBusy(false);
    if (r.success && r.data) { setTx(r.data); reload(); } else showToast(r.message, 'err');
  };

  const credits = quota ? [
    ['Gói tháng', quota.cycleCredits], ['Add-on', quota.addOnCredits], ['Dùng thử', quota.trialCredits], ['Lượt khác', quota.otherCredits],
  ].filter(([, n]) => (n as number) > 0) as [string, number][] : [];

  const featured = audience === 'creator' ? 'CreatorPack' : 'Creative';

  return <section className="sec plan-page" style={{ gap: 24 }}>
    <h3 className="display" style={{ margin: 0, textAlign: "center" }}>{audience === 'creator' ? 'Gói và lượt' : 'Nâng cấp gói'}</h3>

    {audience === 'parent' ? (
      <div className="pay-current" aria-label="Gói của bạn">
        <div className="grow">
          <small>Gói của bạn</small>
          <b className="display">{quota === null ? '…' : quota.plan?.planName ?? 'Miễn phí'}</b>
          {quota?.plan && <span className="pill ok">Đến {day(quota.plan.endAt)}</span>}
          {quota?.nextPlan && <span className="pill wait">Tiếp theo: {quota.nextPlan.planName} từ {day(quota.nextPlan.startAt)}</span>}
        </div>
        <div className="pay-credits">
          <b>{quota?.totalRemaining ?? '…'}</b>
          <span>lượt tạo truyện AI</span>
          {credits.length > 0 && <div className="row" style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>{credits.map(([k, n]) => <span key={k} className="pill">{k}: {n}</span>)}</div>}
        </div>
      </div>
    ) : creatorError ? (
      <p className="notice warn">Chưa tải được lượt của bạn. Hãy tải lại trang.</p>
    ) : (
      <>
        <div className="creator-quota-grid" aria-label="Lượt của bạn">
          <div className="pay-current creator-quota-card">
            <small>Lượt tạo truyện AI</small>
            <b className="display">{creatorQuota?.aiCredits.totalRemaining ?? '…'}</b>
            {creatorQuota && <>
              <span className="pill">Tháng này: {creatorQuota.aiCredits.monthlyRemaining}/{creatorQuota.aiCredits.monthlyAllowance}</span>
              {creatorQuota.aiCredits.purchasedRemaining > 0 && <span className="pill">Đã mua: {creatorQuota.aiCredits.purchasedRemaining}</span>}
              {creatorQuota.aiCredits.otherRemaining > 0 && <span className="pill">Khác: {creatorQuota.aiCredits.otherRemaining}</span>}
            </>}
          </div>
          <div className="pay-current creator-quota-card">
            <small>Lượt gửi duyệt</small>
            <b className="display">{creatorQuota?.submitCredits.totalRemaining ?? '…'}</b>
            {creatorQuota && <>
              <span className="pill">Tháng này: {creatorQuota.submitCredits.monthlyRemaining}/{creatorQuota.submitCredits.monthlyAllowance}</span>
              {creatorQuota.submitCredits.purchasedRemaining > 0 && <span className="pill">Đã mua: {creatorQuota.submitCredits.purchasedRemaining}</span>}
              {creatorQuota.submitCredits.otherRemaining > 0 && <span className="pill">Khác: {creatorQuota.submitCredits.otherRemaining}</span>}
            </>}
          </div>
        </div>
        {creatorQuota && <p className="sub">Hạn mức tháng làm mới ngày {day(creatorQuota.monthlyAllowanceResetsAt)}</p>}
      </>
    )}

    {plans === null && <p className="sub">Đang tải…</p>}
    <div className="plan-grid">
      {plans?.map((plan) => {
        const Icon = PLAN_ICON[plan.planType] ?? Sparkles;
        const a = action(plan, quota);
        return <article key={plan.id} className={`plan-card${plan.planType === featured ? ' featured' : ''}${plan.isPurchasable ? '' : ' locked'}`}>
          <div className="plan-head">
            <Icon className="plan-icon" aria-hidden />
            <b className="display plan-title">{plan.name}</b>
            <div className="plan-price"><b>{plan.priceVnd.toLocaleString('vi-VN')}</b><span>₫<small>{plan.planType === 'AddOn' || plan.planType === 'CreatorPack' ? 'mỗi lần mua' : 'mỗi tháng'}</small></span></div>
            <button className={`btn btn-c ${plan.planType === featured ? 'btn-p' : 'btn-s'}`} disabled={busy || !plan.isPurchasable} onClick={() => void buy(plan)}><CreditCard className="ic" />{a.label}</button>
            {!plan.isPurchasable && plan.lockedReason && <p className="notice warn plan-locked">{plan.lockedReason}</p>}
          </div>
          <ul className="plan-list">{BENEFITS[plan.planType]?.(plan).map((b) => <li key={b}><Check className="ic" />{b}</li>)}</ul>
        </article>;
      })}
    </div>

    <div className="pay-history">
      <h4 className="display"><Receipt className="ic" aria-hidden />Lịch sử giao dịch</h4>
      {history === null ? <p className="sub">Đang tải…</p> : history.items.length === 0 ? <p className="empty-line">Bạn chưa có giao dịch nào.</p> : (
        <table className="st-table stack-table">
          <thead><tr><th>Gói</th><th>Số tiền</th><th>Mã giao dịch</th><th>Tạo lúc</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>{history.items.map((t) => {
            const [tone, label] = STATUS[t.status] ?? ['draft', t.status];
            return <tr key={t.id}>
              <td data-label="Gói">{t.planName}</td>
              <td data-label="Số tiền">{money(t.amount)}</td>
              <td data-label="Mã giao dịch"><code>{t.transactionCode}</code></td>
              <td data-label="Tạo lúc">{time(t.createdAt)}</td>
              <td data-label="Trạng thái"><span className={`pill ${tone}`}>{label}</span>{t.status === 'Paid' && t.paidAt && <small className="pay-paid">{time(t.paidAt)}</small>}{t.status === 'MismatchAmount' && <small className="pay-paid">Đang chờ quản trị viên xử lý</small>}</td>
              <td data-label="">{t.status === 'Pending' && t.qrCodeUrl && <button className="btn btn-s" onClick={() => setTx(t)}>Tiếp tục thanh toán</button>}</td>
            </tr>;
          })}</tbody>
        </table>
      )}
      {history && <Pager page={history.pageIndex} totalPages={history.totalPages} hasPrev={history.hasPreviousPage} hasNext={history.hasNextPage} onPage={setPage} />}
    </div>

    {tx && <PayDialog key={tx.id} tx={tx} onClose={() => { setTx(null); reload(); }} onPaid={reload} />}
  </section>;
}
