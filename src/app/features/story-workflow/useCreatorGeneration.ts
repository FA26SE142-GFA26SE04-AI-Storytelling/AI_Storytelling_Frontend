'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import type { ApiResponse } from '@/app/types/auth';
import { creatorInputService } from '@/app/services/creatorPublicationService';
import { useStoryProgressPolling } from './useStoryProgressPolling';
import { loadSnapshot, snapshotStage, type StatusSnapshot } from './generationSnapshot';
import { useAuth } from '@/app/context/AuthContext';
const continueInput = (p: B.AIStoryInputProgressDto) => ['pending_input','checking_input'].includes(p.inputStatus);
export function useCreatorGeneration(initialId: number | null) {
  const { user } = useAuth();
  const [id, setId] = useState(initialId);
  const [input, setInput] = useState<B.AIStoryInputProgressDto | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef<B.SubmitCreatorAIStoryInputRequestDto | null>(null);
  const retryPayload = useRef<B.RetryAIStoryInputRequestDto | null>(null);
  const locked = useRef(false);
  const epoch = useRef(Symbol());
  useEffect(() => { epoch.current = Symbol(); return () => { epoch.current = Symbol(); }; }, [user?.id, initialId]);
  const requestId = input?.requestId ?? 0;
  const loadInput = useCallback((_id: number, signal: AbortSignal) => creatorInputService.progress(_id, requestId, signal), [requestId]);
  const check = useStoryProgressPolling(id !== null && input && continueInput(input) ? id : null, loadInput, continueInput);
  useEffect(() => { if (check.data) { setInput(check.data); setMessage(check.data.fallbackMessage ?? ''); } }, [check.data]);
  const activeId = id !== null && (!input || input.inputStatus === 'input_accepted') ? id : null;
  const shouldContinue = useCallback((s: StatusSnapshot) => ['outline_wait','generating'].includes(snapshotStage(s, false)), []);
  const snapshot = useStoryProgressPolling(activeId, loadSnapshot, shouldContinue);
  const stage = snapshotStage(snapshot.data, false);
  const submit = async (body: B.SubmitCreatorAIStoryInputRequestDto) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setMessage(''); const run = epoch.current;
    // A changed payload gets a new key; a lost response reuses exactly the captured payload/key.
    if (!pending.current || JSON.stringify({ ...pending.current, idempotencyKey: '' }) !== JSON.stringify({ ...body, idempotencyKey: '' })) pending.current = body;
    const r = await creatorInputService.submit(pending.current);
    if (run !== epoch.current) return;
    locked.current = false; setBusy(false); setMessage(r.message);
    if (r.data) { setId(r.data.storyId); setInput(r.data); pending.current = null; }
    return r;
  };
  const retry = async (creative: B.AIStoryCreativeInputDto) => {
    if (!input?.canRetry || locked.current) return;
    locked.current = true; setBusy(true); const run = epoch.current;
    if (!retryPayload.current) retryPayload.current = { ...creative, retryKey: `retry-${crypto.randomUUID()}` };
    const r = await creatorInputService.retry(input.storyId, input.requestId, retryPayload.current);
    if (r.status !== 0 || r.data) retryPayload.current = null;
    if (run !== epoch.current) return;
    locked.current = false; setBusy(false); setMessage(r.message);
    if (r.data) setInput(r.data);
  };
  const command = async (fn: () => Promise<ApiResponse<unknown>>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setMessage(''); const run = epoch.current;
    const r = await fn(); if (run !== epoch.current) return;
    locked.current = false; setBusy(false); setMessage(r.message);
    if (r.success) snapshot.refresh();
    return r;
  };
  const refreshSnapshot = snapshot.refresh, refreshInput = check.refresh;
  const refresh = useCallback(() => { refreshSnapshot(); refreshInput(); }, [refreshSnapshot, refreshInput]);
  return { id, input, stage, snapshot: snapshot.data, error: snapshot.error ?? check.error, message, busy, timedOut: snapshot.timedOut || check.timedOut, submit, retry, command, refresh };
}
