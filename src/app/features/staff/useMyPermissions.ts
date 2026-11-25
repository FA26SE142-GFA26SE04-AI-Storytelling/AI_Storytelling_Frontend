"use client";

import { useEffect, useState } from "react";
import { accessControlService } from "@/app/services/accessControlService";

/** Quyền của tài khoản đang đăng nhập; tải lại khi quay lại cửa sổ. null: chưa có hoặc không tải được. */
export function useMyPermissions(userId: number | null): ReadonlySet<string> | null {
  const [granted, setGranted] = useState<ReadonlySet<string> | null>(null);
  useEffect(() => {
    if (userId === null) return;
    let alive = true;
    const load = () => {
      accessControlService.mine().then(
        (r) => { if (alive && r.success && r.data) setGranted(new Set(r.data)); },
        () => { /* Lỗi mạng: giữ danh sách đang có, API vẫn tự kiểm quyền. */ },
      );
    };
    load();
    window.addEventListener("focus", load);
    return () => { alive = false; window.removeEventListener("focus", load); };
  }, [userId]);
  return granted;
}
