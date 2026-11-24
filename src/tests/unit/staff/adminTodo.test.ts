import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  applications: vi.fn(),
  transactions: vi.fn(),
  reconciliation: vi.fn(),
  payoutsDue: vi.fn(),
  staff: vi.fn(),
}));

vi.mock('@/app/services/adminCreatorService', () => ({ adminCreatorService: { applications: api.applications } }));
vi.mock('@/app/services/paymentService', () => ({ adminPaymentService: { transactions: api.transactions, reconciliation: api.reconciliation } }));
vi.mock('@/app/services/creatorAdminService', () => ({ creatorAdminService: { payoutsDue: api.payoutsDue } }));
vi.mock('@/app/services/staffService', () => ({ staffService: { staff: api.staff } }));

import { adminNavBadges, loadAdminTodo, resetAdminTodoCache } from '@/app/features/staff/adminTodo';

const ok = <T,>(data: T) => Promise.resolve({ success: true, message: '', data });
const fail = () => Promise.resolve({ success: false, message: 'Lỗi', data: null });
const paged = (totalCount: number) => ok({ items: [], pageIndex: 1, pageSize: 1, totalCount, totalPages: 1, hasPreviousPage: false, hasNextPage: false });

describe('adminTodo', () => {
  beforeEach(() => {
    resetAdminTodoCache();
    vi.clearAllMocks();
    api.applications.mockImplementation(() => paged(4));
    api.transactions.mockImplementation(() => paged(2));
    api.reconciliation.mockImplementation(() => paged(5));
    api.payoutsDue.mockImplementation(() => ok([{ creatorUserId: 1 }, { creatorUserId: 2 }, { creatorUserId: 3 }]));
    api.staff.mockImplementation(() => ok([{ status: 'invited' }, { status: 'active' }, { status: 'deactivated' }]));
  });

  it('counts pending work from the existing admin endpoints', async () => {
    await expect(loadAdminTodo()).resolves.toEqual({
      pendingApplications: 4, mismatchedPayments: 2, openReconciliations: 5, payoutsDue: 3, pendingInvites: 1,
    });
    expect(api.applications).toHaveBeenCalledWith({ status: 'Pending', pageSize: 1 });
    expect(api.transactions).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 1, status: 'MismatchAmount' });
    expect(api.reconciliation).toHaveBeenCalledWith('Open', 1);
  });

  it('marks only the failed item as unknown', async () => {
    api.payoutsDue.mockImplementation(fail);
    api.staff.mockImplementation(() => Promise.reject(new Error('network')));
    const todo = await loadAdminTodo();
    expect(todo.payoutsDue).toBeNull();
    expect(todo.pendingInvites).toBeNull();
    expect(todo.pendingApplications).toBe(4);
  });

  it('shares one round of calls between sidebar and overview', async () => {
    await Promise.all([loadAdminTodo(1000), loadAdminTodo(2000)]);
    expect(api.applications).toHaveBeenCalledTimes(1);
    await loadAdminTodo(10_000);
    expect(api.applications).toHaveBeenCalledTimes(2);
  });

  it('groups badges by the page that handles the work and hides zero counts', () => {
    expect(adminNavBadges({ pendingApplications: 4, mismatchedPayments: 2, openReconciliations: null, payoutsDue: 3, pendingInvites: 0 }))
      .toEqual({ creators: 7, payments: 2 });
    expect(adminNavBadges(null)).toEqual({});
  });
});
