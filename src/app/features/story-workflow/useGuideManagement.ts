'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { authoringGuideManagementService as api } from '@/app/services/authoringGuideManagementService';
import type { GuideManagementOverview } from '@/app/types/authoringGuideManagement';
import type { ApiResponse } from '@/app/types/auth';

export function useGuideManagement() {
  const [overview, setOverview] = useState<GuideManagementOverview | null>(null);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [note, setNote] = useState('');
  const lock = useRef(false);
  const alive = useRef(true);
  const load = useCallback(async (signal?: AbortSignal) => {
    const r = await api.overview(signal);
    if (!alive.current || signal?.aborted) return false;
    if (r.success && r.data) { setOverview(r.data); setBlocked(false); return true; }
    setBlocked(true); setNote(r.message); return false;
  }, []);
  useEffect(() => {
    alive.current = true; const controller = new AbortController();
    void load(controller.signal);
    return () => { alive.current = false; controller.abort(); };
  }, [load]);
  const write = async <T,>(call: () => Promise<ApiResponse<T>>) => {
    if (lock.current || blocked) return false;
    lock.current = true; setBusy(true);
    const r = await call();
    if (!alive.current) return false;
    setNote(r.message || (r.success ? 'Đã cập nhật hướng dẫn.' : 'Chưa cập nhật được.'));
    if (r.status === 409 || r.status === 0 || (r.status ?? 0) >= 500) setBlocked(true);
    const ok = r.success ? await load() : false;
    lock.current = false; setBusy(false);
    return ok;
  };
  return { overview, busy, blocked, note, setNote, load, write };
}
