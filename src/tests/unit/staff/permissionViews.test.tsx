import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { PermissionDto, RoleDto, RolePermissionsDto } from '@/app/types/accessControl';

vi.mock('@/app/services/accessControlService', () => ({ accessControlService: {} }));
vi.mock('@/app/services/creatorAdminService', () => ({ creatorAdminService: { auditLogs: vi.fn(() => new Promise(() => {})) } }));

const { default: PermissionMatrixView } = await import('@/app/features/staff/PermissionMatrixView');
const { default: RolePermissionEditor } = await import('@/app/features/staff/RolePermissionEditor');

const catalog: PermissionDto[] = [
  { code: 'child.profile.manage', group: 'Phụ huynh', description: 'Quản lý hồ sơ trẻ', isStaffGrantable: false },
  { code: 'review.gray_zone', group: 'Kiểm duyệt', description: 'Duyệt nội dung vùng xám', isStaffGrantable: true, scope: 'Assigned' },
  { code: 'template.roadmap.author', group: 'Kiểm duyệt', description: 'Soạn lộ trình mẫu', isStaffGrantable: true },
];
const roles: RoleDto[] = [
  { id: 1, code: 'User', name: 'Phụ huynh', isStaff: false },
  { id: 5, code: 'Administrator', name: 'Quản trị viên', isStaff: true },
];
const byRole: Record<string, RolePermissionsDto> = {
  User: {
    roleCode: 'User', permissionCodes: ['child.profile.manage'], assignableCodes: ['child.profile.manage'], defaultCodes: ['child.profile.manage'],
    scopes: { 'child.profile.manage': 'Own' },
    conditionCodes: { 'child.profile.manage': ['OwnChildProfile'] }, conditions: { 'child.profile.manage': ['Chỉ hồ sơ của chính mình'] },
  },
  Administrator: {
    roleCode: 'Administrator', permissionCodes: ['review.gray_zone'],
    assignableCodes: ['review.gray_zone', 'template.roadmap.author'], defaultCodes: ['review.gray_zone', 'template.roadmap.author'],
    scopes: { 'review.gray_zone': 'Assigned', 'template.roadmap.author': 'Any' },
    conditionCodes: { 'review.gray_zone': ['AdminFallback'] }, conditions: { 'review.gray_zone': ['Chỉ nhận mục đã chuyển lên'] },
  },
};

describe('PermissionMatrixView', () => {
  const html = renderToStaticMarkup(<PermissionMatrixView catalog={catalog} roles={roles} byRole={byRole} onOpenRole={() => {}} />);

  it('shows every role as a column and Vietnamese descriptions before codes', () => {
    expect(html).toContain('Chỉnh quyền của Phụ huynh');
    expect(html).toContain('Chỉnh quyền của Quản trị viên');
    expect(html.indexOf('Duyệt nội dung vùng xám')).toBeLessThan(html.indexOf('review.gray_zone'));
  });

  it('groups moderation into queue work and configuration', () => {
    expect(html).toContain('Kiểm duyệt – xử lý hàng đợi');
    expect(html).toContain('Kiểm duyệt – cấu hình và xem');
    expect(html).toContain('Việc của phụ huynh');
  });

  it('marks on, off-but-restorable, not applicable and changed cells, with short condition labels', () => {
    expect(html).toContain('Quản trị viên: Đang tắt\nkhác mặc định');
    expect(html).toContain('Phụ huynh: Không áp dụng');
    expect(html).toContain('>Dự phòng<');
    expect(html).toContain('Chỉ nhận mục đã chuyển lên');
  });
});

describe('RolePermissionEditor', () => {
  const html = renderToStaticMarkup(
    <RolePermissionEditor catalog={catalog} roles={roles} roleCode="Administrator" data={byRole.Administrator}
      onRoleChange={() => {}} onSaved={() => {}} />,
  );

  it('lists only the permissions the role can toggle', () => {
    expect(html).toContain('Soạn lộ trình mẫu');
    expect(html).not.toContain('Quản lý hồ sơ trẻ');
    expect(html).toContain('1 quyền khác không dành cho role này');
  });

  it('flags the permission that differs from the default and offers a reset', () => {
    expect(html).toContain('Khác mặc định');
    expect(html).toContain('Về mặc định');
    expect(html).toContain('Mục đã nhận');
  });
});
