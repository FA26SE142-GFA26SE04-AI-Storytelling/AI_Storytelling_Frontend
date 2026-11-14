import type { CreatePlanRequest, UpdatePlanSettingsRequest, MyQuotaDto, PaymentTransactionDto, PlanBenefitsDto } from '@/app/types/backendContracts';

/** 99000 -> "99.000đ". Formatted by hand so the separator never depends on the ICU build. */
export const vnd = (n: number): string => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;

const PLAN_TYPE_LABELS: Record<string, string> = {
  Reading: 'Gói Đọc', Creative: 'Gói Sáng tạo', AddOn: 'Add-on', CreatorPack: 'Gói Creator', Legacy: 'Gói cũ',
};
export const planTypeLabel = (t: string): string => PLAN_TYPE_LABELS[t] ?? t;

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Chờ thanh toán', Paid: 'Đã thanh toán', Expired: 'Hết hạn', MismatchAmount: 'Chờ quản trị viên xử lý',
};
export const transactionStatusLabel = (s: string, audience: 'parent' | 'admin' = 'parent'): string =>
  audience === 'admin' && s === 'MismatchAmount' ? 'Lệch số tiền' : STATUS_LABELS[s] ?? s;

export const benefitLines = (b: PlanBenefitsDto): string[] => {
  const lines = [`Tối đa ${b.maxChildProfiles} hồ sơ bé`];
  lines.push(b.weeklyNewLibraryStories === null ? 'Truyện thư viện không giới hạn' : `${b.weeklyNewLibraryStories} truyện thư viện mới mỗi tuần`);
  if (b.canCopyRoadmapTemplates) lines.push('Sao chép bộ truyện mẫu');
  if (b.readAloudPerMonth !== null) lines.push(`Đọc to ${b.readAloudPerMonth} lần mỗi tháng`);
  lines.push(`Trợ lý viết ${b.writingAssistPerDay} lần mỗi ngày`);
  return lines;
};

export const quotaLines = (q: MyQuotaDto): { label: string; value: number }[] => [
  { label: 'Lượt dùng thử', value: q.trialCredits },
  { label: 'Lượt theo gói', value: q.cycleCredits },
  { label: 'Lượt Add-on', value: q.addOnCredits },
  { label: 'Lượt khác', value: q.otherCredits },
].filter((l) => l.value > 0);

export const tierLabel = (q: MyQuotaDto): string => q.plan?.planName ?? 'Miễn phí';

const pendingGroup = (planType: string): string => (planType === 'Reading' || planType === 'Creative' ? 'subscription' : planType);

export const findPendingTransaction = (items: PaymentTransactionDto[], planType: string, now: Date): PaymentTransactionDto | null => {
  const group = pendingGroup(planType);
  let best: PaymentTransactionDto | null = null;
  for (const item of items) {
    if (item.status !== 'Pending' || pendingGroup(item.planType) !== group) continue;
    if (now.getTime() >= new Date(item.expiresAt).getTime()) continue;
    if (!best || new Date(item.createdAt).getTime() > new Date(best.createdAt).getTime()) best = item;
  }
  return best;
};

export type PollState = 'waiting' | 'paid' | 'expired' | 'mismatch';
export const paymentPollState = (t: PaymentTransactionDto, now: Date): PollState => {
  if (t.status === 'Paid') return 'paid';
  if (t.status === 'MismatchAmount') return 'mismatch';
  if (t.status === 'Expired') return 'expired';
  return now.getTime() >= new Date(t.expiresAt).getTime() ? 'expired' : 'waiting';
};

/** Dates are `yyyy-MM-dd` strings, which compare correctly as text. */
export const validatePeriod = (start: string, end: string): string | null => {
  if (!start || !end) return 'Hãy chọn đủ ngày bắt đầu và ngày kết thúc.';
  if (end < start) return 'Ngày kết thúc phải từ ngày bắt đầu trở đi.';
  return null;
};

const pad = (n: number): string => String(n).padStart(2, '0');
export const currentMonthPeriod = (now: Date): { periodStart: string; periodEnd: string } => {
  const y = now.getFullYear();
  const m = now.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return { periodStart: `${y}-${pad(m + 1)}-01`, periodEnd: `${y}-${pad(m + 1)}-${pad(last)}` };
};

/** 0.3 -> "30" (whole percent, for fund rates). */
export const ratePercent = (rate: number): string => String(Math.round(rate * 100));
/** 0.8333 -> "83,3%" (one decimal, vi-VN comma). */
export const completionPercent = (rate: number): string => `${(rate * 100).toFixed(1).replace('.', ',')}%`;

export type LimitNotice = { text: string; upgrade: boolean };
export type LimitContext = 'child-profile' | 'roadmap-copy' | 'assistance' | 'purchase' | 'submit' | 'ai-credits';

/** The backend error code (ASSISTANCE_DAILY_LIMIT) arrives as `message` (AppException) or inside `errors`. */
export const limitMessage = (r: { status?: number; message: string; errors?: string[] | null }, context: LimitContext): LimitNotice | null => {
  switch (context) {
    case 'child-profile':
      return r.status === 409 ? { text: 'Gói hiện tại đã đủ số hồ sơ bé. Nâng cấp gói để thêm hồ sơ.', upgrade: true } : null;
    case 'roadmap-copy':
      return r.status === 403 ? { text: 'Gói hiện tại chưa gồm sao chép bộ truyện mẫu.', upgrade: true } : null;
    case 'assistance':
      return r.status === 429 && (r.message === 'ASSISTANCE_DAILY_LIMIT' || (r.errors ?? []).includes('ASSISTANCE_DAILY_LIMIT'))
        ? { text: 'Bạn đã dùng hết số lần trợ lý viết của hôm nay.', upgrade: true } : null;
    case 'purchase':
      return r.status === 403 ? { text: 'Gói này không dành cho loại tài khoản của bạn.', upgrade: false } : null;
    // Backend also returns 409 for unrelated conflicts (reused key, active input, locked output mode...), so match the fixed limit sentences.
    case 'submit':
      return r.status === 409 && r.message.includes('hết lượt gửi duyệt') ? { text: r.message, upgrade: true } : null;
    case 'ai-credits':
      return r.status === 409 && r.message.includes('hết lượt tạo truyện AI') ? { text: r.message, upgrade: true } : null;
    default:
      return null;
  }
};

/** Kiểm tra form gói của Admin trước khi gọi API; trả câu báo lỗi tiếng Việt hoặc null khi hợp lệ. */
export const validatePlanForm = (i: CreatePlanRequest): string | null => {
  const name = i.name.trim();
  if (!name) return 'Hãy nhập tên gói.';
  if (name.length > 150) return 'Tên gói tối đa 150 ký tự.';
  if (!(i.priceVnd > 0)) return 'Giá phải lớn hơn 0.';
  if (i.aiCredits < 0 || (i.submitCredits ?? 0) < 0) return 'Số lượt không được âm.';
  if ((i.planType === 'Reading' || i.planType === 'Creative') && (!i.benefits || i.benefits.maxChildProfiles < 1)) {
    return 'Gói Đọc và Gói Sáng tạo cần ít nhất 1 hồ sơ bé.';
  }
  if (i.audience === 'Creator' && i.planType !== 'CreatorPack') return 'Gói cho Creator phải là Gói Creator.';
  return null;
};

/** Kiểm tra cấu hình chung của Admin trước khi lưu; trả câu báo lỗi tiếng Việt hoặc null khi hợp lệ. */
export const validatePlanSettings = (s: UpdatePlanSettingsRequest): string | null => {
  if ([s.readingFundPercent, s.creativeFundPercent].some((v) => !(v >= 0 && v <= 100))) return 'Tỷ lệ quỹ phải từ 0 đến 100.';
  if (!(s.minimumReadSeconds >= 1 && s.minimumReadSeconds <= 3600)) return 'Thời gian đọc tối thiểu phải từ 1 đến 3600 giây.';
  if (!(s.freeMaxChildProfiles >= 1)) return 'Mức Miễn phí cần ít nhất 1 hồ sơ bé.';
  const rest = [
    s.creatorMonthlyAiCredits, s.creatorMonthlySubmitCredits, s.partnerMonthlyAiCredits, s.partnerMonthlySubmitCredits,
    s.trialAiCredits, s.freeWeeklyNewLibraryStories, s.freeReadAloudPerMonth,
    s.freeWritingAssistPerDay, s.creatorWritingAssistPerDay, s.partnerWritingAssistPerDay,
  ];
  if (rest.some((v) => v !== null && v < 0)) return 'Giá trị không được âm.';
  return null;
};

export const CREDIT_REASON_MAX = 500;

/** Kiểm tra số lượt (nguyên, khác 0) và lý do (bắt buộc, ≤ 500 ký tự) trước khi cấp/trừ; trả câu báo lỗi hoặc null. */
export const validateCreditAdjustment = (amountText: string, reason: string): string | null => {
  const text = amountText.trim();
  if (!/^[+-]?\d+$/.test(text) || !Number.isSafeInteger(Number(text))) return 'Số lượt phải là số nguyên.';
  if (Number(text) === 0) return 'Số lượt phải khác 0.';
  const r = reason.trim();
  if (!r) return 'Hãy nhập lý do.';
  if (r.length > CREDIT_REASON_MAX) return `Lý do tối đa ${CREDIT_REASON_MAX} ký tự.`;
  return null;
};

/** Số lượt có dấu: +3 / −2. */
export const signedCredits = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
