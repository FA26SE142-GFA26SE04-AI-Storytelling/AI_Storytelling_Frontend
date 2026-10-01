'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { aiStoryCreationService } from '../../../services/aiStoryCreationService';
import {
  AIStoryCreativeInputDto,
  AIStoryInputContextDto,
  AIStoryInputProgressDto,
} from '../../../types/aiStory';
import {
  AIStoryInputFlowPhase,
  AIStoryInputFormValues,
  buildCreativeInput,
  buildSubmitRequest,
  createDefaultFormValues,
  phaseFromProgress,
  shouldPollInput,
} from './aiStoryInputFlowUtils';

const POLL_INTERVAL_MS = 1800;
const POLL_TIMEOUT_MS = 45_000;

function createRequestKey(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface UseAIStoryInputFlowResult {
  phase: AIStoryInputFlowPhase;
  context: AIStoryInputContextDto | null;
  values: AIStoryInputFormValues | null;
  progress: AIStoryInputProgressDto | null;
  errorMessage: string | null;
  isPollingTimedOut: boolean;
  isBusy: boolean;
  canRetryInput: boolean;
  updateValues: (updates: Partial<AIStoryInputFormValues>) => void;
  submit: () => Promise<void>;
  retry: () => Promise<void>;
  checkStatus: () => Promise<void>;
  editInput: () => void;
  markWaitingForOutline: () => void;
}

export function useAIStoryInputFlow(childProfileId: number | null, resumedStoryId?: number | null, resumedRequestId?: number | null): UseAIStoryInputFlowResult {
  const [phase, setPhase] = useState<AIStoryInputFlowPhase>('loading_context');
  const [context, setContext] = useState<AIStoryInputContextDto | null>(null);
  const [values, setValues] = useState<AIStoryInputFormValues | null>(null);
  const [progress, setProgress] = useState<AIStoryInputProgressDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPollingTimedOut, setIsPollingTimedOut] = useState(false);
  const [hasCreativeInput, setHasCreativeInput] = useState(false);

  const mountedRef = useRef(true);
  const flowVersionRef = useRef(0);
  const submitLockRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollControllerRef = useRef<AbortController | null>(null);
  const pollStartedAtRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const retryKeyRef = useRef<string | null>(null);
  const lastCreativeInputRef = useRef<AIStoryCreativeInputDto | null>(null);

  const clearPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollControllerRef.current?.abort();
    pollControllerRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      flowVersionRef.current += 1;
      clearPolling();
      requestControllerRef.current?.abort();
    };
  }, [clearPolling]);

  useEffect(() => {
    const flowVersion = ++flowVersionRef.current;
    clearPolling();
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    submitLockRef.current = false;
    idempotencyKeyRef.current = null;
    retryKeyRef.current = null;
    lastCreativeInputRef.current = null;
    setHasCreativeInput(false);
    setContext(null);
    setValues(null);
    setProgress(null);
    setErrorMessage(null);
    setIsPollingTimedOut(false);

    if (!childProfileId) {
      setPhase('editing_input');
      return;
    }

    setPhase('loading_context');
    const controller = new AbortController();
    requestControllerRef.current = controller;

    void aiStoryCreationService.getCreationContext(childProfileId, controller.signal).then(async (response) => {
      if (!mountedRef.current || flowVersion !== flowVersionRef.current || controller.signal.aborted) return;
      if (response.success && response.data) {
        setContext(response.data);
        setValues(createDefaultFormValues(response.data));
        setPhase('editing_input');
        if (resumedStoryId && resumedRequestId) {
          const restored = await aiStoryCreationService.getInputProgress(resumedStoryId, resumedRequestId, controller.signal);
          if (!mountedRef.current || flowVersion !== flowVersionRef.current || controller.signal.aborted) return;
          if (restored.data) {
            setProgress(restored.data);
            setPhase(phaseFromProgress(restored.data));
            setIsPollingTimedOut(shouldPollInput(restored.data));
            setErrorMessage(restored.data.fallbackMessage || (shouldPollInput(restored.data) ? 'Bạn có thể kiểm tra lại trạng thái yêu cầu đang xử lý.' : null));
          } else {
            setPhase('checking_input');
            setIsPollingTimedOut(true);
            setErrorMessage(restored.message);
          }
        }
      } else {
        setErrorMessage(response.message || 'Không thể tải cấu hình tạo truyện cho bé.');
        setPhase('editing_input');
      }
    });

    return () => controller.abort();
  }, [childProfileId, clearPolling, resumedStoryId, resumedRequestId]);

  const handleProgress = useCallback((nextProgress: AIStoryInputProgressDto) => {
    clearPolling();
    setProgress(nextProgress);
    setPhase(phaseFromProgress(nextProgress));
    setIsPollingTimedOut(false);
    if (nextProgress.inputStatus === 'input_blocked' || nextProgress.inputStatus === 'input_check_failed') {
      setErrorMessage(nextProgress.fallbackMessage || 'Không thể hoàn tất kiểm tra an toàn cho ý tưởng này.');
    } else {
      setErrorMessage(null);
    }
  }, [clearPolling]);

  const pollProgress = useCallback(async (
    storyId: number,
    requestId: number,
    flowVersion: number,
    resetTimer = false
  ) => {
    if (resetTimer) pollStartedAtRef.current = Date.now();
    if (!mountedRef.current || flowVersion !== flowVersionRef.current) return;

    if (Date.now() - pollStartedAtRef.current >= POLL_TIMEOUT_MS) {
      clearPolling();
      setIsPollingTimedOut(true);
      setErrorMessage('Việc kiểm tra đang lâu hơn dự kiến. Bạn có thể kiểm tra lại trạng thái.');
      return;
    }

    const pollController = new AbortController();
    pollControllerRef.current = pollController;
    const response = await aiStoryCreationService.getInputProgress(storyId, requestId, pollController.signal);
    if (pollControllerRef.current === pollController) pollControllerRef.current = null;
    if (!mountedRef.current || flowVersion !== flowVersionRef.current || pollController.signal.aborted) return;

    if (response.data) {
      if (shouldPollInput(response.data)) {
        setProgress(response.data);
        setPhase('checking_input');
        pollTimerRef.current = setTimeout(
          () => void pollProgress(storyId, requestId, flowVersion),
          POLL_INTERVAL_MS
        );
        return;
      }
      handleProgress(response.data);
      return;
    }

    clearPolling();
    setIsPollingTimedOut(true);
    setErrorMessage(response.message || 'Không thể tải trạng thái kiểm tra an toàn.');
  }, [clearPolling, handleProgress]);

  const beginTracking = useCallback((nextProgress: AIStoryInputProgressDto, flowVersion: number) => {
    setProgress(nextProgress);
    if (shouldPollInput(nextProgress)) {
      setPhase('checking_input');
      setErrorMessage(null);
      setIsPollingTimedOut(false);
      pollStartedAtRef.current = Date.now();
      pollTimerRef.current = setTimeout(
        () => void pollProgress(nextProgress.storyId, nextProgress.requestId, flowVersion),
        POLL_INTERVAL_MS
      );
      return;
    }
    handleProgress(nextProgress);
  }, [handleProgress, pollProgress]);

  const updateValues = useCallback((updates: Partial<AIStoryInputFormValues>) => {
    setValues((current) => (current ? { ...current, ...updates } : current));
    idempotencyKeyRef.current = null;
    retryKeyRef.current = null;
  }, []);

  const submit = useCallback(async () => {
    if (submitLockRef.current || !childProfileId || !context || !values) return;
    if (!values.topic.trim() || !values.lesson.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ ý tưởng và bài học của câu chuyện.');
      return;
    }

    submitLockRef.current = true;
    clearPolling();
    const flowVersion = flowVersionRef.current;
    const existingStoryId = progress?.storyId;
    const idempotencyKey = idempotencyKeyRef.current ?? createRequestKey('ai-story');
    idempotencyKeyRef.current = idempotencyKey;
    const creativeInput = buildCreativeInput(values, context);
    lastCreativeInputRef.current = creativeInput;
    setHasCreativeInput(true);
    setPhase('submitting');
    setErrorMessage(null);
    setIsPollingTimedOut(false);

    try {
      const controller = new AbortController();
      requestControllerRef.current = controller;
      const response = await aiStoryCreationService.submitInput(
        buildSubmitRequest(childProfileId, values, context, idempotencyKey, existingStoryId),
        controller.signal
      );
      if (!mountedRef.current || flowVersion !== flowVersionRef.current) return;
      if (response.data) {
        beginTracking(response.data, flowVersion);
        return;
      }
      setPhase('editing_input');
      setErrorMessage(response.message || 'Không thể gửi ý tưởng câu chuyện.');
    } finally {
      if (flowVersion === flowVersionRef.current) submitLockRef.current = false;
    }
  }, [beginTracking, childProfileId, clearPolling, context, progress?.storyId, values]);

  const retry = useCallback(async () => {
    if (
      submitLockRef.current ||
      !progress ||
      progress.inputStatus !== 'input_check_failed' ||
      !progress.canRetry ||
      !lastCreativeInputRef.current
    ) return;

    submitLockRef.current = true;
    clearPolling();
    const flowVersion = flowVersionRef.current;
    const retryKey = retryKeyRef.current ?? createRequestKey('ai-story-retry');
    retryKeyRef.current = retryKey;
    setPhase('submitting');
    setErrorMessage(null);

    try {
      const controller = new AbortController();
      requestControllerRef.current = controller;
      const response = await aiStoryCreationService.retryInput(progress.storyId, progress.requestId, {
        ...lastCreativeInputRef.current,
        retryKey,
      }, controller.signal);
      if (!mountedRef.current || flowVersion !== flowVersionRef.current) return;
      if (response.data) {
        retryKeyRef.current = null;
        beginTracking(response.data, flowVersion);
        return;
      }
      setPhase('input_check_failed');
      setErrorMessage(response.message || 'Không thể thử lại kiểm tra an toàn.');
    } finally {
      if (flowVersion === flowVersionRef.current) submitLockRef.current = false;
    }
  }, [beginTracking, clearPolling, progress]);

  const checkStatus = useCallback(async () => {
    const storyId = progress?.storyId ?? resumedStoryId;
    const requestId = progress?.requestId ?? resumedRequestId;
    if (!storyId || !requestId || submitLockRef.current) return;
    clearPolling();
    const flowVersion = flowVersionRef.current;
    setIsPollingTimedOut(false);
    setErrorMessage(null);
    setPhase('checking_input');
    await pollProgress(storyId, requestId, flowVersion, true);
  }, [clearPolling, pollProgress, progress, resumedStoryId, resumedRequestId]);

  const editInput = useCallback(() => {
    clearPolling();
    idempotencyKeyRef.current = null;
    retryKeyRef.current = null;
    setPhase('editing_input');
    setIsPollingTimedOut(false);
  }, [clearPolling]);

  const markWaitingForOutline = useCallback(() => setPhase('waiting_outline'), []);

  return {
    phase,
    context,
    values,
    progress,
    errorMessage,
    isPollingTimedOut,
    isBusy: phase === 'loading_context' || phase === 'submitting',
    canRetryInput: hasCreativeInput && !!progress?.canRetry,
    updateValues,
    submit,
    retry,
    checkStatus,
    editInput,
    markWaitingForOutline,
  };
}
