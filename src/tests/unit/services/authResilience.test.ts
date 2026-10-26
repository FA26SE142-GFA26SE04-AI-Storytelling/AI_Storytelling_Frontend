import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Bộ nhớ giả cho localStorage / sessionStorage trong môi trường Node. */
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    clear: () => m.clear(),
  };
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const authData = (accessToken: string) => ({ accessToken, refreshToken: 'parent-refresh-2', user: { id: 1, email: 'p@x.vn' } });

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', memoryStorage());
  vi.stubGlobal('sessionStorage', memoryStorage());
  localStorage.setItem('taletale_access_token', 'parent-token');
  localStorage.setItem('taletale_refresh_token', 'parent-refresh');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('token của bé không bị đổi sang token phụ huynh', () => {
  it('request bằng token bé gặp 401 thì trả lỗi, không làm mới và không gửi lại bằng token phụ huynh', async () => {
    const { apiRequest } = await import('@/app/services/apiClient');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 401 }));
    const r = await apiRequest('/MyRoadmap', 'lỗi', { token: 'child-token' });
    expect(r.success).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(new Headers(spy.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer child-token');
    expect(localStorage.getItem('taletale_access_token')).toBe('parent-token');
  });

  it('phiên bé đã hết (token rỗng) thì không gửi request', async () => {
    const { apiRequest } = await import('@/app/services/apiClient');
    const spy = vi.spyOn(globalThis, 'fetch');
    const r = await apiRequest('/MyRoadmap', 'lỗi', { token: undefined });
    expect(r.success).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('request của phụ huynh gặp 401 vẫn tự làm mới token và gửi lại', async () => {
    const { apiRequest } = await import('@/app/services/apiClient');
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(json({ success: true, data: authData('parent-token-2') }))
      .mockResolvedValueOnce(json({ success: true, data: { ok: 1 } }));
    const r = await apiRequest('/ChildProfile', 'lỗi');
    expect(r.success).toBe(true);
    expect(new Headers(spy.mock.calls[2][1]?.headers).get('Authorization')).toBe('Bearer parent-token-2');
  });
});

describe('chỉ đăng xuất khi backend từ chối phiên', () => {
  it('làm mới token bị lỗi 5xx thì giữ phiên', async () => {
    const { authService } = await import('@/app/services/authService');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 503 }));
    const r = await authService.refreshToken();
    expect(r.success).toBe(false);
    expect(localStorage.getItem('taletale_refresh_token')).toBe('parent-refresh');
  });

  it('làm mới token mất mạng thì giữ phiên', async () => {
    const { authService } = await import('@/app/services/authService');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await authService.refreshToken();
    expect(localStorage.getItem('taletale_refresh_token')).toBe('parent-refresh');
  });

  it.each([400, 401, 403])('refresh token bị từ chối (HTTP %s) thì đăng xuất', async (status) => {
    const { authService } = await import('@/app/services/authService');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ success: false, message: 'hết hạn' }, status));
    await authService.refreshToken();
    expect(localStorage.getItem('taletale_refresh_token')).toBeNull();
  });

  it('đã làm mới token mà backend vẫn trả 401 thì đăng xuất', async () => {
    const { authService } = await import('@/app/services/authService');
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(json({ success: true, data: authData('parent-token-2') }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    await authService.getProfile();
    expect(localStorage.getItem('taletale_access_token')).toBeNull();
  });
});

describe('chỉ chuyển sang dữ liệu cục bộ khi backend chưa có API', () => {
  beforeEach(() => {
    sessionStorage.setItem('taletale-child-session', JSON.stringify({ childProfileId: 3, accessToken: 'child-token', expiresAt: Date.now() + 60_000, via: 'profile_switcher' }));
  });

  it('lỗi mạng ở lần gọi đầu: báo lỗi, vẫn gọi backend ở lần sau', async () => {
    const { readingService } = await import('@/app/services/readingService');
    const spy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const first = await readingService.saveProgress(3, 9, { lastPageRead: 2 } as never);
    expect(first.success).toBe(false);
    expect(readingService.isLocal()).toBe(false);
    spy.mockResolvedValueOnce(json({ success: true, data: null }));
    await readingService.saveProgress(3, 9, { lastPageRead: 3 } as never);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it.each([500, 502])('máy chủ lỗi tạm thời (HTTP %s) không chuyển sang cục bộ', async (status) => {
    const { readingService } = await import('@/app/services/readingService');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status }));
    await readingService.saveProgress(3, 9, { lastPageRead: 2 } as never);
    expect(readingService.isLocal()).toBe(false);
  });

  it('backend trả 404 (chưa có API) thì dùng bộ máy cục bộ', async () => {
    const { readingService } = await import('@/app/services/readingService');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));
    await readingService.saveProgress(3, 9, { lastPageRead: 2 } as never);
    expect(readingService.isLocal()).toBe(true);
  });
});
