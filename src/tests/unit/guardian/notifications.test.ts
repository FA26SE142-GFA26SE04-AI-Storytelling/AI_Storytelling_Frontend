import { afterEach, describe, expect, it, vi } from 'vitest';
import { isUnread, notificationKey, notificationTarget, notificationText } from '@/app/lib/notifications';
import { authService } from '@/app/services/authService';
import { guardianService } from '@/app/services/guardianService';
import type { AppNotification } from '@/app/types/progress';

const n = (type: string, extra: Partial<AppNotification> = {}): AppNotification => ({ id: 1, type, payload: null, status: 'Unread', readAt: null, createdAt: '2026-10-18T00:00:00Z', ...extra });

afterEach(() => vi.restoreAllMocks());

describe('thông báo trong app', () => {
  it('đổi type PascalCase của backend sang khoá snake_case', () => {
    expect(notificationKey('SupervisionInvite')).toBe('supervision_invite');
    expect(notificationKey('TotpReset')).toBe('totp_reset');
    expect(notificationKey('hold_mode_alert')).toBe('hold_mode_alert');
  });

  it('hiện câu tiếng Việt cho thông báo backend thay vì tên mã', () => {
    expect(notificationText(n('OwnershipTransferRequest'))).toBe('Có đề nghị chuyển quyền quản lý chính');
    expect(notificationText(n('DataRequestCompleted'))).toBe('Yêu cầu xuất / xoá dữ liệu đã xử lý xong');
    expect(notificationText(n('SomethingNew'))).toBe('Bạn có thông báo mới');
  });

  it('nhận cả Unread / Read của backend lẫn unread / read của bộ máy cục bộ', () => {
    expect(isUnread(n('X', { status: 'Unread' }))).toBe(true);
    expect(isUnread(n('X', { status: 'Read', readAt: '2026-10-18T01:00:00Z' }))).toBe(false);
    expect(isUnread(n('X', { status: 'read' }))).toBe(false);
  });

  it('mở màn liên quan theo loại hoặc nhóm', () => {
    expect(notificationTarget(n('hold_mode_alert'))).toBe('roadmap');
    expect(notificationTarget(n('SupervisionInvite', { group: 'supervisors' }))).toBe('children');
    expect(notificationTarget(n('StoryModerationResult', { group: 'stories' }))).toBe('library');
    expect(notificationTarget(n('AccountSecurityChanged', { group: 'account' }))).toBe('account');
    expect(notificationTarget(n('ModerationSlaWarning', { group: 'moderation' }))).toBeNull();
  });

  it('xoá thông báo backend gọi DELETE /Notification/{id}', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(new Response(JSON.stringify({ success: true, message: '', data: null })));
    await guardianService.deleteNotification(n('SupervisionInvite', { id: 42 }));
    expect(String(spy.mock.calls[0][0])).toMatch(/\/Notification\/42$/);
    expect(spy.mock.calls[0][1]?.method).toBe('DELETE');
  });

  it('số chưa đọc lấy từ /Notification/unread-count', async () => {
    const spy = vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(new Response(JSON.stringify({ success: true, message: '', data: 3 })));
    expect(await guardianService.unreadNotificationCount()).toBe(3);
    expect(String(spy.mock.calls[0][0])).toMatch(/\/Notification\/unread-count$/);
  });
});
