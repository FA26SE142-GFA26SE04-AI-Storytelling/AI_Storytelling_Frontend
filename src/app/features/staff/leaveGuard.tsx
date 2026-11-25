"use client";

import { createContext, useContext, useEffect } from "react";

/** Trả false để ở lại trang (người dùng chọn giữ thay đổi chưa lưu). */
export type LeaveGuard = () => Promise<boolean> | boolean;

const LeaveGuardContext = createContext<(guard: LeaveGuard | null) => void>(() => {});
export const LeaveGuardProvider = LeaveGuardContext.Provider;

/** Đăng ký câu hỏi trước khi điều hướng sang trang nhân viên khác. `guard` cần giữ nguyên tham chiếu (useCallback). */
export function useLeaveGuard(guard: LeaveGuard) {
  const register = useContext(LeaveGuardContext);
  useEffect(() => {
    register(guard);
    return () => register(null);
  }, [register, guard]);
}
