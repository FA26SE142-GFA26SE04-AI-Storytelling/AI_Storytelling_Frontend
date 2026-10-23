'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import type { ApiResponse } from '@/app/types/auth';
import { parentAuthoringService as api } from '@/app/services/parentAuthoringService';
import { useAuth } from '@/app/context/AuthContext';
export function useParentAuthoring(childId: number) {
  const { user } = useAuth();
  const [list, setList] = useState<B.PagedResult<B.CreatorDraftDto> | null>(null);
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<B.ParentDraftDto | null>(null);
  const [version, setVersion] = useState<B.CreatorVersionDto | null>(null);
  const [versions, setVersions] = useState<B.CreatorVersionDto[]>([]);
  const [workflow, setWorkflow] = useState<B.ParentOperationDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [reload, setReload] = useState(0);
  const scope = useRef(Symbol());
  const locked = useRef(false);
  const pending = useRef<(() => Promise<ApiResponse<unknown>>) | null>(null);
  useEffect(() => {
    const controller = new AbortController(); const run = Symbol(); scope.current = run;
    setDraft(null); setVersion(null); setWorkflow([]); pending.current = null; setUncertain(false); locked.current = false; setBusy(false);
    void api.mine(page, 20, controller.signal).then(r => { if (scope.current === run) { setList(r.data); if (!r.success) setNote(r.message); } });
    return () => { scope.current = Symbol(); controller.abort(); };
  }, [childId, user?.id, page, reload]);
  const load = useCallback(async (id: number, replaceEditor = false) => {
    const run = Symbol(); scope.current = run;
    const d = await api.get(id); if (scope.current !== run) return;
    if (!d.success || !d.data) { setNote(d.message); return; }
    if (d.data.childProfileId !== childId) { setNote('Bản này thuộc hồ sơ bé khác. Hãy chọn đúng bé trước khi chỉnh sửa.'); return; }
    const [history, ops] = await Promise.all([api.versions(id), api.workflow(id)]); if (scope.current !== run) return;
    setDraft(d.data); setVersions(history.data ?? []); setWorkflow(ops.data ?? []);
    if (replaceEditor) setVersion(history.data?.find(v => v.versionId === d.data!.story.selectedVersionId) ?? null);
    if (!history.success || !ops.success) setNote(history.message || ops.message);
  }, [childId]);
  const execute = async <T,>(call: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T> | undefined> => {
    if (locked.current) return;
    const run = scope.current; locked.current = true; setBusy(true); setNote('');
    const r = await call(); if (scope.current !== run) return;
    locked.current = false; setBusy(false); setNote(r.message || (r.success ? 'Đã ghi nhận.' : 'Thao tác chưa hoàn tất.'));
    if (r.status === 0 || (r.status ?? 0) >= 500) { pending.current = call; setUncertain(true); }
    else { pending.current = null; setUncertain(false); }
    return r;
  };
  const command = () => ({ operationId: crypto.randomUUID(), revisionToken: draft!.story.revisionToken, baseVersionId: draft!.story.selectedVersionId });
  const create = async (title: string) => {
    const body: B.CreateParentDraftRequest = { operationId: crypto.randomUUID(), childProfileId: childId, title, language: 'vi', purpose: 'free', experienceMode: 'reading' };
    const r = await execute(() => api.create(body));
    if (r?.success && r.data) await load(r.data.story.storyId, true);
  };
  const save = async (input: Pick<B.SaveCreatorContentRequest,'title'|'content'|'sourceDeclaration'|'rightsDeclaration'|'assistanceReferences'>) => {
    if (!draft || uncertain) return;
    const id = draft.story.storyId; const body = { ...command(), ...input };
    const r = await execute(() => api.save(id, body)); if (r?.success && r.data) { setVersion(r.data.version); await load(id); }
  };
  const write = async <T,>(fn: (id: number, cmd: B.CreatorVersionCommand) => Promise<ApiResponse<T>>) => {
    if (!draft || uncertain) return;
    const id = draft.story.storyId, cmd = command();
    const r = await execute(() => fn(id,cmd));
    if (r?.success) await load(id);
    return r;
  };
  const retry = async () => { if (!pending.current) return; const call = pending.current; const r = await execute(call); if (r?.success) {
      const data = r.data as B.ParentDraftDto | B.CreatorContentSavedDto | null;
      const id = data && typeof data === 'object' && 'story' in data ? data.story.storyId : draft?.story.storyId;
      if (id) await load(id,true);
    } };
  return { list, page, setPage, draft, version, versions, workflow, busy, note, setNote, uncertain, create, save, write, execute, load, retry, command, refreshList: () => setReload(v => v + 1) };
}
