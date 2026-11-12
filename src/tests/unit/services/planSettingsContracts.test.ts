import { afterEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { adminPaymentService } from '@/app/services/paymentService';
import type { CreateSubscriptionPlanRequest, UpdatePlanSettingsRequest } from '@/app/types/planSettings';

const okBody = (data: unknown = null) => new Response(JSON.stringify({ success: true, message: 'OK', data }));

afterEach(() => vi.restoreAllMocks());

describe('adminPaymentService — hợp đồng API cài đặt và tạo gói', () => {
  it('tạo gói mới gửi đúng URL, POST method và body', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    const body: CreateSubscriptionPlanRequest = {
      name: 'Gói thử',
      audience: 'User',
      planType: 'Reading',
      priceVnd: 50000,
      aiCredits: 100,
      submitCredits: 0,
      isActive: true,
      benefits: {
        maxChildProfiles: 2,
        weeklyNewLibraryStories: null,
        canCopyRoadmapTemplates: true,
        readAloudPerMonth: null,
        writingAssistPerDay: 5,
      },
    };

    await adminPaymentService.createPlan(body);

    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toMatch(/\/Payment\/admin\/plans$/);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(body);
  });

  it('lấy cài đặt gói gửi đúng URL và method GET', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());

    await adminPaymentService.settings();

    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toMatch(/\/Payment\/admin\/settings$/);
    expect(init?.method ?? 'GET').toBe('GET');
  });

  it('cập nhật cài đặt gói gửi đúng URL, PUT method và body', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    const body: UpdatePlanSettingsRequest = {
      readingFundPercent: 40,
      creativeFundPercent: 10,
      creatorMonthlyAiCredits: 50,
      creatorMonthlySubmitCredits: 10,
      partnerMonthlyAiCredits: 0,
      partnerMonthlySubmitCredits: 0,
      minimumReadSeconds: 30,
      trialAiCredits: 20,
      freeMaxChildProfiles: 1,
      freeWeeklyNewLibraryStories: 3,
      freeCanCopyRoadmapTemplates: false,
      freeReadAloudPerMonth: null,
      freeWritingAssistPerDay: 5,
      creatorWritingAssistPerDay: 20,
      partnerWritingAssistPerDay: 20,
    };

    await adminPaymentService.updateSettings(body);

    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toMatch(/\/Payment\/admin\/settings$/);
    expect(init?.method).toBe('PUT');
    expect(JSON.parse(String(init?.body))).toEqual(body);
  });
});
