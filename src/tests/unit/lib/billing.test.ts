import { describe, expect, it } from 'vitest';
import {
  benefitLines, completionPercent, ratePercent, currentMonthPeriod, findPendingTransaction, limitMessage, paymentPollState,
  planTypeLabel, quotaLines, tierLabel, transactionStatusLabel, validatePeriod, validatePlanForm, validatePlanSettings, vnd,
} from '@/app/lib/billing';
import type { CreatePlanRequest, UpdatePlanSettingsRequest, MyQuotaDto, PaymentTransactionDto } from '@/app/types/backendContracts';

const q: MyQuotaDto = {
  plan: { planName: 'Gói Đọc' } as MyQuotaDto['plan'], nextPlan: null,
  trialCredits: 1, cycleCredits: 1, addOnCredits: 1, otherCredits: 1, totalRemaining: 4,
  benefits: null, newLibraryStoriesThisWeek: 0, writingAssistsToday: 0,
};
const t: PaymentTransactionDto = {
  id: 1, planId: 1, planName: 'Gói', planType: 'Creative', amount: 99000, transactionCode: 'C', qrCodeUrl: null,
  status: 'Pending', createdAt: '2026-11-13T10:00:00Z', expiresAt: '2026-11-13T10:15:00Z', paidAt: null, sepayTransactionId: null,
};
const beforeExpiry = new Date('2026-11-13T10:05:00Z');
const afterExpiry = new Date('2026-11-13T10:20:00Z');
const pendingCreative = { ...t, id: 7 };

describe('billing helpers', () => {
  it('formats money and labels', () => {
    expect(vnd(99000)).toBe('99.000đ');
    expect(planTypeLabel('CreatorPack')).toBe('Gói Creator');
    expect(planTypeLabel('Other')).toBe('Other');
    expect(transactionStatusLabel('MismatchAmount')).toBe('Chờ quản trị viên xử lý');
    expect(transactionStatusLabel('MismatchAmount', 'admin')).toBe('Lệch số tiền');
    expect(transactionStatusLabel('Pending', 'admin')).toBe('Chờ thanh toán');
    expect(transactionStatusLabel('Weird', 'admin')).toBe('Weird');
  });

  it('builds benefit lines with null meaning unlimited', () => {
    expect(benefitLines({ maxChildProfiles: 4, weeklyNewLibraryStories: null, canCopyRoadmapTemplates: true, readAloudPerMonth: 60, writingAssistPerDay: 5 }))
      .toEqual(['Tối đa 4 hồ sơ bé', 'Truyện thư viện không giới hạn', 'Sao chép bộ truyện mẫu', 'Đọc to 60 lần mỗi tháng', 'Trợ lý viết 5 lần mỗi ngày']);
    expect(benefitLines({ maxChildProfiles: 1, weeklyNewLibraryStories: 3, canCopyRoadmapTemplates: false, readAloudPerMonth: null, writingAssistPerDay: 5 }))
      .toEqual(['Tối đa 1 hồ sơ bé', '3 truyện thư viện mới mỗi tuần', 'Trợ lý viết 5 lần mỗi ngày']);
  });

  it('lists only non-zero quota sources', () => {
    expect(quotaLines({ ...q, trialCredits: 0, cycleCredits: 4, addOnCredits: 2, otherCredits: 0 }))
      .toEqual([{ label: 'Lượt theo gói', value: 4 }, { label: 'Lượt Add-on', value: 2 }]);
    expect(tierLabel({ ...q, plan: null })).toBe('Miễn phí');
    expect(tierLabel(q)).toBe('Gói Đọc');
  });

  it('finds pending transactions in the same group', () => {
    expect(findPendingTransaction([pendingCreative], 'Reading', beforeExpiry)?.id).toBe(pendingCreative.id);
    expect(findPendingTransaction([pendingCreative], 'AddOn', beforeExpiry)).toBeNull();
    expect(findPendingTransaction([pendingCreative], 'Reading', afterExpiry)).toBeNull();
    expect(findPendingTransaction([{ ...t, status: 'Paid' }], 'Creative', beforeExpiry)).toBeNull();
    const newer = { ...t, id: 9, createdAt: '2026-11-13T10:01:00Z' };
    expect(findPendingTransaction([pendingCreative, newer], 'Creative', beforeExpiry)?.id).toBe(9);
  });

  it('derives poll state', () => {
    expect(paymentPollState({ ...t, status: 'Pending' }, beforeExpiry)).toBe('waiting');
    expect(paymentPollState({ ...t, status: 'Pending' }, afterExpiry)).toBe('expired');
    expect(paymentPollState({ ...t, status: 'Paid' }, afterExpiry)).toBe('paid');
    expect(paymentPollState({ ...t, status: 'MismatchAmount' }, beforeExpiry)).toBe('mismatch');
    expect(paymentPollState({ ...t, status: 'Expired' }, beforeExpiry)).toBe('expired');
    expect(paymentPollState({ ...t, status: 'Pending' }, new Date(t.expiresAt))).toBe('expired');
  });

  it('validates periods', () => {
    expect(validatePeriod('2026-11-01', '2026-11-30')).toBeNull();
    expect(validatePeriod('2026-11-30', '2026-11-01')).toBe('Ngày kết thúc phải từ ngày bắt đầu trở đi.');
    expect(validatePeriod('', '2026-11-30')).toBe('Hãy chọn đủ ngày bắt đầu và ngày kết thúc.');
    expect(currentMonthPeriod(new Date(2026, 10, 13))).toEqual({ periodStart: '2026-11-01', periodEnd: '2026-11-30' });
    expect(currentMonthPeriod(new Date(2026, 11, 5))).toEqual({ periodStart: '2026-12-01', periodEnd: '2026-12-31' });
  });

  it('maps limit errors', () => {
    expect(limitMessage({ status: 409, message: 'x' }, 'child-profile')).toEqual({ text: 'Gói hiện tại đã đủ số hồ sơ bé. Nâng cấp gói để thêm hồ sơ.', upgrade: true });
    expect(limitMessage({ status: 403, message: 'x' }, 'roadmap-copy')).toEqual({ text: 'Gói hiện tại chưa gồm sao chép bộ truyện mẫu.', upgrade: true });
    expect(limitMessage({ status: 429, message: 'x', errors: ['ASSISTANCE_DAILY_LIMIT'] }, 'assistance')).toEqual({ text: 'Bạn đã dùng hết số lần trợ lý viết của hôm nay.', upgrade: true });
    expect(limitMessage({ status: 429, message: 'ASSISTANCE_DAILY_LIMIT', errors: null }, 'assistance')).toEqual({ text: 'Bạn đã dùng hết số lần trợ lý viết của hôm nay.', upgrade: true });
    expect(limitMessage({ status: 429, message: 'x', errors: null }, 'assistance')).toBeNull();
    expect(limitMessage({ status: 403, message: 'x' }, 'purchase')).toEqual({ text: 'Gói này không dành cho loại tài khoản của bạn.', upgrade: false });
    const submitMsg = 'Bạn đã hết lượt gửi duyệt. Hãy chờ hạn mức tháng sau hoặc mua Gói Creator để gửi thêm.';
    const creditMsg = 'Bạn đã hết lượt tạo truyện AI. Hãy nâng lên Gói Sáng tạo hoặc mua Add-on để tạo thêm.';
    expect(limitMessage({ status: 409, message: submitMsg }, 'submit')).toEqual({ text: submitMsg, upgrade: true });
    expect(limitMessage({ status: 409, message: creditMsg }, 'ai-credits')).toEqual({ text: creditMsg, upgrade: true });
    expect(limitMessage({ status: 409, message: 'Story draft đang có một yêu cầu input hoạt động' }, 'ai-credits')).toBeNull();
    expect(limitMessage({ status: 409, message: 'x' }, 'submit')).toBeNull();
    expect(limitMessage({ status: 500, message: creditMsg }, 'ai-credits')).toBeNull();
    expect(limitMessage({ status: 500, message: 'x' }, 'child-profile')).toBeNull();
    expect(limitMessage({ status: 403, message: 'x' }, 'child-profile')).toBeNull();
  });
});

describe('statistics percent helpers', () => {
  it('formats fund rates as whole percents', () => {
    expect(ratePercent(0.3)).toBe('30');
    expect(ratePercent(0.1)).toBe('10');
  });
  it('formats completion rate with one decimal', () => {
    expect(completionPercent(0)).toBe('0,0%');
    expect(completionPercent(0.8333)).toBe('83,3%');
    expect(completionPercent(1)).toBe('100,0%');
  });
});

describe('validatePlanForm', () => {
  const ok: CreatePlanRequest = {
    name: 'Gói Đọc', audience: 'User', planType: 'Reading', priceVnd: 99000, aiCredits: 10, isActive: true,
    benefits: { maxChildProfiles: 2, weeklyNewLibraryStories: null, canCopyRoadmapTemplates: false, readAloudPerMonth: null, writingAssistPerDay: 3 },
  };
  it('rejects bad names, prices and credits', () => {
    expect(validatePlanForm({ ...ok, name: '  ' })).toBe('Hãy nhập tên gói.');
    expect(validatePlanForm({ ...ok, name: 'a'.repeat(151) })).toBe('Tên gói tối đa 150 ký tự.');
    expect(validatePlanForm({ ...ok, priceVnd: 0 })).toBe('Giá phải lớn hơn 0.');
    expect(validatePlanForm({ ...ok, aiCredits: -1 })).toBe('Số lượt không được âm.');
    expect(validatePlanForm({ ...ok, submitCredits: -1 })).toBe('Số lượt không được âm.');
  });
  it('requires a child profile for Reading and Creative', () => {
    const msg = 'Gói Đọc và Gói Sáng tạo cần ít nhất 1 hồ sơ bé.';
    expect(validatePlanForm({ ...ok, benefits: undefined })).toBe(msg);
    expect(validatePlanForm({ ...ok, planType: 'Creative', benefits: { ...ok.benefits!, maxChildProfiles: 0 } })).toBe(msg);
  });
  it('keeps Creator audience on CreatorPack', () => {
    expect(validatePlanForm({ ...ok, audience: 'Creator', planType: 'Reading' })).toBe('Gói cho Creator phải là Gói Creator.');
    expect(validatePlanForm({ ...ok, audience: 'Creator', planType: 'CreatorPack', benefits: undefined, submitCredits: 5 })).toBeNull();
  });
  it('accepts valid data', () => {
    expect(validatePlanForm(ok)).toBeNull();
  });
});

describe('validatePlanSettings', () => {
  const ok: UpdatePlanSettingsRequest = {
    readingFundPercent: 40, creativeFundPercent: 30, creatorMonthlyAiCredits: 100, creatorMonthlySubmitCredits: 10,
    partnerMonthlyAiCredits: 200, partnerMonthlySubmitCredits: 20, minimumReadSeconds: 30, trialAiCredits: 3,
    freeMaxChildProfiles: 1, freeWeeklyNewLibraryStories: null, freeCanCopyRoadmapTemplates: false, freeReadAloudPerMonth: null,
    freeWritingAssistPerDay: 0, creatorWritingAssistPerDay: 5, partnerWritingAssistPerDay: 10,
  };
  it('accepts valid data', () => expect(validatePlanSettings(ok)).toBeNull());
  it('rejects fund percent outside 0-100', () => {
    expect(validatePlanSettings({ ...ok, readingFundPercent: 101 })).toBe('Tỷ lệ quỹ phải từ 0 đến 100.');
    expect(validatePlanSettings({ ...ok, creativeFundPercent: -1 })).toBe('Tỷ lệ quỹ phải từ 0 đến 100.');
  });
  it('rejects minimum read seconds outside 1-3600', () => {
    expect(validatePlanSettings({ ...ok, minimumReadSeconds: 0 })).toBe('Thời gian đọc tối thiểu phải từ 1 đến 3600 giây.');
    expect(validatePlanSettings({ ...ok, minimumReadSeconds: 3601 })).toBe('Thời gian đọc tối thiểu phải từ 1 đến 3600 giây.');
  });
  it('requires at least 1 child profile for Free', () => {
    expect(validatePlanSettings({ ...ok, freeMaxChildProfiles: 0 })).toBe('Mức Miễn phí cần ít nhất 1 hồ sơ bé.');
  });
  it('rejects negatives elsewhere', () => {
    expect(validatePlanSettings({ ...ok, trialAiCredits: -1 })).toBe('Giá trị không được âm.');
    expect(validatePlanSettings({ ...ok, freeReadAloudPerMonth: -2 })).toBe('Giá trị không được âm.');
    expect(validatePlanSettings({ ...ok, partnerWritingAssistPerDay: -1 })).toBe('Giá trị không được âm.');
  });
});
