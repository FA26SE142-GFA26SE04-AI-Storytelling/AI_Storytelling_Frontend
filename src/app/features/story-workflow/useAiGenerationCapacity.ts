'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  aiStoryCreationService,
  type AiGenerationCapacityDto,
} from '@/app/services/aiStoryCreationService';

export interface UseAiGenerationCapacityResult {
  capacity: AiGenerationCapacityDto | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAiGenerationCapacity(enabled = true, transitionKey?: unknown): UseAiGenerationCapacityResult {
  const [capacity, setCapacity] = useState<AiGenerationCapacityDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    const response = await aiStoryCreationService.getAiCapacity(controller.signal);
    if (controller.signal.aborted) return;
    setLoading(false);
    if (response.success && response.data) {
      setCapacity(response.data);
      setError(null);
    } else if (response.status !== 0) {
      setError(response.message || 'Không tải được trạng thái giới hạn tạo truyện.');
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => {
      clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [enabled, refresh, transitionKey]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const onFocus = () => {
      void refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, refresh]);

  return { capacity, loading, error, refresh };
}
