'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import type { ApiResponse } from '@/app/types/auth';
import { parentAssistanceService } from '@/app/services/parentAssistanceService';
import { creatorAssistanceService } from '@/app/services/creatorAssistanceService';
import { useStoryProgressPolling } from './useStoryProgressPolling';
import { useAuth } from '@/app/context/AuthContext';
export function useAssistance(actor: 'parent' | 'creator', storyId: number) {
  const api = actor === 'parent' ? parentAssistanceService : creatorAssistanceService;
  const { user } = useAuth();
  const [taskId, setTaskId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<B.PagedResult<B.AssistanceTaskSummary> | null>(null);
  const [steps, setSteps] = useState<B.PagedResult<B.AssistanceStepDto> | null>(null);
  const [taskPage, setTaskPage] = useState(1); const [stepPage, setStepPage] = useState(1);
  const [cancelBusy, setCancelBusy] = useState(false);
  const cancelling = useRef(false);
  const cancelPayload = useRef<B.CancelAssistanceRequest | null>(null);
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [uncertain, setUncertain] = useState(false);
  const pending = useRef<(() => Promise<ApiResponse<unknown>>) | null>(null);
  const scope = useRef(Symbol()); const locked = useRef(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => { const run = Symbol(); scope.current = run; const controller = new AbortController();
    void api.list(storyId,taskPage,controller.signal).then(r => { if (scope.current === run) { setTasks(r.data); if (!r.success) setMessage(r.message); } });
    return () => { scope.current = Symbol(); controller.abort(); };
  }, [api,storyId,taskPage,user?.id,revision]);
  const load = useCallback((id: number, signal: AbortSignal) => api.get(storyId,id,signal), [api,storyId]);
  const running = useCallback((t: B.AssistanceTaskDto) => busy || !!t.activeOperation, [busy]);
  const polling = useStoryProgressPolling(taskId,load,running);
  const task = polling.data;
  useEffect(() => { if (!taskId) return; const controller = new AbortController(); let alive = true;
    void api.steps(storyId,taskId,stepPage,controller.signal).then(r => { if (alive) { setSteps(r.data); if (!r.success) setMessage(r.message); } });
    return () => { alive = false; controller.abort(); };
  }, [api,storyId,taskId,stepPage,task?.taskRevision]);
  const execute = async <T,>(call: () => Promise<ApiResponse<T>>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setMessage(''); const run = scope.current;
    const r = await call(); if (scope.current !== run) return;
    locked.current = false; setBusy(false); setMessage(r.message || (r.success ? 'Đã ghi nhận.' : 'Thao tác chưa hoàn tất.'));
    if (r.status === 0) { pending.current = call; setUncertain(true); } else { pending.current = null; setUncertain(false); }
    if (r.success && r.data && typeof r.data === 'object' && 'taskId' in r.data && typeof r.data.taskId === 'number') { setTaskId(r.data.taskId); polling.refresh(); }
    if (r.status === 409) polling.refresh();
    return r;
  };
  const create = (body: B.CreateAssistanceTaskRequest) => execute(() => api.create(storyId,body));
  const command = <T,>(call: (id: number, cmd: B.AssistanceCommand) => Promise<ApiResponse<T>>) => {
    if (!task || uncertain) return;
    const cmd = { operationId:crypto.randomUUID(),expectedTaskRevision:task.taskRevision };
    return execute(() => call(task.taskId,cmd));
  };
  const cancelRunning = async () => {
    if (!task?.activeOperation || cancelling.current) return;
    cancelling.current = true; setCancelBusy(true); const run = scope.current;
    if (!cancelPayload.current) cancelPayload.current = { operationId:crypto.randomUUID(),expectedTaskRevision:task.taskRevision,targetOperationId:task.activeOperation.operationId };
    const r = await api.cancel(storyId,task.taskId,cancelPayload.current);
    if (scope.current !== run) return;
    cancelling.current = false; setCancelBusy(false); setMessage(r.message || (r.success ? 'Đã yêu cầu hủy thao tác.' : 'Chưa hủy được thao tác.'));
    if (r.status !== 0) cancelPayload.current = null;
    polling.refresh();
  };
  return { api,task,cancelBusy,cancelRunning,tasks,steps,taskPage,setTaskPage,stepPage,setStepPage,message:polling.error ?? message,busy,uncertain,timedOut:polling.timedOut,create,command,select:(id: number) => { setTaskId(id); setStepPage(1); },refresh:() => { polling.refresh(); setRevision(v => v + 1); },retry:() => pending.current && execute(pending.current) };
}
