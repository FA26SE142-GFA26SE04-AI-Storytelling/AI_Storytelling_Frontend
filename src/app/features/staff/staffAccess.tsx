"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { accessControlService } from "@/app/services/accessControlService";
import type { PermissionAccessDto } from "@/app/types/accessControl";

/**
 * `Hidden`: role không có quyền (ẩn nút). `Blocked`: có quyền nhưng lúc này không ghi được (khoá nút, nêu lý do).
 * `Limited`: dùng được trên một số mục (nêu lý do). Luật do backend tính; API vẫn tự kiểm quyền.
 */
export type AccessState = "Allowed" | "Limited" | "Blocked" | "Hidden";
export type Access = { state: AccessState; reason: string | null };
/** null: chưa tải được (hoặc backend cũ) → coi như được phép, để API tự chặn. */
export type AccessMap = ReadonlyMap<string, Access> | null;

const ALLOWED: Access = { state: "Allowed", reason: null };
const HIDDEN: Access = { state: "Hidden", reason: null };

export function toAccessMap(list: PermissionAccessDto[]): ReadonlyMap<string, Access> {
  return new Map(list.map((x) => [x.code, { state: x.state === "Blocked" || x.state === "Limited" ? x.state : "Allowed", reason: x.reason ?? null }]));
}

export const accessOf = (map: AccessMap, code: string): Access => (map ? map.get(code) ?? HIDDEN : ALLOWED);

const StaffAccessContext = createContext<AccessMap>(null);
export const StaffAccessProvider = StaffAccessContext.Provider;

/** Tra quyền theo mã, dùng khi một màn cần nhiều quyền. */
export function useAccessLookup(): (code: string) => Access {
  const map = useContext(StaffAccessContext);
  return useCallback((code: string) => accessOf(map, code), [map]);
}

export const useAccess = (code: string): Access => accessOf(useContext(StaffAccessContext), code);

/** Quyền của tài khoản đang đăng nhập; tải lại khi đổi trang hoặc quay lại cửa sổ. */
export function useMyAccess(userId: number | null, refreshKey: unknown): AccessMap {
  const [map, setMap] = useState<AccessMap>(null);
  useEffect(() => {
    if (userId === null) return;
    let alive = true;
    let issued = 0;
    let applied = 0;
    const load = () => {
      const id = ++issued;
      accessControlService.mine().then(
        (r) => {
          // Bỏ phản hồi đến muộn của lần tải cũ để không đè kết quả mới hơn.
          if (!alive || id < applied || !r.success || !r.data) return;
          applied = id;
          setMap(toAccessMap(r.data));
        },
        () => { /* Lỗi mạng: giữ danh sách đang có, API vẫn tự kiểm quyền. */ },
      );
    };
    load();
    window.addEventListener("focus", load);
    return () => { alive = false; window.removeEventListener("focus", load); };
  }, [userId, refreshKey]);
  return map;
}

/** Nêu lý do khi quyền đang bị khoá hoặc giới hạn. */
export function AccessNotice({ access }: { access: Access }) {
  if (!access.reason || (access.state !== "Blocked" && access.state !== "Limited")) return null;
  return (
    <p className="notice warn" role="status" data-inline-notice>
      {access.state === "Blocked" ? `Bạn đang ở chế độ chỉ xem. ${access.reason}` : access.reason}
    </p>
  );
}
