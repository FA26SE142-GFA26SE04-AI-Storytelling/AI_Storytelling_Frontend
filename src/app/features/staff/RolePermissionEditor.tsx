"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Save, Undo2 } from "lucide-react";
import Select from "@/app/components/Select";
import { confirmDialog } from "@/app/lib/confirm";
import { accessControlService as api } from "@/app/services/accessControlService";
import type { PermissionDto, RoleDto, RolePermissionsDto } from "@/app/types/accessControl";
import { changedCodes, conditionsOf, editableCodes, scopeLabel, sectionPermissions } from "./permissionMatrix";
import PermissionHistory from "./PermissionHistory";
import { useAction } from "./ui";

type Props = {
  catalog: PermissionDto[];
  roles: RoleDto[];
  roleCode: string;
  data: RolePermissionsDto | undefined;
  onRoleChange: (code: string) => void;
  onSaved: (data: RolePermissionsDto) => void;
  /** Báo trang cha biết còn thay đổi chưa lưu để hỏi lại trước khi đổi tab. */
  onDirtyChange?: (dirty: boolean) => void;
};

/** Hỏi trước khi bỏ thay đổi quyền chưa lưu. */
export const confirmDiscard = (roleName: string) =>
  confirmDialog(`Bỏ thay đổi chưa lưu? Các quyền của ${roleName} bạn vừa đổi chưa được lưu và sẽ mất.`);

/** Chỉnh quyền một role: chỉ quyền role được bật/tắt, đánh dấu khác mặc định, về mặc định, lịch sử thay đổi. */
export default function RolePermissionEditor({ catalog, roles, roleCode, data, onRoleChange, onSaved, onDirtyChange }: Props) {
  const saved = useMemo(() => [...(data?.permissionCodes ?? [])].sort(), [data]);
  const [draft, setDraft] = useState<string[]>(saved);
  const [historyKey, setHistoryKey] = useState(0);
  useEffect(() => setDraft(saved), [saved]);
  const { note, busy, run } = useAction(() => setHistoryKey((k) => k + 1));

  const editable = useMemo(() => editableCodes(data), [data]);
  const sections = useMemo(() => sectionPermissions(catalog.filter((p) => editable.has(p.code))), [catalog, editable]);
  const names = useMemo(() => new Map(catalog.map((p) => [p.code, p.description])), [catalog]);
  const defaults = useMemo(() => new Set(data?.defaultCodes ?? saved), [data, saved]);
  const role = roles.find((r) => r.code === roleCode);
  const roleName = role?.name ?? roleCode;
  const diff = changedCodes(saved, draft);
  const dirty = diff.added.length + diff.removed.length > 0;
  const changes = diff.added.length + diff.removed.length;
  useEffect(() => {
    onDirtyChange?.(dirty);
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => { window.removeEventListener("beforeunload", warn); onDirtyChange?.(false); };
  }, [dirty, onDirtyChange]);
  const changeRole = async (code: string) => {
    if (code === roleCode || (dirty && !(await confirmDiscard(roleName)))) return;
    onRoleChange(code);
  };
  const atDefault = changedCodes([...defaults], draft);
  const isDefault = atDefault.added.length + atDefault.removed.length === 0;
  const toggle = (code: string, on: boolean) => setDraft((d) => (on ? [...d, code] : d.filter((c) => c !== code)).sort());
  const list = (codes: string[]) => codes.map((c) => `“${names.get(c) ?? c}”`).join(", ");

  const save = async () => {
    const parts = [diff.added.length ? `Bật: ${list(diff.added)}.` : "", diff.removed.length ? `Tắt: ${list(diff.removed)}.` : ""];
    const message = `Lưu thay đổi quyền cho ${roleName}? ${parts.filter(Boolean).join(" ")} Quyền mới có hiệu lực trong tối đa 60 giây.`;
    if (!(await confirmDialog(message))) return;
    await run(async () => {
      const r = await api.updateRolePermissions(roleCode, draft);
      if (r.success && r.data) onSaved(r.data);
      return r;
    }, `Đã cập nhật quyền của ${roleName}.`);
  };

  return (
    <>
      <div className="st-card perm-card">
        <div className="st-filters perm-tools">
          <Select ariaLabel="Chọn role" value={roleCode} disabled={busy || roles.length === 0} portal
            options={roles.map((r) => ({ value: r.code, label: r.name }))} onChange={(v) => void changeRole(v)} />
          <span className="grow" />
          {!isDefault && (
            <button className="btn btn-g" disabled={busy} onClick={() => setDraft([...defaults].sort())}>
              <RotateCcw className="ic" />Về mặc định
            </button>
          )}
        </div>
        {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
        <p className="sub">
          {roleName} có {draft.length}/{editable.size} quyền đang bật. {catalog.length - editable.size} quyền khác không dành cho role này nên không hiện ở đây.
        </p>
      </div>
      {sections.map(({ section, items }) => (
        <div className="st-card perm-card" key={section}>
          <h3>{section}</h3>
          <ul className="perm-list">
            {items.map((p) => {
              const on = draft.includes(p.code);
              const changed = on !== defaults.has(p.code);
              const conditions = conditionsOf(data, p.code);
              return (
                <li key={p.code} className={on ? "on" : ""}>
                  <label className="perm-row">
                    <input type="checkbox" checked={on} disabled={busy} onChange={(e) => toggle(p.code, e.target.checked)} />
                    <span className="perm-name">
                      <span>{p.description}</span>
                      <code>{p.code}</code>
                    </span>
                  </label>
                  <span className="perm-meta">
                    <span className="perm-scope">{scopeLabel(data?.scopes?.[p.code] ?? p.scope)}</span>
                    {conditions.map((c) => <span key={c.code} className="perm-cond" title={c.text}>{c.label}</span>)}
                    {changed && <span className="perm-changed" title={on ? "Mặc định đang tắt" : "Mặc định đang bật"}>Khác mặc định</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {role?.id !== undefined && <PermissionHistory key={`${role.id}-${historyKey}`} roleId={role.id} names={names} />}
      {/* Danh sách dài: nút Lưu phải luôn trong tầm mắt, nếu không người dùng tưởng bỏ tick là đã lưu. */}
      {dirty && (
        <div className="perm-savebar" role="region" aria-label="Thay đổi chưa lưu">
          <b role="status">{changes} thay đổi chưa lưu</b>
          <span className="grow" />
          <button className="btn btn-g" disabled={busy} onClick={() => setDraft(saved)}><Undo2 className="ic" />Hoàn tác</button>
          <button className="btn btn-p" disabled={busy} onClick={() => void save()}><Save className="ic" />Lưu thay đổi</button>
        </div>
      )}
    </>
  );
}
