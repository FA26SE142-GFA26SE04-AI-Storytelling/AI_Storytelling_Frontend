import { afterEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { childProfileService } from '@/app/services/childProfileService';
import { paymentService } from '@/app/services/paymentService';
import { staffService } from '@/app/services/staffService';

const okBody = (data: unknown = null) => new Response(JSON.stringify({ success: true, message: 'OK', data }));

afterEach(() => vi.restoreAllMocks());

describe('Gói và thanh toán — hợp đồng API', () => {
  it('lịch sử giao dịch gọi /Payment/transactions/me, mặc định trang 1, 20 dòng', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody({ items: [], totalCount: 0, pageIndex: 1, pageSize: 20 }));
    await paymentService.myTransactions();
    const url = new URL(String(spy.mock.calls[0][0]));
    expect(url.pathname).toMatch(/\/Payment\/transactions\/me$/);
    expect(Object.fromEntries(url.searchParams)).toEqual({ pageIndex: '1', pageSize: '20' });
    expect(spy.mock.calls[0][1]?.method ?? 'GET').toBe('GET');
  });

  it('lịch sử giao dịch gửi đúng trang được yêu cầu', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody({ items: [], totalCount: 0, pageIndex: 3, pageSize: 10 }));
    await paymentService.myTransactions(3, 10);
    expect(Object.fromEntries(new URL(String(spy.mock.calls[0][0])).searchParams)).toEqual({ pageIndex: '3', pageSize: '10' });
  });

  it('lượt còn lại của tài khoản gọi /TokenQuota/me', async () => {
    const quota = { plan: null, nextPlan: null, trialCredits: 1, cycleCredits: 0, addOnCredits: 0, otherCredits: 0, totalRemaining: 1 };
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody(quota));
    const result = await paymentService.myQuota();
    expect(new URL(String(spy.mock.calls[0][0])).pathname).toMatch(/\/TokenQuota\/me$/);
    expect(result.data).toEqual(quota);
  });

  it('tạo giao dịch gửi planId trong body', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    await paymentService.create(3);
    expect(new URL(String(spy.mock.calls[0][0])).pathname).toMatch(/\/Payment\/transactions$/);
    expect(JSON.parse(String(spy.mock.calls[0][1]?.body))).toEqual({ planId: 3 });
  });

  it('lượt của Creator gọi GET /TokenQuota/creator/me', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    await paymentService.creatorQuota();
    expect(new URL(String(spy.mock.calls[0][0])).pathname).toMatch(/\/TokenQuota\/creator\/me$/);
    expect(spy.mock.calls[0][1]?.method ?? 'GET').toBe('GET');
  });

  it('suất đọc: GET /ChildProfile/reading-slots', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    await childProfileService.getReadingSlots();
    expect(new URL(String(spy.mock.calls[0][0])).pathname).toMatch(/\/ChildProfile\/reading-slots$/);
    expect(spy.mock.calls[0][1]?.method ?? 'GET').toBe('GET');
  });

  it('chọn suất đọc: PUT /ChildProfile/reading-slots gửi childProfileIds', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    await childProfileService.selectReadingSlots([12]);
    expect(new URL(String(spy.mock.calls[0][0])).pathname).toMatch(/\/ChildProfile\/reading-slots$/);
    expect(spy.mock.calls[0][1]?.method).toBe('PUT');
    expect(JSON.parse(String(spy.mock.calls[0][1]?.body))).toEqual({ childProfileIds: [12] });
  });

  it('màn quản trị không còn gọi cấu hình Token Quota đã gỡ ở backend', () => {
    expect(staffService).not.toHaveProperty('quotaConfigs');
    expect(staffService).not.toHaveProperty('setQuota');
  });
});
