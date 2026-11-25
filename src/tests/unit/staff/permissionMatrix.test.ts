import { describe, expect, it } from 'vitest';
import {
  changedCodes, conditionLegend, conditionsOf, differsFromDefault, historyChange, matrixCell,
  scopeLabel, sectionOf, sectionPermissions,
} from '@/app/features/staff/permissionMatrix';
import type { PermissionDto, RolePermissionsDto } from '@/app/types/accessControl';

const p = (code: string, group: string, isStaffGrantable = true): PermissionDto => ({ code, group, description: code, isStaffGrantable });

describe('scopeLabel', () => {
  it('names each scope and treats a missing or unknown scope as all records', () => {
    expect(scopeLabel('Assigned')).toBe('Mục đã nhận');
    expect(scopeLabel('Own')).toBe('Của mình');
    expect(scopeLabel('Any')).toBe('Tất cả');
    expect(scopeLabel(undefined)).toBe('Tất cả');
    expect(scopeLabel('Other')).toBe('Tất cả');
  });
});

describe('changedCodes', () => {
  it('reports added and removed codes sorted', () => {
    expect(changedCodes(['b', 'a'], ['c', 'b'])).toEqual({ added: ['c'], removed: ['a'] });
  });

  it('reports nothing for the same set in another order', () => {
    expect(changedCodes(['a', 'b'], ['b', 'a'])).toEqual({ added: [], removed: [] });
  });
});


const admin: RolePermissionsDto = {
  roleCode: 'Administrator',
  permissionCodes: ['review.gray_zone', 'audit.view'],
  assignableCodes: ['review.gray_zone', 'audit.view', 'template.roadmap.author'],
  defaultCodes: ['review.gray_zone', 'audit.view', 'template.roadmap.author'],
  conditionCodes: { 'review.gray_zone': ['NotOwnContent', 'AdminFallback'] },
  conditions: { 'review.gray_zone': ['Không xử lý nội dung do chính mình tạo', 'Chỉ nhận mục đã chuyển lên'] },
};

describe('matrixCell', () => {
  it('marks held, re-enable-able and not-applicable permissions', () => {
    expect(matrixCell(admin, 'review.gray_zone').state).toBe('on');
    expect(matrixCell(admin, 'template.roadmap.author').state).toBe('off');
    expect(matrixCell(admin, 'creator.studio')).toEqual({ state: 'na', changed: false, conditions: [] });
    expect(matrixCell(undefined, 'audit.view').state).toBe('na');
  });

  it('flags a permission that differs from the role default', () => {
    expect(matrixCell(admin, 'template.roadmap.author').changed).toBe(true);
    expect(matrixCell(admin, 'audit.view').changed).toBe(false);
    expect(differsFromDefault({ ...admin, defaultCodes: undefined })).toEqual(new Set());
  });

  it('pairs condition codes with their short label and full text', () => {
    expect(conditionsOf(admin, 'review.gray_zone')).toEqual([
      { code: 'NotOwnContent', label: 'Không tự duyệt', text: 'Không xử lý nội dung do chính mình tạo' },
      { code: 'AdminFallback', label: 'Dự phòng', text: 'Chỉ nhận mục đã chuyển lên' },
    ]);
    expect(matrixCell(admin, 'review.gray_zone').conditions.map((c) => c.label)).toEqual(['Không tự duyệt', 'Dự phòng']);
  });
});

describe('sections', () => {
  it('splits moderation into queue work and configuration, and renames role-like groups', () => {
    expect(sectionOf({ ...p('review.gray_zone', 'Kiểm duyệt'), scope: 'Assigned' })).toBe('Kiểm duyệt – xử lý hàng đợi');
    expect(sectionOf(p('rubric.manage', 'Kiểm duyệt'))).toBe('Kiểm duyệt – cấu hình và xem');
    expect(sectionOf(p('child.profile.manage', 'Phụ huynh', false))).toBe('Việc của phụ huynh');
    expect(sectionPermissions([p('audit.view', 'Quản trị'), p('community.view', 'Dùng chung', false)]).map((s) => s.section))
      .toEqual(['Dùng chung', 'Quản trị']);
  });
});

describe('conditionLegend', () => {
  it('lists every condition once across roles', () => {
    const mod: RolePermissionsDto = { roleCode: 'Moderator', permissionCodes: [], conditionCodes: { 'review.gray_zone': ['NotOwnContent'] },
      conditions: { 'review.gray_zone': ['Không xử lý nội dung do chính mình tạo'] } };
    expect(conditionLegend([admin, mod, undefined]).map((c) => c.code)).toEqual(['NotOwnContent', 'AdminFallback']);
  });
});

describe('historyChange', () => {
  it('reads before/after permission lists from audit JSON and tolerates bad payloads', () => {
    expect(historyChange('["a","b"]', '["b","c"]')).toEqual({ added: ['c'], removed: ['a'] });
    expect(historyChange(null, 'not json')).toEqual({ added: [], removed: [] });
  });
});
