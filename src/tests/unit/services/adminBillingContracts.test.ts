import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminBillingService } from '@/app/services/adminBillingService';
import { authService } from '@/app/services/authService';
import type { PlanSettingsDto } from '@/app/types/backendContracts';

const okBody = (data: unknown = null) => new Response(JSON.stringify({ success: true, message: 'OK', data }));
const spyFetch = () => vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
const urlOf = (spy: ReturnType<typeof spyFetch>) => new URL(String(spy.mock.calls[0][0]));
const queryOf = (spy: ReturnType<typeof spyFetch>) => Object.fromEntries(urlOf(spy).searchParams);
const methodOf = (spy: ReturnType<typeof spyFetch>) => spy.mock.calls[0][1]?.method ?? 'GET';
const bodyOf = (spy: ReturnType<typeof spyFetch>) => JSON.parse(String(spy.mock.calls[0][1]?.body));
const period = { periodStart: '2026-11-01', periodEnd: '2026-11-30' };

afterEach(() => vi.restoreAllMocks());

describe('Admin — gói, thanh toán, lượt, báo cáo — hợp đồng API', () => {
  it('transactions: GET /Payment/admin/transactions, mặc định trang 1 và 20 dòng', async () => {
    const spy = spyFetch();
    await adminBillingService.transactions({ status: 'Pending', search: 'abc' });
    expect(urlOf(spy).pathname).toMatch(/\/Payment\/admin\/transactions$/);
    expect(methodOf(spy)).toBe('GET');
    expect(queryOf(spy)).toEqual({ status: 'Pending', search: 'abc', pageIndex: '1', pageSize: '20' });
  });

  it('transactions: tham số bỏ trống không xuất hiện trong query', async () => {
    const spy = spyFetch();
    await adminBillingService.transactions({ pageIndex: 2, pageSize: 5 });
    expect(queryOf(spy)).toEqual({ pageIndex: '2', pageSize: '5' });
  });

  it('plans: GET /Payment/admin/plans', async () => {
    const spy = spyFetch();
    await adminBillingService.plans();
    expect(urlOf(spy).pathname).toMatch(/\/Payment\/admin\/plans$/);
    expect(methodOf(spy)).toBe('GET');
  });

  it('createPlan: POST /Payment/admin/plans kèm body', async () => {
    const spy = spyFetch();
    const body = { name: 'Gói Đọc', audience: 'User' as const, planType: 'Reading' as const, priceVnd: 99000, aiCredits: 10, isActive: true,
      benefits: { maxChildProfiles: 2, weeklyNewLibraryStories: null, canCopyRoadmapTemplates: true, readAloudPerMonth: null, writingAssistPerDay: 5 } };
    await adminBillingService.createPlan(body);
    expect(urlOf(spy).pathname).toMatch(/\/Payment\/admin\/plans$/);
    expect(methodOf(spy)).toBe('POST');
    expect(bodyOf(spy)).toEqual(body);
  });

  it('updatePlan: PUT /Payment/admin/plans/{id} kèm body', async () => {
    const spy = spyFetch();
    const body = { name: 'Gói Đọc', priceVnd: 120000, aiCredits: 12, isActive: false };
    await adminBillingService.updatePlan(7, body);
    expect(urlOf(spy).pathname).toMatch(/\/Payment\/admin\/plans\/7$/);
    expect(methodOf(spy)).toBe('PUT');
    expect(bodyOf(spy)).toEqual(body);
  });

  it('settings: GET /Payment/admin/settings', async () => {
    const spy = spyFetch();
    await adminBillingService.settings();
    expect(urlOf(spy).pathname).toMatch(/\/Payment\/admin\/settings$/);
    expect(methodOf(spy)).toBe('GET');
  });

  it('saveSettings: PUT /Payment/admin/settings gửi đủ 15 trường', async () => {
    const spy = spyFetch();
    const body = {
      readingFundPercent: 30, creativeFundPercent: 10, creatorMonthlyAiCredits: 20, creatorMonthlySubmitCredits: 5,
      partnerMonthlyAiCredits: 40, partnerMonthlySubmitCredits: 10, minimumReadSeconds: 30, trialAiCredits: 1,
      freeMaxChildProfiles: 1, freeWeeklyNewLibraryStories: null, freeCanCopyRoadmapTemplates: false, freeReadAloudPerMonth: null,
      freeWritingAssistPerDay: 3, creatorWritingAssistPerDay: 10, partnerWritingAssistPerDay: 20,
    } satisfies Omit<PlanSettingsDto, 'updatedAt'>;
    await adminBillingService.saveSettings(body);
    expect(urlOf(spy).pathname).toMatch(/\/Payment\/admin\/settings$/);
    expect(methodOf(spy)).toBe('PUT');
    expect(Object.keys(bodyOf(spy))).toHaveLength(15);
    expect(bodyOf(spy)).toEqual(body);
  });

  it('reconciliation: GET /Payment/admin/reconciliation với bộ lọc', async () => {
    const spy = spyFetch();
    await adminBillingService.reconciliation({ status: 'Open' });
    expect(urlOf(spy).pathname).toMatch(/\/Payment\/admin\/reconciliation$/);
    expect(queryOf(spy)).toEqual({ status: 'Open', pageIndex: '1', pageSize: '20' });
  });

  it('reconciliation: không lọc thì chỉ gửi trang', async () => {
    const spy = spyFetch();
    await adminBillingService.reconciliation({});
    expect(queryOf(spy)).toEqual({ pageIndex: '1', pageSize: '20' });
  });

  it('resolveException: POST /Payment/admin/reconciliation/{id}/resolve', async () => {
    const spy = spyFetch();
    await adminBillingService.resolveException(4);
    expect(urlOf(spy).pathname).toMatch(/\/Payment\/admin\/reconciliation\/4\/resolve$/);
    expect(methodOf(spy)).toBe('POST');
  });

  it('adjustCredits: POST /TokenQuota/admin/adjustments kèm userId, amount, reason', async () => {
    const spy = spyFetch();
    await adminBillingService.adjustCredits({ userId: 12, amount: 3, reason: 'Bù lỗi sinh truyện' });
    expect(urlOf(spy).pathname).toMatch(/\/TokenQuota\/admin\/adjustments$/);
    expect(methodOf(spy)).toBe('POST');
    expect(bodyOf(spy)).toEqual({ userId: 12, amount: 3, reason: 'Bù lỗi sinh truyện' });
  });

  it('adjustments: GET /TokenQuota/admin/adjustments, lọc theo userId', async () => {
    const spy = spyFetch();
    await adminBillingService.adjustments({ userId: 12 });
    expect(urlOf(spy).pathname).toMatch(/\/TokenQuota\/admin\/adjustments$/);
    expect(queryOf(spy)).toEqual({ userId: '12', pageIndex: '1', pageSize: '20' });
  });

  it('adjustments: không có userId thì không gửi userId', async () => {
    const spy = spyFetch();
    await adminBillingService.adjustments({});
    expect(queryOf(spy)).toEqual({ pageIndex: '1', pageSize: '20' });
  });

  it('userQuota: GET /TokenQuota/admin/users/{userId}', async () => {
    const spy = spyFetch();
    await adminBillingService.userQuota(12);
    expect(urlOf(spy).pathname).toMatch(/\/TokenQuota\/admin\/users\/12$/);
    expect(methodOf(spy)).toBe('GET');
  });

  it('revenue: GET /BusinessReport/admin/revenue kèm kỳ yyyy-MM-dd nguyên văn', async () => {
    const spy = spyFetch();
    await adminBillingService.revenue(period);
    expect(urlOf(spy).pathname).toMatch(/\/BusinessReport\/admin\/revenue$/);
    expect(queryOf(spy)).toEqual(period);
  });

  it('accounts: GET /BusinessReport/admin/accounts kèm kỳ', async () => {
    const spy = spyFetch();
    await adminBillingService.accounts(period);
    expect(urlOf(spy).pathname).toMatch(/\/BusinessReport\/admin\/accounts$/);
    expect(queryOf(spy)).toEqual(period);
  });

  it('reports: GET /BusinessReport/admin, mặc định trang 1 và 20 dòng', async () => {
    const spy = spyFetch();
    await adminBillingService.reports();
    expect(urlOf(spy).pathname).toMatch(/\/BusinessReport\/admin$/);
    expect(queryOf(spy)).toEqual({ pageIndex: '1', pageSize: '20' });
  });

  it('report: GET /BusinessReport/admin/{id}', async () => {
    const spy = spyFetch();
    await adminBillingService.report(9);
    expect(urlOf(spy).pathname).toMatch(/\/BusinessReport\/admin\/9$/);
    expect(methodOf(spy)).toBe('GET');
  });
});
