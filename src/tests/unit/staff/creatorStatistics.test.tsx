import { isValidElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MonthPeriod, Period } from '@/app/lib/monthPeriods';
import type {
  CreatorReadingStatisticsDto,
  CreatorRevenueStatisticsDto,
} from '@/app/types/backendContracts';

// Hook host to run useState and useEffect synchronously in Node environment
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];

  const reading = vi.fn();
  const revenue = vi.fn();
  const showToast = vi.fn();

  return {
    reading,
    revenue,
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

vi.mock('@/app/services/creatorStatisticsService', () => ({
  creatorStatisticsService: {
    reading: host.reading,
    revenue: host.revenue,
  },
}));

vi.mock('@/app/components/stats/useMonthlyStats', () => ({
  useMonthlyStats: () => [1, 2, 3, 4, 5, 6],
}));

vi.mock('@/app/lib/motion', () => ({
  useGrowBars: () => ({ current: null }),
  usePop: () => ({ current: null }),
}));

vi.mock('@/app/lib/toast', () => ({
  showToast: host.showToast,
}));

import { CreatorReadingTab } from '@/app/features/staff/CreatorReadingTab';
import { CreatorIncomeTab } from '@/app/features/staff/CreatorIncomeTab';

type Node = { type: unknown; props: Record<string, unknown> };

function nodes(tree: ReactNode, predicate: (node: Node) => boolean): Node[] {
  if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, predicate));
  if (!isValidElement<Record<string, unknown>>(tree)) return [];
  if (typeof tree.type === 'function') {
    try {
      const rendered = (tree.type as (props: unknown) => ReactNode)(tree.props);
      return [
        ...(predicate(tree as Node) ? [tree as Node] : []),
        ...nodes(rendered, predicate),
      ];
    } catch {
      // ignore
    }
  }
  return [
    ...(predicate(tree as Node) ? [tree as Node] : []),
    ...nodes(tree.props.children as ReactNode, predicate),
  ];
}

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

const readingFixture: CreatorReadingStatisticsDto = {
  views: 120,
  favorites: 7,
  completedReadings: 30,
  validReads: 25,
  completionRate: 0.25,
  periodStart: '2026-11-01',
  periodEnd: '2026-11-30',
  stories: [
    {
      storyId: 1,
      title: 'Ếch con',
      views: 80,
      favorites: 4,
      completedReadings: 20,
      validReads: 18,
      completionRate: 0.25,
    },
    {
      storyId: 2,
      title: 'Đầm sen',
      views: 40,
      favorites: 3,
      completedReadings: 10,
      validReads: 7,
      completionRate: 0.25,
    },
  ],
};

const revenueFixture: CreatorRevenueStatisticsDto = {
  creatorFundVnd: 1000000,
  readingFundRate: 0.3,
  creativeFundRate: 0.1,
  minimumReadSeconds: 30,
  totalValidReadsAllCreators: 100,
  myValidReads: 25,
  estimatedEarningsVnd: 250000,
  periodStart: '2026-11-01',
  periodEnd: '2026-11-30',
  stories: [
    {
      storyId: 1,
      title: 'Ếch con',
      validReads: 18,
      estimatedEarningsVnd: 180000,
    },
    {
      storyId: 2,
      title: 'Đầm sen',
      validReads: 7,
      estimatedEarningsVnd: 70000,
    },
  ],
};

function renderReading(period = testPeriod, months = testMonths) {
  host.begin();
  const tree = CreatorReadingTab({ period, months });
  host.commit();
  return tree;
}

function renderIncome(period = testPeriod, months = testMonths) {
  host.begin();
  const tree = CreatorIncomeTab({ period, months });
  host.commit();
  return tree;
}

describe('Creator Statistics Tabs', () => {
  beforeEach(() => {
    host.reading.mockResolvedValue({
      success: true,
      message: '',
      data: readingFixture,
    });
    host.revenue.mockResolvedValue({
      success: true,
      message: '',
      data: revenueFixture,
    });
  });

  afterEach(() => {
    host.reset();
    vi.clearAllMocks();
  });

  describe('CreatorReadingTab', () => {
    it('(a) displays views, "120", "Ếch con" and places "Ếch con" before "Đầm sen" sorted by validReads descending', async () => {
      renderReading();
      await tick();
      const tree = renderReading();

      const text = allText(tree);
      expect(text).toContain('Lượt xem');
      expect(text).toContain('120');
      expect(text).toContain('Ếch con');
      expect(text).toContain('Đầm sen');

      // 'Ếch con' (18 validReads) stands BEFORE 'Đầm sen' (7 validReads) in markup
      const echIndex = text.indexOf('Ếch con');
      const damSenIndex = text.indexOf('Đầm sen');
      expect(echIndex).toBeGreaterThanOrEqual(0);
      expect(damSenIndex).toBeGreaterThanOrEqual(0);
      expect(echIndex).toBeLessThan(damSenIndex);

      // Verify row ordering in table cells directly
      const storyCells = nodes(
        tree,
        (node) => node.type === 'td' && node.props['data-label'] === 'Truyện',
      );
      expect(storyCells.length).toBe(2);
      expect(allText(storyCells[0])).toContain('Ếch con');
      expect(allText(storyCells[1])).toContain('Đầm sen');
    });

    it('(c) calls showToast and hides "120" when reading service returns success: false', async () => {
      host.reading.mockResolvedValue({
        success: false,
        message: 'Lỗi tải lượt đọc',
        data: null,
      });

      renderReading();
      await tick();
      const tree = renderReading();

      expect(host.showToast).toHaveBeenCalledWith('Lỗi tải lượt đọc', 'err');
      const text = allText(tree);
      expect(text).not.toContain('120');
    });
  });

  describe('CreatorIncomeTab', () => {
    it('(b) displays "250.000 đ", "25", and "Quỹ Creator"', async () => {
      renderIncome();
      await tick();
      const tree = renderIncome();

      const text = allText(tree);
      expect(text).toContain('250.000 đ');
      expect(text).toContain('25');
      expect(text).toContain('Quỹ Creator');
    });

    it('calls showToast and hides "250.000 đ" when revenue service returns success: false', async () => {
      host.revenue.mockResolvedValue({
        success: false,
        message: 'Lỗi tải thu nhập',
        data: null,
      });

      renderIncome();
      await tick();
      const tree = renderIncome();

      expect(host.showToast).toHaveBeenCalledWith('Lỗi tải thu nhập', 'err');
      const text = allText(tree);
      expect(text).not.toContain('250.000 đ');
    });
  });
});
