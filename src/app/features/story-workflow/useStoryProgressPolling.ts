'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiResponse } from '@/app/types/auth';

export interface PollingResult<T> { scope: number | null; data: T | null; error: string | null; timedOut: boolean }

export const transientPollingFailure = (status?:number) => status===0 || status===408 || status===429 || (status!==undefined && status>=500);

/**
 * Trạng thái khi một lần theo dõi bắt đầu. Cùng một truyện (refresh, đổi điều kiện dừng) thì giữ dữ liệu cũ trong lúc tải lại:
 * xoá về null sẽ làm giao diện tạm rơi về bước đầu rồi mới nhảy lại, nhìn như nháy cả màn hình.
 */
export function startPolling<T>(current: PollingResult<T>, scope: number | null): PollingResult<T> {
  return current.scope === scope ? { ...current, error: null, timedOut: false } : { scope, data: null, error: null, timedOut: false };
}

/** One in-flight request per run; replacing a run invalidates even non-abortable responses. */
export function useStoryProgressPolling<T>(
  scope: number | null,
  load: (id: number, signal: AbortSignal) => Promise<ApiResponse<T>>,
  shouldContinue: (data: T) => boolean,
  timeoutMs = 180_000,
) {
  const [result, setResult] = useState<PollingResult<T>>({
    scope, data: null, error: null, timedOut: false,
  });
  const [run, setRun] = useState(0);
  const cancelRef = useRef<(() => void) | null>(null);
  const refresh = useCallback(() => {
    cancelRef.current?.();
    setRun(value => value + 1);
  }, []);

  useEffect(() => {
    if (scope === null) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    const started = Date.now();
    let failures = 0;
    const cancel = () => { alive = false; clearTimeout(timer); controller?.abort(); };
    cancelRef.current = cancel;
    // Cùng một truyện (refresh, đổi điều kiện dừng): giữ dữ liệu cũ trong lúc tải lại, để giao diện không nháy về trạng thái rỗng.
    setResult(current => startPolling(current, scope));
    const poll = async () => {
      controller = new AbortController();
      const response = await load(scope, controller.signal);
      if (!alive) return;
      if (!response.success || response.data === null || response.data === undefined) {
        const retryable=transientPollingFailure(response.status);
        const timedOut=retryable && Date.now()-started>=timeoutMs;
        setResult(current => ({ ...current, timedOut, error: retryable
          ? 'Chưa lấy được cập nhật từ máy chủ. Đây chưa phải kết quả tạo truyện; hệ thống sẽ kiểm tra lại.'
          : response.message || 'Không thể kiểm tra trạng thái.' }));
        if(retryable&&!timedOut)timer=setTimeout(()=>void poll(),Math.min(1800*2**failures++,15000));
        return;
      }
      failures=0;
      const waiting = shouldContinue(response.data);
      const timedOut = waiting && Date.now() - started >= timeoutMs;
      setResult({ scope, data: response.data, error: null, timedOut });
      if (waiting && !timedOut) timer = setTimeout(() => void poll(), 1800);
    };
    void poll();
    return () => { cancel(); if (cancelRef.current === cancel) cancelRef.current = null; };
  }, [scope, load, shouldContinue, timeoutMs, run]);

  const current = result.scope === scope ? result : { data: null, error: null, timedOut: false };
  return { ...current, refresh };
}
