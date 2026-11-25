import type { ApiResponse } from '@/app/types/auth';
import { authService } from './authService';
import { API_BASE_URL } from './apiConfig';

export type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  form?: FormData;
  anonymous?: boolean;
  token?: string;
  session?: 'adult' | 'child' | 'anonymous';
  signal?: AbortSignal;
  cache?: RequestCache;
  /** Only opt in where the controller deliberately returns no JSON. */
  emptyResponse?: boolean;
};

const AI_STORY_CONCURRENCY_LIMIT_CODE = 'AI_STORY_CONCURRENCY_LIMIT';
const AI_STORY_CONCURRENCY_LIMIT_MESSAGE = 'Bạn đang tạo 2 truyện. Hãy hoàn tất một truyện trước khi bắt đầu truyện khác.';

/** Preserves error progress, false/0/null payloads and actual HTTP status. */
export async function apiRequest<T>(path: string, fallback: string, opts: ApiOptions = {}): Promise<ApiResponse<T>> {
  if (opts.session === 'child' && !opts.token) {
    return { success: false, status: 401, message: 'Phiên của bé đã hết hạn.', data: null };
  }
  const init: RequestInit = { method: opts.method ?? 'GET', signal: opts.signal, cache: opts.cache };
  if (opts.form) init.body = opts.form;
  else if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
  try {
    const url = `${API_BASE_URL}${path}`;
    const response = opts.anonymous || opts.session === 'anonymous'
      ? await fetch(url, { ...init, headers: opts.form ? {} : { 'Content-Type': 'application/json' } })
      : await authService.authenticatedFetch(url, init, opts.token);
    const text = await response.text();
    let parsed: Record<string, unknown> | null = null;
    try {
      const value: unknown = text.trim() ? JSON.parse(text) : null;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) parsed = value as Record<string, unknown>;
    } catch { /* Unexpected HTML/invalid JSON is a contract error, not an empty success. */ }
    const errors = Array.isArray(parsed?.errors)
      ? parsed.errors.filter((v): v is string => typeof v === 'string')
      : parsed?.errors && typeof parsed.errors === 'object'
        ? Object.values(parsed.errors).flat().filter((v): v is string => typeof v === 'string') : null;
    if (typeof parsed?.success === 'boolean') {
      const success = response.ok && parsed.success;
      const isConcurrencyLimit = response.status === 409 && errors?.includes(AI_STORY_CONCURRENCY_LIMIT_CODE);
      const message = isConcurrencyLimit
        ? AI_STORY_CONCURRENCY_LIMIT_MESSAGE
        : typeof parsed.message === 'string' ? parsed.message : success ? '' : fallback;
      return { success, status: response.status, message, data: (parsed.data ?? null) as T | null, errors };
    }
    if (response.ok && !text.trim() && (opts.emptyResponse || response.status === 204)) {
      return { success: true, status: response.status, message: '', data: null };
    }
    const detail = typeof parsed?.detail === 'string' ? parsed.detail : typeof parsed?.title === 'string' ? parsed.title : undefined;
    const isConcurrencyLimit = response.status === 409 && errors?.includes(AI_STORY_CONCURRENCY_LIMIT_CODE);
    return { success: false, status: response.status, message: isConcurrencyLimit ? AI_STORY_CONCURRENCY_LIMIT_MESSAGE : (errors?.[0] || detail || fallback), data: null, errors };
  } catch (error) {
    return { success: false, status: 0, message: opts.signal?.aborted ? 'Đã dừng theo dõi.' : fallback,
      data: null, errors: [error instanceof Error ? error.message : 'Network error'] };
  }
}

export function apiQuery(values: object): string {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  return query.size ? `?${query}` : '';
}
