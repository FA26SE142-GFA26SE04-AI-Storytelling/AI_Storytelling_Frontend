import { describe, expect, it } from 'vitest';
import { changedCodes, groupPermissions, lockedCodes, scopeLabel } from '@/app/features/staff/permissionMatrix';
import type { PermissionDto } from '@/app/types/accessControl';

const p = (code: string, group: string, isStaffGrantable = true): PermissionDto => ({ code, group, description: code, isStaffGrantable });

describe('groupPermissions', () => {
  it('keeps the fixed group order and sorts codes inside a group', () => {
    const list = [p('wishcard.manage', 'Kiểm duyệt'), p('audit.view', 'Quản trị'), p('community.view', 'Dùng chung', false), p('category.manage', 'Kiểm duyệt')];
    const groups = groupPermissions(list);
    expect(groups.map((g) => g.group)).toEqual(['Dùng chung', 'Kiểm duyệt', 'Quản trị']);
    expect(groups[1].items.map((i) => i.code)).toEqual(['category.manage', 'wishcard.manage']);
  });

  it('puts unknown groups last', () => {
    expect(groupPermissions([p('x.y', 'Khác'), p('audit.view', 'Quản trị')]).map((g) => g.group)).toEqual(['Quản trị', 'Khác']);
  });
});

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

describe('lockedCodes', () => {
  it('locks every permission the role cannot be granted yet, in any group', () => {
    const catalog = [p('review.gray_zone', 'Kiểm duyệt'), p('creator.payout.manage', 'Quản trị'), p('community.view', 'Dùng chung', false), p('creator.studio', 'Creator', false)];
    expect(lockedCodes(catalog, ['review.gray_zone', 'community.view'])).toEqual(new Set(['creator.payout.manage', 'creator.studio']));
  });
});
