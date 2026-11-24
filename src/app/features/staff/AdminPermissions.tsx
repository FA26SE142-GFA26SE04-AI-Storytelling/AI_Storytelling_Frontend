"use client";

import { useCallback, useEffect, useState } from "react";
import "@/app/styles/features/staff/permissions.css";
import { accessControlService as api } from "@/app/services/accessControlService";
import type { PermissionDto, RoleDto, RolePermissionsDto } from "@/app/types/accessControl";
import PermissionMatrixView from "./PermissionMatrixView";
import RolePermissionEditor from "./RolePermissionEditor";
import { Notice, Page, type Note } from "./ui";

type Tab = "matrix" | "edit";

/** Phân quyền: ma trận mọi role người lớn và trang chỉnh quyền từng role (chỉ thu hoặc trả lại quyền mặc định). */
export default function AdminPermissions() {
  const [catalog, setCatalog] = useState<PermissionDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [byRole, setByRole] = useState<Record<string, RolePermissionsDto>>({});
  const [tab, setTab] = useState<Tab>("matrix");
  const [roleCode, setRoleCode] = useState("Moderator");
  const [note, setNote] = useState<Note>(null);

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([api.permissions(), api.roles()]);
    if (!p.success || !p.data) return setNote({ ok: false, text: p.message });
    if (!r.success || !r.data) return setNote({ ok: false, text: r.message });
    const all = await Promise.all(r.data.map((role) => api.rolePermissions(role.code)));
    const failed = all.find((x) => !x.success || !x.data);
    if (failed) return setNote({ ok: false, text: failed.message });
    setCatalog(p.data);
    setRoles(r.data);
    setByRole(Object.fromEntries(all.map((x) => [x.data!.roleCode, x.data!])));
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openRole = (code: string) => { setRoleCode(code); setTab("edit"); };
  const saved = (data: RolePermissionsDto) => setByRole((prev) => ({ ...prev, [data.roleCode]: data }));

  return (
    <Page title="Phân quyền">
      <Notice note={note} />
      <div className="st-card perm-card">
        <div className="perm-head">
          <div className="seg" role="tablist" aria-label="Chế độ xem phân quyền">
            <button type="button" role="tab" aria-selected={tab === "matrix"} className={tab === "matrix" ? "on" : ""} onClick={() => setTab("matrix")}>Ma trận</button>
            <button type="button" role="tab" aria-selected={tab === "edit"} className={tab === "edit" ? "on" : ""} onClick={() => setTab("edit")}>Chỉnh role</button>
          </div>
        </div>
        <p className="sub">
          Mỗi role người lớn có một bộ quyền mặc định. Quản trị viên có thể tắt bớt rồi bật lại các quyền đó, nhưng chưa cấp
          được quyền ngoài mặc định. Hệ thống kiểm quyền ở cả API và bước xử lý, nên quyền bị tắt có hiệu lực ngay
          (tối đa 60 giây). Phạm vi và điều kiện của từng quyền do hệ thống quy định. Phiên của trẻ không dùng phân quyền.
        </p>
      </div>
      {catalog.length === 0 ? null : tab === "matrix" ? (
        <PermissionMatrixView catalog={catalog} roles={roles} byRole={byRole} onOpenRole={openRole} />
      ) : (
        <RolePermissionEditor catalog={catalog} roles={roles} roleCode={roleCode} data={byRole[roleCode]}
          onRoleChange={setRoleCode} onSaved={saved} />
      )}
    </Page>
  );
}
