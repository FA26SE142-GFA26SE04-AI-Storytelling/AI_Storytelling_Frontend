import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Lỗi giao diện trang Phân quyền (22/11/2026): danh sách chọn role bị thẻ bên dưới che mất, và các thẻ bảng
// bị co lại trong .st-body (flex column) nên mỗi bảng có thanh cuộn riêng, dòng cuối bị cắt.
const read = (file: string) => readFileSync(path.resolve(process.cwd(), file), 'utf8');
const editor = read('app/features/staff/RolePermissionEditor.tsx');
const matrix = read('app/features/staff/PermissionMatrixView.tsx');
const css = read('app/styles/features/staff/staff.css');

describe('AdminPermissions layout', () => {
  it('renders the role dropdown in a portal so later cards cannot cover it', () => {
    expect(editor).toMatch(/<Select[^>]*\bportal\b/);
  });

  it('keeps permission cards at full height instead of shrinking them into inner scroll boxes', () => {
    expect(editor).not.toContain('st-scroll');
    expect(editor).toContain('perm-card');
    expect(matrix).toContain('perm-card');
    expect(css).toMatch(/\.st-body > \.perm-card\s*\{[^}]*flex:\s*none/);
  });

  it('lets only the wide matrix scroll sideways, never vertically', () => {
    expect(css).toMatch(/\.st-scroll\s*\{\s*overflow-x:\s*auto;\s*\}/);
  });
});
