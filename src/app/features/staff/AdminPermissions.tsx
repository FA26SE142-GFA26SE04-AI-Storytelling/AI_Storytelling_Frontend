"use client";
import { confirmDialog } from "@/app/lib/confirm";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import Select from "@/app/components/Select";
import { accessControlService as api } from "@/app/services/accessControlService";
import type { PermissionDto, RoleDto } from "@/app/types/accessControl";
import { changedCodes, groupPermissions, staffEditableCodes } from "./permissionMatrix";
import { Notice, Page, useAction } from "./ui";

/** Administrator bật/tắt quyền nhân viên (nhóm Kiểm duyệt, Quản trị) của Moderator và Administrator. */
export default function AdminPermissions() {
  const [catalog, setCatalog] = useState<PermissionDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [roleCode, setRoleCode] = useState("Moderator");
  const [saved, setSaved] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>([]);

  const loadRole = useCallback(async () => {
    const [p, r] = await Promise.all([api.permissions(), api.rolePermissions(roleCode)]);
    if (!p.success || !p.data) return p.message;
    if (!r.success || !r.data) return r.message;
    const editable = staffEditableCodes(r.data.permissionCodes, p.data);
    setCatalog(p.data);
    setSaved(editable);
    setDraft(editable);
    return null;
  }, [roleCode]);
  const { note, setNote, busy, run } = useAction(loadRole);

  useEffect(() => {
    void api.roles().then((r) => {
      if (r.success && r.data) setRoles(r.data.filter((role) => role.isStaff));
      else setNote({ ok: false, text: r.message });
    });
  }, [setNote]);
  useEffect(() => { void loadRole().then((err) => { if (err) setNote({ ok: false, text: err }); }); }, [loadRole, setNote]);

  const groups = useMemo(() => groupPermissions(catalog.filter((p) => p.isStaffGrantable)), [catalog]);
  const diff = changedCodes(saved, draft);
  const dirty = diff.added.length + diff.removed.length > 0;
  const roleName = roles.find((r) => r.code === roleCode)?.name ?? roleCode;
  const toggle = (code: string, on: boolean) => setDraft((d) => (on ? [...d, code] : d.filter((c) => c !== code)));

  const save = async () => {
    const parts = [diff.added.length ? `bật ${diff.added.length} quyền` : "", diff.removed.length ? `tắt ${diff.removed.length} quyền` : ""].filter(Boolean);
    if (!(await confirmDialog(`Lưu thay đổi cho ${roleName}: ${parts.join(", ")}? Quyền mới có hiệu lực trong tối đa 60 giây.`))) return;
    await run(() => api.updateRolePermissions(roleCode, draft), `Đã cập nhật quyền của ${roleName}.`);
  };

  return (
    <Page title="Phân quyền">
      <Notice note={note} />
      <div className="st-card perm-card">
        <div className="st-filters">
          <Select ariaLabel="Chọn role" value={roleCode} disabled={busy || roles.length === 0} portal
            options={roles.map((r) => ({ value: r.code, label: r.name }))} onChange={(v) => setRoleCode(v)} />
          <span className="grow" />
          {dirty && <button className="btn btn-g" disabled={busy} onClick={() => setDraft(saved)}><RotateCcw className="ic" />Hoàn tác</button>}
          {dirty && <button className="btn btn-p" disabled={busy} onClick={() => void save()}><Save className="ic" />Lưu thay đổi</button>}
        </div>
        <p className="sub">Chỉ chỉnh được quyền nhân viên. Quyền của phụ huynh và nhà sáng tạo giữ cố định. Mỗi bước duyệt nội dung cho trẻ phải còn ít nhất một role được duyệt.</p>
      </div>
      {groups.map((g) => (
        <div className="st-card perm-card" key={g.group}>
          <h3>{g.group}</h3>
          <table className="st-table stack-table">
            <thead><tr><th>Quyền</th><th>Mô tả</th><th>Bật</th></tr></thead>
            <tbody>
              {g.items.map((p) => (
                <tr key={p.code}>
                  <td data-label="Quyền"><code>{p.code}</code></td>
                  <td data-label="Mô tả">{p.description}</td>
                  <td data-label="Bật">
                    <input type="checkbox" aria-label={`Bật ${p.description}`} checked={draft.includes(p.code)} disabled={busy}
                      onChange={(e) => toggle(p.code, e.target.checked)} style={{ accentColor: "var(--primary)" }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </Page>
  );
}
