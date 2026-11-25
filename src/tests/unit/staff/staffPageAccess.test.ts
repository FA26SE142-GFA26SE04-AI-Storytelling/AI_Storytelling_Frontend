import { visibleWorkspaces } from '@/app/components/shell/nav';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { canOpenPage, PAGE_REQUIREMENTS, visibleNav } from '@/app/features/staff/staffPageAccess';

const source = readFileSync(path.resolve(process.cwd(), 'app/features/staff/StaffApp.tsx'), 'utf8');
const pageIds = (role: string) => {
  const start = source.indexOf(`  ${role}: [`, source.indexOf('const PAGES'));
  return [...source.slice(start, source.indexOf('\n  ],', start)).matchAll(/id: "([^"]+)"/g)].map((m) => m[1]);
};

describe('canOpenPage', () => {
  it('hides the moderator library when moderation.published.view is revoked, not community.view', () => {
    expect(canOpenPage('Moderator', 'published', new Set(['moderation.published.view']))).toBe(true);
    expect(canOpenPage('Moderator', 'published', new Set(['community.view']))).toBe(false);
  });

  it('needs the queue permission as well as the review permission', () => {
    expect(canOpenPage('Moderator', 'gray-zone', new Set(['review.gray_zone']))).toBe(false);
    expect(canOpenPage('Moderator', 'gray-zone', new Set(['review.gray_zone', 'moderation.queue.process']))).toBe(true);
  });

  it('opens a page with tabs when any of its permissions is held', () => {
    expect(canOpenPage('Administrator', 'creators', new Set(['creator.payout.manage']))).toBe(true);
    expect(canOpenPage('Administrator', 'creators', new Set(['audit.view']))).toBe(false);
  });

  it('shows everything while permissions are unknown and pages without a requirement always', () => {
    expect(canOpenPage('Moderator', 'published', null)).toBe(true);
    expect(canOpenPage('Moderator', 'account', new Set())).toBe(true);
    expect(canOpenPage('Administrator', 'overview', new Set())).toBe(true);
  });
});

describe('visibleNav', () => {
  it('drops hidden items and groups left empty', () => {
    const nav = ['queue', { label: 'A', items: ['x', 'y'] }, { label: 'B', items: ['z'] }];
    expect(visibleNav(nav, (id) => id === 'x')).toEqual([{ label: 'A', items: ['x'] }]);
  });
});

describe('coverage', () => {
  it.each(['Administrator', 'Moderator', 'ContentCreator'] as const)('%s: every work page declares its permission', (role) => {
    expect(pageIds(role).filter((id) => id !== 'overview' && !PAGE_REQUIREMENTS[role][id])).toEqual([]);
    expect(Object.keys(PAGE_REQUIREMENTS[role]).filter((id) => !pageIds(role).includes(id))).toEqual([]);
  });
});

describe('trang phụ huynh theo quyền', () => {
  const ids = (granted: string[]) => visibleWorkspaces((c) => granted.includes(c)).map((w) => w.id);

  it('ẩn trang cần quyền, giữ thư viện, báo cáo và tài khoản', () => {
    expect(ids([])).toEqual(['library', 'events', 'report', 'account', 'account-payment', 'account-activity']);
  });

  it('mỗi quyền chỉ mở đúng các trang của nó', () => {
    expect(ids(['parent.story.author'])).toEqual(expect.arrayContaining(['studio', 'authoring', 'created']));
    expect(ids(['parent.story.author'])).not.toContain('children');
    expect(ids(['child.profile.manage'])).toEqual(expect.arrayContaining(['roadmap', 'children']));
    expect(ids(['child.profile.manage'])).not.toContain('studio');
  });
});

it('retains event operations together with the new staff permission gates', () => {
  expect(canOpenPage('Moderator', 'events', new Set())).toBe(false);
  expect(canOpenPage('Moderator', 'events', new Set(['event.manage']))).toBe(true);
  expect(canOpenPage('Moderator', 'events', new Set(['event.operate']))).toBe(true);
  expect(canOpenPage('Administrator', 'events', new Set(['event.approve']))).toBe(true);
  expect(canOpenPage('ContentCreator', 'events', new Set())).toBe(true);
});
