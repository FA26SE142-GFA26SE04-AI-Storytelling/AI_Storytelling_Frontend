"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { supervisionService } from "@/app/services/supervisionService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { Permission } from "@/app/types/supervision";

export type MyRole = { isOwner: boolean; perms: string[]; can: (p: Permission) => boolean };

/** Vai trò và quyền của người dùng với một bé — kiểm tra lại mỗi lần đổi bé (permission LIVE). */
export function useMyRole(child: ChildProfile | null): MyRole | null {
  const { user } = useAuth();
  const [role, setRole] = useState<MyRole | null>(null);
  const meId = user?.id ?? -1;

  useEffect(() => {
    if (!child) { setRole(null); return; }
    let alive = true;
    setRole(null);
    void supervisionService.listSupervisors(child.id).then(async (r) => {
      const mine = r.data?.find((x) => x.supervisorUserId === meId);
      const isOwner = mine ? mine.supervisorRole === "Owner" : child.ownerUserId === meId;
      const perms = mine && !isOwner ? (await supervisionService.listPermissions(mine.id)).data ?? [] : [];
      if (alive) setRole({ isOwner, perms, can: (p) => isOwner || perms.includes(p) });
    });
    return () => { alive = false; };
  }, [child, meId]);

  return role;
}
