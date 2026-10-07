'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiResponse } from '@/app/types/auth';

/** One in-flight request per run; replacing a run invalidates even non-abortable responses. */
export function useStoryProgressPolling<T>(
  scope: number | null,
  load: (id: number, signal: AbortSignal) => Promise<ApiResponse<T>>,
  shouldContinue: (data: T) => boolean,
  timeoutMs = 180_000,
) {
  const [result, setResult] = useState<{ scope: number | null; data: T | null; error: string | null; timedOut: boolean }>({
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
    const cancel = () => { alive = false; clearTimeout(timer); controller?.abort(); };
    cancelRef.current = cancel;
    setResult({ scope, data: null, error: null, timedOut: false });
    const poll = async () => {
      controller = new AbortController();
      const response = await load(scope, controller.signal);
      if (!alive) return;
      if (!response.success || response.data === null || response.data === undefined) {
        setResult(current => ({ ...current, error: response.message || 'Không thể kiểm tra trạng thái.' }));
        return;
      }
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
