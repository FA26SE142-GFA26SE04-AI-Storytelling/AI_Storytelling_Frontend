"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { supervisionService } from "@/app/services/supervisionService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { Permission } from "@/app/types/supervision";

export type MyRole = { isOwner: boolean; perms: string[]; can: (p: Permission) => boolean };

/** Đọc vai trò và quyền của người dùng với một bé ngay lúc gọi, không cache (permission LIVE). */
export async function loadMyRole(child: ChildProfile, meId: number): Promise<MyRole> {
  const r = await supervisionService.listSupervisors(child.id);
  const mine = r.data?.find((x) => x.supervisorUserId === meId);
  const isOwner = mine ? mine.supervisorRole === "Owner" : child.ownerUserId === meId;
  const perms = mine && !isOwner ? (await supervisionService.listPermissions(mine.id)).data ?? [] : [];
  return { isOwner, perms, can: (p) => isOwner || perms.includes(p) };
}

/** Vai trò và quyền của người dùng với một bé — kiểm tra lại mỗi lần đổi bé (permission LIVE). */
export function useMyRole(child: ChildProfile | null): MyRole | null {
  const { user } = useAuth();
  const [role, setRole] = useState<MyRole | null>(null);
  const meId = user?.id ?? -1;

  useEffect(() => {
    if (!child) { setRole(null); return; }
    let alive = true;
    setRole(null);
    void loadMyRole(child, meId).then((r) => { if (alive) setRole(r); });
    return () => { alive = false; };
  }, [child, meId]);

  return role;
}
