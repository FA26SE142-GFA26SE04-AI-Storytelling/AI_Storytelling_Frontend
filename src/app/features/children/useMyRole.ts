"use client";

import { useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import type { ChildProfile } from "@/app/types/childProfile";
import type { Permission } from "@/app/types/supervision";

export type MyRole = { isOwner: boolean; can: (p: Permission) => boolean };

/** Backend chỉ còn một người quản lý cho mỗi bé (OwnerUserId): chủ hồ sơ làm được mọi việc, người khác không làm được gì. */
function roleFor(child: ChildProfile, meId: number): MyRole {
  const isOwner = child.ownerUserId === meId;
  return { isOwner, can: () => isOwner };
}

/** Vai trò của người dùng với một bé. */
export function useMyRole(child: ChildProfile | null): MyRole | null {
  const meId = useAuth().user?.id ?? -1;
  return useMemo(() => (child ? roleFor(child, meId) : null), [child, meId]);
}
