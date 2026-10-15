import type { ApiResponse } from '@/app/types/auth';
import { authService } from './authService';
import { API_BASE_URL } from './apiConfig';

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Gọi không kèm token người lớn (VD bé đăng nhập bằng mã QR). */
  anonymous?: boolean;
  /** Dùng token khác token đang lưu (VD token của phiên bé). */
  token?: string;
};

/**
 * Gọi API backend và luôn trả về ApiResponse, kể cả khi mạng lỗi hoặc body rỗng.
 * `fallback` là thông báo hiển thị khi backend không trả message.
 */
export async function apiRequest<T>(path: string, fallback: string, opts: Options = {}): Promise<ApiResponse<T>> {
  const init: RequestInit = { method: opts.method ?? 'GET' };
  if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
  try {
    const url = `${API_BASE_URL}${path}`;
    const response = opts.anonymous
      ? await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } })
      : await authService.authenticatedFetch(url, init, opts.token);
    const text = await response.text();
    let parsed: Partial<ApiResponse<T>> | null = null;
    try { parsed = text.trim() ? JSON.parse(text) : null; } catch { parsed = null; }
    if (parsed && typeof parsed.success === 'boolean') {
      return { success: parsed.success, message: parsed.message || (parsed.success ? '' : fallback), data: parsed.data ?? null, errors: parsed.errors };
    }
    // Lỗi kiểm tra dữ liệu của ASP.NET (ProblemDetails): lấy thông báo đầu tiên.
    const problem = parsed as { errors?: Record<string, string[]> } | null;
    const firstError = problem?.errors && !Array.isArray(problem.errors) ? Object.values(problem.errors).flat()[0] : undefined;
    return { success: response.ok, message: response.ok ? '' : firstError || fallback, data: null };
  } catch (error) {
    return { success: false, message: fallback, data: null, errors: [(error as Error).message || 'Network error'] };
  }
}
