import { afterEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { childAccessService } from '@/app/services/childAccessService';
import { KID_ACTIVITY_PING_MS, KID_IDLE_TIMEOUT_MS } from '@/app/lib/kidActivity';

afterEach(() => vi.restoreAllMocks());

describe('Luồng 3 — phiên của bé', () => {
  it.each([
    [200, 'ok'],
    [401, 'expired'],
    [403, 'expired'],
    [500, 'offline'],
    [502, 'offline'],
  ] as const)('HTTP %s khi kiểm tra phiên → %s', async (status, expected) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(status === 200 ? '{"success":true}' : null, { status }));
    expect(await childAccessService.checkSession('child-token')).toBe(expected);
  });

  it('mất mạng thì coi là offline, không kết thúc phiên', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await childAccessService.checkSession('child-token')).toBe('offline');
  });

  it('gọi /ChildAccessCredential/me bằng token của bé, không qua làm mới token người lớn', async () => {
    const refresh = vi.spyOn(authService, 'authenticatedFetch');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 401 }));
    await childAccessService.checkSession('child-token');
    expect(String(spy.mock.calls[0][0])).toMatch(/\/ChildAccessCredential\/me$/);
    expect((spy.mock.calls[0][1]?.headers as Record<string, string>).Authorization).toBe('Bearer child-token');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('khớp luật backend: hết hạn sau 20 phút, ghi hoạt động tối đa 1 lần / phút', () => {
    expect(KID_IDLE_TIMEOUT_MS).toBe(20 * 60_000);
    expect(KID_ACTIVITY_PING_MS).toBe(60_000);
  });
});
