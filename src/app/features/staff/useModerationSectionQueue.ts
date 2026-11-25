'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { staffService } from '@/app/services/staffService';
import type { QueueItem, QueueItemStatus, QueueItemType, QueueQuery } from '@/app/types/staff';
import type { ModerationQueueStatusFilter } from './moderationConfig';

export type QueuePriorityFilter = '' | 'High' | 'Medium' | 'Low';

export function buildModerationQueueQuery(opts: {
  itemType: QueueItemType;
  status: QueueItemStatus;
  priority: QueuePriorityFilter;
  onlyOverdue: boolean;
  onlyMyEventSubmissions?: boolean;
  pageIndex: number;
  pageSize: number;
}): QueueQuery {
  return {
    itemType: opts.itemType,
    status: opts.status,
    ...(opts.priority ? { priority: opts.priority } : {}),
    ...(opts.onlyOverdue && (opts.status === 'Pending' || opts.status === 'Claimed')
      ? { onlyOverdue: true } : {}),
    ...(opts.onlyMyEventSubmissions && opts.itemType === 'PublicStoryReview'
      ? { onlyMyEventSubmissions: true } : {}),
    pageIndex: opts.pageIndex,
    pageSize: opts.pageSize,
  };
}

/** Chỉ chọn lại card vừa nhận nếu có mặt trong trang 1 kết quả Claimed từ backend; không quét nhiều trang. */
export function resolvePostClaimSelection(items: readonly Pick<QueueItem, 'id'>[], targetId: number | null): number | null {
  if (targetId == null) return null;
  return items.some(item => item.id === targetId) ? targetId : null;
}

/** Gộp Claimed (của tôi trước, rồi Pending, rồi Claimed người khác) và phân trang client-side. */
export function mergeOpenQueueItems(
  claimedItems: readonly QueueItem[],
  pendingItems: readonly QueueItem[],
  currentUserId?: number | null,
): QueueItem[] {
  const mine: QueueItem[] = [];
  const others: QueueItem[] = [];
  for (const item of claimedItems) {
    if (currentUserId != null && item.claimedByUserId === currentUserId) mine.push(item);
    else others.push(item);
  }
  return [...mine, ...pendingItems, ...others];
}

export function useModerationSectionQueue({
  itemType,
  initialStatus = 'Pending',
  pageSize = 10,
}: {
  itemType: QueueItemType;
  initialStatus?: ModerationQueueStatusFilter;
  pageSize?: number;
}) {
  const { user } = useAuth();
  const [status, setStatusState] = useState<ModerationQueueStatusFilter>(initialStatus);
  const [priority, setPriorityState] = useState<QueuePriorityFilter>('');
  const [onlyOverdue, setOnlyOverdueState] = useState(false);
  const [onlyMyEventSubmissions, setOnlyMyEventSubmissionsState] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNote, setActionNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimFocusKey, setClaimFocusKey] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [revision, setRevision] = useState(0);

  const scope = useRef(Symbol());
  const activeClaim = useRef<symbol | null>(null);
  const pendingSelectId = useRef<number | null>(null);
  const pendingFocusClaim = useRef(false);

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

    if (status === 'Open') {
      const fetchSize = Math.min(100, Math.max(50, pageSize * 5));
      const claimedQuery = buildModerationQueueQuery({
        itemType,
        status: 'Claimed',
        priority,
        onlyOverdue,
        onlyMyEventSubmissions,
        pageIndex: 1,
        pageSize: fetchSize,
      });
      const pendingQuery = buildModerationQueueQuery({
        itemType,
        status: 'Pending',
        priority,
        onlyOverdue,
        onlyMyEventSubmissions,
        pageIndex: 1,
        pageSize: fetchSize,
      });
      void Promise.all([
        staffService.queue(claimedQuery, controller.signal),
        staffService.queue(pendingQuery, controller.signal),
      ]).then(([claimedRes, pendingRes]) => {
        if (scope.current !== run) return;
        setLoading(false);
        if (!claimedRes.success || !claimedRes.data || !pendingRes.success || !pendingRes.data) {
          pendingSelectId.current = null;
          pendingFocusClaim.current = false;
          const failed = !claimedRes.success ? claimedRes : pendingRes;
          setError(failed.message || 'Không tải được danh sách hồ sơ.');
          return;
        }
        const merged = mergeOpenQueueItems(claimedRes.data.items, pendingRes.data.items, user?.id);
        const combinedCount = claimedRes.data.totalCount + pendingRes.data.totalCount;
        const computedTotalPages = Math.max(1, Math.ceil(merged.length / pageSize));
        const start = (pageIndex - 1) * pageSize;
        const pagedItems = merged.slice(start, start + pageSize);
        setItems(pagedItems);
        setHasNextPage(start + pageSize < merged.length);
        setTotalCount(combinedCount);
        setTotalPages(computedTotalPages);
        const selectAfterClaim = resolvePostClaimSelection(pagedItems, pendingSelectId.current);
        pendingSelectId.current = null;
        if (selectAfterClaim != null) {
          setSelectedId(selectAfterClaim);
          if (pendingFocusClaim.current) {
            pendingFocusClaim.current = false;
            setClaimFocusKey(k => k + 1);
          }
        } else {
          pendingFocusClaim.current = false;
        }
      });
    } else {
      const query = buildModerationQueueQuery({
        itemType,
        status,
        priority,
        onlyOverdue,
        onlyMyEventSubmissions,
        pageIndex,
        pageSize,
      });

      void staffService.queue(query, controller.signal).then(r => {
        if (scope.current !== run) return;
        setLoading(false);
        if (!r.success || !r.data) {
          pendingSelectId.current = null;
          pendingFocusClaim.current = false;
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
        if (selectAfterClaim != null) {
          setSelectedId(selectAfterClaim);
          if (pendingFocusClaim.current) {
            pendingFocusClaim.current = false;
            setClaimFocusKey(k => k + 1);
          }
        } else {
          pendingFocusClaim.current = false;
        }
      });
    }

    return () => {
      scope.current = Symbol();
      activeClaim.current = null;
      controller.abort();
    };
  }, [itemType, status, priority, onlyOverdue, onlyMyEventSubmissions, pageIndex, pageSize, revision, user?.id]);

  const setStatus = useCallback((next: ModerationQueueStatusFilter) => {
    pendingSelectId.current = null;
    pendingFocusClaim.current = false;
    setActionNote(null);
    setSelectedId(null);
    setPageIndex(1);
    if (next !== 'Open' && next !== 'Pending' && next !== 'Claimed') setOnlyOverdueState(false);
    setStatusState(next);
  }, []);

  const setPriority = useCallback((next: QueuePriorityFilter) => {
    pendingSelectId.current = null;
    pendingFocusClaim.current = false;
    setSelectedId(null);
    setPageIndex(1);
    setPriorityState(next);
  }, []);

  const setOnlyOverdue = useCallback((next: boolean) => {
    pendingSelectId.current = null;
    pendingFocusClaim.current = false;
    setSelectedId(null);
    setPageIndex(1);
    setOnlyOverdueState(next);
  }, []);

  const setOnlyMyEventSubmissions = useCallback((next: boolean) => {
    pendingSelectId.current = null;
    pendingFocusClaim.current = false;
    setSelectedId(null);
    setPageIndex(1);
    setOnlyMyEventSubmissionsState(next);
  }, []);

  const reload = useCallback(() => {
    pendingSelectId.current = null;
    pendingFocusClaim.current = false;
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
        if (r.status === 403 || r.status === 409) setRevision(n => n + 1);
        return false;
      }
      pendingSelectId.current = itemId;
      pendingFocusClaim.current = true;
      setActionNote({ ok: true, text: 'Đã nhận xử lý hồ sơ.' });
      setPriorityState('');
      setOnlyOverdueState(false);
      setPageIndex(1);
      setSelectedId(null);
      if (status === 'Open' || status === 'Claimed') setRevision(n => n + 1);
      else setStatusState('Claimed');
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('moderation-queue-changed'));
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
    onlyMyEventSubmissions,
    setOnlyMyEventSubmissions,
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
    claimFocusKey,
    hasNextPage,
    totalCount,
    totalPages,
    reload,
    claimItem,
  };
}
