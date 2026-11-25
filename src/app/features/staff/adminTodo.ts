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

/** Quyền cần cho từng số đếm; thiếu quyền thì không gọi API đó. */
export const TODO_PERMISSION: Record<keyof AdminTodo, string> = {
  pendingApplications: "creator.application.review",
  mismatchedPayments: "payment.manage",
  openReconciliations: "payment.manage",
  payoutsDue: "creator.payout.manage",
  pendingInvites: "staff.account.manage",
};

export type Can = (permission: string) => boolean;
const ANY: Can = () => true;

async function fetchAdminTodo(can: Can): Promise<AdminTodo> {
  const when = (key: keyof AdminTodo, load: () => Promise<number | null>) => (can(TODO_PERMISSION[key]) ? load() : Promise.resolve(null));
  const [pendingApplications, mismatchedPayments, openReconciliations, payoutsDue, pendingInvites] = await Promise.all([
    when("pendingApplications", () => settle(adminCreatorService.applications({ status: "Pending", pageSize: 1 }), (d) => d.totalCount)),
    when("mismatchedPayments", () => settle(adminPaymentService.transactions({ pageIndex: 1, pageSize: 1, status: "MismatchAmount" }), (d) => d.totalCount)),
    when("openReconciliations", () => settle(adminPaymentService.reconciliation("Open", 1), (d) => d.totalCount)),
    when("payoutsDue", () => settle(creatorAdminService.payoutsDue(), (d) => d.length)),
    when("pendingInvites", () => settle(staffService.staff(), (d) => d.filter((s) => s.status === "invited").length)),
  ]);
  return { pendingApplications, mismatchedPayments, openReconciliations, payoutsDue, pendingInvites };
}

// Sidebar và trang Tổng quan cùng cần số liệu này khi mở trang: dùng chung một lượt gọi nếu hai bên hỏi gần nhau.
let shared: { at: number; key: string; promise: Promise<AdminTodo> } | null = null;
const SHARE_MS = 3000;

export function loadAdminTodo(now: number = Date.now(), can: Can = ANY): Promise<AdminTodo> {
  const key = todoKey(can);
  if (!shared || shared.key !== key || now - shared.at > SHARE_MS) shared = { at: now, key, promise: fetchAdminTodo(can) };
  return shared.promise;
}

/** Tập quyền ảnh hưởng tới số đếm: đổi quyền thì không dùng lại lượt gọi cũ. */
const todoKey = (can: Can) => Object.values(TODO_PERMISSION).map((code) => (can(code) ? "1" : "0")).join("");

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
export function useAdminTodo(enabled: boolean, refreshKey: unknown, can: Can = ANY): AdminTodo | null {
  const [todo, setTodo] = useState<AdminTodo | null>(null);
  const key = todoKey(can);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const allowed = new Set(Object.values(TODO_PERMISSION).filter((_, i) => key[i] === "1"));
    const load = () => { void loadAdminTodo(Date.now(), (code) => allowed.has(code)).then((t) => { if (alive) setTodo(t); }); };
    load();
    window.addEventListener("focus", load);
    return () => {
      alive = false;
      window.removeEventListener("focus", load);
    };
  }, [enabled, refreshKey, key]);
  return todo;
}
