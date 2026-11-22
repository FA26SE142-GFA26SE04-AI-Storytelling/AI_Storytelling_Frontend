import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Lỗi giao diện trang Phân quyền (22/11/2026): danh sách chọn role bị thẻ bên dưới che mất, và các thẻ bảng
// bị co lại trong .st-body (flex column) nên mỗi bảng có thanh cuộn riêng, dòng cuối bị cắt.
const page = readFileSync(path.resolve(process.cwd(), 'app/features/staff/AdminPermissions.tsx'), 'utf8');
const css = readFileSync(path.resolve(process.cwd(), 'app/styles/features/staff/staff.css'), 'utf8');

describe('AdminPermissions layout', () => {
  it('renders the role dropdown in a portal so later cards cannot cover it', () => {
    expect(page).toMatch(/<Select[^>]*\bportal\b/);
  });

  it('keeps permission cards at full height instead of shrinking them into inner scroll boxes', () => {
    expect(page).not.toContain('st-scroll');
    expect(page).toContain('perm-card');
    expect(css).toMatch(/\.st-body > \.perm-card\s*\{[^}]*flex:\s*none/);
  });
});
