import { beforeEach, describe, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => {
  const slots: { value?: unknown; deps?: readonly unknown[] }[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  return {
    begin() { cursor = 0; effects = []; },
    commit() { effects.forEach(effect => effect()); },
    reset() { slots.length = 0; effects = []; },
    useState<T>(initial: T) {
      const index = cursor++; slots[index] ??= { value: initial };
      return [slots[index].value as T, (next: T | ((old: T) => T)) => {
        slots[index].value = typeof next === 'function' ? (next as (old: T) => T)(slots[index].value as T) : next;
      }] as const;
    },
    useRef<T>(initial: T) { const index = cursor++; slots[index] ??= { value: { current: initial } }; return slots[index].value as { current: T }; },
    useEffect(effect: () => unknown, deps: readonly unknown[]) {
      const index = cursor++; const previous = slots[index];
      if (!previous?.deps || deps.some((v, i) => !Object.is(v, previous.deps![i]))) {
        slots[index] = { deps }; effects.push(() => { effect(); });
      }
    },
    mine: vi.fn(), create: vi.fn(), get: vi.fn(), versions: vi.fn(), workflow: vi.fn(),
  };
});
vi.mock('react', () => ({ useState: host.useState, useRef: host.useRef, useEffect: host.useEffect, useCallback: (fn: unknown) => fn }));
vi.mock('@/app/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 7 } }) }));
vi.mock('@/app/services/parentAuthoringService', () => ({ parentAuthoringService: {
  mine: host.mine, create: host.create, get: host.get, versions: host.versions, workflow: host.workflow,
} }));
import { useParentAuthoring } from '@/app/features/authoring/useParentAuthoring';

const ok = <T,>(data: T) => ({ success: true, status: 200, data, message: '' });
const draft = { story: { storyId: 45, selectedVersionId: null }, childProfileId: null };
function RenderParentHook() { host.begin(); const hook = useParentAuthoring(null); host.commit(); return hook; }
async function ready() { RenderParentHook(); await Promise.resolve(); return RenderParentHook(); }

beforeEach(() => {
  host.reset(); vi.clearAllMocks();
  host.mine.mockResolvedValue(ok({ items: [], totalCount: 0 }));
  host.get.mockResolvedValue(ok(draft)); host.versions.mockResolvedValue(ok([])); host.workflow.mockResolvedValue(ok([]));
});

describe('parent initial draft recovery', () => {
  it('can retry a rejected create without reloading the page', async () => {
    host.create.mockResolvedValueOnce({ success: false, status: 429, data: null, message: 'Thử lại sau' }).mockResolvedValueOnce(ok(draft));
    let hook = await ready(); await hook.create('Truyện của gia đình'); hook = RenderParentHook();
    expect(hook.uncertain).toBe(false); expect(hook.draft).toBeNull();
    await hook.retryCreate(); hook = RenderParentHook();
    expect(hook.draft?.story.storyId).toBe(45); expect(host.create).toHaveBeenCalledTimes(2);
  });

  it('reopens the created draft after GET fails instead of creating another', async () => {
    host.create.mockResolvedValue(ok(draft));
    host.get.mockResolvedValueOnce({ success: false, status: 503, data: null, message: 'Chưa tải được' }).mockResolvedValueOnce(ok(draft));
    let hook = await ready(); await hook.create('Truyện của gia đình'); hook = RenderParentHook();
    expect(hook.draft).toBeNull(); await hook.retryCreate(); hook = RenderParentHook();
    expect(hook.draft?.story.storyId).toBe(45); expect(host.create).toHaveBeenCalledTimes(1);
    expect(host.get).toHaveBeenNthCalledWith(2, 45);
  });

  it('replays an uncertain create with the same operation ID', async () => {
    host.create.mockResolvedValueOnce({ success: false, status: 0, data: null, message: 'Mất kết nối' }).mockResolvedValueOnce(ok(draft));
    let hook = await ready(); await hook.create('Truyện của gia đình'); hook = RenderParentHook();
    expect(hook.uncertain).toBe(true); await hook.retryCreate();
    expect(host.create).toHaveBeenCalledTimes(1);
    await hook.retry(); hook = RenderParentHook();
    expect(host.create.mock.calls[0][0].operationId).toBe(host.create.mock.calls[1][0].operationId);
    expect(hook.draft?.story.storyId).toBe(45);
  });
});
