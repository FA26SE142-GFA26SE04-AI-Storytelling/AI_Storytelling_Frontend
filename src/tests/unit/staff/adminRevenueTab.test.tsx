import { isValidElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MonthPeriod, Period } from '@/app/lib/monthPeriods';
import type { RevenueStatisticsDto } from '@/app/types/backendContracts';

// Hook host to run useState and useEffect synchronously in Node environment
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];

  const revenueStats = vi.fn();
  const showToast = vi.fn();

  return {
    revenueStats,
    showToast,
    begin() {
      cursor = 0;
      effects = [];
    },
    commit() {
      effects.forEach((effect) => effect());
    },
    reset() {
      slots.forEach((slot) => slot.cleanup?.());
      slots.length = 0;
      effects = [];
    },
    useState<T>(initial: T | (() => T)) {
      const index = cursor++;
      if (slots[index] === undefined) {
        const val = typeof initial === 'function' ? (initial as () => T)() : initial;
        slots[index] = { value: val };
      }
      return [
        slots[index].value as T,
        (next: T | ((current: T) => T)) => {
          slots[index].value =
            typeof next === 'function'
              ? (next as (current: T) => T)(slots[index].value as T)
              : next;
        },
      ] as const;
    },
    useRef<T>(initial: T) {
      const index = cursor++;
      slots[index] ??= { value: { current: initial } };
      return slots[index].value as { current: T };
    },
    useEffect(effect: () => void | (() => void), deps?: readonly unknown[]) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous?.deps || !deps || deps.some((value, i) => !Object.is(value, previous.deps?.[i]))) {
        effects.push(() => {
          previous?.cleanup?.();
          slots[index] = { deps, cleanup: effect() || undefined };
        });
      }
    },
    useCallback<T extends (...args: unknown[]) => unknown>(fn: T, deps: readonly unknown[]) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous?.deps || deps.some((value, i) => !Object.is(value, previous.deps?.[i]))) {
        slots[index] = { deps, value: fn };
      }
      return (slots[index].value ?? fn) as T;
    },
  };
});

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useState: host.useState,
  useRef: host.useRef,
  useEffect: host.useEffect,
  useCallback: host.useCallback,
}));

vi.mock('@/app/services/staffService', () => ({
  staffService: {
    revenueStats: host.revenueStats,
  },
}));

vi.mock('@/app/lib/toast', () => ({
  showToast: host.showToast,
}));

vi.mock('@/app/components/stats/useMonthlyStats', () => ({
  useMonthlyStats: () => [1, 2, 3, 4, 5, 6],
}));

vi.mock('@/app/lib/motion', () => ({
  useGrowBars: () => ({ current: null }),
  usePop: () => ({ current: null }),
}));

vi.mock('@/app/features/staff/RevenueByPlanDonut', () => ({
  default: () => null,
}));

import { AdminRevenueTab } from '@/app/features/staff/AdminRevenueTab';


function allText(tree: ReactNode): string {
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  if (!tree || typeof tree !== 'object') return '';
  if (Array.isArray(tree)) return tree.map(allText).join(' ');
  if (isValidElement<Record<string, unknown>>(tree)) {
    if (typeof tree.type === 'function') {
      try {
        const rendered = (tree.type as (props: unknown) => ReactNode)(tree.props);
        return allText(rendered);
      } catch {
        return allText(tree.props.children as ReactNode);
      }
    }
    return allText(tree.props.children as ReactNode);
  }
  return '';
}

const tick = async () => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
};

const testPeriod: Period = {
  preset: 'thisMonth',
  start: '2026-11-01',
  end: '2026-11-30',
};

const testMonths: MonthPeriod[] = [
  { key: '2026-06', label: 'T6/2026', start: '2026-06-01', end: '2026-06-30' },
  { key: '2026-07', label: 'T7/2026', start: '2026-07-01', end: '2026-07-31' },
  { key: '2026-08', label: 'T8/2026', start: '2026-08-01', end: '2026-08-31' },
  { key: '2026-09', label: 'T9/2026', start: '2026-09-01', end: '2026-09-30' },
  { key: '2026-10', label: 'T10/2026', start: '2026-10-01', end: '2026-10-31' },
  { key: '2026-11', label: 'T11/2026', start: '2026-11-01', end: '2026-11-30' },
];

const revenueFixture: RevenueStatisticsDto = {
  periodStart: '2026-11-01',
  periodEnd: '2026-11-30',
  totalRevenueVnd: 1234567,
  paidTransactionCount: 12,
  buyingParents: 5,
  repeatBuyingParents: 2,
  creatorFundVnd: 300000,
  readingFundRate: 0.3,
  creativeFundRate: 0.1,
  transactionsByStatus: {
    paid: 12,
    pending: 3,
    expired: 1,
    mismatchAmount: 0,
  },
  revenueByPlan: [
    {
      planId: 1,
      planName: 'Gói Đọc',
      planType: 'Reading',
      transactionCount: 10,
      revenueVnd: 1000000,
    },
  ],
  revenueByPlanType: [
    {
      planType: 'Reading',
      transactionCount: 10,
      revenueVnd: 1000000,
    },
  ],
  creditsGranted: 50,
  creditsUsed: 20,
  creditsGrantedBySource: [
    {
      source: 'Plan',
      credits: 50,
    },
  ],
  manuallyMarkedPaidCount: 1,
  manuallyMarkedPaidRevenueVnd: 99000,
};

function renderRevenue(period = testPeriod, months = testMonths) {
  host.begin();
  const tree = AdminRevenueTab({ period, months });
  host.commit();
  return tree;
}

describe('AdminRevenueTab', () => {
  beforeEach(() => {
    host.revenueStats.mockResolvedValue({
      success: true,
      message: '',
      data: revenueFixture,
    });
  });

  afterEach(() => {
    host.reset();
    vi.clearAllMocks();
  });

  it('(a) displays "Tổng doanh thu", "1.234.567 đ", "Giao dịch đã thanh toán" and "12"', async () => {
    renderRevenue();
    await tick();
    const tree = renderRevenue();

    const text = allText(tree);
    expect(text).toContain('Tổng doanh thu');
    expect(text).toContain('1.234.567 đ');
    expect(text).toContain('Giao dịch đã thanh toán');
    expect(text).toContain('12');
  });

  it('(b) calls showToast and hides "1.234.567" when revenueStats returns success: false', async () => {
    host.revenueStats.mockResolvedValue({
      success: false,
      message: 'Lỗi thử',
      data: null,
    });

    renderRevenue();
    await tick();
    const tree = renderRevenue();

    expect(host.showToast).toHaveBeenCalledWith('Lỗi thử', 'err');
    const text = allText(tree);
    expect(text).not.toContain('1.234.567');
  });
});
