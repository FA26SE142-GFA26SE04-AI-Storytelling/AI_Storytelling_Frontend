'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { moderationService, type ReviewKind, type ReviewPackage } from '@/app/services/moderationService';
import type { ApiResponse } from '@/app/types/auth';

export function useReviewItem(kind: ReviewKind, id: number, onDecision: () => void) {
  const { user } = useAuth();
  const [item, setItem] = useState<ReviewPackage | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const scope = useRef(Symbol());
  const locked = useRef(false);
  const shownKey = useRef('');
  useEffect(() => {
    const run = Symbol(); scope.current = run;
    const controller = new AbortController();
    locked.current = false; setBusy(false);
    // Chỉ xoá gói khi đổi mục; tải lại sau khi chấm thì giữ nguyên gói cũ để trang không bị cuộn lên đầu.
    const key = `${kind}:${id}:${user?.id}`;
    if (shownKey.current !== key) { shownKey.current = key; setItem(null); }
    void moderationService.package(kind, id, controller.signal).then(r => {
      if (scope.current !== run) return;
      if (r.success && r.data) setItem(r.data); else setMessage(r.message);
    });
    return () => { scope.current = Symbol(); controller.abort(); };
  }, [kind, id, user?.id, revision]);
  const act = async (fn: () => Promise<ApiResponse<unknown>>, terminal = false): Promise<boolean> => {
    if (locked.current) return false;
    locked.current = true; setBusy(true); setMessage('');
    const run = scope.current;
    const r = await fn();
    if (scope.current !== run) return false;
    locked.current = false; setBusy(false); setMessage(r.message || (r.success ? 'Đã ghi nhận.' : 'Thao tác chưa hoàn tất.'));
    if (r.success && terminal) onDecision();
    else if (r.success || r.status === 409) setRevision(v => v + 1);
    return r.success;
  };
  /** Cập nhật gói ngay trên màn hình (lạc quan) trong lúc chờ gói mới từ backend; gói tải về sau đó sẽ thay thế. */
  const patch = (update: (current: ReviewPackage) => ReviewPackage) => setItem(current => (current ? update(current) : current));
  return { item, message, busy, act, patch, refresh: () => setRevision(v => v + 1) };
}
