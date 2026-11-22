import { describe, expect, it } from 'vitest';
import { changedCodes, groupPermissions, lockedCodes, staffEditableCodes } from '@/app/features/staff/permissionMatrix';
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

describe('changedCodes', () => {
  it('reports added and removed codes sorted', () => {
    expect(changedCodes(['b', 'a'], ['c', 'b'])).toEqual({ added: ['c'], removed: ['a'] });
  });

  it('reports nothing for the same set in another order', () => {
    expect(changedCodes(['a', 'b'], ['b', 'a'])).toEqual({ added: [], removed: [] });
  });
});

describe('lockedCodes', () => {
  it('locks staff permissions the role cannot be granted yet', () => {
    const catalog = [p('review.gray_zone', 'Kiểm duyệt'), p('creator.payout.manage', 'Quản trị'), p('community.view', 'Dùng chung', false)];
    expect(lockedCodes(catalog, ['review.gray_zone'])).toEqual(new Set(['creator.payout.manage']));
  });
});

describe('staffEditableCodes', () => {
  it('keeps only staff-grantable codes the role holds', () => {
    const catalog = [p('review.gray_zone', 'Kiểm duyệt'), p('community.view', 'Dùng chung', false)];
    expect(staffEditableCodes(['community.view', 'review.gray_zone'], catalog)).toEqual(['review.gray_zone']);
  });
});
