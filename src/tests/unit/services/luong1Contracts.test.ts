import { afterEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { accountService } from '@/app/services/accountService';
import { childAccessService } from '@/app/services/childAccessService';
import { childProfileService } from '@/app/services/childProfileService';
import { supervisionService } from '@/app/services/supervisionService';

const okBody = (data: unknown = null) => new Response(JSON.stringify({ success: true, message: 'OK', data }));
const bodyOf = (init?: RequestInit) => JSON.parse(String(init?.body));

afterEach(() => vi.restoreAllMocks());

describe('Luồng 1 — hợp đồng API đã đăng nhập', () => {
  it.each([
    ['claim lời mời', () => supervisionService.claimInvitation('Ab+c/9='), '/Supervision/invitations/claim', { invitationCode: 'Ab+c/9=' }],
    ['xác thực OTP lời mời', () => supervisionService.verifyInvitationOtp('Ab+c/9=', '123456'), '/Supervision/invitations/verify-otp', { invitationCode: 'Ab+c/9=', otp: '123456' }],
    ['nhận lời mời', () => supervisionService.acceptInvitation('Ab+c/9='), '/Supervision/invitations/accept', { invitationCode: 'Ab+c/9=' }],
    ['từ chối lời mời', () => supervisionService.rejectInvitation('Ab+c/9='), '/Supervision/invitations/reject', { invitationCode: 'Ab+c/9=' }],
    ['tiếp tục hồ sơ', () => childProfileService.resumeChildProfile(4, true), '/ChildProfile/4/resume', { acceptCurrentConsent: true }],
    ['đổi email', () => accountService.requestEmailChange('pw', ' moi@x.vn '), '/Auth/change-email', { currentPassword: 'pw', newEmail: 'moi@x.vn' }],
    ['xác nhận đổi email', () => accountService.confirmEmailChange(' 654321 '), '/Auth/change-email/confirm', { otp: '654321' }],
    ['sửa thông tin', () => accountService.updateProfile({ fullName: ' Thu Hà ', avatarUrl: '' }), '/Auth/me', { fullName: 'Thu Hà', avatarUrl: null }],
    ['xoá tài khoản', () => accountService.deleteAccount('pw', true), '/Auth/me', { currentPassword: 'pw', deleteDraftProfiles: true }],
  ] as const)('%s gửi đúng tên trường backend', async (_name, call, route, payload) => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    await call();
    expect(String(spy.mock.calls[0][0])).toContain(route);
    expect(bodyOf(spy.mock.calls[0][1])).toEqual(payload);
  });

  it('giữ nguyên mã mời phân biệt chữ hoa / thường', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    await supervisionService.claimInvitation('aBc');
    expect(bodyOf(spy.mock.calls[0][1]).invitationCode).toBe('aBc');
  });

  it('lưu avatar qua hồ sơ bé, không qua ChildAccessCredential', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    await childProfileService.updateChildProfile(3, { nickname: ' Na ', ageBand: 'Age_9_10', avatarId: 'cat' });
    expect(String(spy.mock.calls[0][0])).toContain('/ChildProfile/3');
    expect(spy.mock.calls[0][1]?.method).toBe('PUT');
    expect(bodyOf(spy.mock.calls[0][1])).toEqual({ nickname: 'Na', ageBand: 'Age_9_10', language: 'vi', avatarId: 'cat' });
    expect('setCredential' in childAccessService).toBe(false);
  });

  it('gửi chế độ đọc trong hồ sơ học tập', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    await childProfileService.setLearningProfile(3, { readingLevel: 2, readingMode: 'ReadFirst', comprehensionGoal: ' ', topics: [] });
    expect(bodyOf(spy.mock.calls[0][1])).toEqual({ readingLevel: 2, readingMode: 'ReadFirst', comprehensionGoal: null, topics: [] });
  });

  it('đổi mật khẩu gửi kèm refresh token để giữ phiên đang dùng', async () => {
    vi.spyOn(authService, 'getStoredRefreshToken').mockReturnValue('rt-1');
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
    await accountService.changePassword({ currentPassword: 'a1', newPassword: 'b2b2b2b2', confirmPassword: 'b2b2b2b2' });
    expect(bodyOf(spy.mock.calls[0][1]).currentRefreshToken).toBe('rt-1');
  });

  it('báo lỗi khi backend trả 4xx', async () => {
    vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(new Response(JSON.stringify({ success: false, message: 'Mã OTP không chính xác.', data: null }), { status: 400 }));
    const r = await supervisionService.verifyInvitationOtp('x', '000000');
    expect(r.success).toBe(false);
    expect(r.message).toBe('Mã OTP không chính xác.');
  });
});

describe('Luồng 1 — hợp đồng API không cần đăng nhập', () => {
  it.each([
    ['xác thực email', () => accountService.verifyEmail('a@x.vn', '123456'), '/Auth/verify-email', { email: 'a@x.vn', otp: '123456' }],
    ['bé đăng nhập bằng QR', () => childAccessService.loginWithEasyLogin('s3cr3t'), '/ChildAccessCredential/easylogin/login', { secret: 's3cr3t' }],
  ] as const)('%s gửi đúng tên trường backend', async (_name, call, route, payload) => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okBody());
    await call();
    expect(String(spy.mock.calls[0][0])).toContain(route);
    expect(bodyOf(spy.mock.calls[0][1])).toEqual(payload);
  });
});
