'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { staffService } from '@/app/services/staffService';
import type { QueueItem, QueueItemStatus, QueueItemType, QueueQuery } from '@/app/types/staff';

export type QueuePriorityFilter = '' | 'High' | 'Medium' | 'Low';

export function buildModerationQueueQuery(opts: {
  itemType: QueueItemType;
  status: QueueItemStatus;
  priority: QueuePriorityFilter;
  onlyOverdue: boolean;
  pageIndex: number;
  pageSize: number;
}): QueueQuery {
  return {
    itemType: opts.itemType,
    status: opts.status,
    ...(opts.priority ? { priority: opts.priority } : {}),
    ...(opts.onlyOverdue && (opts.status === 'Pending' || opts.status === 'Claimed')
      ? { onlyOverdue: true } : {}),
    pageIndex: opts.pageIndex,
    pageSize: opts.pageSize,
  };
}

/** Chỉ chọn lại card vừa nhận nếu có mặt trong trang 1 kết quả Claimed từ backend; không quét nhiều trang. */
export function resolvePostClaimSelection(items: readonly Pick<QueueItem, 'id'>[], targetId: number | null): number | null {
  if (targetId == null) return null;
  return items.some(item => item.id === targetId) ? targetId : null;
}

export function useModerationSectionQueue({
  itemType,
  initialStatus = 'Pending',
  pageSize = 10,
}: {
  itemType: QueueItemType;
  initialStatus?: QueueItemStatus;
  pageSize?: number;
}) {
  const { user } = useAuth();
  const [status, setStatusState] = useState<QueueItemStatus>(initialStatus);
  const [priority, setPriorityState] = useState<QueuePriorityFilter>('');
  const [onlyOverdue, setOnlyOverdueState] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNote, setActionNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [revision, setRevision] = useState(0);

  const scope = useRef(Symbol());
  const activeClaim = useRef<symbol | null>(null);
  const pendingSelectId = useRef<number | null>(null);

  useEffect(() => {
    const run = Symbol();
    scope.current = run;
    activeClaim.current = null;
    setClaiming(false);
    const controller = new AbortController();
    setItems([]);
    setSelectedId(null);
    setError('');
    setLoading(true);
    setHasNextPage(false);
    setTotalCount(0);
    setTotalPages(0);

    const query = buildModerationQueueQuery({
      itemType,
      status,
      priority,
      onlyOverdue,
      pageIndex,
      pageSize,
    });

    void staffService.queue(query, controller.signal).then(r => {
      if (scope.current !== run) return;
      setLoading(false);
      if (!r.success || !r.data) {
        pendingSelectId.current = null;
        setError(r.message || 'Không tải được danh sách hồ sơ.');
        return;
      }
      const nextItems = r.data.items;
      setItems(nextItems);
      setHasNextPage(r.data.hasNextPage);
      setTotalCount(r.data.totalCount);
      setTotalPages(r.data.totalPages);
      const selectAfterClaim = resolvePostClaimSelection(nextItems, pendingSelectId.current);
      pendingSelectId.current = null;
      if (selectAfterClaim != null) setSelectedId(selectAfterClaim);
    });

    return () => {
      scope.current = Symbol();
      activeClaim.current = null;
      controller.abort();
    };
  }, [itemType, status, priority, onlyOverdue, pageIndex, pageSize, revision, user?.id]);

  const setStatus = useCallback((next: QueueItemStatus) => {
    pendingSelectId.current = null;
    setActionNote(null);
    setSelectedId(null);
    setPageIndex(1);
    if (next !== 'Pending' && next !== 'Claimed') setOnlyOverdueState(false);
    setStatusState(next);
  }, []);

  const setPriority = useCallback((next: QueuePriorityFilter) => {
    pendingSelectId.current = null;
    setSelectedId(null);
    setPageIndex(1);
    setPriorityState(next);
  }, []);

  const setOnlyOverdue = useCallback((next: boolean) => {
    pendingSelectId.current = null;
    setSelectedId(null);
    setPageIndex(1);
    setOnlyOverdueState(next);
  }, []);

  const reload = useCallback(() => {
    pendingSelectId.current = null;
    setSelectedId(null);
    setRevision(n => n + 1);
  }, []);

  const claimItem = useCallback(async (itemId: number): Promise<boolean> => {
    if (activeClaim.current !== null) return false;
    const run = scope.current;
    const claim = Symbol();
    activeClaim.current = claim;
    setClaiming(true);
    setActionNote(null);
    try {
      const r = await staffService.claim(itemId);
      if (scope.current !== run) return false;
      if (!r.success) {
        setActionNote({ ok: false, text: r.message || 'Chưa nhận được mục này.' });
        if (r.status === 409) setRevision(n => n + 1);
        return false;
      }
      pendingSelectId.current = itemId;
      setActionNote({ ok: true, text: 'Đã nhận duyệt hồ sơ.' });
      setPriorityState('');
      setOnlyOverdueState(false);
      setPageIndex(1);
      setSelectedId(null);
      if (status === 'Claimed') setRevision(n => n + 1);
      else setStatusState('Claimed');
      return true;
    } finally {
      // A response from the previous query must not unlock a newer claim.
      if (activeClaim.current === claim) {
        activeClaim.current = null;
        setClaiming(false);
      }
    }
  }, [status]);

  const selectedItem = items.find(i => i.id === selectedId) ?? null;

  return {
    user,
    status,
    setStatus,
    priority,
    setPriority,
    onlyOverdue,
    setOnlyOverdue,
    pageIndex,
    setPageIndex,
    items,
    selectedId,
    setSelectedId,
    selectedItem,
    loading,
    error,
    actionNote,
    setActionNote,
    claiming,
    hasNextPage,
    totalCount,
    totalPages,
    reload,
    claimItem,
  };
}
