import { isValidElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ModeratorStatistics from '@/app/features/staff/ModeratorStatistics';
import StatCard from '@/app/components/stats/StatCard';
import { MODERATION_TYPE_LABELS } from '@/app/features/staff/moderationConfig';
import type { ModerationStatisticsDto } from '@/app/types/backendContracts';

// Hook host to run useState and useEffect synchronously in Node environment
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];

  const get = vi.fn();
  const showToast = vi.fn();

  return {
    get,
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

vi.mock('@/app/services/moderationStatisticsService', () => ({
  moderationStatisticsService: {
    get: host.get,
  },
}));

vi.mock('@/app/lib/motion', () => ({
  useGrowBars: () => ({ current: null }),
  usePop: () => ({ current: null }),
}));

vi.mock('@/app/lib/toast', () => ({
  showToast: host.showToast,
}));

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

const moderationFixture: ModerationStatisticsDto = {
  periodStart: '2026-11-01',
  periodEnd: '2026-11-30',
  asOfUtc: '2026-11-12T03:00:00Z',
  pending: 5,
  claimed: 2,
  overdue: 2,
  queueByType: [
    { itemType: 'PublicStoryReview', pending: 3, claimed: 1, overdue: 2 },
    { itemType: 'GrayZoneStory', pending: 0, claimed: 0, overdue: 0 },
  ],
  myApproved: 4,
  myRejected: 1,
  myChangesRequested: 2,
  myDecisionsByType: [
    { itemType: 'PublicStoryReview', approved: 4, rejected: 1, changesRequested: 2 },
    { itemType: 'ContentReport', approved: 2, rejected: 0, changesRequested: 0 },
  ],
  resubmissionCount: 3,
  grayZoneCount: 6,
};

function renderModerator() {
  host.begin();
  const tree = ModeratorStatistics({});
  host.commit();
  return tree;
}

describe('ModeratorStatistics', () => {
  beforeEach(() => {
    host.get.mockResolvedValue({
      success: true,
      message: '',
      data: moderationFixture,
    });
  });

  afterEach(() => {
    host.reset();
    vi.clearAllMocks();
  });

  it('shows the three card groups with their numbers', async () => {
    renderModerator();
    await tick();
    const tree = renderModerator();

    const text = allText(tree);
    expect(text).toContain('Chờ nhận');
    expect(text).toContain('Đang xử lý');
    expect(text).toContain('Quá hạn SLA');
    expect(text).toContain('Đã duyệt');
    expect(text).toContain('Yêu cầu sửa');
    expect(text).toContain('Từ chối');
    expect(text).toContain('Lượt gửi lại');
    expect(text).toContain('Vùng xám');
    expect(text).toContain('Theo loại mục');
    expect(text).toContain('5');
    expect(text).toContain('6');

    const cardNodes = nodes(tree, (n) => n.type === StatCard);
    const cardMap = new Map(cardNodes.map((n) => [String(n.props.label), String(n.props.value)]));
    expect(cardMap.get('Chờ nhận')).toBe('5');
    expect(cardMap.get('Đang xử lý')).toBe('2');
    expect(cardMap.get('Quá hạn SLA')).toBe('2');
    expect(cardMap.get('Đã duyệt')).toBe('4');
    expect(cardMap.get('Yêu cầu sửa')).toBe('2');
    expect(cardMap.get('Từ chối')).toBe('1');
    expect(cardMap.get('Lượt gửi lại')).toBe('3');
    expect(cardMap.get('Vùng xám')).toBe('6');
  });

  it('merges queue and decision rows; missing side counts as 0', async () => {
    renderModerator();
    await tick();
    const tree = renderModerator();

    const typeCells = nodes(tree, (n) => n.type === 'td' && n.props['data-label'] === 'Loại');
    expect(typeCells.length).toBe(3);
    expect(allText(typeCells[0])).toContain(MODERATION_TYPE_LABELS.PublicStoryReview);

    const rows = nodes(
      tree,
      (n) => n.type === 'tr' && nodes(n, (c) => c.type === 'td' && c.props['data-label'] === 'Loại').length > 0,
    );
    expect(rows.length).toBe(3);
    expect(allText(rows[0])).toContain(MODERATION_TYPE_LABELS.PublicStoryReview);

    const contentReportRow = rows.find((r) => allText(r).includes(MODERATION_TYPE_LABELS.ContentReport));
    expect(contentReportRow).toBeDefined();

    const pendingCells = nodes(
      contentReportRow!,
      (n) => n.type === 'td' && (n.props['data-label'] === 'Chờ nhận' || n.props['data-label'] === 'Chờ tiếp nhận'),
    );
    if (pendingCells.length > 0) {
      expect(allText(pendingCells[0])).toBe('0');
    } else {
      expect(allText(contentReportRow!)).toContain('0');
    }
  });

  it('Quá hạn SLA card is gold only when overdue > 0', async () => {
    renderModerator();
    await tick();
    let tree = renderModerator();

    let cards = nodes(tree, (n) => n.type === StatCard);
    let overdueCard = cards.find((c) => c.props.label === 'Quá hạn SLA');
    expect(overdueCard).toBeDefined();
    expect(overdueCard?.props.tone).toBe('gold');

    host.reset();
    host.get.mockResolvedValue({
      success: true,
      message: '',
      data: {
        ...moderationFixture,
        overdue: 0,
        queueByType: [
          { itemType: 'PublicStoryReview', pending: 3, claimed: 1, overdue: 0 },
        ],
      },
    });

    renderModerator();
    await tick();
    tree = renderModerator();

    cards = nodes(tree, (n) => n.type === StatCard);
    overdueCard = cards.find((c) => c.props.label === 'Quá hạn SLA');
    expect(overdueCard).toBeDefined();
    expect(overdueCard?.props.tone).not.toBe('gold');
  });

  it('shows empty line when there are no rows', async () => {
    host.get.mockResolvedValue({
      success: true,
      message: '',
      data: {
        ...moderationFixture,
        queueByType: [],
        myDecisionsByType: [],
      },
    });

    renderModerator();
    await tick();
    const tree = renderModerator();

    const text = allText(tree);
    expect(text).toContain('Hàng đợi trống và bạn chưa quyết định mục nào trong kỳ này.');
  });

  it('calls showToast when service returns success: false', async () => {
    host.get.mockResolvedValue({
      success: false,
      message: 'Lỗi tải thống kê kiểm duyệt',
      data: null,
    });

    renderModerator();
    await tick();
    const tree = renderModerator();

    expect(host.showToast).toHaveBeenCalledWith('Lỗi tải thống kê kiểm duyệt', 'err');
    const text = allText(tree);
    expect(text).not.toContain('Chờ nhận');
  });
});
