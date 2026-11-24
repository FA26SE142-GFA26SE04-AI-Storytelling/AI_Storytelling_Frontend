"use client";

import { useEffect, useState } from "react";
import { adminCreatorService } from "@/app/services/adminCreatorService";
import { adminPaymentService } from "@/app/services/paymentService";
import { creatorAdminService } from "@/app/services/creatorAdminService";
import { staffService } from "@/app/services/staffService";

/** Số việc Admin đang phải xử lý; null là không tải được mục đó. */
export type AdminTodo = {
  pendingApplications: number | null;
  mismatchedPayments: number | null;
  openReconciliations: number | null;
  payoutsDue: number | null;
  pendingInvites: number | null;
};

const settle = <T,>(p: Promise<{ success: boolean; data: T | null }>, pick: (d: T) => number): Promise<number | null> =>
  p.then((r) => (r.success && r.data ? pick(r.data) : null), () => null);

async function fetchAdminTodo(): Promise<AdminTodo> {
  const [pendingApplications, mismatchedPayments, openReconciliations, payoutsDue, pendingInvites] = await Promise.all([
    settle(adminCreatorService.applications({ status: "Pending", pageSize: 1 }), (d) => d.totalCount),
    settle(adminPaymentService.transactions({ pageIndex: 1, pageSize: 1, status: "MismatchAmount" }), (d) => d.totalCount),
    settle(adminPaymentService.reconciliation("Open", 1), (d) => d.totalCount),
    settle(creatorAdminService.payoutsDue(), (d) => d.length),
    settle(staffService.staff(), (d) => d.filter((s) => s.status === "invited").length),
  ]);
  return { pendingApplications, mismatchedPayments, openReconciliations, payoutsDue, pendingInvites };
}

// Sidebar và trang Tổng quan cùng cần số liệu này khi mở trang: dùng chung một lượt gọi nếu hai bên hỏi gần nhau.
let shared: { at: number; promise: Promise<AdminTodo> } | null = null;
const SHARE_MS = 3000;

export function loadAdminTodo(now: number = Date.now()): Promise<AdminTodo> {
  if (!shared || now - shared.at > SHARE_MS) shared = { at: now, promise: fetchAdminTodo() };
  return shared.promise;
}

/** Chỉ dùng trong test: bỏ lượt gọi đang dùng chung. */
export function resetAdminTodoCache() {
  shared = null;
}

const sum = (...values: (number | null)[]) => values.reduce<number>((total, v) => total + (v ?? 0), 0);

/** Số đếm trên menu: gộp theo trang nơi Admin xử lý việc đó. */
export function adminNavBadges(todo: AdminTodo | null): Record<string, number> {
  if (!todo) return {};
  const badges: Record<string, number> = {
    creators: sum(todo.pendingApplications, todo.payoutsDue),
    payments: sum(todo.mismatchedPayments, todo.openReconciliations),
    staff: sum(todo.pendingInvites),
  };
  return Object.fromEntries(Object.entries(badges).filter(([, n]) => n > 0));
}

/** Tải lại khi đổi trang hoặc quay lại tab trình duyệt, để số đếm theo kịp thao tác vừa làm. */
export function useAdminTodo(enabled: boolean, refreshKey: unknown): AdminTodo | null {
  const [todo, setTodo] = useState<AdminTodo | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = () => { void loadAdminTodo().then((t) => { if (alive) setTodo(t); }); };
    load();
    window.addEventListener("focus", load);
    return () => {
      alive = false;
      window.removeEventListener("focus", load);
    };
  }, [enabled, refreshKey]);
  return todo;
}
