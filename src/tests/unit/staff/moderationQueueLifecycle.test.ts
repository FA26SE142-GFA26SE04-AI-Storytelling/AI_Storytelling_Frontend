import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ApiResponse } from '@/app/types/auth';
import type { QueueItemDetail } from '@/app/types/staff';

// Node-only hook host: run the actual hook's state/effect lifecycle without a DOM dependency.
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  const sameDeps = (a: readonly unknown[] | undefined, b: readonly unknown[]) =>
    !!a && a.length === b.length && b.every((value, index) => Object.is(value, a[index]));
  return {
    queue: vi.fn(),
    claim: vi.fn(),
    begin() { cursor = 0; effects = []; },
    commit() { effects.forEach(effect => effect()); },
    reset() {
      slots.forEach(slot => slot.cleanup?.());
      slots.length = 0;
      effects = [];
    },
    useState<T>(initial: T) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value as T, (next: T | ((current: T) => T)) => {
        slots[index].value = typeof next === 'function'
          ? (next as (current: T) => T)(slots[index].value as T)
          : next;
      }] as const;
    },
    useRef<T>(initial: T) {
      const index = cursor++;
      slots[index] ??= { value: { current: initial } };
      return slots[index].value as { current: T };
    },
    useCallback<T>(callback: T, deps: readonly unknown[]) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) slots[index] = { value: callback, deps };
      return slots[index].value as T;
    },
    useEffect(effect: () => void | (() => void), deps: readonly unknown[]) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) effects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { deps, cleanup: effect() || undefined };
      });
    },
  };
});

vi.mock('react', () => ({
  useState: host.useState,
  useRef: host.useRef,
  useCallback: host.useCallback,
  useEffect: host.useEffect,
}));
vi.mock('@/app/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 5 } }) }));
vi.mock('@/app/services/staffService', () => ({ staffService: { queue: host.queue, claim: host.claim } }));

import { buildModerationQueueQuery, useModerationSectionQueue } from '@/app/features/staff/useModerationSectionQueue';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

function renderHook() {
  host.begin();
  // eslint-disable-next-line react-hooks/rules-of-hooks -- the isolated host runs this hook's lifecycle in Node
  const value = useModerationSectionQueue({ itemType: 'PublicStoryReview' });
  host.commit();
  return value;
}

function start() {
  host.queue.mockResolvedValue({
    success: true,
    data: { items: [], totalCount: 0, totalPages: 0, hasNextPage: false },
  });
  renderHook();
  return renderHook();
}

const claimSuccess = { success: true, message: 'OK' } as ApiResponse<QueueItemDetail>;

afterEach(() => {
  host.reset();
  vi.clearAllMocks();
});

describe('moderation queue lifecycle', () => {
  it.each(['status', 'priority', 'page', 'reload'] as const)(
    'releases claim state after changing %s while the old claim is pending',
    async change => {
      let q = start();
      const request = deferred<ApiResponse<QueueItemDetail>>();
      host.claim.mockReturnValueOnce(request.promise);
      const pending = q.claimItem(101);
      q = renderHook();
      expect(q.claiming).toBe(true);
      if (change === 'status') q.setStatus('Approved');
      if (change === 'priority') q.setPriority('High');
      if (change === 'page') q.setPageIndex(2);
      if (change === 'reload') q.reload();
      renderHook();
      request.resolve(claimSuccess);
      expect(await pending).toBe(false);
      q = renderHook();
      expect(q.claiming).toBe(false);
      expect(q.actionNote).toBeNull();
      expect(q.status).toBe(change === 'status' ? 'Approved' : 'Pending');
    },
  );

  it('ignores an old completion without unlocking a newer claim', async () => {
    let q = start();
    const old = deferred<ApiResponse<QueueItemDetail>>();
    const newer = deferred<ApiResponse<QueueItemDetail>>();
    host.claim.mockReturnValueOnce(old.promise).mockReturnValueOnce(newer.promise);
    const oldPending = q.claimItem(101);
    q = renderHook();
    q.setPriority('High');
    renderHook();
    q = renderHook();
    const newerPending = q.claimItem(102);
    q = renderHook();
    expect(host.claim).toHaveBeenCalledTimes(2);
    expect(q.claiming).toBe(true);
    old.resolve(claimSuccess);
    expect(await oldPending).toBe(false);
    q = renderHook();
    expect(q.claiming).toBe(true);
    expect(q.status).toBe('Pending');
    newer.resolve(claimSuccess);
    expect(await newerPending).toBe(true);
    q = renderHook();
    expect(q.claiming).toBe(false);
    expect(q.status).toBe('Claimed');
  });

  it('blocks duplicate claims before the next render', async () => {
    const q = start();
    const request = deferred<ApiResponse<QueueItemDetail>>();
    host.claim.mockReturnValue(request.promise);
    const first = q.claimItem(101);
    const duplicate = q.claimItem(101);
    expect(host.claim).toHaveBeenCalledTimes(1);
    request.resolve(claimSuccess);
    expect(await duplicate).toBe(false);
    expect(await first).toBe(true);
  });

  it('clears the overdue filter when leaving working sections and does not restore it implicitly', () => {
    let q = start();
    q.setOnlyOverdue(true);
    renderHook();
    q = renderHook();
    expect(host.queue.mock.calls.at(-1)?.[0]).toMatchObject({ status: 'Pending', onlyOverdue: true });
    q.setStatus('Claimed');
    renderHook();
    q = renderHook();
    expect(q.onlyOverdue).toBe(true);
    q.setStatus('Approved');
    renderHook();
    q = renderHook();
    expect(q.onlyOverdue).toBe(false);
    expect(host.queue.mock.calls.at(-1)?.[0]).not.toHaveProperty('onlyOverdue');
    q.setStatus('Pending');
    renderHook();
    q = renderHook();
    expect(q.onlyOverdue).toBe(false);
    expect(host.queue.mock.calls.at(-1)?.[0]).not.toHaveProperty('onlyOverdue');
  });

  it.each(['Approved', 'Rejected', 'ChangesRequested', 'Escalated', 'Closed'] as const)(
    'never sends a hidden overdue filter for %s', status => {
      expect(buildModerationQueueQuery({
        itemType: 'PublicStoryReview', status, priority: '', onlyOverdue: true, pageIndex: 1, pageSize: 10,
      })).not.toHaveProperty('onlyOverdue');
    },
  );
});
