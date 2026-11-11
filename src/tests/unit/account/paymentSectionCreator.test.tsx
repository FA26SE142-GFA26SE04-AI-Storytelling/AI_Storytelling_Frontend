import { isValidElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CreatorQuotaDto,
  MyQuotaDto,
  PagedResult,
  PaymentTransactionDto,
  SubscriptionPlanDto,
} from '@/app/types/backendContracts';

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

import PaymentSection from '@/app/features/account/PaymentSection';

type Node = { type: unknown; props: Record<string, unknown> };

function nodes(tree: ReactNode, predicate: (node: Node) => boolean): Node[] {
  if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, predicate));
  if (!isValidElement<Record<string, unknown>>(tree)) return [];
  return [
    ...(predicate(tree as Node) ? [tree as Node] : []),
    ...nodes(tree.props.children as ReactNode, predicate),
  ];
}

function allText(tree: ReactNode): string {
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  if (!tree || typeof tree !== 'object') return '';
  if (Array.isArray(tree)) return tree.map(allText).join('');
  if (isValidElement<Record<string, unknown>>(tree)) {
    return allText(tree.props.children as ReactNode);
  }
  return '';
}

function click(node: Node) {
  (node.props.onClick as () => void)();
}

const tick = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

function render(audience?: 'parent' | 'creator') {
  host.begin();
  const tree = PaymentSection(audience !== undefined ? { audience } : {});
  host.commit();
  return tree;
}

const creatorQuotaData: CreatorQuotaDto = {
  aiCredits: {
    monthlyAllowance: 5,
    monthlyRemaining: 3,
    purchasedRemaining: 4,
    otherRemaining: 0,
    totalRemaining: 7,
  },
  submitCredits: {
    monthlyAllowance: 2,
    monthlyRemaining: 2,
    purchasedRemaining: 0,
    otherRemaining: 0,
    totalRemaining: 2,
  },
  monthlyAllowanceResetsAt: '2026-12-01T00:00:00Z',
};

const creatorPlan: SubscriptionPlanDto = {
  id: 9,
  name: 'Gói Creator',
  planType: 'CreatorPack',
  priceVnd: 50000,
  aiCredits: 10,
  submitCredits: 5,
  audience: 'Creator',
  isPurchasable: true,
  lockedReason: null,
};

const parentPlan: SubscriptionPlanDto = {
  id: 1,
  name: 'Gói Sáng tạo',
  planType: 'Creative',
  priceVnd: 100000,
  aiCredits: 30,
  submitCredits: 0,
  audience: 'Parent',
  isPurchasable: true,
  lockedReason: null,
};

const transactionsData: PagedResult<PaymentTransactionDto> = {
  items: [],
  pageIndex: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

const myQuotaData: MyQuotaDto = {
  plan: null,
  nextPlan: null,
  totalRemaining: 5,
  cycleCredits: 5,
  addOnCredits: 0,
  trialCredits: 0,
  otherCredits: 0,
};

const createdTx: PaymentTransactionDto = {
  id: 99,
  planName: 'Gói Creator',
  amount: 50000,
  transactionCode: 'TX99',
  status: 'Pending',
  createdAt: '2026-11-11T00:00:00Z',
  expiresAt: '2026-11-11T00:15:00Z',
  qrCodeUrl: '',
};

describe('PaymentSection for Creator', () => {
  beforeEach(() => {
    host.creatorQuota.mockResolvedValue({ success: true, message: '', data: creatorQuotaData });
    host.myQuota.mockResolvedValue({ success: true, message: '', data: myQuotaData });
    host.plans.mockResolvedValue({ success: true, message: '', data: [creatorPlan, parentPlan] });
    host.myTransactions.mockResolvedValue({ success: true, message: '', data: transactionsData });
    host.create.mockResolvedValue({ success: true, message: '', data: createdTx });
    host.confirmDialog.mockResolvedValue(true);
  });

  afterEach(() => {
    host.reset();
    vi.clearAllMocks();
  });

  it('loads creator quota, displays quota info, and filters out parent plans when audience is creator', async () => {
    render('creator');
    await tick();
    const tree = render('creator');

    expect(host.creatorQuota).toHaveBeenCalled();
    expect(host.myQuota).not.toHaveBeenCalled();

    const text = allText(tree);
    expect(text).toContain('Gói và lượt');
    expect(text).toContain('Lượt tạo truyện AI');
    expect(text).toContain('Lượt gửi duyệt');
    expect(text).toContain('Tháng này: 3/5');
    expect(text).toContain('Đã mua: 4');
    expect(text).toContain('Hạn mức tháng làm mới ngày');
    expect(text).not.toContain('Gói Sáng tạo');
  });

  it('renders CreatorPack card benefits and triggers confirmDialog with exact format on purchase', async () => {
    render('creator');
    await tick();
    const tree = render('creator');

    const card = nodes(
      tree,
      (node) => node.type === 'article' && String(node.props.className).includes('plan-card'),
    )[0];
    expect(card).toBeDefined();

    const cardText = allText(card);
    expect(cardText).toContain('+10 lượt tạo truyện AI');
    expect(cardText).toContain('+5 lượt gửi duyệt');

    const buyButton = nodes(
      card,
      (node) => node.type === 'button' && allText(node).includes('Mua gói'),
    )[0];
    expect(buyButton).toBeDefined();

    click(buyButton);
    await tick();

    expect(host.confirmDialog).toHaveBeenCalledWith(
      'Mua Gói Creator (50.000 đ): thêm 10 lượt tạo truyện AI và 5 lượt gửi duyệt, không hết hạn.',
    );
  });

  it('calls myQuota and does not call creatorQuota when audience is default (parent)', async () => {
    render();
    await tick();

    expect(host.myQuota).toHaveBeenCalled();
    expect(host.creatorQuota).not.toHaveBeenCalled();
  });
});
