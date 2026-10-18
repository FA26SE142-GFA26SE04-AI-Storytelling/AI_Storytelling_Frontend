import { afterEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { staffService } from '@/app/services/staffService';
import { creatorService } from '@/app/services/creatorService';
import { accountService } from '@/app/services/accountService';
import type { ImportPreview } from '@/app/types/creator';

const okBody = (data: unknown = null, status = 200) => new Response(JSON.stringify({ success: true, message: 'OK', data }), { status });
const bodyOf = (init?: RequestInit) => JSON.parse(String(init?.body));

afterEach(() => vi.restoreAllMocks());

describe('Luồng 5 — quản trị và kiểm duyệt', () => {
  it.each([
    ['yêu cầu xoá dữ liệu kèm mật khẩu và biệt danh', () => staffService.createDataRequest(3, 'delete', { currentPassword: 'pw', confirmNickname: 'Na' }), '/DataRequest', { childProfileId: 3, requestType: 'delete', currentPassword: 'pw', confirmNickname: 'Na' }],
    ['từ chối Data Request', () => staffService.rejectDataRequest(9, 'Thiếu thông tin'), '/DataRequest/9/reject', { reason: 'Thiếu thông tin' }],
    ['hạn mức riêng một tài khoản', () => staffService.setQuota({ scope: 'Personal', childProfileId: null, userId: 13, quotaLimit: 5, periodStart: '2026-10-01', periodEnd: '2026-10-31' }), '/TokenQuota/config', { scope: 'Personal', childProfileId: null, userId: 13, quotaLimit: 5, periodStart: '2026-10-01', periodEnd: '2026-10-31' }],
    ['mời Moderator', () => staffService.inviteModerator('m@x.vn', 'Lê Mod', 'Giáo viên'), '/ModeratorAccount/invite', { email: 'm@x.vn', fullName: 'Lê Mod', expertise: 'Giáo viên', note: null }],
    ['vô hiệu hoá Moderator kèm lý do', () => staffService.deactivateModerator(5, 'Nghỉ việc'), '/ModeratorAccount/5/deactivate', { reason: 'Nghỉ việc' }],
    ['cấp Administrator chỉ gửi email', () => staffService.grantAdmin('a@x.vn'), '/AdminAccount/grant', { email: 'a@x.vn' }],
    ['giữ danh sách chặn theo tuổi khi sửa danh mục', () => staffService.updateCategory(2, 'Bạo lực', true, ['Age_6_8', 'Age_9_10']), '/ContentCategory/2', { displayName: 'Bạo lực', isActive: true, defaultBlockedAgeBands: ['Age_6_8', 'Age_9_10'] }],
  ] as const)('%s', async (_name, call, route, payload) => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    await call();
    expect(String(spy.mock.calls[0][0])).toMatch(new RegExp(`${route.replace(/\//g, '\\/')}$`));
    expect(bodyOf(spy.mock.calls[0][1])).toEqual(payload);
  });

  it('danh sách Moderator: chưa kích hoạt là lời mời, Suspended là đã vô hiệu hoá', async () => {
    const dto = (userId: number, isActivated: boolean, status: string) => ({ userId, email: `${userId}@x.vn`, fullName: 'M', expertise: null, status, isActivated, activatedAt: null, lastLoginAt: null, inviteExpiresAt: '2026-10-20T00:00:00Z' });
    vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody([dto(1, false, 'PasswordResetPending'), dto(2, true, 'Active'), dto(3, true, 'Suspended')]));
    const r = await staffService.staff();
    expect(r.data?.map((s) => s.status)).toEqual(['invited', 'active', 'deactivated']);
  });

  it('hàng đợi kiểm duyệt gửi bộ lọc dạng query', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody({ items: [], totalCount: 0 }));
    await staffService.queue({ status: 'Escalated', onlyOverdue: true });
    const url = new URL(String(spy.mock.calls[0][0]));
    expect(url.pathname).toMatch(/\/ModerationQueue$/);
    expect(Object.fromEntries(url.searchParams)).toEqual({ pageSize: '100', status: 'Escalated', onlyOverdue: 'true' });
  });

  it('kích hoạt tài khoản vận hành không cần đăng nhập', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okBody());
    await accountService.activateStaff({ email: 'm@x.vn', inviteToken: 'tok', newPassword: 'abc12345', confirmPassword: 'abc12345', commitmentAccepted: true });
    expect(String(spy.mock.calls[0][0])).toMatch(/\/Auth\/staff-activation$/);
    expect(bodyOf(spy.mock.calls[0][1])).toMatchObject({ inviteToken: 'tok', commitmentAccepted: true });
  });
});

describe('Luồng 5 — Content Creator soạn thủ công', () => {
  it('lưu phiên bản gửi revisionToken, baseVersionId và giữ nguyên xuống dòng của nội dung', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody({ story: {}, version: {} }, 201));
    const content = '  Lan gieo hạt.\n\nMỗi sáng Lan tưới cây.  ';
    const r = await creatorService.save(14, 'save-1', 'rev-1', 15, { title: 'Hạt giống', content, sourceDeclaration: 'Tự sáng tác', rightsDeclaration: 'Có quyền' });
    expect(r.ok).toBe(true);
    expect(String(spy.mock.calls[0][0])).toMatch(/\/creator\/stories\/14\/manual\/versions$/);
    expect(bodyOf(spy.mock.calls[0][1])).toEqual({ operationId: 'save-1', revisionToken: 'rev-1', baseVersionId: 15, title: 'Hạt giống', content, sourceDeclaration: 'Tự sáng tác', rightsDeclaration: 'Có quyền' });
  });

  it('xem trước tệp dùng đúng tên trường multipart File / RevisionToken / OperationId', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody({}, 201));
    await creatorService.previewFile(14, 'op-1', 'rev-1', new File(['a'], 'a.txt'));
    const form = spy.mock.calls[0][1]?.body as FormData;
    expect([...form.keys()]).toEqual(['File', 'RevisionToken', 'OperationId']);
  });

  it('xác nhận nhập gửi đúng content và previewToken của bản xem trước', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody({}, 201));
    const preview: ImportPreview = { previewToken: 'pt', storyId: 14, content: 'Nội dung đã chuẩn hoá', inputMethod: 'paste', fileName: null, sourceHash: 'h', expiresAt: '2026-10-19T00:00:00Z' };
    await creatorService.confirmImport(14, 'c-1', 'rev-1', null, preview, { title: 'T', sourceDeclaration: 'S', rightsDeclaration: 'R' });
    expect(bodyOf(spy.mock.calls[0][1])).toEqual({ operationId: 'c-1', revisionToken: 'rev-1', baseVersionId: null, previewToken: 'pt', content: 'Nội dung đã chuẩn hoá', title: 'T', sourceDeclaration: 'S', rightsDeclaration: 'R' });
  });

  it('phân biệt xung đột 409 và mất mạng (status 0 — thử lại cùng operationId)', async () => {
    vi.spyOn(authService, 'authenticatedFetch').mockResolvedValueOnce(new Response(JSON.stringify({ success: false, message: 'Bản nháp đã thay đổi.', data: null }), { status: 409 }));
    const conflict = await creatorService.save(14, 'op', 'old', 15, { title: '', content: '', sourceDeclaration: '', rightsDeclaration: '' });
    expect(conflict).toMatchObject({ ok: false, status: 409, message: 'Bản nháp đã thay đổi.' });
    vi.spyOn(authService, 'authenticatedFetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect((await creatorService.get(14)).status).toBe(0);
  });
});
