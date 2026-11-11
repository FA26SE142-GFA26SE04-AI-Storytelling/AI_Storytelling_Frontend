import { isValidElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Execute component state/effects in Node; deferred API responses control their completion order.
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  const creatorQuota = vi.fn();
  const notifyCreatorQuotaChanged = vi.fn();
  return {
    creatorQuota,
    notifyCreatorQuotaChanged,
    begin() { cursor = 0; effects = []; },
    commit() { effects.forEach(effect => effect()); },
    reset() { slots.forEach(slot => slot.cleanup?.()); slots.length = 0; effects = []; },
    useState<T>(initial: T) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value as T, (next: T | ((current: T) => T)) => {
        slots[index].value = typeof next === 'function'
          ? (next as (current: T) => T)(slots[index].value as T) : next;
      }] as const;
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
  };
});

if (typeof Event === 'undefined') {
  class MockEvent {
    constructor(public type: string) {}
  }
  vi.stubGlobal('Event', MockEvent);
}

if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
  const listeners: Record<string, ((event: Event) => void)[]> = {};
  const mockWindow = {
    addEventListener: (event: string, handler: (event: Event) => void) => {
      (listeners[event] ??= []).push(handler);
    },
    removeEventListener: (event: string, handler: (event: Event) => void) => {
      listeners[event] = (listeners[event] ?? []).filter(h => h !== handler);
    },
    dispatchEvent: (event: Event) => {
      const handlers = listeners[event.type] ?? [];
      handlers.forEach(h => h(event));
      return true;
    },
  };
  vi.stubGlobal('window', mockWindow);
}

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useState: host.useState,
  useRef: host.useRef,
  useEffect: host.useEffect,
}));

vi.mock('@/app/services/paymentService', () => ({
  paymentService: {
    creatorQuota: host.creatorQuota,
  },
  CREATOR_QUOTA_CHANGED: 'creator-quota-changed',
  notifyCreatorQuotaChanged: host.notifyCreatorQuotaChanged,
}));

vi.mock('@/app/lib/motion', () => ({
  usePop: () => ({ current: null }),
}));

import CreatorQuotaChip from '@/app/features/staff/CreatorQuotaChip';
import { CREATOR_QUOTA_CHANGED } from '@/app/services/paymentService';

type Node = { type: unknown; props: Record<string, unknown> };

function nodes(tree: ReactNode, predicate: (node: Node) => boolean): Node[] {
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate));
  if (!isValidElement<Record<string, unknown>>(tree)) return [];
  return [
    ...(predicate(tree) ? [tree] : []),
    ...nodes(tree.props.children as ReactNode, predicate),
  ];
}

function textOf(tree: ReactNode): string {
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  if (!tree) return '';
  if (Array.isArray(tree)) return tree.map(textOf).join('');
  if (isValidElement<Record<string, unknown>>(tree)) {
    return textOf(tree.props.children as ReactNode);
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

function render(props: { kind: 'ai' | 'submit'; onBuy?: () => void }) {
  host.begin();
  const tree = CreatorQuotaChip(props);
  host.commit();
  return tree;
}

afterEach(() => {
  host.reset();
  vi.clearAllMocks();
});

describe('CreatorQuotaChip', () => {
  it('Test A: totalRemaining = 0 (aiCredits) shows "Còn 0 lượt AI" and "Mua thêm" button, clicking calls onBuy', async () => {
    host.creatorQuota.mockResolvedValue({
      success: true,
      data: {
        aiCredits: { totalRemaining: 0 },
        submitCredits: { totalRemaining: 5 },
      },
    });
    const onBuy = vi.fn();
    render({ kind: 'ai', onBuy });
    await tick();
    const tree = render({ kind: 'ai', onBuy });

    expect(textOf(tree)).toContain('Còn 0 lượt AI');
    expect(textOf(tree)).toContain('Mua thêm');

    const buttons = nodes(tree, node => node.type === 'button');
    expect(buttons).toHaveLength(1);
    click(buttons[0]);
    expect(onBuy).toHaveBeenCalledTimes(1);
  });

  it('Test B: totalRemaining = 5 (aiCredits) shows "Còn 5 lượt AI" and does NOT show "Mua thêm"', async () => {
    host.creatorQuota.mockResolvedValue({
      success: true,
      data: {
        aiCredits: { totalRemaining: 5 },
        submitCredits: { totalRemaining: 5 },
      },
    });
    render({ kind: 'ai' });
    await tick();
    const tree = render({ kind: 'ai' });

    expect(textOf(tree)).toContain('Còn 5 lượt AI');
    expect(textOf(tree)).not.toContain('Mua thêm');

    const buttons = nodes(tree, node => node.type === 'button');
    expect(buttons).toHaveLength(0);
  });

  it('Test C: kind "submit" with submitCredits.totalRemaining = 0 shows "Còn 0 lượt gửi duyệt" and "Mua thêm"; without onBuy hides "Mua thêm"', async () => {
    host.creatorQuota.mockResolvedValue({
      success: true,
      data: {
        aiCredits: { totalRemaining: 5 },
        submitCredits: { totalRemaining: 0 },
      },
    });
    const onBuy = vi.fn();
    render({ kind: 'submit', onBuy });
    await tick();
    let tree = render({ kind: 'submit', onBuy });

    expect(textOf(tree)).toContain('Còn 0 lượt gửi duyệt');
    expect(textOf(tree)).toContain('Mua thêm');
    expect(nodes(tree, node => node.type === 'button')).toHaveLength(1);

    // Kind 'submit' with onBuy omitted
    host.reset();
    host.creatorQuota.mockResolvedValue({
      success: true,
      data: {
        aiCredits: { totalRemaining: 5 },
        submitCredits: { totalRemaining: 0 },
      },
    });
    render({ kind: 'submit' });
    await tick();
    tree = render({ kind: 'submit' });

    expect(textOf(tree)).toContain('Còn 0 lượt gửi duyệt');
    expect(textOf(tree)).not.toContain('Mua thêm');
    expect(nodes(tree, node => node.type === 'button')).toHaveLength(0);
  });

  it('Test D: component returns null when creatorQuota returns success: false or rejects', async () => {
    // success: false
    host.creatorQuota.mockResolvedValue({ success: false });
    render({ kind: 'ai' });
    await tick();
    let tree = render({ kind: 'ai' });
    expect(tree).toBeNull();
    expect(textOf(tree)).toBe('');

    // reject
    host.reset();
    host.creatorQuota.mockRejectedValue(new Error('Fetch failed'));
    render({ kind: 'ai' });
    await tick();
    tree = render({ kind: 'ai' });
    expect(tree).toBeNull();
    expect(textOf(tree)).toBe('');
  });

  it('Test E: creatorQuota is called a 2nd time after dispatching "creator-quota-changed" event on window', async () => {
    host.creatorQuota.mockResolvedValue({
      success: true,
      data: {
        aiCredits: { totalRemaining: 3 },
      },
    });
    render({ kind: 'ai' });
    expect(host.creatorQuota).toHaveBeenCalledTimes(1);
    await tick();

    window.dispatchEvent(new Event(CREATOR_QUOTA_CHANGED));
    expect(host.creatorQuota).toHaveBeenCalledTimes(2);
  });
});
