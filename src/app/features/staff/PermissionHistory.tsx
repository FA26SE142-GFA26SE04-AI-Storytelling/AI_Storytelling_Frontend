"use client";

import { useEffect, useState } from "react";
import { creatorAdminService } from "@/app/services/creatorAdminService";
import type { AdminAuditLog } from "@/app/types/creatorAdmin";
import { historyChange } from "./permissionMatrix";
import { fmt } from "./ui";

/** 10 lần sửa quyền gần nhất của một role, đọc từ audit log (RolePermissionsUpdated). Ẩn khi không tải được. */
export default function PermissionHistory({ roleId, names }: { roleId: number; names: Map<string, string> }) {
  const [rows, setRows] = useState<AdminAuditLog[] | null>(null);

  useEffect(() => {
    let alive = true;
    void creatorAdminService
      .auditLogs({ action: "RolePermissionsUpdated", entityType: "Role", entityId: roleId, pageIndex: 1, pageSize: 10 })
      .then((r) => { if (alive) setRows(r.success && r.data ? r.data.items : null); });
    return () => { alive = false; };
  }, [roleId]);

  if (rows === null) return null;
  const name = (code: string) => names.get(code) ?? code;

  return (
    <div className="st-card perm-card">
      <h3>Lịch sử thay đổi</h3>
      {rows.length === 0 ? (
        <p className="sub">Chưa có lần thay đổi quyền nào được ghi lại cho role này.</p>
      ) : (
        <ul className="perm-history">
          {rows.map((row) => {
            const { added, removed } = historyChange(row.beforeState, row.afterState);
            return (
              <li key={row.id}>
                <small>{fmt(row.occurredAt)} · {row.actorFullName || row.actorUsername || "Hệ thống"}</small>
                {added.length > 0 && <span className="perm-added">Bật: {added.map(name).join(", ")}</span>}
                {removed.length > 0 && <span className="perm-removed">Tắt: {removed.map(name).join(", ")}</span>}
                {added.length + removed.length === 0 && <span>Lưu lại, không đổi quyền</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
