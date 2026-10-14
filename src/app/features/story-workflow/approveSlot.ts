"use client";

import { createContext, useContext, useEffect, useRef } from "react";

/** Hành động chính của bước (viết dàn ý, duyệt dàn ý, duyệt truyện) mà màn đang hiển thị đăng ký lên thanh tiến trình của Studio: mọi nút nằm một chỗ. */
export interface ApproveAction {
  label: string;
  /** Biểu tượng trên nút: dấu ✓ để duyệt (mặc định), ✨ để bắt đầu viết. */
  icon?: "check" | "sparkles";
  disabled: boolean;
  /** Vì sao chưa duyệt được (hiện ở tooltip); null khi duyệt được. */
  reason: string | null;
  run: () => void;
}

type Register = (action: ApproveAction | null) => void;

/** Có provider = nút duyệt nằm trên thanh tiến trình; không có (màn "Duyệt nội dung") = nút duyệt nằm ngay trong màn. */
export const ApproveSlot = createContext<Register | null>(null);

/**
 * Đăng ký hành động duyệt lên thanh tiến trình; trả về true khi thanh sẽ hiện nút (màn không cần tự vẽ nút nữa).
 * Chỉ đăng ký lại khi các giá trị thật sự đổi (không phụ thuộc `run`), nên không gây render lặp.
 */
export function useRegisterApprove(action: ApproveAction | null): boolean {
  const register = useContext(ApproveSlot);
  const runRef = useRef<(() => void) | undefined>(action?.run);
  useEffect(() => { runRef.current = action?.run; });
  // null = màn này chưa có gì để duyệt: không đăng ký.
  const label = action?.label;
  const icon = action?.icon;
  const disabled = action?.disabled ?? true;
  const reason = action?.reason ?? null;
  useEffect(() => {
    if (!register || label === undefined) return;
    register({ label, icon, disabled, reason, run: () => runRef.current?.() });
    return () => register(null);
  }, [register, label, icon, disabled, reason]);
  return register !== null;
}
