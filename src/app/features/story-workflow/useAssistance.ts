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
  useEffect(() => {
    scope.current=Symbol();locked.current=false;pending.current=null;cancelPayload.current=null;cancelling.current=false;
    setTaskId(null);setTasks(null);setSteps(null);setBusy(false);setUncertain(false);setCancelBusy(false);setMessage('');
    return()=>{scope.current=Symbol();};
  },[actor,storyId,user?.id]);
  useEffect(() => { let alive=true; const controller = new AbortController();
    void api.list(storyId,taskPage,controller.signal).then(r => { if (alive) { setTasks(r.data); if (!r.success) setMessage(r.message); } });
    return () => { alive=false; controller.abort(); };
  }, [api,storyId,taskPage,user?.id,revision]);
  const load = useCallback((id: number, signal: AbortSignal) => api.get(storyId,id,signal), [api,storyId]);
  const running = useCallback((t: B.AssistanceTaskDto) => !!t.activeOperation, []);
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
    if (r.status === 0 || (r.status ?? 0)>=500) { pending.current = call; setUncertain(true); } else { pending.current = null; setUncertain(false); }
    if (r.success && r.data && typeof r.data === 'object' && 'taskId' in r.data && typeof r.data.taskId === 'number') { setTaskId(r.data.taskId); polling.refresh(); }
    if (r.status === 409) polling.refresh();
    return r;
  };
  const create = (body: B.CreateAssistanceTaskRequest) => execute(() => api.create(storyId,body));
  const requestSuggestions = async (body:B.CreateAssistanceTaskRequest) => {
    if(locked.current||uncertain)return;
    const run=scope.current;const created=await create(body);
    if(scope.current!==run||!created?.success||!created.data)return;
    const id=created.data.taskId;
    const command={operationId:crypto.randomUUID(),expectedTaskRevision:created.data.taskRevision,answerStepId:created.data.acceptedAnswerStepId};
    return execute(()=>api.suggestions(storyId,id,command));
  };
  const command = <T,>(call: (id: number, cmd: B.AssistanceCommand) => Promise<ApiResponse<T>>) => {
    if (!task || uncertain || polling.timedOut) return;
    const cmd = { operationId:crypto.randomUUID(),expectedTaskRevision:task.taskRevision };
    return execute(() => call(task.taskId,cmd));
  };
  const cancelRunning = async () => {
    if (!task?.activeOperation || cancelling.current || locked.current || uncertain) return;
    cancelling.current = true; locked.current=true; setBusy(true); setCancelBusy(true); const run = scope.current;
    if (!cancelPayload.current) cancelPayload.current = { operationId:crypto.randomUUID(),expectedTaskRevision:task.taskRevision,targetOperationId:task.activeOperation.operationId };
    const r = await api.cancel(storyId,task.taskId,cancelPayload.current);
    if (scope.current !== run) return;
    cancelling.current = false; locked.current=false; setBusy(false); setCancelBusy(false); setMessage(r.message || (r.success ? 'Đã yêu cầu hủy thao tác.' : 'Chưa hủy được thao tác.'));
    if (r.status !== 0 && (r.status ?? 0)<500) cancelPayload.current = null;
    if(r.status===0||(r.status??0)>=500){const payload=cancelPayload.current!;pending.current=()=>api.cancel(storyId,task.taskId,payload);setUncertain(true);}
    polling.refresh();
  };
  return { api,task,cancelBusy,cancelRunning,tasks,steps,taskPage,setTaskPage,stepPage,setStepPage,message:polling.error ?? message,busy,uncertain,timedOut:polling.timedOut,create,requestSuggestions,command,select:(id: number) => { if(!locked.current&&!uncertain){setTaskId(id);setStepPage(1);} },refresh:() => { polling.refresh(); setRevision(v => v + 1); },retry:() => pending.current && execute(pending.current) };
}
