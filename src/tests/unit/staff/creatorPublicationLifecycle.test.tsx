import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import type { CreatorPublicationStatus } from '@/app/types/backendContracts';
import type { ApiResponse } from '@/app/types/auth';

const host = vi.hoisted(() => {
  const slots: { value?: unknown; deps?: unknown[]; cleanup?: () => void }[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  return {
    status: vi.fn(), revision: vi.fn(),
    begin() { cursor = 0; effects = []; },
    commit() { effects.forEach(effect => effect()); },
    reset() { slots.forEach(s => s.cleanup?.()); slots.length = 0; },
    useState<T>(initial: T) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value as T, (next: T | ((old: T) => T)) => {
        slots[index].value = typeof next === 'function' ? (next as (old: T) => T)(slots[index].value as T) : next;
      }] as const;
    },
    useRef<T>(initial: T) { const index = cursor++; slots[index] ??= { value: { current: initial } }; return slots[index].value as { current: T }; },
    useEffect(effect: () => void | (() => void), deps: unknown[]) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous?.deps || deps.some((v, i) => !Object.is(v, previous.deps![i]))) effects.push(() => {
        previous?.cleanup?.(); slots[index] = { deps, cleanup: effect() || undefined };
      });
    },
  };
});
vi.mock('react', async importActual => ({ ...await importActual<typeof import('react')>(),
  useState: host.useState, useEffect: host.useEffect, useRef: host.useRef, useContext: () => null }));
vi.mock('@/app/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 7 } }) }));
vi.mock('@/app/lib/motion', () => ({ usePop: () => null }));
vi.mock('@/app/lib/confirm', () => ({ confirmDialog: async () => true }));
vi.mock('@/app/services/creatorPublicationService', () => ({ creatorPublicationService: { status: host.status, revision: host.revision } }));
vi.mock('@/app/services/creatorService', () => ({ creatorService: { get: async () => ({ ok: true, data: { coverImageUrl: null } }) } }));
vi.mock('@/app/services/staffService', () => ({ staffService: { categories: async () => ({ success: true, data: [] }) } }));
vi.mock('@/app/features/created/CoverPickerDialog', () => ({ default: () => null, CoverPickerPanel: () => null, prefetchCoverPictures: () => {} }));
vi.mock('@/app/features/staff/CreatorSafetyPanel', () => ({ default: () => null }));
import CreatorPublication from '@/app/features/staff/CreatorPublication';

function deferred<T>() { let resolve!: (v: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
function nodes(node: ReactNode): ReactElement<{ children?: ReactNode; onClick?: () => Promise<void> }>[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object' || !('props' in node)) return [];
  const el = node as ReactElement<{ children?: ReactNode; onClick?: () => Promise<void> }>;
  return [el, ...nodes(el.props.children)];
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join('');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return node && typeof node === 'object' && 'props' in node ? text((node as ReactElement<{ children?: ReactNode }>).props.children) : '';
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
const data = (over: Partial<CreatorPublicationStatus> = {}) => ({ storyId: 44, versionId: 101, reviewStatus: 'Approved',
  isPublished: false, openItemId: null, openItemType: null, openItemStatus: null, ...over } as CreatorPublicationStatus);
const ok = (value: CreatorPublicationStatus) => ({ success: true, data: value, message: '' } as ApiResponse<CreatorPublicationStatus>);
afterEach(() => { host.reset(); vi.clearAllMocks(); });

describe('Creator publication requests and revisions', () => {
  it('explains a removed approved version and creates a revision only after the user selects the action', async () => {
    host.status.mockResolvedValue(ok(data()));
    host.revision.mockResolvedValue({ success: true, message: 'Đã tạo' });
    const onPublicationChange = vi.fn(), onRevision = vi.fn(), onLockChange = vi.fn();
    const props = { storyId: 44, versionId: 101, storyStatus: 'Ready', onPublicationChange, onRevision, onLockChange };
    const render = () => { host.begin(); const tree = CreatorPublication(props); host.commit(); return tree; };
    render(); await flush();
    const tree = render();
    expect(text(tree)).toContain('Đã duyệt, hiện chưa công khai');
    expect(text(tree)).not.toContain('Gửi bản hiện tại cho Moderator');
    expect(host.revision).not.toHaveBeenCalled();
    const button = nodes(tree).find(el => el.type === 'button' && text(el).includes('Tạo bản chỉnh sửa để gửi lại'))!;
    await button.props.onClick!(); await flush();
    expect(host.revision).toHaveBeenCalledExactlyOnceWith(44, 101);
    expect(onRevision).toHaveBeenCalledOnce();
    expect(onPublicationChange).toHaveBeenLastCalledWith(null);
  });

  it('ignores a late response after changing story and exposes the new claim state', async () => {
    const old = deferred<ApiResponse<CreatorPublicationStatus>>();
    const next = deferred<ApiResponse<CreatorPublicationStatus>>();
    host.status.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
    const changed = vi.fn(), onRevision = vi.fn(), onLockChange = vi.fn();
    const render = (storyId: number, versionId: number) => { host.begin(); const tree = CreatorPublication({ storyId, versionId, storyStatus: 'Ready', onRevision, onLockChange, onPublicationChange: changed }); host.commit(); return tree; };
    render(44, 101); render(45, 102);
    const current = data({ storyId: 45, versionId: 102, reviewStatus: 'Pending', openItemId: 30, openItemType: 'PublicStoryReview', openItemStatus: 'Claimed' });
    next.resolve(ok(current)); await flush();
    old.resolve(ok(data())); await flush();
    expect(text(render(45, 102))).toContain('Moderator đang xử lý');
    expect(changed).toHaveBeenLastCalledWith(current);
    expect(text(render(45, 102))).not.toContain('Tạo bản chỉnh sửa để gửi lại');
  });

  it('does not publish a mismatched version response to its parent', async () => {
    host.status.mockResolvedValue(ok(data({ versionId: 99 })));
    const changed = vi.fn();
    host.begin(); CreatorPublication({ storyId: 44, versionId: 101, onRevision: vi.fn(), onPublicationChange: changed }); host.commit();
    await flush();
    expect(changed.mock.calls.every(([value]) => value === null)).toBe(true);
  });
});
