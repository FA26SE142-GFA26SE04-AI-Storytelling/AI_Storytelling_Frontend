import { isValidElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MyQuotaDto, SubscriptionPlanDto } from '@/app/types/backendContracts';

// Mock host to execute React state and effects synchronously in Node
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];

  return {
    creatorQuota: vi.fn(),
    myQuota: vi.fn(),
    plans: vi.fn(),
    myTransactions: vi.fn(),
    create: vi.fn(),
    confirmDialog: vi.fn(async () => true),
    showToast: vi.fn(),
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
    useEffect(effect: () => void | (() => void), deps: readonly unknown[]) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous?.deps || deps.some((value, i) => !Object.is(value, previous.deps?.[i]))) {
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

vi.mock('@/app/features/staff/staffAccess', () => ({ useAccessLookup: () => () => ({ state: 'Allowed', reason: null }) }));
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useState: host.useState,
  useRef: host.useRef,
  useEffect: host.useEffect,
  useCallback: host.useCallback,
}));

vi.mock('@/app/services/paymentService', () => ({
  paymentService: {
    creatorQuota: host.creatorQuota,
    myQuota: host.myQuota,
    plans: host.plans,
    myTransactions: host.myTransactions,
    create: host.create,
  },
}));

vi.mock('@/app/lib/confirm', () => ({
  confirmDialog: host.confirmDialog,
}));

vi.mock('@/app/lib/toast', () => ({
  showToast: host.showToast,
}));

vi.mock('@/app/lib/motion', () => ({
  useGrowBars: () => ({ current: null }),
  usePop: () => ({ current: null }),
}));

import PaymentSection from '@/app/features/account/PaymentSection';

function allText(tree: ReactNode): string {
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  if (!tree || typeof tree !== 'object') return '';
  if (Array.isArray(tree)) return tree.map(allText).join('');
  if (isValidElement<Record<string, unknown>>(tree)) {
    if (typeof tree.type === 'function') {
      const rendered = (tree.type as (props: unknown) => ReactNode)(tree.props);
      return allText(rendered);
    }
    return allText(tree.props.children as ReactNode);
  }
  return '';
}

const benefits: NonNullable<MyQuotaDto['benefits']> = {
  weeklyNewLibraryStories: 24,
  newLibraryStoriesPeriod: 'Cycle',
  newLibraryStoriesPeriodStart: '2026-11-15T17:30:00Z',
  newLibraryStoriesResetsAt: '2026-12-15T17:30:00Z',
};

const baseQuota: MyQuotaDto = {
  plan: null,
  nextPlan: null,
  totalRemaining: 5,
  cycleCredits: 5,
  addOnCredits: 0,
  trialCredits: 0,
  otherCredits: 0,
};

const creativePlan: SubscriptionPlanDto = {
  id: 1,
  name: 'Gói Sáng tạo',
  planType: 'Creative',
  priceVnd: 100000,
  aiCredits: 30,
  audience: 'Parent',
  isPurchasable: true,
};

async function renderQuota(quota: MyQuotaDto) {
  host.myQuota.mockResolvedValue({ success: true, data: quota });
  host.begin();
  PaymentSection({});
  host.commit();
  await Promise.resolve();
  await Promise.resolve();
  host.begin();
  const tree = PaymentSection({});
  host.commit();
  return tree;
}

describe('PaymentSection library limit', () => {
  beforeEach(() => {
    host.plans.mockResolvedValue({ success: true, data: [creativePlan] });
    host.myTransactions.mockResolvedValue({ success: true, data: { items: [] } });
  });

  afterEach(() => {
    host.reset();
    vi.clearAllMocks();
  });

  it('shows used/limit in cycle with reset date', async () => {
    const text = allText(await renderQuota({ ...baseQuota, benefits, newLibraryStoriesUsed: 5 }));

    expect(text).toContain('Truyện thư viện mới: 5/24 trong chu kỳ · làm mới ngày 16/12/2026');
  });

  it('shows weekly wording for free tier', async () => {
    const text = allText(await renderQuota({
      ...baseQuota,
      benefits: { ...benefits, weeklyNewLibraryStories: 3, newLibraryStoriesPeriod: 'Week' },
      newLibraryStoriesUsed: 0,
    }));

    expect(text).toContain('Truyện thư viện mới: 0/3 trong tuần');
  });

  it('shows unlimited when limit is null', async () => {
    const text = allText(await renderQuota({
      ...baseQuota,
      benefits: { ...benefits, weeklyNewLibraryStories: null },
      newLibraryStoriesUsed: 5,
    }));

    expect(text).toContain('Truyện thư viện mới: không giới hạn');
    expect(text).not.toContain('Đã hết lượt mở truyện mới.');
  });

  it('shows exhausted hint when used >= limit', async () => {
    const text = allText(await renderQuota({
      ...baseQuota,
      plan: {
        planType: 'Reading',
        planName: 'Gói Đọc',
        startAt: benefits.newLibraryStoriesPeriodStart,
        endAt: benefits.newLibraryStoriesResetsAt,
      },
      benefits,
      newLibraryStoriesUsed: 24,
    }));

    expect(text).toContain('Đã hết lượt mở truyện mới. Bạn vẫn đọc lại được truyện đã mở.');
    expect(text).toContain('Bạn có thể chọn Nâng cấp ở Gói Sáng tạo bên dưới.');
  });

  it('hides library line when benefits are missing', async () => {
    const legacyResponses = [
      baseQuota,
      { ...baseQuota, newLibraryStoriesUsed: 5 },
      { ...baseQuota, benefits },
    ];

    for (const quota of legacyResponses) {
      host.reset();
      const text = allText(await renderQuota(quota));

      expect(text).toContain('Miễn phí');
      expect(text).not.toContain('Truyện thư viện mới');
    }
  });
});
