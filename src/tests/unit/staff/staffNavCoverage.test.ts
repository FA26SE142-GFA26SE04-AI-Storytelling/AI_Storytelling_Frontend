import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Thanh điều hướng (NAV) liệt kê id trang tường minh, tách khỏi PAGES: trang thêm vào PAGES mà quên NAV
// thì vẫn mở được bằng URL nhưng không có mục menu (lỗi trang "Phân quyền" ngày 22/11/2026).
const source = readFileSync(path.resolve(process.cwd(), 'app/features/staff/StaffApp.tsx'), 'utf8');

function roleBlock(constName: string, role: string): string {
  const start = source.indexOf(`const ${constName}`);
  const roleStart = source.indexOf(`  ${role}: [`, start);
  const end = source.indexOf('\n  ],', roleStart);
  expect(start).toBeGreaterThan(-1);
  expect(roleStart).toBeGreaterThan(start);
  return source.slice(roleStart, end);
}

const pageIds = (role: string) => [...roleBlock('PAGES', role).matchAll(/id: "([^"]+)"/g)].map((m) => m[1]);
const navIds = (role: string) => [...roleBlock('NAV', role).matchAll(/"([a-z][a-z-]*)"/g)].map((m) => m[1]);

// Trang cố ý không có mục menu cho Administrator: danh mục nội dung đã giao cho Moderator.
const HIDDEN: Record<string, string[]> = { Administrator: ['catalog'], Moderator: [], ContentCreator: [] };

describe('staff navigation', () => {
  it.each(['Administrator', 'Moderator'])('%s menu reaches every page', (role) => {
    const nav = new Set(navIds(role));
    const missing = pageIds(role).filter((id) => !nav.has(id) && !HIDDEN[role].includes(id));
    expect(missing).toEqual([]);
  });

  it('Administrator menu shows Phân quyền', () => {
    expect(navIds('Administrator')).toContain('permissions');
  });
});
