import { isValidElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Execute component state/effects in Node; deferred API responses control their completion order.
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  return {
    published: vi.fn(), publishedRoadmap: vi.fn(), archived: vi.fn(), roadmap: vi.fn(), rubrics: vi.fn(), rubric: vi.fn(),
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

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useState: host.useState, useRef: host.useRef, useEffect: host.useEffect,
}));
vi.mock('@/app/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 5, role: 'Moderator' } }) }));
vi.mock('@/app/lib/confirm', () => ({ confirmDialog: vi.fn(async () => true) }));
vi.mock('@/app/services/moderationService', () => ({
  moderationService: { published: host.published, publishedRoadmap: host.publishedRoadmap },
}));
vi.mock('@/app/services/roadmapTemplateService', () => ({
  roadmapTemplateService: { list: host.archived, get: host.roadmap },
}));
vi.mock('@/app/services/rubricService', () => ({ rubricService: { list: host.rubrics, get: host.rubric } }));

import RoadmapPublishedView from '@/app/features/staff/RoadmapPublishedView';
import RubricWorkspace from '@/app/features/staff/RubricWorkspace';

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(tree: ReactNode, predicate: (node: Node) => boolean): Node[] {
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate));
  if (!isValidElement<Record<string, unknown>>(tree)) return [];
  return [
    ...(predicate(tree) ? [tree] : []),
    ...nodes(tree.props.children as ReactNode, predicate),
  ];
}

function render(mode: 'published' | 'archived') {
  host.begin();
  const tree = RoadmapPublishedView({ mode });
  host.commit();
  return tree;
}
function renderRubrics() {
  host.begin();
  const tree = RubricWorkspace();
  host.commit();
  return tree;
}
function click(node: Node) { (node.props.onClick as () => void)(); }
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
const tick = async () => { await Promise.resolve(); await Promise.resolve(); };
const page = {
  items: [1, 2].map(id => ({ id, title: `Roadmap ${id}`, name: `Roadmap ${id}`, ageBand: '6-8', storyCount: 0 })),
  hasNextPage: true, totalCount: 40, pageSize: 20,
};
function rows(tree: ReactNode) {
  return nodes(tree, node => node.type === 'button' && String(node.props.className).includes('rt-item'));
}
function detailTitles(tree: ReactNode) {
  return nodes(tree, node => node.type === 'h3').map(node => node.props.children);
}
function detail(mode: 'published' | 'archived', id: number) {
  return mode === 'published'
    ? { roadmapId: id, name: `Roadmap ${id}`, stories: [] }
    : { id, name: `Roadmap ${id}`, stories: [], retiredStoryIds: [] };
}

afterEach(() => { host.reset(); vi.clearAllMocks(); });

describe('Moderator catalog request lifecycle', () => {
  it.each(['published', 'archived'] as const)('keeps the latest selection when %s details finish out of order', async mode => {
    host.published.mockResolvedValue({ success: true, data: page });
    host.archived.mockResolvedValue({ success: true, data: page });
    const older = deferred<unknown>();
    const latest = deferred<unknown>();
    const get = mode === 'published' ? host.publishedRoadmap : host.roadmap;
    get.mockReturnValueOnce(older.promise).mockReturnValueOnce(latest.promise);
    render(mode); await tick();
    let tree = render(mode);
    click(rows(tree)[0]); tree = render(mode);
    click(rows(tree)[1]); render(mode);
    latest.resolve({ success: true, data: detail(mode, 2) }); await tick();
    expect(detailTitles(render(mode))).toContain('Roadmap 2');
    older.resolve({ success: true, data: detail(mode, 1) }); await tick();
    expect(detailTitles(render(mode))).toEqual(['Roadmap 2']);
  });

  it('ignores an old 404 instead of clearing the newer published detail', async () => {
    host.published.mockResolvedValue({ success: true, data: page });
    const older = deferred<unknown>();
    const latest = deferred<unknown>();
    host.publishedRoadmap.mockReturnValueOnce(older.promise).mockReturnValueOnce(latest.promise);
    render('published'); await tick();
    let tree = render('published');
    click(rows(tree)[0]); tree = render('published');
    click(rows(tree)[1]); render('published');
    latest.resolve({ success: true, data: detail('published', 2) }); await tick();
    render('published');
    older.resolve({ success: false, status: 404, message: 'Unavailable' }); await tick();
    expect(detailTitles(render('published'))).toEqual(['Roadmap 2']);
    expect(host.published).toHaveBeenCalledTimes(1);
  });

  it.each(['published', 'archived'] as const)('keeps independent pagination when leaving %s', async mode => {
    host.published.mockResolvedValue({ success: true, data: page });
    host.archived.mockResolvedValue({ success: true, data: page });
    render(mode); await tick();
    const tree = render(mode);
    const pager = nodes(tree, node => node.props.label === 'Trang sau');
    click(pager[0]); render(mode); await tick(); render(mode);
    const other = mode === 'published' ? 'archived' : 'published';
    render(other); await tick(); render(other);
    if (other === 'archived') expect(host.archived.mock.calls.at(-1)?.[1]).toBe(1);
    else expect(host.published.mock.calls.at(-1)?.[0].pageIndex).toBe(1);
    render(mode); await tick(); render(mode);
    if (mode === 'archived') expect(host.archived.mock.calls.at(-1)?.[1]).toBe(2);
    else expect(host.published.mock.calls.at(-1)?.[0].pageIndex).toBe(2);
  });

  it('keeps the rubric list response after starting a new draft', async () => {
    const request = deferred<unknown>();
    host.rubrics.mockReturnValueOnce(request.promise);
    const tree = renderRubrics();
    click(nodes(tree, node => node.props.label === 'Tạo bản nháp')[0]);
    await tick(); renderRubrics();
    request.resolve({ success: true, data: { items: [{ id: 12, name: 'Existing rubric', status: 'Draft' }], totalCount: 1, pageSize: 20 } });
    await tick();
    const result = renderRubrics();
    expect(nodes(result, node => node.type === 'button' && String(node.props.className).startsWith('st-item'))).toHaveLength(1);
    // Loading the list must not replace the unsaved new editor.
    expect(detailTitles(result)).toContain('Bản nháp bộ tiêu chí mới');
  });

  it('still rejects a rubric list response from the previous filter', async () => {
    const older = deferred<unknown>();
    const latest = deferred<unknown>();
    host.rubrics.mockReturnValueOnce(older.promise).mockReturnValueOnce(latest.promise);
    const tree = renderRubrics();
    click(nodes(tree, node => node.type === 'button' && node.props.children === 'Đang áp dụng')[0]);
    await tick(); renderRubrics();
    latest.resolve({ success: true, data: { items: [{ id: 2, name: 'Active rubric', status: 'Active' }], totalCount: 1, pageSize: 20 } });
    await tick(); renderRubrics();
    older.resolve({ success: true, data: { items: [{ id: 1, name: 'Stale rubric', status: 'Draft' }], totalCount: 1, pageSize: 20 } });
    await tick();
    const result = renderRubrics();
    const labels = nodes(result, node => node.type === 'b').map(node => node.props.children);
    expect(labels).toContain('Active rubric');
    expect(labels).not.toContain('Stale rubric');
  });
});
